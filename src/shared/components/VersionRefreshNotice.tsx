import { Banner, Button } from "@cloudflare/kumo";
import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";

/** Never auto-reload an old tab or discard unsaved input after asset reclamation. */
export function VersionRefreshNotice(){
 const [changed,setChanged]=useState(false),[confirm,setConfirm]=useState(false);
 useEffect(()=>{
  let dirty=false,alive=true,outdated=false;
  const error=(event:Event)=>{event.preventDefault();outdated=true;setChanged(true)};
  const input=()=>{dirty=true};
  const unload=(event:BeforeUnloadEvent)=>{if(outdated&&dirty){event.preventDefault();event.returnValue=""}};
  const check=async()=>{try{const r=await fetch("/version.json",{cache:"no-store"});if(r.ok){const data=await r.json() as {version?:string};if(alive&&data.version&&data.version!==import.meta.env.VITE_DDYIDC_VERSION){outdated=true;setChanged(true)}}}catch{/* Retry on next poll; network failure is not a new version. */}};
  window.addEventListener("vite:preloadError",error);document.addEventListener("input",input,true);window.addEventListener("beforeunload",unload);
  const timer=window.setInterval(()=>{void check()},60_000);
  return ()=>{alive=false;clearInterval(timer);window.removeEventListener("vite:preloadError",error);document.removeEventListener("input",input,true);window.removeEventListener("beforeunload",unload)};
 },[]);
 return <>{changed?<Banner variant="alert" title="系统版本已更新" description="旧页面资源已更新，请先保存当前内容，再刷新加载新版本。" action={<Button variant="secondary" onClick={()=>setConfirm(true)}>刷新页面</Button>}/>:null}
 <Dialog.Root open={confirm} onOpenChange={setConfirm}><Dialog><Dialog.Title>确认刷新页面</Dialog.Title><Dialog.Description>请先保存或复制尚未提交的内容，刷新后未保存内容可能丢失。</Dialog.Description><div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={()=>setConfirm(false)}>暂不刷新</Button><Button onClick={()=>window.location.reload()}>确认刷新</Button></div></Dialog></Dialog.Root></>;
}
