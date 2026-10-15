export const CANVAS = 'https://utah.instructure.com';

export function canvasUrl(value) {
  try { const url = new URL(value); return url.origin === CANVAS && !url.username && !url.password ? url : null; }
  catch { return null; }
}

export function validFileId(value) {
  return typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value);
}

export function fileIdFromUrl(value) {
  const url = canvasUrl(value);
  if (!url) return null;
  const match = url.pathname.match(/^\/(?:courses\/\d+\/)?files\/(\d+)(?:\/(?:download|preview))?\/?$/);
  if (match && validFileId(match[1])) return match[1];
  const preview = url.searchParams.get('preview');
  return /^\/courses\/\d+\/files(?:\/folder(?:\/.*)?)?\/?$/.test(url.pathname) && validFileId(preview) ? preview : null;
}

export function validOpenMessage(message) {
  return message?.type === 'OPEN_PDF' && validFileId(message.fileId) &&
    typeof message.background === 'boolean';
}

export function pdfMetadata(file) {
  return file && (file['content-type'] === 'application/pdf' ||
    /\.pdf$/i.test(file.filename || file.display_name || ''));
}

export function hasPdfHeader(bytes) {
  return new TextDecoder().decode(bytes.subarray(0, 1024)).includes('%PDF-');
}
