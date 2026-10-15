(() => {
  const origin = 'https://utah.instructure.com';
  const onCoursePage = () => /^\/courses\//.test(new URL(location.href).pathname);
  if (!onCoursePage()) return;
  const metadata = new Map();

  function fileId(anchor) {
    try {
      const url = new URL(anchor.href, location.href);
      if (url.origin !== origin) return null;
      const match = url.pathname.match(/^\/(?:courses\/\d+\/)?files\/(\d+)(?:\/(?:download|preview))?\/?$/);
      if (match) return match[1];
      if (/^\/courses\/\d+\/files(?:\/folder(?:\/.*)?)?\/?$/.test(url.pathname) && /^\d+$/.test(url.searchParams.get('preview') || '')) return url.searchParams.get('preview');
    } catch { /* Not a supported file link. */ }
    return null;
  }

  function isExplicitDownload(anchor) {
    return anchor.hasAttribute('download') ||
      /^(download|download file)$/i.test((anchor.getAttribute('aria-label') || anchor.textContent || '').trim()) ||
      anchor.matches('.file_download_btn, .download_link');
  }

  async function lookup(id) {
    if (!metadata.has(id)) {
      metadata.set(id, fetch(`${origin}/api/v1/files/${id}`, { credentials: 'include' })
        .then(async response => response.ok && response.headers.get('content-type')?.includes('json') ? response.json() : null)
        .then(file => file ? file['content-type'] === 'application/pdf' || /\.pdf$/i.test(file.filename || file.display_name || '') : null)
        .catch(() => null));
    }
    return metadata.get(id);
  }

  function evidence(anchor) {
    return /\.pdf(?:\s|$)/i.test([anchor.textContent, anchor.getAttribute('title'), anchor.getAttribute('aria-label'), anchor.closest('[role="row"], tr')?.textContent].filter(Boolean).join(' ')) ||
      anchor.getAttribute('type') === 'application/pdf' || Boolean(anchor.querySelector('.icon-pdf'));
  }

  function prepare(anchor) {
    if (!onCoursePage()) return;
    const id = fileId(anchor);
    if (!id || isExplicitDownload(anchor)) return;
    if (evidence(anchor)) anchor.dataset.canvasPdfTabs = 'pdf';
    if (!anchor.dataset.canvasPdfTabs) {
      anchor.dataset.canvasPdfTabs = 'checking';
      lookup(id).then(pdf => { anchor.dataset.canvasPdfTabs = pdf === true ? 'pdf' : pdf === false ? 'other' : 'unknown'; });
    }
  }

  // Inspect only the link the user approaches, not the entire dashboard on every mutation.
  document.addEventListener('pointerover', event => { const a = event.target.closest?.('a[href]'); if (a) prepare(a); }, true);
  document.addEventListener('focusin', event => { const a = event.target.closest?.('a[href]'); if (a) prepare(a); }, true);

  document.addEventListener('click', event => {
    if (!onCoursePage()) return;
    if (event.button !== 0 || event.shiftKey || event.altKey || event.metaKey) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || isExplicitDownload(anchor)) return;
    const id = fileId(anchor);
    if (!id || !(evidence(anchor) || anchor.dataset.canvasPdfTabs === 'pdf')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    chrome.runtime.sendMessage({ type: 'OPEN_PDF', fileId: id, background: event.ctrlKey }).then(result => {
      if (!result?.ok) showError(anchor);
    }).catch(() => showError(anchor));
  }, true);

  function showError(anchor) {
    const status = document.createElement('span');
    status.setAttribute('role', 'alert');
    status.textContent = ' PDF Tabs could not open this file. Reload Canvas and try again.';
    anchor.after(status);
  }
})();
