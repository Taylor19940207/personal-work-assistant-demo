function workUsesFile(task, fileId) {
  const includes = refs => refs?.some(ref => ref.fileId === fileId);
  return includes(task.listOutput?.refs) || (task.requests || []).some(req =>
    includes(req.unfiled) || req.items?.some(item => includes(item.refs) || item.history?.some(entry=>includes(entry.refs))) ||
    req.rounds?.some(round => includes(round.artifacts)));
}
// A list belongs to one request. Its rows describe expected results, separately from filenames.
function createRequirementLists({ form, field, select, action, uid, record, normalize, artifactFields, withArtifacts, saved, dialog }) {
  const e = escapeHTML;
  const statuses = { missing: "待準備", checking: "待核對", revise: "待補件", ready: "已備妥" };
  const opened = new Set(), readyOpened = new Set();
  function names(text) { return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean); }
  function newRows(text) {
    return names(text).map(title => ({id:uid("item"), title, state:"missing", note:"", refs:[]}));
  }
  function fields() {
    return field("清單項目（每行一項，可貼上多行）", "itemNames", "", "textarea") +
      '<details class="d-work-options"><summary>清單名稱、往來對象與期限</summary><div>' +
      field("清單名稱", "listTitle") + field("提交對象", "listPerson") + field("清單期限", "listDue", "", "date") + '</div></details>';
  }
  function create(task, values) {
    const items = newRows(values.get("itemNames") || "");
    if (!items.length) return;
    const list = {id:uid("request"),title:values.get("listTitle")?.trim() || "準備清單",
      person:values.get("listPerson")?.trim() || "",due:values.get("listDue") || "",state:"preparing",direction:"outbound",rounds:[],items};
    task.requests ||= []; task.requests.push(list); opened.add(list.id);
    return list;
  }
  function uniq(refs) { return [...new Map(refs.map(ref => [ref.fileId + "/" + ref.versionId,ref])).values()]; }
  function workResult(work) {
    if (!work) return null;
    const handoff = work.requests?.find(req => req.assignment)?.rounds.at(-1);
    const received = handoff?.receivedDate && handoff.state !== "revise" ? {id:handoff.id,refs:handoff.artifacts || [],note:handoff.note || "",at:handoff.recordedAt,receivedDate:handoff.receivedDate} : null;
    if (work.listOutput && (!received || work.listOutput.at >= received.at)) return work.listOutput;
    return received;
  }
  function rowView(data,item) {
    const source = data.tasks.find(work => work.id === item.sourceId);
    const output = workResult(source);
    const changed = Boolean(item.sourceId && (output?.id || "") !== (item.seenOutput || ""));
    const state = changed ? output ? "checking" : "missing" : item.state;
    return {source, output, state, refs:uniq([...(item.refs || []), ...(output?.refs || [])])};
  }
  function itemSnapshot(data,item) {
    const view=rowView(data,item);
    return {itemId:item.id,title:item.title,note:[item.note,view.output?.note].filter(Boolean).join(" · "),
      sourceId:item.sourceId || "",outputId:view.output?.id || "",approvalId:item.approvalId || "",artifacts:structuredClone(view.refs)};
  }
  function submitted(req,snapshot) {
    const previous=req.rounds.flatMap(round=>round.items || []).findLast(entry=>entry.itemId===snapshot.itemId);
    return previous && JSON.stringify(previous)===JSON.stringify(snapshot);
  }
  function stats(data,req) { return req.items.filter(item => rowView(data,item).state === "ready").length; }
  function nextItem(data, req) {
    const rows = req.items.map(item => ({ item, ...rowView(data, item) }));
    return rows.find(row => row.state === "checking" && row.output)
      || rows.find(row => row.state === "checking")
      || rows.find(row => row.state === "revise")
      || rows.find(row => row.state === "missing" && !row.source)
      || rows.find(row => row.state === "missing");
  }
  function refButton(data,ref,context="") {
    const file = data.files.find(f => f.id === ref.fileId);
    const v = file?.versions.find(v => v.id === ref.versionId);
    const label = e(ref.name || v?.name || "附件") + " · " + e(ref.versionLabel || (v ? "v"+(file.versions.indexOf(v)+1) : "已存版本"));
    if (v?.blobId) return `<button type="button" class="d-action" data-workspace-action="open-file" data-file="${e(file.documentId)}" data-version="${e(v.id)}" data-preview-context="${e(context)}">${label}</button>`;
    if (v?.url && /^https?:\/\//i.test(v.url)) return `<a href="${e(v.url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
    return `<span>${label}</span>`;
  }
  function card(data,task,req) {
    const count = stats(data,req);
    const sendable=req.items.filter(item=>rowView(data,item).state==="ready" && !submitted(req,itemSnapshot(data,item))).length;
    const button = (label,name,item="") => action(label,"list-"+name,task.id,`data-item="${e(req.id)}" data-row="${e(item)}"`);
    const dueRows=[], readyRows=[];
    for (const item of req.items) {
      const {state,source,output,refs} = rowView(data,item);
      const hint = [state==="ready" && submitted(req,itemSnapshot(data,item)) ? "已提交" : "",item.note,source && (output ? "來自" : "等") + "「" + source.title + "」",output?.note,item.stepId && task.checklist.find(s=>s.id===item.stepId && !s.done)?.title,refs.length ? refs.length + " 份資料" : ""].filter(Boolean).join(" · ");
      const context = [task.title,req.title,item.title].join(" / ");
      const files = refs.map(ref=>refButton(data,ref,context)).join(" ");
      const documents = refs.length > 1 ? `<details class="rl-files"><summary>查看 ${refs.length} 份資料</summary>${files}</details>` : files;
      const visit = source ? action("查看「"+e(source.title)+"」的進度 ↗","list-visit",task.id,`data-item="${e(req.id)}" data-row="${e(item.id)}"`) : "";
      const row = `<div class="rl-row"><button type="button" class="rl-item" data-delivery-action="list-item" data-work="${e(task.id)}" data-item="${e(req.id)}" data-row="${e(item.id)}"><strong>${e(item.title)}</strong><span data-state="${e(state)}">${statuses[state]}</span>${hint ? "<small>"+e(hint)+"</small>" : ""}</button>${documents || visit ? `<div class="rl-row-actions">${documents}${visit}</div>` : ""}</div>`;
      (state==="ready" ? readyRows : dueRows).push(row);
    }
    const rows=dueRows.join("")+(readyRows.length ? `<details class="rl-ready" data-ready-list="${e(req.id)}" ${readyOpened.has(req.id) ? "open" : ""}><summary>查看已備妥項目 · ${readyRows.length}</summary>${readyRows.join("")}</details>` : "");
    const history = req.rounds.map((round,i)=>`<details><summary>第 ${i+1} 次提交 · ${e(round.sentDate)} · ${e(round.person)}</summary>${round.items ? "" : e(round.note || "")+" "+(round.artifacts || []).map(ref=>refButton(data,ref)).join(" ")}${(round.items || []).map(s=>`<p><strong>${e(s.title)}</strong> ${e(s.note)} ${s.artifacts.map(ref=>refButton(data,ref)).join(" ")}</p>`).join("")}</details>`).join("");
    return `<details class="rl-list" data-request-id="${e(req.id)}" data-list-disclosure ${opened.has(req.id) ? "open" : ""}><summary><strong>${e(req.title)}</strong><span>${count}/${req.items.length} 項已備妥</span></summary><p class="d-help">${e([req.person && "提交對象：" + req.person, req.due && "清單期限 " + req.due,req.state==="waiting"?"上次提交待確認":req.state==="accepted"?"已確認":""].filter(Boolean).join(" · "))}</p>${rows}
      ${req.unfiled?.length ? button("整理未分類的檔案 · "+req.unfiled.length,"unfiled") : ""}<div class="d-actions">${button("加入項目","append")}${button("加入多個檔案","batch")}${button("清單設定","settings")}
      ${req.state==="waiting" ? button("記錄對方確認","confirm") : sendable ? button("記錄提交","submit") : ""}</div>${history}</details>`;
  }
  document.addEventListener("toggle",event=>{
    const el=event.target;
    if (!el.isConnected) return;
    if (el.matches?.("[data-ready-list]")) {
      if (el.open) readyOpened.add(el.dataset.readyList); else readyOpened.delete(el.dataset.readyList);
    }
    if (el.matches?.("[data-list-disclosure]")) {
      if(el.open) opened.add(el.dataset.requestId); else opened.delete(el.dataset.requestId);
    }
  },true);
  function editable(req) { if (req.state === "waiting" || req.state === "accepted") req.state="preparing"; }
  function addList(data,task) {
    form("加入清單",e(task.title),fields(),"建立清單",values=>{
      if (!create(task,values)) throw Error("請至少填一項");
      record(data,task,"加入清單",task.requests.at(-1).title);
    });
  }
  function pin(file) {
    const v=documentModel.current(file);
    return {fileId:file.id,versionId:v.id,name:v.name,versionLabel:"v"+(file.versions.indexOf(v)+1)};
  }
  function rowForm(data,task,req,item) {
    const {source,state}=rowView(data,item);
    const currentId = item.sourceId || "";
    const candidates = data.tasks.filter(work => work.id !== task.id && !related(data, work.id, task.id));
    const choices = [["", currentId ? "改為自行準備" : "自行準備"]];
    for (const work of candidates) choices.push([work.id, work.title]);
    if (currentId && !candidates.some(work => work.id === currentId)) choices.push([currentId, source?.title || "原工作已移除"]);
    const delegateValue = "@new-assignment";
    if (!currentId) choices.push([delegateValue, "新增工作並指派…"]);
    const activeStep = task.checklist.find(step => step.id === item.stepId && !step.done);
    const history = item.history?.length ? '<details><summary>項目紀錄 · '+item.history.length+'</summary>'+item.history.slice().reverse().map(entry=>
      '<p>'+e(entry.date)+' · '+e(statuses[entry.state])+' · '+e(entry.note)+'</p>'+entry.refs.map(ref=>refButton(data,ref)).join(" ")).join("")+'</details>' : "";
    const replace = item.refs.length ? select("檔案用途","replace",[["","加入另一份資料"],...item.refs.map(ref=>[ref.fileId,"更新 "+ref.name])],"") : "";
    form(e(item.title),e([task.title,req.title].join(" / ")),
      '<div data-link-preview aria-live="polite"></div>' +
      select("目前狀態","rowState",Object.entries(statuses),state) +
      field("核對或補件說明（選填）","rowNote",item.note,"textarea") +
      select("來源工作（選填）", "source", choices, currentId) +
      '<div data-new-assignment hidden>'+field("負責人","assignee")+field("交回日期（選填）","due","","date")+'</div>' +
      '<details class="d-work-options"><summary>加入文件或網址</summary><div>'+artifactFields(data,task)+replace+field("來源網址","rowUrl","","url")+
      ((item.refs || []).length ? '<fieldset><legend>保留的附件</legend>'+item.refs.map((ref,i)=>`<label class="d-check"><input type="checkbox" name="keep" value="${i}" checked><span>${e(ref.name)} · ${e(ref.versionLabel)}</span></label>`).join("")+'</fieldset>' : "")+'</div></details>'+
      history + '<details class="d-work-options"><summary>修改項目名稱</summary>'+field("名稱","rowTitle",item.title,"text",true)+action("移除項目","list-remove",task.id,'data-item="'+e(req.id)+'" data-row="'+e(item.id)+'"')+'</details>'+
      (activeStep ? '<p>我的待辦 · '+e(activeStep.title)+'</p>' :
        '<details class="d-work-options"><summary>新增個人待辦</summary>'+field("待辦事項","step")+'</details>'),
      "儲存",values=>{
        const selectedId = values.get("source");
        const delegate = selectedId === delegateValue;
        const newSource = candidates.find(work => work.id === selectedId) || (selectedId === currentId ? source : null);
        if (selectedId && !delegate && !newSource && selectedId !== currentId) throw Error("請重新選擇工作");
        const assignee = delegate ? values.get("assignee").trim() : "";
        if (delegate && !assignee) throw Error("請填負責人");
        const linkedOutput = workResult(newSource);
        const sourceChanged = selectedId !== currentId;
        const stepTitle = (values.get("step") || "").trim();
        const url=String(values.get("rowUrl")||"").trim();
        if(url && !/^https?:\/\//i.test(url)) throw Error("請使用 http 或 https 網址");
        const title=values.get("rowTitle").trim(); if(!title) throw Error("請填項目名稱");
        let next=values.get("rowState"); const note=values.get("rowNote").trim();
        if(next==="revise" && !note) throw Error("請說明需要補件或修改的內容");
        if((newSource || delegate) && !linkedOutput && next==="ready") throw Error("請先至來源工作記錄交件，或選擇「自行準備」");
        const kept=values.getAll("keep").map(i=>item.refs[Number(i)]);
        const uploading=values.getAll("upload").some(f=>f.name);
        const replaceId=values.get("replace");
        if(replaceId && !uploading) throw Error("請選擇要上傳的新版本");
        const target=data.files.find(file=>file.id===replaceId);
        const context=target ? {fileId:target.id,baseVersionId:documentModel.current(target)?.id} : {};
        const selecting=values.getAll("artifact").length || values.getAll("libraryDocument").length;
        if(!sourceChanged && !stepTitle && !uploading && !selecting && !url && kept.length===item.refs.length && next===state && title===item.title && note===item.note) throw Error("目前沒有變更");
        return withArtifacts(data,task,values,added=>{
          if(url) added.push(pin(documentModel.source({url,projectId:uiState.projectId,kind:"task",id:task.id})));
          const updated=uniq([...kept.filter(old=>!added.some(ref=>ref.fileId===old.fileId && ref.versionId!==old.versionId)),...added]);
          const refsChanged=JSON.stringify(updated)!==JSON.stringify(item.refs || []);
          if(refsChanged && next===state && next!=="checking") next="checking";

          let linkedId = selectedId;
          if (delegate) {
            linkedId = uid("work");
            const due = values.get("due");
            data.tasks.push({id:linkedId,title,parentId:task.id,required:true,status:"queue",due,
              requests:[{id:uid("request"),assignment:true,direction:"inbound",state:"waiting",title,person:assignee,returnTo:"我",due,expectedDate:due,rounds:[]}]});
            normalize(data);
          }
          if (stepTitle) {
            item.stepId = uid("step");
            task.checklist.push({id:item.stepId,title:stepTitle,done:false});
          }
          const rowChanged = sourceChanged || title!==item.title || note!==item.note || refsChanged || next!==state;
          if (rowChanged) {
            Object.assign(item,{title,refs:updated,state:next,note,sourceId:linkedId,seenOutput:linkedOutput?.id || ""});
            if (next==="ready") item.approvalId=uid("approval");
            item.history ||= [];
            item.history.push({id:uid("row-event"),date:localISODate(),at:new Date().toISOString(),state:next,note,
              sourceId:linkedId,refs:structuredClone(uniq([...updated,...(linkedOutput?.refs || [])]))});
            editable(req);
          }
          const relationship = sourceChanged ? (source?.title || "自行準備")+" → "+(delegate ? title+"（"+assignee+"）" : newSource?.title || "自行準備") : "";
          record(data,task,item.title+" · "+statuses[next],[relationship,note,stepTitle && "待辦："+stepTitle].filter(Boolean).join(" · "));
        },context);
      }, () => focusRow(req.id,item.id));
    const editor = dialog.querySelector("form");
    const sourceField = editor.elements.source;
    const stateField = editor.elements.rowState;
    const submit = editor.querySelector('[type="submit"]');
    function preview() {
      const selected = sourceField.value;
      const delegate = selected === delegateValue;
      const work = data.tasks.find(work => work.id === selected);
      const result = workResult(work);
      const retained = item.refs.filter((_,i)=>editor.querySelector('[name="keep"][value="'+i+'"]')?.checked);
      const attachments = uniq([...retained,...(result?.refs || [])]);
      const message = delegate ? "" : work ? (result ? "交回結果" : "等待這項工作交回結果") :
        currentId ? "儲存後將改為自行準備" : candidates.length ? "" : "這個案件還沒有其他工作可選";
      editor.querySelector("[data-link-preview]").innerHTML =
        (message ? "<p>"+e(message)+(result?.note ? " · "+e(result.note) : "")+"</p>" : "")+
        attachments.map(ref=>refButton(data,ref,[task.title,req.title,item.title].join(" / "))).join(" ");
      const assignment = editor.querySelector("[data-new-assignment]");
      assignment.hidden = !delegate;
      editor.elements.assignee.disabled = !delegate;
      editor.elements.assignee.required = delegate;
      editor.elements.due.disabled = !delegate;
      stateField.querySelector('[value="ready"]').disabled = Boolean((work || delegate) && !result);
    }
    preview();
    function signature() {
      return JSON.stringify([...new FormData(editor)].map(([key,val])=>
        [key, val instanceof File ? [val.name,val.size,val.name ? val.lastModified : 0] : val]));
    }
    const initial = signature();
    function syncSave() {
      const missingAssignee = sourceField.value === delegateValue && !editor.elements.assignee.value.trim();
      submit.disabled = missingAssignee || signature() === initial;
    }
    sourceField.addEventListener("change", ()=>{
      const result = workResult(data.tasks.find(work => work.id === sourceField.value));
      const hasMaterial = result || (!sourceField.value && item.refs.length);
      const changedLinkState = hasMaterial ? "checking" : "missing";
      stateField.value = sourceField.value === currentId ? state : changedLinkState;
      preview(); syncSave();
    });
    editor.addEventListener("change",event=>{if(event.target.name==="keep") preview();syncSave();});
    editor.addEventListener("input",syncSave);
    syncSave();
  }
  function related(data,from,target,seen=new Set()) {
    if (from===target) return true;
    if(seen.has(from)) return false;
    seen.add(from);
    const work=data.tasks.find(x=>x.id===from);
    const dependencies = [
      ...(work?.requests || []).flatMap(req => (req.items || []).map(item => item.sourceId)),
      ...(work?.conditions || []).map(condition => condition.workId),
      ...data.tasks.filter(child => child.required && child.parentId === from).map(child => child.id)
    ];
    return dependencies.some(id => id && related(data,id,target,seen));
  }
  function focusRow(requestId,rowId,position) {
    const list = projectRoomContent.querySelector(`[data-request-id="${CSS.escape(requestId)}"]`);
    const row = list?.querySelector(`.rl-item[data-row="${CSS.escape(rowId)}"]`);
    if (!row) return;
    const opening = [];
    for (let el = row.parentElement; el && el !== list.parentElement; el = el.parentElement) {
      if (el.tagName === "DETAILS" && !el.open) {
        opening.push(el); el.classList.add("rl-restoring"); el.open = true;
      }
    }
    // Wait for the expanded row to accept focus and the mobile dialog to unlock scrolling.
    requestAnimationFrame(() => {
      if (!row.isConnected || document.querySelector("dialog[open]")) return;
      if (position) {
        projectRoomContent.scrollTop = position.room;
        window.scrollTo({top:position.page,behavior:"instant"});
      }
      const rect = row.getBoundingClientRect();
      const pane = projectRoomContent.getBoundingClientRect();
      const top = Math.max(0,pane.top,document.querySelector(".m-toolbar")?.getBoundingClientRect().bottom || 0);
      if (rect.top < top || rect.bottom > Math.min(innerHeight,pane.bottom)) row.scrollIntoView({block:"center",behavior:"instant"});
      row.focus({preventScroll:true});
      opening.forEach(el=>el.classList.remove("rl-restoring"));
    });
  }
  function resultCard(data,task) {
    const output = workResult(task);
    const recordOutput = action(output ? "再次交回工作結果" : "交回工作結果","list-output",task.id);
    if (!output) return recordOutput;
    const date = output.receivedDate ? "收件 "+output.receivedDate : output.at ? "登錄 "+localISODate(new Date(output.at)) : "";
    const files = (output.refs || []).map(ref=>refButton(data,ref,task.title+" / 交回結果")).join(" ");
    return `<section class="rl-result"><div class="d-section-title"><h3>交回結果</h3>${recordOutput}</div>${date ? `<small>${e(date)}</small>` : ""}${output.note ? `<p>${e(output.note)}</p>` : ""}${files}</section>`;
  }
  function outputForm(data,task){
    form("交回工作結果",e(task.title),artifactFields(data,task)+field("網址","url","","url")+field("結果說明","note","","textarea"),"記錄交回",values=>{
      const url=values.get("url").trim(),note=values.get("note").trim();
      if(url && !/^https?:\/\//i.test(url)) throw Error("請使用 http 或 https 網址");
      if(!url && !note && !values.getAll("artifact").length && !values.getAll("libraryDocument").length && !values.getAll("upload").some(f=>f.name)) throw Error("請選文件、填網址或記下結果");
      return withArtifacts(data,task,values,refs=>{
        if(url) refs.push(pin(documentModel.source({url,projectId:uiState.projectId,kind:"task",id:task.id})));
        task.listOutput={id:uid("output"),at:new Date().toISOString(),note,refs:uniq(refs)};
        record(data,task,"交回工作結果",note || refs.map(r=>r.name).join("、"));
      },{});
    });
  }
  function submitForm(data,task,req){
    const ready=req.items.filter(item=>rowView(data,item).state==="ready");
    if(!ready.length) return showToast("請先核對要提交的項目");
    const choices=ready.map(item=>`<label class="d-check"><input type="checkbox" name="submittedItem" value="${e(item.id)}" ${submitted(req,itemSnapshot(data,item)) ? "" : "checked"}><span>${e(item.title)}</span></label>`).join("");
    form("記錄提交",e(req.title),field("提交對象","recipient",req.person,"text",true)+field("實際提交日","date",localISODate(),"date",true)+
      '<fieldset><legend>本次送出的項目</legend>'+choices+'</fieldset>',"已提交",values=>{
      const date=values.get("date"),person=values.get("recipient").trim();
      if(!date || date>localISODate() || !person) throw Error("請確認對象與實際日期");
      const ids=new Set(values.getAll("submittedItem"));
      const items=req.items.filter(item=>ids.has(item.id)).map(item=>{
        if(rowView(data,item).state!=="ready") throw Error("工作結果已變更，請重新核對");
        return itemSnapshot(data,item);
      });
      if(!items.length) throw Error("請勾選本次實際送出的項目");
      req.rounds.push({id:uid("round"),state:"waiting",sentDate:date,recordedAt:new Date().toISOString(),actor:"本機使用者",person,items,artifacts:uniq(items.flatMap(i=>i.artifacts))});
      req.state=req.items.every(item=>rowView(data,item).state==="ready" && submitted(req,itemSnapshot(data,item))) ? "waiting" : "preparing";
      req.person=person; record(data,task,"已提交「"+req.title+"」",date+" · "+person+" · "+items.length+" 項");
    });
  }
  function batchForm(data,task,req){
    form("批次加入清單檔案",e(req.title),'<label>選取檔案<input type="file" name="batch" multiple></label><label>或選資料夾<input type="file" name="folder" webkitdirectory multiple></label><div data-map-files></div>',"存入清單",values=>{
      const files=[...dialog.querySelector('[name="batch"]').files,...dialog.querySelector('[name="folder"]').files];
      if(!files.length) throw Error("請選擇檔案或資料夾");
      const targets=files.map((_,i)=>req.items.find(item=>item.id===values.get("map-"+i)));
      const keep=files.map((file,i)=>({file,item:targets[i]})).filter((_,i)=>values.get("map-"+i)!=="skip");
      if(!keep.length) throw Error("請至少選擇一個要保存的檔案");
      return workspaceManager.storeFiles(keep.map(k=>k.file),{projectId:uiState.projectId,kind:"task",id:task.id},stored=>{
        stored.forEach((file,i)=>{
          const item=keep[i].item, ref=pin(file);
          if(item) { item.refs=uniq([...item.refs,ref]);item.state="checking"; }
          else req.unfiled=uniq([...(req.unfiled || []),ref]);
        });
        editable(req);record(data,task,"批次加入清單資料",keep.length+" 份檔案");
      }).then(()=>saved);
    });
    const inputs=[...dialog.querySelectorAll('input[type="file"]')];
    let visibleFiles=[];
    const render=()=>{
      const prior=new Map(visibleFiles.map((file,i)=>[file,dialog.querySelector('[name="map-'+i+'"]').value]));
      visibleFiles=inputs.flatMap(input=>[...input.files]);
      const options=[["","先不分類"],...req.items.map(item=>[item.id,item.title]),["skip","略過這份檔案"]];
      dialog.querySelector("[data-map-files]").innerHTML=visibleFiles.map((file,i)=>
        select(e(file.webkitRelativePath || file.name),"map-"+i,options,prior.get(file) || "")).join("");
    };
    inputs.forEach(input=>input.onchange=render);
  }
  function handle(name,data,task,req,rowId){
    if(name==="list-new") return addList(data,task);
    if(name==="list-output") return outputForm(data,task);
    if(!req?.items) return;
    const item=req.items.find(i=>i.id===rowId);
    if(name==="list-item" && item) return rowForm(data,task,req,item);
    if(name==="list-visit" && item && data.tasks.some(work=>work.id===item.sourceId))
      return openProjectRoom(uiState.projectId,"board",true,item.sourceId,{request:req.id,row:item.id});
    if(name==="list-remove" && item) {
      dialog.close();
      return form("移除「"+e(item.title)+"」","歷次提交、文件及相關工作會保留。", "", "確認移除",()=>{
        if(req.items.length===1 && req.rounds.length) throw Error("已有提交紀錄，請保留最後一列或修改名稱");
        req.items=req.items.filter(other=>other.id!==item.id);
        if(!req.items.length)task.requests=task.requests.filter(other=>other.id!==req.id);
        else editable(req);
        record(data,task,"移除清單項目",item.title);
      });
    }
    if(name==="list-submit") return submitForm(data,task,req);
    if(name==="list-unfiled") return form("分配清單檔案",e(req.title),
      req.unfiled.map((ref,i)=>select(e(ref.name),"place-"+i,[["","先不分類"],...req.items.map(item=>[item.id,item.title])],"")).join(""),"儲存分類",values=>{
        if (!req.unfiled.some((_,i)=>values.get("place-"+i))) throw Error("請至少選一個項目");
        req.unfiled=req.unfiled.filter((ref,i)=>{
          const item=req.items.find(row=>row.id===values.get("place-"+i));if(!item)return true;
          item.refs=uniq([...item.refs,ref]);item.state="checking";return false;
        });
        editable(req);record(data,task,"檔案已分到清單項目",req.title);
      });
    if(name==="list-batch") return batchForm(data,task,req);
    if(name==="list-settings") return form("清單設定",e(task.title),field("清單名稱","title",req.title,"text",true)+field("提交對象","person",req.person)+field("清單期限","due",req.due,"date"),"儲存",v=>{
      Object.assign(req,{title:v.get("title").trim(),person:v.get("person").trim(),due:v.get("due")});
    });
    if(name==="list-append") return form("加入清單項目",e(req.title),field("每行一項","names","","textarea",true),"加入",v=>{
      const rows=newRows(v.get("names")); if(!rows.length) throw Error("請至少填一項");
      req.items.push(...rows);editable(req);record(data,task,"加入清單項目",rows.map(i=>i.title).join("、"));
    });
    if(name==="list-confirm" && req.state==="waiting"){
      req.state="accepted"; req.rounds.at(-1).state="accepted"; req.rounds.at(-1).repliedAt=new Date().toISOString();
      record(data,task,"對方已確認",req.title); if(saveWorkspaceData()) refreshProjectDataSurface();
    }
  }
  return {create,fields,card,handle,stats,nextItem,newRows,focusRow,resultCard};
}
