import * as pdfjsLib from '../../vendor/pdfjs/build/pdf.mjs';
import { PDFViewer, EventBus, PDFLinkService, PDFFindController } from '../../vendor/pdfjs/web/pdf_viewer.mjs';
import { loadCanvasPdf } from '../file-loader.js';
import { wireReaderControls } from './reader-controls.js';
import { wireTheme, safeFilename } from './viewer-extras.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('vendor/pdfjs/build/pdf.worker.mjs');
const eventBus = new EventBus();
const linkService = new PDFLinkService({ eventBus, externalLinkTarget: 2, externalLinkRel: 'noopener noreferrer nofollow' });
const findController = new PDFFindController({ eventBus, linkService });
const container = document.getElementById('viewerContainer');
const viewer = new PDFViewer({ container, eventBus, linkService, findController, annotationEditorMode: pdfjsLib.AnnotationEditorType.DISABLE, annotationMode: pdfjsLib.AnnotationMode.ENABLE });
linkService.setViewer(viewer);
const controls = wireReaderControls({ viewer, eventBus, container });
const requestId = new URL(location.href).searchParams.get('request');
const status = document.getElementById('status');
let task, originalBlob, originalName;
wireTheme({ select: document.getElementById('theme') });

eventBus.on('pagesinit', () => { viewer.currentScale = 1; });
eventBus.on('pagerendered', () => { status.hidden = true; });

async function open() {
  status.hidden = false;
  status.textContent = 'Opening your Canvas PDF…';
  originalBlob = null;
  document.getElementById('download').disabled = true;
  document.getElementById('error').hidden = true;
  try {
    controls.setLoading();
    viewer.setDocument(null);
    linkService.setDocument(null);
    findController.setDocument(null);
    await task?.destroy();
    let data;
    if (new URL(location.href).searchParams.has('fixture')) {
      data = { bytes: new Uint8Array(await (await fetch('../../tests/fixtures/reading-test.pdf')).arrayBuffer()), filename: 'Synthetic reading test.pdf' };
    } else {
      const result = await chrome.runtime.sendMessage({ type: 'GET_REQUEST', requestId });
      if (!result?.ok) throw new Error(result?.error || 'Open this PDF from Canvas again.');
      data = await loadCanvasPdf(result.descriptor.fileId);
    }
    // PDF.js transfers the Uint8Array to its worker; preserve original bytes before that transfer.
    const blob = new Blob([data.bytes], { type: 'application/pdf' });
    document.getElementById('filename').textContent = data.filename;
    document.getElementById('filename').title = data.filename;
    document.title = `${data.filename} · Canvas PDF Tabs`;
    task = pdfjsLib.getDocument({ data: data.bytes, isEvalSupported: false,
      cMapUrl: chrome.runtime.getURL('vendor/pdfjs/cmaps/'), cMapPacked: true,
      standardFontDataUrl: chrome.runtime.getURL('vendor/pdfjs/standard_fonts/'),
      wasmUrl: chrome.runtime.getURL('vendor/pdfjs/wasm/') });
    const doc = await task.promise;
    originalBlob = blob;
    originalName = safeFilename(data.filename);
    document.getElementById('download').disabled = false;
    linkService.setDocument(doc);
    findController.setDocument(doc);
    viewer.setDocument(doc);
  } catch (error) {
    status.hidden = true;
    document.getElementById('errorText').textContent = error.name === 'TimeoutError' ? 'The request timed out. Retry or return to Canvas.' : error.message;
    document.getElementById('error').hidden = false;
    if (error.kind === 'session') {
      await chrome.runtime.sendMessage({ type: 'SESSION_EXPIRED', requestId }).catch(() => {});
    }
  }
}
document.getElementById('download').addEventListener('click', () => {
  if (!originalBlob) return;
  const url = URL.createObjectURL(originalBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = originalName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
});
document.getElementById('retry').addEventListener('click', open);
document.getElementById('back').addEventListener('click', async () => {
  const result = await chrome.runtime.sendMessage({ type: 'BACK_TO_CANVAS', requestId });
  if (!result?.ok) window.open('https://utah.instructure.com/', '_blank', 'noopener');
});
open();
