/* One library entry per document, with case references and a dated history. */
(() => {
  const e = escapeHTML, model = documentModel;
  const labels = { added: "加入文件", updated: "更新文件", received: "收到文件", provided: "已提供文件", returned: "被退回／需修改", confirmed: "對方已確認", incomplete: "收到部分／待補件", receipt_confirmed: "已核對收到的資料", reused: "再次加入相同內容", linked: "加入案件", unlinked: "移出案件", legacy: "既有版本", renamed: "更新文件資訊", note: "補充紀錄" };
  const library = document.createElement("dialog"); library.className = "docs-library"; library.setAttribute("aria-label", "文件庫"); document.body.append(library);
  const modal = document.createElement("dialog"); modal.className = "w-dialog docs-form"; modal.setAttribute("aria-labelledby", "docs-form-title"); document.body.append(modal);
  const input = document.createElement("input"); input.type = "file"; input.multiple = true; input.hidden = true; document.body.append(input);
  let selectedId = "", term = "", historyMode = "document", handler, busy = false, previousFocus;
  let libraryContext = {}, pendingIntakeContext = null;
  const contextLabel = () => libraryContext.kind === "task" ? workspaceData[libraryContext.projectId]?.tasks.find(task => task.id === libraryContext.id)?.title : libraryContext.projectId ? getProject(libraryContext.projectId)?.name : "";
  const addLabel = () => libraryContext.kind === "task" ? "＋ 加入此工作" : libraryContext.projectId ? "＋ 加入此案件" : "＋ 加入文件";
  const button = (title, action, id = "", extra = "") => `<button type="button" class="d-action" data-doc-action="${action}" data-document="${e(id)}" ${extra}>${title}</button>`;
  const field = (label, name, value = "", type = "text") => `<label>${label}${type === "textarea" ? `<textarea name="${name}" rows="3">${e(value)}</textarea>` : `<input name="${name}" type="${type}" value="${e(value)}">`}</label>`;
  const val = (values, name) => String(values.get(name) || "").trim();
  const versionNumber = (doc, id) => doc.versions.findIndex(v => v.id === id) + 1;
  function showForm(title, intro, body, submit, callback) {
    previousFocus = document.activeElement; handler = callback;
    modal.innerHTML = `<form><header><h2 id="docs-form-title">${title}</h2><button type="button" data-doc-close aria-label="關閉">×</button></header><p class="d-help">${intro}</p><div class="d-form-fields">${body}</div><p class="d-form-error" role="alert"></p><footer><button type="button" data-doc-close>取消</button><button type="submit" class="primary-action">${submit}</button></footer></form>`;
    if (!modal.open) modal.showModal();
    modal.querySelector("input:not([type=hidden]),select,textarea")?.focus();
  }
  modal.addEventListener("click", event => { if (!busy && event.target.closest("[data-doc-close]")) modal.close(); });
  modal.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
  modal.addEventListener("close", () => { if (previousFocus?.isConnected) previousFocus.focus(); });
  modal.addEventListener("submit", async event => {
    event.preventDefault(); if (busy) return;
    const values = new FormData(event.target); busy = true;
    modal.querySelectorAll("button").forEach(el => { el.disabled = true; });
    try { await handler(values); modal.close(); render(); }
    catch (error) { modal.querySelector(".d-form-error").textContent = error.message; }
    finally { busy = false; modal.querySelectorAll("button").forEach(el => { el.disabled = false; }); }
  });
  const safeURL = value => { try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
  const usageText = doc => model.usages(doc.id).map(use => use.name).join("、");
  const searchText = doc => [doc.name, doc.subject, doc.note, ...(doc.aliases || []), usageText(doc), ...doc.events.flatMap(item => [item.date, item.person, item.channel, item.note, item.originalName])].filter(Boolean).join(" ").toLowerCase();
  const available = version => Boolean(version?.blobId || safeURL(version?.url));
  function renderList() {
    const list = library.querySelector(".docs-list"); if (!list) return;
    const docs = documentLibrary.documents.filter(doc => !doc.archived && searchText(doc).includes(term.toLowerCase())).sort((a, b) => (b.events.at(-1)?.recordedAt || b.date || "").localeCompare(a.events.at(-1)?.recordedAt || a.date || ""));
    library.querySelector("[data-doc-count]").textContent = `${docs.length} 份文件`;
    list.innerHTML = docs.map(doc => `<button type="button" class="docs-row ${doc.id === selectedId ? "is-selected" : ""}" data-doc-action="select" data-document="${e(doc.id)}"><strong>${e(doc.name)}</strong><span>${e(doc.subject || usageText(doc) || "尚未用於任何案件")}</span><small>v${versionNumber(doc, model.current(doc)?.id)} · ${e(doc.date || "未記錄日期")} · ${model.usages(doc.id).length} 個案件</small></button>`).join("") || `<p class="d-help docs-empty">${term ? "沒有符合的文件。可搜尋原檔名、對象、案件或紀錄日期。" : "尚無文件。可直接加入檔案或網址。"}</p>`;
  }
  function render() {
    if (!library.open) return;
    if (!library.querySelector(".docs-list")) {
      library.innerHTML = `<header class="docs-header"><div><h2 tabindex="-1" autofocus>文件庫</h2><p>${contextLabel() ? `新增文件將歸入「${e(contextLabel())}」。` : "查詢文件版本、使用案件與收發紀錄。"}</p></div><div class="d-actions">${button(addLabel(), "add")}${button("加入來源連結", "source")}<button type="button" class="d-action" data-doc-action="close" aria-label="關閉文件庫">關閉</button></div></header><div class="docs-body"><aside class="docs-browser"><label class="docs-search">搜尋文件<input type="search" data-doc-search placeholder="名稱、案件、對象、日期" value="${e(term)}"></label><small data-doc-count></small><div class="docs-list"></div></aside><section class="docs-detail"></section></div>`;
    }
    renderList();
    const detail = library.querySelector(".docs-detail"), doc = model.find(selectedId);
    library.classList.toggle("has-document", Boolean(doc));
    if (!doc) { detail.innerHTML = `<div class="docs-empty"><h3>文件詳情</h3><p>選取文件後，可查看目前版本與歷次收發紀錄。</p>${button(addLabel(), "add")}</div>`; return; }
    const version = model.current(doc), usages = model.usages(doc.id);
    const events = doc.events.filter(item => historyMode === "all" || !["linked", "unlinked", "renamed", "reused"].includes(item.type)).sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.recordedAt || "").localeCompare(a.recordedAt || ""));
    detail.innerHTML = `<div class="docs-mobile-back">${button("← 文件列表", "list")}</div><div class="docs-title"><div><p class="d-eyebrow">${e(doc.subject || "文件")}</p><h2>${e(doc.name)}</h2><p>目前 v${versionNumber(doc, version?.id)} · ${e(doc.size || "來源文件")} · ${e(version?.name || "")}</p></div>${button("編輯資訊", "edit", doc.id)}</div><div class="docs-main-actions">${version?.blobId || safeURL(version?.url) ? button("開啟目前版本", "open", doc.id) : `<small>僅有檔名，尚無原檔</small>`}${button("更新文件", "update", doc.id)}${button("提供文件", "provide", doc.id)}${button(usages.length ? "共用至其他案件" : "用於案件", "link", doc.id)}</div>${doc.note ? `<p class="d-help">${e(doc.note)}</p>` : ""}<section class="docs-section"><h3>${usages.length} 個案件使用中</h3><div class="docs-usages">${usages.map(use => `<button type="button" class="d-context-link" data-doc-action="case" data-project="${e(use.projectId)}" data-file="${e(use.file.id)}"><strong>${e(use.name)}${use.archived ? " · 已封存" : ""}</strong><span>${use.file.workIds.map(id => workspaceData[use.projectId].tasks.find(t => t.id === id)?.title).filter(Boolean).map(e).join("、") || "案件共用資料"} ↗</span></button>`).join("") || `<p class="d-help">尚未用於案件。</p>`}</div></section><section class="docs-section"><div class="d-section-title"><div><h3>文件履歷</h3><p>依實際日期列出收發與修改紀錄。收到對方回覆後，可補登確認結果。</p></div>${button("＋ 補登文件往來", "record", doc.id)}</div><div class="d-actions docs-history-filter"><button type="button" class="d-action" data-doc-action="history-document" aria-pressed="${historyMode === "document"}">收發與修改</button><button type="button" class="d-action" data-doc-action="history-all" aria-pressed="${historyMode === "all"}">全部紀錄</button></div><div class="docs-history">${events.map(item => {
      const replaced = doc.events.some(next => next.supersedesId === item.id);
      const lineage = new Set([item.id]); let prior = item; while (prior?.supersedesId && !lineage.has(prior.supersedesId)) { lineage.add(prior.supersedesId); prior = doc.events.find(entry => entry.id === prior.supersedesId); }
      const related = doc.events.filter(next => lineage.has(next.relatedEventId) && !doc.events.some(last => last.supersedesId === next.id)).at(-1);
      const request = item.requestId && workspaceData[item.projectId]?.tasks.find(work => work.id === item.taskId)?.requests.find(r => r.id === item.requestId);
      const round = request?.rounds?.find(r => r.id === item.roundId);
      let response = "";
      if (item.type === "provided" && !replaced) {
        if (!item.requestId && !related) response = button("記錄退回／確認", "response", doc.id, `data-event="${e(item.id)}"`);
        else if (round?.state === "waiting" && (!round.items?.length || round.items.some(row => !row.response && row.artifacts.some(ref => ref.versionId === item.versionId))) && (request.items || (request.state === "waiting" && request.rounds.at(-1) === round)))
          response = `<button type="button" class="d-action" data-delivery-action="round-reply" data-project="${e(item.projectId)}" data-work="${e(item.taskId)}" data-item="${e(request.id)}" data-round="${e(round.id)}" data-version="${e(item.versionId)}">記錄這次提交的回覆</button>`;
      }
      return `<article class="docs-event ${replaced ? "is-corrected" : ""}"><time>${e(item.date || "日期未記錄")}</time><div><strong>${e(labels[item.type] || item.type)}${replaced ? " · 已更正" : ""} ${item.versionId ? `· v${versionNumber(doc, item.versionId)}` : ""}</strong><p>${e([item.person, item.channel, item.projectId && getProject(item.projectId)?.name].filter(Boolean).join(" · "))}</p>${item.note ? `<p>${e(item.note)}</p>` : ""}${item.originalName && item.originalName !== doc.name ? `<small>當時檔名：${e(item.originalName)}</small>` : ""}${related ? `<small>後續：${e(labels[related.type])} · ${e(related.date)}</small>` : ""}${item.recordedAt ? `<small>登錄 ${e(new Date(item.recordedAt).toLocaleString("zh-TW"))}</small>` : ""}${safeURL(item.proofURL) ? `<a href="${e(safeURL(item.proofURL))}" target="_blank" rel="noopener noreferrer">查看往來／憑證 ↗</a>` : ""}${item.proofDocumentId ? button("查看憑證", "open", item.proofDocumentId, `data-version="${e(item.proofVersionId || "")}"`) : ""}<div class="docs-event-actions">${item.versionId && available(doc.versions.find(v => v.id === item.versionId)) ? button("查看當時版本", "open", doc.id, `data-version="${e(item.versionId)}"`) : ""}${response}${!item.requestId && !["legacy", "linked", "unlinked", "renamed"].includes(item.type) && !replaced ? button("更正紀錄", "correct", doc.id, `data-event="${e(item.id)}"`) : ""}</div></div></article>`;
    }).join("") || `<p class="d-help">尚無文件往來紀錄。</p>`}</div></section><details class="docs-versions"><summary>版本與原始檔名 · ${doc.versions.length} 版</summary>${doc.versions.map((v, index) => `<div class="w-version"><span>v${index + 1} · ${e(v.name)}${v.id === version?.id ? " · 目前使用" : ""}<small>${e(v.date || "")} ${e(v.note || "")}</small></span>${available(v) ? button("開啟", "open", doc.id, `data-version="${e(v.id)}"`) : `<small>僅有檔名，尚無原檔</small>`}${button("提供這一版", "provide", doc.id, `data-version="${e(v.id)}"`)}</div>`).join("")}</details>`;
  }
  function open(id = "") { selectedId = id; if (!library.open) { libraryContext = workspaceManager.fileContext(); library.innerHTML = ""; library.showModal(); } render(); if (id) { library.querySelector(".docs-detail").scrollTop = 0; const title = library.querySelector(".docs-title h2"); title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); } else library.querySelector(matchMedia("(pointer: coarse)").matches ? ".docs-header h2" : "[data-doc-search]")?.focus({ preventScroll: true }); }
  library.addEventListener("input", event => { if (event.target.matches("[data-doc-search]")) { term = event.target.value; renderList(); } });
  async function intake(files, context = { ...libraryContext }) {
    try { const result = await workspaceManager.storeFiles([...files], context); selectedId = result[0]?.documentId || result[0]?.id || selectedId; render(); showToast(context.kind === "task" ? "文件已加入工作並存入文件庫" : context.projectId ? "文件已加入案件並存入文件庫" : "文件已儲存，相同內容會沿用既有檔案"); }
    catch (error) { showToast(error.message); }
  }
  input.addEventListener("change", () => { const files = [...input.files]; input.value = ""; const context = pendingIntakeContext || { ...libraryContext }; pendingIntakeContext = null; if (files.length) intake(files, context); });
  input.addEventListener("cancel", () => { pendingIntakeContext = null; });
  library.addEventListener("dragover", event => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); });
  library.addEventListener("drop", event => { if (event.dataTransfer.files.length) { event.preventDefault(); intake(event.dataTransfer.files); } });
  function choose(projectId, taskId = "") {
    const data = workspaceData[projectId]; if (!data) return;
    const existing = id => data.files.some(file => file.documentId === id && (!taskId || file.workIds.includes(taskId)));
    showForm("從文件庫加入", `${e(getProject(projectId).name)}${taskId ? ` / ${e(data.tasks.find(t => t.id === taskId)?.title || "")}` : ""}。加入後，這項工作或案件就能開啟同一份文件。`, `<label>搜尋文件<input type="search" data-doc-pick-search placeholder="名稱、對象或日期"></label><div class="docs-picker">${documentLibrary.documents.filter(doc => !doc.archived).map(doc => `<label class="d-check" data-doc-match="${e(searchText(doc))}"><input type="checkbox" name="documents" value="${e(doc.id)}" ${existing(doc.id) ? "checked disabled" : ""}><span>${e(doc.name)}<small>${e(doc.subject || usageText(doc))}${existing(doc.id) ? " · 已選用" : ""}</small></span></label>`).join("") || `<p class="d-help">文件庫還沒有資料，可以直接加入檔案。</p>`}</div>`, "加入選用文件", values => model.mutate(() => values.getAll("documents").forEach(id => model.link(id, projectId, taskId))));
  }
  modal.addEventListener("input", event => { if (event.target.matches("[data-doc-pick-search]")) modal.querySelectorAll("[data-doc-match]").forEach(row => { row.hidden = !row.dataset.docMatch.includes(event.target.value.trim().toLowerCase()); }); });
  function update(doc) {
    const baseVersionId = model.current(doc)?.id;
    if (model.current(doc)?.url && !model.current(doc)?.blobId) return showForm("更新來源連結", "系統會保留歷次網址。若需留存當時的網頁內容，請加入檔案副本。", field("來源網址", "url", model.current(doc).url, "url") + field("更新說明（選填）", "note", "", "textarea"), "儲存更新", values => model.mutate(() => {
      const live = model.find(doc.id), url = safeURL(val(values, "url"));
      if (!url) throw new Error("請填有效的 http 或 https 網址");
      if (model.current(live)?.id !== baseVersionId) throw new Error("來源已有更新，請重新開啟表單");
      if (url !== model.current(live).url) { const version = { id: `version-${crypto.randomUUID()}`, name: live.name, url, source: "link", date: localISODate(), note: val(values, "note") }; live.versions.push(version); Object.assign(live, { currentVersionId: version.id, url, date: version.date }); model.event(live, "updated", { note: version.note }); }
    }));
    showForm("更新文件", `${e(doc.name)}${model.usages(doc.id).length > 1 ? " · " + model.usages(doc.id).length + " 個案件共用" : ""}。歷次提供紀錄保留當時版本。`, `<label>更新後的檔案<input name="versionFile" type="file" required></label>` + field("修改說明（選填）", "note", "", "textarea") + `<details><summary>補充來源或日期（選填）</summary><div class="d-form-fields"><label>這次更新<select name="eventType"><option value="updated">我已更新文件</option><option value="received">收到對方的更新</option></select></label>${field("實際日期", "date", localISODate(), "date")}${field("對象", "person")}</div></details>`, "儲存更新", async values => {
      const file = values.get("versionFile"); if (!(file instanceof File) || !file.name) throw new Error("請選擇更新檔案");
      await workspaceManager.storeFiles([file], { documentId: doc.id, baseVersionId, note: val(values, "note"), date: val(values, "date") || localISODate(), person: val(values, "person"), eventType: val(values, "eventType") || "updated" });
      showToast("文件已更新，共用案件同步；原有提交版本保留");
    });
  }
  function recordForm(doc, kind = "received", versionId = "", related, correction) {
    const v = versionId || correction?.versionId || related?.versionId || model.current(doc).id;
    const kinds = related ? [["returned", "被退回／要求修改"], ["confirmed", "對方已確認"]] : [["received", "收到文件"], ["provided", "已提供給對方"], ["returned", "被退回／要求修改"], ["confirmed", "對方已確認"], ["note", "補充說明"]];
    if (correction && !kinds.some(([key]) => key === correction.type)) kinds.push([correction.type, labels[correction.type] || correction.type]);
    const origin = correction || related;
    const original = origin || {};
    const active = library.open ? libraryContext : workspaceManager.fileContext();
    const contextProject = origin ? original.projectId || "" : active.projectId || "";
    const contextTask = origin ? original.taskId || "" : active.kind === "task" ? active.id : "";
    const work = workspaceData[contextProject]?.tasks.find(task => task.id === contextTask);
    const contacts = [...new Set((work?.requests || []).filter(request => request.state !== "cancelled" && request.direction === (kind === "received" ? "inbound" : "outbound")).map(request => request.person).filter(Boolean))];
    const suggestions = [...new Set([...contacts, work?.owner].filter(Boolean))];
    const person = origin ? original.person || "" : contacts.length === 1 ? contacts[0] : "";
    const contextSummary = contextProject ? `<p class="d-help">記錄於：${e(getProject(contextProject)?.name || "")}${work ? ` / ${e(work.title)}` : ""}</p>` : "";
    showForm(correction ? "更正往來紀錄" : kind === "provided" ? "提供文件" : related ? "記錄對方回覆" : "補登文件往來", kind === "provided" ? "選擇版本後可下載或分享檔案。實際交件後，請登記提供日期與對象。" : "可補登先前的往來，並附上回條或郵件作為憑證。",
      `${contextSummary}${kind === "provided" ? `<div class="d-actions" data-provision-actions ${available(doc.versions.find(item => item.id === v)) ? "" : "hidden"}>${button(doc.versions.find(item => item.id === v)?.blobId ? "下載所選版本" : "開啟來源網址", "prepare", doc.id)}${navigator.share ? button("分享檔案", "share", doc.id) : ""}</div>` : ""}${kind === "provided" && !correction ? `<input type="hidden" name="type" value="provided">` : `<label>紀錄類型<select name="type">${kinds.map(([value, title]) => `<option value="${value}" ${value === (correction?.type || kind) ? "selected" : ""}>${title}</option>`).join("")}</select></label>`}<label>文件版本<select name="versionId" ${related ? "disabled" : ""}>${doc.versions.map((version, index) => `<option value="${e(version.id)}" ${version.id === v ? "selected" : ""}>v${index + 1} · ${e(version.name)}</option>`).join("")}</select></label>${field("實際日期", "date", correction?.date || localISODate(), "date")}${field("對象（選填）", "person", person).replace('name="person"', 'name="person" list="docs-known-people"')}<datalist id="docs-known-people">${suggestions.map(name => `<option value="${e(name)}"></option>`).join("")}</datalist>${field("說明（選填）", "note", correction?.note || "", "textarea")}<details><summary>管道、案件與憑證（選填）</summary><div class="d-form-fields">${field("管道", "channel", original.channel || "")}<label>使用的案件<select name="projectId"><option value="">未指定</option>${topologyProjects.map(project => `<option value="${e(project.id)}" ${project.id === contextProject ? "selected" : ""}>${e(project.name)}</option>`).join("")}</select></label>${field("信件／對話／回條連結", "proofURL", correction?.proofURL || "", "url")}<label>或附上憑證檔案<input type="file" name="proofFile"></label></div></details>`, "儲存紀錄", async values => {
      const date = val(values, "date") || localISODate(), selectedVersion = related?.versionId || val(values, "versionId"), type = val(values, "type"), proofURL = val(values, "proofURL");
      if (date > localISODate() || !parseDueValue(date)) throw new Error("請填有效的實際日期，不能在未來");
      if (related && date < related.date) throw new Error("回覆日期不能早於這次提供日期");
      if (proofURL && !safeURL(proofURL)) throw new Error("憑證連結需使用 http 或 https");
      if (!kinds.some(([value]) => value === type)) throw new Error("紀錄類型不正確");
      const proof = values.get("proofFile");
      let proofDoc = null;
      if (proof instanceof File && proof.name) [proofDoc] = await workspaceManager.storeFiles([proof], {});
      model.mutate(() => {
        const live = model.find(doc.id);
        const projectId = val(values, "projectId"), taskId = projectId === contextProject && workspaceData[contextProject]?.tasks.some(task => task.id === contextTask) ? contextTask : "";
        if (projectId) model.link(live.id, projectId, taskId);
        model.event(live, type, { date, versionId: selectedVersion, person: val(values, "person"), channel: val(values, "channel"), note: val(values, "note"), projectId, taskId, proofURL: safeURL(proofURL), proofDocumentId: proofDoc?.id || correction?.proofDocumentId || "", proofVersionId: proofDoc ? model.current(proofDoc).id : correction?.proofVersionId || "", relatedEventId: related?.id || correction?.relatedEventId || "", supersedesId: correction?.id || "", verification: "manual" });
      });
      showToast("已更新文件履歷");
    });
    modal.dataset.version = v;
    if (!origin) {
      let suggestedPerson = person;
      const typeField = modal.querySelector('[name="type"]'), personField = modal.querySelector('[name="person"]');
      typeField.addEventListener("change", () => {
        const people = [...new Set((work?.requests || []).filter(request => request.state !== "cancelled" && request.direction === (typeField.value === "received" ? "inbound" : "outbound")).map(request => request.person).filter(Boolean))];
        const next = people.length === 1 ? people[0] : "";
        if (personField.value === suggestedPerson) personField.value = next;
        suggestedPerson = next;
        modal.querySelector('#docs-known-people').innerHTML = [...new Set([...people, work?.owner].filter(Boolean))].map(name => `<option value="${e(name)}"></option>`).join("");
      });
    }
    const versionSelect = modal.querySelector('[name="versionId"]');
    versionSelect.addEventListener("change", () => {
      const actions = modal.querySelector("[data-provision-actions]"), chosen = doc.versions.find(item => item.id === versionSelect.value);
      if (actions) { actions.hidden = !available(chosen); actions.querySelector('[data-doc-action="prepare"]').textContent = chosen?.blobId ? "下載所選版本" : "開啟來源網址"; }
    });
  }
  async function openVersion(doc, versionId, download = false) {
    const version = versionId ? doc.versions.find(v => v.id === versionId) : model.current(doc);
    if (!version) throw new Error("找不到紀錄中的版本，請從完整備份還原");
    if (version.blobId) return workspaceManager.accessFile(doc.id, version.id, download);
    if (safeURL(version.url)) { const a = document.createElement("a"); a.href = safeURL(version.url); a.target = "_blank"; a.rel = "noopener noreferrer"; a.click(); return; }
    throw new Error("這份文件只記了檔名，可用「更新文件」補上檔案");
  }
  document.addEventListener("click", async event => {
    const control = event.target.closest("[data-doc-action]"); if (!control || control.disabled) return;
    const action = control.dataset.docAction, doc = model.find(control.dataset.document);
    try {
      if (action === "history-document" || action === "history-all") { historyMode = action === "history-all" ? "all" : "document"; return render(); }
      if (action === "library") return open();
      if (action === "close") return library.close();
      if (action === "list") { selectedId = ""; return render(); }
      if (action === "add") { pendingIntakeContext = { ...libraryContext }; return input.click(); }
      if (action === "choose") return choose(control.dataset.project || uiState.projectId, control.dataset.work || "");
      if (action === "case") { library.close(); return openProjectRoom(control.dataset.project, "files", true, control.dataset.file); }
      if (action === "source") {
        const context = { ...libraryContext };
        return showForm("加入來源連結", contextLabel() ? `來源會自動加入「${e(contextLabel())}」。` : "來源可以先獨立保存，已有相同網址會直接沿用。", field("來源網址", "url", "", "url") + field("名稱（選填）", "name"), "加入來源", values => model.mutate(() => {
          const item = model.source({ ...context, url: val(values, "url"), name: val(values, "name") }); selectedId = item.documentId || item.id;
        }));
      }
      if (!doc) throw new Error("文件已不存在");
      if (action === "select") return open(doc.id);
      if (action === "update") return update(doc);
      if (action === "open") return await openVersion(doc, control.dataset.version);
      if (action === "provide") return recordForm(doc, "provided", control.dataset.version);
      if (action === "record") return recordForm(doc);
      if (action === "response") return recordForm(doc, "returned", "", doc.events.find(item => item.id === control.dataset.event));
      if (action === "correct") return recordForm(doc, doc.events.find(item => item.id === control.dataset.event).type, "", null, doc.events.find(item => item.id === control.dataset.event));
      if (action === "prepare") return await openVersion(doc, modal.querySelector('[name="versionId"]').value, true);
      if (action === "share") {
        const version = doc.versions.find(v => v.id === modal.querySelector('[name="versionId"]').value);
        if (version.blobId) { const body = await workspaceManager.readBody(version.blobId); if (!body?.blob) throw new Error("檔案內容遺失，請從完整備份還原"); const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await body.blob.arrayBuffer()))].map(n => n.toString(16).padStart(2, "0")).join(""); if (version.sha256 && digest !== version.sha256) throw new Error("檔案驗證失敗，已停止分享"); const file = new File([body.blob], version.name, { type: body.type }); if (!navigator.canShare?.({ files: [file] })) throw new Error("此裝置不支援直接分享檔案，可改用下載所選版本"); await navigator.share({ files: [file], title: doc.name }); }
        else if (safeURL(version.url)) await navigator.share({ url: safeURL(version.url), title: doc.name });
        return;
      }
      if (action === "edit") return showForm("文件資訊", "修改顯示名稱不會改動檔案內容或歷次收發紀錄。", field("文件名稱", "name", doc.name) + field("公司／對象／年度（選填）", "subject", doc.subject || "") + field("備註（選填）", "note", doc.note || "", "textarea"), "儲存資訊", values => model.mutate(() => { const name = val(values, "name"); if (!name) throw new Error("請保留文件名稱"); const live = model.find(doc.id); live.aliases = [...new Set([...live.aliases, live.name, name])]; live.name = name; live.subject = val(values, "subject"); live.note = val(values, "note"); model.event(live, "renamed", { note: "更新顯示名稱或文件資訊" }); }));
      if (action === "link") return showForm("共用至其他案件", "選擇也要使用這份文件的案件，各案件會共用同一份文件。", `<div class="docs-picker">${topologyProjects.map(project => { const exists = model.usages(doc.id).some(use => use.projectId === project.id); return `<label class="d-check"><input type="checkbox" name="projects" value="${e(project.id)}" ${exists ? "checked disabled" : ""}><span>${e(project.name)}${exists ? " · 已選用" : ""}</span></label>`; }).join("")}</div>`, "加入選用案件", values => model.mutate(() => values.getAll("projects").forEach(id => model.link(doc.id, id))));
    } catch (error) { if (error.name !== "AbortError") showToast(error.message); }
  });
  deleteEvidence = function(fileId) {
    const projectId = uiState.projectId, data = workspaceData[projectId], file = data?.files.find(item => item.id === fileId);
    if (!file) return;
    if (data.tasks.some(task => workUsesFile(task, fileId))) return showToast("清單、工作結果或提交紀錄仍使用這份資料");
    try {
      const position = data.files.indexOf(file), docId = file.documentId;
      model.mutate(() => { data.files.splice(position, 1); model.event(model.find(docId), "unlinked", { projectId, note: "移出案件，文件與歷史仍保留" }); });
      showToast("已移出此案件，文件庫仍保留", { label: "復原", run: () => { try { model.mutate(() => { const live = workspaceData[projectId]; if (live && !live.files.some(item => item.documentId === docId)) { live.files.splice(position, 0, file); model.hydrate(workspaceData); model.event(model.find(docId), "linked", { projectId, note: "復原加入案件" }); } }); } catch (error) { showToast(error.message); } } });
    } catch (error) { showToast(error.message); }
  };
  const previousRefresh = refreshProjectDataSurface;
  refreshProjectDataSurface = function(...args) { model.sync(); const result = previousRefresh(...args); render(); return result; };
  
  document.querySelector(".command-actions").insertAdjacentHTML("afterbegin", button("文件庫", "library"));
  window.documentUI = { open, choose, render, recordForm, update };
})();
