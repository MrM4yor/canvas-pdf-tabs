import test from 'node:test';
import assert from 'node:assert/strict';
import { safeFilename, wireTheme } from '../src/viewer/viewer-extras.js';

test('download names preserve the PDF name without path/control characters', () => {
  assert.equal(safeFilename('Available Parts.pdf'),'Available Parts.pdf');
  assert.equal(safeFilename('../test:notes\u0000'),'.._test_notes_.pdf');
  assert.equal(safeFilename(''), 'Canvas PDF.pdf');
});

test('system theme follows the OS while explicit choices override it', () => {
  const callbacks = {};
  const select = { value:'system', addEventListener:(name,fn)=>callbacks.select=fn };
  const media = { matches:false, addEventListener:(name,fn)=>callbacks.media=fn };
  const root = { dataset:{} };
  wireTheme({select,media,root}); assert.equal(root.dataset.theme,'light');
  media.matches=true; callbacks.media(); assert.equal(root.dataset.theme,'dark');
  select.value='light'; callbacks.select(); callbacks.media(); assert.equal(root.dataset.theme,'light');
});
