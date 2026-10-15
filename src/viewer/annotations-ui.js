import { createAnnotationStore } from './annotation-store.js';
import { wirePageMarks,clampedPosition,scrollToHighlight } from './page-marks.js';
import { createStyleStore,noteStyle,BASE_STYLE,isHighlightShortcut } from './note-styles.js';
import { icon,iconButton } from './icons.js';

export function wireAnnotations({viewer,eventBus,document:dom=document}) {
  const $=id=>dom.getElementById(id);
  let store,entries=[],selectedId=null,deleted=null,namingId=null,generation=0,ready=false;
  let defaults={...BASE_STYLE},presets=[];
  const styleStore=createStyleStore(chrome.storage.local);
  const controls=['bookmarkPage','notesToggle','annotationsToggle','newNote','highlightText'];
  const status=text=>{$('noteStatus').textContent=text;};
  function setSidebar(open,tab){$('notesSidebar').hidden=!open;dom.body.classList.toggle('notesOpen',open);$('annotationsToggle').setAttribute('aria-expanded',String(open));if(tab)showTab(tab);window.dispatchEvent(new Event('resize'));}
  function showTab(tab){for(const name of ['settings','all']){$(name+'Panel').hidden=name!==tab;$(name+'Tab').setAttribute('aria-selected',String(name===tab));}}
  function selected(){return entries.find(e=>e.id===selectedId&&e.type==='note');}
  function fillSettings(entry){const style=entry?noteStyle(entry):defaults;$('selectedNoteLabel').textContent=entry?`Note settings · page ${entry.page}`:'New note settings';$('noteColor').value=style.color;$('noteTransparency').value=String(Math.round((1-style.opacity)*100));$('transparencyValue').textContent=`${Math.round((1-style.opacity)*100)}%`;}
  function selectNote(entry,focus=false){selectedId=entry.id;fillSettings(entry);if(focus)focusNote(entry);}
  function focusNote(entry){viewer.currentPageNumber=entry.page;requestAnimationFrame(()=>{const box=[...dom.querySelectorAll('.pageNote')].find(b=>b.dataset.entryId===entry.id);box?.querySelector('textarea')?.focus();});}
  async function saveMark(entry){if(!store)return;try{await store.put(entry);await refresh();status('Saved locally');}catch{setSidebar(true);status('Not saved. Your text is still here; try again.');throw Error('Save failed');}}
  const marks=wirePageMarks({viewer,eventBus,getEntries:()=>entries,save:saveMark,selectNote,report:status,document:dom});
  function button(kind,label,callback){const b=dom.createElement('button');b.type='button';iconButton(b,kind,label,dom);b.addEventListener('click',callback);return b;}
  function pageState(){const page=viewer.currentPageNumber,marked=entries.some(e=>e.type==='bookmark'&&e.page===page);$('bookmarkPage').textContent=marked?'★':'☆';$('bookmarkPage').title=marked?'Remove page bookmark':'Bookmark this page';$('bookmarkPage').setAttribute('aria-pressed',String(marked));$('newNote').textContent=`Add note on page ${page}`;}
  async function refresh(){if(!store)return;const active=store,list=await active.list();if(active!==store)return;entries=list;render();pageState();marks.paint();}
  function entryName(entry){return entry.name||(entry.type==='bookmark'?entry.text:'')||entry.text.split('\n')[0].slice(0,100)||(entry.type==='note'?'Untitled note':entry.type==='highlight'?'Highlight':'Bookmark');}
  function render(){const list=$('savedEntries');list.replaceChildren();$('emptyNotes').hidden=entries.length>0;
    entries.forEach(entry=>{
      const row=dom.createElement('tr');
      const name=dom.createElement('td'),jump=dom.createElement('button');jump.className='annotationJump';jump.textContent=entryName(entry);jump.title=entryName(entry);jump.addEventListener('click',()=>{if(entry.type==='highlight'){scrollToHighlight(viewer,entry);return;}viewer.currentPageNumber=entry.page;if(entry.type==='note'){selectedId=entry.id;focusNote(entry);}});name.append(jump);
      const type=dom.createElement('td');type.append(icon(entry.type==='highlight'?'highlight':entry.type==='bookmark'?'bookmark':'note',dom));type.title=entry.type;type.setAttribute('aria-label',entry.type);
      const page=dom.createElement('td');page.textContent=String(entry.page);
      const rename=dom.createElement('td');rename.append(button('rename','Rename '+entry.type,()=>nameEntry(entry)));
      const remove=dom.createElement('td');remove.append(button('trash','Remove '+entry.type,()=>removeEntry(entry)));
      row.append(name,type,page,rename,remove);list.append(row);
    });
  }
  async function removeEntry(entry){const active=store;try{await active.remove(entry.id);deleted={entry,store:active};$('undoRemove').hidden=false;if(selectedId===entry.id){selectedId=null;fillSettings(null);}if(namingId===entry.id){namingId=null;$('bookmarkEditor').hidden=true;}await refresh();status('Removed. Undo is available.');}catch{status('Could not remove this item. Try again.');}}
  // Keep the quick name field independent of sidebar visibility and selected tab.
  dom.body.append($('bookmarkEditor'));
  function nameEntry(entry){namingId=entry.id;$('bookmarkEditor').hidden=false;$('bookmarkName').value=entry.name||(entry.type==='bookmark'?entry.text:'');$('bookmarkName').focus();$('bookmarkName').select();}
  $('bookmarkName').addEventListener('input',()=>{const entry=entries.find(e=>e.id===namingId);if(!entry)return;const name=$('bookmarkName').value;saveMark({...entry,name,...(entry.type==='bookmark'?{text:name}:{})}).catch(()=>{});});
  $('bookmarkName').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key==='Escape'){$('bookmarkEditor').hidden=true;namingId=null;}});
  $('bookmarkPage').addEventListener('click',async()=>{if(!store)return;const page=viewer.currentPageNumber,id=`bookmark-${page}`;const existing=entries.find(e=>e.id===id);if(existing){await removeEntry(existing);return;}const entry={id,type:'bookmark',page,text:''};try{await saveMark(entry);nameEntry(entry);}catch{}});
  async function addNote(){if(!store)return;const page=viewer.currentPageNumber,position=clampedPosition(.08,.1,defaults.width,defaults.height);const entry={id:crypto.randomUUID(),type:'note',page,text:'',...position,style:{...defaults}};selectedId=entry.id;fillSettings(entry);try{await saveMark(entry);focusNote(entry);status('Type on the page. Drag the header to move; drag the lower-right corner to resize.');}catch{}}
  $('notesToggle').addEventListener('click',addNote);$('newNote').addEventListener('click',addNote);
  $('annotationsToggle').addEventListener('click',()=>setSidebar($('notesSidebar').hidden,'all'));
  $('settingsTab').addEventListener('click',()=>showTab('settings'));$('allTab').addEventListener('click',()=>showTab('all'));$('closeNotes').addEventListener('click',()=>setSidebar(false));
  $('highlightText').addEventListener('mousedown',e=>e.preventDefault());
  const highlight=()=>{if(ready)marks.highlightSelection().catch(()=>status('Highlight could not be saved. Try again.'));};
  $('highlightText').addEventListener('click',highlight);
  dom.addEventListener('keydown',e=>{if(ready&&isHighlightShortcut(e)){e.preventDefault();highlight();}});
  async function updateStyle(style){const entry=selected();if(entry){const position=clampedPosition(entry.x??.08,entry.y??.1,style.width,style.height);await saveMark({...entry,...position,style});}else defaults={...style};}
  async function editStyle(){const style={...noteStyle(selected()||{style:defaults}),color:$('noteColor').value,opacity:1-Number($('noteTransparency').value)/100};$('transparencyValue').textContent=`${$('noteTransparency').value}%`;await updateStyle(style).catch(()=>{});}
  $('noteColor').addEventListener('input',editStyle);$('noteTransparency').addEventListener('input',editStyle);
  function currentStyle(){return {...noteStyle(selected()||{style:defaults}),color:$('noteColor').value,opacity:1-Number($('noteTransparency').value)/100};}
  async function refreshStyles(){const data=await styleStore.load();defaults=data.defaultStyle;presets=data.presets;$('presetSelect').replaceChildren();const empty=dom.createElement('option');empty.value='';empty.textContent='Choose a saved style';$('presetSelect').append(empty);for(const p of presets){const option=dom.createElement('option');option.value=p.id;option.textContent=p.name;$('presetSelect').append(option);}}
  $('setDefaultStyle').addEventListener('click',async()=>{try{await styleStore.setDefault(currentStyle());await refreshStyles();status('Default saved for new notes in all PDFs.');}catch{status('Could not save default settings.');}});
  $('saveStylePreset').addEventListener('click',async()=>{try{const name=$('presetName').value.trim();if(!name){status('Enter a name for this style.');$('presetName').focus();return;}await styleStore.savePreset(crypto.randomUUID(),name,currentStyle());await refreshStyles();$('presetName').value='';status('Style saved.');}catch{status('Could not save style.');}});
  $('applyStylePreset').addEventListener('click',async()=>{const preset=presets.find(p=>p.id===$('presetSelect').value);if(preset){await updateStyle({...preset.style}).catch(()=>{});fillSettings(selected());}});
  $('deleteStylePreset').addEventListener('click',async()=>{const id=$('presetSelect').value;if(id){try{await styleStore.removePreset(id);await refreshStyles();status('Saved style removed; existing notes are unchanged.');}catch{status('Could not remove style.');}}});
  $('undoRemove').addEventListener('click',async()=>{if(!deleted||deleted.store!==store)return;try{await store.put(deleted.entry);deleted=null;$('undoRemove').hidden=true;await refresh();status('Restored.');}catch{status('Could not restore this item.');}});
  eventBus.on('pagechanging',pageState);
  chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(store&&Object.keys(changes).some(key=>key.startsWith(store.prefix)))refresh().catch(()=>status('Could not refresh saved items.'));if(Object.keys(changes).some(key=>key.startsWith('canvas-pdf-style:v1:')))refreshStyles().catch(()=>status('Could not refresh styles.'));});
  return {
    reset(){generation++;ready=false;store=null;entries=[];selectedId=null;deleted=null;namingId=null;controls.forEach(id=>$(id).disabled=true);$('bookmarkEditor').hidden=true;$('undoRemove').hidden=true;render();setSidebar(false);fillSettings(null);},
    async load(identity,pageCount){const ticket=generation;try{store=createAnnotationStore({storage:chrome.storage.local,...identity,pageCount});await refresh();await refreshStyles();if(ticket!==generation)return;$('versionNotice').hidden=!(await store.hasOlderVersion());controls.forEach(id=>$(id).disabled=false);ready=true;fillSettings(null);setSidebar(true,'all');status('Saved on this computer, in this Chrome profile.');}catch{setSidebar(true,'all');status('Local saved items are unavailable. The reader still works.');}}
  };
}
