import {Children,Fragment,isValidElement,type ReactNode,type ReactElement} from 'react';
import type {TableColumn} from './tableLayout';
type Element=ReactElement<Record<string,unknown>>;
export function tableElements(node:ReactNode):Element[]{const result:Element[]=[];Children.forEach(node,item=>{if(isValidElement<Record<string,unknown>>(item)){if(item.type===Fragment)result.push(...tableElements(item.props.children as ReactNode));else result.push(item)}});return result;}
export function tableNodeText(node:ReactNode):string{let text='';Children.forEach(node,item=>{if(typeof item==='string'||typeof item==='number')text+=String(item);else if(isValidElement<Record<string,unknown>>(item))text+=tableNodeText(item.props.children as ReactNode)||String(item.props['aria-label']??item.props.label??'')});return text.trim();}
export interface TableMarkupRow {id:string;props:Record<string,unknown>;cells:Map<string,Element>}
export function projectTableMarkup(children:ReactNode,parts:{Header:unknown;Body:unknown;Row:unknown;Head:unknown;CheckHead:unknown}){
 const roots=tableElements(children),header=roots.find(e=>e.type===parts.Header),body=roots.find(e=>e.type===parts.Body);
 const heads=tableElements(tableElements(header?.props.children as ReactNode)[0]?.props.children as ReactNode);
 const seen=new Map<string,number>();
 const columns:TableColumn[]=heads.map((head,index)=>{const label=tableNodeText(head.props.children as ReactNode)||String(head.props.label??'')||`字段 ${index+1}`;const base=String(head.key??label),count=seen.get(base)??0;seen.set(base,count+1);return {key:`${base}:${count}`,label,width:/时间|日期/.test(label)?180:/说明|内容|备注|商品|产品/.test(label)?240:180,min:96,required:index===0||head.type===parts.CheckHead||/操作|管理|选择|全选/.test(label),type:/金额|余额|价格|费用|数量/.test(label)?'N':'S',header:head as ReactNode}});
 let emptyContent:ReactNode;
 const rows=tableElements(body?.props.children as ReactNode).filter(row=>row.type===parts.Row).flatMap((row,index)=>{const cells=tableElements(row.props.children as ReactNode);if(cells.length===1&&Number(cells[0]?.props.colSpan)>1){emptyContent=cells[0]?.props.children as ReactNode;return []}return [{id:String(row.key??index),props:row.props,cells:new Map(columns.map((column,i)=>[column.key,cells[i]!]).filter((pair):pair is [string,Element]=>Boolean(pair[1])))}]});
 return {columns,rows,emptyContent};
}
