import { lazy, Suspense, useEffect, useState } from 'react';
import type { TicketReply } from '../../api/tickets';
import { adminRequest,userRequest } from '../../api/request';
const RichContent=lazy(()=>import('../editor/RichContent'));
function TicketImage({attachment,perspective}:{attachment:TicketReply['attachments'][number];perspective:'Client'|'Admin'}){
 const [url,setUrl]=useState('');const [failed,setFailed]=useState(false);
 useEffect(()=>{const cancel=new AbortController();let objectUrl='';let active=true;setUrl('');setFailed(false);
 const client=perspective==='Admin'?adminRequest:userRequest;const prefix=perspective==='Admin'?'/admin/v1/tickets/':'/api/v1/tickets/';
 if(!attachment.url.startsWith(prefix)||!['image/png','image/jpeg','image/gif','image/webp'].includes(attachment.contentType)){setFailed(true);return;}
 void client.get<Blob>(attachment.url.replace(/^\/(admin|api)\/v1/,''),{responseType:'blob',signal:cancel.signal}).then(response=>{if(!active)return;if(!['image/png','image/jpeg','image/gif','image/webp'].includes(response.data.type)){setFailed(true);return;}objectUrl=URL.createObjectURL(response.data);setUrl(objectUrl);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;cancel.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[attachment.url,attachment.contentType,perspective]);
 return failed?<span className="text-kumo-subtle">图片不可用，请通过附件入口重试。</span>:url?<img className="max-h-80 max-w-full object-contain" src={url} alt={attachment.name}/>:<span className="text-kumo-subtle">正在加载图片…</span>;
}
export function TicketRichContent({reply,perspective}:{reply:TicketReply;perspective:'Client'|'Admin'}){
 return <Suspense fallback={<p className="whitespace-pre-wrap text-sm">{reply.content}</p>}><RichContent value={reply.richContent} fallback={reply.content} renderImage={id=>{const attachment=reply.attachments.find(a=>a.id===id);return attachment?<TicketImage key={id} attachment={attachment} perspective={perspective}/>:<span>[图片附件不可用]</span>;}}/></Suspense>;
}
