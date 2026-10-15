export function normalizedRect(rect, page) {
  const left=Math.max(rect.left,page.left),top=Math.max(rect.top,page.top);
  const right=Math.min(rect.right,page.left+page.width),bottom=Math.min(rect.bottom,page.top+page.height);
  if(right-left<1||bottom-top<1||page.width<=0||page.height<=0)return null;
  return {x:(left-page.left)/page.width,y:(top-page.top)/page.height,w:(right-left)/page.width,h:(bottom-top)/page.height};
}
export function clampedPosition(x,y) {return {x:Math.max(0,Math.min(.72,x)),y:Math.max(0,Math.min(.84,y))};}

export function wirePageMarks({viewer,eventBus,getEntries,save,report,document:dom=document}) {
  const pageBox=page=>{const r=page.getBoundingClientRect();return {left:r.left+page.clientLeft,top:r.top+page.clientTop,width:page.clientWidth,height:page.clientHeight};};
  function paint() {
    const entries=getEntries();
    dom.querySelectorAll('#viewer .page').forEach(page=>{
      const number=Number(page.dataset.pageNumber),items=entries.filter(e=>e.page===number&&e.type!=='bookmark');
      let layer=page.querySelector(':scope > .savedMarksLayer');
      if(!layer){layer=dom.createElement('div');layer.className='savedMarksLayer';page.append(layer);}
      const ids=new Set(items.map(e=>e.id));
      for(const child of [...layer.children])if(!ids.has(child.dataset.entryId))child.remove();
      for(const entry of items) {
        let box=[...layer.children].find(child=>child.dataset.entryId===entry.id);
        if(entry.type==='highlight') {
          if(box)continue;
          box=dom.createElement('div');box.dataset.entryId=entry.id;box.className='savedHighlightGroup';
          for(const r of entry.rects){const mark=dom.createElement('span');mark.className='savedHighlight';Object.assign(mark.style,{left:`${r.x*100}%`,top:`${r.y*100}%`,width:`${r.w*100}%`,height:`${r.h*100}%`});box.append(mark);}
          layer.append(box);continue;
        }
        if(!box) {
          box=dom.createElement('section');box.dataset.entryId=entry.id;box.className='pageNote';box.setAttribute('aria-label',`Note on page ${number}`);
          const handle=dom.createElement('div');handle.className='noteDragHandle';handle.textContent='⠿ Drag note';
          const input=dom.createElement('textarea');input.setAttribute('aria-label',`Edit note on page ${number}`);input.maxLength=10000;
          input.addEventListener('input',()=>{const latest=getEntries().find(e=>e.id===entry.id)||entry;save({...latest,text:input.value}).catch(()=>{});});
          handle.addEventListener('pointerdown',event=>{
            if(event.button!==0)return;event.preventDefault();event.stopPropagation();
            const p=pageBox(page),start=getEntries().find(e=>e.id===entry.id)||entry;
            const sx=event.clientX,sy=event.clientY;let position={x:start.x??.08,y:start.y??.10};box.dataset.dragging='true';handle.setPointerCapture(event.pointerId);
            const move=e=>{position=clampedPosition((start.x??.08)+(e.clientX-sx)/p.width,(start.y??.10)+(e.clientY-sy)/p.height);box.style.left=`${position.x*100}%`;box.style.top=`${position.y*100}%`;};
            const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);delete box.dataset.dragging;const latest=getEntries().find(e=>e.id===entry.id)||start;save({...latest,...position}).catch(()=>{});};
            handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
          });
          box.append(handle,input);layer.append(box);
        }
        if(!box.dataset.dragging){box.style.left=`${(entry.x??.08)*100}%`;box.style.top=`${(entry.y??.10)*100}%`;}
        const input=box.querySelector('textarea');if(dom.activeElement!==input)input.value=entry.text;
      }
    });
  }
  eventBus.on('pagerendered',paint);
  return {paint,async highlightSelection(){
    const selection=dom.getSelection();
    if(!selection||selection.isCollapsed||!selection.rangeCount){report('Select PDF text first, then click Highlight.');return;}
    const range=selection.getRangeAt(0),text=selection.toString().slice(0,10000);
    const isPdfText=node=>(node.nodeType===1?node:node.parentElement)?.closest?.('#viewer .textLayer');
    if(!isPdfText(range.startContainer)||!isPdfText(range.endContainer)){report('Highlighting works on selectable PDF text. Select text on the page, then try again.');return;}
    let count=0;
    for(const page of dom.querySelectorAll('#viewer .page')){
      const area=pageBox(page),rects=[...range.getClientRects()].map(r=>normalizedRect(r,area)).filter(Boolean);
      const unique=[...new Map(rects.map(r=>[JSON.stringify(r),r])).values()];
      if(unique.length){await save({id:crypto.randomUUID(),type:'highlight',page:Number(page.dataset.pageNumber),text,rects:unique});count++;}
    }
    if(count){selection.removeAllRanges();report('Highlight saved locally.');}else report('No selectable PDF text was found.');
  }};
}
