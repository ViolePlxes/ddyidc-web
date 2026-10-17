import { lazy, Suspense } from 'react';
import type { RichDocument } from '../editor/document';
import { userTicketApi, adminTicketApi, type TicketAttachment } from '../../api/tickets';
const RichTextEditor=lazy(()=>import('../editor/RichTextEditor'));
export function TicketReplyEditor({text,value,disabled,onChange,attachments,onUploaded,onUploadingChange,perspective='Client',label='回复内容',fill=false,hideLabel=false}:{text:string;value?:RichDocument;disabled:boolean;onChange:(text:string,value:RichDocument)=>void;attachments:TicketAttachment[];onUploaded:(rows:TicketAttachment[])=>void;onUploadingChange:(loading:boolean)=>void;perspective?:'Client'|'Admin';label?:string;fill?:boolean | "viewport";hideLabel?:boolean}){
 return <Suspense fallback={<p className="text-sm text-kumo-subtle">正在加载编辑器…</p>}><RichTextEditor fill={fill} hideLabel={hideLabel} imageIds={attachments.map(item=>item.id)} label={label} text={text} value={value} disabled={disabled} onChange={onChange} uploadImages={async files=>{
 if(files.length+attachments.length>5)throw Error('每条消息最多5个附件，请先移除不需要的附件。');onUploadingChange(true);
 try {const rows=await (perspective==='Admin'?adminTicketApi:userTicketApi).upload(files);if(rows.length!==files.length)throw Error('图片上传结果不完整，请重试');onUploaded(rows);return rows.map((row,i)=>{const src=URL.createObjectURL(files[i]!);return {attachmentId:row.id,src,revoke:()=>URL.revokeObjectURL(src)};});}finally{onUploadingChange(false);}
 }}/></Suspense>;
}
