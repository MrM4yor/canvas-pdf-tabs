import test from 'node:test';
import assert from 'node:assert/strict';
import { canvasUrl, fileIdFromUrl, validFileId, validOpenMessage, pdfMetadata, hasPdfHeader } from '../src/shared/contracts.js';

test('accept only Utah Canvas file links and valid file IDs', () => {
  assert.equal(fileIdFromUrl('https://utah.instructure.com/courses/123/files/456/download?download_frd=1'), '456');
  assert.equal(fileIdFromUrl('https://utah.instructure.com/courses/123/files?preview=456'), '456');
  assert.equal(fileIdFromUrl('https://utah.instructure.com/courses/123/files/folder/Project?preview=456'), '456');
  assert.equal(fileIdFromUrl('https://utah.instructure.com/files/456/preview'), '456');
  for (const url of ['https://evil.example/files/456', 'https://utah.instructure.com.evil.example/files/456', 'https://utah.instructure.com/courses/123/assignments/456']) assert.equal(fileIdFromUrl(url), null);
  assert.equal(canvasUrl('https://name:password@utah.instructure.com/files/1'), null);
  for (const id of ['-1', 'abc', '0', 123, '../1', '1'.repeat(21)]) assert.equal(validFileId(id), false);
});

test('open-file contract does not accept arbitrary URL messages', () => {
  assert.equal(validOpenMessage({ type: 'OPEN_PDF', fileId: '123', background: true }), true);
  assert.equal(validOpenMessage({ type: 'OPEN_PDF', fileId: 'https://evil.example/', background: false }), false);
  assert.equal(validOpenMessage({ type: 'OPEN_PDF', fileId: '123', background: 'false' }), false);
});

test('recognize PDF metadata but reject HTML returned as a successful response', () => {
  assert.equal(pdfMetadata({ 'content-type': 'application/pdf' }), true);
  assert.equal(pdfMetadata({ filename: 'Assignment.PDF' }), true);
  assert.equal(pdfMetadata({ filename: 'report.docx', 'content-type': 'application/msword' }), false);
  assert.equal(hasPdfHeader(new TextEncoder().encode('%PDF-1.4\n')), true);
  assert.equal(hasPdfHeader(new TextEncoder().encode('<html>Sign in</html>')), false);
});
