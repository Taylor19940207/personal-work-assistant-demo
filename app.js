const topologyProjects = [
  {
    id: "atelier-site", name: "Atelier 網站重構", color: "#83e8d3", state: "需要注意", tone: "warning", pattern: "solid", y: 170, progress: 62, deadline: "10/29 客戶檢視",
    nodes: [
      { id: "at-brief", x: 300, type: "event", date: "10/18", label: "內容與範圍完成盤點", summary: "將原本 11 個頁面收斂成 6 個主要路徑。", action: "完成內容盤點，刪除重複的服務敘述。", decision: "首頁先回答服務與信任，再進入案例。", next: "進入首頁資訊架構。", evidence: "內容盤點.md、舊站頁面表" },
      { id: "at-ia", x: 535, type: "decision", date: "10/21", label: "資訊架構方向確認", summary: "客戶同意以兩條主要受眾路徑重組內容。", action: "完成兩版資訊架構比較並主持確認。", decision: "保留案例入口，移除產業分類。", next: "開始首頁視覺稿。", evidence: "IA-v3.fig、會議紀錄 10/21" },
      { id: "at-visual", x: 790, type: "event", date: "10/25", label: "首頁視覺稿 v2", summary: "主要構圖已完成，內容與互動方向可以進入檢視。", action: "調整首屏比例與案例段落，補齊手機版狀態。", decision: "維持冷灰編輯感，品牌紅只用於識別。", next: "等待素材補齊後整理檢視版本。", evidence: "homepage-v2.fig、prototype-link" },
      { id: "at-photo", x: 790, yOffset: -72, type: "issue", date: "10/25", label: "商品攝影仍缺 4 張", summary: "缺少的素材集中在案例與商品模組，已影響內容確認。", action: "列出缺圖位置並寄出尺寸需求。", decision: "先用灰階佔位完成版面，不讓整輪停住。", next: "10/27 前收到素材，否則調整 10/29 檢視範圍。", evidence: "素材缺口清單.csv" },
      { id: "at-review", x: 1060, type: "milestone", date: "10/29", label: "客戶檢視", summary: "確認首頁、案例與手機版主要狀態。", action: "準備檢視腳本與未決問題。", decision: "待完成。", next: "依回饋進入前端交付。", evidence: "檢視清單（草稿）", current: true }
    ]
  },
  {
    id: "launch-film", name: "產品發布短片", color: "#b7a9ee", state: "推進中", tone: "success", pattern: "dash", y: 355, progress: 44, deadline: "11/05 最終交付",
    nodes: [
      { id: "lf-script", x: 300, type: "decision", date: "10/19", label: "60 秒腳本鎖定", summary: "文字、鏡頭與產品訊息已對齊。", action: "合併三版腳本並壓縮旁白。", decision: "用使用場景開場，不從產品特寫開始。", next: "進入動態分鏡。", evidence: "script-locked.pdf" },
      { id: "lf-board", x: 555, type: "event", date: "10/24", label: "動態分鏡完成 12 / 18", summary: "前半段節奏成立，後半段資訊密度偏高。", action: "完成主要轉場，標註仍需測試的鏡頭。", decision: "鏡頭 08 改用空間連續轉場。", next: "補齊後六鏡與配樂節點。", evidence: "animatic-v1.mp4" },
      { id: "lf-legal", x: 820, yOffset: 68, type: "issue", date: "10/25", label: "片尾字卡待法務確認", summary: "片尾聲明仍可能改字，影響最後兩秒排版。", action: "已提交兩種安全字數版本。", decision: "動畫先保留可伸縮版面。", next: "10/28 前取得確認。", evidence: "legal-copy-options.pdf" },
      { id: "lf-audio", x: 820, type: "event", date: "10/26", label: "配樂節點標註", summary: "主要節拍與三個情緒轉折已標記。", action: "將節點同步到動態分鏡時間軸。", decision: "保留 0.8 秒靜音作為產品揭示。", next: "完成動態分鏡 v2。", evidence: "music-cues.csv", current: true },
      { id: "lf-final", x: 1110, type: "milestone", date: "11/05", label: "最終交付", summary: "輸出 16:9、9:16 與無字幕版。", action: "待完成。", decision: "待完成。", next: "封存與素材交接。", evidence: "交付規格.md" }
    ]
  },
  {
    id: "studio-system", name: "工作室營運系統", color: "#e4b45d", state: "建立中", tone: "success", pattern: "dot", y: 540, progress: 31, deadline: "11/18 系統上線",
    nodes: [
      { id: "ss-audit", x: 300, type: "event", date: "10/16", label: "三次交付流程盤點", summary: "重複問題集中在需求變更、素材追蹤與尾款。", action: "回看三個專案的報價、信件與交付記錄。", decision: "先統一交付流程，再處理報價自動化。", next: "整理流程骨架。", evidence: "delivery-audit.md" },
      { id: "ss-contract", x: 560, type: "issue", date: "10/22", label: "舊合約版本散落", summary: "目前至少存在五個版本，條款差異沒有記錄。", action: "收集所有合約並標出差異。", decision: "建立單一母版與變更紀錄。", next: "確認最新付款與授權條款。", evidence: "contract-diff.xlsx" },
      { id: "ss-flow", x: 825, type: "event", date: "10/26", label: "交付流程草案", summary: "需求、製作、檢視、交付與回顧已形成一致骨架。", action: "將問題點放回各個流程節點。", decision: "每次檢視只確認一種層級。", next: "測試在下一個真實專案中使用。", evidence: "ops-flow-v1.md", current: true },
      { id: "ss-live", x: 1110, type: "milestone", date: "11/18", label: "系統上線", summary: "模板、資料夾與回顧流程開始正式使用。", action: "待完成。", decision: "待完成。", next: "一個月後回顧。", evidence: "上線清單（草稿）" }
    ]
  },
  {
    id: "research-notes", name: "研究筆記資料庫", color: "#8fa5a8", state: "暫緩", tone: "muted", pattern: "dash", y: 725, progress: 18, deadline: "尚未排定",
    nodes: [
      { id: "rn-source", x: 300, type: "event", date: "10/12", label: "現有來源完成匯入", summary: "34 份研究檔案已集中，但分類仍不一致。", action: "集中散落的 PDF、文章與會議筆記。", decision: "不先搬內容，先定義使用情境。", next: "建立標籤規則。", evidence: "source-index.csv" },
      { id: "rn-tags", x: 570, type: "decision", date: "10/20", label: "標籤規則待重新定義", summary: "原本的主題標籤太細，搜尋成本高於效益。", action: "將 42 個標籤合併成 9 個使用情境。", decision: "等營運系統穩定後再重啟。", next: "暫無下一期限。", evidence: "tag-taxonomy-v2.md", current: true }
    ]
  }
];

