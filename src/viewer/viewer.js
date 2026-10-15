import * as pdfjsLib from '../../vendor/pdfjs/build/pdf.mjs';
import { PDFViewer, EventBus, PDFLinkService } from '../../vendor/pdfjs/web/pdf_viewer.mjs';
import { loadCanvasPdf } from '../file-loader.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdfjs/build/pdf.worker.mjs');
const eventBus = new EventBus();
const linkService = new PDFLinkService({ eventBus, externalLinkTarget: 2, externalLinkRel: 'noopener noreferrer nofollow' });
const viewer = new PDFViewer({ container: document.getElementById('viewerContainer'), eventBus, linkService });
linkService.setViewer(viewer);
const requestId = new URL(location.href).searchParams.get('request');
const status = document.getElementById('status');
let task;

eventBus.on('pagesinit', () => { viewer.currentScaleValue = 'page-width'; });
eventBus.on('pagerendered', () => { status.hidden = true; });

async function open() {
  status.hidden = false;
  document.getElementById('error').hidden = true;
  try {
    await task?.destroy();
    let data;
    if (new URL(location.href).searchParams.has('fixture')) {
      data = { bytes: new Uint8Array(await (await fetch('../../tests/fixtures/reading-test.pdf')).arrayBuffer()), filename: 'Synthetic reading test.pdf' };
    } else {
      const result = await chrome.runtime.sendMessage({ type: 'GET_REQUEST', requestId });
      if (!result?.ok) throw new Error(result?.error || 'Open this PDF from Canvas again.');
      data = await loadCanvasPdf(result.descriptor.fileId);
    }
    document.getElementById('filename').textContent = data.filename;
    document.getElementById('filename').title = data.filename;
    document.title = `${data.filename} · Canvas PDF Tabs`;
    task = pdfjsLib.getDocument({ data: data.bytes, isEvalSupported: false,
      cMapUrl: chrome.runtime.getURL('vendor/pdfjs/cmaps/'), cMapPacked: true,
      standardFontDataUrl: chrome.runtime.getURL('vendor/pdfjs/standard_fonts/'),
      wasmUrl: chrome.runtime.getURL('vendor/pdfjs/wasm/') });
    const doc = await task.promise;
    viewer.setDocument(doc);
    linkService.setDocument(doc);
    document.getElementById('pageCount').textContent = `${doc.numPages} pages`;
  } catch (error) {
    status.hidden = true;
    document.getElementById('errorText').textContent = error.name === 'TimeoutError' ? 'The request timed out. Retry or return to Canvas.' : error.message;
    document.getElementById('error').hidden = false;
  }
}
document.getElementById('retry').addEventListener('click', open);
document.getElementById('back').addEventListener('click', async () => {
  const result = await chrome.runtime.sendMessage({ type: 'BACK_TO_CANVAS', requestId });
  if (!result?.ok) window.open('https://utah.instructure.com/', '_blank', 'noopener');
});
open();
