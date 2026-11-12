import type {ReactNode} from 'react';
export interface TableColumn { key: string; label: string; width: number; min: number; header?:ReactNode; required?: boolean; type?: 'S'|'N'|'A' }
export interface TableLayout { widths: Record<string,number>; hidden: string[]; order: string[] }
export const maxTableColumnWidth=800;
/** One preference key across release suffixes; `:v2:` is metadata, not a new user. */
export function tablePreferenceKey(key:string){return key.replace(/:v\d+(?=:|$)/g,'');}
export function tableColumnWidth(value:number,column:TableColumn){return Math.min(maxTableColumnWidth,Math.max(column.min,Number.isFinite(value)?value:column.width));}
export function defaultTableLayout(columns:readonly TableColumn[]):TableLayout{return {widths:Object.fromEntries(columns.map(c=>[c.key,c.width])),hidden:[],order:columns.map(c=>c.key)};}
export function readTableLayout(storage:Pick<Storage,'getItem'>,key:string,columns:readonly TableColumn[],legacy?:{shares:string;pixels:string}):TableLayout{
 const defaults=defaultTableLayout(columns);
 try{
  const raw=storage.getItem(key);
  if(raw){
   const saved:unknown=JSON.parse(raw);
   if(!saved||typeof saved!=='object')return defaults;
   const {widths,hidden,order}=saved as {widths?:unknown;hidden?:unknown;order?:unknown};
   if(!widths||typeof widths!=='object'||!Array.isArray(hidden))return defaults;
   return {widths:Object.fromEntries(columns.map(c=>{const v=(widths as Record<string,unknown>)[c.key];return [c.key,typeof v==='number'?tableColumnWidth(v,c):c.width]})),hidden:columns.filter(c=>!c.required&&hidden.includes(c.key)).map(c=>c.key),order:[...new Set([...(Array.isArray(order)?order.filter((key):key is string=>typeof key==='string'&&columns.some(c=>c.key===key)):[]),...columns.map(c=>c.key)])]};
  }
  if(legacy){
   const sharesRaw=storage.getItem(legacy.shares),pixelsRaw=storage.getItem(legacy.pixels);
   const saved:unknown=JSON.parse(sharesRaw??pixelsRaw??'null');
   if(saved&&typeof saved==='object'){
    const values=columns.map(c=>(saved as Record<string,unknown>)[c.key]);
    if(values.every((v):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>0)){
     const total=values.reduce((sum,v)=>sum+v,0),base=columns.reduce((sum,c)=>sum+c.width,0);
     if(!Number.isFinite(total)||total<=0)return defaults;
     return {widths:Object.fromEntries(columns.map((c,i)=>[c.key,tableColumnWidth(sharesRaw?(values[i]??0)/total*base:values[i]??c.width,c)])),hidden:[],order:columns.map(c=>c.key)};
    }
   }
  }
 }catch{/* Invalid or blocked storage never prevents order access. */}
 return defaults;
}

/** Reorder known columns without losing hidden columns, widths or required visibility. */
export function reorderTableColumns(order:readonly string[],from:string,to:string):string[]{
 const start=order.indexOf(from),end=order.indexOf(to);
 if(start<0||end<0||start===end)return [...order];
 const next=[...order];next.splice(start,1);next.splice(end,0,from);return next;
}
