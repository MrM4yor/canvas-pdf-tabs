import { noteStyle, colorWithOpacity } from './note-styles.js';
export function normalizedRect(rect, page) {
  const left=Math.max(rect.left,page.left),top=Math.max(rect.top,page.top);
  const right=Math.min(rect.right,page.left+page.width),bottom=Math.min(rect.bottom,page.top+page.height);
  if(right-left<1||bottom-top<1||page.width<=0||page.height<=0)return null;
  return {x:(left-page.left)/page.width,y:(top-page.top)/page.height,w:(right-left)/page.width,h:(bottom-top)/page.height};
}
export function clampedPosition(x,y,width=.28,height=.16) {return {x:Math.max(0,Math.min(1-width,x)),y:Math.max(0,Math.min(1-height,y))};}
export function clampedSize(width,height,x=0,y=0) {return {width:Math.max(.12,Math.min(.85,1-x,width)),height:Math.max(.06,Math.min(.8,1-y,height))};}
export function highlightPath(rects) {return rects.map(r=>`M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}Z`).join(' ');}

export function scrollToHighlight(viewer,entry) {
  const viewport=viewer.getPageView(entry.page-1)?.viewport;
  const rects=entry.rects;
  if(!viewport||!rects?.length){viewer.currentPageNumber=entry.page;return;}
  const left=Math.min(...rects.map(r=>r.x)),right=Math.max(...rects.map(r=>r.x+r.w));
  const top=Math.min(...rects.map(r=>r.y)),bottom=Math.max(...rects.map(r=>r.y+r.h));
  // Convert the saved page-relative position at the current zoom back to PDF coordinates.
  const [x,y]=viewport.convertToPdfPoint((left+right)/2*viewport.width,(top+bottom)/2*viewport.height);
  viewer.scrollPageIntoView({pageNumber:entry.page,destArray:[null,{name:'XYZ'},x,y,null],ignoreDestinationZoom:true,center:'both'});
}

export function wirePageMarks({viewer,eventBus,getEntries,save,report,selectNote=()=>{},document:dom=document}) {
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
          // One filled path composites overlapping selection rectangles only once.
          // Browser ranges may contain both a whole-line rectangle and nested span rectangles.
          const svg=dom.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('savedHighlightShape');svg.setAttribute('viewBox','0 0 1 1');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
          const path=dom.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',highlightPath(entry.rects));path.setAttribute('fill-rule','nonzero');svg.append(path);box.append(svg);
          layer.append(box);continue;
        }
        if(!box) {
          box=dom.createElement('section');box.dataset.entryId=entry.id;box.className='pageNote';box.setAttribute('aria-label',`Note on page ${number}`);
          const handle=dom.createElement('div');handle.className='noteDragHandle';handle.textContent='⠿ Drag note';
          const input=dom.createElement('textarea');input.setAttribute('aria-label',`Edit note on page ${number}`);input.maxLength=10000;
          input.addEventListener('focus',()=>selectNote(getEntries().find(e=>e.id===entry.id)||entry,false));
          input.addEventListener('input',()=>{const latest=getEntries().find(e=>e.id===entry.id)||entry;save({...latest,text:input.value}).catch(()=>{});});
          handle.addEventListener('pointerdown',event=>{
            if(event.button!==0)return;event.preventDefault();event.stopPropagation();
            const start=getEntries().find(e=>e.id===entry.id)||entry,style=noteStyle(start);
            selectNote(start,false);
            const p=pageBox(page);
            const sx=event.clientX,sy=event.clientY;let position={x:start.x??.08,y:start.y??.10};box.dataset.dragging='true';handle.setPointerCapture(event.pointerId);
            const move=e=>{position=clampedPosition((start.x??.08)+(e.clientX-sx)/p.width,(start.y??.10)+(e.clientY-sy)/p.height,style.width,style.height);box.style.left=`${position.x*100}%`;box.style.top=`${position.y*100}%`;};
            const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);delete box.dataset.dragging;const latest=getEntries().find(e=>e.id===entry.id)||start;save({...latest,...position}).catch(()=>{});};
            handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
          });
          const resize=dom.createElement('div');resize.className='noteResizeHandle';resize.title='Drag to resize note';resize.setAttribute('aria-label','Drag to resize note');
          resize.addEventListener('pointerdown',event=>{
            if(event.button!==0)return;event.preventDefault();event.stopPropagation();
            const start=getEntries().find(e=>e.id===entry.id)||entry,initial=noteStyle(start),sx=event.clientX,sy=event.clientY;
            selectNote(start,false);const p=pageBox(page);let size={width:initial.width,height:initial.height};box.dataset.resizing='true';resize.setPointerCapture(event.pointerId);
            const move=e=>{size=clampedSize(initial.width+(e.clientX-sx)/p.width,initial.height+(e.clientY-sy)/p.height,start.x??.08,start.y??.1);box.style.width=`${size.width*100}%`;box.style.height=`${size.height*100}%`;};
            const end=()=>{resize.removeEventListener('pointermove',move);resize.removeEventListener('pointerup',end);resize.removeEventListener('pointercancel',end);delete box.dataset.resizing;const latest=getEntries().find(e=>e.id===entry.id)||start;save({...latest,style:{...noteStyle(latest),...size}}).catch(()=>{});};
            resize.addEventListener('pointermove',move);resize.addEventListener('pointerup',end);resize.addEventListener('pointercancel',end);
          });
          box.append(handle,input,resize);layer.append(box);
        }
        if(!box.dataset.dragging){box.style.left=`${(entry.x??.08)*100}%`;box.style.top=`${(entry.y??.10)*100}%`;}
        const style=noteStyle(entry);
        if(!box.dataset.resizing){box.style.width=`${style.width*100}%`;box.style.height=`${style.height*100}%`;}
        box.style.backgroundColor=colorWithOpacity(style.color,style.opacity);
        box.querySelector('.noteDragHandle').style.backgroundColor=colorWithOpacity(style.color,style.opacity);
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
