import type { CaptchaState } from "../../api/captcha";

export interface CaptchaProvider { solve(state: CaptchaState, signal: AbortSignal): Promise<Record<string,string>> }
interface GeetestInstance {
 onReady(cb:()=>void): GeetestInstance;
 onSuccess(cb:()=>void): GeetestInstance;
 onError(cb:()=>void): GeetestInstance;
 onClose(cb:()=>void): GeetestInstance;
 showCaptcha():void;
 getValidate(): Record<string,string> | false;
 destroy():void;
}
declare global { interface Window { initGeetest4?: (config:Record<string,unknown>,cb:(instance:GeetestInstance)=>void)=>void } }
let loading: Promise<void> | undefined;
function loadGeetest():Promise<void> {
 if(window.initGeetest4)return Promise.resolve();
 if(!loading)loading=new Promise<void>((resolve,reject)=>{
  const script=document.createElement("script");script.src="https://static.geetest.com/v4/gt4.js";script.async=true;script.referrerPolicy="strict-origin-when-cross-origin";
  const timer=window.setTimeout(()=>{script.remove();loading=undefined;reject(new Error("验证组件加载超时，请重试"));},15000);
  script.onload=()=>{window.clearTimeout(timer);if(window.initGeetest4)resolve();else{loading=undefined;reject(new Error("验证组件加载失败"));}};
  script.onerror=()=>{window.clearTimeout(timer);script.remove();loading=undefined;reject(new Error("验证组件加载失败，请检查网络后重试"));};document.head.append(script);
 });
 return loading;
}
const geetest:CaptchaProvider={solve:async(state,signal)=>{
 await loadGeetest();if(signal.aborted)throw new Error("验证已取消");
 return new Promise((resolve,reject)=>{
  let instance:GeetestInstance|undefined;let finished=false;
  const finish=(proof?:Record<string,string>,error?:string)=>{if(finished)return;finished=true;window.clearTimeout(timer);signal.removeEventListener("abort",cancel);try{instance?.destroy();}catch{/* Cleanup must not suppress a completed verification. */}if(proof)resolve(proof);else reject(new Error(error??"验证已取消"));};
  const cancel=()=>finish(undefined,"验证已取消");signal.addEventListener("abort",cancel,{once:true});
  const timer=window.setTimeout(()=>finish(undefined,"验证已超时，请重新验证"),180000);
  window.initGeetest4!({captchaId:state.siteId,product:"bind",language:"zho",protocol:"https://",apiServers:["gcaptcha4.geetest.com"],timeout:10000},captcha=>{
   instance=captcha;if(finished){captcha.destroy();return;}
   captcha.onReady(()=>{if(!finished)captcha.showCaptcha();}).onSuccess(()=>{const proof=captcha.getValidate();if(proof)finish(proof);else finish(undefined,"验证结果无效，请重试");}).onClose(()=>finish()).onError(()=>finish(undefined,"验证服务异常，请稍后重试"));
  });
 });
}};
// New vendors implement this browser adapter and the corresponding server
// Provider; login pages consume only a platform grant.
const providers:Readonly<Record<string,CaptchaProvider>>={geetest};
export function captchaProvider(name:string):CaptchaProvider {const provider=providers[name];if(!provider)throw new Error("当前验证服务商尚未接入");return provider;}