const workspaceSchemaVersion = 6;
if (window.exampleWorkspace) topologyProjects.length = 0;
const workspaceStorageKey = window.exampleWorkspace ? "personal-assistant-examples-v1" : "personal-assistant-workspaces-v6";
const legacyWorkspaceStorageKey = "personal-assistant-workspaces-v5";
const documentLibrary = { documents: [] };
let workspaceLoadError = "";
function projectDefinition(source) {
  if (!source || typeof source.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(source.id) || ["__proto__", "prototype", "constructor"].includes(source.id) || typeof source.name !== "string" || !source.name.trim()) throw new Error("專案定義不完整");
  const original = topologyProjects.find(project => project.id === source.id);
  return { id: source.id, name: source.name.trim(), color: /^#[0-9a-f]{6}$/i.test(source.color || "") ? source.color : "#83e8d3", state: "推進中", tone: "success", pattern: "solid", y: 170, progress: 0, deadline: "尚未排定", nodes: original?.nodes || [], isSample: source.isSample === true };
}
function projectRegistry() { return topologyProjects.map(({ id, name, color, isSample }) => ({ id, name, color, isSample: isSample !== false })); }
function emptyWorkspaceData() { return { lifecycle: "active", deadlineDate: "", deadlineTime: "", deadlineLabel: "交付目標", tasks: [], issues: [], decisions: [], files: [], activity: [], timeline: [] }; }
function getPortfolioProjects() { return topologyProjects.filter(project => workspaceData[project.id]?.lifecycle !== "archived"); }
function validateWorkspaceStructure(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("案件資料格式不正確");
  const list = (value, label) => { if (value != null && !Array.isArray(value)) throw new Error(`${label}必須是清單`); return value || []; };
  const objects = (value, label) => { const items = list(value, label); if (items.some(item => !item || typeof item !== "object" || Array.isArray(item))) throw new Error(`${label}含有無效項目`); return items; };
  if (data.goal != null && (typeof data.goal !== "object" || Array.isArray(data.goal))) throw new Error("交付目標格式不正確");
  for (const key of ["tasks", "issues", "decisions", "files", "activity", "timeline"]) objects(data[key], key);
  for (const task of data.tasks || []) {
    if (typeof task.id !== "string" || typeof task.title !== "string") throw new Error("工作缺少名稱或識別碼");
    for (const key of ["checklist", "reviewRounds", "conditions", "history", "milestones"]) objects(task[key], key);
    list(task.dependsOn, "工作關係"); list(task.legacyDependencies, "舊版工作關係");
    for (const request of objects(task.requests, "資料要求")) {
      if (typeof request.id !== "string" || !Array.isArray(request.rounds)) throw new Error("資料要求缺少往返紀錄清單");
      if (request.items != null) {
        if (!Array.isArray(request.items) || !request.items.length || new Set(request.items.map(item=>item?.id)).size!==request.items.length) throw Error("清單缺少項目或有重複識別碼");
        for (const item of objects(request.items,"清單項目")) {
          if (typeof item.id!=="string" || typeof item.title!=="string" || !["missing","checking","revise","ready"].includes(item.state) || !Array.isArray(item.refs)) throw Error("清單項目格式不正確");
          objects(item.refs,"清單版本"); objects(item.history,"項目紀錄");
        }
        objects(request.unfiled,"待整理的文件");
      }
      for (const round of objects(request.rounds, "往返紀錄")) objects(round.artifacts, "送出資料");
    }
  }
  for (const file of data.files || []) {
    if (typeof file.id !== "string" || !file.documentId && typeof file.name !== "string") throw new Error("附件缺少名稱或識別碼");
    list(file.workIds, "附件關聯");
    for (const version of objects(file.versions, "附件版本")) if (typeof version.id !== "string") throw new Error("附件版本缺少識別碼");
  }
}
const seedYear = 2026;
const boardColumns = [
  { id: "queue", label: "待處理", color: "#788b8e" },
  { id: "doing", label: "進行中", color: "#83e8d3" },
  { id: "review", label: "待確認", color: "#e4b45d" },
  { id: "done", label: "已完成", color: "#78c796" }
];

function createWorkspaceSeed() {
  return Object.fromEntries(topologyProjects.map(project => {
    const projectDeadline = seedDeadlineFromText(project.deadline);
    const staticCurrent = project.nodes.find(node => node.current);
    const orderedNodes = [...project.nodes]
      .filter(node => !node.yOffset && new Set(["event", "milestone"]).has(node.type))
      .sort((a, b) => a.x - b.x);
    const tasks = orderedNodes.map(node => ({
      id: `task-${node.id}`,
      title: node.label,
      detail: node.next,
      due: normalizeDateValue(node.date, seedYear),
      dueTime: "",
      priority: node.type === "milestone" ? "high" : node.current ? "medium" : "normal",
      status: staticCurrent && node.id === staticCurrent.id ? "doing" : staticCurrent && node.x < staticCurrent.x ? "done" : "queue"
    }));
    const issues = project.nodes.filter(node => node.type === "issue").map(node => ({
      id: `issue-${node.id}`,
      sourceNodeId: node.id,
      title: node.label,
      detail: node.summary,
      next: node.next,
      status: "open",
      date: normalizeDateValue(node.date, seedYear)
    }));
    const decisions = project.nodes.filter(node => node.type === "decision").map(node => ({
      id: `decision-${node.id}`,
      sourceNodeId: node.id,
      title: node.label,
      detail: node.decision,
      date: normalizeDateValue(node.date, seedYear)
    }));
    const files = project.nodes.filter(node => node.evidence).map(node => ({
      id: `file-${node.id}`,
      name: node.evidence,
      size: "專案證據",
      date: normalizeDateValue(node.date, seedYear),
      source: "seed"
    }));
    const today = localISODate();
    const activity = [...project.nodes]
      .filter(node => node.type !== "milestone" && normalizeDateValue(node.date, seedYear) <= today)
      .sort((a, b) => b.x - a.x)
      .map(node => ({
      id: `activity-${node.id}`,
      kind: node.type === "issue" ? "issue" : node.type === "decision" ? "decision" : "note",
      title: node.label,
      detail: node.action,
      date: normalizeDateValue(node.date, seedYear),
      sourceNodeId: node.id
    }));
    return [project.id, {
      lifecycle: project.state === "暫緩" ? "paused" : "active",
      deadlineDate: projectDeadline.date,
      deadlineTime: "",
      deadlineLabel: projectDeadline.label,
      tasks,
      issues,
      decisions,
      files,
      activity,
      timeline: []
    }];
  }));
}

function migrateProjectData(project, source, fallback) {
  if (source) validateWorkspaceStructure(source);
  const merged = { ...fallback, ...(source && typeof source === "object" ? source : {}) };
  if (source && !source.deliveryModelVersion) delete merged.deliveryModelVersion;
  const shadowTaskIds = new Set(project.nodes
    .filter(node => new Set(["issue", "decision"]).has(node.type))
    .map(node => `task-${node.id}`));
  const normalizeRecordDate = item => ({ ...item, date: normalizeDateValue(item?.date, seedYear) || item?.date || localISODate() });
  merged.lifecycle = new Set(["active", "paused", "completed", "archived"]).has(merged.lifecycle)
    ? merged.lifecycle
    : project.state === "暫緩" ? "paused" : "active";
  merged.deadlineDate = normalizeDateValue(merged.deadlineDate, seedYear);
  merged.deadlineTime = merged.deadlineDate ? String(merged.deadlineTime || "").slice(0, 5) : "";
  merged.tasks = (Array.isArray(merged.tasks) ? merged.tasks : fallback.tasks)
    .filter(task => source?.deliveryModelVersion || !shadowTaskIds.has(task.id))
    .map(task => ({
      ...task,
      dependsOn: Array.isArray(task.dependsOn) ? [...new Set(task.dependsOn.filter(id => typeof id === "string" && id !== task.id))] : [],
      review: task.review && typeof task.review === "object" ? task.review : undefined,
      due: normalizeDateValue(task.due, seedYear) || "未排定",
      completedAt: task.completedAt ? source?.deliveryModelVersion ? task.completedAt : normalizeDateValue(task.completedAt, seedYear) || task.completedAt : undefined
    }));
  merged.issues = (Array.isArray(merged.issues) ? merged.issues : fallback.issues).map(normalizeRecordDate);
  merged.decisions = (Array.isArray(merged.decisions) ? merged.decisions : fallback.decisions).map(normalizeRecordDate);
  merged.files = (Array.isArray(merged.files) ? merged.files : fallback.files).map(normalizeRecordDate);
  const plannedSeedActivityIds = new Set(project.nodes
    .filter(node => node.type === "milestone" || normalizeDateValue(node.date, seedYear) > localISODate())
    .map(node => `activity-${node.id}`));
  merged.activity = (Array.isArray(merged.activity) ? merged.activity : fallback.activity)
    .filter(item => !plannedSeedActivityIds.has(item.id))
    .map(normalizeRecordDate);
  merged.timeline = (Array.isArray(merged.timeline) ? merged.timeline : []).map(normalizeRecordDate);
  return merged;
}

function loadWorkspaceData() {
  const seed = createWorkspaceSeed();
  try {
    const currentPayload = JSON.parse(localStorage.getItem(workspaceStorageKey));
    const legacyPayload = currentPayload || window.exampleWorkspace ? null : JSON.parse(localStorage.getItem(legacyWorkspaceStorageKey)) || JSON.parse(localStorage.getItem("personal-assistant-workspaces-v4")) || JSON.parse(localStorage.getItem("personal-assistant-workspaces-v3")) || JSON.parse(localStorage.getItem("personal-assistant-workspaces-v2"));
    const payload = currentPayload || legacyPayload;
    const saved = payload?.workspaceData || payload;
    if (payload?.documentLibrary) {
      if (!Array.isArray(payload.documentLibrary.documents)) throw new Error("文件庫格式不正確");
      documentLibrary.documents = payload.documentLibrary.documents;
    }
    if (payload != null && (!saved || typeof saved !== "object" || Array.isArray(saved))) throw Error("工作區資料格式不正確");
    if (!saved) {
      topologyProjects.length = 0;
      return {};
    }
    if (Array.isArray(payload.projects)) {
      if (payload.projects.some(project => !Object.hasOwn(saved, project.id))) throw Error("工作區缺少登記案件的資料");
      const definitions = payload.projects.map(projectDefinition);
      for (const definition of definitions) {
        const existing = topologyProjects.find(project => project.id === definition.id);
        if (existing) Object.assign(existing, definition);
        else { topologyProjects.push(definition); seed[definition.id] = emptyWorkspaceData(); }
      }
    }
    // Seed definitions also supply historical map nodes. Only restore cases present on this device.
    for (let i = topologyProjects.length - 1; i >= 0; i--) {
      const id = topologyProjects[i].id;
      if (!Object.hasOwn(saved, id)) {
        delete seed[id];
        topologyProjects.splice(i, 1);
      }
    }
    for (const project of topologyProjects) {
      seed[project.id] = migrateProjectData(project, saved[project.id], seed[project.id]);
    }
  } catch (error) {
    workspaceLoadError = "無法讀取本機資料，已停止寫入以保留原始資料。請由備份還原。";
    console.warn("Unable to load local workspace data", error);
  }
  return seed;
}

const workspaceData = loadWorkspaceData();

function saveWorkspaceData() {
  if (workspaceLoadError) { showToast(workspaceLoadError); return false; }
  try {
    window.documentModel?.sync();
    localStorage.setItem(workspaceStorageKey, JSON.stringify({ schemaVersion: workspaceSchemaVersion, projects: projectRegistry(), workspaceData, documentLibrary }));
    return true;
  } catch (error) {
    console.warn("Unable to save local workspace data", error);
    showToast("瀏覽器未允許本機保存，這次變更只保留到頁面關閉");
    return false;
  }
}

const initialPortfolioView = location.hash ? "map" : new URLSearchParams(location.search).get("view") === "timeline" ? "list" : "mine";
const uiState = {
  scale: 0.85,
  x: 20,
  y: 0,
  view: "map",
  preferredView: initialPortfolioView,
  mobilePreferredView: initialPortfolioView,
  mobileExpandedProjectId: null,
  mode: "portfolio",
  surface: "portfolio",
  projectId: null,
  projectTab: "overview",
  focusRecordId: null,
  focusProjectId: null,
  selectedNodeId: null,
  commandSelection: 0,
  dragging: false,
  dragOrigin: null
};

let topologyLayout = {
  width: 1680,
  height: 900,
  projectY: new Map(topologyProjects.map(project => [project.id, project.y]))
};

const mapStage = document.querySelector("#map-stage");
const mapViewport = document.querySelector("#map-viewport");
const mapView = document.querySelector("#map-view");
const mobileOverview = document.querySelector("#mobile-overview");
const listView = document.querySelector("#list-view");
const inspector = document.querySelector("#node-inspector");
const inspectorContent = document.querySelector("#inspector-content");
const zoomValue = document.querySelector("#zoom-value");
const toast = document.querySelector("#toast");
const appFrame = document.querySelector(".app-frame");
const workspace = document.querySelector("#workspace");
const workspaceHeading = document.querySelector(".workspace-heading");
const projectRoom = document.querySelector("#project-room");
const projectRoomHeader = document.querySelector("#project-room-header");
const projectTabs = document.querySelector("#project-tabs");
const projectRoomContent = document.querySelector("#project-room-content");
const captureDialog = document.querySelector("#capture-dialog");
const captureForm = document.querySelector("#capture-form");
const captureKicker = document.querySelector("#capture-kicker");
const captureDialogTitle = document.querySelector("#capture-dialog-title");
const captureIntro = document.querySelector("#capture-intro");
const captureContext = document.querySelector("#capture-context");
const captureTitleField = document.querySelector("#capture-title-field");
const captureTitleLabel = document.querySelector("#capture-title-label");
const captureDetailLabel = document.querySelector("#capture-detail-label");
const captureDetailHelp = document.querySelector("#capture-detail-help");
const captureFollowupField = document.querySelector("#capture-followup-field");
const captureFollowupLabel = document.querySelector("#capture-followup-label");
const captureFollowupHelp = document.querySelector("#capture-followup-help");
const captureIssueField = document.querySelector("#capture-issue-field");
const captureIssueSelect = document.querySelector("#capture-issue");
const captureIssueSourceField = document.querySelector("#capture-issue-source-field");
const captureIssueSource = document.querySelector("#capture-issue-source");
const captureIssueImpact = document.querySelector("#capture-issue-impact");
const captureNextTaskField = document.querySelector("#capture-next-task-field");
const captureCreateTask = document.querySelector("#capture-create-task");
const captureSubmit = document.querySelector("#capture-submit");
const evidenceInput = document.querySelector("#evidence-input");
const backupInput = document.querySelector("#backup-input");
const commandDialog = document.querySelector("#command-dialog");
const commandInput = document.querySelector("#command-input");
const commandResults = document.querySelector("#command-results");
const portfolioProjectCount = document.querySelector("#portfolio-project-count");
const portfolioIssueCount = document.querySelector("#portfolio-issue-count");
const portfolioNearCount = document.querySelector("#portfolio-near-count");
const focusModeButton = document.querySelector('[data-mode="focus"]');
const resetMapButton = document.querySelector('[data-action="reset"]');
const captureTaskFields = document.querySelector("#capture-task-fields");
const scheduleDialog = document.querySelector("#schedule-dialog");
const scheduleForm = document.querySelector("#schedule-form");
const scheduleTitle = document.querySelector("#schedule-title");
const scheduleProjectFields = document.querySelector("#schedule-project-fields");
const scheduleTaskFields = document.querySelector("#schedule-task-fields");
const linkDialog = document.querySelector("#link-dialog");
const linkForm = document.querySelector("#link-form");
const linkContext = document.querySelector("#link-context");
const linkDialogTitle = document.querySelector("#link-dialog-title");
const linkTitle = document.querySelector("#link-title");
const linkUrl = document.querySelector("#link-url");
let toastTimer;
let inspectorTrigger;
let inspectorTriggerNodeId;
let commandTrigger;
let captureFlow = { mode: "create", issueId: null, taskId: null };
let evidenceTarget = { kind: "project", id: null };
let linkTarget = { kind: "project", id: null };
let linkFlow = { evidenceId: null };

const capturePresets = {
  task: {
    kicker: "工作",
    title: "新增工作",
    intro: "直接記下要完成的事，時間與優先順序可以現在設定，也可以稍後調整。",
    titleLabel: "要完成什麼",
    titlePlaceholder: "例如：整理客戶檢視版本",
    detailLabel: "完成標準或備註",
    detailPlaceholder: "完成到什麼程度才算結束？",
    detailHelp: "選填。寫清楚交付條件，之後移動工作時會更容易判斷。",
    submit: "新增工作"
  },
  issue: {
    kicker: "問題",
    title: "記錄問題",
    intro: "寫下遇到的問題，以及目前打算怎麼處理。",
    titleLabel: "問題是什麼",
    titlePlaceholder: "例如：商品攝影仍缺 4 張",
    detailLabel: "發生了什麼",
    detailPlaceholder: "描述影響、阻礙或已知原因",
    detailHelp: "問題會維持未解狀態，直到你填寫處理結果並關閉它。",
    followupLabel: "目前處理方式或下一步（選填）",
    followupPlaceholder: "例如：先用灰階佔位，10/27 前仍未收到就縮小檢視範圍",
    followupHelp: "已有暫定做法，可以先寫在這裡。",
    submit: "記錄問題"
  },
  decision: {
    kicker: "決策",
    title: "針對問題記錄決策",
    intro: "選擇要處理的問題，再記下決定與原因。",
    titleLabel: "決定了什麼",
    titlePlaceholder: "例如：首頁保留案例入口",
    detailLabel: "為什麼這樣決定",
    detailPlaceholder: "記錄考量、被捨棄的方案或判斷依據",
    detailHelp: "理由會與原問題一起保留，避免之後只剩結論。",
    followupLabel: "影響與下一步（選填）",
    followupPlaceholder: "哪些工作或交付需要跟著調整？",
    followupHelp: "選填。只記錄會改變後續工作的影響。",
    submit: "記錄決策"
  },
  note: {
    kicker: "工作進度",
    title: "新增進度紀錄",
    intro: "寫下做了什麼，之後可在案件紀錄查看。",
    titleLabel: "這次推進了什麼",
    titlePlaceholder: "例如：完成首頁手機版檢查",
    detailLabel: "做了什麼與結果",
    detailPlaceholder: "記錄完成內容、觀察或產出",
    detailHelp: "避免只寫狀態，優先記錄實際改變了什麼。",
    followupLabel: "下一步（選填）",
    followupPlaceholder: "接下來要推進什麼？",
    followupHelp: "選填。若沒有明確下一步，可以留空。",
    submit: "新增紀錄"
  }
};

function setActiveMode(mode) {
  document.querySelectorAll("[data-mode]").forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function syncDepthNavigation() {
  const inProject = uiState.surface === "project";
  const focusLabel = focusModeButton?.querySelector("small");
  if (focusLabel) focusLabel.textContent = inProject ? "案件" : "選案";
  if (focusModeButton) focusModeButton.title = inProject ? "回到案件總覽" : "選擇要查看的案件";
  if (resetMapButton) resetMapButton.hidden = inProject;
}

function seedDeadlineFromText(value = "") {
  const match = String(value).match(/^(\d{1,2})\/(\d{1,2})(?:\s+(.+))?$/);
  if (!match) return { date: "", label: "" };
  return {
    date: `${seedYear}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`,
    label: match[3] || "案件期限"
  };
}

function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateValue(value = "", fallbackYear = new Date().getFullYear()) {
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const short = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!short) return "";
  return `${fallbackYear}-${short[1].padStart(2, "0")}-${short[2].padStart(2, "0")}`;
}

function displayDateValue(value = "") {
  const normalized = normalizeDateValue(value, seedYear);
  if (!normalized) return String(value || "未排定");
  const [, month, day] = normalized.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function getISOWeekLabel(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function parseDueValue(dateValue, timeValue = "") {
  const normalized = normalizeDateValue(dateValue);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  const timeMatch = String(timeValue || "").match(/^(\d{1,2}):(\d{2})/);
  const hour = timeMatch ? Number(timeMatch[1]) : 23;
  const minute = timeMatch ? Number(timeMatch[2]) : 59;
  return {
    normalized,
    hasTime: Boolean(timeMatch),
    date: new Date(year, month - 1, day, hour, minute, 0, 0),
    daySerial: Date.UTC(year, month - 1, day)
  };
}

function formatDueValue(dateValue, timeValue = "") {
  const parsed = parseDueValue(dateValue, timeValue);
  if (!parsed) return "尚未排定";
  const dateText = new Intl.DateTimeFormat("zh-TW", { month: "numeric", day: "numeric" }).format(parsed.date);
  return parsed.hasTime ? `${dateText} ${String(timeValue).slice(0, 5)}` : dateText;
}

function getDueMeta(dateValue, timeValue = "", completed = false) {
  const parsed = parseDueValue(dateValue, timeValue);
  if (!parsed) return { state: "unscheduled", days: null, dueAt: Infinity, short: "未排定", display: "尚未排定" };
  const now = new Date();
  const todaySerial = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((parsed.daySerial - todaySerial) / 86400000);
  const display = formatDueValue(dateValue, timeValue);
  if (completed) return { state: "done", days, dueAt: parsed.date.getTime(), short: "已完成", display };
  if (parsed.date.getTime() < now.getTime()) {
    const short = days === 0 ? "已超時" : `逾期 ${Math.abs(days)} 天`;
    return { state: "overdue", days, dueAt: parsed.date.getTime(), short, display };
  }
  if (days === 0) return { state: "today", days, dueAt: parsed.date.getTime(), short: parsed.hasTime ? `今天 ${String(timeValue).slice(0, 5)}` : "今天到期", display };
  if (days <= 7) return { state: "soon", days, dueAt: parsed.date.getTime(), short: `剩 ${days} 天`, display };
  return { state: "scheduled", days, dueAt: parsed.date.getTime(), short: `剩 ${days} 天`, display };
}

function getProjectDeadline(project) {
  const data = workspaceData[project.id];
  const meta = getDueMeta(data?.deadlineDate, data?.deadlineTime);
  const label = data?.deadlineLabel || "案件期限";
  if (data?.lifecycle === "completed" || data?.lifecycle === "archived" && data.archivedFrom === "completed") {
    return { ...meta, state: "done", short: "已交付", label, display: data.goal?.acceptedAt ? `實際交付 ${formatDueValue(data.goal.acceptedAt.slice(0, 10))}` : `原訂 ${meta.display}` };
  }
  return { ...meta, label, display: meta.state === "unscheduled" ? "尚未排定" : `${meta.display} · ${label}` };
}

function priorityLabel(priority) {
  return priority === "high" ? "高優先" : priority === "medium" ? "中優先" : "一般";
}

function topologyDateLabel(dateValue) {
  const normalized = normalizeDateValue(dateValue);
  if (!normalized) return "未排定";
  const [, month, day] = normalized.split("-");
  return `${Number(month)}/${day}`;
}

function topologyXForDate(dateValue) {
  const target = parseDueValue(dateValue);
  if (!target) return null;
  const serials = [];
  topologyProjects.forEach(project => {
    const data = workspaceData[project.id];
    project.nodes.forEach(node => {
      const linkedTask = data?.tasks.find(task => task.id === `task-${node.id}`);
      const parsed = parseDueValue(linkedTask?.due || node.date);
      if (parsed) serials.push(parsed.daySerial);
    });
    (data?.tasks || []).forEach(task => {
      const parsed = parseDueValue(task.due);
      if (parsed) serials.push(parsed.daySerial);
    });
    const deadline = parseDueValue(data?.deadlineDate);
    if (deadline) serials.push(deadline.daySerial);
    (data?.timeline || []).forEach(node => {
      const parsed = parseDueValue(node.date);
      if (parsed) serials.push(parsed.daySerial);
    });
  });
  if (!serials.length) return 800;
  const min = Math.min(...serials);
  const max = Math.max(...serials);
  if (min === max) return 800;
  return 430 + (target.daySerial - min) / (max - min) * 770;
}

function projectTone(tone) {
  return tone === "danger" ? "var(--danger)" : tone === "warning" ? "var(--warning)" : tone === "success" ? "var(--success)" : "var(--muted)";
}

function estimateTopologyNodeHeight(node) {
  const labelLength = Array.from(String(node.label || "")).length;
  const lines = Math.max(1, Math.min(6, Math.ceil(labelLength / 12)));
  return 54 + (lines - 1) * 16;
}

function markTopologyBranchSides(nodes) {
  const groups = new Map();
  nodes.filter(node => !node.topologyHidden).forEach(node => {
    const key = node.branchBandKey || `${Math.round(Number(node.branchAnchorX) || Number(node.x) || 0)}|${normalizeDateValue(node.date) || "unscheduled"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(node);
  });
  groups.forEach((group, key) => {
    const above = [];
    const below = [];
    group.forEach(node => {
      let target;
      if (node.type === "issue") target = above.length < 4 ? above : below;
      else target = below.length < 4 ? below : above;
      target.push(node);
      node.branchSide = target === above ? -1 : 1;
      node.branchGroupKey = `${key}|${node.branchSide}`;
    });
  });
}

function applyTopologyDensityCap(nodes, project) {
  const branches = nodes.filter(node => node.topologyBranch).sort((a, b) => {
    const anchorA = Number(a.branchAnchorX) || Number(a.x) || 0;
    const anchorB = Number(b.branchAnchorX) || Number(b.x) || 0;
    return anchorA - anchorB;
  });
  const groups = [];
  branches.forEach(node => {
    const anchorX = Number(node.branchAnchorX) || Number(node.x) || 0;
    let group = groups.at(-1);
    if (!group || anchorX - group.maxAnchor >= 206) {
      group = { minAnchor: anchorX, maxAnchor: anchorX, nodes: [] };
      groups.push(group);
    }
    group.maxAnchor = Math.max(group.maxAnchor, anchorX);
    group.nodes.push(node);
  });

  const aggregateNodes = [];
  groups.forEach((band, bandIndex) => {
    const group = band.nodes;
    const bandKey = `${project.id}-band-${bandIndex}-${Math.round(band.minAnchor)}-${Math.round(band.maxAnchor)}`;
    group.forEach(node => { node.branchBandKey = bandKey; });
    if (group.length <= 8) return;
    const priority = node => node.type === "issue" ? 4 : node.type === "task" && node.taskStatus !== "done" ? 3 : node.type === "decision" ? 2 : 1;
    const ordered = group.map((node, index) => ({ node, index }))
      .sort((a, b) => priority(b.node) - priority(a.node) || a.index - b.index);
    const visibleIds = new Set(ordered.slice(0, 7).map(item => item.node.id));
    const hidden = group.filter(node => !visibleIds.has(node.id));
    hidden.forEach(node => { node.topologyHidden = true; });
    const anchor = [...group].sort((a, b) => (Number(b.branchAnchorX) || Number(b.x)) - (Number(a.branchAnchorX) || Number(a.x)))[0];
    const normalizedDates = group.map(node => normalizeDateValue(node.date)).filter(Boolean).sort();
    const dateLabel = normalizedDates.length && normalizedDates[0] !== normalizedDates.at(-1)
      ? `${topologyDateLabel(normalizedDates[0])}-${topologyDateLabel(normalizedDates.at(-1))}`
      : anchor.date;
    const clusterId = `cluster-${bandKey}`;
    group.forEach(node => { node.topologyClusterId = clusterId; });
    aggregateNodes.push({
      id: clusterId,
      type: "cluster",
      date: dateLabel,
      label: `其餘 ${hidden.length} 項`,
      summary: `這個日期共有 ${group.length} 個分支，圖上先顯示重點。`,
      action: "點開彙總節點可逐筆查看完整內容。",
      decision: "宏觀畫布每個日期最多顯示八個分支位置。",
      next: "選擇其中一筆紀錄，或進入案件工作區處理。",
      evidence: "所有項目都可在完整紀錄查看",
      x: Number(anchor.branchAnchorX) || Number(anchor.x),
      branchAnchorX: Number(anchor.branchAnchorX) || Number(anchor.x),
      topologyBranch: true,
      semanticMain: false,
      branchBandKey: bandKey,
      clusterNodeIds: group.map(node => node.id),
      clusterHiddenCount: hidden.length,
      clusterHasIssue: group.some(node => node.type === "issue")
    });
  });
  nodes.push(...aggregateNodes);
}

function assignTopologyBranchRows(nodes) {
  [-1, 1].forEach(side => {
    const rows = [];
    nodes
      .filter(node => node.branchSide === side)
      .sort((a, b) => a.x - b.x || String(a.id).localeCompare(String(b.id)))
      .forEach(node => {
        const start = node.x - 10;
        const end = node.x + 168;
        let row = rows.find(candidate => candidate.lastEnd + 28 <= start);
        if (!row) {
          row = { lastEnd: -Infinity, height: 54, nodes: [] };
          rows.push(row);
        }
        row.lastEnd = end;
        row.height = Math.max(row.height, estimateTopologyNodeHeight(node));
        row.nodes.push(node);
      });

    let edge = 27 + 34;
    rows.forEach(row => {
      const center = edge + row.height / 2;
      row.nodes.forEach(node => { node.yOffset = side * center; });
      edge += row.height + 24;
    });
  });
}

function resolveTopologyMainCollisions(nodes) {
  const accepted = [];
  const priority = node => node.current ? 3 : node.type === "milestone" ? 2 : 1;
  nodes
    .filter(node => !node.topologyBranch)
    .sort((a, b) => priority(b) - priority(a) || a.x - b.x)
    .forEach(node => {
      const start = node.x - 10;
      const end = node.x + 168;
      const collides = accepted.some(item => {
        const itemStart = item.x - 10;
        const itemEnd = item.x + 168;
        return end + 28 > itemStart && itemEnd + 28 > start;
      });
      if (collides) {
        node.topologyBranch = true;
        node.branchAnchorX = node.x;
      } else {
        node.yOffset = 0;
        delete node.branchAnchorX;
        accepted.push(node);
      }
    });
}

function getCurrentTask(data) {
  if (!data || data.lifecycle === "paused" || data.lifecycle === "archived") return null;
  const activeTasks = data.tasks.filter(task => task.status !== "done" && !getTaskBlockers(data, task).length);
  return activeTasks.find(task => task.status === "doing")
    || activeTasks.find(task => task.status === "review")
    || [...activeTasks].sort((a, b) => getDueMeta(a.due, a.dueTime).dueAt - getDueMeta(b.due, b.dueTime).dueAt)[0]
    || null;
}

function getProjectNodes(project, includeFullTimeline = false) {
  const data = workspaceData[project.id];
  const timeline = data?.timeline || [];
  const currentTask = getCurrentTask(data);
  const projectNodes = project.nodes.map(node => {
    const linkedTask = data?.tasks.find(task => task.id === `task-${node.id}`);
    const clone = linkedTask ? { ...node, date: topologyDateLabel(linkedTask.due), current: linkedTask.id === currentTask?.id } : { ...node, current: false };
    if (linkedTask) clone.linkedTaskId = linkedTask.id;
    clone.semanticMain = !node.yOffset;
    clone.topologyBranch = Boolean(node.yOffset);
    return clone;
  });
  if (!currentTask) {
    const fallbackCurrent = project.nodes.find(node => node.current);
    const fallbackClone = fallbackCurrent ? projectNodes.find(node => node.id === fallbackCurrent.id) : null;
    if (fallbackClone) fallbackClone.current = true;
  }
  const deadlineNode = [...projectNodes].reverse().find(node => node.type === "milestone" && !node.topologyBranch);
  if (deadlineNode) {
    deadlineNode.date = topologyDateLabel(data?.deadlineDate);
    deadlineNode.label = data?.deadlineLabel || deadlineNode.label;
  } else if (data?.deadlineDate) {
    const lastMainNode = projectNodes.filter(node => node.semanticMain).sort((a, b) => a.x - b.x).at(-1);
    projectNodes.push({
      id: `${project.id}-deadline`,
      x: Math.min((lastMainNode?.x || 820) + 270, 1320),
      type: "milestone",
      semanticMain: true,
      topologyBranch: false,
      date: topologyDateLabel(data.deadlineDate),
      label: data.deadlineLabel || "案件期限",
      summary: "由案件期限設定建立的里程碑。",
      action: "依期限推進案件工作。",
      decision: "期限可在案件工作區調整。",
      next: "完成期限前的必要工作與確認。",
      evidence: "案件期限設定"
    });
  }
  const baseTaskIds = new Set(project.nodes.map(node => `task-${node.id}`));
  const extraTasks = (data?.tasks || [])
    .filter(task => !baseTaskIds.has(task.id))
    .sort((a, b) => getDueMeta(a.due, a.dueTime).dueAt - getDueMeta(b.due, b.dueTime).dueAt || a.id.localeCompare(b.id));
  const currentBaseNode = projectNodes.find(node => node.current) || projectNodes.filter(node => node.semanticMain).at(-1);
  const taskNodes = extraTasks.map(task => {
    const due = getDueMeta(task.due, task.dueTime, task.status === "done");
    const statusLabel = boardColumns.find(item => item.id === task.status)?.label || task.status;
    return {
      id: `task-node-${task.id}`,
      linkedTaskId: task.id,
      x: Math.min((currentBaseNode?.x || 820) + 95, 1260),
      topologyBranch: true,
      semanticMain: false,
      type: "task",
      taskStatus: task.status,
      current: task.id === currentTask?.id,
      date: topologyDateLabel(task.due),
      label: task.title,
      summary: task.detail,
      action: `工作狀態：${statusLabel}。`,
      decision: `優先順序：${priorityLabel(task.priority)}。`,
      next: `${due.display} · ${due.short}`,
      evidence: "由工作板同步"
    };
  });
  const fullTimeline = timeline.map(node => ({
    ...node,
    x: topologyXForDate(node.date) || node.x,
    branchAnchorX: topologyXForDate(node.date) || node.x,
    topologyBranch: true,
    semanticMain: false
  }));
  const visibleTimeline = includeFullTimeline ? fullTimeline : fullTimeline.slice(-6);
  const displayNodes = [...projectNodes, ...taskNodes, ...visibleTimeline];
  const dateGroups = new Map();
  displayNodes.forEach(node => {
    const dateKey = normalizeDateValue(node.date);
    if (!dateKey) return;
    if (!dateGroups.has(dateKey)) dateGroups.set(dateKey, []);
    dateGroups.get(dateKey).push(node);
  });
  dateGroups.forEach((nodes, dateKey) => {
    const anchorX = topologyXForDate(dateKey);
    nodes.forEach(node => { node.x = anchorX; });
    const mainCandidates = nodes.filter(node => !node.topologyBranch && node.type !== "task");
    const primary = mainCandidates.find(node => node.current) || mainCandidates.find(node => node.type === "milestone") || mainCandidates[0] || null;
    if (primary) {
      primary.yOffset = 0;
      delete primary.branchAnchorX;
    }
    const branches = nodes.filter(node => node !== primary);
    branches.forEach(node => {
      node.x = anchorX;
      node.branchAnchorX = anchorX;
      node.topologyBranch = true;
    });
  });
  const unscheduledBranches = displayNodes.filter(node => node.topologyBranch && !normalizeDateValue(node.date));
  unscheduledBranches.forEach(node => {
    const anchorX = Math.min((currentBaseNode?.x || 820) + 95, 1260);
    node.x = anchorX;
    node.branchAnchorX = anchorX;
  });
  resolveTopologyMainCollisions(displayNodes);
  applyTopologyDensityCap(displayNodes, project);
  markTopologyBranchSides(displayNodes.filter(node => node.topologyBranch));
  assignTopologyBranchRows(displayNodes);
  return displayNodes;
}

function computeTopologyLayout() {
  const projectY = new Map();
  const extents = topologyProjects.map(project => {
    const nodes = getProjectNodes(project).filter(node => !node.topologyHidden);
    let top = 62;
    let bottom = 62;
    nodes.forEach(node => {
      const halfHeight = estimateTopologyNodeHeight(node) / 2 + (node.current || node.type === "issue" ? 16 : 8);
      const offset = Number(node.yOffset) || 0;
      top = Math.max(top, halfHeight - offset);
      bottom = Math.max(bottom, halfHeight + offset);
    });
    return { project, top, bottom };
  });

  let previous = null;
  extents.forEach(extent => {
    const y = previous
      ? previous.y + previous.bottom + extent.top + 72
      : Math.max(170, extent.top + 82);
    projectY.set(extent.project.id, y);
    previous = { ...extent, y };
  });

  const finalHeight = previous ? previous.y + previous.bottom + 110 : 900;
  return { width: 1680, height: Math.max(900, Math.ceil(finalHeight)), projectY };
}

function projectLaneY(project) {
  return topologyLayout.projectY.get(project.id) ?? project.y;
}

function getProjectSnapshot(project) {
  const data = workspaceData[project.id];
  const completed = data.tasks.filter(task => task.status === "done").length;
  const activeTasks = data.tasks.filter(task => task.status !== "done");
  const openIssues = data.issues.filter(issue => issue.status === "open");
  const lifecycle = data.lifecycle || (project.state === "暫緩" ? "paused" : "active");
  const taskProgress = data.tasks.length ? Math.round((completed / data.tasks.length) * 100) : project.progress;
  const progress = lifecycle === "paused" ? project.progress : taskProgress;
  const currentTask = getCurrentTask(data);
  const deadline = getProjectDeadline(project);
  const taskDeadlines = activeTasks.map(task => getDueMeta(task.due, task.dueTime));
  const hasOverdueTask = taskDeadlines.some(item => item.state === "overdue");
  const hasNearTask = taskDeadlines.some(item => ["today", "soon"].includes(item.state));
  const blockedTasks = activeTasks.filter(task => getTaskBlockers(data, task).length);
  const isComplete = lifecycle === "completed" || lifecycle === "active" && progress === 100 && openIssues.length === 0;
  let state = "推進中";
  let tone = project.tone;
  if (lifecycle === "paused") { state = "暫停"; tone = "muted"; }
  else if (lifecycle === "archived") { state = "已封存"; tone = "muted"; }
  else if (isComplete) { state = "已完成"; tone = "success"; }
  else if (deadline.state === "overdue") { state = "案件逾期"; tone = "danger"; }
  else if (hasOverdueTask) { state = "有逾期工作"; tone = "danger"; }
  else if (blockedTasks.length) { state = "有工作等待前置"; tone = "warning"; }
  else if (openIssues.length) { state = "有待解決問題"; tone = "warning"; }
  else if (["today", "soon"].includes(deadline.state) || hasNearTask) { state = "期限接近"; tone = "warning"; }
  else if (!activeTasks.length) state = project.state;
  const lifecycleLabel = lifecycle === "paused" ? "暫停" : lifecycle === "completed" ? "完成" : lifecycle === "archived" ? "封存" : "進行中";
  return { completed, active: activeTasks, blockedTasks, openIssues, progress, currentTask, state, tone, deadline, hasOverdueTask, hasNearTask, lifecycle, lifecycleLabel };
}

function getNode(nodeId) {
  for (const project of topologyProjects) {
    const node = getProjectNodes(project).find(item => item.id === nodeId)
      || getProjectNodes(project, true).find(item => item.id === nodeId);
    if (node) return { project, node };
  }
  return null;
}

function showToast(message, undoAction = null) {
  clearTimeout(toastTimer);
  const messageNode = document.createElement("span");
  messageNode.textContent = message;
  toast.replaceChildren(messageNode);
  if (undoAction) {
    const undoButton = document.createElement("button");
    undoButton.type = "button";
    undoButton.className = "toast-action";
    undoButton.textContent = undoAction.label || "復原";
    undoButton.addEventListener("click", () => {
      clearTimeout(toastTimer);
      undoAction.run();
    }, { once: true });
    toast.append(undoButton);
  }
  toast.classList.add("is-visible");
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), undoAction ? 5000 : 2500);
}

function nodePosition(project, node) {
  const x = Math.min(1420, Math.max(230, Number(node.x) || 300));
  const yOffset = Number(node.yOffset) || 0;
  return { x, y: projectLaneY(project) + yOffset };
}

function projectPath(project) {
  const projectNodes = getProjectNodes(project).filter(node => !node.topologyHidden);
  const mainNodes = projectNodes.filter(node => !node.yOffset).sort((a, b) => a.x - b.x);
  const laneY = projectLaneY(project);
  const startX = 218;
  const endX = Math.max(...projectNodes.map(node => Number(node.x) || startX), 1220) + 80;
  const path = `M ${startX} ${laneY} C ${startX + 35} ${laneY}, ${startX + 45} ${laneY}, ${startX + 70} ${laneY} L ${endX} ${laneY}`;
  const branchGroups = new Map();
  projectNodes.filter(node => node.yOffset).forEach(node => {
    const key = node.branchGroupKey || `${node.branchAnchorX}|${node.branchSide}`;
    if (!branchGroups.has(key)) branchGroups.set(key, []);
    branchGroups.get(key).push(node);
  });
  const branches = [...branchGroups.values()].map(group => {
    const positions = group.map(node => ({ node, ...nodePosition(project, node) }));
    const originXs = [...new Set(group.map(node => Number(node.branchAnchorX) || Number(node.x)))].sort((a, b) => a - b);
    const side = Number(group[0].branchSide) || Math.sign(Number(group[0].yOffset)) || 1;
    const trunkX = Math.max(232, Math.min(...originXs) - 44);
    const nearestY = side < 0 ? Math.max(...positions.map(item => item.y)) : Math.min(...positions.map(item => item.y));
    const farthestY = side < 0 ? Math.min(...positions.map(item => item.y)) : Math.max(...positions.map(item => item.y));
    const approachY = laneY + side * 28;
    const roots = originXs.map(originX => `<path class="topology-branch topology-branch-root" d="M ${originX} ${laneY} C ${originX - 18} ${laneY}, ${trunkX} ${approachY}, ${trunkX} ${nearestY}" />`).join("");
    const trunk = `<path class="topology-branch topology-branch-trunk" d="M ${trunkX} ${nearestY} L ${trunkX} ${farthestY}" />`;
    const stems = positions.map(item => `<path class="topology-branch topology-branch-stem" d="M ${trunkX} ${item.y} L ${item.x} ${item.y}" />`).join("");
    return `${roots}${trunk}${stems}`;
  }).join("");
  return `<g class="topology-path-group" data-project-path="${project.id}"><path class="topology-line" data-pattern="${project.pattern}" d="${path}" />${branches}</g>`;
}

function eventNode(project, node) {
  const pos = nodePosition(project, node);
  const nodeHeight = estimateTopologyNodeHeight(node);
  const nodeType = new Set(["event", "task", "decision", "issue", "milestone", "cluster"]).has(node.type) ? node.type : "event";
  const nodeDate = String(node.date || "未排定");
  const normalizedNodeDate = normalizeDateValue(nodeDate);
  const selected = uiState.selectedNodeId === node.id;
  const muted = uiState.focusProjectId && uiState.focusProjectId !== project.id;
  const issueRecord = nodeType === "issue" ? workspaceData[project.id]?.issues.find(issue => issue.id === (node.linkedRecordId || `issue-${node.id}`)) : null;
  const resolved = issueRecord?.status === "resolved" || nodeType === "task" && node.taskStatus === "done";
  return `
    <button class="event-node ${node.current ? "is-current" : ""} ${selected ? "is-selected" : ""} ${muted ? "is-muted" : ""} ${resolved ? "is-resolved" : ""}"
      type="button" data-node-id="${escapeHTML(node.id)}" data-project-id="${project.id}" data-type="${nodeType}" ${node.clusterHasIssue ? "data-has-issue=\"true\"" : ""}
      style="left:${pos.x - 10}px;top:${pos.y - nodeHeight / 2}px;--node-color:${project.color}"
      aria-label="${escapeHTML(project.name)}，${escapeHTML(nodeDate)}，${escapeHTML(node.label)}${nodeType === "cluster" ? "，開啟同日完整項目" : ""}${node.current ? "，目前位置" : ""}${resolved ? nodeType === "task" ? "，工作已完成" : "，問題已解決" : ""}">
      <span class="node-mark" aria-hidden="true"></span>
      <span class="node-label">${escapeHTML(node.label)}</span>
      <time class="node-date" ${normalizedNodeDate ? `datetime="${escapeHTML(normalizedNodeDate)}"` : ""}>${escapeHTML(nodeDate)}</time>
    </button>`;
}

function renderTopology() {
  topologyLayout = computeTopologyLayout();
  mapStage.style.width = `${topologyLayout.width}px`;
  mapStage.style.height = `${topologyLayout.height}px`;
  const paths = topologyProjects.map(projectPath).join("");
  const labels = topologyProjects.map(project => {
    const snapshot = getProjectSnapshot(project);
    const laneY = projectLaneY(project);
    return `
      <button class="project-lane-label ${uiState.focusProjectId && uiState.focusProjectId !== project.id ? "is-muted" : ""}"
        type="button" data-focus-project="${project.id}"
        style="top:${laneY - 31}px;--project-color:${project.color};--state-color:${projectTone(snapshot.tone)}">
        <strong>${escapeHTML(project.name)}</strong><small>${snapshot.progress}% / ${escapeHTML(snapshot.deadline.display)}</small><span class="lane-state">${escapeHTML(snapshot.state)} · ${snapshot.openIssues.length} 問題 · ${escapeHTML(snapshot.deadline.short)}</span>
      </button>`;
  }).join("");
  const nodes = topologyProjects.flatMap(project => getProjectNodes(project).filter(node => !node.topologyHidden).map(node => eventNode(project, node))).join("");
  const ends = topologyProjects.map(project => {
    const finalNode = getProjectNodes(project).filter(node => !node.topologyHidden && node.type !== "cluster").sort((a, b) => b.x - a.x)[0];
    const snapshot = getProjectSnapshot(project);
    return `<div class="project-end-label" style="left:${Math.min(Math.max(finalNode.x + 205, 1300), 1450)}px;top:${projectLaneY(project) - 27}px"><strong>${escapeHTML(snapshot.state)}</strong><span>${escapeHTML(snapshot.deadline.short)}${snapshot.currentTask ? ` · ${escapeHTML(snapshot.currentTask.title)}` : ""}</span><button type="button" data-open-project="${project.id}">進入案件</button></div>`;
  }).join("");

  mapStage.innerHTML = `<svg class="topology-svg" viewBox="0 0 ${topologyLayout.width} ${topologyLayout.height}" aria-hidden="true">${paths}</svg>${labels}${nodes}${ends}`;
  updatePortfolioSummary();
  updateFocusClasses();
  applyTransform();
}

function updatePortfolioSummary() {
  portfolioProjectCount.textContent = topologyProjects.filter(project => getProjectSnapshot(project).lifecycle === "active").length;
  portfolioIssueCount.textContent = topologyProjects.reduce((total, project) => total + workspaceData[project.id].issues.filter(issue => issue.status === "open").length, 0);
  portfolioNearCount.textContent = topologyProjects.reduce((total, project) => {
    const snapshot = getProjectSnapshot(project);
    const projectRisk = snapshot.lifecycle === "active" && ["overdue", "today", "soon"].includes(snapshot.deadline.state) ? 1 : 0;
    const taskRisk = workspaceData[project.id].tasks.filter(task => task.status !== "done" && ["overdue", "today", "soon"].includes(getDueMeta(task.due, task.dueTime).state)).length;
    return total + projectRisk + taskRisk;
  }, 0);
}

function updateFocusClasses() {
  const issuesOnly = uiState.mode === "issues";
  document.querySelectorAll("[data-project-path]").forEach(path => {
    const id = path.dataset.projectPath;
    path.classList.toggle("is-focused", uiState.focusProjectId === id);
    path.classList.toggle("is-muted", issuesOnly || Boolean(uiState.focusProjectId && uiState.focusProjectId !== id));
  });
  document.querySelectorAll(".event-node").forEach(node => {
    node.classList.toggle("is-muted", issuesOnly && node.dataset.type !== "issue" && node.dataset.hasIssue !== "true");
  });
}

function applyTransform() {
  mapStage.style.setProperty("--map-x", `${uiState.x}px`);
  mapStage.style.setProperty("--map-y", `${uiState.y}px`);
  mapStage.style.setProperty("--map-scale", uiState.scale);
  const zoomLevel = uiState.scale < .68 ? "overview" : uiState.scale < .95 ? "context" : "detail";
  const zoomLabel = zoomLevel === "overview" ? "概覽" : zoomLevel === "context" ? "一般" : "細節";
  mapStage.dataset.zoomLevel = zoomLevel;
  mapStage.querySelectorAll(".event-node").forEach(node => {
    const overviewHidden = zoomLevel === "overview"
      && !node.matches(".is-current, .is-selected, [data-type='issue'], [data-type='milestone'], [data-type='cluster']");
    node.tabIndex = overviewHidden ? -1 : 0;
    if (overviewHidden) node.setAttribute("aria-hidden", "true");
    else node.removeAttribute("aria-hidden");
  });
  zoomValue.value = `${Math.round(uiState.scale * 100)}% · ${zoomLabel}`;
  zoomValue.textContent = zoomValue.value;
}

let mapCameraReady = false;
let mapCameraSize = null;
let portfolioScroll = { page: 0, list: 0 };
// Pointer coordinates and DOMRects are visual pixels. Pan, scroll and CSS
// translations are stored in layout pixels, independently of browser zoom.
function appLayoutScale() {
  return parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
}

function mapPoint(clientX, clientY) {
  const rect = mapViewport.getBoundingClientRect();
  const scale = appLayoutScale();
  return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
}

function resizeMapCamera() {
  const width = mapViewport.clientWidth, height = mapViewport.clientHeight;
  if (!width || !height) return;
  if (!mapCameraReady) return fitMap();
  if (mapCameraSize) {
    uiState.x += (width - mapCameraSize.width) / 2;
    uiState.y += (height - mapCameraSize.height) / 2;
  }
  mapCameraSize = { width, height };
  applyTransform();
}

function fitMap() {
  const width = mapViewport.clientWidth, height = mapViewport.clientHeight;
  if (!width || !height) return;
  mapCameraReady = true;
  mapCameraSize = { width, height };
  const scaleX = (width - 30) / topologyLayout.width;
  const scaleY = (height - 20) / topologyLayout.height;
  uiState.scale = Math.min(1, Math.max(.55, Math.min(scaleX, scaleY)));
  uiState.x = Math.max(10, (width - topologyLayout.width * uiState.scale) / 2);
  uiState.y = Math.max(2, (height - topologyLayout.height * uiState.scale) / 2);
  applyTransform();
}

function setZoom(nextScale) {
  const rect = mapViewport.getBoundingClientRect();
  setZoomAt(nextScale, rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function setZoomAt(nextScale, clientX, clientY) {
  const { x: pointerX, y: pointerY } = mapPoint(clientX, clientY);
  const previous = uiState.scale;
  const worldX = (pointerX - uiState.x) / previous;
  const worldY = (pointerY - uiState.y) / previous;
  uiState.scale = Math.min(1.6, Math.max(.55, nextScale));
  uiState.x = pointerX - worldX * uiState.scale;
  uiState.y = pointerY - worldY * uiState.scale;
  applyTransform();
}

function setView(view, { persistPreference = true } = {}) {
  const isMobile = window.innerWidth < 720;
  uiState.view = view;
  if (persistPreference) {
    if (isMobile) uiState.mobilePreferredView = view;
    else uiState.preferredView = view;
  }
  const presentation = window.mobileWorkspace?.presentation();
  const showMap = view === "map" && (presentation ? presentation === "canvas" : !isMobile);
  const showMobileOverview = view === "map" && (presentation ? presentation === "tree" : isMobile);
  const showList = view === "list" || view === "mine";
  mapView.hidden = !showMap;
  mobileOverview.hidden = !showMobileOverview;
  listView.hidden = !showList;
  listView.setAttribute("aria-label", view === "mine" ? "待辦與跟進" : "時間軸與完整紀錄");
  appFrame.classList.toggle("is-my-work", view === "mine" && uiState.surface === "portfolio");
  appFrame.classList.toggle("empty-home", view === "mine" && !getPortfolioProjects().length);
  appFrame.classList.toggle("is-list-view", showList && uiState.surface === "portfolio");
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = false;
    button.title = "";
    if (button.dataset.view === "map") button.textContent = "拓樸圖";
    if (button.dataset.view === "list") button.textContent = "時間軸";
  });
  document.querySelector("#workspace-title").textContent = view === "mine" ? "我的工作" : "全部案件";
  if (showList) renderList();
  if (showMobileOverview) renderMobileOverview();
  window.mobileWorkspace?.sync();
  if (showMap) requestAnimationFrame(() => { if (!mapView.hidden && uiState.surface === "portfolio") resizeMapCamera(); });
}

function renderList() {
  const projects = uiState.focusProjectId ? topologyProjects.filter(project => project.id === uiState.focusProjectId) : topologyProjects;
  listView.innerHTML = `<div class="event-tree">${projects.map(project => {
    const snapshot = getProjectSnapshot(project);
    const nodes = getProjectNodes(project, true)
      .filter(node => node.type !== "cluster")
      .filter(node => uiState.mode !== "issues" || node.type === "issue")
      .sort((a, b) => a.x - b.x);
    return `<details class="tree-project" open>
      <summary><strong>${escapeHTML(project.name)}</strong><span>${snapshot.progress}% / ${escapeHTML(snapshot.state)} / ${escapeHTML(snapshot.deadline.display)}</span></summary>
      <div class="tree-events">${nodes.length ? nodes.map(node => `
        <button class="tree-event" type="button" data-node-id="${escapeHTML(node.id)}" data-type="${escapeHTML(node.type)}">
          <time>${escapeHTML(node.date)}</time><strong>${escapeHTML(node.label)}</strong><small>${node.type === "issue" ? "問題" : node.type === "task" ? "工作" : node.current ? "目前" : "記錄"}</small>
        </button>`).join("") : `<div class="empty-state">這個案件目前沒有問題紀錄</div>`}</div>
    </details>`;
  }).join("")}</div>`;
}

function isOpenIssueNode(project, node) {
  if (node.type !== "issue") return false;
  const issueId = node.linkedRecordId || `issue-${node.id}`;
  return workspaceData[project.id]?.issues.some(issue => issue.id === issueId && issue.status === "open")
    || !workspaceData[project.id]?.issues.some(issue => issue.id === issueId);
}

function mobileNodeKind(project, node) {
  if (node.current) return "目前";
  if (node.type === "issue") return isOpenIssueNode(project, node) ? "待解決問題" : "已處理問題";
  if (node.type === "task") return node.taskStatus === "done" ? "已完成工作" : "工作";
  if (node.type === "milestone") return "里程碑";
  if (node.type === "decision") return "決策";
  return "進度";
}

function mobileProjectNodes(project) {
  const nodes = getProjectNodes(project, true)
    .filter(node => node.type !== "cluster")
    .sort((a, b) => a.x - b.x || String(a.id).localeCompare(String(b.id)));
  const relevant = [];
  const add = node => {
    if (node && !relevant.some(item => item.id === node.id)) relevant.push(node);
  };
  if (uiState.mode === "issues") {
    nodes.filter(node => node.type === "issue").forEach(add);
    return relevant.slice(0, 6);
  }
  add(nodes.find(node => node.semanticMain));
  nodes.filter(node => node.current).forEach(add);
  nodes.filter(node => isOpenIssueNode(project, node)).slice(0, 2).forEach(add);
  nodes.filter(node => node.type === "task" && node.taskStatus !== "done").slice(0, 2).forEach(add);
  add([...nodes].reverse().find(node => node.type === "milestone"));
  nodes.filter(node => node.semanticMain).forEach(add);
  return relevant.sort((a, b) => a.x - b.x).slice(0, 6);
}

function renderMobileOverview() {
  if (!mobileOverview) return;
  const projects = uiState.focusProjectId
    ? topologyProjects.filter(project => project.id === uiState.focusProjectId)
    : topologyProjects;
  const totalIssues = topologyProjects.reduce((total, project) => total + getProjectSnapshot(project).openIssues.length, 0);
  const attentionCount = getAttentionItems().length;
  const modeLabel = uiState.mode === "issues" ? "只顯示問題路徑" : uiState.focusProjectId ? "查看單一案件" : "全部案件";

  mobileOverview.innerHTML = `
    <div class="mobile-global-heading">
      <div><p class="mono">案件</p><h2>全局狀態</h2></div>
      <span>${escapeHTML(modeLabel)}</span>
    </div>
    <div class="mobile-global-metrics" aria-label="全局摘要">
      <span><b>${topologyProjects.length}</b> 案件</span>
      <span><b class="text-danger">${totalIssues}</b> 待解決問題</span>
      <button type="button" data-action="open-attention"><b class="text-warning">${attentionCount}</b> 需注意</button>
    </div>
    <p class="mobile-global-help">點案件可查看工作、問題和下一個期限。</p>
    <div class="mobile-project-paths">${projects.map(project => {
      const snapshot = getProjectSnapshot(project);
      const nodes = mobileProjectNodes(project);
      const currentNode = getProjectNodes(project, true).find(node => node.current)
        || getProjectNodes(project, true).filter(node => node.semanticMain).at(-1);
      const stateTone = snapshot.tone === "danger" ? "danger" : snapshot.tone === "warning" ? "warning" : snapshot.tone === "success" ? "success" : "neutral";
      const pathLabel = nodes.map(node => `${mobileNodeKind(project, node)}：${node.label}`).join("；") || "尚無路徑節點";
      return `<details class="mobile-path-project" data-mobile-project="${escapeHTML(project.id)}" data-tone="${stateTone}" ${uiState.mobileExpandedProjectId === project.id ? "open" : ""}>
        <summary>
          <span class="mobile-path-title"><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(snapshot.state)}</small></span>
          <span class="mobile-path-progress"><span><i style="width:${Math.max(2, snapshot.progress)}%"></i></span><b class="mono">${snapshot.progress}%</b></span>
          <span class="mobile-mini-path" role="img" aria-label="${escapeHTML(pathLabel)}">
            <i class="mobile-mini-line" aria-hidden="true"></i>
            ${nodes.map((node, index) => `<i class="mobile-mini-node" data-type="${escapeHTML(node.type)}" data-current="${node.current ? "true" : "false"}" data-open-issue="${isOpenIssueNode(project, node) ? "true" : "false"}" style="--path-position:${nodes.length === 1 ? 50 : 7 + index / (nodes.length - 1) * 86}%" aria-hidden="true"></i>`).join("")}
          </span>
          <span class="mobile-path-now"><small>目前</small><strong>${escapeHTML(currentNode?.label || snapshot.currentTask?.title || "等待下一步")}</strong><time>${escapeHTML(snapshot.deadline.short)}</time></span>
        </summary>
        <div class="mobile-path-detail">
          <div class="mobile-path-facts">
            <span><small>工作</small><b>${snapshot.completed}/${workspaceData[project.id].tasks.length} 完成</b></span>
            <span><small>問題</small><b class="${snapshot.openIssues.length ? "text-danger" : "text-success"}">${snapshot.openIssues.length} 未解</b></span>
            <span><small>案件期限</small><b>${escapeHTML(snapshot.deadline.display)}</b></span>
          </div>
          <div class="mobile-path-events">${nodes.length ? nodes.map(node => `
            <button type="button" data-node-id="${escapeHTML(node.id)}" data-type="${escapeHTML(node.type)}">
              <time>${escapeHTML(node.date || "未排定")}</time>
              <span><strong>${escapeHTML(node.label)}</strong><small>${escapeHTML(mobileNodeKind(project, node))}</small></span>
            </button>`).join("") : `<div class="empty-state">這個檢視下沒有可顯示的節點。</div>`}</div>
          <button class="mobile-enter-project" type="button" data-open-project="${escapeHTML(project.id)}">進入案件工作區</button>
        </div>
      </details>`;
    }).join("")}</div>`;
}

function openClusterInspector(project, cluster) {
  const allNodes = getProjectNodes(project, true);
  const clusteredNodes = (cluster.clusterNodeIds || [])
    .map(nodeId => allNodes.find(node => node.id === nodeId))
    .filter(Boolean);
  inspector.setAttribute("aria-label", `${project.name} ${cluster.date} 同日項目`);
  inspectorTrigger = document.activeElement;
  inspectorTriggerNodeId = cluster.id;
  uiState.selectedNodeId = cluster.id;
  history.replaceState(null, "", `#node=${cluster.id}`);
  inspectorContent.innerHTML = `
    <p class="inspector-project">${escapeHTML(project.name)} / 日期群組</p>
    <h2 class="inspector-title">${escapeHTML(cluster.date)} 的完整內容</h2>
    <div class="inspector-meta"><span>${clusteredNodes.length} 個項目</span><span>${cluster.clusterHiddenCount || 0} 個已收合</span></div>
    <section class="inspector-section"><h3>為什麼收合</h3><p>這一天有多筆紀錄，可在這裡逐項查看。</p></section>
    <div class="attention-list cluster-list">${clusteredNodes.map(node => `
      <button class="attention-row cluster-row" type="button" data-node-id="${escapeHTML(node.id)}">
        <span class="attention-kind">${node.type === "issue" ? "問題" : node.type === "task" ? "工作" : node.type === "decision" ? "決策" : "記錄"}</span>
        <strong>${escapeHTML(node.label)}</strong>
        <small>${escapeHTML(node.date)} · 點擊查看完整紀錄</small>
      </button>`).join("")}</div>
    <div class="inspector-actions"><button class="primary-action" type="button" data-open-project="${project.id}">進入案件工作區</button></div>`;
  inspector.classList.add("is-open");
  inspector.setAttribute("aria-hidden", "false");
  inspector.inert = false;
  renderTopology();
  requestAnimationFrame(() => inspector.querySelector(".inspector-close")?.focus());
}

function openInspector(nodeId) {
  const found = getNode(nodeId);
  if (!found) return;
  const { project, node } = found;
  if (node.type === "cluster") return openClusterInspector(project, node);
  inspector.setAttribute("aria-label", `${project.name} 節點詳細資料`);
  inspectorTrigger = document.activeElement;
  inspectorTriggerNodeId = node.topologyHidden && node.topologyClusterId ? node.topologyClusterId : nodeId;
  uiState.selectedNodeId = nodeId;
  history.replaceState(null, "", `#node=${nodeId}`);
  const snapshot = getProjectSnapshot(project);
  const issueRecord = node.type === "issue" ? workspaceData[project.id]?.issues.find(issue => issue.id === (node.linkedRecordId || `issue-${node.id}`)) : null;
  const issueTask = issueRecord ? getIssueTask(workspaceData[project.id], issueRecord) : null;
  const decisionRecord = node.type === "decision" ? workspaceData[project.id]?.decisions.find(decision => decision.id === node.linkedRecordId) : null;
  const decisionIssue = decisionRecord?.issueId ? workspaceData[project.id]?.issues.find(issue => issue.id === decisionRecord.issueId) : null;
  const taskRecord = node.type === "task" && node.linkedTaskId ? workspaceData[project.id]?.tasks.find(task => task.id === node.linkedTaskId) : null;
  const evidenceOwner = issueRecord ? { type: "issue", id: issueRecord.id } : taskRecord ? { type: "task", id: taskRecord.id } : null;
  const relatedEvidence = evidenceOwner ? workspaceData[project.id].files.filter(file => file.linkedType === evidenceOwner.type && file.linkedId === evidenceOwner.id) : [];
  const nodeDecision = issueRecord?.resolution || issueRecord?.response || node.decision;
  const nodeNext = issueRecord?.next || node.next;
  inspectorContent.innerHTML = `
    <p class="inspector-project">${escapeHTML(project.name)} / ${snapshot.progress}%</p>
    <h2 class="inspector-title">${escapeHTML(node.label)}</h2>
    <div class="inspector-meta"><span>${escapeHTML(node.date)}</span><span class="${node.type === "issue" ? "is-issue" : ""}">${node.type === "issue" ? "問題節點" : node.type === "decision" ? "決策節點" : node.type === "milestone" ? "里程碑" : "工作事件"}</span>${node.current ? "<span>目前位置</span>" : ""}</div>
    <section class="inspector-section"><h3>這裡發生了什麼</h3><p class="strong-copy">${escapeHTML(node.summary)}</p></section>
    <section class="inspector-section"><h3>做了什麼</h3><p>${escapeHTML(node.action)}</p></section>
    ${issueRecord ? `<section class="inspector-section"><h3>問題範圍</h3><p>${escapeHTML(issueContextLabel(workspaceData[project.id], issueRecord))}</p></section>` : ""}
    ${decisionIssue ? `<section class="inspector-section"><h3>回應的問題</h3><p>${escapeHTML(decisionIssue.title)}</p></section>` : ""}
    <section class="inspector-section"><h3>${issueRecord?.resolution ? "處理結果" : "當時的決定"}</h3><p>${escapeHTML(nodeDecision)}</p></section>
    <section class="inspector-section"><h3>下一步</h3><p>${escapeHTML(nodeNext)}</p></section>
    <section class="inspector-section"><h3>相關資料</h3><p>${escapeHTML(node.evidence)}</p></section>
    <div class="inspector-actions"><button type="button" data-focus-project="${project.id}">只看這個案件</button>${issueTask ? `<button type="button" data-open-project-tab="board" data-project-id="${project.id}" data-record-id="${escapeHTML(issueTask.id)}">相關工作</button>` : ""}${relatedEvidence.length ? `<button type="button" data-open-project-tab="files" data-project-id="${project.id}" data-record-id="${escapeHTML(relatedEvidence[0].id)}">相關資料 ${relatedEvidence.length}</button>` : ""}<button class="primary-action" type="button" ${issueRecord || decisionIssue ? `data-open-project-tab="records" data-project-id="${project.id}" data-record-id="${escapeHTML(issueRecord?.id || decisionIssue.id)}"` : taskRecord ? `data-open-project-tab="board" data-project-id="${project.id}" data-record-id="${escapeHTML(taskRecord.id)}"` : `data-open-project="${project.id}"`}>${issueRecord || decisionIssue ? "開啟處理脈絡" : taskRecord ? "開啟這項工作" : "進入案件工作區"}</button></div>`;
  inspector.classList.add("is-open");
  inspector.setAttribute("aria-hidden", "false");
  inspector.inert = false;
  renderTopology();
  requestAnimationFrame(() => inspector.querySelector(".inspector-close")?.focus());
}

function closeInspector() {
  const wasNodeInspector = Boolean(uiState.selectedNodeId);
  inspector.classList.remove("is-open");
  inspector.setAttribute("aria-hidden", "true");
  inspector.inert = true;
  uiState.selectedNodeId = null;
  if (uiState.surface === "portfolio" && wasNodeInspector) history.replaceState(null, "", location.pathname);
  renderTopology();
  if (uiState.surface === "portfolio") {
    renderList();
    renderMobileOverview();
  }
  const restoredTrigger = inspectorTrigger instanceof HTMLElement && inspectorTrigger.isConnected
    ? inspectorTrigger
    : document.querySelector(`[data-node-id="${inspectorTriggerNodeId}"]`);
  restoredTrigger?.focus();
}

function getAttentionItems() {
  const items = [];
  topologyProjects.forEach(project => {
    const data = workspaceData[project.id];
    const projectDeadline = getProjectDeadline(project);
    if (getProjectSnapshot(project).lifecycle === "active" && ["overdue", "today", "soon"].includes(projectDeadline.state)) {
      items.push({
        priority: projectDeadline.state === "overdue" ? 0 : 1,
        dueAt: projectDeadline.dueAt,
        projectId: project.id,
        tab: "overview",
        kind: projectDeadline.state === "overdue" ? "案件逾期" : "案件期限",
        title: projectDeadline.label,
        context: `${projectDeadline.display} / ${projectDeadline.short}`
      });
    }
    data.issues.filter(issue => issue.status === "open").forEach(issue => items.push({
      priority: 0,
      dueAt: 0,
      projectId: project.id,
      tab: "records",
      recordId: issue.id,
      kind: "問題",
      title: issue.title,
      context: `${issueContextLabel(data, issue)} / ${issue.next || issue.detail}`
    }));
    data.tasks.filter(task => task.status !== "done").forEach(task => {
      const blockers = getTaskBlockers(data, task);
      const reviewDue = task.status === "review" ? getDueMeta(task.review?.expectedDate) : null;
      const due = getDueMeta(task.due, task.dueTime);
      let priority = null;
      let kind = "";
      if (due.state === "overdue") { priority = 0; kind = "逾期"; }
      else if (["today", "soon"].includes(due.state)) { priority = 1; kind = "期限"; }
      else if (task.status === "review") { priority = reviewDue?.state === "overdue" ? 0 : 1; kind = reviewDue?.state === "overdue" ? "確認逾期" : "待確認"; }
      else if (blockers.length) { priority = 1; kind = "等待前置"; }
      else if (task.priority === "high") { priority = 1; kind = "高優先"; }
      else if (task.status === "doing") { priority = 2; kind = "進行中"; }
      if (priority === null) return;
      const timing = due.state === "unscheduled" ? priorityLabel(task.priority) : `${due.display} · ${due.short}`;
      items.push({ priority, dueAt: Math.min(due.dueAt, reviewDue?.dueAt ?? Infinity), projectId: project.id, tab: "board", recordId: task.id, kind, title: task.title, context: `${timing} / ${blockers.length ? `等待：${blockers.map(item => item.title).join("、")}` : task.status === "review" ? `等待 ${task.review?.person || "未指定對象"}：${task.review?.request || "待補確認內容"}${reviewDue?.state !== "unscheduled" && reviewDue ? ` / 回覆${reviewDue.short}` : ""}` : task.detail}` });
    });
  });
  return items.sort((a, b) => a.priority - b.priority || a.dueAt - b.dueAt || a.projectId.localeCompare(b.projectId));
}

function openAttentionPanel() {
  const items = getAttentionItems();
  const affectedProjects = new Set(items.map(item => item.projectId)).size;
  inspector.setAttribute("aria-label", "跨案件優先處理");
  inspectorTrigger = document.activeElement;
  inspectorTriggerNodeId = null;
  uiState.selectedNodeId = null;
  if (uiState.surface === "portfolio") history.replaceState(null, "", location.pathname);
  inspectorContent.innerHTML = `
    <p class="inspector-project">跨案件 / 下一步</p>
    <h2 class="inspector-title">優先處理</h2>
    <div class="attention-summary"><strong>${items.length}</strong><span>件需要注意</span><strong>${affectedProjects}</strong><span>個相關案件</span></div>
    <div class="attention-list">${items.map(item => {
      const project = getProject(item.projectId);
      const target = item.requestId || item.milestoneId;
      const navigation = target ? `data-delivery-action="${item.requestId ? "open-request" : "open-milestone"}" data-project="${escapeHTML(item.projectId)}" data-work="${escapeHTML(item.recordId)}" data-item="${escapeHTML(target)}"` : `data-open-project-tab="${item.tab}" data-project-id="${item.projectId}" ${item.recordId ? `data-record-id="${escapeHTML(item.recordId)}"` : ""}`;
      return `<button class="attention-row" type="button" ${navigation}>
        <span class="attention-kind">${escapeHTML(item.kind)}</span>
        <strong>${escapeHTML(item.title)}</strong>
        <small>${escapeHTML(project.name)} / ${escapeHTML(item.context)}</small>
      </button>`;
    }).join("") || `<div class="empty-state">目前沒有待處理項目。可以從任一案件新增工作或問題。</div>`}</div>
    <div class="inspector-actions"><button type="button" data-action="open-command">搜尋全部</button><button type="button" data-action="close-inspector">${uiState.surface === "project" ? "關閉" : "回到拓樸圖"}</button></div>`;
  inspector.classList.add("is-open");
  inspector.setAttribute("aria-hidden", "false");
  inspector.inert = false;
  requestAnimationFrame(() => inspector.querySelector(".inspector-close")?.focus());
}

function openProjectPicker(purpose = "focus") {
  const choosingFocus = purpose === "focus";
  inspector.setAttribute("aria-label", choosingFocus ? "選擇案件" : "選擇要新增紀錄的案件");
  inspectorTrigger = document.activeElement;
  inspectorTriggerNodeId = null;
  uiState.selectedNodeId = null;
  if (uiState.surface === "portfolio") history.replaceState(null, "", location.pathname);
  const rows = topologyProjects.map(project => {
    const snapshot = getProjectSnapshot(project);
    const isCurrent = choosingFocus && uiState.focusProjectId === project.id;
    const action = choosingFocus ? `data-choose-focus-project="${project.id}"` : `data-capture-project="${project.id}"`;
    return `<button class="attention-row" type="button" ${action} ${isCurrent ? "disabled" : ""}>
      <span class="attention-kind">${isCurrent ? "已選擇" : snapshot.openIssues.length ? `${snapshot.openIssues.length} 問題` : "案件"}</span>
      <strong>${escapeHTML(project.name)}</strong>
      <small>${escapeHTML(snapshot.state)} / ${snapshot.progress}% / ${escapeHTML(snapshot.deadline.display)}</small>
    </button>`;
  }).join("");
  inspectorContent.innerHTML = `
    <p class="inspector-project">${choosingFocus ? "查看案件" : "案件紀錄"}</p>
    <h2 class="inspector-title">${choosingFocus ? "要看哪個案件？" : "要記錄到哪一個案件？"}</h2>
    <section class="inspector-section"><p>${choosingFocus ? "選擇要單獨查看的案件。" : "選擇後會進入該案件，並直接開啟新增紀錄。"}</p></section>
    <div class="attention-list">${rows}</div>
    <div class="inspector-actions">${choosingFocus && uiState.focusProjectId ? `<button type="button" data-action="clear-focus">顯示全部案件</button>` : ""}<button type="button" data-action="close-inspector">取消</button></div>`;
  inspector.classList.add("is-open");
  inspector.setAttribute("aria-hidden", "false");
  inspector.inert = false;
  requestAnimationFrame(() => inspector.querySelector(".attention-row:not(:disabled)")?.focus());
}

function chooseFocusProject(projectId) {
  const project = getProject(projectId);
  if (!project) return;
  focusProject(projectId);
  closeInspector();
  showToast(`已選擇「${project.name}」`);
}

function clearProjectFocus() {
  uiState.focusProjectId = null;
  uiState.mode = "portfolio";
  setActiveMode("portfolio");
  closeInspector();
  requestAnimationFrame(fitMap);
  showToast("已回到全部案件");
}

function chooseCaptureProject(projectId) {
  if (!getProject(projectId)) return;
  openProjectRoom(projectId, "overview");
  requestAnimationFrame(() => openCaptureDialog("note"));
}

function focusProject(projectId) {
  uiState.focusProjectId = uiState.focusProjectId === projectId ? null : projectId;
  uiState.mode = uiState.focusProjectId ? "focus" : "portfolio";
  setActiveMode(uiState.mode);
  renderTopology();
  renderList();
  renderMobileOverview();
  if (uiState.focusProjectId) {
    const project = topologyProjects.find(item => item.id === projectId);
    uiState.scale = Math.max(.78, uiState.scale);
    uiState.y = mapViewport.clientHeight / 2 - projectLaneY(project) * uiState.scale;
    applyTransform();
  } else fitMap();
}

function showIssuesOnly() {
  uiState.focusProjectId = null;
  uiState.mode = "issues";
  setActiveMode("issues");
  renderTopology();
  renderList();
  renderMobileOverview();
}

function resetMap() {
  uiState.focusProjectId = null;
  uiState.selectedNodeId = null;
  uiState.mode = "portfolio";
  inspector.classList.remove("is-open");
  inspector.setAttribute("aria-hidden", "true");
  inspector.inert = true;
  history.replaceState(null, "", location.pathname);
  setActiveMode("portfolio");
  renderTopology();
  renderList();
  renderMobileOverview();
  fitMap();
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;"
  })[character]);
}

function getProject(projectId) {
  return topologyProjects.find(project => project.id === projectId);
}

function currentDateLabel() {
  return localISODate();
}

function kindLabel(kind) {
  return kind === "issue" ? "問題" : kind === "decision" ? "決策" : kind === "task" ? "工作" : "紀錄";
}

function getIssueTask(data, issue) {
  return issue?.taskId ? data.tasks.find(task => task.id === issue.taskId) : null;
}

function issueContextLabel(data, issue) {
  const task = getIssueTask(data, issue);
  const source = task ? `工作：${task.title}` : "整體案件";
  const impact = issue?.impact === "project" ? "影響整體案件" : task ? "局部影響" : "整個案件的問題";
  return `${source} · ${impact}`;
}

function evidenceContextLabel(data, file) {
  if (file.linkedType === "task") {
    const task = data.tasks.find(item => item.id === file.linkedId);
    return task ? `工作：${task.title}` : "原工作已不存在";
  }
  if (file.linkedType === "issue") {
    const issue = data.issues.find(item => item.id === file.linkedId);
    return issue ? `問題：${issue.title}` : "原問題已不存在";
  }
  return "整體案件";
}

function resolveEvidenceTarget(data, target = { kind: "project", id: null }) {
  const validTask = target.kind === "task" && data.tasks.some(task => task.id === target.id);
  const validIssue = target.kind === "issue" && data.issues.some(issue => issue.id === target.id);
  return {
    linkedType: validTask ? "task" : validIssue ? "issue" : "project",
    linkedId: validTask || validIssue ? target.id : ""
  };
}

function normalizeExternalUrl(value = "") {
  const input = String(value).trim();
  if (!input) return "";
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(candidate);
    return new Set(["http:", "https:"]).has(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function createNextTaskFromRecord(data, { title, sourceIssueId = "", sourceDecisionId = "", sourceTaskId = "" }) {
  const nextTitle = String(title || "").trim();
  if (!nextTitle) return null;
  const task = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: nextTitle,
    detail: sourceDecisionId ? "依此決策安排的下一步。" : "由工作完成結果產生的下一步。",
    due: "未排定",
    dueTime: "",
    priority: "normal",
    status: "queue",
    sourceIssueId,
    sourceDecisionId,
    sourceTaskId
  };
  if (data.deliveryModelVersion) {
    task.parentId = data.issues.find(issue => issue.id === sourceIssueId)?.taskId || sourceTaskId || "";
    task.required = true;
  }
  data.tasks.push(task);
  return task;
}

function openProjectRoom(projectId, tab = "overview", pushRoute = true, focusRecordId = "", listOrigin = null, timelineOrigin = null) {
  const project = getProject(projectId);
  if (!project) return;
  const isAlreadyProjectDepth = uiState.surface === "project";
  const sameCase = isAlreadyProjectDepth && uiState.projectId === projectId;
  const targetWork = tab === "board" && workspaceData[projectId]?.tasks.find(work => work.id === focusRecordId);
  const drilling = pushRoute && sameCase && targetWork && (listOrigin ||
    targetWork.parentId === uiState.focusRecordId && uiState.projectTab === "board" ||
    !uiState.focusRecordId && ["overview", "board"].includes(uiState.projectTab)
  );
  const previous = { tab: uiState.projectTab, work: uiState.focusRecordId || "", listOrigin, timelineOrigin };
  if (drilling || timelineOrigin) {
    history.replaceState({ ...history.state, returnScroll: { page: scrollY, room: projectRoomContent.scrollTop, child: focusRecordId, listOrigin, timelineOrigin } }, "");
  }
  if (uiState.surface === "portfolio") portfolioScroll = { page: window.scrollY, list: listView.scrollTop };
  const allowedTabs = new Set(["overview", "board", "records", "files", "activity"]);
  if (!allowedTabs.has(tab)) tab = "overview";
  uiState.surface = "project";
  uiState.projectId = projectId;
  uiState.projectTab = tab;
  uiState.focusRecordId = focusRecordId;
  mapView.hidden = true;
  mobileOverview.hidden = true;
  listView.hidden = true;
  workspaceHeading.hidden = true;
  projectRoom.hidden = false;
  workspace.classList.add("is-project-depth");
  appFrame.classList.add("is-project-depth");
  appFrame.classList.remove("is-list-view", "is-my-work", "empty-home");
  inspector.classList.remove("is-open");
  inspector.setAttribute("aria-hidden", "true");
  inspector.inert = true;
  setActiveMode("focus");
  syncDepthNavigation();
  const recordRoute = focusRecordId ? `&record=${encodeURIComponent(focusRecordId)}` : "";
  if (pushRoute) {
    const oldDepth = history.state?.projectDepth ?? (history.state?.returnToPortfolio ? 1 : 0);
    const state = { surface: "project", projectId, returnToPortfolio: !isAlreadyProjectDepth || Boolean(history.state?.returnToPortfolio),
      projectDepth: isAlreadyProjectDepth ? oldDepth + (drilling ? 1 : 0) : 1, fromWork: drilling || timelineOrigin ? previous : null };

    const route = `#project=${projectId}&tab=${tab}${recordRoute}`;
    if (isAlreadyProjectDepth && !drilling) history.replaceState(state, "", route);
    else history.pushState(state, "", route);
  }
  renderProjectRoom();
  if (!sameCase && !focusRecordId) {
    projectRoomContent.scrollTop = 0;
    projectRoom.scrollTop = 0;
    window.scrollTo({top:0, behavior:"instant"});
  }
  requestAnimationFrame(() => {
    if (focusRecordId) focusProjectRecord(focusRecordId);
    else projectRoom.querySelector("h1")?.focus?.();
  });
}

function showPortfolioSurface() {
  uiState.surface = "portfolio";
  uiState.projectId = null;
  projectRoom.hidden = true;
  workspaceHeading.hidden = false;
  workspace.classList.remove("is-project-depth");
  appFrame.classList.remove("is-project-depth");
  syncDepthNavigation();
  renderTopology();
  renderList();
  renderMobileOverview();
  setActiveMode(uiState.mode === "issues" ? "issues" : uiState.focusProjectId ? "focus" : "portfolio");
  setView(window.innerWidth < 720 ? uiState.mobilePreferredView : uiState.preferredView, { persistPreference: false });
  requestAnimationFrame(() => { if (uiState.surface === "portfolio") { window.scrollTo({ top: portfolioScroll.page, behavior: "instant" }); listView.scrollTop = portfolioScroll.list; } });
}

function leaveProjectRoom() {
  if (history.state?.surface === "project" && history.state?.returnToPortfolio) history.go(-(history.state.projectDepth || 1));
  else {
    history.replaceState({ surface: "portfolio" }, "", "#view=map");
    showPortfolioSurface();
  }
}

function setProjectTab(tab, updateRoute = true) {
  uiState.projectTab = tab;
  uiState.focusRecordId = null;
  renderProjectRoom();
  if (updateRoute) history.replaceState({ projectDepth: history.state?.projectDepth, surface: "project", projectId: uiState.projectId, returnToPortfolio: Boolean(history.state?.returnToPortfolio) }, "", `#project=${uiState.projectId}&tab=${tab}`);
  requestAnimationFrame(() => projectTabs.querySelector(`[data-project-tab="${tab}"]`)?.focus());
}

function focusProjectRecord(recordId) {
  const target = projectRoomContent.querySelector(`[data-record-target="${CSS.escape(recordId)}"]`);
  if (!target) return projectRoom.querySelector("h1")?.focus?.();
  target.setAttribute("tabindex", "-1");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const roomRect = projectRoomContent.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (projectRoomContent.scrollHeight > projectRoomContent.clientHeight) {
    projectRoomContent.scrollTo({ top: projectRoomContent.scrollTop + (targetRect.top - roomRect.top - roomRect.height / 2 + targetRect.height / 2) / appLayoutScale(), behavior: reducedMotion ? "auto" : "smooth" });
  } else {
    window.scrollTo({ top: window.scrollY + targetRect.top - 120, behavior: reducedMotion ? "auto" : "smooth" });
  }
  target.focus({ preventScroll: true });
  target.classList.add("is-targeted");
  window.setTimeout(() => target.classList.remove("is-targeted"), 1800);
}

function renderProjectRoom() {
  const project = getProject(uiState.projectId);
  const data = workspaceData[uiState.projectId];
  if (!project || !data) return;
  const projectNodes = getProjectNodes(project, true);
  const currentNode = projectNodes.find(node => node.current) || projectNodes.filter(node => node.semanticMain).at(-1) || project.nodes.at(-1) || { label: "尚未新增工作", summary: "尚未新增工作", next: "新增這個目標需要的主要工作" };
  const snapshot = getProjectSnapshot(project);
  setActiveMode(uiState.projectTab === "records" ? "issues" : "focus");
  const openIssues = snapshot.openIssues.length;
  const tabs = [
    ["overview", "現況", ""],
    ["board", "工作板", data.tasks.filter(task => task.status !== "done").length],
    ["records", "問題與決策", openIssues],
    ["files", "文件與連結", data.files.length],
    ["activity", "完整紀錄", data.activity.length]
  ];

  projectRoomHeader.innerHTML = `
    <div class="project-heading-main">
      <button class="project-back" type="button" data-action="leave-project" aria-label="返回拓樸圖">←</button>
      <div class="project-heading-copy">
        <p class="project-breadcrumb">拓樸圖 / 案件工作區 / ${escapeHTML(snapshot.state)}</p>
        <h1 tabindex="-1">${escapeHTML(project.name)}</h1>
        <p>目前：${escapeHTML(snapshot.currentTask?.title || currentNode.label)} · 下一期限 ${escapeHTML(snapshot.deadline.display)}</p>
      </div>
    </div>
    <div class="project-heading-status" style="--project-color:${project.color}">
      <div class="project-status-line"><span>${escapeHTML(snapshot.state)} · ${openIssues} 個待解決問題</span><strong class="mono">${snapshot.progress}%</strong></div>
      <div class="project-progress-track"><span style="width:${snapshot.progress}%"></span></div>
      <div class="project-deadline-control" data-state="${snapshot.deadline.state}">
        <span><strong>${escapeHTML(snapshot.deadline.short)}</strong> · ${escapeHTML(snapshot.deadline.display)}</span>
        <button type="button" data-action="open-project-schedule">調整期限</button>
      </div>
    </div>`;

  projectTabs.innerHTML = tabs.map(([id, label, count]) => `
    <button class="project-tab ${uiState.projectTab === id ? "is-active" : ""}" type="button" data-project-tab="${id}" aria-pressed="${uiState.projectTab === id}">
      ${label}${count !== "" ? `<small>${count}</small>` : ""}
    </button>`).join("");

  if (uiState.projectTab === "overview") projectRoomContent.innerHTML = renderProjectOverview(project, data, currentNode);
  if (uiState.projectTab === "board") projectRoomContent.innerHTML = renderProjectBoard(project, data);
  if (uiState.projectTab === "records") projectRoomContent.innerHTML = renderProjectRecords(data);
  if (uiState.projectTab === "files") projectRoomContent.innerHTML = renderProjectFiles(data);
  if (uiState.projectTab === "activity") projectRoomContent.innerHTML = renderProjectActivity(data);
}

function renderProjectOverview(project, data, currentNode) {
  const completed = data.tasks.filter(task => task.status === "done").length;
  const openIssues = data.issues.filter(issue => issue.status === "open");
  const deadline = getProjectDeadline(project);
  return `<div class="project-surface">
    <div class="surface-heading">
      <div><h2>案件現況</h2><p>宏觀節點落到這裡後，才進行實際工作與留痕。</p></div>
      <div class="surface-actions"><button class="secondary-action" type="button" data-project-tab="board">打開工作板</button><button class="primary-action" type="button" data-action="open-capture" data-capture-kind="task">新增工作</button></div>
    </div>
    <div class="metric-strip">
      <div class="metric-cell"><strong>${data.tasks.length - completed}</strong><span>未完成工作</span></div>
      <div class="metric-cell"><strong class="text-danger">${openIssues.length}</strong><span>待解決問題</span></div>
      <div class="metric-cell"><strong class="deadline-status" data-state="${deadline.state}">${escapeHTML(deadline.short)}</strong><span>${escapeHTML(deadline.display)}</span></div>
    </div>
    <div class="project-overview">
      <div>
        <section class="overview-block"><h3>現在正在發生什麼</h3><p class="overview-current">${escapeHTML(currentNode.summary)}</p><p class="overview-next"><strong>下一步：</strong>${escapeHTML(currentNode.next)}</p></section>
        <section class="overview-block"><h3>最近的案件紀錄</h3><div class="compact-log">${data.activity.slice(0, 5).map(item => renderCompactRow(item)).join("")}</div></section>
      </div>
      <div>
        <section class="overview-block"><h3>需要處理的問題</h3>${openIssues.length ? openIssues.map(issue => `<button class="compact-row compact-row-button is-issue" type="button" data-open-project-tab="records" data-project-id="${escapeHTML(project.id)}" data-record-id="${escapeHTML(issue.id)}"><time datetime="${escapeHTML(normalizeDateValue(issue.date, seedYear))}">${escapeHTML(displayDateValue(issue.date))}</time><strong>${escapeHTML(issue.title)}<em>${escapeHTML(issueContextLabel(data, issue))}</em></strong><small>開啟處理</small></button>`).join("") : `<div class="empty-state">目前沒有待解決問題</div>`}</section>
        <section class="overview-block"><h3>案件路徑</h3><div class="compact-log">${getProjectNodes(project).filter(node => node.semanticMain).map(node => `<div class="compact-row"><time>${escapeHTML(node.date)}</time><strong>${escapeHTML(node.label)}</strong><small>${node.current ? "目前" : node.type === "milestone" ? "里程碑" : "節點"}</small></div>`).join("")}</div></section>
      </div>
    </div>
  </div>`;
}

function renderCompactRow(item) {
  return `<div class="compact-row ${item.kind === "issue" ? "is-issue" : ""}"><time datetime="${escapeHTML(normalizeDateValue(item.date, seedYear))}">${escapeHTML(displayDateValue(item.date))}</time><strong>${escapeHTML(item.title)}</strong><small>${kindLabel(item.kind)}</small></div>`;
}

function renderProjectBoard(project, data) {
  const deadline = getProjectDeadline(project);
  return `<div class="project-surface">
    <div class="surface-heading">
      <div><h2>工作板</h2><p>拖曳卡片，或使用卡片下方選單移動。每次變更都會寫入紀錄。</p></div>
      <div class="surface-actions"><button class="primary-action" type="button" data-action="open-capture" data-capture-kind="task">新增工作</button></div>
    </div>
    <div class="board-shell">
      <div class="kanban-board" aria-label="${escapeHTML(project.name)} 工作板">
        ${boardColumns.map(column => {
          const tasks = data.tasks.filter(task => task.status === column.id);
          return `<section class="kanban-column" data-drop-status="${column.id}" style="--column-color:${column.color}">
            <div class="column-heading"><strong>${column.label}</strong><span>${tasks.length}</span></div>
            <div class="task-stack">${tasks.map(task => renderTaskCard(task, data)).join("")}</div>
          </section>`;
        }).join("")}
      </div>
      <aside class="project-context-rail" aria-label="案件背景">
        <section class="context-section deadline-context" data-state="${deadline.state}"><h3>下一期限</h3><p><strong>${escapeHTML(deadline.short)}</strong><br>${escapeHTML(deadline.display)}</p><button class="context-action" type="button" data-action="open-project-schedule">調整案件期限</button></section>
        <section class="context-section"><h3>待解決問題</h3><p>${data.issues.filter(issue => issue.status === "open").slice(0, 2).map(issue => escapeHTML(issue.title)).join("；") || "目前沒有待解決問題"}</p><button class="context-action" type="button" data-project-tab="records">查看問題與決策</button></section>
        <section class="context-section"><h3>最近資料</h3><p>${escapeHTML(data.files.at(-1)?.name || "尚未加入資料")}</p><button class="context-action" type="button" data-action="choose-files">加入文件</button><button class="context-action" type="button" data-action="open-link">加入外部連結</button></section>
      </aside>
    </div>
  </div>`;
}

function renderTaskCard(task, data) {
  const blockers = getTaskBlockers(data, task);
  const dependencies = (task.dependsOn || []).map(id => data.tasks.find(item => item.id === id)).filter(Boolean);
  const due = getDueMeta(task.due, task.dueTime, task.status === "done");
  const openTaskIssues = data.issues.filter(issue => issue.taskId === task.id && issue.status === "open");
  const openIssueCount = openTaskIssues.length;
  const taskEvidence = data.files.filter(file => file.linkedType === "task" && file.linkedId === task.id);
  const evidenceCount = taskEvidence.length;
  const sourceIssue = task.sourceIssueId ? data.issues.find(issue => issue.id === task.sourceIssueId) : null;
  const relation = sourceIssue ? `<span>來自問題：${escapeHTML(sourceIssue.title)}</span>` : "";
  const completion = task.completionNote ? `<div class="task-completion"><span>完成結果</span><p>${escapeHTML(task.completionNote)}</p></div>` : "";
  return `<article id="record-${escapeHTML(task.id)}" class="task-card" draggable="true" data-task-id="${escapeHTML(task.id)}" data-record-target="${escapeHTML(task.id)}" data-priority="${escapeHTML(task.priority)}" data-time-state="${due.state}" tabindex="-1">
    <h3>${escapeHTML(task.title)}</h3>
    <p>${escapeHTML(task.detail)}</p>
    ${relation ? `<div class="task-relation">${relation}</div>` : ""}
    ${completion}
    ${dependencies.length ? `<div class="task-relation"><strong>${blockers.length ? `等待 ${blockers.length} 項前置工作` : "前置工作已完成"}</strong>${dependencies.map(item => `<button type="button" data-open-project-tab="board" data-project-id="${escapeHTML(uiState.projectId)}" data-record-id="${escapeHTML(item.id)}">${item.status === "done" ? "已完成" : "等待"} · ${escapeHTML(item.title)}</button>`).join("")}</div>` : ""}
    ${task.review?.person || task.review?.request ? `<div class="task-completion"><span>${task.status === "review" ? "等待確認" : "確認資訊"} · ${escapeHTML(task.review.person || "尚未指定")}</span><p>${escapeHTML(task.review.request || "尚未填寫確認內容")}</p>${task.review.expectedDate ? `<p>預計回覆 ${escapeHTML(formatDueValue(task.review.expectedDate))} · ${escapeHTML(getDueMeta(task.review.expectedDate, "", task.status === "done").short)}</p>` : ""}${task.review.reply ? `<p>最新回覆：${escapeHTML(task.review.reply)}</p>` : ""}</div>` : ""}
    <button class="task-schedule" type="button" data-edit-work-flow="${escapeHTML(task.id)}">${task.status === "review" ? "更新確認／回覆" : "前置工作與確認設定"}</button>
    <div class="task-due" data-state="${due.state}"><time>期限 ${escapeHTML(due.display)}</time><strong>${escapeHTML(due.short)}</strong></div>
    <div class="task-linked-state"><button type="button" ${openIssueCount ? `data-open-project-tab="records" data-project-id="${escapeHTML(uiState.projectId)}" data-record-id="${escapeHTML(openTaskIssues[0].id)}"` : `data-report-task-issue="${escapeHTML(task.id)}"`}>${openIssueCount ? `${openIssueCount} 個待解決問題` : "回報問題"}</button>${evidenceCount ? `<button type="button" data-open-project-tab="files" data-project-id="${escapeHTML(uiState.projectId)}" data-record-id="${escapeHTML(taskEvidence[0].id)}">${evidenceCount} 份資料</button>` : ""}<button type="button" data-add-evidence-for="${escapeHTML(task.id)}" data-evidence-kind="task">加入文件</button><button type="button" data-add-link-for="${escapeHTML(task.id)}" data-link-kind="task">加連結</button></div>
    <div class="task-meta"><button class="task-schedule" type="button" data-edit-task-schedule="${escapeHTML(task.id)}">調整排程 · ${escapeHTML(priorityLabel(task.priority))}</button><label class="visually-hidden" for="move-${escapeHTML(task.id)}">移動 ${escapeHTML(task.title)}</label><select id="move-${escapeHTML(task.id)}" class="task-move" data-move-task="${escapeHTML(task.id)}">${boardColumns.map(column => `<option value="${column.id}" ${task.status === column.id ? "selected" : ""}>移到 ${column.label}</option>`).join("")}</select></div>
  </article>`;
}

function renderProjectRecords(data) {
  const issues = [...data.issues].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.id.localeCompare(a.id);
  });
  const linkedDecisionIds = new Set();
  const issueThreads = issues.map(issue => {
    const linkedDecisions = data.decisions
      .filter(decision => decision.issueId === issue.id)
      .sort((a, b) => b.id.localeCompare(a.id));
    const issueEvidence = data.files.filter(file => file.issueIds?.includes(issue.id) || file.linkedType === "issue" && file.linkedId === issue.id);
    linkedDecisions.forEach(decision => linkedDecisionIds.add(decision.id));
    return `<section class="issue-thread">
      ${renderRecordRow({ ...issue, kind: "issue", context: issueContextLabel(data, issue), evidenceCount: issueEvidence.length, evidenceFirstId: issueEvidence[0]?.id || "", nextTaskTitle: issue.nextTaskId ? data.tasks.find(task => task.id === issue.nextTaskId)?.title || "" : "" }, { source: "record", deletable: true })}
      <div class="issue-decisions">
        <div class="issue-decisions-heading"><div><span>決策</span><small>${linkedDecisions.length ? `${linkedDecisions.length} 筆已連結` : "尚未記錄決策"}</small></div><button class="context-action inline-context-action" type="button" data-decision-for="${escapeHTML(issue.id)}">針對此問題記錄決策</button></div>
        ${linkedDecisions.length ? linkedDecisions.map(decision => {
          const nextTask = decision.nextTaskId ? data.tasks.find(task => task.id === decision.nextTaskId) : null;
          return renderRecordRow({ ...decision, kind: "decision", nextTaskTitle: nextTask?.title || "" }, { source: "record", deletable: true, nested: true });
        }).join("") : `<p class="issue-decisions-empty">若需要保留選擇與理由，直接從這個問題往下記錄。</p>`}
      </div>
    </section>`;
  }).join("");
  const legacyDecisions = data.decisions.filter(decision => !linkedDecisionIds.has(decision.id));
  return `<div class="project-surface">
    <div class="surface-heading"><div><h2>問題與決策</h2><p>打開問題可查看決策、原因和結果。</p></div><div class="surface-actions"><button class="primary-action" type="button" data-action="open-capture" data-capture-kind="issue">記錄問題</button><button class="secondary-action" type="button" data-action="open-capture" data-capture-kind="decision" ${data.issues.length ? "" : "disabled"}>記錄決策</button></div></div>
    <div class="records-layout">
      <div class="issue-thread-list">${issueThreads || `<div class="empty-state">還沒有問題。記下問題後，就可以在問題下記下決策。</div>`}${legacyDecisions.length ? `<section class="legacy-decisions"><div class="legacy-decisions-heading"><span>尚未連結的既有決策</span><small>這些是舊資料；新的決策必須連到問題。</small></div>${legacyDecisions.map(item => renderRecordRow({ ...item, kind: "decision" }, { source: "record", deletable: true })).join("")}</section>` : ""}</div>
      <aside class="project-context-rail"><section class="context-section"><h3>記錄原則</h3><p>先建立問題，再在該問題下記錄決策。完成處理時把實際結果補回原問題，不需要重建另一筆紀錄。</p></section><section class="context-section"><h3>目前統計</h3><p>${data.issues.filter(item => item.status === "open").length} 個待解決問題<br>${data.decisions.filter(item => item.issueId).length} 筆已記錄的決策${legacyDecisions.length ? `<br>${legacyDecisions.length} 個舊決策尚未連結` : ""}</p></section></aside>
    </div>
  </div>`;
}

function renderRecordRow(item, { source = "activity", deletable = false, nested = false } = {}) {
  const stateAction = source === "record" && item.kind === "issue" ? `<button class="record-state" type="button" data-toggle-issue="${escapeHTML(item.id)}">${item.status === "open" ? "完成處理" : "重新開啟"}</button>` : "";
  const evidenceAction = source === "record" && item.kind === "issue" ? `${item.evidenceCount ? `<button class="record-state" type="button" data-open-project-tab="files" data-project-id="${escapeHTML(uiState.projectId)}" data-record-id="${escapeHTML(item.evidenceFirstId)}">${item.evidenceCount} 份資料</button>` : ""}<button class="record-state" type="button" data-add-evidence-for="${escapeHTML(item.id)}" data-evidence-kind="issue">加入文件</button><button class="record-state" type="button" data-add-link-for="${escapeHTML(item.id)}" data-link-kind="issue">加連結</button>` : "";
  const deleteAction = deletable ? `<button class="record-delete" type="button" data-delete-record="${escapeHTML(item.id)}" data-delete-kind="${escapeHTML(item.kind)}" data-delete-source="${source}" aria-label="刪除紀錄：${escapeHTML(item.title)}">刪除</button>` : "";
  const actions = stateAction || evidenceAction || deleteAction ? `<div class="record-actions">${stateAction}${evidenceAction}${deleteAction}</div>` : "";
  const resolution = item.resolution ? `<div class="record-resolution"><span>處理結果</span><p>${escapeHTML(item.resolution)}</p></div>` : "";
  const context = item.context ? `<span class="record-context">${escapeHTML(item.context)}</span>${item.taskId ? `<button type="button" class="record-state" data-open-project-tab="board" data-project-id="${escapeHTML(uiState.projectId)}" data-record-id="${escapeHTML(item.taskId)}">回到所屬工作 ↗</button>` : ""}` : "";
  const nextTask = item.nextTaskTitle ? `<div class="record-next-task"><span>已建立下一步工作</span><p>${escapeHTML(item.nextTaskTitle)}</p></div>` : "";
  const recordId = source === "record" ? ` id="record-${escapeHTML(item.id)}" data-record-target="${escapeHTML(item.id)}"` : "";
  return `<article class="record-row ${nested ? "is-nested" : ""}" data-kind="${escapeHTML(item.kind)}"${recordId}><time datetime="${escapeHTML(normalizeDateValue(item.date, seedYear))}">${escapeHTML(displayDateValue(item.date))}</time><span class="record-kind">${kindLabel(item.kind)}</span><div class="record-copy"><strong>${escapeHTML(item.title)}</strong>${context}<p>${escapeHTML(item.detail)}${item.next ? ` 下一步：${escapeHTML(item.next)}` : ""}</p>${nextTask}${resolution}${actions}</div></article>`;
}

function renderEvidenceItem(file, data) {
  const safeUrl = file.source === "link" ? normalizeExternalUrl(file.url) : "";
  const sourceLabel = file.source === "link" ? safeUrl ? "外部連結" : "連結無效" : file.source === "local" ? "本機加入" : "節點證據";
  const title = safeUrl
    ? `<a class="evidence-title" href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(file.name)}</a>`
    : `<strong>${escapeHTML(file.name)}</strong>`;
  const note = file.note ? `<p class="evidence-note">${escapeHTML(file.note)}</p>` : "";
  const linkMeta = safeUrl ? `<p class="evidence-url">${escapeHTML(safeUrl)}</p>` : "";
  const openAction = safeUrl ? `<a class="evidence-open" href="${escapeHTML(safeUrl)}" target="_blank" rel="noopener noreferrer">開啟頁面 ↗</a><button class="evidence-edit" type="button" data-edit-link="${escapeHTML(file.id)}">編輯</button>` : "";
  return `<article id="record-${escapeHTML(file.id)}" class="evidence-item" data-record-target="${escapeHTML(file.id)}">${title}<p>${escapeHTML(file.size || "資料")} · ${escapeHTML(evidenceContextLabel(data, file))}</p>${note}${linkMeta}<small>${escapeHTML(displayDateValue(file.date))} · ${sourceLabel}</small><div class="evidence-actions">${openAction}<button type="button" data-delete-evidence="${escapeHTML(file.id)}" aria-label="移除資料：${escapeHTML(file.name)}">移除</button></div></article>`;
}

function renderProjectFiles(data) {
  return `<div class="project-surface">
    <div class="surface-heading"><div><h2>文件與連結</h2><p>文件與外部來源都保留所屬對象；法規或研究網址可直接開啟。舊紀錄若只記了檔名，可另外補上檔案。</p></div><div class="surface-actions"><button class="secondary-action" type="button" data-action="open-link">新增連結</button><button class="primary-action" type="button" data-action="choose-files">選擇文件</button></div></div>
    <button class="evidence-drop" type="button" data-action="choose-files"><strong>拖入文件，或點擊選擇</strong><span>可一次加入多個檔案；若資料在網路上，使用上方「新增連結」。</span></button>
    <div class="evidence-list">${data.files.map(file => renderEvidenceItem(file, data)).join("") || `<div class="empty-state">尚未加入任何資料或連結</div>`}</div>
  </div>`;
}

function renderProjectActivity(data) {
  return `<div class="project-surface">
    <div class="surface-heading"><div><h2>完整紀錄</h2><p>依日期查看工作進度、問題、決策和文件。</p></div><div class="surface-actions"><button class="primary-action" type="button" data-action="open-capture" data-capture-kind="note">新增進度紀錄</button></div></div>
    <div class="record-list">${data.activity.map(item => renderRecordRow(item, { source: "activity", deletable: /^activity-(issue|decision|note)-\d+$/.test(item.id) })).join("") || `<div class="empty-state">尚未有紀錄</div>`}</div>
  </div>`;
}

function refreshProjectDataSurface() {
  renderTopology();
  renderList();
  renderMobileOverview();
  if (uiState.surface === "project") renderProjectRoom();
}

function deleteRecord(kind, recordId, source) {
  const projectId = uiState.projectId;
  const data = workspaceData[projectId];
  if (!data) return;
  const backup = {
    tasks: data.tasks.map(task => ({ ...task })),
    issues: [...data.issues],
    decisions: [...data.decisions],
    files: [...data.files],
    activity: [...data.activity],
    timeline: [...data.timeline]
  };
  let record;
  let linkedRecordId = recordId;
  let cascadedDecisionIds = [];

  if (source === "activity") {
    record = data.activity.find(item => item.id === recordId);
    if (!record) return;
    linkedRecordId = recordId.replace(/^activity-/, "");
    if (kind === "issue") data.issues = data.issues.filter(item => item.id !== linkedRecordId);
    if (kind === "decision") data.decisions = data.decisions.filter(item => item.id !== linkedRecordId);
    data.activity = data.activity.filter(item => item.id !== recordId && item.id !== `activity-${linkedRecordId}`);
  } else {
    const collection = kind === "issue" ? "issues" : "decisions";
    record = data[collection].find(item => item.id === recordId);
    if (!record) return;
    data[collection] = data[collection].filter(item => item.id !== recordId);
    data.activity = data.activity.filter(item => item.id !== `activity-${recordId}` && !(item.kind === kind && item.title === record.title && item.date === record.date));
  }

  if (kind === "issue") {
    cascadedDecisionIds = data.decisions.filter(item => item.issueId === linkedRecordId).map(item => item.id);
    const cascadedSet = new Set(cascadedDecisionIds);
    data.decisions = data.decisions.filter(item => !cascadedSet.has(item.id));
    data.activity = data.activity.filter(item => !cascadedSet.has(item.id.replace(/^activity-/, "")));
    data.files = data.files.map(file => file.issueIds?.includes(linkedRecordId) || file.linkedType === "issue" && file.linkedId === linkedRecordId
      ? { ...file, issueIds: (file.issueIds || []).filter(id => id !== linkedRecordId), ...(file.linkedType === "issue" && file.linkedId === linkedRecordId ? { linkedType: "project", linkedId: "" } : {}), previousIssueId: linkedRecordId }
      : file);
    data.tasks.forEach(task => {
      if (task.sourceIssueId === linkedRecordId) task.sourceIssueId = "";
      if (cascadedSet.has(task.sourceDecisionId)) task.sourceDecisionId = "";
    });
  }
  if (kind === "decision") data.tasks.forEach(task => { if (task.sourceDecisionId === linkedRecordId) task.sourceDecisionId = ""; });
  const removedRecordIds = new Set([linkedRecordId, ...cascadedDecisionIds]);
  data.timeline = data.timeline.filter(node => !removedRecordIds.has(node.linkedRecordId));
  saveWorkspaceData();
  refreshProjectDataSurface(projectId);
  showToast(`已刪除「${record.title}」${cascadedDecisionIds.length ? `與 ${cascadedDecisionIds.length} 筆連結決策` : ""}`, {
    label: "復原",
    run: () => {
      data.tasks = backup.tasks;
      data.issues = backup.issues;
      data.decisions = backup.decisions;
      data.files = backup.files;
      data.activity = backup.activity;
      data.timeline = backup.timeline;
      saveWorkspaceData();
      refreshProjectDataSurface(projectId);
      showToast("已復原刪除的紀錄");
    }
  });
}

function getTaskBlockers(data, task) {
  return (Array.isArray(task.dependsOn) ? task.dependsOn : []).map(id => data.tasks.find(item => item.id === id) || { id, title: "找不到的前置工作", status: "missing" }).filter(item => item.status !== "done");
}

function dependencyReaches(data, startId, targetId, visited = new Set()) {
  if (startId === targetId) return true;
  if (visited.has(startId)) return false;
  visited.add(startId);
  const task = data.tasks.find(item => item.id === startId);
  return (Array.isArray(task?.dependsOn) ? task.dependsOn : []).some(id => dependencyReaches(data, id, targetId, visited));
}

let workFlowIntent = "edit";
const workFlowDialog = document.querySelector("#work-flow-dialog");
const workFlowForm = document.querySelector("#work-flow-form");

function openWorkFlowDialog(taskId, intent = "edit") {
  const data = workspaceData[uiState.projectId];
  const task = data?.tasks.find(item => item.id === taskId);
  if (!task) return;
  workFlowIntent = intent;
  workFlowForm.reset();
  workFlowForm.elements.taskId.value = task.id;
  document.querySelector("#work-dependency-section").hidden = intent === "review";
  document.querySelector("#work-dependency-section").open = intent !== "review";
  document.querySelector("#work-dependency-count").textContent = (task.dependsOn || []).length ? `${task.dependsOn.length} 項已關聯` : "未設定";
  document.querySelector("#work-flow-title").textContent = intent === "review" ? "送出待確認" : "工作關係與確認";
  document.querySelector("#work-flow-context").textContent = task.title;
  document.querySelector("#work-flow-error").textContent = "";
  const linkedIds = new Set(task.dependsOn || []);
  const satisfied = data.tasks.filter(item => linkedIds.has(item.id) && item.status === "done");
  const candidates = data.tasks.filter(item => item.id !== task.id && item.status !== "done" && !dependencyReaches(data, item.id, task.id) && (task.status === "queue" || linkedIds.has(item.id)));
  document.querySelector("#work-dependencies").innerHTML =
    (satisfied.length ? `<div class="field-help">已滿足的前置關係：${satisfied.map(item => escapeHTML(item.title)).join("、")}</div>` : "") +
    (candidates.map(item => `<label class="work-dependency-option"><input type="checkbox" name="dependency" value="${escapeHTML(item.id)}" ${linkedIds.has(item.id) ? "checked" : ""} /><span>${escapeHTML(item.title)}<small>${linkedIds.has(item.id) ? "正在等待" : "設為開始前必須完成的工作"}</small></span></label>`).join("") || `<p class="field-help">${task.status === "done" ? "此工作已完成，無需新增前置工作。" : task.status !== "queue" ? "此工作已開始，這裡僅顯示已建立的前置關係。" : "目前沒有可新增的前置工作。"}</p>`);
  for (const [field, key] of [["reviewPerson", "person"], ["reviewRequest", "request"], ["reviewDate", "expectedDate"], ["reviewReply", "reply"]]) workFlowForm.elements[field].value = task.review?.[key] || "";
  workFlowForm.elements.reviewPerson.required = intent === "review" || task.status === "review";
  workFlowForm.elements.reviewRequest.required = intent === "review" || task.status === "review";
  workFlowForm.querySelector('[type="submit"]').textContent = intent === "review" ? "送至待確認" : "儲存工作流程";
  workFlowDialog.showModal();
}

workFlowForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = workspaceData[uiState.projectId];
  const form = new FormData(workFlowForm);
  const task = data?.tasks.find(item => item.id === form.get("taskId"));
  if (!task) return;
  // Confirmation must preserve relations; completed prerequisites are history, not new choices.
  const dependsOn = workFlowIntent === "review" ? [...(task.dependsOn || [])] : [...new Set([
    ...(task.dependsOn || []).filter(id => data.tasks.find(item => item.id === id)?.status === "done"),
    ...form.getAll("dependency")
  ])];
  const error = document.querySelector("#work-flow-error");
  if (dependsOn.some(id => !data.tasks.some(item => item.id === id) || dependencyReaches(data, id, task.id))) {
    error.textContent = "這個前置關係會形成循環，請重新選擇。";
    return;
  }
  const blockers = getTaskBlockers(data, { dependsOn });
  if (blockers.length && (task.status !== "queue" || workFlowIntent === "review")) {
    error.textContent = "這項工作已開始，不能加入尚未完成的前置工作。請先移回待處理。";
    return;
  }
  const review = { person: String(form.get("reviewPerson") || "").trim(), request: String(form.get("reviewRequest") || "").trim(), expectedDate: normalizeDateValue(form.get("reviewDate") || ""), reply: String(form.get("reviewReply") || "").trim(), updatedAt: new Date().toISOString() };
  if ((workFlowIntent === "review" || task.status === "review") && (!review.person || !review.request)) {
    error.textContent = "請填寫確認對象與需要確認的內容。";
    return;
  }
  task.dependsOn = dependsOn;
  task.review = { ...task.review, ...review };
  if (workFlowIntent === "review") {
    if (task.status === "done") {
      task.previousCompletionNote = task.completionNote || "";
      task.completionNote = "";
      task.completedAt = "";
    }
    task.status = "review";
    task.review.sentAt = new Date().toISOString();
    delete task.review.confirmedAt;
    delete task.review.result;
  }
  data.activity.unshift({ id: `activity-flow-${Date.now()}`, kind: "task", title: `${workFlowIntent === "review" ? "送出待確認" : "更新工作流程"}：${task.title}`, detail: `前置工作：${dependsOn.map(id => data.tasks.find(item => item.id === id).title).join("、") || "無"}${review.person ? ` / 確認對象：${review.person}` : ""}${review.request ? ` / 確認內容：${review.request}` : ""}${review.reply ? ` / 最新回覆：${review.reply}` : ""}`, date: currentDateLabel() });
  saveWorkspaceData();
  workFlowDialog.close();
  refreshProjectDataSurface();
  showToast(workFlowIntent === "review" ? "已送至待確認並保留確認內容" : "工作流程已更新");
});

