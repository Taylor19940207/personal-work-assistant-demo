// Read-only calendar projection. A recorded event and an agreed date can share a day.
const workTimeline = (() => {
  const e = escapeHTML;
  const dayMs = 86400000;
  const labels = { actual: "已發生", current: "現況", plan: "預定", issue: "問題／退回" };
  const states = new Map();
  const scopes = new Map();
  const iso = day => new Date(day * dayMs).toISOString().slice(0, 10);
  const short = day => iso(day).slice(5).replace("-", "/");
  function dayOf(value) {
    if (!value) return null;
    let s = String(value);
    if (s.includes("T")) {
      const date = new Date(s);
      if (!Number.isFinite(+date)) return null;
      s = localISODate(date);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const day = Date.parse(s + "T00:00:00Z") / dayMs;
    return Number.isFinite(day) && iso(day) === s ? day : null;
  }
  function collect(project, focus, today) {
    const data = workspaceData[project.id], events = [];
    function add(task, value, kind, title, note = "", target = {}) {
      const day = dayOf(value);
      if (day !== null) events.push({ project, task, day, kind, title, note, ...target });
    }
    if (!focus) {
      if (data.lifecycle !== "completed") add(null, data.deadlineDate, "plan", "預計對外交付", data.goal.title);
      const deliveries = (data.goal.history || []).filter(row => row.action === "accept");
      for (const row of deliveries) add(null, row.date || row.at, "actual", "已對外交付", [row.recipient, row.result].filter(Boolean).join(" · "), {refs:row.artifacts});
      if (!deliveries.length) add(null, data.goal.acceptedAt, "actual", "已對外交付", data.goal.title);
    }
    for (const task of focus ? [focus] : data.tasks) {
      const put = (value, kind, title, note, target) => add(task, value, kind, title, note, target);
      const active = task.status !== "done";
      if (active) put(task.due, "plan", task.title, "工作期限");
      else put(task.completedAt, "actual", "工作已完成", task.completionNote);
      if (data.lifecycle !== "completed" && data.lifecycle !== "archived" && ["doing","review"].includes(task.status)) {
        const waiting = task.requests.filter(r => ["waiting","revise","checking"].includes(r.state));
        const detail = waiting.map(r => (r.state === "checking" ? "待核對" : r.state === "revise" && r.direction !== "inbound" ? "需修改" : "等候") + " · " + [r.person, r.title].filter(Boolean).join(" · "));
        const status=data.lifecycle==="paused" ? "案件暫緩" : task.status === "review" ? "待確認" : "進行中";
        put(iso(today), "current", status, detail.join("／") || task.detail);
      }
      for (const m of task.milestones) {
        const target = {route:"open-milestone", item:m.id};
        if (m.actualDate) put(m.actualDate, "actual", m.title, m.note, target);
        else put(m.committedDate || m.plannedDate, "plan", m.title, m.committedDate ? "已約定" : "預計", target);
      }
      for (const r of task.requests) {
        const target = {route:"open-request", item:r.id};
        if (!["accepted","cancelled","checking"].includes(r.state)) {
          const due = r.state === "waiting" ? r.expectedDate || r.due : r.due;
          if (due && !(r.assignment && due === task.due)) put(due, "plan", r.title, [r.person, "約定日期"].filter(Boolean).join(" · "), target);
          if (r.followOn && r.followOn !== due) put(r.followOn, "plan", "跟進 · " + r.title, r.person, target);
        }
        for (const [i, round] of (r.rounds || []).entries()) {
          const who = [round.person || r.person, "第 " + (i+1) + " 輪"].filter(Boolean).join(" · ");
          const received = r.direction === "inbound";
          put(round.sentDate, "actual", (received ? "已提出 · " : "已送出 · ") + r.title, who, {...target, refs:received ? [] : round.artifacts});
          put(round.receivedDate, "actual", "已收到 · " + r.title, who, {...target, refs:round.artifacts});
          const reply = {revise:"退回修改", accepted:"已確認", cancelled:"已結束"}[round.state];
          if (reply) put(round.replyDate || round.repliedAt, round.state === "revise" ? "issue" : "actual", reply + " · " + r.title, [who,round.reply].filter(Boolean).join(" · "), {...target, refs:round.artifacts});
        }
      }
      for (const r of task.reviewRounds) {
        put(r.sentAt, "actual", "送出確認", r.person);
        if (r.state === "waiting") put(r.expectedDate, "plan", "預計回覆", r.person);
        put(r.repliedAt, r.state === "revise" ? "issue" : "actual", r.state === "revise" ? "退回修改" : "已回覆", r.reply);
      }
      if (task.listOutput) put(task.listOutput.at, "actual", "已交回工作結果", task.listOutput.note, {refs:task.listOutput.refs});
      for (const step of task.checklist) if (!step.done) put(step.due, "plan", step.title, "待辦期限");
      for (const h of task.history) {
        if (!h.title) continue;
        const previousCompletion=h.title.endsWith("→ 已完成") && (!task.completedAt || dayOf(h.at || h.date)!==dayOf(task.completedAt));
        if (previousCompletion || ["工作紀錄","更新現況","完成步驟","重新開啟步驟","設定指派","改派工作"].includes(h.title) || h.title.startsWith("跟進「") || h.title.includes(" → ") && !h.title.endsWith("已完成"))
          put(h.at || h.date, "actual", h.title, h.detail);
      }
    }
    for (const issue of data.issues) {
      const task = data.tasks.find(t => t.id === issue.taskId);
      if (!focus || focus.id === task?.id) add(task, issue.date, "issue", issue.title, "記錄問題", {issue:issue.id});
    }
    for (const decision of data.decisions) {
      const issue = data.issues.find(row => row.id === decision.issueId);
      const task = data.tasks.find(row => row.id === issue?.taskId);
      if (!focus || focus.id === task?.id) add(task, decision.date, "actual", "決策 · " + decision.title, decision.detail, {record:issue?.id || decision.id, tab:"records"});
    }
    for (const entry of data.activity) {
      // Task and request transitions above already have their own dated source.
      if (entry.kind !== "note" && !entry.id.startsWith("activity-resolve-")) continue;
      const task = data.tasks.find(row => row.id === entry.taskId);
      if (focus && task?.id !== focus.id) continue;
      const refs = entry.versionId ? [{documentId:entry.documentId, versionId:entry.versionId}] : [];
      add(task, entry.date, "actual", entry.title, entry.detail, {refs,record:entry.id,tab:"activity"});
    }
    return events;
  }

  function render(projects, scope = "all", focus = null) {
    const today = dayOf(localISODate());
    const key = scope + "/" + (focus?.id || "") + (scope === "all" ? "/" + (uiState.focusProjectId || "") : "");
    const events = projects.flatMap(p => collect(p,focus,today));
    const p = projects[0], rows = [];
    const byLane=new Map();
    for (const ev of events) {
      const lane=scope==="all" ? ev.project : ev.task || null;
      if (!byLane.has(lane)) byLane.set(lane,[]);
      byLane.get(lane).push(ev);
    }
    if (scope === "all") {
      for (const project of projects) rows.push({name:project.name, sub:workspaceData[project.id].goal.title, project, events:byLane.get(project) || []});
    } else if (focus) {
      for (const [name,kinds] of [["工作進展",["actual","issue"]],["目前狀態",["current"]],["接下來",["plan"]]]) {
        const group = events.filter(ev => kinds.includes(ev.kind));
        if (group.length) rows.push({name,project:p,events:group});
      }
      if (!events.length) return "";
    } else {
      const goal = byLane.get(null) || [];
      if (goal.length) rows.push({name:"案件交付與紀錄",project:p,events:goal});
      for (const task of workspaceData[p.id].tasks) rows.push({name:task.title,sub:boardColumns.find(c=>c.id===task.status)?.label, project:p, task, events:byLane.get(task) || []});
    }
    const meta = {scope,focus,rows,events,today,key};
    scopes.set(key,meta);
    return '<section class="chron" data-chron="'+e(key)+'">'+chart(meta)+'</section>';
  }
  function chart(meta) {
    const {scope,focus,rows,events,today,key} = meta;
    const state = states.get(key) || {mode:"all",anchor:today,selected:null};
    states.set(key,state);
    const title = focus ? "工作時間軸" : scope === "all" ? "全局時間軸" : "案件時間軸";
    if (!events.length) return '<h3>'+title+'</h3><p class="chron-empty">有工作進度或交付日期後，就會出現在這裡。</p>';
    let start = today, end = today;
    for (const ev of events) { start = Math.min(start,ev.day); end = Math.max(end,ev.day); }
    if (state.mode === "week") {start = state.anchor - (new Date(state.anchor*dayMs).getUTCDay()+6)%7; end = start+6;}
    else if (end-start < 6) { start -= Math.floor((6-(end-start))/2); end=start+6; }
    const span = end-start+1;
    const surface = scope === "all" ? listView : projectRoomContent;
    const width = surface.clientWidth || window.innerWidth;
    const plotWidth = width < 660 ? width - 42 : width * .8 - 48;
    const maxColumns = Math.max(3, Math.min(14, Math.floor(plotWidth / 94)));
    const step = state.mode === "week" ? 1 : Math.ceil(span / maxColumns);
    const count = Math.ceil(span/step);
    // A bin number is meaningful only on the same scale and for the same lane.
    const layout = [start, step, ...rows.map(row => row.task?.id || row.project.id + row.name)].join("|");
    if (layout !== state.layout) state.selected = null;
    state.layout = layout;
    const groupIndex = ev => Math.floor((ev.day-start)/step);
    const bins = Array.from({length:count},()=>[]);
    for (const ev of events) if (ev.day>=start && ev.day<=end) bins[groupIndex(ev)].push(ev);
    const peak = Math.max(1,...bins.map(b=>b.length));
    const dateLabel = i => step===1 ? short(start+i) : short(start+i*step)+"–"+short(Math.min(end,start+(i+1)*step-1));
    const todayCol = Math.floor((today-start)/step);
    const modes = '<div class="chron-switch">'+[["all","全期"],["week","逐週"]].map(([mode,label])=>'<button type="button" data-chron-mode="'+mode+'" aria-pressed="'+(mode===state.mode)+'">'+label+'</button>').join("")+'</div>';
    const legend = Object.entries(labels).map(([kind,label])=>'<span><i class="chron-mark '+kind+'"></i>'+label+'</span>').join("");
    const btn = (name,label,aria=label)=>'<button type="button" data-chron-nav="'+name+'" aria-label="'+aria+'">'+label+'</button>';
    const plot = (html,extra="")=>'<div class="chron-plot '+extra+'">'+(todayCol>=0 && todayCol<count ? '<i class="chron-today" style="--col:'+todayCol+'"></i>' : '')+html+'</div>';
    const axis = bins.map((b,i)=>{
      const from = start+i*step, to = Math.min(end, from+step-1);
      const text = to === from ? short(from) : short(from) + "–" + (iso(from).slice(0,7) === iso(to).slice(0,7) ? iso(to).slice(-2) : short(to));
      const inner = (i===todayCol ? '<em>'+(step===1 ? '今天' : '含今天')+'</em>' : '')+'<span class="chron-period">'+text.replace('–','<wbr>–')+'</span><i style="height:'+Math.round(2+18*b.length/peak)+'px"></i>';
      return b.length ? '<button type="button" class="chron-tick" data-chron-bin="'+i+'" aria-label="'+dateLabel(i)+'，'+b.length+' 項">'+inner+'</button>' : '<span class="chron-tick">'+inner+'</span>';
    }).join("");
    const selection = state.selected;
    function details(events, i, row) {
      if (!selection || selection.i!==i || selection.row!==row || !events.length) return "";
      const items=[...events].sort((a,b)=>a.day-b.day);
      const weekLink=step>1 ? `<button type="button" data-chron-week="${items[0].day}">查看 ${short(items[0].day)} 該週</button>` : "";
      return '<div class="chron-detail"><header><strong>'+dateLabel(i)+' · '+items.length+' 項</strong><span>'+weekLink+'<button type="button" data-chron-close aria-label="收起事件">收起 ×</button></span></header>'+items.map(ev=>{
        const work = ev.task;
        const route = ev.record ? 'data-open-project-tab="'+ev.tab+'" data-project-id="'+e(ev.project.id)+'" data-record-id="'+e(ev.record)+'"' : ev.issue ? 'data-open-project-tab="records" data-project-id="'+e(ev.project.id)+'" data-record-id="'+e(ev.issue)+'"' : work ? 'data-delivery-action="'+(ev.route || "open")+'" data-project="'+e(ev.project.id)+'" data-work="'+e(work.id)+'" data-item="'+e(ev.item || "")+'"' : 'data-open-project="'+e(ev.project.id)+'"';
        const context=[scope==="all" && ev.project.name,work?.title,ev.note].filter(Boolean).join(" · ");
        const links=(ev.refs || []).map(ref=>{
          const docId=ref.documentId || workspaceData[ev.project.id].files.find(f=>f.id===ref.fileId)?.documentId;
          const version=docId && documentModel.find(docId)?.versions.find(v=>v.id===ref.versionId);
          if (!version) return "";
          if (version.blobId) return '<button type="button" class="chron-file" data-workspace-action="open-file" data-file="'+e(docId)+'" data-version="'+e(version.id)+'">'+e(ref.name || version.name)+' ↗</button>';
          const url=normalizeExternalUrl(version.url || "");
          return url ? '<a class="chron-file" rel="noopener noreferrer" target="_blank" href="'+e(url)+'">'+e(ref.name || version.name)+' ↗</a>' : "";
        }).join("");
        const body='<time>'+iso(ev.day)+'</time><i class="chron-mark '+ev.kind+'"></i><span><strong>'+e(ev.title)+'</strong><small>'+e(context)+'</small></span>';
        const actionable=ev.record || ev.issue || ev.item || (!focus && (work || scope==="all"));
        return '<div class="chron-event">'+(actionable ? '<button type="button" '+route+'>'+body+'<b>↗</b></button>' : '<div>'+body+'</div>')+links+'</div>';
      }).join("")+'</div>';
    }
    const lines=rows.map((row,index)=>{
      const groups=new Map();
      for (const ev of row.events) {
        if (ev.day<start || ev.day>end) continue;
        const i=groupIndex(ev);
        if (!groups.has(i)) groups.set(i,[]);
        groups.get(i).push(ev);
      }
      const positions=[...groups.keys()].sort((a,b)=>a-b);
      const first=positions[0],last=positions.at(-1);
      const zone=last>first ? Math.max(0, Math.min(100, (todayCol-first)/(last-first)*100)) : 0;
      const line=positions.length>1 ? '<i class="chron-line" style="--past:'+zone+'%;left:'+((first+.5)/count*100)+'%;width:'+((last-first)/count*100)+'%"></i>' : '';
      const marks=positions.map((i,nextIndex)=>{
        const entries=groups.get(i).sort((a,b)=>a.day-b.day);
        const visible=entries.slice(0,3);
        const room=Math.min(3,(positions[nextIndex+1] ?? count)-i);
        const branches = visible.map(ev => {
          const caption = ev.kind === "current" && ev.task ? ev.task.title : ev.title;
          return `<span class="chron-branch"><i class="chron-mark ${ev.kind}"></i><small>${e(caption)}</small></span>`;
        }).join("");
        const overflow = entries.length - visible.length;
        const more = overflow ? `<span class="chron-more">+${overflow} 項</span>` : "";
        const name = dateLabel(i) + " · " + row.name + " · " + entries.map(ev => ev.title).join("、");
        const selected = selection?.i === i && selection.row === index;
        return `<button type="button" class="chron-node" style="grid-column:${i+1} / span ${room};--room:${room}" data-chron-bin="${i}" data-chron-row="${index}" aria-label="${e(name)}" aria-expanded="${selected}">${branches}${more}</button>`;
      }).join("");
      const text='<strong>'+e(row.name)+'</strong>'+(row.sub ? '<small>'+e(row.sub)+'</small>' : '');
      const route=scope==="all" ? 'data-open-project="'+e(row.project.id)+'"' : row.task ? 'data-delivery-action="open" data-work="'+e(row.task.id)+'" data-project="'+e(row.project.id)+'"' : "";
      const color=/^#[0-9a-f]{6}$/i.test(row.project.color) ? row.project.color : "#83e8d3";
      const label=route ? '<button type="button" class="chron-label" '+route+'>'+text+'</button>' : '<div class="chron-label">'+text+'</div>';
      return '<div class="chron-row" style="--lane-color:'+color+'">'+label+plot(line+marks+(!marks ? '<small class="chron-none">'+(row.events.length ? '本週無事件' : '尚無日期')+'</small>' : ''))+'</div>'+(selection?.row===index ? details(groups.get(selection.i)||[],selection.i,index) : "");
    }).join("");
    const allDetails=selection?.row===-1 ? details(bins[selection.i]||[],selection.i,-1) : "";
    return '<header class="chron-head"><div><h3>'+title+'</h3><time>'+iso(start).replaceAll("-",".")+' — '+iso(end).replaceAll("-",".")+'</time></div>'+modes+'</header><div class="chron-toolbar"><div class="chron-legend">'+legend+'</div>'+(state.mode==="week" ? '<div class="chron-nav">'+btn("prev","‹","上一週")+btn("now","本週")+btn("next","›","下一週")+'</div>' : '')+'</div><div class="chron-grid" style="--cols:'+count+'"><div class="chron-row chron-axis"><div class="chron-label"><small>日期分布</small></div>'+plot(axis)+'</div>'+allDetails+lines+'</div>';
  }
  document.addEventListener("click", event=>{
    const control=event.target.closest("[data-chron-mode],[data-chron-nav],[data-chron-close],[data-chron-week],[data-chron-bin]");
    if (!control) return;
    const root=control.closest("[data-chron]"), meta=scopes.get(root.dataset.chron), state=states.get(meta.key);
    const previous = state.selected;
    const d=control.dataset;
    // Replacing a long detail above the clicked row removes height from the
    // scroll surface. Keep the incoming control at its previous screen position.
    const top = control.getBoundingClientRect().top;
    let focusSelector;
    if (d.chronBin!==undefined) {
      const next={i:Number(d.chronBin),row:Number(d.chronRow??-1)};
      state.selected=state.selected?.i===next.i && state.selected.row===next.row ? null : next;
      focusSelector='[data-chron-bin="'+next.i+'"]'+(next.row===-1 ? ':not([data-chron-row])' : '[data-chron-row="'+next.row+'"]');
    } else if (d.chronClose!==undefined) {
      const prev=state.selected;
      focusSelector='[data-chron-bin="'+prev.i+'"]'+(prev.row===-1 ? ':not([data-chron-row])' : '[data-chron-row="'+prev.row+'"]');
      state.selected=null;
    } else {
      if (d.chronWeek) {
        state.mode="week";
        state.anchor=Number(d.chronWeek);
        focusSelector='[data-chron-mode="week"]';
      }
      if (d.chronMode) {state.mode=d.chronMode;focusSelector='[data-chron-mode="'+d.chronMode+'"]';}
      if (d.chronNav) {state.anchor=d.chronNav==="now" ? meta.today : state.anchor+(d.chronNav==="prev"?-7:7);focusSelector='[data-chron-nav="'+d.chronNav+'"]';}
      state.selected=null;
    }
    root.innerHTML=chart(meta);
    const nextControl = root.querySelector(focusSelector);
    nextControl?.focus({preventScroll:true});
    if (d.chronBin !== undefined && nextControl) {
      if (previous && previous.row < Number(d.chronRow ?? -1)) {
        const surface = meta.scope === "all" ? listView : projectRoomContent;
        const scroller = surface.scrollHeight > surface.clientHeight ? surface : document.scrollingElement;
        if (scroller) scroller.scrollTop += (nextControl.getBoundingClientRect().top - top) / appLayoutScale();
      }
      if (state.selected) root.querySelector(".chron-detail > header")?.scrollIntoView({block:"nearest", behavior:"instant"});
    } else if (d.chronClose !== undefined) {
      nextControl?.scrollIntoView({block:"nearest", behavior:"instant"});
    }
  });
  return {render};
})();
