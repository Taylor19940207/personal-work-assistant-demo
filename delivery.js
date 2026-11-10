/* Delivery model: work is authoritative; the map is a projection, never a source. */
(() => {
  "use strict";
  const e = escapeHTML;
  const uid = prefix => `${prefix}-${crypto.randomUUID()}`;
  const now = () => new Date().toISOString();
  const statusName = value => boardColumns.find(column => column.id === value)?.label || "待處理";
  const requestNames = { preparing: "準備中", waiting: "等待回覆", revise: "需要修改", accepted: "已確認", cancelled: "已結束" };
  const inboundNames = { checking: "待核對", preparing: "待索取資料", waiting: "等待資料", revise: "待對方補件", accepted: "資料已收齊", cancelled: "已結束" };
  const requestName = (request, state = request.state) => (request.direction === "inbound" ? inboundNames : requestNames)[state] || state;
  const phaseNames = { start: "開始工作", submit: "送交確認", deliver: "完成交付" };
  const expanded = new Set();
  const visibleCounts = new Map();

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
  function dependencyRows(data, task, riskOnly = false) {
    if (task.status === "done") return "";
    const requiredPath = work => work.required && (!work.parentId || requiredPath(data.tasks.find(parent => parent.id === work.parentId)));
    return task.conditions.map(condition => {
      const source = data.tasks.find(item => item.id === condition.workId);
      if (!source || source.status === "done") return "";
      const deadline = condition.latest || normalizeDateValue(task.due);
      const atRisk = requiredPath(task) && deadline && deadline <= localISODate();
      if (riskOnly && !atRisk) return "";
      const text = task.title + " · " + phaseNames[condition.phase] + "前需完成「" + source.title + "」";
      return '<button type="button" class="d-context-link" data-delivery-action="open" data-work="' + e(source.id) + '"><strong>' + (atRisk ? "交付風險 · " : "受阻 · ") + e(text) + '</strong><span>' + e(deadline ? "最晚處理 " + deadline : "尚無最晚處理日") + '</span></button>';
    }).join("");
  }
  function record(data, task, title, detail = "") {
    const entry = { id: uid("activity"), kind: "task", actor: "本機使用者", title, detail, date: localISODate(), at: now(), taskId: task?.id || "" };
    data.activity.unshift(entry);
    if (task) task.history.unshift({ ...entry, status: task.status });
  }
  function commit(message) {
    const saved = saveWorkspaceData(); refreshProjectDataSurface();
    if (saved && message) showToast(message);
    return saved;
  }
  function openWork(projectId, taskId) {
    openProjectRoom(projectId, "board", true, taskId);
  }
  const oldFocusRecord = focusProjectRecord;
  focusProjectRecord = function(recordId) {
    if (projectRoomContent.querySelector(".d-work-detail") && workspaceData[uiState.projectId]?.tasks.some(task => task.id === recordId)) {
      projectRoomContent.scrollTop = 0;
      projectRoom.scrollTop = 0;
      const title = projectRoomHeader.querySelector("h1");
      title?.setAttribute("tabindex", "-1"); title?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior:"instant" });
      return;
    }
    return oldFocusRecord(recordId);
  };
  function badge(task) { return `<span class="d-status" data-status="${e(task.status)}">${statusName(task.status)}</span>`; }
  function workPeople(task) {
    const person = assignmentOf(task)?.person;
    return [person && "負責人：" + person, task.owner && "往來對象：" + task.owner].filter(Boolean).join(" · ");
  }
  const workCurrent = task => task.status === "done" ? task.completionNote || "工作已完成" : task.detail || (task.criteria ? "完成標準：" + task.criteria : "");
  function action(label, name, id = "", extra = "") {
    return `<button type="button" class="d-action" data-delivery-action="${name}" data-work="${e(id)}" ${extra}>${label}</button>`;
  }
  function dateLabel(value) { return value && value !== "未排定" ? e(value) : "未排定"; }
  function workMeta(task) {
    const due = normalizeDateValue(task.due);
    const assignment = assignmentOf(task);
    const handoff = normalizeDateValue(assignment?.due);
    return [workPeople(task), due && "工作期限 " + due, handoff && handoff !== due && "交件日 " + handoff].filter(Boolean).join(" · ");
  }
  function milestoneDates(item) {
    return [item.plannedDate && "預計 " + item.plannedDate, item.committedDate && "已約定 " + item.committedDate,
      item.actualDate && "實際 " + item.actualDate].filter(Boolean).join(" · ") || "日期待定";
  }
  function signals(data, task) {
    const s = summary(data, task);
    const awaitingFiles = s.waiting.filter(r => r.direction === "inbound").length;
    const awaitingReplies = s.waiting.length - awaitingFiles;
    return `<span class="d-signals">${s.issues.length ? `<span class="text-danger">${s.issues.length} 個問題</span>` : ""}${awaitingFiles ? `<span>${awaitingFiles} 項待收件</span>` : ""}${awaitingReplies ? `<span>${awaitingReplies} 項待回覆</span>` : ""}${s.revise.length ? `<span class="text-warning">${s.revise.length} 項待修改</span>` : ""}${s.changed ? `<span class="text-warning">子工作有變動，請再確認</span>` : ""}</span>`;
  }
  function workRow(project, task, depth = 0) {
    const data = workspaceData[project.id];
    const kids = children(data, task.id);
    const isOpen = expanded.has(task.id);
    return `<div class="d-tree-item" style="--depth:${Math.min(depth, 8)}">
      <div class="d-tree-row" data-work-row="${e(task.id)}">
        ${kids.length ? action(isOpen ? "−" : "+", "expand", task.id, `aria-label="${isOpen ? "收合" : "展開"} ${e(task.title)}" aria-expanded="${isOpen}"`) : `<span class="d-tree-dot" aria-hidden="true"></span>`}
        <button class="d-work-link" type="button" data-delivery-action="open" data-project="${e(project.id)}" data-work="${e(task.id)}"><strong>${e(task.title)}</strong><small>${e(workMeta(task))}${kids.length ? `${workMeta(task) ? " · " : ""}${kids.filter(item => item.status === "done").length}/${kids.length} 項子工作已完成` : ""}</small>${signals(data, task)}</button>
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
    if (data.lifecycle === "active" && !data.tasks.length && !s.issues.length && base.deadline.state !== "overdue") state = "待安排工作";
    if (data.lifecycle === "active" && progress === 100) state = "已備妥，待對外交付";
    else if (data.lifecycle === "active" && state === "已完成") state = "待確認交付範圍";
    if (data.lifecycle === "completed" && (s.incomplete.length || s.changed)) state = "已交付，有後續變動";
    if (s.changed && data.lifecycle === "active") state = "工作有變動，請再確認";
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
      decision: "到工作頁查看問題與決策", next: task.checklist.find(item => !item.done)?.title || "查看工作詳情",
      evidence: data.files.filter(file => file.workIds?.includes(task.id)).map(file => file.name).join("、") || "尚未加入文件"
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
    let cursor = 65, maxDepth = 0, projectX = 0;
    const projects = getPortfolioProjects();
    const columns = projects.length > 1 && !expanded.size && workspace.clientWidth >= 1100 ? 2 : 1;
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
      const alert = s.issues.length ? s.issues.length + " 個待解決問題" : s.revise.length ? s.revise.length + " 項待修改或補件" : s.waiting.length ? s.waiting.length + " 項待跟進" : "";
      const info = [workMeta(task), alert].filter(Boolean).join(" · ");
      nodes.push(`<article data-motion-key="work/${e(task.id)}" class="d-map-node ${task.status === "doing" ? "is-active" : ""}" style="left:${x}px;top:${y - 43}px;--project-color:${project.color}" data-map-project="${e(project.id)}" data-has-issues="${Boolean(s.issues.length)}">
        <button type="button" class="d-map-open" data-delivery-action="open" data-project="${e(project.id)}" data-work="${e(task.id)}">${badge(task)}<strong>${e(task.title)}</strong>${info ? `<small>${e(info)}</small>` : ""}</button>
        ${kids.length ? action(`${expanded.has(task.id) ? "−" : "+"} ${kids.length}`, "expand", task.id, `aria-expanded="${expanded.has(task.id)}" aria-label="展開或收合 ${e(task.title)} 的子工作"`) : ""}
      </article>`);
      return { x, y, key: task.id };
    }
    function moreNode(id, count, depth, projectId) {
      const x = projectX + 45 + depth * step, y = cursor + row / 2; cursor += row;
      nodes.push(`<div data-motion-key="more/${e(id)}" class="d-map-more" style="left:${x}px;top:${y - 22}px">${action(`再顯示 ${Math.min(4, count)} 項 · 尚有 ${count} 項`, "more", id, `data-project="${e(projectId)}"`)}</div>`);
      return { x, y, key: `more/${id}` };
    }
    for (const [projectIndex, project] of projects.entries()) {
      projectX = (projectIndex % columns) * 715;
      cursor = bandStart;
      const data = workspaceData[project.id]; normalize(data);
      const goalIndex = nodes.length;
      const roots = children(data);
      const limit = visibleCounts.get(project.id) || 4;
      const laid = roots.slice(0, limit).map(task => layoutTask(project, task, 1));
      if (roots.length > limit) laid.push(moreNode(project.id, roots.length - limit, 1, project.id));
      const delivered = data.lifecycle === "completed";
      const deliveryDate = delivered ? data.goal.acceptedAt?.slice(0,10) : data.deadlineDate;
      const label = delivered ? "已對外交付" : "預計交付";
      const dateButton = deliveryDate ? `<button type="button" class="d-goal-date" data-delivery-action="show-delivery" data-project="${e(project.id)}" data-delivery-date="${e(deliveryDate)}" aria-label="${e(project.name)}，${label} ${e(deliveryDate)}，查看案件時間軸"><i class="chron-mark ${delivered ? "actual" : "plan"}" aria-hidden="true"></i>${label}<time datetime="${e(deliveryDate)}">${e(deliveryDate)}</time><span aria-hidden="true">↗</span></button>` : "";
      const y = laid.length ? (laid[0].y + laid.at(-1).y) / 2 : cursor + row / 2;
      if (!laid.length) cursor += row;
      projectY.set(project.id, y);
      laid.forEach(child => connect(projectX + 305, y, child.x, child.y, `${project.id}/goal/${child.key}`));
      const s = summary(data);
      const goal = data.goal.title || project.name;
      const progress = s.direct.length ? " · 已完成 " + (s.direct.length - s.incomplete.length) + "/" + s.direct.length + " 項必要工作" : "";
      nodes.splice(goalIndex, 0, `<article data-motion-key="goal/${e(project.id)}" class="d-map-goal" style="left:${projectX + 45}px;top:${y}px;--project-color:${project.color}" data-map-project="${e(project.id)}" data-has-issues="${Boolean(s.issues.length)}">
        ${dateButton}<button type="button" data-open-project="${e(project.id)}"><small>${goal === project.name ? "交付目標" : e(project.name) + " · 交付目標"}</small><strong>${e(goal)}</strong><span>${e(getProjectSnapshot(project).state)}${progress}</span></button>
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
      const center = workspaceData[projectId].tasks.length ? 320 : goal.offsetWidth / 2;
      uiState.x = mapViewport.clientWidth / 2 - (parseFloat(goal.style.left) + center) * uiState.scale;
      applyTransform();
    }
  };
  const oldSetView = setView;
  setView = function(view, options) {
    if (uiState.surface !== "project") renderTopology();
    return oldSetView(view, options);
  };
  function portfolioList() {
    return `<div class="d-portfolio-list">${getPortfolioProjects().map(project => {
      const data = workspaceData[project.id];
      return `<section class="d-portfolio-project" data-mobile-case="${e(project.id)}" style="--project-color:${project.color}"><button type="button" class="d-project-link" data-open-project="${e(project.id)}"><small>${e(project.name)} · ${e(getProjectSnapshot(project).state)}</small><strong>${e(data.goal.title || project.name)}</strong><span>${data.deadlineDate ? "預計交付 " + dateLabel(data.deadlineDate) : "查看案件"} ↗</span></button>${signals(data)}${children(data).map(task => workRow(project, task)).join("") || `<p class="d-help">尚未建立主要工作</p>`}</section>`;
    }).join("")}</div>`;
  }
  renderMobileOverview = function() { mobileOverview.innerHTML = portfolioList(); };
  renderList = function() {
    if (uiState.view === "mine") { listView.innerHTML = myWorkHome(); return; }
    const projects = uiState.focusProjectId ? getPortfolioProjects().filter(project => project.id === uiState.focusProjectId) : getPortfolioProjects();
    listView.innerHTML = `${workTimeline.render(projects)}<details class="chron-history"><summary>完整紀錄</summary><div class="event-tree">${projects.map(project => {
      const data = workspaceData[project.id];
      const items = uiState.mode === "issues" ? data.issues.filter(issue => issue.status === "open") : data.activity;
      return `<details class="tree-project" open><summary><strong>${e(project.name)}</strong><span>${e(getProjectSnapshot(project).state)}</span></summary><div class="tree-events">${items.map(item => {
        const issueId = item.id.startsWith("activity-") ? item.id.slice(9) : item.id;
        const linkedIssue = data.issues.find(issue => issue.id === issueId);
        const tab = linkedIssue ? "records" : item.taskId ? "board" : "activity";
        return `<button class="tree-event" type="button" data-open-project-tab="${tab}" data-project-id="${e(project.id)}" data-record-id="${e(linkedIssue?.id || item.taskId || item.id)}"><time>${e(item.date)}</time><strong>${e(item.title)}</strong><small>${linkedIssue ? "查看問題" : "查看紀錄"}</small></button>`;
      }).join("") || `<p class="d-help">${uiState.mode === "issues" ? "目前沒有待解決問題" : "尚無紀錄"}</p>`}</div></details>`;
    }).join("")}</div></details>`;
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
          items.push({ priority: due.state === "overdue" ? 0 : 1, dueAt: due.dueAt, projectId: project.id, tab: "board", recordId: task.id, milestoneId: milestone.id, kind: "重要日期", title: milestone.title, context: `${task.title} / ${due.display} / ${milestone.committedDate ? "已約定" : "預計"}` });
        }
        for (const request of task.requests || []) {
          if (["accepted", "cancelled"].includes(request.state)) continue;
          const due = getDueMeta(request.followOn || (request.state === "waiting" ? request.expectedDate : request.due));
          if (request.state === "checking" || ((request.assignment || request.followOn) && !["overdue","today"].includes(due.state))) continue;
          if (request.state !== "revise" && !["overdue", "today", "soon"].includes(due.state)) continue;
          items.push({ priority: due.state === "overdue" ? 0 : 1, dueAt: due.dueAt, projectId: project.id, tab: "board", recordId: task.id, requestId: request.id, kind: requestName(request), title: request.title, context: `${task.title} / ${request.person} / ${due.display} / ${due.short}` });
        }
      }
    }
    return items.filter(item => workspaceData[item.projectId]?.lifecycle !== "archived").sort((a, b) => a.priority - b.priority || a.dueAt - b.dueAt);
  };

  function breadcrumb(data, task) {
    const parent = data.tasks.find(item => item.id === task.parentId);
    if (history.state?.fromWork?.timelineOrigin || history.state?.fromWork?.listOrigin) return "";
    const up = parent ? action("← " + e(parent.title), "work-up", task.id) : action("← 案件工作", "work-up", task.id);
    return `<nav class="d-breadcrumb" aria-label="工作層級">${up}</nav>`;
  }
  function overview(project, data) {
    const s = summary(data);
    const today = localISODate();
    const coordination = data.tasks.filter(task => task.status !== "done").flatMap(task =>
      outstandingRequests(data, task).map(request => ({task, request, brief:requestBrief(data, request, today)})));
    const dates = data.tasks.flatMap(task => task.milestones.filter(item => !item.actualDate).map(item => ({ task, item }))).sort((a, b) => (a.item.committedDate || a.item.plannedDate || "9999").localeCompare(b.item.committedDate || b.item.plannedDate || "9999"));
    const risks = data.tasks.map(task => dependencyRows(data,task,true)).join("");
    const needsAttention = risks || coordination.length || s.issues.length || s.overdue.length || s.changed;
    const canDeliver = data.tasks.length > 0 && !s.incomplete.length && !s.changed;
    return `<div class="project-surface d-overview">
      ${data.tasks.length || data.lifecycle !== "active" ? `<section class="d-goal-summary"><div><p class="d-eyebrow">交付目標</p><h2>${e(data.goal.title || project.name)}</h2>${data.goal.criteria ? `<p>${e(data.goal.criteria)}</p>` : ""}<div class="d-goal-meta">${data.deadlineDate ? `<span>預計交付 ${dateLabel(data.deadlineDate)}</span>` : ""}<span>${s.direct.length - s.incomplete.length} / ${s.direct.length} 項必要工作已完成</span>${data.goal.acceptedAt ? `<span>實際交付 ${dateLabel(data.goal.acceptedAt.slice(0, 10))}</span>` : ""}</div></div><div class="d-actions">${action("設定目標", "goal")}${data.lifecycle === "completed" || canDeliver ? action(data.lifecycle === "completed" ? "重新開啟案件" : "記錄對外交付", "accept-goal") : ""}</div></section>` : ""}
      ${workTimeline.render([project], project.id)}
      ${(data.goal.history || []).some(entry => entry.action === "accept") ? `<details><summary>歷次對外交付</summary>${data.goal.history.filter(entry => entry.action === "accept").map(entry => `<p>${e(entry.date || entry.at.slice(0,10))} · ${e(entry.recipient || "未記錄對象")} · ${e(entry.result)}</p>${(entry.artifacts || []).map(ref => {
        const version = documentModel.find(ref.documentId)?.versions.find(v => v.id === ref.versionId);
        if (version?.blobId) return `<button type="button" class="d-action" data-workspace-action="open-file" data-file="${e(ref.documentId)}" data-version="${e(ref.versionId)}">${e(ref.name)} ↗</button>`;
        return safeURL(version?.url) ? `<a href="${e(version.url)}" target="_blank" rel="noopener noreferrer">${e(ref.name)} ↗</a>` : e(ref.name);
      }).join("")}`).join("")}</details>` : ""}
      <div class="d-overview-grid"><section><div class="d-section-title"><h3>案件工作</h3>${action(data.tasks.length ? "＋ 新增工作" : "新增第一項工作", "create")}</div>
      ${children(data).map(task => workRow(project, task)).join("") || `<div class="d-empty">尚未安排工作。${data.goal.criteria ? "<p>驗收標準：" + e(data.goal.criteria) + "</p>" : ""}</div>`}</section>
      <aside class="d-side">
        ${needsAttention ? `<section><h3>待辦與跟進</h3>${risks}
          ${s.overdue.map(task => `<button type="button" class="d-context-link" data-delivery-action="open" data-work="${e(task.id)}"><strong>${e(task.title)}</strong><span>工作逾期 · 原訂 ${dateLabel(task.due)} 完成</span></button>`).join("")}
          ${coordination.map(({task, request, brief}) => `<button type="button" class="d-context-link" data-delivery-action="open-request" data-work="${e(task.id)}" data-item="${e(request.id)}"${brief.rowId ? ' data-row="' + e(brief.rowId) + '"' : ""}><strong>${e(brief.title)}</strong><span>${e([task.title, brief.detail].filter(Boolean).join(" · "))}</span></button>`).join("")}
          ${s.changed ? "<p>已完成的工作中有子工作重新開啟，請確認交付進度。</p>" : ""}${s.issues.length ? action("查看待解決問題（" + s.issues.length + "）", "issues") : ""}</section>` : ""}
        ${dates.length ? `<section><h3>案件行程</h3>${dates.map(({task, item}) => {
          const date = item.committedDate ? "已約定 " + item.committedDate : item.plannedDate ? "預計 " + item.plannedDate : "日期待定";
          return `<button type="button" class="d-context-link" data-delivery-action="open-milestone" data-work="${e(task.id)}" data-item="${e(item.id)}"><strong>${e(item.title)}</strong><span>${e([date, task.title, workPeople(task)].filter(Boolean).join(" · "))}</span></button>`;
        }).join("")}</section>` : ""}
        ${data.activity.length ? `<section><h3>近期紀錄</h3>${data.activity.slice(0,4).map(item => `<p><small>${e(item.date)}</small><br>${e(item.title)}</p>`).join("")}</section>` : ""}
      </aside></div>
    </div>`;
  }
  function taskCard(task, data) {
    const kids = children(data, task.id);
    return `<article class="task-card d-board-card" draggable="true" data-task-id="${e(task.id)}" data-record-target="${e(task.id)}"><button class="d-work-link" type="button" data-delivery-action="open" data-work="${e(task.id)}"><h3>${e(task.title)}</h3><p>${e(workCurrent(task))}</p></button>${signals(data, task)}<small>${e(workMeta(task))}</small>${kids.length ? `<p>${kids.filter(item => item.status === "done").length}/${kids.length} 項子工作已完成</p>` : ""}<div class="d-card-footer"><select aria-label="${e(task.title)}的狀態" data-task-move="${e(task.id)}">${boardColumns.map(column => `<option value="${column.id}" ${column.id === task.status ? "selected" : ""}>${column.label}</option>`).join("")}</select></div></article>`;
  }
  renderTaskCard = taskCard;
  renderProjectBoard = function(project, data) {
    const selected = data.tasks.find(task => task.id === uiState.focusRecordId);
    if (selected) return workDetail(project, data, selected);
    const works = children(data);
    return `<div class="project-surface"><div class="surface-heading"><div><h2>工作板</h2></div>${action("＋ 新增工作", "create")}</div><div class="kanban-board d-board">${boardColumns.map(column => `<section class="kanban-column" data-drop-status="${column.id}" style="--column-color:${column.color}"><div class="column-heading"><strong>${column.label}</strong><span>${works.filter(task => task.status === column.id).length}</span></div><p class="d-column-hint">${{ queue: "已安排，尚未開始", doing: "辦理中，含等待資料與補件", review: "已交回，等待核對", done: "已核對完成" }[column.id]}</p><div class="task-stack">${works.filter(task => task.status === column.id).map(task => taskCard(task, data)).join("")}</div></section>`).join("")}</div></div>`;
  };
  const oldRoom = renderProjectRoom;
  renderProjectOverview = overview;
  renderProjectRoom = function() {
    const data = workspaceData[uiState.projectId];
    if (!data) return;
    const openTimeline = projectRoomContent.querySelector(".d-timeline-fold[open]")?.dataset.work;
    normalize(data); oldRoom();
    const selected = uiState.projectTab === "board" && data.tasks.find(task => task.id === uiState.focusRecordId);
    projectRoom.classList.toggle("reading-work",Boolean(selected));
    if (selected) {
      const copy = projectRoomHeader.querySelector(".project-heading-copy");
      copy.innerHTML = `<button type="button" class="d-case-link" data-project-tab="overview" aria-label="回案件總覽：${e(getProject(uiState.projectId).name)}">${e(getProject(uiState.projectId).name)} <small>案件總覽 ↗</small></button><h1 tabindex="-1">${e(selected.title)}</h1>`;
      projectRoomHeader.querySelector(".project-heading-status")?.remove();
      const fold = projectRoomContent.querySelector(".d-timeline-fold");
      if (fold && openTimeline === selected.id) fold.open = true;
    }
    const back = projectRoomHeader.querySelector(".project-back");
    if (selected && back) {
      delete back.dataset.action;
      back.dataset.deliveryAction = "work-up";
      back.dataset.work = selected.id;
      back.title = history.state?.fromWork?.timelineOrigin ? "回時間軸" : history.state?.fromWork?.listOrigin ? "回到清單項目" : "返回上一層";
      back.setAttribute("aria-label", back.title);
      const from = history.state?.fromWork;
      if (from?.listOrigin) {
        const parent = data.tasks.find(work=>work.id===from.work);
        const request = parent?.requests.find(req=>req.id===from.listOrigin.request);
        const item = request?.items?.find(row=>row.id===from.listOrigin.row);
        back.textContent = "← 回到清單";
        back.title = item ? `回「${parent.title}」清單的「${item.title}」` : "回到清單項目";
        back.setAttribute("aria-label",back.title);
        back.classList.add("d-timeline-back");
        if (item) projectRoomHeader.querySelector(".project-heading-copy").insertAdjacentHTML("beforeend",
          `<div class="rl-origin">來自 ${e(parent.title)} / ${e(request.title)} / ${e(item.title)}</div>`);
      }
      if (history.state?.fromWork?.timelineOrigin) { back.textContent = "← 回時間軸"; back.classList.add("d-timeline-back"); }
    }
    const project = getProject(uiState.projectId);
    const summaryLine = projectRoomHeader.querySelector(".project-heading-copy > p:last-child");
    if (summaryLine) summaryLine.textContent = `交付目標：${data.goal.title || project.name}${data.deadlineDate ? " · 預計交付 " + data.deadlineDate : ""}`;
    const count = projectRoomHeader.querySelector(".project-status-line strong");
    if (count) { const s = summary(data); count.textContent = s.direct.length ? `已完成 ${s.direct.length - s.incomplete.length}/${s.direct.length} 項必要工作` : "尚無必要工作"; }
    if (uiState.projectTab === "overview") projectRoomContent.innerHTML = overview(project, data);
    const detail = projectRoomContent.querySelector(".d-work-detail");
    if (detail && selected) {
      const tools = document.createElement("details");
      tools.className = "d-other-tools";
      tools.innerHTML = '<summary>更多工作操作</summary><div class="d-actions"></div>';
      const actions = tools.querySelector("div");
      const moveAction = (name,label) => {
        const button = detail.querySelector(`[data-delivery-action="${name}"]`);
        if (button) {button.textContent = label; actions.append(button);}
      };
      const emptyProgress = detail.querySelector("[data-progress-empty]");
      if (emptyProgress) {
        detail.querySelector(".d-work-heading .d-actions").prepend(emptyProgress.querySelector("button"));
        emptyProgress.remove();
      }
      moveAction("edit","編輯工作");
      if (!children(data,selected.id).length) moveAction("create","新增子工作");
      for (const section of detail.querySelectorAll("[data-unused-tools]")) {
        for (const button of section.querySelectorAll("button")) actions.append(button);
        section.remove();
      }
      if (actions.querySelector('[data-delivery-action="list-new"]')) tools.querySelector("summary").textContent = "清單、分工與其他操作";
      detail.querySelector(".d-detail-main").insertBefore(tools,detail.querySelector(".d-work-history"));
    }
    const tab = projectTabs.querySelector('[data-project-tab="overview"]');
    if (tab) tab.textContent = "案件總覽";
  };
  function workDetail(project, data, task) {
    const s = summary(data, task);
    const files = data.files.filter(file => file.workIds.includes(task.id) || file.linkedType === "task" && file.linkedId === task.id);
    const issues = data.issues.filter(issue => issue.taskId === task.id);
    const people = workPeople(task);
    const items = task.requests.filter(request => request.items?.length);
    const total = items.reduce((sum, request) => sum + request.items.length, 0);
    const ready = items.reduce((sum, request) => sum + lists.stats(data, request), 0);
    const timeline = workTimeline.render([project], project.id, task);
    const facts = [total && `清單已備妥 ${ready} / ${total} 項`, people, normalizeDateValue(task.due) && "期限 "+task.due].filter(Boolean).map(e).join(" · ");
    const pendingReview = task.reviewRounds.findLast(round => round.state === "waiting");
    return `<article class="project-surface d-work-detail" data-record-target="${e(task.id)}">
      ${breadcrumb(data, task)}
      <header class="d-work-heading"><div>${facts ? `<p>${facts}</p>` : ""}${signals(data, task)}</div><div class="d-actions">${task.status === "done" ? "" : action(assignmentOf(task) ? "調整指派" : "指派", "assign", task.id)}${action("編輯工作", "edit", task.id)}<label class="d-state-control">工作狀態<select data-task-move="${e(task.id)}">${boardColumns.map(column => `<option value="${column.id}" ${task.status === column.id ? "selected" : ""}>${column.label}</option>`).join("")}</select></label></div></header>
      ${data.tasks.some(work=>work.requests.some(req=>req.items?.some(item=>item.sourceId===task.id))) ? lists.resultCard(data,task) : ""}
      ${dependencyRows(data, task)}
      <div class="d-detail-grid"><div class="d-detail-main">
        <section class="d-section" ${!task.detail && !task.criteria && task.status !== "done" ? "data-progress-empty" : ""}><div class="d-section-title"><h3>${task.status === "done" ? "完成結果" : "工作進度"}</h3>${action("更新進度", "progress", task.id)}</div>${task.detail || task.status === "done" ? `<p class="d-current">${e(workCurrent(task))}</p>` : ""}${task.criteria ? `<p class="d-help">完成標準：${e(task.criteria)}</p>` : ""}${task.status === "done" && task.detail ? `<details><summary>完成前的進度</summary><p>${e(task.detail)}</p></details>` : ""}</section>
        ${task.status === "review" && !reviewable(assignmentOf(task) || {}) ? `<section class="d-section d-review-panel"><h3>工作待確認</h3><p>${pendingReview ? `${e(pendingReview.person)} · ${e(pendingReview.request)}<br>${pendingReview.expectedDate ? "預計回覆 " + dateLabel(pendingReview.expectedDate) : ""}` : "此工作待確認，尚無交件明細。"}</p><div class="d-actions">${action("退回修改", "return", task.id)}${action("確認工作完成", "complete", task.id)}</div></section>` : ""}
        <section class="d-section"><div class="d-section-title"><h3>待辦與分工</h3><div class="d-actions">${action("＋ 待辦", "step", task.id)}${action("新增子工作", "create", task.id)}</div></div>
          ${task.checklist.map(item => `<div class="d-step"><label><input type="checkbox" data-delivery-check="${e(item.id)}" data-work="${e(task.id)}" ${item.done ? "checked" : ""}><span>${e(item.title)}</span></label>${action("移除", "remove-step", task.id, `data-item="${e(item.id)}"`)}</div>`).join("")}
          ${children(data, task.id).map(child => workRow(project, child)).join("")}
        </section>
        <section class="d-section" ${task.requests.length ? "" : "data-unused-tools"}><div class="d-section-title"><div><h3>清單與往來</h3></div><div class="d-actions">${action("＋ 清單", "list-new", task.id)}${action("新增資料往來", "request", task.id)}</div></div>${task.requests.map(request => requestCard(task, request, data)).join("") || `<p class="d-help">例如：會計師需要修訂後的財務資料，預計週五回覆。</p>`}</section>
        <section class="d-section" ${task.milestones.length ? "" : "data-unused-tools"}><div class="d-section-title"><div><h3>重要日期</h3></div>${action("新增重要日期", "milestone", task.id)}</div>${task.milestones.map(milestone => `<div class="d-milestone"><div><strong>${e(milestone.title)}</strong><p>${e(milestoneDates(milestone))}</p>${milestone.note ? `<p>${e(milestone.note)}</p>` : ""}</div>${action("更新", "milestone", task.id, `data-item="${e(milestone.id)}"`)}</div>`).join("") || `<p class="d-help">例如：老師向主管機關提交申請的日期。</p>`}</section>
        ${timeline ? `<details class="d-timeline-fold" data-work="${e(task.id)}"><summary>工作時間軸</summary>${timeline}</details>` : ""}
        <details class="d-work-history"><summary>工作紀錄 · ${task.history.length}</summary><div class="d-section-title">${action("新增紀錄", "note", task.id)}</div>${task.history.length ? task.history.map(item => `<div class="d-history"><time>${e((item.documentEventId ? item.date : item.at || item.date).slice(0, 10))}</time><div><strong>${e(item.title)}</strong><p>${e(item.detail)}</p></div></div>`).join("") : `<p class="d-help">尚無工作紀錄。</p>`}
        ${task.reviewRounds.length ? `<details><summary>工作確認紀錄 · ${task.reviewRounds.length} 輪</summary>${task.reviewRounds.map(round => `<p>${e(round.person)} · ${dateLabel(round.sentAt?.slice(0, 10))}<br>${e(round.request)}<br>${e(round.reply || "尚無回覆")} · ${e(requestNames[round.state] || "舊版紀錄")}</p>`).join("")}</details>` : ""}</details>
      </div><aside class="d-side">
        <section ${s.issues.length || issues.length ? "" : "data-unused-tools"}><div class="d-section-title"><h3>問題與決策</h3>${action("記錄問題", "issue", task.id)}</div>${issues.map(issue => `<button type="button" class="d-context-link" data-open-project-tab="records" data-project-id="${e(project.id)}" data-record-id="${e(issue.id)}"><strong>${e(issue.title)}</strong><span>${issue.status === "open" ? "未解決" : "已解決"} · 查看處理與決策 ↗</span></button>`).join("") || `<p>這項工作沒有待解決問題。</p>`}${s.issues.length > issues.filter(issue => issue.status === "open").length ? `<p class="text-warning">子工作另有待解決問題，可展開查看。</p>` : ""}</section>
        <section><div class="d-section-title"><h3>文件與連結</h3>${action("加入文件或連結", "evidence", task.id)}</div>${files.map(file => `<div class="d-evidence"><strong>${e(file.name)}</strong><small>${file.versions.length} 個版本${file.workIds.length > 1 ? ` · ${file.workIds.length} 個工作共用` : ""}</small>${file.url ? `<a href="${e(safeURL(file.url))}" target="_blank" rel="noopener noreferrer">開啟來源 ↗</a>` : `<small>只記了檔名，尚未加入檔案</small>`}<div>${action("新增版本", "version", task.id, `data-item="${e(file.id)}"`)}${action("從工作移除", "unlink", task.id, `data-item="${e(file.id)}"`)}</div></div>`).join("") || `<p>可加入檔案、網址，或從文件庫選取。</p>`}</section>
        <section ${task.conditions.length || task.legacyDependencies?.length ? "" : "data-unused-tools"}><div class="d-section-title"><h3>交付條件</h3>${action("設定條件", "condition", task.id)}</div><p>例如，正式送件前，必須先取得已核對的報告。</p>${task.conditions.map(condition => `<div class="d-condition"><p>${phaseNames[condition.phase]}前：${e(data.tasks.find(item => item.id === condition.workId)?.title || "原工作已移除")}已完成</p>${action("移除", "remove-condition", task.id, `data-item="${e(condition.id)}"`)}</div>`).join("")}${task.legacyDependencies?.length ? `<details><summary>舊版前置關係 · 僅供參考</summary><p>${task.legacyDependencies.map(id => e(data.tasks.find(item => item.id === id)?.title || id)).join("、")}</p><p>未自動轉成限制，可在「交付條件」重新設定。</p></details>` : ""}</section>
      </aside></div>
    </article>`;
  }
  function requestCard(task, request, data) {
    if (request.items) return lists.card(data,task,request);
    const rounds = request.rounds || [];
    const itemAttr = `data-item="${e(request.id)}"`;
    const inbound = request.direction === "inbound";
    const primary = request.assignment ? (closedRequest(request) ? "" : reviewable(request) ? action("核對交回的資料", "home-check", task.id, itemAttr + ' data-round="' + e(rounds.at(-1).id) + '"') : action("記錄交回", "home-receive", task.id, itemAttr)) : inbound
      ? (request.state === "preparing" ? action("記錄已索取", "send", task.id, itemAttr) : "") + action(request.state === "revise" ? "記錄補件收件" : "記錄收件", "reply", task.id, itemAttr)
      : request.state === "waiting" ? action("記錄回覆", "reply", task.id, itemAttr) : action(["accepted", "cancelled"].includes(request.state) ? "新增一輪" : "記錄送出", "send", task.id, itemAttr);
    const cancel = request.assignment || ["accepted", "cancelled"].includes(request.state) ? "" : action("結束往來", "cancel-request", task.id, itemAttr);
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
      <p>${e(request.criteria || "")}</p><div class="d-request-dates">${request.due ? `<span>${inbound ? "交件日" : "提供期限"} ${dateLabel(request.due)}</span>` : ""}${!inbound && request.expectedDate ? `<span>預計回覆 ${dateLabel(request.expectedDate)}</span>` : ""}${request.assignment ? e([request.returnTo && "交回給" + request.returnTo, !closedRequest(request) && !reviewable(request) && (request.followOn || request.due) && "跟進日 " + (request.followOn || request.due)].filter(Boolean).join(" · ")) : action("調整", "edit-request", task.id, itemAttr)}${cancel}</div>
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
    if (data.tasks.some(task => task.requests.some(request => request.rounds.some(round => round.artifacts?.some(ref => ref.fileId === evidenceId))))) return showToast("這份資料有送出紀錄。可從工作移除，當時的版本會保留");
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
  let afterDialogSave;
  function form(title, intro, content, submit, handler, afterSave = null) {
    afterDialogSave = afterSave;
    returnFocus = document.activeElement;
    dialog.innerHTML = `<form><header><div><h2 tabindex="-1" id="d-dialog-title">${title}</h2></div><button type="button" data-dialog-close aria-label="關閉">×</button></header><p class="d-help">${intro}</p><div class="d-form-fields">${content}</div><p class="d-form-error" role="alert"></p><footer><button type="button" data-dialog-close>取消</button><button type="submit" class="primary-action">${submit}</button></footer></form>`;
    submitDialog = handler;
    dialog.showModal();
    const focus = matchMedia("(pointer: coarse)").matches ? "#d-dialog-title" : "input,textarea,select";
    dialog.querySelector(focus)?.focus({preventScroll:true});
  }
  dialog.addEventListener("click", event => { if (!submitting && event.target.closest("[data-dialog-close]")) dialog.close(); });
  dialog.addEventListener("cancel", event => { if (submitting) event.preventDefault(); });
  dialog.addEventListener("close", () => { if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true}); });
  dialog.addEventListener("submit", event => {
    event.preventDefault(); if (submitting) return;
    const values = new FormData(event.target);
    const settle = () => { submitting = false; dialog.querySelectorAll("button").forEach(button => { button.disabled = false; }); };
    const failure = error => { settle(); dialog.querySelector(".d-form-error").textContent = error.message; };
    const finish = saved => { settle(); dialog.close(); if (saved === alreadySaved) showToast("已儲存"); else commit("已儲存，所有檢視已同步"); afterDialogSave?.(); };
    try {
      const result = submitDialog(values);
      if (result?.then) { submitting = true; dialog.querySelectorAll("button").forEach(button => { button.disabled = true; }); result.then(finish).catch(failure); }
      else finish(result);
    } catch (error) { failure(error); }
  });
  function requireFormChange() {
    const formElement = dialog.querySelector("form");
    const submit = formElement.querySelector('[type="submit"]');
    const fields = () => JSON.stringify([...new FormData(formElement)]);
    const initial = fields();
    const sync = () => { submit.disabled = fields() === initial; };
    formElement.addEventListener("input", sync);
    formElement.addEventListener("change", sync);
    sync();
  }
  const textValue = (formData, key) => String(formData.get(key) || "").trim();
  function requiredValue(values, key, message) { const value = textValue(values, key); if (!value) throw new Error(message); return value; }
  function executionField(task) {
    if (task.status === "doing") return "";
    return `<label class="d-check"><input type="checkbox" name="startWork" checked><span>${task.status === "queue" ? "同時開始這項工作" : task.status === "done" ? "重新開啟這項工作，繼續處理" : "將工作移回進行中"}</span></label>`;
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
    const libraryPicker = libraryFiles.length ? `<details class="d-library-picker"><summary>從文件庫加入其他文件 · ${libraryFiles.length}</summary><label>搜尋文件<input type="search" data-library-search placeholder="文件名稱或原檔名"></label><div class="docs-picker">${libraryFiles.map(doc => `<label class="d-check" data-library-match="${e([doc.name, doc.subject, ...(doc.aliases || [])].join(" ").toLowerCase())}"><input type="checkbox" name="libraryDocument" value="${e(doc.id)}" data-version="${e(documentModel.current(doc)?.id || "")}"><span>${e(doc.name)}<small>v${doc.versions.findIndex(v => v.id === documentModel.current(doc)?.id) + 1} · 共用原文件</small></span></label>`).join("")}</div></details>` : "";
    const caseFiles = files.map(file => `<label class="d-check"><input type="checkbox" name="artifact" value="${e(file.id)}" data-version="${e(documentModel.current(file)?.id || "")}" ${selected.has(file.id) ? "checked" : ""}><span>${e(file.name)} · v${file.versions.findIndex(v => v.id === documentModel.current(file)?.id) + 1}${file.workIds.includes(task.id) ? "" : " · 案件共用資料"}</span></label>`).join("");
    const chooser = caseFiles ? `<details class="d-work-options" ${selected.size ? "open" : ""}><summary>選擇已有的文件</summary><div>${caseFiles}${libraryPicker}</div></details>` : libraryPicker;
    return `<fieldset><legend>這次使用的文件（選填）</legend><label>加入檔案<input type="file" name="upload" multiple></label>${chooser}</fieldset>`;
  }
  dialog.addEventListener("input", event => {
    if (event.target.matches("[data-library-search]")) dialog.querySelectorAll("[data-library-match]").forEach(row => { row.hidden = !row.dataset.libraryMatch.includes(event.target.value.trim().toLowerCase()); });
  });
  const alreadySaved = Symbol("persisted");
  function withArtifacts(data, task, values, callback, receiptContext) {
    const ids = values.getAll("artifact");
    const selected = values.getAll("upload").filter(file => file instanceof File && file.name);
    const projectId = Object.keys(workspaceData).find(id => workspaceData[id] === data);
    if (!projectId) throw Error("案件已變更，請重新開啟表單");
    const finish = added => {
      const linked = values.getAll("libraryDocument").map(id => documentModel.link(id, projectId, task.id));
      added = [...added, ...linked];
      const artifacts = [...new Set([...ids, ...added.map(file => file.id)])].map(id => data.files.find(file => file.id === id)).filter(Boolean).map(file => {
        if (!file.workIds.includes(task.id)) file.workIds.push(task.id);
        const selectedVersion = receiptContext && added.some(entry => entry.id === file.id) ? documentModel.current(file)?.id : dialog.querySelector(`[name="artifact"][value="${CSS.escape(file.id)}"]`)?.dataset.version || dialog.querySelector(`[name="libraryDocument"][value="${CSS.escape(file.documentId)}"]`)?.dataset.version;
        const version = selectedVersion ? file.versions.find(v => v.id === selectedVersion) : documentModel.current(file);
        if (!version) throw new Error("所選版本已不存在，請重新選擇文件");
        return { fileId: file.id, versionId: version.id, name: version.name, versionLabel: `v${file.versions.indexOf(version) + 1}` };
      });
      callback(artifacts);
    };
    if (receiptContext) {
      if (!selected.length) {
        documentModel.mutate(() => finish([]));
        return alreadySaved;
      }
      const context = { projectId, kind: "task", id: task.id, ...receiptContext };
      return workspaceManager.storeFiles(selected, context, finish).then(() => alreadySaved);
    }
    if (!selected.length) return finish([]);
    return workspaceManager.storeFiles(selected, { projectId, kind: "task", id: task.id }).then(finish);
  }
  const closedRequest = request => ["accepted", "cancelled"].includes(request.state);
  const assignmentOf = task => task?.requests?.find(request => request.assignment);
  const reviewable = request => request?.state === "checking";
  function assignmentForm(data, task) {
    const priorAssignment = assignmentOf(task);
    const assignment = priorAssignment && !closedRequest(priorAssignment) ? priorAssignment : null;
    form(assignment ? "調整指派" : "指派工作", e(task.title),
      field("負責人", "person", assignment?.person, "text", true) +
      field("約定交件日（選填）", "due", assignment?.due || normalizeDateValue(task.due), "date") +
      '<details><summary>交回對象與跟進日期</summary>' +
      field("交回對象", "returnTo", assignment?.returnTo || assignmentOf(data.tasks.find(parent => parent.id === task.parentId))?.person || "我") +
      field("另訂跟進日", "followOn", assignment?.followOn, "date") + '</details>' +
      (task.status === "queue" ? '<label class="d-check"><input type="checkbox" name="startWork"><span>同時開始工作</span></label>' : ""),
      "儲存指派", values => {
        validateExecution(data, task, values);
        const person = requiredValue(values, "person", "請填負責人");
        const previous = assignment?.person;
        const target = assignment || { id: uid("request"), assignment: true, direction: "inbound", state: "waiting", rounds: [], title: task.title };
        Object.assign(target, { person, returnTo: textValue(values, "returnTo") || "我", due: textValue(values, "due"), followOn: textValue(values, "followOn") });
        target.expectedDate = target.due;
        if (!assignment) task.requests.unshift(target);
        beginExecution(data, task, values);
        record(data, task, previous && previous !== person ? "改派工作" : "設定指派",
          [previous && previous !== person ? previous + " → " + person : person, "交回給" + target.returnTo, target.due].filter(Boolean).join(" · "));
      });
    if (assignment) requireFormChange();
  }

  function requestOutstanding(data, request) {
    if (request.items && !request.person) return lists.stats(data,request) < request.items.length;
    return !closedRequest(request);
  }

  function stillNeeded(data, task, except) {
    return task.requests.some(r => r !== except && requestOutstanding(data,r)) ||
      task.checklist.some(step => !step.done) || children(data, task.id).some(child => child.required && child.status !== "done") ||
      blockers(data, task, "deliver").length > 0 || blockers(data, task, "submit").length > 0;
  }

  function receiveAssignment(data, task, request) {
    if (!["waiting", "revise"].includes(request.state)) return;
    const prior = request.rounds.at(-1)?.artifacts || [];
    const previousFile = prior.length === 1 && data.files.find(file => file.id === prior[0].fileId);
    const currentId = previousFile && documentModel.current(previousFile)?.id;
    const complete = !stillNeeded(data, task, request);
    form("記錄交回", e(request.person) + " → " + e(request.returnTo) + " · " + e(task.title),
      field("實際收件日", "receivedDate", localISODate(), "date", true) +
      select("收件結果", "result", [["checking", "收到，待核對"], ["accepted", complete ? "已核對，完成工作" : "已核對合格，繼續其他工作"]], "checking") +
      artifactFields(data, task) + (previousFile ? '<label class="d-check"><input type="checkbox" checked name="updatePrior"><span>上傳檔案作為「' + e(previousFile.name) + '」的新版本</span></label>' : ""),
      "儲存收件", values => {
        const receivedDate = requiredValue(values, "receivedDate", "請填實際收件日");
        if (receivedDate > localISODate()) throw Error("收件日不能在未來");
        if (task.status === "queue") ensurePhase(data, task, "start");
        const context = { date: receivedDate };
        if (previousFile && values.has("updatePrior")) Object.assign(context, { fileId: previousFile.id, baseVersionId: currentId });
        return withArtifacts(data, task, values, artifacts => {
          const state = textValue(values, "result");
          const round = { id: uid("round"), state, receivedDate, recordedAt: now(), actor: "本機使用者", person: request.person, artifacts };
          request.rounds.push(round);
          request.state = state;
          if (state === "accepted") Object.assign(round, { repliedAt: now(), replyDate: localISODate() });
          const ready = !stillNeeded(data, task, request);
          transition(data, task, ready ? state === "accepted" ? "done" : "review" : "doing", "收到" + request.person + "交回的" + task.title);
          record(data, task, state === "checking" ? "收到，待核對" : "已收件並核對合格", request.person + " · " + receivedDate);
        }, context);
      });
  }

  function checkAssignment(data, task, request, roundId) {
    const round = request.rounds.at(-1);
    if (!round || round.id !== roundId || !reviewable(request)) return showToast("這一輪已處理，請重新查看我的工作");
    const files = round.artifacts.map(ref => {
      const file = data.files.find(item => item.id === ref.fileId);
      const version = file?.versions.find(item => item.id === ref.versionId);
      const label = e(ref.name) + " · " + e(ref.versionLabel);
      if (version?.blobId) return '<button type="button" class="d-action" data-workspace-action="open-file" data-file="' + e(file.documentId) + '" data-version="' + e(version.id) + '">開啟 ' + label + '</button>';
      if (safeURL(version?.url)) return '<a target="_blank" rel="noopener noreferrer" href="' + e(safeURL(version.url)) + '">' + label + ' ↗</a>';
      return '<span>' + label + '（只有檔名）</span>';
    }).join("");
    form("核對" + e(task.title), e(round.person) + " · 收到 " + dateLabel(round.receivedDate),
      '<div class="d-actions">' + (files || "這次沒有附文件") + '</div>' +
      select("核對結果", "result", [["accepted", "核對合格"], ["revise", "請補件"]], "accepted") +
      '<div data-correction hidden>' + field("補件內容", "reason") + field("補件日（若已約定）", "due", "", "date") + field("另訂跟進日（選填）", "followOn", "", "date") + '</div>',
      "儲存核對結果", values => {
        const revise = textValue(values, "result") === "revise";
        const reason = revise ? requiredValue(values, "reason", "請說明補件內容") : "核對合格";
        const state = revise ? "revise" : "accepted";
        Object.assign(round, { state, reply: reason, replyDate: localISODate(), repliedAt: now() });
        Object.assign(request, { state, reply: reason });
        if (revise) Object.assign(request, { due: textValue(values, "due"), expectedDate: textValue(values, "due"), followOn: textValue(values, "followOn") });
        transition(data, task, revise || stillNeeded(data, task, request) ? "doing" : "done", reason);
        record(data, task, revise ? "請補件" : "本輪核對合格", reason);
      });
    const result = dialog.querySelector('[name="result"]');
    result.addEventListener("change", () => {
      const revise = result.value === "revise";
      dialog.querySelector("[data-correction]").hidden = !revise;
      dialog.querySelector('[name="reason"]').required = revise;
    });
  }

  function followForm(data, task, request) {
    const due = request.direction === "inbound" ? request.due : request.expectedDate;
    const effectiveDate = request.followOn || due || "";
    form("記錄跟進", e(request.person) + " · " + e(request.title),
      field("下次跟進日", "followOn", effectiveDate, "date") + field("聯絡結果（選填）", "note", "", "textarea"),
      "儲存跟進", values => {
        const date = textValue(values, "followOn");
        const note = textValue(values, "note");
        if (!note && (date || due || "") === effectiveDate) throw Error("請調整下次跟進日或填寫聯絡結果");
        request.followOn = date;
        record(data, task, "跟進「" + request.title + "」", [request.person, note, date && "下次跟進 " + date].filter(Boolean).join(" · "));
      });
    requireFormChange();
  }

  function versionInBrief(refs) {
    const label = refs?.length === 1 && refs[0].versionLabel;
    const number = label && /^v(\d+)$/i.exec(label);
    return number ? "第 " + number[1] + " 版" : "";
  }

  function followTiming(due, followOn, today, inbound) {
    const follow = followOn || due;
    const dates = [];
    if (due) {
      const dueState = inbound && due < today ? "（已逾期）" : "";
      dates.push((inbound ? "交件日 " : "預計回覆 ") + due + dueState);
    }
    if (follow === today) dates.push("今天請跟進");
    else if (follow && follow < today) dates.push("原訂 " + follow + " 跟進，請確認進度");
    else if (follow && follow !== due) dates.push(follow + " 跟進");
    else if (follow) dates.push("當天跟進");
    else dates.push("跟進日未定");
    return dates.join(" · ");
  }

  function outstandingRequests(data, task) {
    return task.requests.filter(req => !closedRequest(req) ||
      req.state === "accepted" && req.items && lists.stats(data, req) < req.items.length);
  }

  // Both the case summary and the personal briefing describe the same handoff.
  function requestBrief(data, req, today) {
    const person = req.person || "對方";
    const inbound = req.direction === "inbound";
    if (req.items) {
      const next = lists.nextItem(data, req);
      const ready = lists.stats(data, req);
      const progress = (next ? "「" + req.title + "」" : "清單") + "已備妥 " + ready + "/" + req.items.length + " 項";
      const info = [progress,
        req.person && "提交對象：" + req.person, req.due && "清單期限 " + req.due];
      const brief = {route:"open-request", cta:"查看清單", day:req.due, detail:info.filter(Boolean).join(" · ")};
      if (!next) {
        brief.waiting = req.state === "waiting";
        brief.contact = brief.waiting && req.person;
        brief.title = brief.waiting ? "「" + req.title + "」已提交，等" + person + "確認。"
          : "「" + req.title + "」已備妥" + (req.person ? "，可以提交給" + person : "") + "。";
        return brief;
      }
      brief.rowId = next.item.id;
      const item = "「" + next.item.title + "」";
      if (next.state === "checking") {
        brief.title = item + versionInBrief(next.output?.refs || next.refs) + (next.output ? "已交回，請核對。" : "待核對。");
        brief.cta = "查看待核對項目";
      } else if (next.state === "revise") {
        brief.title = item + "需要補件" + (next.item.note ? "：" + next.item.note : "。");
      } else if (next.source) {
        brief.title = item + "等「" + next.source.title + "」交件。";
        brief.waiting = true;
      } else brief.title = "請準備" + item + "。";
      return brief;
    }
    if (reviewable(req)) {
      const round = req.rounds.at(-1);
      const reviewer = req.returnTo && req.returnTo !== "我" ? req.returnTo : "";
      const title = (round.person || person) + "已交件，" + (reviewer ? "等" + reviewer : "請") + "核對" + versionInBrief(round.artifacts) + "。";
      return {title, waiting:!!reviewer, contact:reviewer, day:round.receivedDate, route:"home-check",
        cta:reviewer ? "記錄核對結果" : "核對交件", detail:"收件日 " + round.receivedDate, roundId:round.id};
    }
    if (req.state === "waiting" || inbound && req.state === "revise") {
      const due = inbound ? req.due : req.expectedDate;
      const follow = req.followOn || due;
      if (req.assignment && req.person === "我") {
        const recipient = req.returnTo && req.returnTo !== "我" ? "，交回給" + req.returnTo : "";
        const title = (req.state === "revise" ? "請補齊資料" : "請完成這項工作") + recipient + "。";
        return {title, day:due, route:"home-receive", cta:"記錄交回",
          detail:[req.reply, due && "交件日 " + due].filter(Boolean).join(" · ")};
      }
      const title = req.state === "revise" ? "已請" + person + "補件" : "等" + person + (inbound ? "交件" : "回覆");
      return {title:title + " · " + req.title, waiting:true, contact:req.person, day:follow, route:req.assignment ? "home-receive" : "home-reply",
        cta:inbound ? "記錄收件" : "記錄回覆", secondary:follow && follow <= today ? "記錄跟進" : "調整跟進日",
        detail:[req.state === "revise" && req.reply, followTiming(due, req.followOn, today, inbound)].filter(Boolean).join(" · ")};
    }
    const title = inbound ? "請向" + person + "索取「" + req.title + "」。" : req.state === "revise" ?
      person + "請你修改「" + req.title + "」。" : "請準備「" + req.title + "」給" + person + "。";
    return {title, day:req.due, route:"home-send", cta:inbound ? "記錄已索取" : "記錄送出",
      detail:[req.reply, req.due && "期限 " + req.due].filter(Boolean).join(" · ")};
  }

  function myWorkHome() {
    if (!getPortfolioProjects().length) {
      const examples = location.protocol === "file:" && !location.pathname.includes("/dist/") ? "./dist/examples.html" : "./examples.html";
      return `<section class="d-start"><h2>${topologyProjects.length ? "目前沒有進行中的案件" : "建立第一個案件"}</h2>
        <p>輸入案件名稱，即可安排工作與交付日期。</p>
        <button type="button" class="primary-action" data-workspace-action="new-project">建立案件</button>
        ${topologyProjects.length ? '<button type="button" class="d-action" data-workspace-action="manager">查看已封存案件</button>' : ""}
        ${window.exampleWorkspace ? "" : `<a href="${examples}" target="_blank" rel="noopener">查看範例案件 ↗</a>`}</section>`;
    }
    const mine = [], following = [], contacts = new Set(), today = localISODate();
    for (const project of getPortfolioProjects()) {
      const data = workspaceData[project.id];
      if (data.lifecycle === "completed" || uiState.focusProjectId && uiState.focusProjectId !== project.id) continue;
      const totals = summary(data);
      const first = !data.tasks.length;
      if (data.lifecycle === "active" && (first || totals.direct.length && !totals.incomplete.length && !totals.changed)) {
        const label = first ? "請安排這個案件的第一項工作。" : "必要工作已完成，實際交付後請登記。";
        const cta = first ? "安排工作" : "記錄交付";
        mine.push({day:data.deadlineDate,html:`<div class="d-home-entry"><button type="button" class="d-home-row" data-delivery-action="${first ? "home-first" : "home-deliver"}" data-project="${e(project.id)}"><strong>${label}</strong><small>${e(project.name)}</small><span class="d-home-action">${cta}</span></button></div>`});
      }
      for (const task of data.tasks) {
        if (task.status === "done") continue;
        const assignment = assignmentOf(task);
        const add = (group, title, day, route, cta, detail = "", extra = "", secondary = "") => {
          const target = `data-project="${e(project.id)}" data-work="${e(task.id)}" ${extra}`;
          const context = [project.name, !title.includes(task.title) && task.title, detail].filter(Boolean).join(" · ");
          const row = `<button type="button" class="d-home-row" data-delivery-action="${route}" ${target}><strong>${e(title)}</strong><small>${e(context)}</small><span class="d-home-action">${e(cta)}</span></button>`;
          const followButton = secondary ? `<button type="button" class="d-home-follow" data-delivery-action="home-follow" ${target}>${secondary}</button>` : "";
          group.push({day, html:`<div class="d-home-entry">${row}${followButton}</div>`});
        };
        const requests = outstandingRequests(data, task);
        for (const req of requests) {
          const brief = requestBrief(data, req, today);
          if (brief.contact) contacts.add(brief.contact);
          const target = 'data-item="' + e(req.id) + '"' +
            (brief.roundId ? ' data-round="' + e(brief.roundId) + '"' : "") +
            (brief.rowId ? ' data-row="' + e(brief.rowId) + '"' : "");
          add(brief.waiting ? following : mine, brief.title, brief.day, brief.route, brief.cta, brief.detail, target, brief.secondary);
        }
        for (const step of task.checklist.filter(item => !item.done)) {
          add(mine, step.title, step.due, "home-step", "標記完成", step.due && "期限 " + step.due, 'data-item="' + e(step.id) + '"');
        }
        if (assignment?.state === "accepted" && !stillNeeded(data, task, assignment)) {
          add(mine, "交件已核對合格，請確認工作是否完成。", "", "home-complete", "確認完成", assignment.returnTo && "交回給" + assignment.returnTo);
        }
        if ((!assignment || assignment.state === "cancelled") && !requests.length && !task.checklist.some(step => !step.done)) {
          if (task.status === "review") {
            const review = task.reviewRounds.findLast(round => round.state === "waiting") || task.review;
            const mineToReview = review?.person === "我";
            if (review?.person && !mineToReview) contacts.add(review.person);
            add(mineToReview ? mine : following, mineToReview ? "工作已交回，請核對結果。" : "工作已交回，" + (review?.person ? "等" + review.person + "確認。" : "確認人未指定。"), review?.expectedDate, "open", "查看工作", review?.expectedDate && "預計回覆 " + review.expectedDate);
          } else {
            const title = task.listOutput ? "「" + task.title + "」已交回結果，請確認工作是否完成。" : (task.status === "queue" ? "待開始" : "進行中") + " · " + task.title;
            add(mine, title, normalizeDateValue(task.due), "open", "查看工作", normalizeDateValue(task.due) && "工作期限 " + dateLabel(task.due));
          }
        }
      }
    }
    function group(id, title, rows, empty, jump = "") {
      rows.sort((a, b) => (a.day || "9999").localeCompare(b.day || "9999"));
      return '<section><header class="d-home-heading"><h2 id="brief-' + id + '" tabindex="-1">' + title + ' <small>' + rows.length + '</small></h2>' + jump + '</header>' + (rows.map(row => row.html).join("") || '<p class="d-help">' + empty + '</p>') + '</section>';
    }
    const who = [...contacts].slice(0, 2).join("、");
    const jump = (id, label) => '<button class="d-brief-jump" type="button" data-delivery-action="brief-jump" aria-controls="brief-' + id + '">' + e(label) + '</button>';
    const toFollow = following.length ? jump("following", "我在跟進 " + following.length + (who ? " · " + who : "") + " ↓") : "";
    return '<div class="d-home">' + group("mine", "輪到我", mine, "目前沒有要處理的事。", toFollow) +
      group("following", "我在跟進", following, "目前沒有待跟進的事項。", mine.length ? jump("mine", "返回我的待辦 ↑") : "") + '</div>';
  }

  function workForm(data, task, parentId = "") {
    const excluded = new Set(task ? [task.id, ...descendants(data, task.id).map(item => item.id)] : []);
    const parents = [["", "直接列於案件下"], ...data.tasks.filter(item => !excluded.has(item.id)).map(item => [item.id, item.title])];
    form(task ? "編輯工作" : parentId ? "新增子工作" : "新增工作", parentId ? "所屬工作：" + e(data.tasks.find(work => work.id === parentId)?.title || "") : "期限可稍後設定。",
      field("工作名稱", "title", task?.title, "text", true) +
      field("工作期限（選填）", "due", normalizeDateValue(task?.due), "date") +
      (task ? "" : '<details class="d-work-options"><summary>＋ 加入清單</summary><div>' + lists.fields() + '</div></details>') +
      `<details class="d-work-options" ${task ? "open" : ""}><summary>分工與完成標準</summary><div>` +
      select("工作歸屬", "parentId", parents, task?.parentId || parentId) +
      field("完成標準", "criteria", task?.criteria, "textarea") + field("目前進度", "detail", task?.detail, "textarea") +
      field("往來對象（選填）", "owner", task?.owner) +
      field("到期時間（選填）", "dueTime", task?.dueTime, "time") +
      `<label class="d-check"><input type="checkbox" name="required" ${task?.required !== false ? "checked" : ""}>交付前必須完成這項工作</label></div></details>`, "儲存工作", values => {
        const title = requiredValue(values, "title", "請填工作名稱");
        const nextParent = textValue(values, "parentId");
        if (excluded.has(nextParent) || nextParent && !data.tasks.some(item => item.id === nextParent)) throw new Error("請選擇有效的上層工作，不能選自己或自己的子工作");
        if (task && nextParent && values.has("required") && hasPath(data, task.id, nextParent)) throw new Error("這兩項工作會互相等待，請選其他所屬工作");
        const updated = { title, parentId: nextParent, criteria: textValue(values, "criteria"), detail: textValue(values, "detail"), owner: textValue(values, "owner"), due: textValue(values, "due"), dueTime: textValue(values, "due") ? textValue(values, "dueTime") : "", required: values.has("required") };
        if (task) Object.assign(task, updated);
        else { task = { id: uid("work"), status: "queue", priority: "normal", ...updated }; data.tasks.push(task); }
        if (values.has("itemNames")) lists.create(task,values);
        normalize(data); record(data, task, "設定工作", title);
      });
    if (task) requireFormChange();
  }
  function ensurePhase(data, task, phase) {
    const unmet = blockers(data, task, phase);
    if (unmet.length) throw new Error(`${phaseNames[phase]}前仍需：${unmet.map(item => data.tasks.find(work => work.id === item.workId)?.title || "原工作已移除").join("、")}`);
  }
  function transition(data, task, nextStatus, result = "") {
    if (nextStatus === "doing" && task.status === "queue") ensurePhase(data, task, "start");
    if (nextStatus === "review" || nextStatus === "done") {
      ensurePhase(data, task, "submit");
      if (nextStatus === "done") ensurePhase(data, task, "deliver");
      const requiredChildren = children(data, task.id).filter(child => child.required && child.status !== "done");
      if (requiredChildren.length) throw new Error(`必要子工作尚未完成：${requiredChildren.map(item => item.title).join("、")}`);
    }
    if (nextStatus === "done" && task.requests.some(req=>req.items && lists.stats(data,req)<req.items.length)) throw Error("清單仍有未備妥的項目，請先核對");
    if (nextStatus === "done" && assignmentOf(task) && task.requests.some(r => requestOutstanding(data,r))) throw Error("仍有未完成的交件，請先核對或結束該項要求");
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
      form("送交確認", "交回整項工作時使用。個別文件請在「清單與往來」記錄提交。",
        field("確認人", "person", previous?.person || "", "text", true) + field("確認事項", "request", previous?.request || task.criteria, "textarea", true) + field("預計回覆日期", "expectedDate", "", "date"), "送出確認", values => {
          const person = requiredValue(values, "person", "請填寫確認對象");
          const request = requiredValue(values, "request", "請填寫確認範圍");
          transition(data, task, "review", `交由 ${person} 確認：${request}`);
          task.reviewRounds.push({ id: uid("review"), person, request, expectedDate: textValue(values, "expectedDate"), state: "waiting", sentAt: now() });
          task.review = { person, request, expectedDate: textValue(values, "expectedDate"), sentAt: now() };
        });
    } else {
      const s = summary(data, task);
      const unfinishedRequests = s.works.flatMap(item => item.requests).filter(item => requestOutstanding(data,item)).length;
      const unfinishedSteps = task.checklist.filter(item => !item.done).length;
      const reminder = s.issues.length || unfinishedRequests || unfinishedSteps ? `仍有 ${s.issues.length} 個問題、${unfinishedRequests} 項未結協作、${unfinishedSteps} 個未完成步驟。請先收尾；若不影響本次交付，請在驗收結果說明原因。` : "";
      form(mode === "return" ? returnStatus === "queue" ? "撤回確認，移至待處理" : "記錄修改要求" : "確認工作完成", mode === "return" ? `保留本輪回覆，工作回到${statusName(returnStatus)}。之後可再送出新一輪確認。` : `依完成標準驗收：${e(task.criteria || "依實際交回內容確認")}。${reminder}`,
        field(mode === "return" ? "修改要求或撤回原因" : reminder ? "結案原因" : "驗收備註（選填）", "result", "", "textarea", mode === "return" || Boolean(reminder)), mode === "return" ? `回到${statusName(returnStatus)}` : "確認完成", values => {
          const result = textValue(values, "result") || (mode === "complete" && !reminder ? "已核對合格" : requiredValue(values, "result", "請留下原因"));
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
    form(mode === "progress" ? "更新工作進度" : "新增工作紀錄", `記錄在「${e(task.title)}」的歷程中。`, field("內容", "detail", mode === "progress" ? task.detail : "", "textarea", true) + (mode === "progress" ? executionField(task) : ""), "儲存紀錄", values => {
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
    if (kind === "task" && data) return workForm(data, null, task?.id || "");
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
    form(request ? "編輯資料往來" : "新增資料往來", "",
      select("往來類型", "direction", [["outbound", "提供資料"], ["inbound", "索取資料"]], request?.direction || "outbound") +
      field("資料名稱", "title", request?.title, "text", true) + field("往來對象", "person", request?.person ?? task.owner, "text", true) + field("資料規格或確認事項", "criteria", request?.criteria, "textarea") +
      `<div class="d-form-columns">${field("提供期限", "due", request?.due, "date")}${field("預計回覆", "expectedDate", request?.expectedDate, "date")}</div>` + (request ? '<details class="d-work-options" data-expand-request><summary>拆成清單項目</summary>'+field("每行一項","listLines","","textarea")+'</details>' : ""), "儲存要求", values => {
        const direction = request?.rounds.length ? request.direction : textValue(values, "direction");
        const updated = { direction, title: requiredValue(values, "title", "請填要提供或取得的資料"), person: requiredValue(values, "person", "請填寫往來對象"), criteria: textValue(values, "criteria"), due: textValue(values, "due"), expectedDate: direction === "inbound" ? textValue(values, "due") : textValue(values, "expectedDate") };
        if (request) {
          Object.assign(request, updated);
          const rows=direction==="outbound" ? lists.newRows(textValue(values,"listLines")) : [];
          if(rows.length) Object.assign(request,{items:rows,state:"preparing"});
        }
        else task.requests.push({ id: uid("request"), state: "preparing", rounds: [], ...updated });
        record(data, task, "更新資料要求", `${updated.person}：${updated.title}`);
      });
    const direction = dialog.querySelector('[name="direction"]');
    direction.disabled = Boolean(request?.rounds.length);
    if (direction.disabled) direction.parentElement.insertAdjacentHTML("afterend", '<p class="d-help">已有往返紀錄，保留原往來類型；不同方向請另建要求。</p>');
    const update = () => {
      const inbound = direction.value === "inbound";
      const expand=dialog.querySelector("[data-expand-request]"); if(expand) expand.hidden=inbound;
      const dueLabel = dialog.querySelector('[name="due"]').parentElement;
      dueLabel.firstChild.textContent = inbound ? "對方提供期限" : "我方提供期限";
      const expected = dialog.querySelector('[name="expectedDate"]');
      expected.disabled = inbound; expected.parentElement.hidden = inbound;
    };
    direction.addEventListener("change", update); update();
  }
  function sendForm(data, task, request) {
    const inbound = request.direction === "inbound";
    form(inbound ? "記錄索取資料" : "記錄送出資料", inbound ? `${e(request.title)} · 索取對象：${e(request.person)}` : `交給 ${e(request.person)} · ${e(request.title)}。這筆紀錄會保留送出當時的版本。`,
      field(inbound ? "實際索取日" : "實際送出日期", "sentDate", localISODate(), "date", true) + field(inbound ? "要求內容／說明" : "這次送出的內容", "note", request.rounds.at(-1)?.note || request.criteria || request.title, "textarea", true) +
      field(inbound ? "約定收件日期" : "預計回覆日", "expectedDate", request.expectedDate || (inbound ? request.due : ""), "date") +
      (inbound ? "" : artifactFields(data, task, request.rounds.at(-1)?.artifacts)) + executionField(task), inbound ? "記錄已索取" : "記錄送出", values => {
        const sentDate = requiredValue(values, "sentDate", "請填寫實際送出日期");
        if (sentDate > localISODate()) throw new Error("實際送出日期不能在未來；尚未送出請調整提供期限");
        const note = requiredValue(values, "note", "請填寫送出內容");
        validateExecution(data, task, values);
        const finish = artifacts => {
          beginExecution(data, task, values);
          request.rounds.push({ id: uid("round"), state: "waiting", sentDate, person: request.person, recordedAt: now(), note, artifacts });
          request.state = "waiting"; request.expectedDate = textValue(values, "expectedDate"); request.followOn = ""; request.reply = "";
          if (inbound) request.due = request.expectedDate;
          record(data, task, `${inbound ? "提出資料要求" : "送出資料"}：${request.title}`, `${request.person} · ${sentDate} · ${note}`);
        };
        return inbound ? finish([]) : withArtifacts(data, task, values, finish);
      });
  }
  function replyForm(data, task, request) {
    const inbound = request.direction === "inbound";
    form(inbound ? "記錄收件" : "記錄對方回覆", `${e(request.person)} · ${e(request.title)}。只更新這項資料要求，不會自動完成整項工作。`,
      select(inbound ? "收件結果" : "回覆結果", "state", inbound ? [["accepted", "資料已收齊，符合要求"], ["revise", "資料待補，請對方補件"]] : [["accepted", "資料已確認"], ["revise", "退回修改"]]) + field(inbound ? "收件說明或補件原因" : "補充說明／修改要求", "reply", "", "textarea") +
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
        if (!inbound && (!current || current.state !== "waiting")) throw new Error("目前沒有待回覆的交件紀錄");
        const finish = artifacts => {
          if (inbound) beginExecution(data, task, values);
          let round = current;
          if (!round || round.state !== "waiting") { round = { id: uid("round"), note: "直接記錄收件", sentDate: "", artifacts: [] }; request.rounds.push(round); }
          Object.assign(round, { state, reply, replyDate, repliedAt: now() }, inbound ? { receivedDate, artifacts, person: request.person } : {}); Object.assign(request, { state, reply, followOn: "" });
          record(data, task, `${inbound ? "收到資料" : "協作回覆"}：${request.title}`, `${request.person} · ${reply}`);
        };
        return inbound ? withArtifacts(data, task, values, finish) : finish([]);
      });
    const stateField = dialog.querySelector('[name="state"]'), replyField = dialog.querySelector('[name="reply"]');
    const updateReply = () => { replyField.required = stateField.value === "revise"; replyField.placeholder = stateField.value === "revise" ? "請留下修改或補件原因" : "確認結果已由上方選項記錄；沒有補充可留空"; };
    stateField.addEventListener("change", updateReply); updateReply();
  }
  function evidenceForm(data, task) {
    form("加入文件或連結", "同一份附件或來源可以供多項工作使用。新附件會保存原始檔案；舊紀錄可以補上原檔。網址會開啟原始頁面。",
      `<fieldset><legend>使用案件內既有資料</legend>${data.files.map(file => `<label class="d-check"><input type="checkbox" name="file" value="${e(file.id)}" ${file.workIds.includes(task.id) ? "checked" : ""}><span>${e(file.name)}</span></label>`).join("")}</fieldset>` +
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
    form("新增資料版本", "系統會保留歷次網址。若需保存送件內容，請另存原始檔案。", field("版本名稱", "name", file.name, "text", true) + field("來源網址", "url", file.url || "", "url") + field("版本變更說明", "note", "", "textarea", true), "新增版本", values => {
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
    if (name === "show-delivery") {
      openProjectRoom(projectId, "overview");
      requestAnimationFrame(() => {
        if (uiState.projectId === projectId && uiState.projectTab === "overview") workTimeline.focusDelivery(projectId, button.dataset.deliveryDate);
      });
      return;
    }
    if (name === "brief-jump") {
      const heading = document.getElementById(button.getAttribute("aria-controls"));
      heading?.focus({preventScroll:true});
      heading?.scrollIntoView({block:"start",behavior:"instant"});
      return;
    }
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
        if (after) { uiState.x += (before.left - after.left) / appLayoutScale(); uiState.y += (before.top - after.top) / appLayoutScale(); applyTransform(); }
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
    if (name === "open") return openProjectRoom(projectId, "board", true, id, null, workTimeline.origin(button));
    if (name === "open-request" || name === "open-milestone") {
      if (uiState.projectId !== projectId || uiState.focusRecordId !== id || uiState.projectTab !== "board")
        openProjectRoom(projectId, "board", true, id, null, workTimeline.origin(button));
      const selector = name === "open-request" ? `[data-request-id="${CSS.escape(itemId)}"]` : `[data-delivery-action="milestone"][data-item="${CSS.escape(itemId)}"]`;
      // Run after the ordinary room-entry focus, which otherwise resets this jump to the top.
      requestAnimationFrame(() => {
        if (uiState.projectId !== projectId || uiState.focusRecordId !== id) return;
        if (button.dataset.row) return lists.focusRow(itemId, button.dataset.row);
        const target = projectRoomContent.querySelector(selector);
        if (target?.matches("[data-list-disclosure]")) target.open=true;
        target?.scrollIntoView({ block: "center", behavior: "instant" });
        const control = target?.matches("button") ? target : target?.querySelector("button");
        control?.focus({ preventScroll: true });
      });
      return;
    }
    const data = workspaceData[projectId]; if (!data) return;
    const task = data.tasks.find(work => work.id === id);
    if (name === "home-first" || name === "home-deliver") {
      openProjectRoom(projectId,"overview");
      if (name === "home-first") return workForm(data,null);
      return projectRoomContent.querySelector('[data-delivery-action="accept-goal"]')?.click();
    }
    if (name.startsWith("list-") && task) return lists.handle(name,data,task,task.requests.find(r=>r.id===itemId),button.dataset.row);
    if (name === "home-step" && task) {
      const step = task.checklist.find(step => step.id === itemId);
      if (!step || step.done) return;
      step.done = true;
      record(data, task, "完成步驟", step.title);
      if (commit()) showToast("已完成「" + step.title + "」", { label: "復原", run() {
        step.done = false;
        record(data, task, "重新開啟步驟", step.title);
        commit("已復原步驟");
      }});
      return;
    }
    if (name === "home-complete" && task) return confirmationForm(data, task, "complete");
    if (name === "assign" && task) return assignmentForm(data, task);
    if (name.startsWith("home-") && task) {
      const request = task.requests.find(r => r.id === itemId);
      if (!request || closedRequest(request)) return;
      if (name === "home-follow") return followForm(data, task, request);
      if (name === "home-send") return sendForm(data, task, request);
      if (name === "home-reply") return replyForm(data, task, request);
      if (name === "home-check") return checkAssignment(data, task, request, button.dataset.round);
      if (name === "home-receive") return receiveAssignment(data, task, request);
    }
    if (name === "work-up" && task) {
      const parent = data.tasks.find(work => work.id === task.parentId);
      const from = history.state?.fromWork;
      if (from && (from.timelineOrigin || from.listOrigin || (parent ? from.work === parent.id : !from.work))) return history.back();
      if (parent) openWork(projectId, parent.id);
      else setProjectTab("overview");
      requestAnimationFrame(() => {
        const child = projectRoomContent.querySelector(`[data-delivery-action="open"][data-work="${CSS.escape(id)}"]`);
        child?.scrollIntoView({block:"nearest", behavior:"instant"});
        child?.focus({preventScroll:true});
      });
      return;
    }
    if (name === "issues") return setProjectTab("records");
    if (name === "create") return workForm(data, null, id);
    if (name === "goal") return form("設定交付目標", "請填寫預定交付的結果與交付日期。",
      field("交付目標", "title", data.goal.title || getProject(projectId).name, "text", true) + field("交付驗收條件", "criteria", data.goal.criteria, "textarea") + field("預計交付日期", "due", data.deadlineDate, "date"), "儲存目標", values => {
        data.goal.title = requiredValue(values, "title", "請填寫目標"); data.goal.criteria = textValue(values, "criteria"); data.deadlineDate = textValue(values, "due"); data.deadlineLabel = "交付目標"; record(data, null, "更新交付目標", data.goal.title);
      });
    if (name === "accept-goal") {
      const reopening = data.lifecycle === "completed";
      const files = data.files.filter(file => documentModel.current(file));
      const fields = reopening ? field("重新開啟原因", "result", "", "textarea", true) :
        field("交付對象", "recipient", data.goal.recipient || "") + field("實際交付日", "deliveredOn", localISODate(), "date", true) +
        (files.length ? '<fieldset><legend>此次交付的文件</legend>' + files.map(file => {
          const version = documentModel.current(file);
          return '<label class="d-check"><input type="checkbox" name="deliveredVersion" value="' + e(version.id) + '"><span>' + e(file.name) + ' · v' + (file.versions.indexOf(version) + 1) + '</span></label>';
        }).join("") + '</fieldset>' : "") + field("交付紀錄（選填）", "result", "", "textarea");
      return form(reopening ? "重新開啟案件" : "記錄對外交付", e(data.goal.title), fields, reopening ? "重新開啟" : "確認已交付", values => {
        const result = textValue(values, "result") || "已完成對外交付";
        const s = summary(data);
        if (!reopening && (s.incomplete.length || s.changed)) throw new Error("仍有必要工作未完成，或已完成工作的子工作有變動");
        const date = textValue(values, "deliveredOn");
        if (!reopening && (!date || date > localISODate())) throw Error("請填寫實際交付日");
        const recipient = textValue(values, "recipient");
        const versions = new Set(values.getAll("deliveredVersion"));
        const artifacts = files.flatMap(file => file.versions.filter(v => versions.has(v.id)).map(v => ({documentId:file.documentId,versionId:v.id,name:v.name})));
        data.lifecycle = reopening ? "active" : "completed";
        data.goal.history ||= [];
        data.goal.history.push({ at: now(), date, recipient, artifacts, result, action: reopening ? "reopen" : "accept" });
        if (!reopening) {
          Object.assign(data.goal,{acceptedAt: date, recipient, result});
          for (const ref of artifacts) documentModel.event(documentModel.find(ref.documentId), "provided", {projectId, versionId:ref.versionId, date, person:recipient, note:result});
        }
        record(data, null, reopening ? "重新開啟案件" : "記錄案件交付", [recipient, date, result].filter(Boolean).join(" · "));
      });
    }
    if (!task) return;

    if (name === "edit") return workForm(data, task);
    if (name === "issue") return openCaptureDialog("issue", "", task.id);
    if (name === "complete" || name === "return") return confirmationForm(data, task, name);
    if (name === "progress" || name === "note") return progressForm(data, task, name);
    if (name === "step") return form("新增待辦", e(task.title), field("待辦事項", "title", "", "text", true) + field("預計處理日（選填）", "due", "", "date"), "新增待辦", values => {
      const title = requiredValue(values, "title", "請填寫待辦事項"); task.checklist.push({ id: uid("step"), title, due: textValue(values,"due"), done: false }); record(data, task, "新增待辦", title);
    });
    if (name === "milestone" || name === "timeline-edit-date") {
      const milestone = task.milestones.find(item => item.id === itemId);
      return form(milestone ? "更新重要日期" : "新增重要日期", "已與對方確認的日期填在「約定日期」。辦理後再登記實際日期。",
        field("事件名稱", "title", milestone?.title, "text", true) + field("預計日期", "plannedDate", milestone?.plannedDate, "date") + field("約定日期", "committedDate", milestone?.committedDate, "date") + field("實際發生日期", "actualDate", milestone?.actualDate, "date") + field("說明／日期變更原因", "note", milestone?.note, "textarea"), "儲存日期", values => {
          const title = requiredValue(values, "title", "請填寫事件名稱"), actualDate = textValue(values, "actualDate");
          if (actualDate > localISODate()) throw new Error("實際日期不能在未來，請填入預計或約定日期");
          const updated = { title, plannedDate: textValue(values, "plannedDate"), committedDate: textValue(values, "committedDate"), actualDate, note: textValue(values, "note") };
          if (milestone) Object.assign(milestone, updated); else task.milestones.push({ id: uid("milestone"), ...updated });
          record(data, task, `重要日期：${title}`, `預計 ${updated.plannedDate || "未排定"} / 約定 ${updated.committedDate || "未排定"} / 實際 ${actualDate || "尚未發生"} / ${updated.note}`);
        });
    }
    if (name === "remove-step") { const item = task.checklist.find(step => step.id === itemId); task.checklist = task.checklist.filter(step => step.id !== itemId); record(data, task, "移除步驟", item?.title || ""); return commit("步驟已移除，歷程已保留"); }
    if (name === "request" || name === "edit-request") return requestForm(data, task, task.requests.find(request => request.id === itemId));
    if (name === "send") return sendForm(data, task, task.requests.find(request => request.id === itemId));
    if (name === "reply") return replyForm(data, task, task.requests.find(request => request.id === itemId));
    if (name === "cancel-request") {
      const request = task.requests.find(item => item.id === itemId);
      return form("結束這筆資料往來", "例如已改用其他資料，或這項要求不再需要。保留所有往返紀錄。", field("結束原因", "result", "", "textarea", true), "結束往來", values => {
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
      record(data, task, "取消資料關聯", file.name); return commit("已從工作移除；原始資料與歷次送出紀錄保留");
    }
    if (name === "version") {
      const file = data.files.find(item => item.id === itemId);
      return versionForm(data, task, file);
    }
    if (name === "condition") return form("設定交付條件", "選擇哪項工作必須先完成，以及會影響哪一步。",
      select("適用階段", "phase", Object.entries(phaseNames), "deliver") + select("須先完成的工作", "workId", [["", "請選擇工作"], ...data.tasks.filter(item => item.id !== task.id).map(item => [item.id, item.title])]) + field("最晚取得日（若已知）", "latest", "", "date"), "設定條件", values => {
        const workId = requiredValue(values, "workId", "請選擇工作"), phase = textValue(values, "phase");
        if (hasPath(data, workId, task.id)) throw new Error("這兩項工作會互相等待，請選擇其他前置工作");
        if (task.conditions.some(item => item.workId === workId && item.phase === phase)) throw new Error("這個條件已存在");
        if (phase === "start" && task.status !== "queue") throw new Error("工作已開始，請設定真正受到影響的送出確認或交付的條件");
        task.conditions.push({ id: uid("condition"), workId, phase, latest: textValue(values, "latest") }); record(data, task, "設定交付條件", `${phaseNames[phase]}前取得 ${data.tasks.find(item => item.id === workId).title}`);
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
    const legacyParent = params.get("parent");
    if (!params.get("record") && workspaceData[routeProject]?.tasks.some(task => task.id === legacyParent)) {
      params.delete("parent"); params.set("record", legacyParent);
      history.replaceState(history.state, "", "#" + params);
    }
    const legacyNode = params.get("node");
    if (legacyNode) { const found = getNode(legacyNode); if (found) return openWork(found.project.id, found.node.linkedTaskId); }
    const result = oldRoute();
    const position = history.state?.returnScroll;
    if (position?.timelineOrigin) requestAnimationFrame(() => {
      workTimeline.restore(position.timelineOrigin, position.child);
      if (routeProject) projectRoomContent.scrollTop = position.room;
      window.scrollTo({top:position.page, behavior:"instant"});
    });
    else if (position && routeProject) requestAnimationFrame(() => {
      if (uiState.projectId !== routeProject) return;
      const origin = position.listOrigin;
      if (origin) return lists.focusRow(origin.request,origin.row,position);
      const row = projectRoomContent.querySelector(`[data-delivery-action="open"][data-work="${CSS.escape(position.child)}"]`);
      row?.focus({preventScroll:true});
      projectRoomContent.scrollTop = position.room;
      window.scrollTo({top:position.page, behavior:"instant"});
    });
    return result;
  };
  window.removeEventListener("popstate", oldRoute);
  window.addEventListener("popstate", routeFromLocation);
  document.querySelector(".map-legend").innerHTML = `<span>交付目標</span><span>→ 主要工作</span><span>→ 子工作</span><span><i class="chron-mark plan"></i>預計交付</span><span><i class="legend-mark current"></i>進行中的工作</span>`;
  document.querySelector(".map-note p").textContent = "雙指或滾輪縮放，拖曳畫布移動。點工作名稱可查看進度，＋ 展開子工作。點目標上的交付日期可查看案件時間軸。";
  const lists = createRequirementLists({form, field, select, action, uid, record, normalize, artifactFields, withArtifacts, saved:alreadySaved, dialog});
  saveWorkspaceData(); routeFromLocation();
  // Explicit model API for regression checks; all mutations still go through the same functions.
  window.deliveryModel = { normalize, children, descendants, summary, blockers, transition, hasPath, record };
})();