function moveTask(taskId, nextStatus) {
  const data = workspaceData[uiState.projectId];
  const task = data?.tasks.find(item => item.id === taskId);
  const column = boardColumns.find(item => item.id === nextStatus);
  if (!task || !column || task.status === nextStatus) return;
  if (task.status === "done" && data.tasks.some(item => item.status === "done" && dependencyReaches(data, item.id, task.id) && item.id !== task.id)) {
    renderProjectRoom();
    showToast("已有完成的後續工作依賴此項，請先重新開啟後續工作");
    return;
  }
  if (nextStatus !== "queue" && getTaskBlockers(data, task).length) {
    renderProjectRoom();
    showToast("前置工作尚未完成，請先處理阻塞項目");
    return;
  }
  if (nextStatus === "review") return openWorkFlowDialog(taskId, "review");
  if (nextStatus === "done") {
    if (uiState.surface === "project") renderProjectRoom();
    return openTaskCompletionDialog(taskId);
  }
  const wasCompleted = task.status === "done";
  task.status = nextStatus;
  if (wasCompleted) {
    task.previousCompletionNote = task.completionNote || task.previousCompletionNote || "";
    task.completionNote = "";
    task.completedAt = "";
  }
  data.activity.unshift({ id: `activity-${Date.now()}`, kind: "task", title: `${wasCompleted ? "重新開啟工作" : "移動工作"}：${task.title}`, detail: `工作已移至「${column.label}」。`, date: currentDateLabel() });
  saveWorkspaceData();
  refreshProjectDataSurface();
  showToast(`已移至「${column.label}」`);
}

