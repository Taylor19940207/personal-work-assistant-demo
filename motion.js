/* Presentation only: no deferred mutations, duplicate DOM, or pointer locks. */
(() => {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const easing = "cubic-bezier(.22,.7,.24,1)";
  const running = new Set();
  const slots = new WeakMap();
  let finishMap = null;
  const visible = element => element?.isConnected && element.getClientRects().length > 0;
  function animate(element, frames, duration = 180) {
    if (!visible(element) || preference.matches || !element.animate) return;
    slots.get(element)?.cancel();
    const animation = element.animate(frames, { duration, easing });
    slots.set(element, animation); running.add(animation);
    const cleanup = () => { running.delete(animation); if (slots.get(element) === animation) slots.delete(element); };
    animation.addEventListener("finish", cleanup, { once: true });
    animation.addEventListener("cancel", cleanup, { once: true });
    return animation;
  }
  function enter(element, direction = 0) {
    if (matchMedia("(pointer: coarse)").matches) {
      animate(element, [{ opacity: .45 }, { opacity: 1 }]);
      return;
    }
    animate(element, [
      { opacity: .45, translate: direction ? `${direction * 8}px 0` : "0 6px" },
      { opacity: 1, translate: "0 0" }
    ]);
  }
  function stopMap() { finishMap?.(); slots.get(mapStage)?.cancel(); }

  // Capture actual on-screen positions, including the user's pan and zoom.
  function captureMap() {
    stopMap();
    if (preference.matches || !visible(mapStage) || mapView.hidden) return null;
    const matrix = mapStage.querySelector("svg")?.getScreenCTM();
    if (!matrix) return null;
    return {
      nodes: new Map([...mapStage.querySelectorAll("[data-motion-key]")].map(node => [node.dataset.motionKey, node.getBoundingClientRect()])),
      edges: new Map([...mapStage.querySelectorAll("[data-motion-edge]")].map(path => {
        const values = path.getAttribute("d").match(/-?\d+(?:\.\d+)?/g).map(Number);
        return [path.dataset.motionEdge, values.map((value, index) => value * matrix.a + (index % 2 ? matrix.f : matrix.e))];
      }))
    };
  }
  function settleMap(before) {
    if (!before || preference.matches || mapView.hidden) return;
    const matrix = mapStage.querySelector("svg")?.getScreenCTM();
    if (!matrix) return;
    const animations = [];
    for (const node of mapStage.querySelectorAll("[data-motion-key]")) {
      const old = before.nodes.get(node.dataset.motionKey), rect = node.getBoundingClientRect();
      if (old) {
        const x = (old.left - rect.left) / matrix.a, y = (old.top - rect.top) / matrix.a;
        if (Math.abs(x) + Math.abs(y) > .5) animations.push(animate(node, [{ translate: `${x}px ${y}px` }, { translate: "0 0" }], 240));
      } else animations.push(animate(node, [{ opacity: 0 }, { opacity: getComputedStyle(node).opacity }], 200));
    }
    // Edges travel with their nodes, instead of briefly pointing to empty space.
    const edges = [];
    for (const path of mapStage.querySelectorAll("[data-motion-edge]")) {
      const old = before.edges.get(path.dataset.motionEdge), d = path.getAttribute("d");
      if (old) {
        const end = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
        const start = old.map((value, i) => (value - (i % 2 ? matrix.f : matrix.e)) / matrix.a);
        edges.push({ path, d, start, end });
      } else animations.push(animate(path, [{ opacity: 0 }, { opacity: 1 }], 240));
    }
    let frame, began;
    const clock = new Animation(new KeyframeEffect(null, [], { duration: 240, easing, fill: "both" }), document.timeline);
    clock.play();
    const restore = () => {
      cancelAnimationFrame(frame);
      clock.cancel();
      edges.forEach(({ path, d }) => path.setAttribute("d", d));
      animations.forEach(animation => animation?.cancel());
      if (finishMap === restore) finishMap = null;
    };
    finishMap = restore;
    // Use the same easing as node animations via a detached WAAPI timing clock.
    function tick(time) {
      began ??= time;
      const progress = clock.effect.getComputedTiming().progress ?? 0;
      edges.forEach(({ path, start, end }) => {
        const p = end.map((value, i) => start[i] + (value - start[i]) * progress);
        path.setAttribute("d", `M${p[0]} ${p[1]} C${p[2]} ${p[3]},${p[4]} ${p[5]},${p[6]} ${p[7]}`);
      });
      if (time - began < 240) frame = requestAnimationFrame(tick);
      else restore();
    }
    tick(performance.now());
  }
  function captureRows(surface, selector = "[data-work-row]") {
    if (preference.matches || !visible(surface)) return null;
    return new Map([...surface.querySelectorAll(selector)].map(row => [row.dataset.workRow || row.dataset.taskId, row.getBoundingClientRect()]));
  }
  function settleRows(surface, before, selector = "[data-work-row]") {
    if (!before || !visible(surface)) return;
    for (const row of surface.querySelectorAll(selector)) {
      const old = before.get(row.dataset.workRow || row.dataset.taskId), rect = row.getBoundingClientRect();
      if (!old) { enter(row); continue; }
      const x = (old.left - rect.left) / appLayoutScale(), y = (old.top - rect.top) / appLayoutScale();
      if (Math.abs(x) + Math.abs(y) > .5) animate(row, [{ translate: `${x}px ${y}px` }, { translate: "0 0" }], 200);
    }
  }
  window.interfaceMotion = { enter, captureMap, settleMap, captureRows, settleRows };

  // Navigate between contexts, but never replay an entrance on a save/re-render.
  const roomKey = () => `${uiState.projectId}/${uiState.projectTab}/${uiState.projectTab === "board" ? uiState.focusRecordId || "" : ""}`;
  let lastRoom = uiState.surface === "project" ? roomKey() : "";
  let lastTab = uiState.projectTab;
  const tabs = ["overview", "board", "records", "files", "activity"];
  const renderRoom = renderProjectRoom;
  renderProjectRoom = function(...args) {
    const key = roomKey(), previousTab = lastTab;
    const cards = lastRoom === key ? captureRows(projectRoomContent, ".d-board-card") : null;
    const result = renderRoom(...args);
    if (lastRoom !== key) enter(projectRoomContent.firstElementChild, Math.sign(tabs.indexOf(uiState.projectTab) - tabs.indexOf(previousTab)));
    else settleRows(projectRoomContent, cards, ".d-board-card");
    lastRoom = key; lastTab = uiState.projectTab;
    return result;
  };
  const portfolio = showPortfolioSurface;
  showPortfolioSurface = function(...args) {
    const result = portfolio(...args); lastRoom = "";
    enter(mapView.hidden ? mobileOverview.hidden ? listView : mobileOverview : mapView);
    return result;
  };
  const view = setView;
  setView = function(...args) {
    const before = [mapView.hidden, mobileOverview.hidden, listView.hidden].join();
    const result = view(...args);
    if (uiState.surface !== "project" && before !== [mapView.hidden, mobileOverview.hidden, listView.hidden].join()) {
      enter(mapView.hidden ? mobileOverview.hidden ? listView : mobileOverview : mapView);
    }
    return result;
  };
  // Only discrete camera commands glide. Pointer/wheel manipulation stays direct.
  let cameraDepth = 0;
  function camera(operation) {
    return function(...args) {
      if (cameraDepth) return operation(...args);
      const before = visible(mapStage) ? getComputedStyle(mapStage).transform : null;
      stopMap();
      let result;
      cameraDepth++;
      try { result = operation(...args); } finally { cameraDepth--; }
      const after = visible(mapStage) ? getComputedStyle(mapStage).transform : null;
      if (before && after && before !== after) animate(mapStage, [{ transform: before }, { transform: after }], 240);
      return result;
    };
  }
  fitMap = camera(fitMap);
  setZoom = camera(setZoom);
  focusProject = camera(focusProject);
  function takeCameraControl() {
    const current = slots.get(mapStage) ? new DOMMatrixReadOnly(getComputedStyle(mapStage).transform) : null;
    stopMap();
    if (current) {
      uiState.x = current.e; uiState.y = current.f; uiState.scale = current.a;
      applyTransform();
    }
  }
  // Capture phase transfers the visible camera position before the existing drag
  // or wheel handler calculates its next position, avoiding an interruption jump.
  mapViewport.addEventListener("pointerdown", takeCameraControl, { passive: true, capture: true });
  mapViewport.addEventListener("wheel", takeCameraControl, { passive: true, capture: true });

  // Switching documents is a contextual change; typing/searching is not.
  document.addEventListener("click", event => {
    const action = event.target.closest("[data-doc-action]")?.dataset.docAction;
    if (action === "select") enter(document.querySelector(".docs-detail"), 1);
    if (action === "list") enter(document.querySelector(".docs-browser"), -1);
  });
  preference.addEventListener("change", () => {
    if (!preference.matches) return;
    stopMap(); running.forEach(animation => animation.cancel());
  });
})();
