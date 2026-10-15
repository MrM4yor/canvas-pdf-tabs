import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../src/canvas-listener.js', import.meta.url), 'utf8');

function harness(href = 'https://utah.instructure.com/courses/123/files') {
  const handlers = {}, messages = [];
  let fetches = 0;
  vm.runInNewContext(source, {
    URL, Map, location: { href },
    document: { addEventListener: (name, handler) => { handlers[name] = handler; } },
    fetch: async () => { fetches++; throw new Error('No background lookup expected.'); },
    chrome: { runtime: { sendMessage: async message => { messages.push(message); return { ok: true }; } } }
  });
  return { handlers, messages, fetches: () => fetches };
}

test('actual content script intercepts a PDF preview inside a Files folder', async () => {
  const { handlers, messages } = harness();
  for (const ctrlKey of [false, true]) {
    let prevented = false, stopped = false;
    const anchor = {
      href: 'https://utah.instructure.com/courses/123/files/folder/Project?preview=456',
      textContent: 'Available parts in mech lab.pdf', dataset: {},
      hasAttribute: () => false, getAttribute: () => null, matches: () => false,
      closest: () => null, querySelector: () => null
    };
    handlers.click({ button: 0, ctrlKey, target: { closest: () => anchor },
      preventDefault: () => { prevented = true; }, stopImmediatePropagation: () => { stopped = true; } });
    assert.equal(prevented, true); assert.equal(stopped, true);
    assert.equal(messages.at(-1).fileId, '456');
    assert.equal(messages.at(-1).background, ctrlKey);
  }
});

test('listener installation performs no page scan or metadata requests', () => {
  const app = harness();
  assert.equal(app.fetches(), 0);
  assert.deepEqual(Object.keys(app.handlers).sort(), ['click', 'focusin', 'pointerover']);
});

test('PDF.js viewer receives its required DIV container and guarded bootstrap', async () => {
  const html = await readFile(new URL('../src/viewer/viewer.html', import.meta.url), 'utf8');
  assert.match(html, /<div id="viewerContainer"/);
  assert.match(html, /src="bootstrap\.js"/);
});

test('dashboard has no listeners or requests and is excluded from manifest matching', async () => {
  for (const path of ['/', '/?dashboard=1', '/dashboard', '/dashboard/']) {
    const app = harness(`https://utah.instructure.com${path}`);
    assert.deepEqual(Object.keys(app.handlers), []);
    assert.equal(app.fetches(), 0);
  }
  const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://utah.instructure.com/courses/*']);
});
