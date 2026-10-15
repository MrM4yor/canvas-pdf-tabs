import { validStyle } from './note-styles.js';
const PREFIX = 'canvas-pdf-notes:v1:';
export async function documentIdentity(fileId, bytes) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return { fileId:String(fileId), version:Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('') };
}

export function createAnnotationStore({ storage, fileId, version, pageCount, origin='https://utah.instructure.com' }) {
  const filePrefix = `${PREFIX}${origin}:${fileId}:`;
  const prefix = `${filePrefix}${version}:`;
  let queue = Promise.resolve();
  function valid(entry) {
    return entry && ['note','bookmark','highlight'].includes(entry.type) && typeof entry.id === 'string' &&
      /^[\w-]{1,80}$/.test(entry.id) && Number.isInteger(entry.page) && entry.page>=1 && entry.page<=pageCount &&
      typeof entry.text==='string' && entry.text.length<=10000 &&
      (entry.name===undefined || (typeof entry.name==='string'&&entry.name.length<=160)) &&
      (entry.style===undefined || validStyle(entry.style)) &&
      (entry.x===undefined || (Number.isFinite(entry.x)&&entry.x>=0&&entry.x<=1)) &&
      (entry.y===undefined || (Number.isFinite(entry.y)&&entry.y>=0&&entry.y<=1)) &&
      (entry.type!=='highlight' || (Array.isArray(entry.rects)&&entry.rects.length>0&&entry.rects.length<=1000&&entry.rects.every(r=>['x','y','w','h'].every(k=>Number.isFinite(r[k])&&r[k]>=0&&r[k]<=1)&&r.w>0&&r.h>0&&r.x+r.w<=1.001&&r.y+r.h<=1.001)));
  }
  function enqueue(action) { const result=queue.catch(()=>{}).then(action); queue=result; return result; }
  return {
    prefix,
    async list() {
      await queue.catch(()=>{});
      const all=await storage.get(null);
      return Object.entries(all).filter(([key,value])=>key.startsWith(prefix)&&valid(value)).map(([,value])=>value)
        .sort((a,b)=>a.page-b.page || (a.createdAt??a.updatedAt)-(b.createdAt??b.updatedAt) || a.id.localeCompare(b.id));
    },
    async hasOlderVersion() { const all=await storage.get(null); return Object.keys(all).some(key=>key.startsWith(filePrefix)&&!key.startsWith(prefix)); },
    put(entry) {
      if (!valid(entry)) return Promise.reject(new Error('Invalid saved page or note.'));
      const saved={id:entry.id,type:entry.type,page:entry.page,text:entry.text,updatedAt:Date.now()};
      saved.createdAt=entry.createdAt??entry.updatedAt??saved.updatedAt;
      if(entry.name!==undefined)saved.name=entry.name;
      if(entry.style!==undefined)saved.style={...entry.style};
      if(entry.type==='note') {saved.x=entry.x??.08;saved.y=entry.y??.10;}
      if(entry.type==='highlight')saved.rects=entry.rects.map(({x,y,w,h})=>({x,y,w,h}));
      return enqueue(()=>storage.set({[prefix+saved.id]:saved}));
    },
    remove(id) {
      if (!/^[\w-]{1,80}$/.test(id)) return Promise.reject(new Error('Invalid note ID.'));
      return enqueue(()=>storage.remove(prefix+id));
    }
  };
}
