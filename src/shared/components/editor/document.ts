import type { JSONContent } from '@tiptap/react';
export interface RichDocument { version: 1; doc: JSONContent }
export interface EditorImage { attachmentId: string; src: string; revoke?: () => void }
export function safeLink(value: string): boolean { try { const url=new URL(value);return value.length<=2048 && ['https:','http:'].includes(url.protocol) && !url.username && !url.password && !/[\r\n\t]/.test(value); } catch {return false;} }
export function plainDocument(text: string): JSONContent { return {type:'doc',content:text.split('\n').map(line=>({type:'paragraph',...(line?{content:[{type:'text',text:line}]}:{})}))}; }
export function serializeDocument(doc: JSONContent): RichDocument {
 const clean=(node:JSONContent):JSONContent=>({type:node.type,...(node.text?{text:node.text}:{}),...(node.type==='image'?{attrs:{attachmentId:node.attrs?.attachmentId}}:node.type==='orderedList'?{attrs:{start:node.attrs?.start||1}}:node.type==='codeBlock'?{attrs:{language:node.attrs?.language||null}}:{}),...(node.marks?.length?{marks:node.marks.map(mark=>({type:mark.type,...(mark.type==='link'?{attrs:{href:mark.attrs?.href}}:{})}))}:{}),...(node.content?.length?{content:node.content.map(clean)}:{})});
 return {version:1,doc:clean(doc)};
}
export function documentText(node: JSONContent): string { if(node.type==='text')return node.text||'';if(node.type==='hardBreak')return '\n';if(node.type==='image')return '[图片]\n';return (node.content||[]).map(documentText).join('')+(['paragraph','codeBlock'].includes(node.type||'')?'\n':''); }
