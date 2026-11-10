/* Mobile presentation reuses the existing work actions and data model. */
(() => {
  const compact = matchMedia('(max-width: 719px), (pointer: coarse) and (max-width: 1100px)');
  const e = escapeHTML, openCases = new Set();
  let chosenView = null, viewScroll = {}, lastPresentation = null;
  const presentation = () => compact.matches ? uiState.view === 'mine' ? 'mine' : uiState.view === 'list' ? 'list' : (chosenView === 'tree' || chosenView === 'canvas' ? chosenView : null) || (innerWidth < 720 ? 'tree' : 'canvas') : null;
  const bar = document.createElement('div'); bar.className = 'm-toolbar';
  bar.innerHTML = `<button type="button" class="m-back" data-action="leave-project">← 全局</button><select class="m-case-select" aria-label="查看案件"></select><button type="button" data-action="open-command">搜尋</button><button type="button" data-doc-action="library">文件</button><button type="button" data-m-action="add">＋新增</button><button type="button" data-m-action="menu">更多</button>`;
  document.querySelector('.command-bar').append(bar);
  const views = document.createElement('nav'); views.className = 'm-views'; views.setAttribute('aria-label', '全局檢視');
  views.innerHTML = ['mine:我的工作', 'tree:案件', 'canvas:拓樸圖', 'list:時間軸'].map(item => { const [id, name] = item.split(':'); return `<button type="button" data-m-view="${id}" aria-pressed="false">${name}</button>`; }).join('');
  workspace.prepend(views);
  const controls = document.createElement('div'); controls.className = 'm-map-controls';
  controls.innerHTML = `<button type="button" data-action="fit">顯示全圖</button><details><summary>工具</summary><div><button type="button" data-action="zoom-in">＋ 放大</button><button type="button" data-action="zoom-out">− 縮小</button><button type="button" data-m-action="help">操作說明</button></div></details>`;
  mapView.append(controls);
  const menu = document.createElement('dialog'); menu.className = 'm-menu'; menu.setAttribute('aria-labelledby', 'm-menu-title'); document.body.append(menu);
  let returnFocus = null;
  function showMenu(title, content) {
    returnFocus = document.activeElement;
    menu.innerHTML = `<header><h2 id="m-menu-title" tabindex="-1" autofocus>${title}</h2><button type="button" data-m-close>關閉</button></header><div class="m-menu-body">${content}</div>`;
    menu.showModal(); menu.querySelector('h2').focus();
  }
  menu.addEventListener('close', () => {
    // A close event may arrive after the next sheet has already opened.
    if (!menu.open && !document.querySelector('dialog[open]') && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  // Close this sheet before an existing handler opens its contextual form.
  menu.addEventListener('click', event => { if (event.target.closest('button')) menu.close(); }, true);
  const item = (title, attr, description = '') => `<button type="button" ${attr}><strong>${title}</strong>${description ? `<small>${description}</small>` : ''}</button>`;
  function sync() {
    const mobile = compact.matches, project = uiState.surface === 'project', mode = presentation();
    document.documentElement.classList.toggle('m-layout', mobile);
    appFrame.classList.toggle('m-canvas', mobile && !project && mode === 'canvas');
    appFrame.classList.toggle('m-project', mobile && project);
    const back = bar.querySelector(".m-back");
    const current = project && uiState.projectTab === "board" && workspaceData[uiState.projectId]?.tasks.find(task => task.id === uiState.focusRecordId);
    if (current) {
      delete back.dataset.action;
      back.dataset.deliveryAction = "work-up";
      back.dataset.work = current.id;
      back.textContent = history.state?.fromWork?.timelineOrigin ? "← 回時間軸" : history.state?.fromWork?.listOrigin ? "← 回到清單" : "← 上一層";
      const parent = workspaceData[uiState.projectId].tasks.find(task => task.id === current.parentId);
      back.setAttribute("aria-label", history.state?.fromWork?.timelineOrigin ? "回時間軸" : history.state?.fromWork?.listOrigin ? projectRoomHeader.querySelector(".project-back")?.title || "回到清單項目" : parent ? "返回「" + parent.title + "」" : "返回案件工作");
    } else {
      delete back.dataset.deliveryAction; delete back.dataset.work; back.removeAttribute("aria-label");
      back.dataset.action = "leave-project"; back.textContent = "← 全局";
    }
    const select = bar.querySelector('select');
    const selected = uiState.focusProjectId || '';
    const options = `<option value="">全部案件</option>` + getPortfolioProjects().map(p => `<option value="${e(p.id)}">${e(p.name)}</option>`).join('');
    if (select.innerHTML !== options) select.innerHTML = options;
    select.value = selected;
    bar.querySelector('[data-m-action="add"]').textContent = project ? '＋記錄' : '新增案件';
    views.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mView === mode)));
    if (mobile) document.querySelectorAll('.d-board-card').forEach(card => card.draggable = false);
  }
  function paths() {
    if (!compact.matches) return;
    mobileOverview.querySelector('.d-portfolio-list > .d-help')?.remove();
    for (const section of mobileOverview.querySelectorAll('section[data-mobile-case]')) {
      const id = section.dataset.mobileCase, project = getProject(id), data = workspaceData[id];
      if (!project || !data) continue;
      if (uiState.focusProjectId && uiState.focusProjectId !== id) { section.remove(); continue; }
      const snapshot = getProjectSnapshot(project), totals = deliveryModel.summary(data);
      const details = document.createElement('details'); details.className = 'm-case'; details.dataset.mobileCase = id;
      details.style.setProperty('--project-color', project.color);
      details.open = openCases.has(id);
      const progress = [
        totals.direct.length && (totals.direct.length - totals.incomplete.length) + "/" + totals.direct.length + " 項必要工作已完成",
        data.deadlineDate && "預計交付 " + data.deadlineDate
      ].filter(Boolean).join(" · ");
      const alerts = [
        totals.issues.length && totals.issues.length + " 個待解決問題",
        totals.overdue.length && totals.overdue.length + " 項工作逾期"
      ].filter(Boolean).join(" · ");
      details.innerHTML = `<summary><strong>${e(project.name)}</strong><span>${e(snapshot.state)}</span>${progress ? `<small>${e(progress)}</small>` : ""}${alerts ? `<small class="m-case-signals">${alerts}</small>` : ""}</summary><div class="m-case-works"></div>`;
      const body = details.querySelector('.m-case-works');
      const link = section.querySelector('.d-project-link');
      if (link) { link.innerHTML = `進入案件 ↗`; body.append(link); }
      for (const child of [...section.querySelectorAll(':scope > .d-tree-item')]) body.append(child);
      if (!body.querySelector('.d-tree-item')) body.insertAdjacentHTML('beforeend', '<p class="d-help">尚未安排工作。</p>');
      if (data.goal.title && data.goal.title !== project.name) body.insertAdjacentHTML('afterbegin', `<p class="d-help">交付目標：${e(data.goal.title)}</p>`);
      details.addEventListener('toggle', () => { if (details.open) openCases.add(id); else openCases.delete(id); });
      section.replaceWith(details);
    }
  }
  function compactRoom() {
    if (!compact.matches || uiState.surface !== 'project') return;
    const header = projectRoomHeader, copy = header.querySelector('.project-heading-copy');
    if (projectRoom.classList.contains("reading-work") || !copy || header.querySelector('.m-project-info')) return;
    const details = document.createElement('details'); details.className = 'm-project-info';
    details.innerHTML = '<summary>案件資訊⌄</summary><div class="m-project-facts"></div>';
    const facts = details.querySelector('div');
    copy.querySelectorAll('p:not(.project-breadcrumb), .w-project-tools').forEach(el => facts.append(el));
    const status = header.querySelector('.project-heading-status'); if (status) facts.append(status);
    header.append(details);
    sync();
  }
  const renderPaths = renderMobileOverview;
  renderMobileOverview = function(...args) { const result = renderPaths(...args); paths(); return result; };
  const renderRoom = renderProjectRoom;
  renderProjectRoom = function(...args) { const result = renderRoom(...args); compactRoom(); sync(); return result; };
  window.mobileWorkspace = { presentation, sync };
  bar.querySelector('select').addEventListener('change', event => {
    const id = event.target.value;
    if (id) { openCases.add(id); if (uiState.focusProjectId !== id) focusProject(id); }
    else { uiState.focusProjectId = null; uiState.mode = 'portfolio'; renderTopology(); renderMobileOverview(); renderList(); if (!mapView.hidden) fitMap(); }
    sync();
  });
  document.addEventListener('click', event => {
    const viewButton = event.target.closest('[data-m-view]');
    if (viewButton) {
      viewScroll[presentation()] = window.scrollY;
      chosenView = viewButton.dataset.mView;
      setView(['mine', 'list'].includes(chosenView) ? chosenView : 'map');
      requestAnimationFrame(() => window.scrollTo({ top: chosenView === 'canvas' ? 0 : viewScroll[chosenView] || 0, behavior: 'instant' }));
      return;
    }
    const action = event.target.closest('[data-m-action]')?.dataset.mAction;
    if (action === 'menu') showMenu('工具與管理',
      item('優先處理', 'data-action="open-attention"', '期限、待回覆與需要處理的工作') +
      item('問題總覽', 'data-m-action="issues"') + item('案件與備份', 'data-workspace-action="manager"', '管理案件、封存、匯出與還原') +
      item('操作說明', 'data-m-action="help"') + '<a class="d-action" href="./glossary.html" target="_blank" rel="noopener">工作用語辭典 ↗</a>');
    if (action === 'help') {
      controls.querySelector('details').open = false;
      showMenu('操作說明', '<p>展開案件可查看工作狀態，點工作名稱可查看詳情。</p><p>拓樸圖可單指拖曳、雙指縮放。點名稱開啟工作，點＋展開子工作。</p><p>「顯示全圖」會將全部案件縮放至畫面內。</p><p>時間軸依日期顯示各案件的進度。</p>');
    }
    if (action === 'add') {
      if (uiState.surface !== 'project') return workspaceManager.newProjectDialog();
      showMenu('新增案件紀錄', item('記錄進度', 'data-m-action="progress"') +
        item('新增行程', 'data-delivery-action="appointment" data-work="' + e(uiState.projectTab === 'board' ? uiState.focusRecordId || '' : '') + '"') +
        item('記錄問題', 'data-m-action="issue"') + item('新增工作', 'data-m-action="work"'));
    }
    if (action === 'issue') openCaptureDialog('issue');
    if (action === 'work') openCaptureDialog('task');
    if (action === 'progress') openCaptureDialog('note');
    if (action === 'issues') showMenu('待解決問題', getPortfolioProjects().map(project => {
      const count = workspaceData[project.id].issues.filter(issue => issue.status === 'open').length;
      return item(e(project.name), `data-open-project-tab="records" data-project-id="${e(project.id)}"`, `${count} 個待解決問題`);
    }).join('') || '<p>尚未建立案件。</p>');
    // The original handlers run first; reflect focus/issue filters afterwards.
    if (event.target.closest('[data-mode], [data-action="reset"]')) sync();
  });
  // Native modal dialogs make the background inert, but do not lock page scrolling.
  // Keep the page at its exact position throughout nested/successive dialogs.
  let lockedScroll = null, stickyPositions = [];
  const root = document.documentElement;
  function lockPage() {
    if (!compact.matches || lockedScroll) return;
    lockedScroll = { x: scrollX, y: scrollY };
    stickyPositions = [...document.querySelectorAll('.m-views, .project-tabs')]
      .filter(el => el.getClientRects().length && getComputedStyle(el).position === 'sticky')
      .map(el => ({ el, top: el.getBoundingClientRect().top, translate: el.style.translate }));
    root.style.setProperty('--m-page-top', `${-lockedScroll.y}px`);
    root.classList.add('m-modal-open');
    stickyPositions.forEach(({ el, top }) => { el.style.translate = `0 ${top - el.getBoundingClientRect().top}px`; });
  }
  function syncModalLock() {
    if (compact.matches && document.querySelector('dialog[open]')) return lockPage();
    if (!lockedScroll) return;
    const position = lockedScroll; lockedScroll = null;
    root.classList.remove('m-modal-open'); root.style.removeProperty('--m-page-top');
    stickyPositions.forEach(({ el, translate }) => { el.style.translate = translate; }); stickyPositions = [];
    window.scrollTo({ left: position.x, top: position.y, behavior: 'instant' });
  }
  const nativeShowModal = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function(...args) {
    lockPage();
    try { return nativeShowModal.apply(this, args); }
    finally { syncModalLock(); }
  };
  new MutationObserver(syncModalLock).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'], childList: true });
  // Also contain gestures on older mobile browsers without overscroll containment.
  let touchY = null;
  document.addEventListener('touchstart', event => { touchY = event.touches.length === 1 ? event.touches[0].clientY : null; }, { passive: true });
  document.addEventListener('touchmove', event => {
    if (!lockedScroll || touchY === null || event.touches.length !== 1) return;
    const y = event.touches[0].clientY, delta = touchY - y; touchY = y;
    const dialog = event.target.closest?.('dialog[open]');
    if (dialog) {
      for (let el = event.target; el && dialog.contains(el); el = el.parentElement) {
        const style = getComputedStyle(el);
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1 &&
          ((delta > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (delta < 0 && el.scrollTop > 0))) return;
      }
    }
    if (event.cancelable) event.preventDefault();
  }, { passive: false });
  compact.addEventListener('change', syncModalLock);
  function visualSize() {
    const viewport = window.visualViewport;
    document.documentElement.style.setProperty('--m-visible-height', `${viewport?.height || innerHeight}px`);
    document.documentElement.style.setProperty('--m-visible-top', `${viewport?.offsetTop || 0}px`);
  }
  window.visualViewport?.addEventListener('resize', visualSize);
  window.visualViewport?.addEventListener('scroll', visualSize);
  window.addEventListener('resize', () => {
    visualSize(); sync();
    if (uiState.surface === 'project') {
      // Re-render only at the compact/desktop boundary, not on keyboard resize.
      if (lastPresentation !== compact.matches) renderProjectRoom();
    }
    lastPresentation = compact.matches;
  });
  compact.addEventListener('change', () => { sync(); if (uiState.surface === 'project') renderProjectRoom(); });
  visualSize(); sync(); lastPresentation = compact.matches;
  if (uiState.surface === 'project') renderProjectRoom();
  else setView(uiState.view, { persistPreference: false });
})();
