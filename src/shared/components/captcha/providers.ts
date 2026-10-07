import type { CaptchaState } from "../../api/captcha";

export interface CaptchaCallbacks {
 onReady(): void;
 onProof(proof: Record<string, string>): Promise<void>;
 onError(message: string): void;
}
export interface CaptchaProvider {
 mount(state: CaptchaState, host: HTMLElement, signal: AbortSignal, callbacks: CaptchaCallbacks): Promise<void>;
}
interface GeetestInstance {
 appendTo(host: HTMLElement): void;
 onReady(cb: () => void): GeetestInstance;
 onSuccess(cb: () => void): GeetestInstance;
 onError(cb: () => void): GeetestInstance;
 getValidate(): Record<string, string> | false;
 destroy(): void;
}
declare global { interface Window { initGeetest4?: (config: Record<string, unknown>, cb: (instance: GeetestInstance) => void) => void } }
let loading: Promise<void> | undefined;
function loadGeetest(): Promise<void> {
 if (window.initGeetest4) return Promise.resolve();
 if (!loading) loading = new Promise((resolve, reject) => {
  const script = document.createElement("script");
  script.src = "https://static.geetest.com/v4/gt4.js"; script.async = true;
  script.referrerPolicy = "strict-origin-when-cross-origin";
  const timer = window.setTimeout(() => { script.remove(); loading = undefined; reject(new Error("验证组件加载超时，请重试")); }, 15000);
  script.onload = () => { window.clearTimeout(timer); if (window.initGeetest4) resolve(); else { loading = undefined; reject(new Error("验证组件加载失败")); } };
  script.onerror = () => { window.clearTimeout(timer); script.remove(); loading = undefined; reject(new Error("验证组件加载失败，请检查网络后重试")); };
  document.head.append(script);
 });
 return loading;
}
const geetest: CaptchaProvider = {
 async mount(state, host, signal, callbacks) {
  await loadGeetest(); if (signal.aborted) return;
  await new Promise<void>((resolve, reject) => {
   let instance: GeetestInstance | undefined; let ready = false; let submitted = false; let disposed = false;
   const destroy = () => { disposed = true; window.clearTimeout(timer); try { instance?.destroy(); } catch { /* SDK cleanup must not interrupt unmount. */ } signal.removeEventListener("abort", destroy); resolve(); };
   const fail = () => { if (signal.aborted) return; const message = "验证服务异常，请稍后重试"; if (ready) callbacks.onError(message); else reject(new Error(message)); destroy(); };
   const timer = window.setTimeout(fail, 15000);
   signal.addEventListener("abort", destroy, { once: true });
   try {
    window.initGeetest4!({ captchaId: state.siteId, product: "popup", language: "zho", protocol: "https://", nativeButton: { width: "100%", height: "50px" }, timeout: 10000 }, captcha => {
     instance = captcha; if (signal.aborted || disposed) { destroy(); return; }
     captcha.onReady(() => { if (!signal.aborted) { ready = true; window.clearTimeout(timer); callbacks.onReady(); resolve(); } })
      .onSuccess(() => { if (signal.aborted || submitted) return; const proof = captcha.getValidate(); if (!proof) { fail(); return; } submitted = true; void callbacks.onProof(proof).catch(() => callbacks.onError("验证未通过，请重试")); })
      .onError(fail);
     captcha.appendTo(host);
    });
   } catch { fail(); }
  });
 }
};
// Business login only consumes the platform grant; vendor rendering stays here.
const providers: Readonly<Record<string, CaptchaProvider>> = { geetest };
export function captchaProvider(name: string): CaptchaProvider {
 const provider = providers[name]; if (!provider) throw new Error("当前验证服务商尚未接入"); return provider;
}
