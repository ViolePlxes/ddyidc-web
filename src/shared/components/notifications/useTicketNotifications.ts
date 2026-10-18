import { useEffect, useRef } from 'react';

// Replies use the shared SSE channel. There is no interval or polling fallback.
export function useTicketNotifications(load:()=>Promise<void>,enabled:boolean,ticketId?:string){
 const latest=useRef(load);latest.current=load;
 useEffect(()=>{if(!enabled)return;let stopped=false,running=false,pending=false;
  const run=async()=>{if(stopped||document.visibilityState!=='visible')return;if(running){pending=true;return};running=true;try{await latest.current()}catch{/* Existing page state and manual refresh remain available. */}finally{running=false;if(pending&&!stopped){pending=false;void run()}}};
  const event=(raw:Event)=>{const id=(raw as CustomEvent<{ticketId:string}>).detail?.ticketId;if(!ticketId||id===ticketId)void run()};
  const visible=()=>{if(document.visibilityState==='visible')void run()};
  window.addEventListener('ddyidc:ticket-notification',event);document.addEventListener('visibilitychange',visible);
  return()=>{stopped=true;window.removeEventListener('ddyidc:ticket-notification',event);document.removeEventListener('visibilitychange',visible)};
 },[enabled,ticketId]);
}
