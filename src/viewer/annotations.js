import { createAnnotationStore } from './annotation-store.js';
import { wirePageMarks } from './page-marks.js';

export function wireAnnotations({ viewer, eventBus, document: dom=document }) {
  const $=id=>dom.getElementById(id);
  let store, entries=[], editing=null, deleted=null, generation=0, saveRevision=0;
  const controls=['bookmarkPage','notesToggle','newNote','highlightText'];
  const status=text=>{ $('noteStatus').textContent=text; };
  async function saveMark(entry) {if(!store)return;try{await store.put(entry);await refresh();status('Saved locally');}catch{setSidebar(true);status('Not saved. Your text is still on the page; try again.');throw new Error('Save failed');}}
  const marks=wirePageMarks({viewer,eventBus,getEntries:()=>entries,save:saveMark,report:text=>{setSidebar(true);status(text);},document:dom});
  $('highlightText').addEventListener('mousedown',e=>e.preventDefault());
  $('highlightText').addEventListener('click',()=>marks.highlightSelection().catch(()=>status('Highlight could not be saved. Try again.')));
  function setSidebar(open) {
    $('notesSidebar').hidden=!open;
    dom.body.classList.toggle('notesOpen',open);
    $('notesToggle').setAttribute('aria-expanded',String(open));
    // PDF.js uses container size to compute fit modes and visible pages.
    window.dispatchEvent(new Event('resize'));
  }
  function button(label,callback) { const b=dom.createElement('button'); b.type='button'; b.textContent=label; b.addEventListener('click',callback); return b; }
  function pageState() {
    const page=viewer.currentPageNumber;
    const marked=entries.some(e=>e.type==='bookmark'&&e.page===page);
    $('bookmarkPage').textContent=marked?'★ Bookmarked':'☆ Bookmark';
    $('bookmarkPage').setAttribute('aria-pressed',String(marked));
    $('newNote').textContent=`Add note on page ${page}`;
  }
  async function refresh() {
    if(!store)return;
    const active=store;
    const list=await active.list();
    if(active!==store)return;
    entries=list; render(); pageState();marks.paint();
  }
  function render() {
    const list=$('savedEntries'); list.replaceChildren();
    $('emptyNotes').hidden=entries.length>0;
    for(const entry of entries) {
      const card=dom.createElement('article'); card.className='savedEntry';
      card.append(button(`${entry.type==='bookmark'?(entry.text||'★ Bookmark'):entry.type==='highlight'?'Highlight':'Note'} · Page ${entry.page}`,()=>{viewer.currentPageNumber=entry.page;}));
      if(entry.type==='bookmark')card.append(button('Rename',()=>nameBookmark(entry)));
      if(entry.type==='highlight'){const text=dom.createElement('p');text.textContent=entry.text;card.append(text);}
      if(entry.type==='note') {
        const text=dom.createElement('p'); text.textContent=entry.text||'(Empty note)'; card.append(text);
        card.append(button('Edit',()=>{editing={...entry};$('noteEditor').hidden=false;$('notePage').textContent=`Note on page ${entry.page}`;$('noteText').value=entry.text;viewer.currentPageNumber=entry.page;$('noteText').focus();status('Saved locally');}));
      }
      card.append(button('Remove',async()=>{
        const active=store;
        try { await active.remove(entry.id); deleted={entry,store:active};$('undoRemove').hidden=false;
          if(editing?.id===entry.id){editing=null;$('noteEditor').hidden=true;}
          await refresh();status('Removed. Undo is available.');
        } catch {status('Could not remove this item. Try again.');}
      }));
      list.append(card);
    }
  }
  $('notesToggle').addEventListener('click',()=>setSidebar($('notesSidebar').hidden));
  $('closeNotes').addEventListener('click',()=>setSidebar(false));
  let naming=null;
  function nameBookmark(entry){naming={...entry};setSidebar(true);$('bookmarkEditor').hidden=false;$('bookmarkName').value=entry.text;$('bookmarkName').focus();$('bookmarkName').select();}
  $('bookmarkName').addEventListener('input',async()=>{if(!naming||!store)return;naming.text=$('bookmarkName').value;await saveMark({...naming}).catch(()=>{});});
  $('bookmarkName').addEventListener('keydown',e=>{if(e.key==='Enter'){$('bookmarkEditor').hidden=true;naming=null;}});
  $('bookmarkPage').addEventListener('click',async()=>{
    if(!store)return;
    try {
      const page=viewer.currentPageNumber, id=`bookmark-${page}`;
      if(entries.some(e=>e.id===id))await store.remove(id);
      else {const entry={id,type:'bookmark',page,text:''};await store.put(entry);nameBookmark(entry);}
      await refresh();status('Saved locally');
    } catch {setSidebar(true);status('Bookmark could not be saved. Try again.');}
  });
  $('newNote').addEventListener('click',()=>{
    editing={id:crypto.randomUUID(),type:'note',page:viewer.currentPageNumber,text:'',x:.08,y:.10};
    saveMark({...editing}).then(()=>{const page=dom.querySelector(`#viewer .page[data-page-number="${editing.page}"]`);const boxes=page?.querySelectorAll('.pageNote')||[];[...boxes].find(b=>b.dataset.entryId===editing.id)?.querySelector('textarea')?.focus();}).catch(()=>{});
    $('noteEditor').hidden=true;status('Type in the note on the PDF. Drag its header to move it.');
  });
  async function saveEditor() {
    if(!editing||!store)return;
    const revision=++saveRevision;
    editing.text=$('noteText').value;
    status('Saving…');
    try {await store.put({...entries.find(e=>e.id===editing.id),...editing,x:entries.find(e=>e.id===editing.id)?.x??editing.x,y:entries.find(e=>e.id===editing.id)?.y??editing.y});if(revision===saveRevision)status('Saved locally');await refresh();}
    catch {if(revision===saveRevision)status('Not saved. Your text is still here. Press Save again to retry.');}
  }
  $('noteText').addEventListener('input',saveEditor);
  $('saveNote').addEventListener('click',saveEditor);
  $('undoRemove').addEventListener('click',async()=>{
    if(!deleted||deleted.store!==store)return;
    try {await store.put(deleted.entry);deleted=null;$('undoRemove').hidden=true;await refresh();status('Restored.');}
    catch {status('Could not restore this item. Try again.');}
  });
  eventBus.on('pagechanging',pageState);
  chrome.storage.onChanged.addListener((changes,area)=>{
    if(area==='local'&&store&&Object.keys(changes).some(key=>key.startsWith(store.prefix)))refresh().catch(()=>status('Could not refresh saved items.'));
  });
  return {
    reset() {generation++;store=null;editing=null;deleted=null;entries=[];naming=null;controls.forEach(id=>$(id).disabled=true);$('noteEditor').hidden=true;$('bookmarkEditor').hidden=true;$('undoRemove').hidden=true;render();setSidebar(false);},
    async load(identity,pageCount) {
      const ticket=generation;
      try {
        if(ticket!==generation)return;
        store=createAnnotationStore({storage:chrome.storage.local,...identity,pageCount});
        await refresh();
        $('versionNotice').hidden=!(await store.hasOlderVersion());
        controls.forEach(id=>$(id).disabled=false);status('Saved on this computer, in this Chrome profile.');
      } catch {setSidebar(true);status('Local saved items are unavailable. The PDF reader still works.');}
    }
  };
}
