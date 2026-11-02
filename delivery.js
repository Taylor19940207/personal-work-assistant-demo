/* Delivery model: work is authoritative; the map is a projection, never a source. */
(() => {
  "use strict";
  const e = escapeHTML;
  const uid = prefix => `${prefix}-${crypto.randomUUID()}`;
  const now = () => new Date().toISOString();
  const statusName = value => boardColumns.find(column => column.id === value)?.label || "待處理";
  const requestNames = { preparing: "準備中", waiting: "等待回覆", revise: "需要修改", accepted: "已確認", cancelled: "已結束要求" };
  const inboundNames = { preparing: "待提出要求", waiting: "等待資料", revise: "待對方補件", accepted: "資料已收齊", cancelled: "已結束要求" };
  const requestName = (request, state = request.state) => (request.direction === "inbound" ? inboundNames : requestNames)[state] || state;
  const phaseNames = { start: "開始工作", submit: "整項送確認", deliver: "完成交付" };
  const expanded = new Set();
  const visibleCounts = new Map();
  let boardParent = "";
  let lastProject = "";

  function normalize(data) {
    const firstMigration = !data.deliveryModelVersion;
    data.goal ||= { title: "", criteria: "", acceptedAt: "", result: "" };
    for (const task of data.tasks) {
      task.parentId ||= "";
      task.required = task.required !== false;
      task.owner ||= "";
      task.criteria ||= "";
      task.checklist ||= [];
      task.requests ||= [];
      task.reviewRounds ||= [];
      task.conditions ||= [];
      task.history ||= [];
      task.milestones ||= [];
      task.requests.forEach(request => { request.direction ||= "outbound"; });
      if (firstMigration) {
        task.legacyDependencies = [...(task.dependsOn || [])];
        if (task.review?.person || task.review?.request) task.reviewRounds.push({
          id: uid("review"), person: task.review.person || "未記錄", request: task.review.request || "舊版確認紀錄",
          expectedDate: task.review.expectedDate || "", sentAt: task.review.sentAt || "", reply: task.review.reply || "",
          state: task.status === "review" ? "waiting" : task.review.result ? "accepted" : "legacy", legacy: true
        });
      }
      if (task.parentId && !data.tasks.some(item => item.id === task.parentId)) {
        task.previousParentId = task.parentId;
        task.parentId = "";
      }
    }
    // Recover invalid imported hierarchies without deleting work.
    for (const task of data.tasks) {
      const visited = new Set([task.id]);
      let parentId = task.parentId;
      while (parentId) {
        if (visited.has(parentId)) { task.previousParentId = task.parentId; task.parentId = ""; break; }
        visited.add(parentId);
        parentId = data.tasks.find(item => item.id === parentId)?.parentId || "";
      }
    }
    for (const file of data.files) {
      file.workIds ||= file.linkedType === "task" && file.linkedId ? [file.linkedId] : [];
      file.versions ||= [{ id: `${file.id}-v1`, name: file.name, url: file.url || "", date: file.date, source: file.source, note: file.note || "" }];
    }
    data.deliveryModelVersion = 1;
  }
  Object.values(workspaceData).forEach(normalize);

  const children = (data, parentId = "") => data.tasks.filter(task => (task.parentId || "") === parentId);
  function descendants(data, id) {
    const result = [];
    const seen = new Set([id]);
    const queue = [...children(data, id)];
    while (queue.length) {
      const task = queue.shift();
      if (seen.has(task.id)) continue;
      seen.add(task.id); result.push(task); queue.push(...children(data, task.id));
    }
    return result;
  }
  function scope(data, task) { return task ? [task, ...descendants(data, task.id)] : data.tasks; }
  function summary(data, task = null) {
    const works = scope(data, task);
    const ids = new Set(works.map(item => item.id));
    const direct = children(data, task?.id || "").filter(item => item.required);
    const incomplete = direct.filter(item => item.status !== "done");
    const issues = data.issues.filter(issue => issue.status === "open" && (!task || ids.has(issue.taskId)));
    const requests = works.flatMap(item => item.requests || []);
    const waiting = requests.filter(item => item.state === "waiting");
    const revise = requests.filter(item => item.state === "revise");
    const active = works.filter(item => ["doing", "review"].includes(item.status));
    const overdue = works.filter(item => item.status !== "done" && getDueMeta(item.due, item.dueTime).state === "overdue");
    const changed = works.some(item => item.status === "done" && children(data, item.id).some(child => child.required && child.status !== "done"));
    return { works, direct, incomplete, issues, waiting, revise, active, overdue, changed };
  }
  function blockers(data, task, phase) {
    return (task.conditions || []).filter(condition => condition.phase === phase)
      .filter(condition => data.tasks.find(item => item.id === condition.workId)?.status !== "done");
  }
  function record(data, task, title, detail = "") {
    const entry = { id: uid("activity"), kind: "task", title, detail, date: localISODate(), at: now(), taskId: task?.id || "" };
    data.activity.unshift(entry);
    if (task) task.history.unshift({ ...entry, status: task.status });
  }
  function commit(message) {
    const saved = saveWorkspaceData(); refreshProjectDataSurface();
    if (saved && message) showToast(message);
  }
  function openWork(projectId, taskId) {
    openProjectRoom(projectId, "board", true, taskId);
  }
  const oldFocusRecord = focusProjectRecord;
  focusProjectRecord = function(recordId) {
    if (projectRoomContent.querySelector(".d-work-detail") && workspaceData[uiState.projectId]?.tasks.some(task => task.id === recordId)) {
      projectRoomContent.scrollTop = 0;
      projectRoom.scrollTop = 0;
      const title = projectRoomContent.querySelector(".d-work-heading h2");
      title?.setAttribute("tabindex", "-1"); title?.focus({ preventScroll: true });
      if (innerWidth < 720) window.scrollTo({ top: 0 });
      return;
    }
    return oldFocusRecord(recordId);
  };
  function badge(task) { return `<span class="d-status" data-status="${e(task.status)}">${statusName(task.status)}</span>`; }
  const workCurrent = task => task.status === "done" ? task.completionNote || "成果已確認完成" : task.detail || task.criteria || "尚未記錄現況";
  function action(label, name, id = "", extra = "") {
    return `<button type="button" class="d-action" data-delivery-action="${name}" data-work="${e(id)}" ${extra}>${label}</button>`;
  }
  function dateLabel(value) { return value && value !== "未排定" ? e(value) : "未排定"; }
  function signals(data, task) {
    const s = summary(data, task);
    return `<span class="d-signals">${s.issues.length ? `<span class="text-danger">${s.issues.length} 個問題</span>` : ""}${s.waiting.length ? `<span>等 ${s.waiting.length} 項回覆</span>` : ""}${s.revise.length ? `<span class="text-warning">${s.revise.length} 項待修改</span>` : ""}${s.changed ? `<span class="text-warning">子工作變動，需複核</span>` : ""}</span>`;
  }
  function workRow(project, task, depth = 0) {
    const data = workspaceData[project.id];
    const kids = children(data, task.id);
    const isOpen = expanded.has(task.id);
    return `<div class="d-tree-item" style="--depth:${Math.min(depth, 8)}">
      <div class="d-tree-row" data-work-row="${e(task.id)}">
        ${kids.length ? action(isOpen ? "−" : "+", "expand", task.id, `aria-label="${isOpen ? "收合" : "展開"} ${e(task.title)}" aria-expanded="${isOpen}"`) : `<span class="d-tree-dot" aria-hidden="true"></span>`}
        <button class="d-work-link" type="button" data-delivery-action="open" data-project="${e(project.id)}" data-work="${e(task.id)}"><strong>${e(task.title)}</strong><small>${e(task.owner || "未指定協作者")} · ${dateLabel(task.due)}${kids.length ? ` · ${kids.filter(item => item.status === "done").length}/${kids.length} 子成果` : ""}</small>${signals(data, task)}</button>
        ${badge(task)}
      </div>
      ${isOpen ? kids.map(item => workRow(project, item, depth + 1)).join("") : ""}
    </div>`;
  }

  const oldSnapshot = getProjectSnapshot;
  getProjectSnapshot = function(project) {
    const data = workspaceData[project.id]; normalize(data);
    const s = summary(data);
    const base = oldSnapshot(project);
    const done = s.direct.filter(task => task.status === "done").length;
    const progress = s.direct.length ? Math.round(done / s.direct.length * 100) : 0;
    let state = base.state;
    if (data.lifecycle === "active" && !data.tasks.length) state = "待建立成果";
    if (data.lifecycle === "active" && progress === 100) state = "成果就緒，待交付驗收";
    else if (data.lifecycle === "active" && state === "已完成") state = "待確認交付範圍";
    if (data.lifecycle === "completed" && (s.incomplete.length || s.changed)) state = "已交付，有後續變動";
    if (s.changed && data.lifecycle === "active") state = "成果有變動，需複核";
    return { ...base, progress, completed: done, state, blockedTasks: [], currentTask: s.active[0] || null };
  };
  getTaskBlockers = () => []; // Legacy prerequisites are retained as history, not inferred gates.

  getProjectNodes = function(project) {
    const data = workspaceData[project.id]; normalize(data);
    return data.tasks.map((task, index) => ({
      id: task.id.startsWith("task-") ? task.id.slice(5) : task.id, linkedTaskId: task.id,
      type: "task", semanticMain: !task.parentId, x: 400 + index * 220, yOffset: 0,
      label: task.title, date: normalizeDateValue(task.due), current: ["doing", "review"].includes(task.status),
      summary: workCurrent(task), action: workCurrent(task),
      decision: "請在工作內查看問題與決策", next: task.checklist.find(item => !item.done)?.title || "查看工作脈絡",
      evidence: data.files.filter(file => file.workIds?.includes(task.id)).map(file => file.name).join("、") || "尚未關聯資料"
    }));
  };
  const oldInspector = openInspector;
  openInspector = function(nodeId) {
    const found = getNode(nodeId);
    if (found?.node.linkedTaskId) return openWork(found.project.id, found.node.linkedTaskId);
    // Old links to decisions/issues still lead to their original project context.
    const project = topologyProjects.find(item => item.nodes.some(node => node.id === nodeId));
    if (project) return openProjectRoom(project.id, "records");
    return oldInspector(nodeId);
  };

  renderTopology = function() {
    const paths = [], nodes = [];
    const projectY = new Map();
    let cursor = 65, maxDepth = 1, projectX = 0;
    const columns = !expanded.size && workspace.clientWidth >= 1100 ? 2 : 1;
    let bandStart = 65, bandBottom = 65;
    const nodeWidth = 260, step = 350, row = 112;
    function connect(x1, y1, x2, y2, key) { paths.push(`<path data-motion-edge="${e(key)}" d="M${x1} ${y1} C${x1 + 48} ${y1},${x2 - 48} ${y2},${x2} ${y2}"/>`); }
    function layoutTask(project, task, depth) {
      maxDepth = Math.max(maxDepth, depth);
      const data = workspaceData[project.id];
      const kids = children(data, task.id);
      const x = projectX + 45 + depth * step;
      let y;
      const limit = visibleCounts.get(task.id) || 4;
      if (expanded.has(task.id) && kids.length) {
        const laid = kids.slice(0, limit).map(child => layoutTask(project, child, depth + 1));
        if (kids.length > limit) laid.push(moreNode(task.id, kids.length - limit, depth + 1, project.id));
        y = (laid[0].y + laid.at(-1).y) / 2;
        laid.forEach(child => connect(x + nodeWidth, y, child.x, child.y, `${project.id}/${task.id}/${child.key}`));
      } else { y = cursor + row / 2; cursor += row; }
      const s = summary(data, task);
      nodes.push(`<article data-motion-key="work/${e(task.id)}" class="d-map-node ${task.status === "doing" ? "is-active" : ""}" style="left:${x}px;top:${y - 43}px;--project-color:${project.color}" data-map-project="${e(project.id)}" data-has-issues="${Boolean(s.issues.length)}">
        <button type="button" class="d-map-open" data-delivery-action="open" data-project="${e(project.id)}" data-work="${e(task.id)}">${badge(task)}<strong>${e(task.title)}</strong><small>${dateLabel(task.due)}${s.issues.length ? ` · ${s.issues.length} 問題` : s.revise.length ? ` · ${s.revise.length} 項待修改／補件` : s.waiting.length ? ` · 等 ${s.waiting.length} 項資料／回覆` : ""}</small></button>
        ${kids.length ? action(`${expanded.has(task.id) ? "−" : "+"} ${kids.length}`, "expand", task.id, `aria-expanded="${expanded.has(task.id)}" aria-label="展開或收合 ${e(task.title)} 的子工作"`) : ""}
      </article>`);
      return { x, y, key: task.id };
    }
    function moreNode(id, count, depth, projectId) {
      const x = projectX + 45 + depth * step, y = cursor + row / 2; cursor += row;
      nodes.push(`<div data-motion-key="more/${e(id)}" class="d-map-more" style="left:${x}px;top:${y - 22}px">${action(`再顯示 ${Math.min(4, count)} 項 · 尚有 ${count} 項`, "more", id, `data-project="${e(projectId)}"`)}</div>`);
      return { x, y, key: `more/${id}` };
    }
    for (const [projectIndex, project] of getPortfolioProjects().entries()) {
      projectX = (projectIndex % columns) * 715;
      cursor = bandStart;
      const data = workspaceData[project.id]; normalize(data);
      const roots = children(data);
      const limit = visibleCounts.get(project.id) || 4;
      const laid = roots.slice(0, limit).map(task => layoutTask(project, task, 1));
      if (roots.length > limit) laid.push(moreNode(project.id, roots.length - limit, 1, project.id));
      if (!laid.length) { laid.push({ x: projectX + 395, y: cursor + row / 2 }); cursor += row; }
      const y = (laid[0].y + laid.at(-1).y) / 2;
      projectY.set(project.id, y);
      laid.forEach(child => connect(projectX + 305, y, child.x, child.y, `${project.id}/goal/${child.key || "empty"}`));
      const s = summary(data);
      nodes.push(`<article data-motion-key="goal/${e(project.id)}" class="d-map-goal" style="left:${projectX + 45}px;top:${y - 56}px;--project-color:${project.color}" data-map-project="${e(project.id)}" data-has-issues="${Boolean(s.issues.length)}">
        <button type="button" data-open-project="${e(project.id)}"><small>交付目標 · ${e(project.name)}</small><strong>${e(data.goal.title || project.name)}</strong><span>${e(getProjectSnapshot(project).state)} · ${s.direct.length - s.incomplete.length}/${s.direct.length} 主要成果</span><small>交付 ${dateLabel(data.deadlineDate)}${s.issues.length ? ` · ${s.issues.length} 問題` : ""}</small></button>
      </article>`);
      bandBottom = Math.max(bandBottom, cursor + 64);
      if (projectIndex % columns === columns - 1) bandStart = bandBottom;
    }
    cursor = bandBottom;
    topologyLayout = { width: columns === 2 ? 1430 : 45 + maxDepth * step + nodeWidth + 60, height: cursor, projectY };
    mapStage.style.width = `${topologyLayout.width}px`; mapStage.style.height = `${cursor}px`;
    mapStage.innerHTML = `<svg class="topology-svg d-tree-paths" viewBox="0 0 ${topologyLayout.width} ${cursor}" aria-hidden="true">${paths.join("")}</svg>${nodes.join("")}`;
    updatePortfolioSummary(); updateFocusClasses(); applyTransform();
  };
  const oldFocusClasses = updateFocusClasses;
  updateFocusClasses = function() {
    oldFocusClasses();
    mapStage.querySelectorAll("[data-map-project]").forEach(node => {
      node.classList.toggle("is-muted", Boolean(uiState.focusProjectId && uiState.focusProjectId !== node.dataset.mapProject) || uiState.mode === "issues" && node.dataset.hasIssues !== "true");
    });
  };
  const oldFocusProject = focusProject;
  focusProject = function(projectId) {
    oldFocusProject(projectId);
    if (!uiState.focusProjectId) return;
    const goal = mapStage.querySelector(`.d-map-goal[data-map-project="${CSS.escape(projectId)}"]`);
    if (goal) {
      uiState.x = mapViewport.clientWidth / 2 - (parseFloat(goal.style.left) + 320) * uiState.scale;
      applyTransform();
    }
  };
  const oldSetView = setView;
  setView = function(view, options) {
    if (uiState.surface !== "project") renderTopology();
    return oldSetView(view, options);
  };
  function portfolioList() {
    return `<div class="d-portfolio-list"><p class="d-help">以交付目標查看所有工作。展開子成果，或點選工作進入操作。</p>${getPortfolioProjects().map(project => {
      const data = workspaceData[project.id];
      return `<section class="d-portfolio-project" style="--project-color:${project.color}"><button type="button" class="d-project-link" data-open-project="${e(project.id)}"><small>${e(project.name)} · ${e(getProjectSnapshot(project).state)}</small><strong>${e(data.goal.title || project.name)}</strong><span>交付 ${dateLabel(data.deadlineDate)} ↗</span></button>${signals(data)}${children(data).map(task => workRow(project, task)).join("") || `<p class="d-help">尚未建立主要成果</p>`}</section>`;
    }).join("")}</div>`;
  }
  renderMobileOverview = function() { mobileOverview.innerHTML = portfolioList(); };
  renderList = function() {
    const projects = uiState.focusProjectId ? getPortfolioProjects().filter(project => project.id === uiState.focusProjectId) : getPortfolioProjects();
    listView.innerHTML = `<div class="event-tree">${projects.map(project => {
      const data = workspaceData[project.id];
      const items = uiState.mode === "issues" ? data.issues.filter(issue => issue.status === "open") : data.activity;
      return `<details class="tree-project" open><summary><strong>${e(project.name)}</strong><span>${e(getProjectSnapshot(project).state)}</span></summary><div class="tree-events">${items.map(item => {
        const issueId = item.id.startsWith("activity-") ? item.id.slice(9) : item.id;
        const linkedIssue = data.issues.find(issue => issue.id === issueId);
        const tab = linkedIssue ? "records" : item.taskId ? "board" : "activity";
        return `<button class="tree-event" type="button" data-open-project-tab="${tab}" data-project-id="${e(project.id)}" data-record-id="${e(linkedIssue?.id || item.taskId || item.id)}"><time>${e(item.date)}</time><strong>${e(item.title)}</strong><small>${linkedIssue ? "問題處理" : "查看紀錄"}</small></button>`;
      }).join("") || `<p class="d-help">${uiState.mode === "issues" ? "目前沒有未解問題" : "尚無紀錄"}</p>`}</div></details>`;
    }).join("")}</div>`;
  };
  const oldAttention = getAttentionItems;
  getAttentionItems = function() {
    const items = oldAttention();
    for (const project of getPortfolioProjects()) {
      for (const task of workspaceData[project.id].tasks) {
        for (const milestone of task.milestones || []) {
          if (milestone.actualDate) continue;
          const due = getDueMeta(milestone.committedDate || milestone.plannedDate);
          if (!["overdue", "today", "soon"].includes(due.state)) continue;
          items.push({ priority: due.state === "overdue" ? 0 : 1, dueAt: due.dueAt, projectId: project.id, tab: "board", recordId: task.id, milestoneId: milestone.id, kind: "關鍵日期", title: milestone.title, context: `${task.title} / ${due.display} / ${milestone.committedDate ? "已約定" : "預計"}` });
        }
        for (const request of task.requests || []) {
          if (["accepted", "cancelled"].includes(request.state)) continue;
          const due = getDueMeta(request.state === "waiting" ? request.expectedDate : request.due);
          if (request.state !== "revise" && !["overdue", "today", "soon"].includes(due.state)) continue;
          items.push({ priority: due.state === "overdue" ? 0 : 1, dueAt: due.dueAt, projectId: project.id, tab: "board", recordId: task.id, requestId: request.id, kind: requestName(request), title: request.title, context: `${task.title} / ${request.person} / ${due.display} / ${due.short}` });
        }
      }
    }
    return items.filter(item => workspaceData[item.projectId]?.lifecycle !== "archived").sort((a, b) => a.priority - b.priority || a.dueAt - b.dueAt);
  };

  function breadcrumb(data, task) {
    const chain = []; let parent = task;
    while (parent) { chain.unshift(parent); parent = data.tasks.find(item => item.id === parent.parentId); }
    return `<nav class="d-breadcrumb" aria-label="工作層級">${action("交付全貌", "root")}${chain.map(item => `<span>/</span>${action(e(item.title), "open", item.id)}`).join("")}</nav>`;
  }
  function overview(project, data) {
    const s = summary(data);
    const coordination = data.tasks.flatMap(task => task.requests.filter(request => !["accepted", "cancelled"].includes(request.state)).map(request => ({ task, request })));
    const dates = data.tasks.flatMap(task => task.milestones.filter(item => !item.actualDate).map(item => ({ task, item }))).sort((a, b) => (a.item.committedDate || a.item.plannedDate || "9999").localeCompare(b.item.committedDate || b.item.plannedDate || "9999"));
    return `<div class="project-surface d-overview">
      <section class="d-goal-summary"><div><p class="d-eyebrow">DELIVERY / 交付目標</p><h2>${e(data.goal.title || project.name)}</h2><p>${e(data.goal.criteria || "先寫清楚要交付什麼，以及什麼條件下才算完成。")}</p><div class="d-goal-meta"><span>預計交付 ${dateLabel(data.deadlineDate)}</span><span>${s.direct.length - s.incomplete.length} / ${s.direct.length} 個必要成果已完成</span>${data.goal.acceptedAt ? `<span>實際交付 ${dateLabel(data.goal.acceptedAt.slice(0, 10))}</span>` : ""}</div></div><div class="d-actions">${action("設定目標", "goal")}${action(data.lifecycle === "completed" ? "重新開啟專案" : "驗收交付", "accept-goal")}</div></section>
      <div class="d-overview-grid"><section><div class="d-section-title"><div><h3>主要成果</h3><p>小步驟留在工作內；只有可獨立交付的成果才拆成子工作。</p></div>${action("＋ 主要成果", "create")}</div>
      ${children(data).map(task => workRow(project, task)).join("") || `<div class="d-empty">還沒有主要成果。先建立這個目標需要完成的工作。</div>`}</section>
      <aside class="d-side"><section><h3>現在需要注意</h3>${signals(data)}<p>${s.active.length} 項工作正在推進 · ${s.overdue.length} 項工作逾期</p>${coordination.map(({ task, request }) => `<button type="button" class="d-context-link" data-delivery-action="open-request" data-work="${e(task.id)}" data-item="${e(request.id)}"><strong>${e(request.title)}</strong><span>${e(requestName(request))} · ${e(request.person)}<br>${e(task.title)} · ${request.direction === "inbound" ? "收件" : request.state === "waiting" ? "回覆" : "提供"} ${dateLabel(request.state === "waiting" ? request.expectedDate || request.due : request.due)}</span></button>`).join("")}${s.changed ? `<p class="text-warning">已完成的成果下有工作重新開啟，請複核影響。</p>` : ""}${action("查看問題", "issues")}</section><section><h3>接下來的關鍵日期</h3>${dates.map(({ task, item }) => `<button type="button" class="d-context-link" data-delivery-action="open-milestone" data-work="${e(task.id)}" data-item="${e(item.id)}"><strong>${e(item.title)}</strong><span>${dateLabel(item.committedDate || item.plannedDate)} · ${item.committedDate ? "已約定" : "預計"}<br>${e(task.owner || "未指定協作者")} · ${e(task.title)}</span></button>`).join("") || `<p>尚無待發生的關鍵日期。</p>`}</section><section><h3>最近推進</h3>${data.activity.slice(0, 4).map(item => `<p><small>${e(item.date)}</small><br>${e(item.title)}</p>`).join("") || `<p>尚無紀錄</p>`}</section></aside></div>
    </div>`;
  }
  function taskCard(task, data) {
    const kids = children(data, task.id);
    return `<article class="task-card d-board-card" draggable="true" data-task-id="${e(task.id)}" data-record-target="${e(task.id)}"><button class="d-work-link" type="button" data-delivery-action="open" data-work="${e(task.id)}"><h3>${e(task.title)}</h3><p>${e(workCurrent(task))}</p></button>${signals(data, task)}<small>${e(task.owner || "未指定協作者")} · ${dateLabel(task.due)}</small>${kids.length ? `<p>${kids.filter(item => item.status === "done").length}/${kids.length} 個子成果已完成</p>` : ""}<div class="d-card-footer">${action("進入工作 ↗", "open", task.id)}<select aria-label="${e(task.title)}的狀態" data-task-move="${e(task.id)}">${boardColumns.map(column => `<option value="${column.id}" ${column.id === task.status ? "selected" : ""}>${column.label}</option>`).join("")}</select></div></article>`;
  }
  renderTaskCard = taskCard;
  renderProjectBoard = function(project, data) {
    const selected = data.tasks.find(task => task.id === uiState.focusRecordId);
    if (selected) return workDetail(project, data, selected);
    const parent = data.tasks.find(task => task.id === boardParent);
    if (!parent) boardParent = "";
    const works = children(data, boardParent);
    return `<div class="project-surface">${parent ? breadcrumb(data, parent) : ""}<div class="surface-heading"><div><h2>${parent ? `${e(parent.title)}的子工作` : "主要成果工作板"}</h2><p>同一層的成果一起管理；蒐集資料、修改與回覆都留在各自工作內。</p></div>${action("＋ 新增成果", "create", boardParent)}</div><div class="kanban-board d-board">${boardColumns.map(column => `<section class="kanban-column" data-drop-status="${column.id}" style="--column-color:${column.color}"><div class="column-heading"><strong>${column.label}</strong><span>${works.filter(task => task.status === column.id).length}</span></div><p class="d-column-hint">${{ queue: "已列入範圍，尚未開始", doing: "準備、製作、修正或協作中", review: "整項成果已送出，等待驗收", done: "完成標準已確認達成" }[column.id]}</p><div class="task-stack">${works.filter(task => task.status === column.id).map(task => taskCard(task, data)).join("")}</div></section>`).join("")}</div></div>`;
  };
  const oldRoom = renderProjectRoom;
  renderProjectOverview = overview;
  renderProjectRoom = function() {
    if (lastProject !== uiState.projectId) { boardParent = ""; lastProject = uiState.projectId; }
    const data = workspaceData[uiState.projectId];
    if (!data) return;
    normalize(data); oldRoom();
    const project = getProject(uiState.projectId);
    const summaryLine = projectRoomHeader.querySelector(".project-heading-copy > p:last-child");
    if (summaryLine) summaryLine.textContent = `交付目標：${data.goal.title || project.name} · 預計 ${data.deadlineDate || "未排定"}`;
    const count = projectRoomHeader.querySelector(".project-status-line strong");
    if (count) { const s = summary(data); count.textContent = `${s.direct.length - s.incomplete.length}/${s.direct.length} 成果`; }
    if (uiState.projectTab === "overview") projectRoomContent.innerHTML = overview(project, data);
    const tab = projectTabs.querySelector('[data-project-tab="overview"]');
    if (tab) tab.textContent = "交付全貌";
  };
  const oldSetProjectTab = setProjectTab;
  setProjectTab = function(tab, updateRoute = true) {
    oldSetProjectTab(tab, updateRoute);
    if (tab === "board" && boardParent && updateRoute) {
      const params = new URLSearchParams(location.hash.slice(1));
      params.set("parent", boardParent);
      history.replaceState(history.state, "", `#${params}`);
    }
  };

  function workDetail(project, data, task) {
    const s = summary(data, task);
    const files = data.files.filter(file => file.workIds.includes(task.id) || file.linkedType === "task" && file.linkedId === task.id);
    const issues = data.issues.filter(issue => issue.taskId === task.id);
    const pendingReview = task.reviewRounds.findLast(round => round.state === "waiting");
    return `<article class="project-surface d-work-detail" data-record-target="${e(task.id)}">
      ${breadcrumb(data, task)}
      <header class="d-work-heading"><div>${badge(task)}<h2>${e(task.title)}</h2><p>${e(task.owner || "未指定協作者")} · 工作期限 ${dateLabel(task.due)}</p></div><div class="d-actions">${action("編輯工作", "edit", task.id)}<label class="d-state-control">工作狀態<select data-task-move="${e(task.id)}">${boardColumns.map(column => `<option value="${column.id}" ${task.status === column.id ? "selected" : ""}>${column.label}</option>`).join("")}</select></label></div></header>
      ${signals(data, task)}
      <nav class="d-work-nav" aria-label="工作內容跳轉">${[["現況", "progress"], ["協作", "request"], ["子成果", "child-board"], ["日期", "milestone"], ["問題", "issue"], ["資料", "evidence"]].map(([label, target]) => action(label, "jump", task.id, `data-item="${target}"`)).join("")}</nav>
      <div class="d-detail-grid"><div class="d-detail-main">
        <section class="d-section"><div class="d-section-title"><h3>${task.status === "done" ? "完成結果與標準" : "現況與完成標準"}</h3>${action("更新現況", "progress", task.id)}</div><p class="d-current">${e(workCurrent(task))}</p><p class="d-help">完成標準：${e(task.criteria || "尚未設定，可從編輯工作補充")}</p>${task.status === "done" && task.detail ? `<details><summary>完成前最後現況</summary><p>${e(task.detail)}</p></details>` : ""}</section>
        ${task.status === "review" ? `<section class="d-section d-review-panel"><h3>整項成果待確認</h3><p>${pendingReview ? `${e(pendingReview.person)} · ${e(pendingReview.request)}<br>預計回覆 ${dateLabel(pendingReview.expectedDate)}` : "舊版待確認工作，尚無完整確認紀錄。"}</p><div class="d-actions">${action("需修改，回到進行中", "return", task.id)}${action("確認成果已完成", "complete", task.id)}</div></section>` : ""}
        <section class="d-section"><div class="d-section-title"><div><h3>工作內的步驟</h3><p>蒐集、聯絡與修改可以記在這裡，不會新增拓撲分支。</p></div>${action("＋ 步驟", "step", task.id)}</div>${task.checklist.map(item => `<div class="d-step"><label><input type="checkbox" data-delivery-check="${e(item.id)}" data-work="${e(task.id)}" ${item.done ? "checked" : ""}><span>${e(item.title)}</span></label>${action("移除", "remove-step", task.id, `data-item="${e(item.id)}"`)}</div>`).join("") || `<p class="d-help">沒有需要另外追蹤的小步驟。</p>`}</section>
        <section class="d-section"><div class="d-section-title"><div><h3>資料要求與協作往返</h3><p>每個對象可以有自己的期限與確認輪次，不改變整項工作的狀態。</p></div>${action("＋ 資料要求", "request", task.id)}</div>${task.requests.map(request => requestCard(task, request, data)).join("") || `<p class="d-help">例如：會計師需要修訂後的財務資料，預計週五回覆。</p>`}</section>
        <section class="d-section"><div class="d-section-title"><div><h3>子成果</h3><p>只有需要獨立負責、期限或驗收的成果才拆分。</p></div><div class="d-actions">${action("子工作板", "child-board", task.id)}${action("＋ 子成果", "create", task.id)}</div></div>${children(data, task.id).map(child => workRow(project, child)).join("") || `<p class="d-help">目前是單一成果，無需額外拆分。</p>`}</section>
        <section class="d-section"><div class="d-section-title"><div><h3>關鍵日期</h3><p>提交、預約與交付時間分開追蹤，保留預計、約定及實際日期。</p></div>${action("＋ 日期", "milestone", task.id)}</div>${task.milestones.map(milestone => `<div class="d-milestone"><div><strong>${e(milestone.title)}</strong><p>預計 ${dateLabel(milestone.plannedDate)} · 約定 ${dateLabel(milestone.committedDate)}<br>實際 ${milestone.actualDate ? dateLabel(milestone.actualDate) : "尚未發生"}</p>${milestone.note ? `<p>${e(milestone.note)}</p>` : ""}</div>${action("更新", "milestone", task.id, `data-item="${e(milestone.id)}"`)}</div>`).join("") || `<p class="d-help">例如：老師向主管機關提交申請的日期。</p>`}</section>
        <section class="d-section"><div class="d-section-title"><h3>這項工作的歷程</h3>${action("新增紀錄", "note", task.id)}</div>${task.history.length ? task.history.map(item => `<div class="d-history"><time>${e((item.documentEventId ? item.date : item.at || item.date).slice(0, 10))}</time><div><strong>${e(item.title)}</strong><p>${e(item.detail)}</p></div></div>`).join("") : `<p class="d-help">新的變更會記在這裡；舊紀錄仍保留在專案的完整紀錄中。</p>`}
        ${task.reviewRounds.length ? `<details><summary>整項成果確認紀錄 · ${task.reviewRounds.length} 輪</summary>${task.reviewRounds.map(round => `<p>${e(round.person)} · ${dateLabel(round.sentAt?.slice(0, 10))}<br>${e(round.request)}<br>${e(round.reply || "尚無回覆")} · ${e(requestNames[round.state] || "舊版紀錄")}</p>`).join("")}</details>` : ""}</section>
      </div><aside class="d-side">
        <section><div class="d-section-title"><h3>問題與決策</h3>${action("記錄問題", "issue", task.id)}</div>${issues.map(issue => `<button type="button" class="d-context-link" data-open-project-tab="records" data-project-id="${e(project.id)}" data-record-id="${e(issue.id)}"><strong>${e(issue.title)}</strong><span>${issue.status === "open" ? "未解決" : "已解決"} · 查看處理與決策 ↗</span></button>`).join("") || `<p>目前沒有工作層級問題。</p>`}${s.issues.length > issues.filter(issue => issue.status === "open").length ? `<p class="text-warning">子成果另有未解問題，可展開查看。</p>` : ""}</section>
        <section><div class="d-section-title"><h3>資料與證明</h3>${action("關聯資料", "evidence", task.id)}</div>${files.map(file => `<div class="d-evidence"><strong>${e(file.name)}</strong><small>${file.versions.length} 個版本${file.workIds.length > 1 ? ` · ${file.workIds.length} 個工作共用` : ""}</small>${file.url ? `<a href="${e(safeURL(file.url))}" target="_blank" rel="noopener noreferrer">開啟來源 ↗</a>` : `<small>檔名索引，未儲存檔案內容</small>`}<div>${action("新增版本", "version", task.id, `data-item="${e(file.id)}"`)}${action("取消關聯", "unlink", task.id, `data-item="${e(file.id)}"`)}</div></div>`).join("") || `<p>將既有資料或來源連結關聯到這項工作。</p>`}</section>
        <section><div class="d-section-title"><h3>交付條件</h3>${action("設定條件", "condition", task.id)}</div><p>只用於另一項成果確實會限制某個階段時；日常準備不必設條件。</p>${task.conditions.map(condition => `<div class="d-condition"><p>${phaseNames[condition.phase]}前：${e(data.tasks.find(item => item.id === condition.workId)?.title || "來源工作已不存在")}已完成</p>${action("移除", "remove-condition", task.id, `data-item="${e(condition.id)}"`)}</div>`).join("")}${task.legacyDependencies?.length ? `<details><summary>舊版前置關係 · 僅供參考</summary><p>${task.legacyDependencies.map(id => e(data.tasks.find(item => item.id === id)?.title || id)).join("、")}</p><p>未自動轉成限制，可依實際交付條件重新設定。</p></details>` : ""}</section>
      </aside></div>
    </article>`;
  }
  function requestCard(task, request, data) {
    const rounds = request.rounds || [];
    const itemAttr = `data-item="${e(request.id)}"`;
    const inbound = request.direction === "inbound";
    const primary = inbound
      ? (request.state === "preparing" ? action("記錄已提出要求", "send", task.id, itemAttr) : "") + action(request.state === "revise" ? "記錄收到補件" : "記錄收到資料", "reply", task.id, itemAttr)
      : request.state === "waiting" ? action("記錄回覆", "reply", task.id, itemAttr) : action(["accepted", "cancelled"].includes(request.state) ? "新增一輪" : "記錄送出", "send", task.id, itemAttr);
    const cancel = ["accepted", "cancelled"].includes(request.state) ? "" : action("結束要求", "cancel-request", task.id, itemAttr);
    const history = rounds.map((round, index) => {
      const artifacts = (round.artifacts || []).map(ref => {
        const file = data.files.find(item => item.id === ref.fileId);
        const version = file?.versions.find(item => item.id === ref.versionId);
        const label = `${e(version?.name || ref.name || "保留的資料紀錄")} (${e(ref.versionLabel)})`;
        return version?.url && safeURL(version.url) ? `<a href="${e(safeURL(version.url))}" target="_blank" rel="noopener noreferrer">${label} ↗</a>` : label;
      }).join("、") || "未附資料";
      return `<div class="d-round"><strong>第 ${index + 1} 輪 · ${inbound ? round.receivedDate ? `收到 ${dateLabel(round.receivedDate)}` : `提出 ${dateLabel(round.sentDate)}` : `送出 ${dateLabel(round.sentDate)}`}</strong><p>${e(round.person || request.person)} · ${e(round.note || "")}</p><p>${artifacts}</p><small>${e(requestName(request, round.state))}${!inbound && round.repliedAt ? ` · ${dateLabel(round.replyDate || localISODate(new Date(round.repliedAt)))}` : ""}</small>${round.reply ? `<p>${e(round.reply)}</p>` : ""}</div>`;
    }).join("");
    return `<article class="d-request" data-request-id="${e(request.id)}"><div class="d-section-title"><div><small>${inbound ? "向對方取得" : "提供給對方"} · ${e(requestName(request))} · ${e(request.person)}</small><h4>${e(request.title)}</h4></div><div class="d-actions">${primary}</div></div>
      <p>${e(request.criteria || "")}</p><div class="d-request-dates"><span>${inbound ? "對方提供期限" : "我方提供期限"} ${dateLabel(request.due)}</span>${inbound ? "" : `<span>預計回覆 ${dateLabel(request.expectedDate)}</span>`}${action("調整", "edit-request", task.id, itemAttr)}${cancel}</div>
      ${request.reply ? `<p class="d-result">最新回覆：${e(request.reply)}</p>` : ""}${rounds.length ? `<details><summary>往返紀錄 · ${rounds.length} 輪</summary>${history}</details>` : ""}</article>`;
  }

  function safeURL(value) {
    try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
  }
  const oldEvidenceContext = evidenceContextLabel;
  evidenceContextLabel = function(data, file) {
    const names = (file.workIds || []).map(id => data.tasks.find(task => task.id === id)?.title).filter(Boolean);
    return names.length ? `共用工作：${names.join("、")}` : oldEvidenceContext(data, file);
  };
  const oldEvidenceItem = renderEvidenceItem;
  renderEvidenceItem = function(file, data) {
    const referenced = data.tasks.some(task => task.requests.some(request => request.rounds.some(round => round.artifacts?.some(ref => ref.fileId === file.id))));
    let markup = oldEvidenceItem(file, data);
    if (referenced) markup = markup.replace(/<button type="button" data-delete-evidence=[\s\S]*?<\/button>/, `<span class="d-help">歷次送出引用中，保留版本紀錄</span>`);
    markup = markup.replace('>編輯</button>', '>新增版本</button>');
    return markup;
  };
  const oldDeleteEvidence = deleteEvidence;
  deleteEvidence = function(evidenceId) {
    const data = workspaceData[uiState.projectId];
    if (data.tasks.some(task => task.requests.some(request => request.rounds.some(round => round.artifacts?.some(ref => ref.fileId === evidenceId))))) return showToast("這份資料仍被送出紀錄引用，可取消工作關聯，版本紀錄會保留");
    return oldDeleteEvidence(evidenceId);
  };
  const dialog = document.createElement("dialog");
  dialog.className = "d-dialog"; dialog.setAttribute("aria-labelledby", "d-dialog-title");
  document.body.append(dialog);
  let submitDialog = null;
  let returnFocus = null;
  let submitting = false;
  function field(label, name, value = "", type = "text", required = false) {
    const attrs = `name="${name}" id="d-${name}" ${required ? "required" : ""}`;
    return `<label for="d-${name}">${label}${type === "textarea" ? `<textarea ${attrs} rows="3">${e(value)}</textarea>` : `<input ${attrs} type="${type}" value="${e(value)}">`}</label>`;
  }
  function select(label, name, options, value = "") {
    return `<label for="d-${name}">${label}<select id="d-${name}" name="${name}">${options.map(([id, text]) => `<option value="${e(id)}" ${id === value ? "selected" : ""}>${e(text)}</option>`).join("")}</select></label>`;
  }
  function form(title, intro, content, submit, handler) {
    returnFocus = document.activeElement;
    dialog.innerHTML = `<form><header><div><small>WORK / DELIVERY</small><h2 id="d-dialog-title">${title}</h2></div><button type="button" data-dialog-close aria-label="關閉">×</button></header><p class="d-help">${intro}</p><div class="d-form-fields">${content}</div><p class="d-form-error" role="alert"></p><footer><button type="button" data-dialog-close>取消</button><button type="submit" class="primary-action">${submit}</button></footer></form>`;
    submitDialog = handler;
    dialog.showModal();
    dialog.querySelector("input,textarea,select")?.focus();
  }
  dialog.addEventListener("click", event => { if (!submitting && event.target.closest("[data-dialog-close]")) dialog.close(); });
  dialog.addEventListener("cancel", event => { if (submitting) event.preventDefault(); });
  dialog.addEventListener("close", () => { if (returnFocus?.isConnected) returnFocus.focus(); });
  dialog.addEventListener("submit", event => {
    event.preventDefault(); if (submitting) return;
    const values = new FormData(event.target);
    const settle = () => { submitting = false; dialog.querySelectorAll("button").forEach(button => { button.disabled = false; }); };
    const failure = error => { settle(); dialog.querySelector(".d-form-error").textContent = error.message; };
    const finish = () => { settle(); dialog.close(); commit("已儲存，所有檢視已同步"); };
    try {
      const result = submitDialog(values);
      if (result?.then) { submitting = true; dialog.querySelectorAll("button").forEach(button => { button.disabled = true; }); result.then(finish).catch(failure); }
      else finish();
    } catch (error) { failure(error); }
  });
  const textValue = (formData, key) => String(formData.get(key) || "").trim();
  function requiredValue(values, key, message) { const value = textValue(values, key); if (!value) throw new Error(message); return value; }
  function executionField(task) {
    if (task.status === "doing") return "";
    return `<label class="d-check"><input type="checkbox" name="startWork" checked><span>${task.status === "queue" ? "同時將這項工作開始為進行中" : task.status === "done" ? "這次有後續工作，同時重新開啟為進行中" : "這次需要繼續處理，同時回到進行中"}</span></label>`;
  }
  function beginExecution(data, task, values) {
    if (!values.has("startWork") || task.status === "doing") return;
    transition(data, task, "doing", "隨本次執行紀錄開始／繼續工作");
    const waiting = task.reviewRounds.findLast(round => round.state === "waiting");
    if (waiting) Object.assign(waiting, { state: "revise", reply: "工作繼續處理，保留本輪確認紀錄", repliedAt: now() });
  }
  function validateExecution(data, task, values) {
    if (values.has("startWork") && task.status === "queue") ensurePhase(data, task, "start");
  }
  function artifactFields(data, task, previous = []) {
    const selected = new Set(previous.map(ref => ref.fileId));
    const files = [...data.files].sort((a, b) => Number(b.workIds.includes(task.id)) - Number(a.workIds.includes(task.id)));
    const libraryFiles = documentLibrary.documents.filter(doc => !doc.archived && !data.files.some(file => file.documentId === doc.id));
    const libraryPicker = libraryFiles.length ? `<details class="d-library-picker"><summary>從文件庫選用其他文件 · ${libraryFiles.length}</summary><label>搜尋文件<input type="search" data-library-search placeholder="文件名稱或原檔名"></label><div class="docs-picker">${libraryFiles.map(doc => `<label class="d-check" data-library-match="${e([doc.name, doc.subject, ...(doc.aliases || [])].join(" ").toLowerCase())}"><input type="checkbox" name="libraryDocument" value="${e(doc.id)}" data-version="${e(documentModel.current(doc)?.id || "")}"><span>${e(doc.name)}<small>v${doc.versions.findIndex(v => v.id === documentModel.current(doc)?.id) + 1} · 共用原文件</small></span></label>`).join("")}</div></details>` : "";
    return `<fieldset><legend>本輪資料（選填）</legend>${files.map(file => `<label class="d-check"><input type="checkbox" name="artifact" value="${e(file.id)}" data-version="${e(documentModel.current(file)?.id || "")}" ${selected.has(file.id) ? "checked" : ""}><span>${e(file.name)} · v${file.versions.findIndex(v => v.id === documentModel.current(file)?.id) + 1}${file.workIds.includes(task.id) ? "" : " · 案件共用資料"}</span></label>`).join("") || `<p class="d-help">還沒有已存的資料，可以直接加入檔案。</p>`}${libraryPicker}<label>直接加入檔案<input type="file" name="upload" multiple></label><p class="d-help">選取的資料會自動關聯這項工作，並固定引用這次的版本。</p></fieldset>`;
  }
  dialog.addEventListener("input", event => {
    if (event.target.matches("[data-library-search]")) dialog.querySelectorAll("[data-library-match]").forEach(row => { row.hidden = !row.dataset.libraryMatch.includes(event.target.value.trim().toLowerCase()); });
  });
  function withArtifacts(data, task, values, callback) {
    const ids = values.getAll("artifact");
    const selected = values.getAll("upload").filter(file => file instanceof File && file.name);
    const projectId = uiState.projectId;
    const finish = added => {
      const linked = values.getAll("libraryDocument").map(id => documentModel.link(id, projectId, task.id));
      added = [...added, ...linked];
      const artifacts = [...new Set([...ids, ...added.map(file => file.id)])].map(id => data.files.find(file => file.id === id)).filter(Boolean).map(file => {
        if (!file.workIds.includes(task.id)) file.workIds.push(task.id);
        const selectedVersion = dialog.querySelector(`[name="artifact"][value="${CSS.escape(file.id)}"]`)?.dataset.version || dialog.querySelector(`[name="libraryDocument"][value="${CSS.escape(file.documentId)}"]`)?.dataset.version;
        const version = selectedVersion ? file.versions.find(v => v.id === selectedVersion) : documentModel.current(file);
        if (!version) throw new Error("所選版本已不存在，請重新選擇文件");
        return { fileId: file.id, versionId: version.id, name: version.name, versionLabel: `v${file.versions.indexOf(version) + 1}` };
      });
      callback(artifacts);
    };
    if (!selected.length) return finish([]);
    return workspaceManager.storeFiles(selected, { projectId: uiState.projectId, kind: "task", id: task.id }).then(finish);
  }
  function workForm(data, task, parentId = "") {
    const excluded = new Set(task ? [task.id, ...descendants(data, task.id).map(item => item.id)] : []);
    const parents = [["", "交付目標下的主要成果"], ...data.tasks.filter(item => !excluded.has(item.id)).map(item => [item.id, item.title])];
    form(task ? "編輯成果工作" : "新增成果工作", "以可交付的成果命名。日常聯絡、蒐集與修改可留在工作內的步驟。",
      field("成果名稱", "title", task?.title, "text", true) + select("所屬目標／工作", "parentId", parents, task?.parentId || parentId) +
      field("完成標準", "criteria", task?.criteria, "textarea") + field("目前現況", "detail", task?.detail, "textarea") +
      `<div class="d-form-columns">${field("負責人／主要協作者", "owner", task?.owner)}${field("工作期限", "due", normalizeDateValue(task?.due), "date")}</div>` +
      field("到期時間（選填）", "dueTime", task?.dueTime, "time") +
      `<label class="d-check"><input type="checkbox" name="required" ${task?.required !== false ? "checked" : ""}>這是上層交付所需的必要成果</label>`, "儲存工作", values => {
        const title = requiredValue(values, "title", "請填寫成果名稱");
        const nextParent = textValue(values, "parentId");
        if (excluded.has(nextParent) || nextParent && !data.tasks.some(item => item.id === nextParent)) throw new Error("這個層級會形成循環或找不到上層工作");
        if (task && nextParent && values.has("required") && hasPath(data, task.id, nextParent)) throw new Error("這項工作依賴所選的上層成果，不能同時成為它的必要子成果");
        const updated = { title, parentId: nextParent, criteria: textValue(values, "criteria"), detail: textValue(values, "detail"), owner: textValue(values, "owner"), due: textValue(values, "due"), dueTime: textValue(values, "due") ? textValue(values, "dueTime") : "", required: values.has("required") };
        if (task) Object.assign(task, updated);
        else { task = { id: uid("work"), status: "queue", priority: "normal", ...updated }; data.tasks.push(task); }
        normalize(data); record(data, task, "設定成果工作", title);
      });
  }
  function ensurePhase(data, task, phase) {
    const unmet = blockers(data, task, phase);
    if (unmet.length) throw new Error(`${phaseNames[phase]}前仍需：${unmet.map(item => data.tasks.find(work => work.id === item.workId)?.title || "來源工作已不存在").join("、")}`);
  }
  function transition(data, task, nextStatus, result = "") {
    if (nextStatus === "doing" && task.status === "queue") ensurePhase(data, task, "start");
    if (nextStatus === "review" || nextStatus === "done") {
      ensurePhase(data, task, nextStatus === "review" ? "submit" : "deliver");
      const requiredChildren = children(data, task.id).filter(child => child.required && child.status !== "done");
      if (requiredChildren.length) throw new Error(`必要子成果尚未完成：${requiredChildren.map(item => item.title).join("、")}`);
    }
    const previous = task.status;
    if (previous === nextStatus) return;
    task.status = nextStatus;
    if (nextStatus === "done") { task.completedAt = now(); task.completionNote = result; }
    else if (previous === "done") { task.previousCompletionNote = task.completionNote; task.completionNote = ""; task.completedAt = ""; }
    record(data, task, `${statusName(previous)} → ${statusName(nextStatus)}`, result);
  }
  function confirmationForm(data, task, mode, returnStatus = "doing") {
    if (mode === "review") {
      const previous = task.reviewRounds.at(-1);
      form("整項成果送出確認", "這代表整項成果已準備好。單次資料送審請在「資料要求與協作往返」中記錄。",
        field("交由誰確認", "person", previous?.person || "", "text", true) + field("本輪確認範圍", "request", previous?.request || task.criteria, "textarea", true) + field("預計回覆日期", "expectedDate", "", "date"), "送出確認", values => {
          const person = requiredValue(values, "person", "請填寫確認對象");
          const request = requiredValue(values, "request", "請填寫確認範圍");
          transition(data, task, "review", `交由 ${person} 確認：${request}`);
          task.reviewRounds.push({ id: uid("review"), person, request, expectedDate: textValue(values, "expectedDate"), state: "waiting", sentAt: now() });
          task.review = { person, request, expectedDate: textValue(values, "expectedDate"), sentAt: now() };
        });
    } else {
      const s = summary(data, task);
      const unfinishedRequests = s.works.flatMap(item => item.requests).filter(item => !["accepted", "cancelled"].includes(item.state)).length;
      const unfinishedSteps = task.checklist.filter(item => !item.done).length;
      const reminder = s.issues.length || unfinishedRequests || unfinishedSteps ? `仍有 ${s.issues.length} 個問題、${unfinishedRequests} 項未結協作、${unfinishedSteps} 個未完成步驟。請先收尾；若不影響本次交付，請在驗收結果說明原因。` : "";
      form(mode === "return" ? returnStatus === "queue" ? "撤回確認，移至待處理" : "記錄修改要求" : "確認成果完成", mode === "return" ? `保留本輪回覆，工作回到${statusName(returnStatus)}。之後可再送出新一輪確認。` : `依完成標準驗收：${task.criteria || "請寫明實際達成的結果"}。${reminder}`,
        field(mode === "return" ? "修改要求或撤回原因" : "確認結果與驗收依據", "result", "", "textarea", true), mode === "return" ? `回到${statusName(returnStatus)}` : "確認完成", values => {
          const result = requiredValue(values, "result", "請留下結果");
          transition(data, task, mode === "return" ? returnStatus : "done", result);
          const round = task.reviewRounds.findLast(item => item.state === "waiting");
          if (round) Object.assign(round, { state: mode === "return" ? "revise" : "accepted", reply: result, repliedAt: now() });
        });
    }
  }
  moveTask = function(taskId, nextStatus) {
    const data = workspaceData[uiState.projectId], task = data?.tasks.find(item => item.id === taskId);
    if (!task || !boardColumns.some(item => item.id === nextStatus) || task.status === nextStatus) return;
    if (nextStatus === "review" || nextStatus === "done") { renderProjectRoom(); return confirmationForm(data, task, nextStatus === "done" ? "complete" : "review"); }
    if (task.status === "review") { renderProjectRoom(); return confirmationForm(data, task, "return", nextStatus); }
    try { transition(data, task, nextStatus); commit(`已移至${statusName(nextStatus)}`); }
    catch (error) { renderProjectRoom(); showToast(error.message); }
  };
  openTaskCompletionDialog = taskId => confirmationForm(workspaceData[uiState.projectId], workspaceData[uiState.projectId].tasks.find(item => item.id === taskId), "complete");
  openWorkFlowDialog = (taskId, intent) => {
    const data = workspaceData[uiState.projectId], task = data.tasks.find(item => item.id === taskId);
    if (task) intent === "review" ? confirmationForm(data, task, "review") : openWork(uiState.projectId, taskId);
  };
  const activeWork = () => uiState.surface === "project" && uiState.projectTab === "board" ? workspaceData[uiState.projectId]?.tasks.find(task => task.id === uiState.focusRecordId) : null;
  function progressForm(data, task, mode) {
    form(mode === "progress" ? "更新工作現況" : "新增工作紀錄", `記錄在「${e(task.title)}」的歷程中。`, field("內容", "detail", mode === "progress" ? task.detail : "", "textarea", true) + (mode === "progress" ? executionField(task) : ""), "儲存紀錄", values => {
      const detail = requiredValue(values, "detail", "請填寫內容");
      if (mode === "progress") { validateExecution(data, task, values); beginExecution(data, task, values); task.detail = detail; }
      record(data, task, mode === "progress" ? "更新現況" : "工作紀錄", detail);
    });
  }
  const oldCapture = openCaptureDialog;
  openCaptureDialog = function(kind, preferredIssueId, preferredTaskId) {
    const data = workspaceData[uiState.projectId], current = activeWork();
    const taskId = preferredTaskId || current?.id || "";
    const task = data?.tasks.find(item => item.id === taskId);
    if (kind === "task" && data) return workForm(data, null, task?.id || boardParent);
    if (kind === "note" && task) return progressForm(data, task, "note");
    if (kind === "decision" && task && !preferredIssueId && !data.issues.some(issue => issue.taskId === task.id)) { showToast("這項工作尚無問題，先記下要處理的問題"); kind = "issue"; }
    const result = oldCapture(kind, preferredIssueId, taskId);
    if (kind === "decision" && preferredIssueId) {
      captureIssueField.hidden = true;
      requestAnimationFrame(() => captureForm.elements.title.focus());
    }
    return result;
  };

  function requestForm(data, task, request) {
    form(request ? "調整資料要求" : "新增資料要求", "這是工作內的一次協作要求。可同時向不同對象準備資料，不會額外拆成主要工作。",
      select("資料方向", "direction", [["outbound", "我提供資料，請對方確認"], ["inbound", "我向對方取得資料"]], request?.direction || "outbound") +
      field("需要提供／取得什麼", "title", request?.title, "text", true) + field("協作對象", "person", request?.person ?? task.owner, "text", true) + field("資料要求或確認條件", "criteria", request?.criteria, "textarea") +
      `<div class="d-form-columns">${field("提供期限", "due", request?.due, "date")}${field("預計回覆", "expectedDate", request?.expectedDate, "date")}</div>`, "儲存要求", values => {
        const direction = request?.rounds.length ? request.direction : textValue(values, "direction");
        const updated = { direction, title: requiredValue(values, "title", "請填寫資料要求"), person: requiredValue(values, "person", "請填寫協作對象"), criteria: textValue(values, "criteria"), due: textValue(values, "due"), expectedDate: direction === "inbound" ? textValue(values, "due") : textValue(values, "expectedDate") };
        if (request) Object.assign(request, updated);
        else task.requests.push({ id: uid("request"), state: "preparing", rounds: [], ...updated });
        record(data, task, "更新資料要求", `${updated.person}：${updated.title}`);
      });
    const direction = dialog.querySelector('[name="direction"]');
    direction.disabled = Boolean(request?.rounds.length);
    if (direction.disabled) direction.parentElement.insertAdjacentHTML("afterend", '<p class="d-help">已有往返紀錄，保留原資料方向；不同方向請另建要求。</p>');
    const update = () => {
      const inbound = direction.value === "inbound";
      const dueLabel = dialog.querySelector('[name="due"]').parentElement;
      dueLabel.firstChild.textContent = inbound ? "對方提供期限" : "我方提供期限";
      const expected = dialog.querySelector('[name="expectedDate"]');
      expected.disabled = inbound; expected.parentElement.hidden = inbound;
    };
    direction.addEventListener("change", update); update();
  }
  function sendForm(data, task, request) {
    const inbound = request.direction === "inbound";
    form(inbound ? "記錄已提出資料要求" : "記錄本輪資料送出", inbound ? `向 ${e(request.person)} 索取 ${e(request.title)}。提出要求後追蹤對方提供，不會記成我方送出文件。` : `交給 ${e(request.person)} · ${e(request.title)}。送出內容綁定當時的版本，後續更新不會改寫這輪紀錄。`,
      field(inbound ? "實際提出日期" : "實際送出日期", "sentDate", localISODate(), "date", true) + field(inbound ? "要求內容／說明" : "本輪送出內容／說明", "note", request.rounds.at(-1)?.note || request.criteria || request.title, "textarea", true) +
      field(inbound ? "約定收件日期" : "這一輪預計回覆日期", "expectedDate", request.expectedDate || (inbound ? request.due : ""), "date") +
      (inbound ? "" : artifactFields(data, task, request.rounds.at(-1)?.artifacts)) + executionField(task), inbound ? "記錄已提出" : "記錄送出", values => {
        const sentDate = requiredValue(values, "sentDate", "請填寫實際送出日期");
        if (sentDate > localISODate()) throw new Error("實際送出日期不能在未來；尚未送出請調整提供期限");
        const note = requiredValue(values, "note", "請填寫送出內容");
        validateExecution(data, task, values);
        const finish = artifacts => {
          beginExecution(data, task, values);
          request.rounds.push({ id: uid("round"), state: "waiting", sentDate, person: request.person, recordedAt: now(), note, artifacts });
          request.state = "waiting"; request.expectedDate = textValue(values, "expectedDate"); request.reply = "";
          if (inbound) request.due = request.expectedDate;
          record(data, task, `${inbound ? "提出資料要求" : "送出資料"}：${request.title}`, `${request.person} · ${sentDate} · ${note}`);
        };
        return inbound ? finish([]) : withArtifacts(data, task, values, finish);
      });
  }
  function replyForm(data, task, request) {
    const inbound = request.direction === "inbound";
    form(inbound ? "記錄收到資料" : "記錄協作回覆", `${e(request.person)} · ${e(request.title)}。只更新這項資料要求，不會自動完成整項工作。`,
      select(inbound ? "收件結果" : "回覆結果", "state", inbound ? [["accepted", "資料已收齊，符合要求"], ["revise", "收到部分／不符要求，請對方補件"]] : [["accepted", "資料已確認"], ["revise", "需要修改，再送一輪"]]) + field(inbound ? "補充說明／還缺什麼" : "補充說明／修改要求", "reply", "", "textarea") +
      (inbound ? field("實際收到日期", "receivedDate", localISODate(), "date", true) + artifactFields(data, task) + executionField(task) : field("實際回覆日期", "replyDate", localISODate(), "date")), inbound ? "儲存收件" : "儲存回覆", values => {
        const state = textValue(values, "state");
        const reply = textValue(values, "reply") || (state === "accepted" ? inbound ? "資料已收齊，符合要求" : "資料已確認" : "");
        if (!reply) throw new Error("請說明需要修改或補件的內容");
        if (!["accepted", "revise"].includes(state)) throw new Error("請選擇有效的結果");
        const receivedDate = inbound ? requiredValue(values, "receivedDate", "請填寫收到日期") : "";
        if (receivedDate > localISODate()) throw new Error("實際收到日期不能在未來");
        if (inbound) validateExecution(data, task, values);
        const current = request.rounds.at(-1);
        const replyDate = inbound ? localISODate() : textValue(values, "replyDate") || localISODate();
        if (!parseDueValue(replyDate) || replyDate > localISODate()) throw new Error("請填有效的實際回覆日期，不能在未來");
        if (!inbound && current?.sentDate && replyDate < current.sentDate) throw new Error("回覆日期不能早於本輪送出日期");
        if (!inbound && (!current || current.state !== "waiting")) throw new Error("這個要求沒有正在等待回覆的輪次");
        const finish = artifacts => {
          if (inbound) beginExecution(data, task, values);
          let round = current;
          if (!round || round.state !== "waiting") { round = { id: uid("round"), note: "直接記錄收到資料", sentDate: "", artifacts: [] }; request.rounds.push(round); }
          Object.assign(round, { state, reply, replyDate, repliedAt: now() }, inbound ? { receivedDate, artifacts, person: request.person } : {}); Object.assign(request, { state, reply });
          record(data, task, `${inbound ? "收到資料" : "協作回覆"}：${request.title}`, `${request.person} · ${reply}`);
        };
        return inbound ? withArtifacts(data, task, values, finish) : finish([]);
      });
    const stateField = dialog.querySelector('[name="state"]'), replyField = dialog.querySelector('[name="reply"]');
    const updateReply = () => { replyField.required = stateField.value === "revise"; replyField.placeholder = stateField.value === "revise" ? "請留下修改或補件原因" : "確認結果已由上方選項記錄；沒有補充可留空"; };
    stateField.addEventListener("change", updateReply); updateReply();
  }
  function evidenceForm(data, task) {
    form("關聯資料與來源", "同一份附件或來源可以供多項工作使用。新附件會保存檔案本體；舊索引可另外補入檔案版本。網址會開啟原始頁面。",
      `<fieldset><legend>使用專案內既有資料</legend>${data.files.map(file => `<label class="d-check"><input type="checkbox" name="file" value="${e(file.id)}" ${file.workIds.includes(task.id) ? "checked" : ""}><span>${e(file.name)}</span></label>`).join("")}</fieldset>` +
      field("或新增來源名稱", "name") + field("來源網址（法規、雲端文件等）", "url", "", "url"), "儲存關聯", values => {
        const url = textValue(values, "url"), name = textValue(values, "name");
        if ((url || name) && (!name || !safeURL(url))) throw new Error("新增來源請填寫名稱與有效的 http／https 網址");
        const ids = new Set(values.getAll("file"));
        for (const file of data.files) {
          file.workIds = file.workIds.filter(id => id !== task.id);
          if (ids.has(file.id)) file.workIds.push(task.id);
          if (!ids.has(file.id) && file.linkedType === "task" && file.linkedId === task.id) { file.linkedType = "project"; file.linkedId = ""; }
        }
        if (url) data.files.push({ id: uid("file"), name, url: safeURL(url), source: "link", date: localISODate(), workIds: [task.id], linkedType: "project", linkedId: "", size: "外部來源", versions: [{ id: uid("version"), name, url: safeURL(url), date: localISODate(), source: "link" }] });
        record(data, task, "更新資料關聯", name || `${ids.size} 份既有資料`);
      });
  }
  function versionForm(data, task, file) {
    form("新增資料版本", "舊版本與已送出輪次都會保留。這裡記錄來源與版本，不會複製遠端文件內容。", field("版本名稱", "name", file.name, "text", true) + field("來源網址", "url", file.url || "", "url") + field("這版改了什麼", "note", "", "textarea", true), "新增版本", values => {
      const name = requiredValue(values, "name", "請填寫名稱"), note = requiredValue(values, "note", "請填寫版本變更"), url = textValue(values, "url");
      if (url && !safeURL(url)) throw new Error("請使用 http／https 網址");
      file.versions.push({ id: uid("version"), name, url: safeURL(url), date: localISODate(), note, source: url ? "link" : "local" });
      const doc = documentModel.find(file.documentId);
      if (doc) { doc.currentVersionId = file.versions.at(-1).id; documentModel.event(doc, "updated", { versionId: doc.currentVersionId, note }); }
      file.name = name; file.url = safeURL(url); file.source = url ? "link" : "local"; file.note = note;
      record(data, task, `資料新版本 v${file.versions.length}`, `${name}：${note}`);
    });
  }
  const oldOpenLink = openLinkDialog;
  openLinkDialog = function(kind, id, evidenceId) {
    const data = workspaceData[uiState.projectId];
    const file = data?.files.find(item => item.id === evidenceId);
    if (file) return window.documentUI ? documentUI.update(documentModel.find(file.documentId)) : versionForm(data, null, file);
    if (!kind) { const task = activeWork(); kind = task ? "task" : "project"; id = task?.id || null; }
    return oldOpenLink(kind, id, evidenceId);
  };
  function hasPath(data, start, target, seen = new Set()) {
    if (start === target) return true;
    if (seen.has(start)) return false;
    seen.add(start);
    const item = data.tasks.find(work => work.id === start);
    return [...children(data, start).filter(child => child.required).map(child => child.id), ...(item?.conditions || []).map(condition => condition.workId)].some(id => hasPath(data, id, target, seen));
  }
  document.addEventListener("click", event => {
    const button = event.target.closest("[data-delivery-action]");
    if (!button) return;
    const name = button.dataset.deliveryAction, id = button.dataset.work || "", itemId = button.dataset.item;
    const projectId = button.dataset.project || uiState.projectId;
    if (name === "expand") {
      const motion = window.interfaceMotion?.captureMap();
      const treeSurface = uiState.surface === "project" ? projectRoomContent : mobileOverview;
      const rows = window.interfaceMotion?.captureRows(treeSurface);
      const anchor = button.closest(".d-map-node");
      const before = anchor?.getBoundingClientRect();
      expanded.has(id) ? expanded.delete(id) : expanded.add(id);
      renderTopology(); renderMobileOverview();
      if (before) {
        const after = mapStage.querySelector(`[data-delivery-action="expand"][data-work="${CSS.escape(id)}"]`)?.closest(".d-map-node")?.getBoundingClientRect();
        if (after) { uiState.x += before.left - after.left; uiState.y += before.top - after.top; applyTransform(); }
      }
      if (uiState.surface === "project") renderProjectRoom();
      window.interfaceMotion?.settleMap(motion);
      window.interfaceMotion?.settleRows(treeSurface, rows);
      const surface = uiState.surface === "project" ? projectRoomContent : mapView.hidden ? mobileOverview : mapStage;
      surface.querySelector(`[data-delivery-action="expand"][data-work="${CSS.escape(id)}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (name === "more") {
      const motion = window.interfaceMotion?.captureMap();
      const previousKeys = new Set([...mapStage.querySelectorAll('[data-motion-key]')].map(node => node.dataset.motionKey));
      visibleCounts.set(id, (visibleCounts.get(id) || 4) + 4); renderTopology();
      window.interfaceMotion?.settleMap(motion);
      const nextControl = mapStage.querySelector(`[data-delivery-action="more"][data-work="${CSS.escape(id)}"]`)
        || [...mapStage.querySelectorAll('[data-motion-key]')].find(node => !previousKeys.has(node.dataset.motionKey))?.querySelector('button');
      nextControl?.focus({ preventScroll: true });
      return;
    }
    if (name === "open") return openWork(projectId, id);
    if (name === "open-request" || name === "open-milestone") {
      openWork(projectId, id);
      const selector = name === "open-request" ? `[data-request-id="${CSS.escape(itemId)}"]` : `[data-delivery-action="milestone"][data-item="${CSS.escape(itemId)}"]`;
      // Run after the ordinary room-entry focus, which otherwise resets this jump to the top.
      requestAnimationFrame(() => {
        if (uiState.projectId !== projectId || uiState.focusRecordId !== id) return;
        const target = projectRoomContent.querySelector(selector);
        target?.scrollIntoView({ block: "center", behavior: "instant" });
        const control = target?.matches("button") ? target : target?.querySelector("button");
        control?.focus({ preventScroll: true });
      });
      return;
    }
    const data = workspaceData[projectId]; if (!data) return;
    const task = data.tasks.find(work => work.id === id);
    if (name === "root") { boardParent = ""; return setProjectTab("overview"); }
    if (name === "issues") return setProjectTab("records");
    if (name === "create") return workForm(data, null, id);
    if (name === "goal") return form("設定交付目標", "描述這個案子最後要交付的成果。工作期限各自獨立，不會被專案期限覆寫。",
      field("交付目標", "title", data.goal.title || getProject(projectId).name, "text", true) + field("交付驗收條件", "criteria", data.goal.criteria, "textarea") + field("預計交付日期", "due", data.deadlineDate, "date"), "儲存目標", values => {
        data.goal.title = requiredValue(values, "title", "請填寫目標"); data.goal.criteria = textValue(values, "criteria"); data.deadlineDate = textValue(values, "due"); data.deadlineLabel = "交付目標"; record(data, null, "更新交付目標", data.goal.title);
      });
    if (name === "accept-goal") {
      const reopening = data.lifecycle === "completed";
      return form(reopening ? "重新開啟專案" : "驗收專案交付", reopening ? "保留原本交付紀錄，重新開始追蹤後續工作。" : "必要主要成果完成後，由你確認交付條件已達成。完成子工作不會自動結案。", field(reopening ? "重新開啟原因" : "交付結果與驗收依據", "result", "", "textarea", true), reopening ? "重新開啟" : "確認交付", values => {
        const result = requiredValue(values, "result", "請留下結果或原因");
        const s = summary(data);
        if (!reopening && (s.incomplete.length || s.changed)) throw new Error("仍有必要成果未完成，或已完成成果下有子工作變動，請先複核");
        data.lifecycle = reopening ? "active" : "completed";
        data.goal.history ||= []; data.goal.history.push({ at: now(), result, action: reopening ? "reopen" : "accept" });
        if (!reopening) { data.goal.acceptedAt = now(); data.goal.result = result; }
        record(data, null, reopening ? "重新開啟專案" : "確認專案交付", result);
      });
    }
    if (!task) return;
    if (name === "jump") {
      const target = (itemId === "evidence" && projectRoomContent.querySelector('[data-work-section="files"]')) || projectRoomContent.querySelector(`[data-delivery-action="${CSS.escape(itemId)}"][data-work="${CSS.escape(task.id)}"]`);
      target?.closest("section")?.scrollIntoView({ block: "start", behavior: "instant" });
      return;
    }
    if (name === "edit") return workForm(data, task);
    if (name === "child-board") { boardParent = task.id; uiState.focusRecordId = ""; return setProjectTab("board"); }
    if (name === "issue") return openCaptureDialog("issue", "", task.id);
    if (name === "complete" || name === "return") return confirmationForm(data, task, name);
    if (name === "progress" || name === "note") return progressForm(data, task, name);
    if (name === "step") return form("新增工作內步驟", "例如：聯絡窗口取得謄本、修正資料或補一份說明。", field("要做什麼", "title", "", "text", true), "新增步驟", values => {
      const title = requiredValue(values, "title", "請填寫步驟"); task.checklist.push({ id: uid("step"), title, done: false }); record(data, task, "新增步驟", title);
    });
    if (name === "milestone") {
      const milestone = task.milestones.find(item => item.id === itemId);
      return form(milestone ? "更新關鍵日期" : "新增關鍵日期", "預計是規劃；約定是已和對方確認的時間；實際只記錄已發生的事。",
        field("事件名稱", "title", milestone?.title, "text", true) + field("預計日期", "plannedDate", milestone?.plannedDate, "date") + field("已約定日期", "committedDate", milestone?.committedDate, "date") + field("實際發生日期", "actualDate", milestone?.actualDate, "date") + field("說明／日期變更原因", "note", milestone?.note, "textarea"), "儲存日期", values => {
          const title = requiredValue(values, "title", "請填寫事件名稱"), actualDate = textValue(values, "actualDate");
          if (actualDate > localISODate()) throw new Error("實際日期不能在未來，請填入預計或約定日期");
          const updated = { title, plannedDate: textValue(values, "plannedDate"), committedDate: textValue(values, "committedDate"), actualDate, note: textValue(values, "note") };
          if (milestone) Object.assign(milestone, updated); else task.milestones.push({ id: uid("milestone"), ...updated });
          record(data, task, `關鍵日期：${title}`, `預計 ${updated.plannedDate || "未排定"} / 約定 ${updated.committedDate || "未排定"} / 實際 ${actualDate || "尚未發生"} / ${updated.note}`);
        });
    }
    if (name === "remove-step") { const item = task.checklist.find(step => step.id === itemId); task.checklist = task.checklist.filter(step => step.id !== itemId); record(data, task, "移除步驟", item?.title || ""); return commit("步驟已移除，歷程已保留"); }
    if (name === "request" || name === "edit-request") return requestForm(data, task, task.requests.find(request => request.id === itemId));
    if (name === "send") return sendForm(data, task, task.requests.find(request => request.id === itemId));
    if (name === "reply") return replyForm(data, task, task.requests.find(request => request.id === itemId));
    if (name === "cancel-request") {
      const request = task.requests.find(item => item.id === itemId);
      return form("結束這項資料要求", "例如已改用其他資料，或這項要求不再需要。保留所有往返紀錄。", field("結束原因", "result", "", "textarea", true), "結束要求", values => {
        const result = requiredValue(values, "result", "請留下原因");
        request.state = "cancelled"; request.reply = result;
        const round = request.rounds.findLast(item => item.state === "waiting");
        if (round) Object.assign(round, { state: "cancelled", reply: result, repliedAt: now() });
        record(data, task, `結束資料要求：${request.title}`, result);
      });
    }
    if (name === "evidence") return evidenceForm(data, task);
    if (name === "unlink") {
      const file = data.files.find(item => item.id === itemId);
      file.workIds = file.workIds.filter(workId => workId !== id);
      if (file.linkedType === "task" && file.linkedId === id) { file.linkedType = "project"; file.linkedId = ""; }
      record(data, task, "取消資料關聯", file.name); return commit("已取消關聯；原始資料與歷次送出紀錄保留");
    }
    if (name === "version") {
      const file = data.files.find(item => item.id === itemId);
      return versionForm(data, task, file);
    }
    if (name === "condition") return form("新增階段交付條件", "只選真正需要先取得的另一項成果。這不會把蒐集資料等日常步驟變成前置工作。",
      select("影響哪個階段", "phase", Object.entries(phaseNames), "deliver") + select("需要哪項成果已完成", "workId", [["", "請選擇成果"], ...data.tasks.filter(item => item.id !== task.id).map(item => [item.id, item.title])]), "設定條件", values => {
        const workId = requiredValue(values, "workId", "請選擇成果"), phase = textValue(values, "phase");
        if (hasPath(data, workId, task.id)) throw new Error("這個條件會形成相互等待的循環");
        if (task.conditions.some(item => item.workId === workId && item.phase === phase)) throw new Error("這個條件已經存在");
        if (phase === "start" && task.status !== "queue") throw new Error("工作已開始，請設定真正受到影響的送確認或交付階段");
        task.conditions.push({ id: uid("condition"), workId, phase }); record(data, task, "設定交付條件", `${phaseNames[phase]}前取得 ${data.tasks.find(item => item.id === workId).title}`);
      });
    if (name === "remove-condition") { task.conditions = task.conditions.filter(item => item.id !== itemId); record(data, task, "移除交付條件"); return commit("已移除條件"); }
  });
  document.addEventListener("change", event => {
    const move = event.target.closest("[data-task-move]");
    if (move) return moveTask(move.dataset.taskMove, move.value);
    const input = event.target.closest("[data-delivery-check]"); if (!input) return;
    const data = workspaceData[uiState.projectId], task = data.tasks.find(item => item.id === input.dataset.work);
    const step = task.checklist.find(item => item.id === input.dataset.deliveryCheck); step.done = input.checked;
    record(data, task, step.done ? "完成步驟" : "重新開啟步驟", step.title); commit();
  });

  // Re-normalize imports and old capture actions before projecting their data.
  const oldRefresh = refreshProjectDataSurface;
  refreshProjectDataSurface = function(...args) { Object.values(workspaceData).forEach(normalize); return oldRefresh(...args); };
  const oldRoute = routeFromLocation;
  routeFromLocation = function() {
    const params = new URLSearchParams(location.hash.slice(1));
    const routeProject = params.get("project");
    if (routeProject && workspaceData[routeProject]) {
      lastProject = routeProject;
      boardParent = workspaceData[routeProject].tasks.some(task => task.id === params.get("parent")) ? params.get("parent") : "";
    }
    const legacyNode = params.get("node");
    if (legacyNode) { const found = getNode(legacyNode); if (found) return openWork(found.project.id, found.node.linkedTaskId); }
    return oldRoute();
  };
  window.removeEventListener("popstate", oldRoute);
  window.addEventListener("popstate", routeFromLocation);
  document.querySelector(".map-legend").innerHTML = `<span>交付目標</span><span>→ 主要成果</span><span>→ 子成果</span><span><i class="legend-mark current"></i>進行中的工作</span>`;
  document.querySelector(".map-note p").textContent = "雙指或滾輪縮放，拖曳畫布移動。點選成果進入操作，＋ 展開子工作。連線表示所屬關係，不代表先後順序。";
  saveWorkspaceData(); routeFromLocation();
  // Explicit model API for regression checks; all mutations still go through the same functions.
  window.deliveryModel = { normalize, children, descendants, summary, blockers, transition, hasPath, record };
})();
