import { CANVAS, canvasUrl, validFileId, pdfMetadata, hasPdfHeader } from './shared/contracts.js';

export class FileError extends Error {
  constructor(message, kind = 'file') { super(message); this.kind = kind; }
}

async function accessError(message) {
  // A forbidden/missing file alone does not mean the whole Canvas session expired.
  try {
    const profile = await fetch(`${CANVAS}/api/v1/users/self/profile`, { credentials:'include', signal:AbortSignal.timeout(10000) });
    if (profile.status === 401) return new FileError('Your Canvas session has expired. Sign in again in Canvas, then click the PDF again.', 'session');
  } catch { /* Unknown session state: leave a recoverable error instead of refreshing Canvas. */ }
  return new FileError(message, 'access');
}

export async function loadCanvasPdf(fileId) {
  if (!validFileId(fileId)) throw new FileError('The Canvas file ID is invalid.');
  const signal = AbortSignal.timeout(60000);
  const metaResponse = await fetch(`${CANVAS}/api/v1/files/${fileId}`, { credentials: 'include', signal });
  if (!metaResponse.ok || !metaResponse.headers.get('content-type')?.includes('json')) {
    throw await accessError('Canvas could not provide this file. Check that you are signed in and have access, then retry.');
  }
  const meta = await metaResponse.json();
  if (!pdfMetadata(meta)) throw new FileError('This Canvas file is not a PDF.');
  const url = canvasUrl(meta.url);
  if (!url || !/^\/(?:courses\/\d+\/)?files\/\d+\//.test(url.pathname)) {
    throw new FileError('Canvas returned a file location this first version does not support. Return to Canvas and report this access issue.');
  }
  const response = await fetch(url.href, { credentials: 'include', signal });
  if (!response.ok) throw await accessError(`Canvas could not load the PDF (HTTP ${response.status}). Retry or return to Canvas.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!hasPdfHeader(bytes)) throw await accessError('Canvas did not return PDF contents. Your session may have expired, or access may be restricted.');
  return { bytes, filename: meta.display_name || meta.filename || 'Canvas PDF' };
}