function openTaskCompletionDialog(taskId) {
  const data = workspaceData[uiState.projectId];
  const task = data?.tasks.find(item => item.id === taskId);
  if (!task) return;
  if (getTaskBlockers(data, task).length) {
    showToast("前置工作尚未完成，不能驗收這項工作");
    return;
  }
  const openIssues = data.issues.filter(issue => issue.taskId === taskId && issue.status === "open");
  if (openIssues.length) {
    openProjectRoom(uiState.projectId, "records", true, openIssues[0].id);
    showToast(`這項工作仍有 ${openIssues.length} 個待解決問題，先完成問題處理`);
    return;
  }
  captureFlow = { mode: "complete-task", issueId: null, taskId };
  captureForm.reset();
  captureForm.elements.kind.value = "task";
  configureCaptureForm("task");
  captureKicker.textContent = "確認工作";
  captureDialogTitle.textContent = "完成並驗收工作";
  captureIntro.textContent = "留下完成結果，工作才會進入已完成；若還有下一步，可以直接建立成新工作。";
  captureContext.hidden = false;
  captureContext.innerHTML = `<strong>${escapeHTML(task.title)}</strong><span>${escapeHTML(task.detail)}</span>`;
  captureTitleField.hidden = true;
  captureForm.elements.title.disabled = true;
  captureDetailLabel.textContent = "完成結果或驗收說明（必填）";
  captureForm.elements.detail.placeholder = "實際完成了什麼？如何確認已達成？";
  captureForm.elements.detail.required = true;
  captureDetailHelp.textContent = "這段結果會留在工作卡與完整紀錄中。";
  captureFollowupField.hidden = false;
  captureForm.elements.followup.disabled = false;
  captureFollowupLabel.textContent = "接下來要做什麼（選填）";
  captureForm.elements.followup.placeholder = "若仍有後續工作，可在這裡寫下並建立工作";
  captureFollowupHelp.textContent = "只有勾選建立工作時，這段文字才會進入工作板。";
  captureNextTaskField.hidden = false;
  captureCreateTask.disabled = false;
  captureTaskFields.hidden = true;
  captureTaskFields.querySelectorAll("input, select").forEach(control => { control.disabled = true; });
  captureSubmit.textContent = "完成工作";
  if (typeof captureDialog.showModal === "function") captureDialog.showModal();
  else captureDialog.setAttribute("open", "");
  requestAnimationFrame(() => captureForm.elements.detail.focus());
}

