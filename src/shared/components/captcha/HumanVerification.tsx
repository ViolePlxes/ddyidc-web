import { useCallback, useEffect, useRef, useState } from "react";
import { Banner, Button, Checkbox, Loader } from "@cloudflare/kumo";
import { captchaApi, type CaptchaScene, type CaptchaState } from "../../api/captcha";
import { getApiMessage } from "../../api/request";
import { captchaProvider } from "./providers";

export function useHumanVerification(scene:CaptchaScene){
 const [state,setState]=useState<CaptchaState>();const [error,setError]=useState("");const [busy,setBusy]=useState(false);const [grant,setGrant]=useState("");const [expires,setExpires]=useState(0);
 const active=useRef<AbortController | undefined>(undefined);const mounted=useRef(true);
 const refresh=useCallback(async()=>{const next=await captchaApi.status(scene);if(mounted.current)setState(next);return next;},[scene]);
 useEffect(()=>{mounted.current=true;void refresh().catch(e=>{if(mounted.current)setError(getApiMessage(e));});return()=>{mounted.current=false;active.current?.abort();};},[refresh]);
 useEffect(()=>{if(!grant)return;const timer=window.setTimeout(()=>{setGrant("");setError("验证已过期，请重新验证");},Math.max(0,expires-Date.now()));return()=>window.clearTimeout(timer);},[grant,expires]);
 const reset=async()=>{setGrant("");await refresh().catch(e=>setError(getApiMessage(e)));};
 const prepare=async()=>{const next=await refresh();if(!next.enabled||!next.required)return "";if(!grant||expires<=Date.now())throw new Error("请先完成“我不是机器人”验证");const value=grant;setGrant("");return value;};
 const solve=async()=>{
  if(busy||grant)return;setBusy(true);setError("");setGrant("");active.current?.abort();const controller=new AbortController();active.current=controller;
  try{const challenge=await captchaApi.begin(scene);if(!challenge.required){await refresh();return;}if(!challenge.challenge)throw new Error("验证初始化失败");const proof=await captchaProvider(challenge.provider).solve(challenge,controller.signal);if(controller.signal.aborted)return;const result=await captchaApi.verify(scene,challenge.challenge,proof);if(mounted.current){setGrant(result.grant);setExpires(Date.now()+result.expiresIn*1000);}}
  catch(e){if(mounted.current&&!controller.signal.aborted)setError(getApiMessage(e));}finally{if(mounted.current)setBusy(false);}
 };
 const element=state?.enabled&&state.required?<div className="grid gap-3 border border-kumo-line p-4">
  <Checkbox label={busy?"正在验证…":grant?"验证通过":"我不是机器人"} checked={Boolean(grant)} disabled={busy||Boolean(grant)} onCheckedChange={()=>void solve()}/>
  {busy&&<Loader/>}{!state.configured&&<p className="text-sm text-kumo-subtle">人机验证配置暂不可用，请联系管理员。</p>}
  {error&&<Banner variant="error" title={error}/>}<p className="text-xs text-kumo-subtle">{state.provider==="geetest"?"验证服务由极验提供，":""}异常请求可能需要进一步验证。</p>
  {!busy&&!grant&&error&&<Button type="button" variant="secondary" onClick={()=>void solve()}>重新验证</Button>}
 </div>:error?<Banner variant="error" title="验证状态读取失败" description={error}/>:null;
 return {element,prepare,reset,busy};
}
