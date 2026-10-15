import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_STYLE,createStyleStore,validStyle,colorWithOpacity,isHighlightShortcut } from '../src/viewer/note-styles.js';
import { createAnnotationStore } from '../src/viewer/annotation-store.js';
import { clampedPosition,clampedSize } from '../src/viewer/page-marks.js';
function memory(){const values={};return {get:async()=>structuredClone(values),set:async data=>Object.assign(values,structuredClone(data)),remove:async key=>{delete values[key];}};}
test('multiple named styles and defaults persist independently from existing notes',async()=>{
  const storage=memory(),styles=createStyleStore(storage);
  const blue={color:'#aabbff',opacity:.4,width:.4,height:.2};
  await styles.savePreset('blue','Blue glass',blue);
  await styles.savePreset('yellow','Yellow',BASE_STYLE);
  await styles.setDefault(blue);
  const reopened=await createStyleStore(storage).load();
  assert.deepEqual(reopened.defaultStyle,blue);assert.equal(reopened.presets.length,2);
  await styles.removePreset('blue');assert.equal((await styles.load()).presets.length,1);
  assert.deepEqual((await styles.load()).defaultStyle,blue);
});
test('note names and appearance survive reopen; bad styles are rejected without losing valid data',async()=>{
  const storage=memory(),make=()=>createAnnotationStore({storage,fileId:'1',version:'a',pageCount:2});
  const style={color:'#ffccaa',opacity:.5,width:.4,height:.3};
  await make().put({id:'note',type:'note',page:1,text:'Hello',name:'Parts',x:.1,y:.2,style});
  const entry=(await make().list())[0];assert.deepEqual(entry.style,style);assert.equal(entry.name,'Parts');
  await assert.rejects(make().put({...entry,style:{...style,opacity:2}}));
  assert.equal((await make().list()).length,1);
  assert.equal(validStyle({...style,color:'red;display:none'}),false);
  assert.equal(colorWithOpacity('#ffccaa',.5),'#ffccaa80');
});
test('resizing and moving honor actual dimensions and keep notes on page',()=>{
  assert.deepEqual(clampedPosition(.8,.8,.4,.3),{x:.6,y:.7});
  assert.deepEqual(clampedSize(.9,.9,.2,.3),{width:.8,height:.7});
  assert.deepEqual(clampedSize(0,0),{width:.12,height:.06});
});
test('only Ctrl+Shift+H triggers highlighting, leaving browser History untouched',()=>{
  assert.equal(isHighlightShortcut({ctrlKey:true,shiftKey:true,key:'H'}),true);
  assert.equal(isHighlightShortcut({ctrlKey:true,shiftKey:false,key:'h'}),false);
  assert.equal(isHighlightShortcut({ctrlKey:true,shiftKey:true,altKey:true,key:'h'}),false);
});
