import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { CANVAS, canvasUrl, validOpenMessage } from '../src/shared/contracts.js';
const source = (await readFile(new URL('../src/background.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/,'');

function setup(tabUrl) {
  const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const store={ [`request:${id}`]:{sourceTabId:1,sourceCanvasUrl:`${CANVAS}/courses/123/files`,viewerTabId:2} };
  const calls=[]; let receive;
  const chrome={
    runtime:{ getURL:path=>`chrome-extension://test/${path}`, onMessage:{addListener:fn=>receive=fn} },
    storage:{session:{get:async key=>key?{[key]:store[key]}:store,set:async values=>Object.assign(store,values),remove:async()=>{}}},
    tabs:{get:async()=>{if(tabUrl===null)throw Error('closed');return {id:1,url:tabUrl};}, update:async(...args)=>calls.push(['update',...args]),reload:async(...args)=>calls.push(['reload',...args]),create:async(...args)=>calls.push(['create',...args]),onRemoved:{addListener(){}}}
  };
  vm.runInNewContext(source,{chrome,CANVAS,canvasUrl,validOpenMessage});
  return {calls,send:type=>new Promise(resolve=>receive({type,requestId:id},{url:`chrome-extension://test/src/viewer/viewer.html?request=${id}`,tab:{id:2}},resolve))};
}

test('confirmed expiry reloads the Canvas source once, not on every retry',async()=>{
  const a=setup(`${CANVAS}/courses/123`);
  await a.send('SESSION_EXPIRED'); await a.send('SESSION_EXPIRED');
  assert.equal(a.calls.filter(call=>call[0]==='reload').length,1);
});
test('expired login never reloads a source tab that navigated to another site',async()=>{
  const a=setup('https://example.com/'); await a.send('SESSION_EXPIRED');
  assert.equal(a.calls.length,0);
});
test('Back to Canvas reopens the recorded course if source tab was closed',async()=>{
  const a=setup(null); await a.send('BACK_TO_CANVAS');
  assert.equal(a.calls[0][0],'create'); assert.equal(a.calls[0][1].url,`${CANVAS}/courses/123/files`);
});
