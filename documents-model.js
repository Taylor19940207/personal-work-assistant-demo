/* Canonical documents live outside cases. Case files are references, not copies. */
(() => {
  const uid = prefix => `${prefix}-${crypto.randomUUID()}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const fields = ["name", "source", "url", "size", "date", "note", "versions"];
  const find = (id, library = documentLibrary) => library.documents.find(doc => doc.id === id);
  const current = file => {
    const doc = file?.documentId ? find(file.documentId) : file;
    return doc?.versions.find(version => version.id === doc.currentVersionId) || doc?.versions.at(-1);
  };
  function validate(library) {
    if (!library || !Array.isArray(library.documents)) throw new Error("文件庫格式不正確");
    const ids = new Set();
    for (const doc of library.documents) {
      if (!doc || typeof doc.id !== "string" || ids.has(doc.id) || typeof doc.name !== "string" || !Array.isArray(doc.versions) || !doc.versions.length || !Array.isArray(doc.events)) throw new Error("文件庫含有不完整或重複文件");
      ids.add(doc.id);
      if (new Set(doc.versions.map(v => v?.id)).size !== doc.versions.length || doc.versions.some(v => !v || typeof v.id !== "string")) throw new Error("文件版本格式不正確");
      if (doc.currentVersionId && !doc.versions.some(v => v.id === doc.currentVersionId)) throw new Error("找不到文件目前版本");
      if (doc.events.some(event => !event || typeof event.id !== "string" || event.versionId && !doc.versions.some(v => v.id === event.versionId))) throw new Error("文件履歷引用了不存在的版本");
      doc.aliases ||= [];
    }
  }
  function bind(file, library) {
    if (!find(file.documentId, library)) throw new Error("案件引用的文件不存在，已停止保存");
    for (const key of fields) {
      delete file[key];
      Object.defineProperty(file, key, { configurable: true, enumerable: false,
        get: () => find(file.documentId, library)?.[key],
        set: value => { const doc = find(file.documentId, library); if (doc) doc[key] = value; }
      });
    }
    file.workIds ||= file.linkedType === "task" && file.linkedId ? [file.linkedId] : [];
    file.issueIds ||= file.linkedType === "issue" && file.linkedId ? [file.linkedId] : [];
    return file;
  }
  function hydrate(data, library = documentLibrary, migration = true) {
    for (const project of Object.values(data)) {
      for (const file of project.files || []) {
        if (!file.documentId) {
          const versions = clone(file.versions?.length ? file.versions : [{ id: `${file.id}-v1`, name: file.name, url: file.url || "", date: file.date, source: file.source || "local" }]);
          const doc = { id: uid("doc"), name: file.name, source: file.source, url: file.url || "", size: file.size || "", date: file.date || "", note: file.note || "", versions, currentVersionId: versions.at(-1).id, aliases: [file.name], events: [] };
          for (const version of versions) doc.events.push({ id: `migration-${version.id}`, type: migration ? "legacy" : "added", versionId: version.id, date: version.date || "", recordedAt: migration ? "" : new Date().toISOString(), note: version.note || (migration ? "既有文件版本；原操作者與實際收件時間未記錄" : "加入文件來源") });
          library.documents.push(doc); file.documentId = doc.id;
        }
        const migrateIssue = !Array.isArray(file.issueIds);
        bind(file, library);
        if (migrateIssue) for (const issueId of file.issueIds) { const workId = project.issues?.find(issue => issue.id === issueId)?.taskId; if (workId && !file.workIds.includes(workId)) file.workIds.push(workId); }
      }
    }
  }
  function event(doc, type, values = {}) {
    if (values.id && doc.events.some(item => item.id === values.id)) return;
    const entry = { id: uid("doc-event"), type, date: localISODate(), recordedAt: new Date().toISOString(), actor: "本機使用者", versionId: current(doc)?.id, ...values };
    if (entry.date && (!parseDueValue(entry.date) || entry.date > localISODate())) throw new Error("實際發生日期需為有效日期，且不能在未來");
    if (entry.versionId && !doc.versions.some(v => v.id === entry.versionId)) throw new Error("所選版本不存在");
    doc.events.push(entry);
    // File operations appear in their work context without changing work status.
    const logNames = { provided: "提供文件", received: "收到文件", returned: "文件被退回", confirmed: "文件收件確認", updated: "共用文件更新", note: "文件補充紀錄" };
    if (!entry.requestId && logNames[type]) {
      const targets = entry.projectId ? [{ projectId: entry.projectId, workIds: entry.taskId ? [entry.taskId] : [] }] : type === "updated" ? usages(doc.id).map(use => ({ projectId: use.projectId, workIds: use.file.workIds })) : [];
      for (const target of targets) {
        const data = workspaceData[target.projectId]; if (!data) continue;
        const log = { id: uid("activity"), kind: "note", title: `${entry.supersedesId ? "更正：" : ""}${logNames[type]} · ${doc.name}`, detail: [entry.person, entry.channel, entry.note].filter(Boolean).join(" · "), date: entry.date, at: entry.recordedAt, documentId: doc.id, documentEventId: entry.id, versionId: entry.versionId, taskId: entry.taskId || "" };
        data.activity.unshift(log);
        for (const id of target.workIds || []) { const task = data.tasks.find(item => item.id === id); if (task) { task.history ||= []; task.history.unshift({ ...log, taskId: id, status: task.status }); } }
      }
    }
    return entry;
  }
  function link(documentId, projectId, taskId = "", issueId = "") {
    const doc = find(documentId), data = workspaceData[projectId];
    if (!doc || !data) throw new Error("找不到文件或案件");
    const issue = issueId ? data.issues.find(item => item.id === issueId) : null;
    if (issueId && !issue) throw new Error("問題已不存在");
    taskId ||= issue?.taskId || "";
    if (taskId && !data.tasks.some(task => task.id === taskId)) throw new Error("工作已不存在");
    let file = data.files.find(item => item.documentId === documentId);
    const added = !file || taskId && !file.workIds.includes(taskId) || issueId && !file.issueIds?.includes(issueId);
    if (!file) {
      file = { id: uid("file"), documentId, workIds: [], linkedType: issueId ? "issue" : "project", linkedId: issueId || "" };
      data.files.push(file); bind(file, documentLibrary);
    }
    if (taskId && !file.workIds.includes(taskId)) file.workIds.push(taskId);
    file.issueIds ||= [];
    if (issueId && !file.issueIds.includes(issueId)) file.issueIds.push(issueId);
    if (added) event(doc, "linked", { projectId, taskId, issueId, note: `選用於 ${getProject(projectId)?.name || "案件"}` });
    return file;
  }
  function source({ url, name = "", note = "", projectId = "", kind = "project", id = "" }) {
    url = normalizeExternalUrl(url);
    if (!url) throw new Error("請使用有效的 http 或 https 網址");
    const matches = documentLibrary.documents.filter(doc => !doc.archived && current(doc)?.url === url);
    let doc = matches.find(item => workspaceData[projectId]?.files.some(file => file.documentId === item.id)) || (matches.length === 1 ? matches[0] : null);
    if (!doc) {
      const version = { id: uid("version"), name: name.trim() || url, url, source: "link", date: localISODate(), note };
      doc = { id: uid("doc"), name: version.name, url, source: "link", size: "外部來源", date: version.date, note, versions: [version], currentVersionId: version.id, aliases: [version.name], events: [] };
      documentLibrary.documents.push(doc); event(doc, "added", { projectId, note });
    }
    if (!projectId) return doc;
    const file = link(doc.id, projectId, kind === "task" ? id : "", kind === "issue" ? id : "");
    const data = workspaceData[projectId], taskId = kind === "task" ? id : kind === "issue" ? data.issues.find(issue => issue.id === id)?.taskId || "" : "";
    const entry = { id: uid("activity"), evidenceId: file.id, documentId: doc.id, kind: "note", title: `使用來源：${file.name}`, detail: note || url, date: localISODate(), taskId };
    data.activity.unshift(entry);
    const task = data.tasks.find(item => item.id === taskId);
    if (task) { task.history ||= []; task.history.unshift({ ...entry }); }
    return file;
  }
  function usages(id) {
    return Object.entries(workspaceData).flatMap(([projectId, data]) => data.files.filter(file => file.documentId === id).map(file => ({ projectId, file, name: getProject(projectId)?.name || projectId, archived: data.lifecycle === "archived" })));
  }
  function sync() {
    hydrate(workspaceData, documentLibrary, false);
    for (const [projectId, data] of Object.entries(workspaceData)) {
      for (const task of data.tasks) for (const request of task.requests || []) for (const round of request.rounds || []) {
        for (const ref of round.artifacts || []) {
          const file = data.files.find(file => file.id === ref.fileId);
          const doc = file && find(file.documentId);
          if (!doc || !doc.versions.some(version => version.id === ref.versionId)) continue;
          const base = { projectId, taskId: task.id, requestId: request.id, roundId: round.id, versionId: ref.versionId, person: round.person || request.person || "", channel: "工作協作紀錄", actor: round.actor || "未記錄", recordedAt: round.recordedAt || (request.direction === "inbound" ? round.repliedAt || "" : round.recordedAt || "") };
          const inbound = request.direction === "inbound";
          const derived = (type, values) => {
            if (type === "receipt_confirmed") {
              const legacy = doc.events.find(item => item.requestId === request.id && item.roundId === round.id && item.versionId === ref.versionId && item.type === "confirmed");
              if (legacy) legacy.type = "receipt_confirmed";
            }
            // Imported copies remap IDs. Match the relationship, not a constructed ID.
            if (doc.events.some(item => item.roundId === round.id && item.versionId === ref.versionId && item.type === type)) return;
            return event(doc, type, values);
          };
          if (inbound ? round.receivedDate : round.sentDate) derived(inbound ? "received" : "provided", { ...base, id: `${round.id}-${ref.versionId}-transfer`, date: inbound ? round.receivedDate : round.sentDate, note: round.note || request.title, verification: "manual" });
          if (round.repliedAt && ["revise", "accepted"].includes(round.state)) derived(round.state === "revise" ? inbound ? "incomplete" : "returned" : inbound ? "receipt_confirmed" : "confirmed", { ...base, id: `${round.id}-${ref.versionId}-${round.state}`, relatedEventId: doc.events.find(item => item.roundId === round.id && item.versionId === ref.versionId && item.type === (inbound ? "received" : "provided"))?.id || "", recordedAt: round.repliedAt, date: round.replyDate || localISODate(new Date(round.repliedAt)), note: round.reply || "", verification: "manual" });
        }
      }
    }
  }
  function snapshot() { sync(); return { projects: projectRegistry(), workspaceData: clone(workspaceData), documentLibrary: clone(documentLibrary) }; }
  function restore(state) {
    documentLibrary.documents = clone(state.documentLibrary?.documents || []);
    for (const id of Object.keys(workspaceData)) delete workspaceData[id];
    Object.assign(workspaceData, clone(state.workspaceData)); hydrate(workspaceData);
  }
  function mutate(change) {
    const before = snapshot();
    try { const result = change(); if (!saveWorkspaceData()) throw new Error("無法儲存，這次變更已取消"); refreshProjectDataSurface(); return result; }
    catch (error) { restore(before); refreshProjectDataSurface(); throw error; }
  }
  function ingest(records, context) {
    const data = context.projectId ? workspaceData[context.projectId] : null;
    const targetFile = context.fileId ? data?.files.find(file => file.id === context.fileId) : null;
    const targetId = context.documentId || targetFile?.documentId;
    if ((context.fileId || context.documentId) && !find(targetId)) throw new Error("要更新的文件已不存在");
    if (targetId && context.baseVersionId && current(find(targetId))?.id !== context.baseVersionId) throw new Error("文件已有新版本，請重新開啟更新表單，確認後再保存");
    return records.map(body => {
      const matches = documentLibrary.documents.filter(doc => !doc.archived && current(doc)?.sha256 === body.sha256);
      let doc = targetId ? find(targetId) : !context.forceNew && matches.length === 1 ? matches[0] : null;
      const created = !doc;
      if (!doc) { doc = { id: uid("doc"), name: body.name, aliases: [], versions: [], events: [] }; documentLibrary.documents.push(doc); }
      let version = current(doc);
      const changed = version?.sha256 !== body.sha256;
      if (changed) {
        version = { id: uid("version"), name: body.name, blobId: body.id, size: body.size, type: body.type, sha256: body.sha256, date: context.date || localISODate(), createdAt: new Date().toISOString(), source: "stored", note: context.note || "" };
        doc.versions.push(version); doc.currentVersionId = version.id;
        Object.assign(doc, { source: "stored", url: "", size: formatFileSize(body.size), date: version.date });
      }
      doc.aliases = [...new Set([...(doc.aliases || []), body.name])];
      event(doc, context.eventType || (created ? "added" : changed ? "updated" : "reused"), { date: context.date || localISODate(), versionId: version.id, person: context.person || "", channel: context.channel || "", note: context.note || (changed ? "" : "內容與目前版本相同，沿用已存內容"), originalName: body.name, projectId: context.projectId || "", taskId: context.kind === "task" ? context.id || "" : context.kind === "issue" ? data?.issues.find(issue => issue.id === context.id)?.taskId || "" : "", issueId: context.kind === "issue" ? context.id : "" });
      return data ? link(doc.id, context.projectId, context.kind === "task" ? context.id : "", context.kind === "issue" ? context.id : "") : doc;
    });
  }
  try { validate(documentLibrary); hydrate(workspaceData); }
  catch (error) { workspaceLoadError = `文件庫讀取失敗：${error.message}。已停止寫入，原始資料保留。`; }
  window.documentModel = { find, current, validate, hydrate, event, link, source, usages, sync, snapshot, restore, mutate, ingest };
})();
