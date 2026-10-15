import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCanvasPdf } from '../src/file-loader.js';

test('loader refuses non-PDF metadata without requesting contents', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ filename: 'notes.docx' }); };
  try { await assert.rejects(loadCanvasPdf('123'), /not a PDF/); assert.equal(calls, 1); }
  finally { globalThis.fetch = original; }
});

test('loader rejects arbitrary file host and successful HTML response', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ filename: 'notes.pdf', url: 'https://evil.example/private.pdf' });
  try {
    await assert.rejects(loadCanvasPdf('123'), /does not support/);
    let calls = 0;
    globalThis.fetch = async () => ++calls === 1 ? Response.json({ filename: 'notes.pdf', url: 'https://utah.instructure.com/files/123/download' }) : new Response('<html>login</html>');
    await assert.rejects(loadCanvasPdf('123'), /did not return PDF/);
  } finally { globalThis.fetch = original; }
});

test('loader returns original bytes and uses credentialed requests', async () => {
  const original = globalThis.fetch;
  const bytes = new TextEncoder().encode('%PDF-1.4\nfixture');
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.credentials, 'include');
    return ++calls === 1 ? Response.json({ filename: 'notes.pdf', url: 'https://utah.instructure.com/files/123/download' }) : new Response(bytes);
  };
  try { const result = await loadCanvasPdf('123'); assert.deepEqual(result.bytes, bytes); assert.equal(result.filename, 'notes.pdf'); }
  finally { globalThis.fetch = original; }
});
