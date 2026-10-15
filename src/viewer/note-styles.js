export const BASE_STYLE = Object.freeze({color:'#fff1a8',opacity:1,width:.28,height:.15});
const STYLE_PREFIX='canvas-pdf-style:v1:';
export function validStyle(style) {
  return style && /^#[\da-f]{6}$/i.test(style.color) && Number.isFinite(style.opacity)&&style.opacity>=0&&style.opacity<=1&&
    Number.isFinite(style.width)&&style.width>=.12&&style.width<=.85&&Number.isFinite(style.height)&&style.height>=.06&&style.height<=.8;
}
export function noteStyle(entry={}) {return {...BASE_STYLE,...entry.style};}
export function colorWithOpacity(color,opacity) {return `${color}${Math.round(opacity*255).toString(16).padStart(2,'0')}`;}
export function createStyleStore(storage) {
  return {
    async load() {
      const all=await storage.get(null);
      const defaultStyle=all[STYLE_PREFIX+'default'];
      return {defaultStyle:validStyle(defaultStyle)?defaultStyle:{...BASE_STYLE},
        presets:Object.entries(all).filter(([key,value])=>key.startsWith(STYLE_PREFIX+'preset:')&&value&&typeof value.name==='string'&&validStyle(value.style)).map(([key,value])=>({...value,id:key.slice((STYLE_PREFIX+'preset:').length)}))};
    },
    async setDefault(style) {if(!validStyle(style))throw Error('Invalid style');await storage.set({[STYLE_PREFIX+'default']:{...style}});},
    async savePreset(id,name,style) {if(!/^[\w-]{1,80}$/.test(id)||!name.trim()||name.length>80||!validStyle(style))throw Error('Invalid preset');await storage.set({[STYLE_PREFIX+'preset:'+id]:{name:name.trim(),style:{...style}}});},
    async removePreset(id) {if(!/^[\w-]{1,80}$/.test(id))throw Error('Invalid preset');await storage.remove(STYLE_PREFIX+'preset:'+id);}
  };
}
export function isHighlightShortcut(event) {return event.ctrlKey&&event.shiftKey&&!event.altKey&&!event.metaKey&&event.key.toLowerCase()==='h';}
