export function parsedPage(value, pageCount) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;
  const page = Number(text);
  return Number.isSafeInteger(page) && page >= 1 && page <= pageCount ? page : null;
}
export function pinchScaleFactor(deltaY, deltaMode = 0) {
  const pixels = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 300 : 1);
  return Math.exp(-Math.max(-100, Math.min(100, pixels)) * .01);
}

export function wireReaderControls({ viewer, eventBus, container, document: dom = document }) {
  const $ = id => dom.getElementById(id);
  let ready = false, timer;
  function updatePage() {
    $('pageNumber').value = String(viewer.currentPageNumber);
    $('previousPage').disabled = viewer.currentPageNumber <= 1;
    $('nextPage').disabled = viewer.currentPageNumber >= viewer.pagesCount;
  }
  function updateZoom() {
    $('zoomPercent').textContent = `${Math.round(viewer.currentScale * 100)}%`;
    const mode = viewer.currentScaleValue;
    $('fitMode').value = ['page-width','page-fit'].includes(mode) ? mode : 'custom';
  }
  eventBus.on('pagesinit', () => {
    ready = true; $('readingControls').disabled = false; $('layoutControls').disabled = false;
    $('pageCount').textContent = `/ ${viewer.pagesCount}`; updatePage(); updateZoom();
  });
  eventBus.on('pagechanging', updatePage); eventBus.on('scalechanging', updateZoom);
  $('previousPage').addEventListener('click', () => { if (viewer.currentPageNumber > 1) viewer.currentPageNumber--; });
  $('nextPage').addEventListener('click', () => { if (viewer.currentPageNumber < viewer.pagesCount) viewer.currentPageNumber++; });
  function go() { const page = parsedPage($('pageNumber').value, viewer.pagesCount); if (page !== null) viewer.currentPageNumber = page; updatePage(); }
  $('pageNumber').addEventListener('keydown', e => { if (e.key === 'Enter') { go(); container.focus(); } });
  $('pageNumber').addEventListener('change', go);
  $('zoomIn').addEventListener('click', () => viewer.increaseScale());
  $('zoomOut').addEventListener('click', () => viewer.decreaseScale());
  $('fitMode').addEventListener('change', e => { if (e.target.value === '100') viewer.currentScale = 1; else if (e.target.value !== 'custom') viewer.currentScaleValue = e.target.value; });
  for (const [id,mode] of [['onePage',0],['twoPages',1]]) $(''+id).addEventListener('click', () => {
    viewer.spreadMode = mode;
    $('onePage').setAttribute('aria-pressed', String(mode === 0)); $('twoPages').setAttribute('aria-pressed', String(mode === 1));
  });
  function search(again = false, previous = false) {
    clearTimeout(timer);
    eventBus.dispatch('find', { source: $('findBar'), type: again ? 'again' : '', query: $('findInput').value,
      phraseSearch: true, caseSensitive: false, entireWord: false, highlightAll: true, findPrevious: previous, matchDiacritics: false });
    if (!$('findInput').value) $('findCount').textContent = '';
  }
  function showFind() { if (ready) { $('findBar').hidden = false; $('findInput').focus(); $('findInput').select(); } }
  function closeFind() { $('findBar').hidden = true; eventBus.dispatch('findbarclose', { source: $('findBar') }); container.focus(); }
  $('findButton').addEventListener('click', showFind); $('closeFind').addEventListener('click', closeFind);
  $('findNext').addEventListener('click', () => search(true)); $('findPrevious').addEventListener('click', () => search(true,true));
  $('findInput').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => search(),120); });
  $('findInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); search(true,e.shiftKey); } });
  function count({ matchesCount }) { if (!$('findInput').value) return; const { current = 0, total = 0 } = matchesCount || {}; $('findCount').textContent = total ? `${current} / ${total}` : 'No matches'; }
  eventBus.on('updatefindmatchescount', count);
  eventBus.on('updatefindcontrolstate', e => { if (!$('findInput').value) return; if (e.state === 3) $('findCount').textContent = 'Searching…'; else count(e); });
  dom.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); showFind(); }
    else if (ready && (e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); viewer.currentScale = 1; }
    else if (e.key === 'Escape' && !$('findBar').hidden) { e.preventDefault(); closeFind(); }
  });
  container.addEventListener('wheel', e => { if (!ready || !e.ctrlKey) return; e.preventDefault(); viewer.updateScale({ scaleFactor: pinchScaleFactor(e.deltaY,e.deltaMode), drawingDelay:120, origin:[e.clientX,e.clientY] }); }, { passive:false });
  return { setLoading() { ready = false; $('readingControls').disabled = true; $('layoutControls').disabled = true; $('findBar').hidden = true; clearTimeout(timer); } };
}