function toggleIssue(issueId) {
  const data = workspaceData[uiState.projectId];
  const issue = data?.issues.find(item => item.id === issueId);
  if (!issue) return;
  if (issue.status === "open") return openIssueResolutionDialog(issueId);
  issue.status = "open";
  data.activity.unshift({ id: `activity-${Date.now()}`, kind: "issue", title: `重新開啟：${issue.title}`, detail: issue.resolution || issue.detail, date: currentDateLabel() });
  saveWorkspaceData();
  refreshProjectDataSurface();
  showToast("問題已重新開啟");
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function addEvidenceFiles(files) {
  const data = workspaceData[uiState.projectId];
  if (!data || !files.length) return;
  const { linkedType, linkedId } = resolveEvidenceTarget(data, evidenceTarget);
  [...files].forEach((file, index) => {
    const evidence = { id: `file-${Date.now()}-${index}`, name: file.name, size: formatFileSize(file.size), date: currentDateLabel(), source: "local", linkedType, linkedId };
    data.files.push(evidence);
    data.activity.unshift({ id: `activity-file-${Date.now()}-${index}`, evidenceId: evidence.id, kind: "note", title: `加入資料：${file.name}`, detail: `${evidenceContextLabel(data, evidence)} / 已建立本機文件索引，大小 ${formatFileSize(file.size)}。`, date: currentDateLabel() });
  });
  evidenceTarget = { kind: "project", id: null };
  saveWorkspaceData();
  refreshProjectDataSurface();
  showToast(`已加入 ${files.length} 份文件索引`);
}

function chooseEvidenceFiles(kind = "project", id = null) {
  evidenceTarget = { kind, id };
  evidenceInput.click();
}

function openLinkDialog(kind = "project", id = null, evidenceId = "") {
  const data = workspaceData[uiState.projectId];
  if (!data) return;
  const existing = evidenceId ? data.files.find(file => file.id === evidenceId && file.source === "link") : null;
  linkFlow = { evidenceId: existing?.id || null };
  linkTarget = existing ? { kind: existing.linkedType || "project", id: existing.linkedId || null } : { kind, id };
  const target = resolveEvidenceTarget(data, linkTarget);
  linkTarget = { kind: target.linkedType, id: target.linkedId || null };
  linkForm.reset();
  linkUrl.setCustomValidity("");
  linkDialogTitle.textContent = existing ? "編輯外部連結" : "新增外部連結";
  if (existing) {
    linkForm.elements.title.value = existing.name || "";
    linkForm.elements.url.value = existing.url || "";
    linkForm.elements.note.value = existing.note || "";
  }
  const contextLabel = evidenceContextLabel(data, target);
  linkContext.innerHTML = `<strong>${escapeHTML(contextLabel)}</strong><span>儲存後，可從這裡或搜尋開啟連結。</span>`;
  if (typeof linkDialog.showModal === "function") linkDialog.showModal();
  else linkDialog.setAttribute("open", "");
  requestAnimationFrame(() => (existing ? linkTitle : linkUrl).focus());
}

function closeLinkDialog() {
  if (typeof linkDialog.close === "function") linkDialog.close();
  else linkDialog.removeAttribute("open");
}

function deleteEvidence(evidenceId) {
  const data = workspaceData[uiState.projectId];
  const evidence = data?.files.find(file => file.id === evidenceId);
  if (!data || !evidence) return;
  const backupFiles = [...data.files];
  const backupActivity = [...data.activity];
  data.files = data.files.filter(file => file.id !== evidenceId);
  data.activity = data.activity.filter(item => item.evidenceId !== evidenceId);
  saveWorkspaceData();
  refreshProjectDataSurface();
  showToast(`已移除「${evidence.name}」`, {
    label: "復原",
    run: () => {
      data.files = backupFiles;
      data.activity = backupActivity;
      saveWorkspaceData();
      refreshProjectDataSurface();
      showToast("已復原移除的資料");
    }
  });
}

function populateDecisionIssues(preferredIssueId = "", preferredTaskId = "") {
  const data = workspaceData[uiState.projectId];
  const issues = [...(data?.issues || [])].filter(issue => !preferredTaskId || issue.taskId === preferredTaskId || issue.id === preferredIssueId).sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.id.localeCompare(a.id);
  });
  captureIssueSelect.innerHTML = issues.map(issue => `<option value="${escapeHTML(issue.id)}">${issue.status === "open" ? "未解" : "已解"} · ${escapeHTML(issue.title)}</option>`).join("");
  const selectedId = issues.some(issue => issue.id === preferredIssueId) ? preferredIssueId : issues[0]?.id || "";
  captureIssueSelect.value = selectedId;
  updateDecisionIssueContext();
  return issues.length;
}

