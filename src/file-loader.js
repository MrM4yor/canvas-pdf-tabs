import { CANVAS, canvasUrl, validFileId, pdfMetadata, hasPdfHeader } from './shared/contracts.js';

export class FileError extends Error {
  constructor(message, kind = 'file') { super(message); this.kind = kind; }
}

export async function loadCanvasPdf(fileId) {
  if (!validFileId(fileId)) throw new FileError('The Canvas file ID is invalid.');
  const signal = AbortSignal.timeout(60000);
  const metaResponse = await fetch(`${CANVAS}/api/v1/files/${fileId}`, { credentials: 'include', signal });
  if (!metaResponse.ok || !metaResponse.headers.get('content-type')?.includes('json')) {
    throw new FileError('Canvas could not provide this file. Check that you are signed in and have access, then retry.', 'access');
  }
  const meta = await metaResponse.json();
  if (!pdfMetadata(meta)) throw new FileError('This Canvas file is not a PDF.');
  const url = canvasUrl(meta.url);
  if (!url || !/^\/(?:courses\/\d+\/)?files\/\d+\//.test(url.pathname)) {
    throw new FileError('Canvas returned a file location this first version does not support. Return to Canvas and report this access issue.');
  }
  const response = await fetch(url.href, { credentials: 'include', signal });
  if (!response.ok) throw new FileError(`Canvas could not load the PDF (HTTP ${response.status}). Retry or return to Canvas.`, 'access');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!hasPdfHeader(bytes)) throw new FileError('Canvas did not return PDF contents. Your session may have expired, or access may be restricted.', 'access');
  return { bytes, filename: meta.display_name || meta.filename || 'Canvas PDF' };
}
