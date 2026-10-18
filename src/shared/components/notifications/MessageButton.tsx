import { Badge, Button, Link, useKumoToastManager } from '@cloudflare/kumo';
import { BellIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
import { notificationsApi, type MessageSync } from '../../api/notifications';

interface InboxState {userId:string;count:number;revision:string;connected:boolean;changed:number;marketingToastEnabled:boolean}
let state:InboxState={userId:'',count:0,revision:'0',connected:false,changed:0,marketingToastEnabled:true};
const listeners=new Set<()=>void>();
const update=(patch:Partial<InboxState>)=>{state={...state,...patch};listeners.forEach(f=>f())};
export const useInboxState=()=>useSyncExternalStore(cb=>{listeners.add(cb);return()=>listeners.delete(cb)},()=>state);

export function MessageButton(){
 const userId=String(useAuthStore(s=>s.user?.id)||'');const inbox=useInboxState();const navigate=useNavigate();const manager=useKumoToastManager();const managerRef=useRef(manager);managerRef.current=manager;const navigateRef=useRef(navigate);navigateRef.current=navigate;
 useEffect(()=>{
  update({userId,count:0,revision:'0',connected:false,changed:0});if(!userId)return;
  const lifetime=new AbortController();let source:EventSource|undefined;let retry:ReturnType<typeof setTimeout>|undefined;let attempt=0;let cursor='';let seen=new Set<string>();let channel:BroadcastChannel|undefined;let leading=false;let visibleController:AbortController|undefined;
  try{channel=new BroadcastChannel(`ddyidc:messages:${userId}`)}catch{/* Per-tab fallback remains SSE. */}
  const toastIds:string[]=[];
  const accept=(payload:MessageSync,live:boolean,remote=false)=>{
   if(lifetime.signal.aborted||state.userId!==userId)return;
   if(BigInt(payload.revision)>=BigInt(state.revision))update({count:payload.unreadCount,revision:payload.revision,connected:payload.enabled,marketingToastEnabled:payload.marketingToastEnabled,changed:state.changed+(payload.changes.length?1:0)});
   if(!remote)channel?.postMessage(payload);
   for(const ticketId of new Set(payload.items.filter(m=>m.type==='ticket'&&m.businessType==='ticket').map(m=>m.businessId)))window.dispatchEvent(new CustomEvent('ddyidc:ticket-notification',{detail:{ticketId}}));
   if(!live||remote||document.visibilityState!=='visible')return;
   const items=payload.items.filter(m=>!seen.has(m.id)&&!m.readAt&&(m.type!=='marketing'||payload.marketingToastEnabled));
   payload.items.forEach(m=>seen.add(m.id));if(seen.size>2000)seen=new Set(payload.items.map(m=>m.id));
   for(const m of items.slice(0,3)){const id=managerRef.current.add({title:m.title,description:m.summary,content:<div className="grid gap-1"><Link href={`/console/messages/${m.id}`}>{m.title}</Link><p className="text-base text-kumo-subtle">{m.summary}</p></div>,timeout:5000});if(typeof id==='string')toastIds.push(id)}
   if(items.length>3)managerRef.current.add({title:`收到 ${items.length} 条新消息`,description:'进入消息中心查看全部通知。',actions:[{children:'查看消息',onClick:()=>navigateRef.current('/console/messages')}],timeout:5000});
  };
  if(channel)channel.onmessage=(e:MessageEvent<MessageSync>)=>accept(e.data,false,true);
  const connect=()=>{
   if(lifetime.signal.aborted||!leading)return;
   const connection=new EventSource(`/api/v1/notifications/events${cursor?`?cursor=${encodeURIComponent(cursor)}`:''}`,{withCredentials:true});source=connection;
   source.addEventListener('ready',event=>{const p=JSON.parse((event as MessageEvent<string>).data) as MessageSync;cursor=p.nextCursor;attempt=0;accept(p,false);if(p.resetRequired){cursor='';source?.close();retry=setTimeout(connect,100)}});
   source.addEventListener('replay',event=>{const p=JSON.parse((event as MessageEvent<string>).data) as MessageSync;cursor=p.nextCursor;accept(p,false)});
   source.addEventListener('changed',event=>{const p=JSON.parse((event as MessageEvent<string>).data) as MessageSync;cursor=p.nextCursor;accept(p,true)});
   source.addEventListener('reset_required',()=>{cursor='';source?.close();retry=setTimeout(connect,100)});
   source.addEventListener('unavailable',()=>{source?.close();update({connected:false});void notificationsApi.sync().then(p=>{accept(p,false);if(p.enabled&&leading)retry=setTimeout(connect,1000)}).catch(()=>{if(leading)retry=setTimeout(connect,30000)})});
   source.addEventListener('auth_expired',()=>{source?.close();update({connected:false});void notificationsApi.sync().then(()=>{if(leading)connect()}).catch(()=>window.dispatchEvent(new CustomEvent('ddyidc:user-unauthorized')))});
   source.onerror=()=>{if(source!==connection)return;source?.close();update({connected:false});const delay=Math.min(30000,1000*2**Math.min(attempt++,5));retry=setTimeout(connect,delay+Math.random()*500)};
  };
  const stop=()=>{visibleController?.abort();source?.close();clearTimeout(retry);leading=false};
  const start=()=>{stop();if(document.visibilityState!=='visible'||lifetime.signal.aborted)return;const active=new AbortController();visibleController=active;const run=async()=>{if(active.signal.aborted)return;leading=true;try{const initial=await notificationsApi.sync(active.signal);accept(initial,false);if(initial.enabled&&!active.signal.aborted)connect()}catch{if(!active.signal.aborted)connect()};if(active.signal.aborted)return;await new Promise<void>(resolve=>active.signal.addEventListener('abort',()=>resolve(),{once:true}));leading=false;source?.close();clearTimeout(retry)};
   if(navigator.locks)void navigator.locks.request(`ddyidc:messages:${userId}`,{signal:active.signal},run).catch(()=>{});else void run();
  };
  document.addEventListener('visibilitychange',start);window.addEventListener('online',start);window.addEventListener('ddyidc:notifications-reconnect',start);start();
  return()=>{lifetime.abort();stop();channel?.close();document.removeEventListener('visibilitychange',start);window.removeEventListener('online',start);window.removeEventListener('ddyidc:notifications-reconnect',start);for(const id of toastIds)managerRef.current.close(id);seen.clear();if(state.userId===userId)update({userId:'',count:0,revision:'0',connected:false,changed:0})};
 },[userId]);
 return <div className="relative inline-flex"><Button variant="ghost" shape="square" icon={<BellIcon/>} aria-label={`消息通知，${inbox.count} 条未读${inbox.connected?'':'，连接未就绪'}`} onClick={()=>navigate('/console/messages')}/>{inbox.userId===userId&&inbox.count>0&&<Badge className="pointer-events-none absolute -right-1 -top-1" aria-hidden="true">{inbox.count>99?'99+':inbox.count}</Badge>}</div>;
}