function populateIssueSources(preferredTaskId = "") {
  const data = workspaceData[uiState.projectId];
  const tasks = data?.tasks || [];
  captureIssueSource.innerHTML = `<option value="project">整體案件</option>${tasks.map(task => `<option value="task:${escapeHTML(task.id)}">工作 · ${escapeHTML(task.title)}</option>`).join("")}`;
  captureIssueSource.value = tasks.some(task => task.id === preferredTaskId) ? `task:${preferredTaskId}` : "project";
  syncIssueImpactToSource();
}

function syncIssueImpactToSource() {
  const isTaskIssue = captureIssueSource.value.startsWith("task:");
  const localOption = captureIssueImpact.querySelector('option[value="local"]');
  if (localOption) localOption.disabled = !isTaskIssue;
  captureIssueImpact.value = isTaskIssue ? "local" : "project";
}

function updateDecisionIssueContext() {
  if (captureForm.elements.kind.value !== "decision") return;
  const issue = workspaceData[uiState.projectId]?.issues.find(item => item.id === captureIssueSelect.value);
  if (!issue) {
    captureContext.hidden = true;
    captureContext.textContent = "";
    return;
  }
  captureContext.hidden = false;
  captureContext.innerHTML = `<strong>${escapeHTML(issue.title)}</strong><span>${escapeHTML(issueContextLabel(workspaceData[uiState.projectId], issue))} · ${escapeHTML(issue.detail)}${issue.next ? ` · 下一步：${escapeHTML(issue.next)}` : ""}</span>`;
}

