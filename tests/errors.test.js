import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCanvasPdf } from '../src/file-loader.js';

for (const [profileStatus,expectedKind] of [[200,'access'],[401,'session'],[403,'access']]) {
  test(`file denial with profile HTTP ${profileStatus} is classified as ${expectedKind}`, async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async url => url.endsWith('/profile') ? new Response(null,{status:profileStatus}) : new Response(null,{status:403});
    try { await assert.rejects(loadCanvasPdf('123'), error=>error.kind===expectedKind); }
    finally { globalThis.fetch=original; }
  });
}

test('a network failure during session check does not claim expired login', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => { if (url.endsWith('/profile')) throw new TypeError('network'); return new Response(null,{status:404}); };
  try { await assert.rejects(loadCanvasPdf('123'), error=>error.kind==='access'); }
  finally { globalThis.fetch=original; }
});
