import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizedRect, clampedPosition, highlightPath, scrollToHighlight } from '../src/viewer/page-marks.js';
import { createAnnotationStore } from '../src/viewer/annotation-store.js';

test('highlight navigation centers its full bounds in both directions without changing zoom',()=>{
  for(const scale of [1,2]){
    let target;
    const viewer={getPageView:index=>{assert.equal(index,3);return {viewport:{width:600*scale,height:800*scale,convertToPdfPoint:(x,y)=>[x/scale,800-y/scale]}};},scrollPageIntoView:value=>target=value};
    scrollToHighlight(viewer,{page:4,rects:[{x:.3,y:.8,w:.2,h:.05},{x:.2,y:.6,w:.3,h:.05},{x:.1,y:.6,w:.2,h:.05}]});
    assert.equal(target.pageNumber,4);
    assert.equal(target.destArray[1].name,'XYZ');
    assert.ok(Math.abs(target.destArray[2]-180)<1e-8);
    assert.ok(Math.abs(target.destArray[3]-220)<1e-8);
    assert.equal(target.ignoreDestinationZoom,true);
    assert.equal(target.center,'both');
  }
});

test('highlight rectangles retain the same page-relative position at different zooms',()=>{
  const a=normalizedRect({left:120,top:250,right:220,bottom:270},{left:20,top:50,width:800,height:1000});
  const b=normalizedRect({left:220,top:450,right:420,bottom:490},{left:20,top:50,width:1600,height:2000});
  assert.deepEqual(a,b);
  assert.equal(normalizedRect({left:0,top:0,right:10,bottom:10},{left:20,top:50,width:800,height:1000}),null);
});
test('dragging keeps a note within the page',()=>{
  assert.deepEqual(clampedPosition(-1,-1),{x:0,y:0});
  assert.deepEqual(clampedPosition(2,2),{x:.72,y:.84});
  assert.deepEqual(clampedPosition(.2,.3),{x:.2,y:.3});
});

test('overlapping highlight rectangles paint with uniform opacity as one SVG path',async()=>{
  const {createCanvas,loadImage}=await import('@napi-rs/canvas');
  const path=highlightPath([{x:.1,y:.1,w:.8,h:.8},{x:.2,y:.3,w:.6,h:.4},{x:.2,y:.3,w:.6,h:.4}]);
  const image=await loadImage(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 1 1"><path d="${path}" fill="#ffdc00" fill-opacity=".35" fill-rule="nonzero"/></svg>`));
  const canvas=createCanvas(100,100),ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,100,100);ctx.drawImage(image,0,0);
  assert.deepEqual([...ctx.getImageData(50,50,1,1).data],[...ctx.getImageData(50,15,1,1).data]);
});
test('bookmark names, note coordinates and highlights survive reload without losing legacy entries',async()=>{
  const values={};const storage={get:async()=>structuredClone(values),set:async data=>Object.assign(values,structuredClone(data)),remove:async key=>delete values[key]};
  const make=()=>createAnnotationStore({storage,fileId:'123',version:'hash',pageCount:3});
  const a=make();
  await a.put({id:'bookmark-2',type:'bookmark',page:2,text:'Parts to order'});
  await a.put({id:'note',type:'note',page:2,text:'Compare these',x:.4,y:.5});
  await a.put({id:'highlight',type:'highlight',page:2,text:'Selected text',rects:[{x:.1,y:.2,w:.3,h:.02}]});
  const entries=await make().list();
  assert.equal(entries.find(e=>e.type==='bookmark').text,'Parts to order');
  assert.equal(entries.find(e=>e.type==='note').x,.4);
  assert.equal(entries.find(e=>e.type==='highlight').rects[0].y,.2);
  await assert.rejects(a.put({id:'bad',type:'highlight',page:1,text:'',rects:[{x:.9,y:0,w:.5,h:.1}]}));
  await a.put({id:'old',type:'note',page:1,text:'Legacy note'});
  assert.equal((await make().list()).find(e=>e.id==='old').x,.08);
});