function openCaptureDialog(kind = "task", preferredIssueId = "", preferredTaskId = "") {
  if (!capturePresets[kind]) kind = "note";
  if (kind === "decision" && !workspaceData[uiState.projectId]?.issues.length) {
    showToast("目前沒有可連結的問題，請先記錄問題");
    kind = "issue";
  }
  captureFlow = { mode: "create", issueId: null, taskId: preferredTaskId || null };
  captureForm.reset();
  captureForm.elements.kind.value = kind;
  configureCaptureForm(kind);
  if (kind === "decision") populateDecisionIssues(preferredIssueId, preferredTaskId);
  if (kind === "issue") populateIssueSources(preferredTaskId);
  if (typeof captureDialog.showModal === "function") captureDialog.showModal();
  else captureDialog.setAttribute("open", "");
  requestAnimationFrame(() => (kind === "decision" ? captureIssueSelect : captureForm.elements.title).focus());
}

function openIssueResolutionDialog(issueId) {
  const data = workspaceData[uiState.projectId];
  const issue = data?.issues.find(item => item.id === issueId);
  if (!issue) return;
  const linkedDecisions = data.decisions.filter(item => item.issueId === issueId).sort((a, b) => b.id.localeCompare(a.id));
  const latestDecision = linkedDecisions[0];
  captureFlow = { mode: "resolve-issue", issueId };
  captureForm.reset();
  captureForm.elements.kind.value = "issue";
  configureCaptureForm("issue");
  captureKicker.textContent = "解決問題";
  captureDialogTitle.textContent = "完成問題處理";
  captureIntro.textContent = linkedDecisions.length
    ? `已連結 ${linkedDecisions.length} 筆決策，這裡只補上實際處理結果。`
    : "把處理結果留在原問題上；若中間有需要保留的選擇，可先回到問題下記錄決策。";
  captureContext.hidden = false;
  captureContext.innerHTML = `<strong>${escapeHTML(issue.title)}</strong><span>${escapeHTML(issue.detail)}${latestDecision ? ` · 最近決策：${escapeHTML(latestDecision.title)}` : ""}</span>`;
  captureTitleField.hidden = true;
  captureForm.elements.title.disabled = true;
  captureDetailLabel.textContent = linkedDecisions.length ? "實際處理結果（必填）" : "如何解決（必填）";
  captureForm.elements.detail.placeholder = linkedDecisions.length ? "這些決策執行後，問題最後變成什麼狀態？" : "寫下最後怎麼處理、結果如何";
  captureForm.elements.detail.required = true;
  captureDetailHelp.textContent = "必填。這段內容會成為原問題的處理結果。";
  captureFollowupLabel.textContent = "後續注意事項（選填）";
  captureForm.elements.followup.placeholder = "仍需觀察、驗證或追蹤的事情";
  captureFollowupHelp.textContent = "選填。沒有後續事項可以留空。";
  captureNextTaskField.hidden = false;
  captureCreateTask.disabled = false;
  captureSubmit.textContent = "完成並關閉問題";
  if (typeof captureDialog.showModal === "function") captureDialog.showModal();
  else captureDialog.setAttribute("open", "");
  requestAnimationFrame(() => captureForm.elements.detail.focus());
}

function closeCaptureDialog() {
  if (typeof captureDialog.close === "function") captureDialog.close();
  else captureDialog.removeAttribute("open");
}

function configureCaptureForm(kind = captureForm.elements.kind.value) {
  const preset = capturePresets[kind] || capturePresets.note;
  captureKicker.textContent = preset.kicker;
  captureDialogTitle.textContent = preset.title;
  captureIntro.textContent = preset.intro;
  captureContext.hidden = true;
  captureContext.textContent = "";
  captureIssueField.hidden = kind !== "decision";
  captureIssueSelect.disabled = kind !== "decision";
  captureIssueSelect.required = kind === "decision";
  const isCreatingIssue = kind === "issue" && captureFlow.mode === "create";
  captureIssueSourceField.hidden = !isCreatingIssue;
  captureIssueSource.disabled = !isCreatingIssue;
  captureIssueImpact.disabled = !isCreatingIssue;
  captureNextTaskField.hidden = kind !== "decision";
  captureCreateTask.disabled = kind !== "decision";
  captureTitleField.hidden = false;
  captureForm.elements.title.disabled = false;
  captureForm.elements.title.required = true;
  captureTitleLabel.textContent = `${preset.titleLabel}（必填）`;
  captureForm.elements.title.placeholder = preset.titlePlaceholder;
  captureDetailLabel.textContent = preset.detailLabel;
  captureForm.elements.detail.placeholder = preset.detailPlaceholder;
  captureForm.elements.detail.required = false;
  captureDetailHelp.textContent = preset.detailHelp;
  captureSubmit.textContent = preset.submit;

  const hasFollowup = Boolean(preset.followupLabel);
  captureFollowupField.hidden = !hasFollowup;
  captureForm.elements.followup.disabled = !hasFollowup;
  captureFollowupLabel.textContent = preset.followupLabel || "下一步";
  captureForm.elements.followup.placeholder = preset.followupPlaceholder || "";
  captureFollowupHelp.textContent = preset.followupHelp || "";

  captureTaskFields.hidden = kind !== "task";
  captureTaskFields.querySelectorAll("input, select").forEach(control => { control.disabled = kind !== "task"; });
}

function openScheduleDialog(scope, itemId = "") {
  const project = getProject(uiState.projectId);
  const data = workspaceData[uiState.projectId];
  if (!project || !data) return;
  scheduleForm.reset();
  scheduleForm.elements.scope.value = scope;
  scheduleForm.elements.itemId.value = itemId;
  const isProject = scope === "project";
  scheduleProjectFields.hidden = !isProject;
  scheduleTaskFields.hidden = isProject;
  scheduleProjectFields.querySelectorAll("input, select").forEach(control => { control.disabled = !isProject; });
  scheduleTaskFields.querySelectorAll("input, select").forEach(control => { control.disabled = isProject; });

  if (isProject) {
    scheduleTitle.textContent = `調整「${project.name}」期限`;
    scheduleForm.elements.dueDate.value = normalizeDateValue(data.deadlineDate);
    scheduleForm.elements.dueTime.value = data.deadlineTime || "";
    scheduleForm.elements.deadlineLabel.value = data.deadlineLabel || "";
  } else {
    const task = data.tasks.find(item => item.id === itemId);
    if (!task) return;
    scheduleTitle.textContent = `調整「${task.title}」時間`;
    scheduleForm.elements.dueDate.value = normalizeDateValue(task.due);
    scheduleForm.elements.dueTime.value = task.dueTime || "";
    scheduleForm.elements.priority.value = task.priority || "normal";
  }
  if (typeof scheduleDialog.showModal === "function") scheduleDialog.showModal();
  else scheduleDialog.setAttribute("open", "");
  requestAnimationFrame(() => scheduleForm.elements.dueDate.focus());
}

function closeScheduleDialog() {
  if (typeof scheduleDialog.close === "function") scheduleDialog.close();
  else scheduleDialog.removeAttribute("open");
}

function getCommandCatalog() {
  const commands = [
    { kind: "說明", title: "工作用語辭典", detail: "查詢工作台的用詞、舊稱與例子", action: "glossary" },
    { kind: "指令", title: "查看優先處理", detail: "跨案件整理待解決問題與正在推進的工作", action: "attention" },
    { kind: "資料", title: "匯出本機備份", detail: "下載工作板、問題、決策與紀錄的 JSON 備份", action: "export" },
    { kind: "資料", title: "匯入本機備份", detail: "從先前匯出的 JSON 還原案件資料", action: "import" }
  ];
  topologyProjects.forEach(project => {
    const snapshot = getProjectSnapshot(project);
    commands.push({ kind: "案件", title: project.name, detail: `${snapshot.state} / ${snapshot.progress}% / ${snapshot.deadline.display}`, projectId: project.id, tab: "overview" });
    commands.push({ kind: "快速新增", title: `在「${project.name}」新增進度`, detail: "進入案件並直接記錄進度", captureProjectId: project.id });
    getProjectNodes(project, true).filter(node => node.type !== "cluster").forEach(node => commands.push({ kind: node.type === "issue" ? "問題節點" : "節點", title: node.label, detail: `${project.name} / ${node.date}`, nodeId: node.id }));
    workspaceData[project.id].tasks.forEach(task => {
      const due = getDueMeta(task.due, task.dueTime, task.status === "done");
      commands.push({ kind: "工作", title: task.title, detail: `${project.name} / ${boardColumns.find(column => column.id === task.status)?.label || task.status} / ${due.display} · ${due.short}`, projectId: project.id, tab: "board", recordId: task.id });
    });
    workspaceData[project.id].issues.forEach(issue => commands.push({ kind: issue.status === "open" ? "待解決問題" : "已解問題", title: issue.title, detail: `${project.name} / ${issueContextLabel(workspaceData[project.id], issue)}`, projectId: project.id, tab: "records", recordId: issue.id }));
    workspaceData[project.id].files.forEach(file => commands.push({ kind: file.source === "link" ? "外部連結" : "資料", title: file.name, detail: `${project.name} / ${evidenceContextLabel(workspaceData[project.id], file)}${file.note ? ` / ${file.note}` : ""}${file.url ? ` / ${file.url}` : ""}`, projectId: project.id, tab: "files", recordId: file.id }));
  });
  return commands;
}

let visibleCommandItems = [];

function renderCommandResults(query = "") {
  const normalized = query.trim().toLocaleLowerCase("zh-Hant");
  const catalog = getCommandCatalog();
  visibleCommandItems = (normalized
    ? catalog.filter(item => `${item.kind} ${item.title} ${item.detail}`.toLocaleLowerCase("zh-Hant").includes(normalized))
    : catalog.filter(item => item.action || item.kind === "案件")
  ).slice(0, 12);
  uiState.commandSelection = Math.min(uiState.commandSelection, Math.max(0, visibleCommandItems.length - 1));
  commandResults.innerHTML = visibleCommandItems.length ? visibleCommandItems.map((item, index) => `
    <button class="command-result ${index === uiState.commandSelection ? "is-selected" : ""}" type="button" data-command-index="${index}">
      <span>${escapeHTML(item.kind)}</span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.detail)}</small>
    </button>`).join("") : `<div class="command-empty"><strong>沒有符合的結果</strong><span>可以改用案件、工作、問題、資料名稱或網址搜尋。</span></div>`;
  const selectedResult = commandResults.querySelector(".is-selected");
  if (selectedResult) {
    const containerRect = commandResults.getBoundingClientRect();
    const selectedRect = selectedResult.getBoundingClientRect();
    if (selectedRect.top < containerRect.top) commandResults.scrollTop -= (containerRect.top - selectedRect.top) / appLayoutScale();
    else if (selectedRect.bottom > containerRect.bottom) commandResults.scrollTop += (selectedRect.bottom - containerRect.bottom) / appLayoutScale();
  }
}

function openCommandDialog(initialQuery = "") {
  commandTrigger = document.activeElement;
  commandInput.value = initialQuery;
  uiState.commandSelection = 0;
  renderCommandResults(initialQuery);
  if (typeof commandDialog.showModal === "function") commandDialog.showModal();
  else commandDialog.setAttribute("open", "");
  requestAnimationFrame(() => commandInput.focus());
}

function closeCommandDialog() {
  if (typeof commandDialog.close === "function") commandDialog.close();
  else commandDialog.removeAttribute("open");
  if (commandTrigger instanceof HTMLElement && commandTrigger.isConnected) commandTrigger.focus();
}

function executeCommand(item) {
  if (!item) return;
  closeCommandDialog();
  if (item.action === "glossary") return window.open("./glossary.html", "_blank", "noopener");
  if (item.action === "attention") return openAttentionPanel();
  if (item.action === "export") return exportWorkspaceBackup();
  if (item.action === "import") return backupInput.click();
  if (item.captureProjectId) {
    openProjectRoom(item.captureProjectId, "overview");
    return requestAnimationFrame(() => openCaptureDialog("note"));
  }
  if (item.nodeId) {
    if (uiState.surface === "project") showPortfolioSurface();
    return openInspector(item.nodeId);
  }
  if (item.projectId) return openProjectRoom(item.projectId, item.tab || "overview", true, item.recordId || "");
}

