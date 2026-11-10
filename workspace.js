/* Project lifecycle, local attachment bodies, and portable backup transactions. */
(() => {
  "use strict";
  const e = escapeHTML;
  const uid = prefix => `${prefix}-${crypto.randomUUID()}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const undoKey = window.exampleWorkspace ? "personal-assistant-examples-before-restore" : "personal-assistant-before-restore-v6";
  const snapshot = () => documentModel.snapshot();
  const activity = (data, title, detail = "", taskId = "") => {
    const entry = { id: uid("activity"), kind: "note", title, detail, taskId, date: localISODate(), at: new Date().toISOString() };
    data.activity.unshift(entry);
    const task = data.tasks.find(item => item.id === taskId);
    if (task) { task.history ||= []; task.history.unshift({ ...entry }); }
  };
  function persist() { if (!saveWorkspaceData()) throw new Error("未能保存資料，變更尚未完成。請確認瀏覽器的儲存空間與權限。"); }
  function install(state) {
    const definitions = state.projects.map(projectDefinition);
    topologyProjects.splice(0, topologyProjects.length, ...definitions);
    documentModel.restore(state);
    Object.values(workspaceData).forEach(deliveryModel.normalize);
  }
  function transact(change) {
    const before = snapshot();
    try { const result = change(); persist(); refreshProjectDataSurface(); return result; }
    catch (error) { install(before); refreshProjectDataSurface(); throw error; }
  }
  function createProject({ name, goal, criteria = "", due = "", color = "#83e8d3" }) {
    if (!String(name || "").trim() || !String(goal || "").trim()) throw new Error("請填寫案件名稱與交付目標");
    return transact(() => {
      const project = projectDefinition({ id: uid("project"), name, color, isSample: false });
      topologyProjects.push(project);
      const data = emptyWorkspaceData();
      data.goal = { title: goal.trim(), criteria, acceptedAt: "", result: "" };
      data.deadlineDate = normalizeDateValue(due);
      workspaceData[project.id] = data;
      deliveryModel.normalize(data);
      activity(data, "建立案件", `${project.name} / ${data.goal.title}`);
      return project;
    });
  }
  function renameProject(id, name) {
    const project = getProject(id), nextName = String(name || "").trim();
    if (!project || !nextName) throw new Error("請填寫案件名稱");
    const previous = project.name;
    transact(() => { project.name = nextName; activity(workspaceData[id], "案件改名", `${previous} → ${nextName}`); });
    return previous;
  }
  function archiveProject(id) {
    const data = workspaceData[id]; if (!data || data.lifecycle === "archived") return;
    transact(() => {
      data.archivedFrom = data.lifecycle; data.lifecycle = "archived"; data.archivedAt = new Date().toISOString();
      activity(data, "封存案件", "移出日常總覽與優先清單；工作、問題與附件保留。");
    });
    if (uiState.focusProjectId === id) uiState.focusProjectId = null;
  }
  function restoreProject(id) {
    const data = workspaceData[id]; if (!data || data.lifecycle !== "archived") return;
    transact(() => {
      data.lifecycle = ["active", "paused", "completed"].includes(data.archivedFrom) ? data.archivedFrom : "active";
      data.archivedAt = ""; activity(data, "還原封存案件", "恢復封存前的案件狀態。");
    });
  }

  let databasePromise;
  function database() {
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(window.exampleWorkspace ? "personal-assistant-example-attachments" : "personal-assistant-attachments", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("bodies", { keyPath: "id" });
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = () => { databasePromise = null; reject(new Error("無法開啟本機附件儲存空間")); };
      request.onblocked = () => reject(new Error("附件儲存空間被另一個頁面鎖住，請關閉其他工作台分頁後再試"));
    });
    return databasePromise;
  }
  async function readBody(id) {
    const db = await database();
    return new Promise((resolve, reject) => {
      const request = db.transaction("bodies", "readonly").objectStore("bodies").get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("讀取附件失敗"));
    });
  }
  async function writeBodies(records) {
    if (!records.length) return;
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("bodies", "readwrite");
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error("附件未保存成功，可能是本機空間不足；原有資料未被取代"));
      transaction.onabort = () => reject(new Error("附件保存已取消，原有資料未被取代"));
      try { records.forEach(record => transaction.objectStore("bodies").add(record)); }
      catch { transaction.abort(); reject(new Error("附件未保存成功，這批檔案已取消寫入")); }
    });
  }
  async function removeBodies(ids) {
    if (!ids.length) return;
    const db = await database();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("bodies", "readwrite");
      ids.forEach(id => transaction.objectStore("bodies").delete(id));
      transaction.oncomplete = resolve; transaction.onerror = reject;
    });
  }
  async function hash(blob) {
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
  }
  function base64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = () => reject(new Error("無法讀取附件內容"));
      reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.readAsDataURL(blob);
    });
  }
  let uploadContext = null;
  function fileContext() {
    const data = uiState.surface === "project" && workspaceData[uiState.projectId];
    if (!data) return {};
    const task = uiState.projectTab === "board" && data.tasks.find(item => item.id === uiState.focusRecordId);
    return { projectId: uiState.projectId, kind: task ? "task" : "project", id: task ? task.id : null };
  }
  chooseEvidenceFiles = function(kind, id = null) {
    const current = fileContext();
    if (!kind) { kind = current.kind || "project"; id = current.id || null; }
    uploadContext = { projectId: uiState.projectId, kind, id };
    evidenceTarget = { kind, id }; evidenceInput.click();
  };
  evidenceInput.addEventListener("cancel", () => { uploadContext = null; evidenceTarget = { kind: "project", id: null }; });
  let uploadQueue = Promise.resolve();
  function storeFiles(files, context = {}, onStored) {
    const selected = Array.from(files), target = { ...context };
    const result = uploadQueue.then(() => storeFilesNow(selected, target, onStored));
    uploadQueue = result.catch(() => {});
    return result;
  }
  async function storeFilesNow(files, context, onStored) {
    const selected = Array.from(files), projectId = context.projectId;
    const data = workspaceData[projectId];
    if (projectId && !data) throw new Error("案件已不存在");
    if (!selected.length) return [];
    if ((context.fileId || context.documentId) && selected.length !== 1) throw new Error("一個資料版本請選擇一個檔案");
    if (workspaceLoadError) throw new Error(workspaceLoadError);
    const records = [];
    for (const file of selected) records.push({ id: uid("blob"), name: file.name, type: file.type || "application/octet-stream", size: file.size, sha256: await hash(file), blob: file, createdAt: new Date().toISOString() });
    const newRecords = [];
    for (const record of records) {
      const stored = documentLibrary.documents.flatMap(doc => doc.versions).find(version => version.sha256 === record.sha256 && version.blobId);
      const sameBatch = newRecords.find(item => item.sha256 === record.sha256);
      const body = stored ? await readBody(stored.blobId) : null;
      if (body && await hash(body.blob) === record.sha256) record.id = stored.blobId;
      else if (sameBatch) record.id = sameBatch.id;
      else newRecords.push(record);
    }
    await writeBodies(newRecords);
    if (projectId && workspaceData[projectId] !== data) {
      await removeBodies(newRecords.map(record => record.id));
      throw new Error("案件剛被還原或重新載入，這次附件尚未加入，請重新選擇檔案");
    }
    const before = snapshot();
    let results;
    try {
      results = documentModel.ingest(records, context);
      if (data) results.forEach(file => activity(data, `保存文件：${file.name}`, "文件庫保存內容，案件引用同一份文件", context.kind === "task" ? context.id : context.kind === "issue" ? data.issues.find(issue => issue.id === context.id)?.taskId || "" : ""));
      onStored?.(results);
      persist();
    } catch (error) {
      install(before);
      await removeBodies(newRecords.map(record => record.id)).catch(() => {});
      throw error;
    }
    refreshProjectDataSurface();
    return results;
  }
  addEvidenceFiles = async function(files) {
    const selected = Array.from(files);
    const context = uploadContext || { projectId: uiState.projectId, ...evidenceTarget };
    uploadContext = null;
    context.kind ||= evidenceTarget.kind || "project"; context.id ||= evidenceTarget.id;
    if (!selected.length) return;
    showToast(`正在保存 ${selected.length} 份附件…`);
    try { await storeFiles(selected, context); showToast(context.kind === "task" ? `已加入此工作，${selected.length} 份文件同步保存於文件庫` : `已加入此案件，${selected.length} 份文件同步保存於文件庫`); }
    catch (error) { showToast(error.message); }
    evidenceTarget = { kind: "project", id: null };
  };
  // Drop events must use the surface they actually landed on, not an old file-picker target.
  document.addEventListener("drop", event => { if (event.target.closest(".evidence-drop")) uploadContext = null; }, true);
  const safeURL = value => { try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; } };
  function fileActions(file, version = documentModel.current(file)) {
    if (version?.blobId) return `<button type="button" class="d-action" data-workspace-action="open-file" data-file="${e(file.id)}" data-version="${e(version.id)}">開啟</button><button type="button" class="d-action" data-workspace-action="download-file" data-file="${e(file.id)}" data-version="${e(version.id)}">下載</button>`;
    if (safeURL(version?.url)) return `<a href="${e(safeURL(version.url))}" target="_blank" rel="noopener noreferrer">開啟來源 ↗</a>`;
    return `<small>只有檔名，尚未加入檔案</small>`;
  }
  let activePreview = null;
  async function accessFile(fileId, versionId, download = false, trigger = document.activeElement) {
    const data = workspaceData[uiState.projectId];
    const file = data?.files.find(item => item.id === fileId) || documentModel.find(fileId);
    const version = versionId ? file?.versions.find(item => item.id === versionId) : documentModel.current(file);
    if (!version) throw new Error("指定版本不存在，沒有改開其他版本");
    if (!version.blobId) throw new Error("這個版本只記了來源，尚未加入檔案");
    const route = location.href;
    const record = await readBody(version.blobId);
    if (!record?.blob) throw new Error("找不到附件原檔，可能已清除瀏覽器資料。請由完整備份還原。");
    if (await hash(record.blob) !== version.sha256) throw new Error("附件內容與儲存時不同，請從完整備份還原");
    const mime = String(record.type || "").split(";")[0].trim().toLowerCase();
    const previewable = /^(application\/pdf|image\/(png|jpeg|gif|webp)|text\/plain|audio\/[\w.+-]+|video\/[\w.+-]+)$/.test(mime);
    if (download || !previewable) {
      const url = URL.createObjectURL(record.blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = version.name; anchor.click();
      if (!download) showToast("此格式以原檔下載："+version.name);
      setTimeout(() => URL.revokeObjectURL(url),60000);
      return;
    }
    if (location.href !== route || (trigger && !trigger.isConnected) || activePreview?.open) return;
    const work = data?.tasks.find(work=>work.id===uiState.focusRecordId);
    const source = trigger?.closest(".docs-library") ? "文件庫" :
      [getProject(uiState.projectId)?.name,trigger?.dataset.previewContext || work?.title].filter(Boolean).join(" / ");
    const back = (trigger?.closest(".rl-list") || trigger?.closest(".d-dialog")?.querySelector('[name="rowState"]')) ? "回到清單項目" : trigger?.closest(".d-work-detail") ? "回到工作" : "關閉預覽";
    const preview = document.createElement("dialog");
    preview.className = "w-file-preview";
    preview.setAttribute("aria-labelledby","file-preview-name");
    const versionLabel = "v" + (file.versions.findIndex(v=>v.id===version.id)+1);
    preview.innerHTML = `<header><div><small>${e(source)}</small><h2 id="file-preview-name">${e(version.name)}</h2><span>${e(versionLabel)}${version.date ? " · "+e(version.date) : ""}</span></div><button type="button" class="d-action" data-preview-close autofocus>${back}</button></header><div class="w-preview-body"></div><footer><a download="${e(version.name)}">下載這個版本</a></footer>`;
    const url = URL.createObjectURL(record.blob.slice(0,record.blob.size,mime));
    preview.querySelector("a").href = url;
    const body = preview.querySelector(".w-preview-body");
    const fileTag = mime === "text/plain" ? "pre" : mime === "application/pdf" ? "iframe" : mime.startsWith("image/") ? "img" : mime.split("/")[0];
    const viewer = document.createElement(fileTag);
    if (fileTag === "pre") viewer.textContent = await record.blob.text();
    else {
      if (fileTag === "iframe") viewer.title = version.name;
      if (fileTag === "img") viewer.alt = version.name;
      if (fileTag === "audio" || fileTag === "video") viewer.controls = true;
      viewer.src = url;
    }
    if (location.href !== route || (trigger && !trigger.isConnected) || activePreview?.open) { URL.revokeObjectURL(url); return; }
    body.append(viewer);
    preview.querySelector("[data-preview-close]").onclick = () => preview.close();
    preview.addEventListener("close",()=>{
      URL.revokeObjectURL(url); preview.remove();
      if (activePreview === preview) activePreview = null;
      if (trigger?.isConnected && route === location.href) trigger.focus({preventScroll:true});
    },{once:true});
    document.body.append(preview);
    activePreview = preview;
    preview.showModal();
  }
  window.addEventListener("popstate",()=>{if(activePreview?.open) activePreview.close();});
  function renderFile(file, data, compact = false) {
    const version = documentModel.current(file);
    const consumers = (file.workIds || []).map(id => data.tasks.find(task => task.id === id)?.title).filter(Boolean);
    const submitted = data.tasks.some(task => workUsesFile(task, file.id));
    return `<article class="${compact ? "d-evidence" : "evidence-item"}" data-record-target="${e(file.id)}"><div class="w-file-identity"><button type="button" class="d-context-link" data-doc-action="select" data-document="${e(file.documentId)}"><strong>${e(file.name)}</strong><small>查看文件履歷 ↗</small></button><small>${e(file.size || "來源資料")} · ${file.versions.length} 個版本 · ${consumers.length ? e(consumers.join("、")) : e(evidenceContextLabel(data, file))}</small></div><div class="w-file-actions">${fileActions(file, version)}<button type="button" class="d-action" data-workspace-action="file-version" data-file="${e(file.id)}">更新文件</button><button type="button" class="d-action" data-doc-action="provide" data-document="${e(file.documentId)}">提供文件</button>${!compact && !submitted ? `<button type="button" class="d-action" data-delete-evidence="${e(file.id)}">移出此案件</button>` : ""}</div>${file.versions.length > 1 ? `<details><summary>查看 ${file.versions.length} 個版本</summary>${file.versions.map((item, index) => `<div class="w-version"><span>v${index + 1} · ${e(item.name)}<small>${e(item.date || "")} ${e(item.note || "")}</small></span><div class="w-file-actions">${fileActions(file, item)}</div></div>`).join("")}</details>` : ""}${submitted && !compact ? `<small>清單、工作結果或提交紀錄仍使用這份資料</small>` : ""}</article>`;
  }
  renderEvidenceItem = (file, data) => renderFile(file, data);
  renderProjectFiles = function(data) {
    return `<div class="project-surface w-files-surface"><div class="surface-heading"><div><h2>文件與連結</h2><p>在這裡加入的文件直接歸入此案件，文件庫同步保存；也可選用其他案件已存的文件。</p></div><div class="surface-actions"><button type="button" class="secondary-action" data-doc-action="choose">從文件庫加入</button><button type="button" class="secondary-action" data-action="open-link">新增連結</button><button type="button" class="primary-action" data-action="choose-files">加入文件</button></div></div><button type="button" class="evidence-drop w-drop-zone" data-action="choose-files"><strong>拖入文件，或點擊選擇</strong><span>檔案留在本機瀏覽器，不會上傳到網路。</span></button><div class="evidence-list w-evidence-library">${data.files.map(file => renderFile(file, data)).join("") || `<p class="d-help">尚未加入附件或來源。</p>`}</div></div>`;
  };

  function bodyReferences(data, library = documentLibrary) {
    const ids = new Map();
    library.documents.forEach(doc => doc.versions.forEach(version => { if (version.blobId) ids.set(version.blobId, version); }));
    Object.values(data).forEach(project => project.files.forEach(file => (file.versions || []).forEach(version => {
      if (version.blobId) ids.set(version.blobId, version);
    })));
    return ids;
  }
  async function buildBackup() {
    const state = snapshot(), attachments = [];
    for (const [id, version] of bodyReferences(state.workspaceData, state.documentLibrary)) {
      const body = await readBody(id);
      if (!body?.blob) throw new Error(`附件「${version.name}」缺少原始檔案。請先從舊備份補回，再重新備份。`);
      const checksum = await hash(body.blob);
      if (version.sha256 && checksum !== version.sha256) throw new Error(`附件「${version.name}」校驗失敗，未產生備份`);
      attachments.push({ id, name: body.name, type: body.type, size: body.blob.size, sha256: checksum, data: await base64(body.blob) });
    }
    return { format: "personal-assistant.bundle", schemaVersion: 6, exportedAt: new Date().toISOString(), ...state, attachments };
  }
  async function prepareImport(file) {
    let parsed;
    try { parsed = JSON.parse(await file.text()); } catch { throw new Error("無法讀取備份，請選擇工作台匯出的 JSON 備份檔"); }
    if (Number(parsed.schemaVersion || parsed.version || 0) > 6) throw new Error("這份備份來自較新版本，請先更新工作台");
    const incoming = parsed.workspaceData || parsed;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new Error("備份沒有案件資料");
    const definitions = Array.isArray(parsed.projects) ? parsed.projects : Object.keys(incoming).map(id => {
      const known = getProject(id);
      if (!known) throw new Error(`備份缺少案件 ${id} 的名稱定義`);
      return { id, name: known.name, color: known.color, isSample: known.isSample !== false };
    });
    const projects = definitions.map(projectDefinition);
    if (new Set(projects.map(project => project.id)).size !== projects.length) throw new Error("備份含有重複的案件識別碼");
    if (Object.keys(incoming).some(id => !projects.some(project => project.id === id))) throw new Error("備份有案件資料但缺少相對應的案件定義");
    const imported = {}, library = clone(parsed.documentLibrary || { documents: [] });
    documentModel.validate(library);
    for (const project of projects) {
      const candidate = incoming[project.id];
      if (!candidate || !["tasks", "issues", "decisions", "files", "activity"].every(key => Array.isArray(candidate[key]))) throw new Error(`案件「${project.name}」的資料不完整`);
      imported[project.id] = migrateProjectData(project, clone(candidate), emptyWorkspaceData());
      documentModel.hydrate({ [project.id]: imported[project.id] }, library);
      deliveryModel.normalize(imported[project.id]);
      const data = imported[project.id];
      if (new Set(data.tasks.map(task => task.id)).size !== data.tasks.length || new Set(data.files.map(item => item.id)).size !== data.files.length) throw new Error(`案件「${project.name}」有重複工作或附件識別碼`);
    }
    if (!projects.length) throw new Error("備份內沒有可還原的案件");
    const records = [], seen = new Set();
    if (parsed.attachments != null && !Array.isArray(parsed.attachments)) throw new Error("附件清單格式不正確");
    for (const entry of parsed.attachments || []) {
      if (!entry || typeof entry.id !== "string" || seen.has(entry.id) || typeof entry.data !== "string" || !/^[a-f0-9]{64}$/i.test(entry.sha256 || "")) throw new Error("備份的附件資訊不完整或重複");
      seen.add(entry.id);
      let bytes;
      try { bytes = Uint8Array.from(atob(entry.data), char => char.charCodeAt(0)); } catch { throw new Error(`附件「${entry.name}」的內容損壞`); }
      const blob = new Blob([bytes], { type: entry.type || "application/octet-stream" });
      if (blob.size !== entry.size || await hash(blob) !== entry.sha256) throw new Error(`附件「${entry.name}」校驗失敗，沒有變更現有資料`);
      records.push({ id: entry.id, blob, name: entry.name, type: blob.type, size: blob.size, sha256: entry.sha256, createdAt: new Date().toISOString() });
    }
    for (const [id, version] of bodyReferences(imported, library)) {
      const record = records.find(item => item.id === id);
      if (!record || version.sha256 && record.sha256 !== version.sha256) throw new Error(`備份缺少附件「${version.name}」的正確內容，尚未還原任何案件`);
    }
    return { projects, workspaceData: imported, documentLibrary: library, records, fileName: file.name };
  }
  function remapEntities(data) {
    const ids = new Map();
    function collect(value) {
      if (!value || typeof value !== "object") return;
      if (!Array.isArray(value) && typeof value.id === "string") ids.set(value.id, uid("copy"));
      Object.values(value).forEach(collect);
    }
    function rewrite(value) {
      if (typeof value === "string") return ids.get(value) || value;
      if (Array.isArray(value)) return value.map(rewrite);
      if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [ids.get(key) || key, rewrite(item)]));
      return value;
    }
    collect(data); return rewrite(data);
  }
  async function applyImport(prepared, mode = "copy") {
    if (!["copy", "replace"].includes(mode)) throw new Error("請選擇還原方式");
    const blobs = new Map(), records = [];
    for (const record of prepared.records) {
      const known = documentLibrary.documents.flatMap(doc => doc.versions).find(v => v.sha256 === record.sha256 && v.blobId);
      const stored = known ? await readBody(known.blobId) : null;
      const previous = records.find(item => item.sha256 === record.sha256);
      const id = stored && await hash(stored.blob) === record.sha256 ? known.blobId : previous?.id || uid("blob");
      blobs.set(record.id, id);
      if (!previous && id !== known?.blobId) records.push({ ...record, id });
    }
    await writeBodies(records);
    // Snapshot immediately before the synchronous metadata commit, after file IO.
    const before = snapshot(), previousError = workspaceLoadError;
    const previousRaw = localStorage.getItem(workspaceStorageKey);
    const previousUndo = localStorage.getItem(undoKey);
    const importedIds = [];
    try {
      if (previousError && previousRaw) localStorage.setItem(`${workspaceStorageKey}-unreadable-${Date.now()}`, previousRaw);
      // Existing blob records remain available to this persistent undo point.
      localStorage.setItem(undoKey, JSON.stringify({ ...before, raw: previousRaw, at: new Date().toISOString() }));
      let incoming = clone({ projects: prepared.projects, workspaceData: prepared.workspaceData, documentLibrary: prepared.documentLibrary });
      for (const doc of incoming.documentLibrary.documents) for (const version of doc.versions) if (version.blobId) version.blobId = blobs.get(version.blobId);
      if (mode === "copy") incoming = remapEntities(incoming);
      for (const doc of incoming.documentLibrary.documents) {
        const existingDoc = documentModel.find(doc.id);
        if (existingDoc) {
          for (const version of doc.versions) {
            const prior = existingDoc.versions.find(v => v.id === version.id);
            if (prior && (prior.sha256 !== version.sha256 || prior.url !== version.url)) throw new Error("備份與現有文件使用相同版本識別碼但內容不同，請改用新增副本");
          }
          doc.versions.push(...existingDoc.versions.filter(v => !doc.versions.some(item => item.id === v.id)));
          doc.events.push(...existingDoc.events.filter(item => !doc.events.some(event => event.id === item.id)));
          Object.assign(existingDoc, doc);
        } else documentLibrary.documents.push(doc);
      }
      for (const [index, source] of incoming.projects.entries()) {
        const existing = getProject(source.id);
        const duplicate = mode === "copy" && Boolean(getProject(prepared.projects[index].id));
        const definition = projectDefinition({ ...source, name: duplicate ? `${source.name}（匯入副本）` : source.name, isSample: false });
        const data = incoming.workspaceData[source.id];
        documentModel.hydrate({ [source.id]: data });
        if (existing) Object.assign(existing, definition); else topologyProjects.push(definition);
        workspaceData[definition.id] = data; activity(data, "由備份還原", prepared.fileName);
        importedIds.push(definition.id);
      }
      workspaceLoadError = ""; persist();
    } catch (error) {
      install(before); workspaceLoadError = previousError;
      await removeBodies(records.map(record => record.id)).catch(() => {});
      if (previousUndo) localStorage.setItem(undoKey, previousUndo); else localStorage.removeItem(undoKey);
      throw error;
    }
    refreshProjectDataSurface();
    document.querySelector(".w-load-error")?.remove();
    return importedIds;
  }
  function undoImport() {
    const saved = JSON.parse(localStorage.getItem(undoKey) || "null");
    if (!saved) throw new Error("沒有可復原的還原紀錄");
    const before = snapshot();
    try { install(saved); persist(); localStorage.removeItem(undoKey); }
    catch (error) { install(before); throw error; }
    uiState.focusProjectId = null;
    history.replaceState({ surface: "portfolio" }, "", "#view=map"); showPortfolioSurface();
  }
  let exporting = false;
  exportWorkspaceBackup = async function() {
    if (exporting) return;
    exporting = true; showToast("正在整理案件與所有附件版本，請稍候…");
    try {
      const bundle = await buildBackup();
      const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
      const url = URL.createObjectURL(blob), anchor = document.createElement("a");
      anchor.href = url; anchor.download = `personal-assistant-${localISODate()}.pawork.json`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showToast(`已建立完整備份：${bundle.projects.length} 個案件、${bundle.attachments.length} 個附件版本`);
    } catch (error) { showToast(error.message); }
    finally { exporting = false; }
  };

  const dialog = document.createElement("dialog"); dialog.className = "w-dialog"; dialog.setAttribute("aria-labelledby", "w-title"); document.body.append(dialog);
  let handler, busy = false, previousFocus;
  const button = (label, action, extra = "") => `<button type="button" class="d-action" data-workspace-action="${action}" ${extra}>${label}</button>`;
  const field = (label, name, value = "", type = "text", required = false) => `<label>${label}${type === "textarea" ? `<textarea name="${name}" rows="3" ${required ? "required" : ""}>${e(value)}</textarea>` : `<input name="${name}" type="${type}" value="${e(value)}" ${required ? "required" : ""}>`}</label>`;
  function display(title, intro, content, submit = "", onSubmit = null) {
    previousFocus = document.activeElement; handler = onSubmit;
    dialog.innerHTML = `<form><header><div><h2 id="w-title">${title}</h2></div><button type="button" data-w-close aria-label="關閉">×</button></header><p class="d-help">${intro}</p><div class="d-form-fields">${content}</div><p class="d-form-error" role="alert"></p>${submit ? `<footer><button type="button" data-w-close>取消</button><button type="submit" class="primary-action">${submit}</button></footer>` : ""}</form>`;
    if (!dialog.open) dialog.showModal();
    const firstField = dialog.querySelector("input:not([data-project-search]), textarea, select");
    if (firstField) firstField.focus();
    else { const heading = dialog.querySelector("h2"); heading.setAttribute("tabindex", "-1"); heading.focus(); }
  }
  dialog.addEventListener("click", event => { if (event.target.closest("[data-w-close]") && !busy) dialog.close(); });
  dialog.addEventListener("cancel", event => { if (busy) event.preventDefault(); });
  dialog.addEventListener("close", () => { if (previousFocus?.isConnected) previousFocus.focus(); });
  dialog.addEventListener("submit", async event => {
    event.preventDefault(); if (!handler || busy) return;
    const values = new FormData(event.target); busy = true;
    dialog.querySelectorAll("button").forEach(element => { element.disabled = true; });
    try { await handler(values); dialog.close(); }
    catch (error) { dialog.querySelector(".d-form-error").textContent = error.message; }
    finally { busy = false; dialog.querySelectorAll("button").forEach(element => { element.disabled = false; }); }
  });
  const value = (values, key) => String(values.get(key) || "").trim();
  function newProjectDialog() {
    display("建立新案件", "預設以案件名稱作為交付目標。",
      field("案件名稱", "name", "", "text", true) + field("預計交付日（選填）", "due", "", "date") +
      '<details class="d-work-options"><summary>自訂交付目標與驗收標準</summary><div>' + field("交付目標", "goal") + field("驗收標準", "criteria", "", "textarea") + '</div></details>', "建立案件", values => {
        const project = createProject({ name: value(values, "name"), goal: value(values, "goal") || value(values, "name"), criteria: value(values, "criteria"), due: value(values, "due") });
        openProjectRoom(project.id, "overview"); showToast("案件已建立");
      });
  }
  let managerTab = "active";
  function manager() {
    const archived = managerTab === "archived";
    const samplePage = location.protocol === "file:" && !location.pathname.includes("/dist/") ? "./dist/examples.html" : "./examples.html";
    const projects = topologyProjects.filter(project => (workspaceData[project.id].lifecycle === "archived") === archived);
    display("案件與備份", "在這裡管理案件和備份。封存的案件可在「已封存」找到。",
      `<div class="w-manager-tools">${button("＋ 建立案件", "new-project")}${window.exampleWorkspace ? '<a class="d-action" href="./index.html">回我的工作區</a>' : '<a class="d-action" href="'+samplePage+'" target="_blank" rel="noopener">開啟清單範例 ↗</a>'}${button(`目前案件 ${getPortfolioProjects().length}`, "active", `aria-pressed="${!archived}"`)}${button(`已封存 ${topologyProjects.length - getPortfolioProjects().length}`, "archived", `aria-pressed="${archived}"`)}</div><label>搜尋案件<input type="search" data-project-search placeholder="案件名稱或交付目標" autocomplete="off"></label><div class="w-project-list">${projects.map(project => `<div class="w-project-row" data-search="${e(`${project.name} ${workspaceData[project.id].goal.title || ""}`.toLowerCase())}"><button type="button" class="d-work-link" data-workspace-action="open-project" data-project="${e(project.id)}"><strong>${e(project.name)}</strong><small>${e(workspaceData[project.id].goal.title || project.name)} · ${e(getProjectSnapshot(project).state)}</small></button>${button(archived ? "還原" : "管理", archived ? "restore-project" : "manage-project", `data-project="${e(project.id)}"`)}</div>`).join("") || `<p class="d-help">${archived ? "沒有已封存案件" : "目前沒有未封存案件，可建立新案或從封存區還原。"}</p>`}<p class="d-help" data-project-search-empty hidden>沒有符合的案件，試試其他名稱。</p></div><p><a class="d-action" href="./glossary.html" target="_blank" rel="noopener">工作用語辭典 ↗</a></p><section class="w-backup"><h3>完整備份</h3><p class="d-help">備份包含案件、文件庫、各版原檔和文件履歷。外部連結只備份網址。</p><div class="d-actions">${button("匯出完整備份", "export")}${button("從備份匯入", "import")}${localStorage.getItem(undoKey) ? button("復原上次還原", "undo-import") : ""}</div><p class="d-help">資料存放在目前裝置的這個瀏覽器。清除瀏覽器資料前，請先匯出備份。</p></section>`);
  }
  dialog.addEventListener("input", event => {
    if (!event.target.matches("[data-project-search]")) return;
    const term = event.target.value.trim().toLowerCase();
    const rows = [...dialog.querySelectorAll(".w-project-row")];
    rows.forEach(row => { row.hidden = !row.dataset.search.includes(term); });
    dialog.querySelector("[data-project-search-empty]").hidden = !term || rows.some(row => !row.hidden);
  });
  function manageProject(id) {
    const project = getProject(id), data = workspaceData[id]; if (!project || !data) return;
    display("管理案件", "案件名稱與交付目標可以不同。改名不會改動工作、資料關聯或交付紀錄。",
      field("案件名稱", "name", project.name, "text", true) + `<div class="w-lifecycle"><p class="d-help">${data.lifecycle === "archived" ? "此案件已封存，還原後會回到封存前的狀態。" : "暫時不需追蹤時可以封存；這不代表已完成交付。"}</p>${button(data.lifecycle === "archived" ? "還原案件" : "封存案件", data.lifecycle === "archived" ? "restore-project" : "archive-project", `data-project="${e(id)}"`)}</div>`, "儲存名稱", values => {
        const previous = renameProject(id, value(values, "name"));
        showToast("案件名稱已更新", { label: "復原改名", run: () => { renameProject(id, previous); showToast("已復原案件名稱"); } });
      });
  }
  importWorkspaceBackup = async function(file) {
    showToast("正在檢查備份與附件完整性…");
    try {
      const prepared = await prepareImport(file);
      const conflicts = prepared.projects.filter(project => getProject(project.id)).length;
      display("還原備份", `已檢查 ${prepared.projects.length} 個案件與 ${prepared.records.length} 個附件版本。${conflicts ? `其中 ${conflicts} 個案件與目前資料相同。` : ""}`,
        `<ul class="w-import-list">${prepared.projects.map(project => `<li>${e(project.name)} · ${prepared.workspaceData[project.id].tasks.length} 項工作</li>`).join("")}</ul><label>相同案件如何處理<select name="mode"><option value="copy">新增副本，保留目前案件</option><option value="replace">還原原案件，取代相同案件的目前資料</option></select></label><p class="d-help">未出現在備份中的案件會保留。還原原案件也會還原共用文件的目前版本，所有引用案件都會看到變更；既有的額外版本與履歷保留。還原前會保存整個工作區的復原點。</p>`, "確認還原", async values => {
          const ids = await applyImport(prepared, value(values, "mode"));
          openProjectRoom(ids[0], "overview"); showToast(`已還原 ${ids.length} 個案件與附件`, { label: "復原", run: () => { try { undoImport(); showToast("已回到還原前的資料"); } catch (error) { showToast(error.message); } } });
        });
    } catch (error) { showToast(error.message); }
  };
  document.addEventListener("click", async event => {
    const control = event.target.closest("[data-workspace-action]"); if (!control || control.disabled) return;
    const action = control.dataset.workspaceAction, id = control.dataset.project || uiState.projectId;
    try {
      if (action === "manager") return manager();
      if (action === "new-project") return newProjectDialog();
      if (action === "active" || action === "archived") { managerTab = action; return manager(); }
      if (action === "manage-project") return manageProject(id);
      if (action === "open-project") { dialog.close(); return openProjectRoom(id, "overview"); }
      if (action === "archive-project") {
        archiveProject(id); dialog.close(); uiState.focusProjectId = null;
        history.replaceState({ surface: "portfolio" }, "", "#view=map"); showPortfolioSurface();
        return showToast("案件已封存，資料保留在案件管理中", { label: "復原", run: () => { restoreProject(id); refreshProjectDataSurface(); showToast("案件已還原"); } });
      }
      if (action === "restore-project") { restoreProject(id); dialog.close(); openProjectRoom(id, "overview"); return showToast("案件已恢復封存前的狀態"); }
      if (action === "export") { dialog.close(); return exportWorkspaceBackup(); }
      if (action === "import") { dialog.close(); return backupInput.click(); }
      if (action === "undo-import") return display("復原上次還原", "案件會回到上次還原備份之前的狀態；還原之後新增的編輯也會被復原。", `<p class="d-help">需要保留目前編輯時，先匯出一份完整備份。</p>`, "回到還原前", () => { undoImport(); showToast("已復原上次還原"); });
      if (action === "open-file" || action === "download-file") return await accessFile(control.dataset.file, control.dataset.version, action === "download-file", control);
      if (action === "upload-task") return chooseEvidenceFiles("task", control.dataset.work);
      if (action === "link-task") return openLinkDialog("task", control.dataset.work);
      if (action === "file-version") {
        const file = workspaceData[id]?.files.find(item => item.id === control.dataset.file);
        if (!file) throw new Error("找不到資料");
        if (window.documentUI) return documentUI.update(documentModel.find(file.documentId));
        return display("加入檔案新版本", `為「${e(file.name)}」加入新版本。原版本及已送出紀錄保持原樣。`, `<label>新版本檔案<input type="file" name="versionFile" required></label>` + field("這一版改了什麼", "note", "", "textarea", true), "儲存新版本", async values => {
          const note = value(values, "note"); if (!note) throw new Error("請留下版本變更說明");
          const selected = values.get("versionFile");
          if (!(selected instanceof File) || !selected.name) throw new Error("請選擇新版本檔案");
          await storeFiles([selected], { projectId: id, fileId: file.id, kind: "project", note });
          showToast("附件新版本已保存，先前送出的版本仍然保留");
        });
      }
    } catch (error) { showToast(error.message); }
  });

  const originalRoom = renderProjectRoom;
  renderProjectRoom = function() {
    originalRoom();
    const data = workspaceData[uiState.projectId]; if (!data) return;
    const heading = projectRoomHeader.querySelector(".project-heading-copy");
    if (!projectRoom.classList.contains("reading-work")) heading?.insertAdjacentHTML("beforeend", `<div class="w-project-tools">${button("管理案件", "manage-project")}${data.lifecycle === "archived" ? `<span>已封存</span>${button("還原案件", "restore-project")}` : ""}</div>`);
    if (data.lifecycle === "archived") projectRoomContent.querySelector('[data-delivery-action="accept-goal"]')?.remove();
    const work = data.tasks.find(task => task.id === uiState.focusRecordId);
    if (uiState.projectTab === "board" && work) {
      const link = projectRoomContent.querySelector('[data-delivery-action="evidence"]');
      const section = link?.closest("section");
      if (section) {
        section.dataset.workSection = "files";
        const files = data.files.filter(file => file.workIds?.includes(work.id) || file.linkedType === "task" && file.linkedId === work.id);
        section.innerHTML = `<div class="d-section-title"><h3>工作文件</h3><button type="button" class="d-action primary-action evidence-drop" title="選擇或拖入檔案" data-workspace-action="upload-task" data-work="${e(work.id)}" data-evidence-kind="task" data-evidence-id="${e(work.id)}">加入文件</button></div>
          ${files.map(file => `${renderFile(file, data, true)}<button type="button" class="d-action" data-delivery-action="unlink" data-work="${e(work.id)}" data-item="${e(file.id)}">從這項工作移除</button>`).join("")}`;
        const extra = projectRoomContent.querySelector(".d-other-tools .d-actions");
        extra.insertAdjacentHTML("beforeend",`<button type="button" class="d-action" data-doc-action="choose" data-work="${e(work.id)}">從文件庫加入</button><button type="button" class="d-action" data-workspace-action="link-task" data-work="${e(work.id)}">加入連結</button>`);
      }
      // Submission history opens its pinned version, not today's current version.
      projectRoomContent.querySelectorAll(".d-request").forEach(card => {
        card.querySelectorAll(".d-round").forEach((round, roundIndex) => {
          const refs = work.requests.find(req=>req.id===card.dataset.requestId)?.rounds[roundIndex]?.artifacts || [];
          const controls = refs.map(ref => { const file = data.files.find(item => item.id === ref.fileId); const version = file?.versions.find(item => item.id === ref.versionId); return file && version?.blobId ? `<div class="w-file-actions"><span>${e(version.name)} · ${e(ref.versionLabel)}</span>${fileActions(file, version)}</div>` : ""; }).join("");
          if (controls) round.insertAdjacentHTML("beforeend", controls);
        });
      });
    }
  };
  updatePortfolioSummary = function() {
    const projects = getPortfolioProjects();
    portfolioProjectCount.textContent = projects.filter(project => workspaceData[project.id].lifecycle === "active").length;
    portfolioIssueCount.textContent = projects.reduce((count, project) => count + workspaceData[project.id].issues.filter(issue => issue.status === "open").length, 0);
    portfolioNearCount.textContent = getAttentionItems().filter(item => ["逾期", "期限", "案件逾期", "案件期限", "重要日期"].includes(item.kind)).length;
  };
  const previousTopology = renderTopology;
  renderTopology = function() {
    previousTopology();
    if (!getPortfolioProjects().length) {
      topologyLayout = { width: 800, height: 380, projectY: new Map() };
      mapStage.style.width = "800px"; mapStage.style.height = "380px";
      mapStage.innerHTML = `<div class="w-empty-map"><h2>開始一個新的交付目標</h2><p>建立案件，或從封存區還原既有案件。</p>${button("建立案件", "new-project")}${button("案件管理", "manager")}</div>`;
    }
  };
  const controls = document.createElement("div"); controls.className = "w-overview-actions";
  controls.innerHTML = `${button("＋ 新增案件", "new-project")}${button("案件與備份", "manager")}`;
  workspaceHeading.querySelector("div")?.append(controls);
  document.querySelector(".sample-flag").textContent = window.exampleWorkspace ? "範例工作區" : "本機工作區";
  const brand = document.querySelector(".identity strong");
  brand.outerHTML = `<button type="button" class="w-brand" data-workspace-action="manager" aria-label="個人工作台：案件與備份">個人工作台 <span>⌄</span></button>`;
  if (workspaceLoadError) {
    const notice = document.createElement("div"); notice.className = "w-load-error"; notice.setAttribute("role", "alert");
    notice.innerHTML = `${e(workspaceLoadError)} ${button("匯入備份", "import")}`; workspace.prepend(notice);
  }
  window.workspaceManager = { createProject, renameProject, archiveProject, restoreProject, storeFiles, fileContext, readBody, buildBackup, prepareImport, applyImport, undoImport, accessFile, snapshot, newProjectDialog };
  refreshProjectDataSurface();
})();
