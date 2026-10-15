import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnnotationStore, documentIdentity } from '../src/viewer/annotation-store.js';
function memoryStorage() {
  const values={};
  return { get:async()=>structuredClone(values), set:async data=>Object.assign(values,structuredClone(data)), remove:async key=>{delete values[key];} };
}
const note=(id='note-1',text='Choose these parts')=>({id,type:'note',page:2,text});
const make=(storage,fileId='123',version='hash-a')=>createAnnotationStore({storage,fileId,version,pageCount:3});

test('saved notes survive a fresh store and stay isolated by file and version',async()=>{
  const storage=memoryStorage(); await make(storage).put(note());
  assert.equal((await make(storage).list())[0].text,'Choose these parts');
  assert.equal((await make(storage,'456').list()).length,0);
  const replaced=make(storage,'123','hash-b');
  assert.equal((await replaced.list()).length,0); assert.equal(await replaced.hasOlderVersion(),true);
  assert.equal((await make(storage).list()).length,1);
});
test('concurrent tabs cannot overwrite unrelated notes',async()=>{
  const storage=memoryStorage(),a=make(storage),b=make(storage);
  await Promise.all([a.put(note('note-a')),b.put(note('note-b'))]);
  assert.equal((await a.list()).length,2);
  await a.put(note('note-a','Edited')); assert.equal((await b.list()).find(n=>n.id==='note-a').text,'Edited');
});
test('ordered autosaves keep the latest text; remove and Undo restore it',async()=>{
  const storage=memoryStorage(),store=make(storage);
  await Promise.all([store.put(note('one','a')),store.put(note('one','ab')),store.put(note('one','abc'))]);
  const entry=(await store.list())[0]; assert.equal(entry.text,'abc');
  await store.remove(entry.id); assert.equal((await store.list()).length,0);
  await store.put(entry); assert.equal((await store.list())[0].text,'abc');
});
test('reject bad pages, IDs and overlong notes; recover after a storage failure',async()=>{
  const storage=memoryStorage(),store=make(storage);
  await assert.rejects(store.put({...note(),page:4}));
  await assert.rejects(store.put({...note(),text:'x'.repeat(10001)}));
  await assert.rejects(store.put({...note(),id:'../bad'}));
  const set=storage.set; storage.set=async()=>{throw Error('quota');};
  await assert.rejects(store.put(note())); storage.set=set;
  await store.put(note()); assert.equal((await store.list()).length,1);
});
test('content hashes are stable across reopenings and change with file bytes',async()=>{
  const bytes=new TextEncoder().encode('original PDF');
  const a=await documentIdentity('123',bytes),b=await documentIdentity('123',bytes);
  assert.deepEqual(a,b);
  assert.notEqual(a.version,(await documentIdentity('123',new TextEncoder().encode('replacement PDF'))).version);
});