function exportWorkspaceBackup() {
  const payload = JSON.stringify({ version: workspaceSchemaVersion, schemaVersion: workspaceSchemaVersion, exportedAt: new Date().toISOString(), workspaceData }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `personal-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showToast("本機備份已匯出");
}

async function importWorkspaceBackup(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const incoming = parsed.workspaceData || parsed;
    let imported = 0;
    topologyProjects.forEach(project => {
      const candidate = incoming?.[project.id];
      if (!candidate || !["tasks", "issues", "decisions", "files", "activity"].every(key => Array.isArray(candidate[key]))) return;
      workspaceData[project.id] = migrateProjectData(project, candidate, workspaceData[project.id]);
      imported += 1;
    });
    if (!imported) throw new Error("No compatible project data");
    saveWorkspaceData();
    refreshProjectDataSurface();
    showToast(`已還原 ${imported} 個案件的本機資料`);
  } catch (error) {
    console.warn("Unable to import workspace backup", error);
    showToast("備份格式不相容，請選擇由此工作台匯出的 JSON 檔案");
  }
}

function appendTimelineNode(projectId, record, kind) {
  if (!new Set(["issue", "decision", "note"]).has(kind)) return;
  const project = getProject(projectId);
  const data = workspaceData[projectId];
  const current = getProjectNodes(project, true).find(node => node.current)
    || getProjectNodes(project, true).filter(node => node.semanticMain).at(-1)
    || project.nodes.at(-1) || { x: 0 };
  const ordinal = data.timeline.length;
  const direction = kind === "issue" ? -1 : 1;
  data.timeline.push({
    id: `timeline-${record.id}`,
    linkedRecordId: record.id,
    issueId: record.issueId || "",
    linkedTaskId: record.taskId || "",
    impact: record.impact || "",
    x: Math.min(current.x + 55 + (ordinal % 3) * 95, 1320),
    yOffset: direction * (72 + Math.floor(ordinal / 3) * 48),
    type: kind === "note" ? "event" : kind,
    date: record.date,
    label: record.title,
    summary: record.detail,
    action: record.detail,
    decision: kind === "decision" ? record.detail : kind === "issue" && record.response ? record.response : "尚未形成決策。",
    next: record.next || "回到案件工作區確認下一步。",
    evidence: "由案件紀錄建立"
  });
}

function routeFromLocation() {
  const params = new URLSearchParams(location.hash.replace("#", ""));
  const projectId = params.get("project");
  if (projectId && getProject(projectId)) {
    openProjectRoom(projectId, params.get("tab") || "overview", false, params.get("record") || "");
    return;
  }
  showPortfolioSurface();
  const nodeId = params.get("node");
  if (nodeId && getNode(nodeId)) openInspector(nodeId);
}

document.addEventListener("click", event => {
  const commandResult = event.target.closest("[data-command-index]");
  if (commandResult) return executeCommand(visibleCommandItems[Number(commandResult.dataset.commandIndex)]);

  const nodeButton = event.target.closest("[data-node-id]");
  if (nodeButton) return openInspector(nodeButton.dataset.nodeId);

  const projectTabLink = event.target.closest("[data-open-project-tab]");
  if (projectTabLink) return openProjectRoom(projectTabLink.dataset.projectId, projectTabLink.dataset.openProjectTab, true, projectTabLink.dataset.recordId || "");

  const openProjectButton = event.target.closest("[data-open-project]");
  if (openProjectButton) return openProjectRoom(openProjectButton.dataset.openProject);

  const projectTabButton = event.target.closest("[data-project-tab]");
  if (projectTabButton) return setProjectTab(projectTabButton.dataset.projectTab);

  const deleteRecordButton = event.target.closest("[data-delete-record]");
  if (deleteRecordButton) return deleteRecord(deleteRecordButton.dataset.deleteKind, deleteRecordButton.dataset.deleteRecord, deleteRecordButton.dataset.deleteSource);

  const issueButton = event.target.closest("[data-toggle-issue]");
  if (issueButton) return toggleIssue(issueButton.dataset.toggleIssue);

  const taskIssueButton = event.target.closest("[data-report-task-issue]");
  if (taskIssueButton) return openCaptureDialog("issue", "", taskIssueButton.dataset.reportTaskIssue);

  const evidenceButton = event.target.closest("[data-add-evidence-for]");
  if (evidenceButton) return chooseEvidenceFiles(evidenceButton.dataset.evidenceKind, evidenceButton.dataset.addEvidenceFor);

  const linkButton = event.target.closest("[data-add-link-for]");
  if (linkButton) return openLinkDialog(linkButton.dataset.linkKind, linkButton.dataset.addLinkFor);

  const editLinkButton = event.target.closest("[data-edit-link]");
  if (editLinkButton) return openLinkDialog("project", null, editLinkButton.dataset.editLink);

  const deleteEvidenceButton = event.target.closest("[data-delete-evidence]");
  if (deleteEvidenceButton) return deleteEvidence(deleteEvidenceButton.dataset.deleteEvidence);

  const decisionForButton = event.target.closest("[data-decision-for]");
  if (decisionForButton) return openCaptureDialog("decision", decisionForButton.dataset.decisionFor);

  const taskScheduleButton = event.target.closest("[data-edit-task-schedule]");
  if (taskScheduleButton) return openScheduleDialog("task", taskScheduleButton.dataset.editTaskSchedule);
  const flowButton = event.target.closest("[data-edit-work-flow]");
  if (flowButton) return openWorkFlowDialog(flowButton.dataset.editWorkFlow);

  const chooseFocusButton = event.target.closest("[data-choose-focus-project]");
  if (chooseFocusButton) return chooseFocusProject(chooseFocusButton.dataset.chooseFocusProject);

  const captureProjectButton = event.target.closest("[data-capture-project]");
  if (captureProjectButton) return chooseCaptureProject(captureProjectButton.dataset.captureProject);

  const focusButton = event.target.closest("[data-focus-project]");
  if (focusButton) return focusProject(focusButton.dataset.focusProject);

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) return setView(viewButton.dataset.view);

  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    if (uiState.surface === "project") {
      if (modeButton.dataset.mode === "portfolio") leaveProjectRoom();
      if (modeButton.dataset.mode === "focus") setProjectTab("overview");
      if (modeButton.dataset.mode === "issues") setProjectTab("records");
      return;
    }
    if (uiState.view === "mine") setView("map");
    if (modeButton.dataset.mode === "portfolio") resetMap();
    if (modeButton.dataset.mode === "focus") openProjectPicker("focus");
    if (modeButton.dataset.mode === "issues") showIssuesOnly();
    return;
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "zoom-in") setZoom(uiState.scale + .1);
  if (action === "zoom-out") setZoom(uiState.scale - .1);
  if (action === "fit") fitMap();
  if (action === "reset" && uiState.surface === "portfolio") resetMap();
  if (action === "close-inspector") closeInspector();
  if (action === "open-attention") openAttentionPanel();
  if (action === "open-command") openCommandDialog();
  if (action === "close-command") closeCommandDialog();
  if (action === "leave-project") leaveProjectRoom();
  if (action === "open-capture") openCaptureDialog(event.target.closest("[data-capture-kind]")?.dataset.captureKind || "task");
  if (action === "close-capture") closeCaptureDialog();
  if (action === "open-project-schedule") openScheduleDialog("project");
  if (action === "close-schedule") closeScheduleDialog();
  if (action === "close-work-flow") workFlowDialog.close();
  if (action === "choose-files") chooseEvidenceFiles();
  if (action === "open-link") openLinkDialog();
  if (action === "close-link") closeLinkDialog();
  if (action === "new-event") openProjectPicker("capture");
  if (action === "clear-focus") clearProjectFocus();
});

document.addEventListener("change", event => {
  if (event.target === captureIssueSelect) return updateDecisionIssueContext();
  if (event.target === captureIssueSource) return syncIssueImpactToSource();
  const moveSelect = event.target.closest("[data-move-task]");
  if (moveSelect) moveTask(moveSelect.dataset.moveTask, moveSelect.value);
});

document.addEventListener("toggle", event => {
  const openedProject = event.target.closest?.(".mobile-path-project");
  if (!openedProject || !openedProject.isConnected) return;
  if (!openedProject.open) {
    if (uiState.mobileExpandedProjectId === openedProject.dataset.mobileProject) uiState.mobileExpandedProjectId = null;
    return;
  }
  uiState.mobileExpandedProjectId = openedProject.dataset.mobileProject;
  mobileOverview.querySelectorAll(".mobile-path-project[open]").forEach(project => {
    if (project !== openedProject) project.open = false;
  });
}, true);

document.addEventListener("dragstart", event => {
  const task = event.target.closest("[data-task-id]");
  if (!task || event.target.closest("select, button")) return;
  task.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", task.dataset.taskId);
});

document.addEventListener("dragend", event => {
  event.target.closest("[data-task-id]")?.classList.remove("is-dragging");
  document.querySelectorAll(".kanban-column.is-over").forEach(column => column.classList.remove("is-over"));
});

document.addEventListener("dragover", event => {
  const evidenceDrop = event.target.closest(".evidence-drop");
  if (evidenceDrop && Array.from(event.dataTransfer.types).includes("Files")) {
    event.preventDefault();
    evidenceDrop.classList.add("is-over");
    return;
  }
  const column = event.target.closest("[data-drop-status]");
  if (!column) return;
  event.preventDefault();
  document.querySelectorAll(".kanban-column.is-over").forEach(item => item.classList.remove("is-over"));
  column.classList.add("is-over");
});

document.addEventListener("drop", event => {
  const evidenceDrop = event.target.closest(".evidence-drop");
  if (evidenceDrop && event.dataTransfer.files.length) {
    event.preventDefault();
    evidenceDrop.classList.remove("is-over");
    evidenceTarget = { kind: evidenceDrop.dataset.evidenceKind || "project", id: evidenceDrop.dataset.evidenceId || null };
    addEvidenceFiles(event.dataTransfer.files);
    return;
  }
  const column = event.target.closest("[data-drop-status]");
  if (!column) return;
  event.preventDefault();
  moveTask(event.dataTransfer.getData("text/plain"), column.dataset.dropStatus);
});

evidenceInput.addEventListener("change", () => {
  addEvidenceFiles(evidenceInput.files);
  evidenceInput.value = "";
});

backupInput.addEventListener("change", () => {
  const file = backupInput.files?.[0];
  if (file) importWorkspaceBackup(file);
  backupInput.value = "";
});

linkForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = workspaceData[uiState.projectId];
  if (!data) return;
  const formData = new FormData(linkForm);
  const title = String(formData.get("title") || "").trim();
  const url = normalizeExternalUrl(formData.get("url"));
  const note = String(formData.get("note") || "").trim();

  if (!url) {
    linkUrl.setCustomValidity("請輸入有效的 http 或 https 網址");
    linkUrl.reportValidity();
    return;
  }
  linkUrl.setCustomValidity("");
  if (!linkFlow.evidenceId && window.documentModel) {
    try {
      documentModel.mutate(() => {
        documentModel.source({ url, name: title, note, projectId: uiState.projectId, ...linkTarget });
      });
      closeLinkDialog(); showToast("來源已加入目前對象；已存的連結會直接沿用");
    } catch (error) { showToast(error.message); }
    return;
  }
  if (data.files.some(file => file.id !== linkFlow.evidenceId && file.source === "link" && normalizeExternalUrl(file.url) === url)) {
    showToast("這個案件已有相同連結");
    linkUrl.focus();
    return;
  }
  const existing = linkFlow.evidenceId ? data.files.find(file => file.id === linkFlow.evidenceId && file.source === "link") : null;
  const { linkedType, linkedId } = resolveEvidenceTarget(data, linkTarget);
  const evidence = existing || { id: `link-${Date.now()}`, size: "網頁連結", date: currentDateLabel(), source: "link", linkedType, linkedId };
  Object.assign(evidence, { name: title, url, note, linkedType, linkedId });
  if (!existing) data.files.push(evidence);
  data.activity.unshift({ id: `activity-link-${Date.now()}`, evidenceId: evidence.id, kind: "note", title: `${existing ? "更新" : "加入"}連結：${title}`, detail: `${evidenceContextLabel(data, evidence)} / ${note || url}`, date: currentDateLabel() });
  saveWorkspaceData();
  closeLinkDialog();
  refreshProjectDataSurface();
  showToast(existing ? "外部連結已更新" : "外部連結已保存");
});

linkUrl.addEventListener("input", () => linkUrl.setCustomValidity(""));

commandInput.addEventListener("input", () => {
  uiState.commandSelection = 0;
  renderCommandResults(commandInput.value);
});

commandInput.addEventListener("keydown", event => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    uiState.commandSelection = Math.min(Math.max(0, visibleCommandItems.length - 1), uiState.commandSelection + 1);
    renderCommandResults(commandInput.value);
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    uiState.commandSelection = Math.max(0, uiState.commandSelection - 1);
    renderCommandResults(commandInput.value);
  }
  if (event.key === "Enter") {
    event.preventDefault();
    executeCommand(visibleCommandItems[uiState.commandSelection]);
  }
});

captureForm.addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(captureForm);
  const kind = formData.get("kind");
  const title = String(formData.get("title") || "").trim();
  const detail = String(formData.get("detail") || "").trim();
  const followup = String(formData.get("followup") || "").trim();
  const issueId = String(formData.get("issueId") || "").trim();
  const issueSource = String(formData.get("issueSource") || "project");
  const requestedImpact = String(formData.get("issueImpact") || "project");
  const createTask = formData.get("createTask") === "on";
  const dueDate = normalizeDateValue(formData.get("dueDate") || "");
  const dueTime = String(formData.get("dueTime") || "").slice(0, 5);
  const requestedPriority = String(formData.get("priority") || "normal");
  const priority = new Set(["normal", "medium", "high"]).has(requestedPriority) ? requestedPriority : "normal";
  const data = workspaceData[uiState.projectId];
  if (!data) return;

  if (captureFlow.mode === "complete-task") {
    const task = data.tasks.find(item => item.id === captureFlow.taskId);
    if (!task || !detail) return;
    if (getTaskBlockers(data, task).length || data.issues.some(issue => issue.taskId === task.id && issue.status === "open")) {
      showToast("工作仍有未完成前置或待解決問題，無法完成");
      return;
    }
    if (createTask && !followup) {
      showToast("請先填寫下一步，才能建立工作");
      captureForm.elements.followup.focus();
      return;
    }
    task.status = "done";
    task.completionNote = detail;
    task.completedAt = currentDateLabel();
    if (task.review) task.review = { ...task.review, result: detail, confirmedAt: new Date().toISOString() };
    const nextTask = createTask ? createNextTaskFromRecord(data, { title: followup, sourceTaskId: task.id, sourceIssueId: task.sourceIssueId || "" }) : null;
    data.activity.unshift({
      id: `activity-complete-${task.id}-${Date.now()}`,
      kind: "task",
      title: `完成工作：${task.title}`,
      detail: `${detail}${nextTask ? ` / 已建立下一步：${nextTask.title}` : followup ? ` / 後續：${followup}` : ""}`,
      date: currentDateLabel()
    });
    saveWorkspaceData();
    closeCaptureDialog();
    refreshProjectDataSurface();
    showToast(nextTask ? "工作已完成，下一步已進入工作板" : "工作已完成並保留驗收結果");
    return;
  }

  if (captureFlow.mode === "resolve-issue") {
    const issue = data.issues.find(item => item.id === captureFlow.issueId);
    if (!issue || !detail) return;
    if (createTask && !followup) {
      showToast("請先填寫後續事項，才能建立工作");
      captureForm.elements.followup.focus();
      return;
    }
    issue.status = "resolved";
    issue.resolution = detail;
    if (followup) issue.next = followup;
    const nextTask = createTask ? createNextTaskFromRecord(data, { title: followup, sourceIssueId: issue.id, sourceTaskId: issue.taskId || "" }) : null;
    if (nextTask) issue.nextTaskId = nextTask.id;
    const linkedNode = data.timeline.find(node => node.linkedRecordId === issue.id);
    if (linkedNode) {
      linkedNode.decision = detail;
      linkedNode.next = followup || "處理完成，保留紀錄供後續回顧。";
    }
    const resolutionEntry = {
      id: `activity-resolve-${Date.now()}`,
      kind: "issue",
      taskId: issue.taskId || "",
      title: `解決問題：${issue.title}`,
      detail: `${detail}${followup ? ` / 後續：${followup}` : ""}${nextTask ? " / 已建立下一步工作" : ""}`,
      date: currentDateLabel()
    };
    data.activity.unshift(resolutionEntry);
    data.tasks.find(task => task.id === issue.taskId)?.history?.unshift({ ...resolutionEntry });
    saveWorkspaceData();
    closeCaptureDialog();
    refreshProjectDataSurface();
    showToast(nextTask ? "問題已關閉，下一步已進入工作板" : "已保留處理結果並關閉問題");
    return;
  }

  if (!title) return;
  if (kind === "decision" && createTask && !followup) {
    showToast("請先填寫下一步，才能建立工作");
    captureForm.elements.followup.focus();
    return;
  }
  const id = `${kind}-${Date.now()}`;
  const date = currentDateLabel();
  let timelineRecord = null;
  if (kind === "task") data.tasks.push({ id, title, detail: detail || "尚未補充說明", due: dueDate || "未排定", dueTime, priority, status: "queue" });
  if (kind === "issue") {
    const requestedTaskId = issueSource.startsWith("task:") ? issueSource.slice(5) : "";
    const linkedTask = data.tasks.find(item => item.id === requestedTaskId);
    const scope = linkedTask ? "task" : "project";
    const impact = scope === "task" && requestedImpact === "local" ? "local" : "project";
    timelineRecord = { id, title, detail: detail || "尚未補充說明", response: followup, next: followup || "待確認下一步", status: "open", date, scope, taskId: linkedTask?.id || "", impact };
    data.issues.unshift(timelineRecord);
  }
  if (kind === "decision") {
    const linkedIssue = data.issues.find(item => item.id === issueId);
    if (!linkedIssue) {
      showToast("請先選擇這項決策回應的問題");
      captureIssueSelect.focus();
      return;
    }
    timelineRecord = { id, title, detail: detail || "尚未補充理由", next: followup, date, issueId };
    data.decisions.unshift(timelineRecord);
    const nextTask = createTask ? createNextTaskFromRecord(data, { title: followup, sourceIssueId: issueId, sourceDecisionId: id }) : null;
    if (nextTask) timelineRecord.nextTaskId = nextTask.id;
  }
  if (kind === "note") timelineRecord = { id, title, detail: detail || "已新增進度紀錄。", next: followup, date };
  if (timelineRecord) appendTimelineNode(uiState.projectId, timelineRecord, kind);
  const linkedIssue = kind === "decision" ? data.issues.find(item => item.id === issueId) : null;
  const issueContext = kind === "issue" ? issueContextLabel(data, timelineRecord) : "";
  const activityDetail = kind === "task"
    ? `${detail || "尚未補充說明"} / ${formatDueValue(dueDate, dueTime)} / ${priorityLabel(priority)}`
    : `${linkedIssue ? `回應問題：${linkedIssue.title} / ` : issueContext ? `${issueContext} / ` : ""}${detail || "已新增紀錄。"}${followup ? ` / 下一步：${followup}` : ""}${kind === "decision" && timelineRecord?.nextTaskId ? " / 已建立下一步工作" : ""}`;
  const activityTaskId = kind === "issue" ? timelineRecord.taskId : linkedIssue?.taskId || "";
  const entry = { id: `activity-${id}`, kind, title, detail: activityDetail, date, taskId: activityTaskId };
  data.activity.unshift(entry);
  data.tasks.find(task => task.id === activityTaskId)?.history?.unshift({ ...entry });
  saveWorkspaceData();
  closeCaptureDialog();
  refreshProjectDataSurface();
  showToast(`已新增${kindLabel(kind)}`);
});

scheduleForm.addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(scheduleForm);
  const scope = String(formData.get("scope") || "");
  const itemId = String(formData.get("itemId") || "");
  const dueDate = normalizeDateValue(formData.get("dueDate") || "");
  const dueTime = String(formData.get("dueTime") || "").slice(0, 5);
  const data = workspaceData[uiState.projectId];
  if (!data) return;
  const date = currentDateLabel();

  if (scope === "project") {
    const label = String(formData.get("deadlineLabel") || "").trim() || "案件期限";
    data.deadlineDate = dueDate;
    data.deadlineTime = dueDate ? dueTime : "";
    data.deadlineLabel = label;
    const project = getProject(uiState.projectId);
    const deadlineNode = project ? [...project.nodes].reverse().find(node => node.type === "milestone" && !node.yOffset) : null;
    const deadlineTask = deadlineNode ? data.tasks.find(task => task.id === `task-${deadlineNode.id}`) : null;
    if (deadlineTask && !data.deliveryModelVersion) {
      deadlineTask.due = dueDate || "未排定";
      deadlineTask.dueTime = dueDate ? dueTime : "";
    }
    data.activity.unshift({
      id: `activity-deadline-${Date.now()}`,
      kind: "note",
      title: "調整案件期限",
      detail: dueDate ? `${formatDueValue(dueDate, dueTime)} · ${label}` : "已清除案件期限。",
      date
    });
  } else if (scope === "task") {
    const task = data.tasks.find(item => item.id === itemId);
    if (!task) return;
    const requestedPriority = String(formData.get("priority") || "normal");
    const priority = new Set(["normal", "medium", "high"]).has(requestedPriority) ? requestedPriority : "normal";
    task.due = dueDate || "未排定";
    task.dueTime = dueDate ? dueTime : "";
    task.priority = priority;
    const project = getProject(uiState.projectId);
    const deadlineNode = project ? [...project.nodes].reverse().find(node => node.type === "milestone" && !node.yOffset) : null;
    if (!data.deliveryModelVersion && deadlineNode && task.id === `task-${deadlineNode.id}`) {
      data.deadlineDate = dueDate;
      data.deadlineTime = dueDate ? dueTime : "";
    }
    data.activity.unshift({
      id: `activity-task-time-${Date.now()}`,
      kind: "task",
      title: `調整工作期限：${task.title}`,
      detail: `${formatDueValue(dueDate, dueTime)} · ${priorityLabel(priority)}`,
      date
    });
  } else return;

  saveWorkspaceData();
  closeScheduleDialog();
  refreshProjectDataSurface();
  showToast(scope === "project" ? "案件期限已更新" : "工作期限已更新");
});

// The canvas owns its gestures; the surrounding reading/forms keep native zoom.
(() => {
  const pointers = new Map();
  let pan = null, pinch = null, moved = false, suppressUntil = 0;
  const point = event => mapPoint(event.clientX, event.clientY);
  function pair() {
    const [a, b] = [...pointers.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) };
  }
  function rebase() {
    pan = pinch = null;
    if (pointers.size >= 2) {
      const center = pair();
      pinch = { distance: Math.max(1, center.distance), scale: uiState.scale,
        worldX: (center.x - uiState.x) / uiState.scale,
        worldY: (center.y - uiState.y) / uiState.scale };
      moved = true;
    } else if (pointers.size === 1) {
      const pointer = pointers.values().next().value;
      pan = { ...pointer, mapX: uiState.x, mapY: uiState.y };
    }
    uiState.dragging = pointers.size > 0 && moved;
    mapViewport.classList.toggle("is-panning", uiState.dragging);
  }
  function reset() {
    const captured = [...pointers.entries()];
    if (moved) suppressUntil = performance.now() + 700;
    pointers.clear(); pan = pinch = null; moved = false;
    uiState.dragging = false; uiState.dragOrigin = null;
    mapViewport.classList.remove("is-panning");
    captured.forEach(([id, pointer]) => {
      if (pointer.target.hasPointerCapture?.(id)) pointer.target.releasePointerCapture(id);
    });
  }
  mapViewport.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && (event.button !== 0 || event.target.closest("button, a, input, select, textarea"))) return;
    if (!pointers.size) { moved = false; suppressUntil = 0; }
    // Capturing on the original element preserves ordinary taps on node buttons.
    const target = event.target;
    pointers.set(event.pointerId, { ...point(event), target });
    if (event.isTrusted) target.setPointerCapture?.(event.pointerId);
    rebase();
  });
  mapViewport.addEventListener("pointermove", event => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    Object.assign(pointer, point(event));
    if (pinch && pointers.size >= 2) {
      const center = pair();
      uiState.scale = Math.min(1.6, Math.max(.55, pinch.scale * center.distance / pinch.distance));
      uiState.x = center.x - pinch.worldX * uiState.scale;
      uiState.y = center.y - pinch.worldY * uiState.scale;
    } else if (pan) {
      const dx = pointer.x - pan.x, dy = pointer.y - pan.y;
      if (!moved && Math.hypot(dx, dy) < (event.pointerType === "mouse" ? 2 : 6)) return;
      moved = true;
      uiState.x = pan.mapX + dx; uiState.y = pan.mapY + dy;
    } else return;
    if (event.cancelable) event.preventDefault();
    uiState.dragging = true; mapViewport.classList.add("is-panning");
    applyTransform();
  });
  function end(event) {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    pointers.delete(event.pointerId);
    if (moved) suppressUntil = performance.now() + 700;
    if (pointer.target.hasPointerCapture?.(event.pointerId)) pointer.target.releasePointerCapture(event.pointerId);
    rebase();
  }
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => mapViewport.addEventListener(type, end));
  mapViewport.addEventListener("click", event => {
    if (event.detail > 0 && (moved && pointers.size || performance.now() < suppressUntil)) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  // Safari can dispatch GestureEvents in addition to pointer events. Cancel its
  // default page zoom, while pointer events above remain the single camera owner.
  ["gesturestart", "gesturechange", "gestureend"].forEach(type => {
    mapViewport.addEventListener(type, event => event.preventDefault(), { passive: false });
  });
  mapViewport.addEventListener("touchmove", event => {
    if (event.touches.length > 1 && event.cancelable) event.preventDefault();
  }, { passive: false });
  window.addEventListener("blur", reset);
  window.addEventListener("resize", reset);
  document.addEventListener("visibilitychange", () => { if (document.hidden) reset(); });
})();

mapViewport.addEventListener("wheel", event => {
  event.preventDefault();
  const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? mapViewport.clientHeight : 1;
  const deltaY = event.deltaY * deltaMultiplier;
  const zoomFactor = Math.exp(-deltaY * .0016);
  setZoomAt(uiState.scale * zoomFactor, event.clientX, event.clientY);
}, { passive: false });

document.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (commandDialog.open) closeCommandDialog();
    else openCommandDialog();
    return;
  }
  if (event.target.matches("input, textarea, select")) return;
  if (uiState.surface === "project") return;
  if (event.key === "Escape") closeInspector();
  if ((event.key === "+" || event.key === "=") && !event.metaKey && !event.ctrlKey) setZoom(uiState.scale + .1);
  if (event.key === "-" && !event.metaKey && !event.ctrlKey) setZoom(uiState.scale - .1);
  if (event.key === "0" && !event.metaKey && !event.ctrlKey) fitMap();
});

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (uiState.surface !== "project") setView(window.innerWidth < 720 ? uiState.mobilePreferredView : uiState.preferredView, { persistPreference: false });
  }, 120);
});

window.addEventListener("popstate", routeFromLocation);

const portfolioPeriod = document.querySelector("#portfolio-period");
if (portfolioPeriod) portfolioPeriod.textContent = `${getISOWeekLabel()}`;
// delivery.js normalizes the delivery model before the first save and render.
