// Keep startup failures visible even when a module import or PDFViewer constructor fails.
function fail() {
  document.getElementById('status').hidden = true;
  document.getElementById('error').hidden = false;
  document.getElementById('errorText').textContent = 'The reader could not start. Reload the extension and refresh Canvas. If it happens again, report the error shown in Chrome Extensions.';
}
window.addEventListener('error', fail);
window.addEventListener('unhandledrejection', fail);
const timer = setTimeout(() => {
  if (!document.getElementById('status').hidden) {
    document.getElementById('status').textContent = 'Still opening… If this continues, reload the extension and retry from Canvas.';
  }
}, 20000);
import('./viewer.js').catch(fail).finally(() => clearTimeout(timer));
