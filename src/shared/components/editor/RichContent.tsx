import { Fragment, type ReactNode } from 'react';
import { Link } from '@cloudflare/kumo';
import type { JSONContent } from '@tiptap/react';
import { safeLink, type RichDocument } from './document';
export default function RichContent({value,fallback,renderImage}:{value?:RichDocument;fallback:string;renderImage?:(id:string)=>ReactNode}) {
 if(!value||value.version!==1||value.doc?.type!=='doc')return <p className="whitespace-pre-wrap [overflow-wrap:anywhere] text-sm">{fallback}</p>;
 let count=0;
 const render=(node:JSONContent,depth=0):ReactNode=>{if(++count>2000||depth>16)return null;const children=node.content?.map((child,i)=><Fragment key={i}>{render(child,depth+1)}</Fragment>);
 switch(node.type){case 'doc':return children;case 'paragraph':return <p className="min-h-5 whitespace-pre-wrap">{children}</p>;case 'text':{let result:ReactNode=node.text||'';for(const mark of node.marks||[]){switch(mark.type){case 'bold':result=<strong className="font-medium">{result}</strong>;break;case 'italic':result=<em>{result}</em>;break;case 'strike':result=<s>{result}</s>;break;case 'code':result=<code className="bg-kumo-recessed px-1 font-mono text-sm">{result}</code>;break;case 'link':if(safeLink(String(mark.attrs?.href||'')))result=<Link href={String(mark.attrs?.href)} target="_blank" rel="noopener noreferrer">{result}</Link>;break;}}return result;}
 case 'hardBreak':return <br/>;case 'bulletList':return <ul className="list-disc pl-5">{children}</ul>;case 'orderedList':return <ol className="list-decimal pl-5" start={Number(node.attrs?.start)||1}>{children}</ol>;case 'listItem':return <li>{children}</li>;case 'blockquote':return <blockquote className="border-l-2 border-kumo-line pl-3 text-kumo-subtle">{children}</blockquote>;case 'codeBlock':return <pre className="max-w-full overflow-x-auto bg-kumo-recessed p-3 text-sm"><code>{children}</code></pre>;case 'image':return typeof node.attrs?.attachmentId==='string'?renderImage?.(node.attrs.attachmentId)||<span>[图片]</span>:null;default:return null;}}
 return <div className="grid min-w-0 gap-2 text-sm text-kumo-default [overflow-wrap:anywhere]">{render(value.doc)}</div>;
}
