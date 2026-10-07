import { useCallback, useEffect, useRef, useState } from "react";
import { Banner, Button, Loader } from "@cloudflare/kumo";
import { captchaApi, type CaptchaScene, type CaptchaState } from "../../api/captcha";
import { getApiMessage } from "../../api/request";
import { captchaProvider } from "./providers";

export function useHumanVerification(scene: CaptchaScene) {
 const [state, setState] = useState<CaptchaState>();
 const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
 const [grant, setGrant] = useState(""); const [expires, setExpires] = useState(0);
 const [revision, setRevision] = useState(0);
 const host = useRef<HTMLDivElement>(null); const mounted = useRef(true);
 const refresh = useCallback(async () => { const next = await captchaApi.status(scene); if (mounted.current) setState(next); return next; }, [scene]);
 useEffect(() => { mounted.current = true; void refresh().catch(e => { if (mounted.current) setError(getApiMessage(e)); }); return () => { mounted.current = false; }; }, [refresh]);
 useEffect(() => {
  if (!state?.enabled || !state.required || !state.configured || !host.current) return;
  const controller = new AbortController(); const container = host.current;
  setBusy(true);
  const renew = window.setTimeout(() => { setGrant(""); setRevision(value => value + 1); }, 270000);
  void (async () => {
   const challenge = await captchaApi.begin(scene);
   if (controller.signal.aborted) return;
   if (!challenge.required) { await refresh(); setBusy(false); return; }
   if (!challenge.challenge) throw new Error("验证初始化失败");
   await captchaProvider(challenge.provider).mount(challenge, container, controller.signal, {
    onReady: () => { if (!controller.signal.aborted) setBusy(false); },
    onError: message => { if (!controller.signal.aborted) { setBusy(false); setGrant(""); setError(message); } },
    onProof: async proof => {
     if (controller.signal.aborted) return;
     setBusy(true);
     try {
      const result = await captchaApi.verify(scene, challenge.challenge!, proof);
      if (!controller.signal.aborted) { setGrant(result.grant); setExpires(Date.now() + result.expiresIn * 1000); }
     } catch (e) { if (!controller.signal.aborted) { setError(getApiMessage(e)); setGrant(""); setRevision(value => value + 1); } }
     finally { if (!controller.signal.aborted) setBusy(false); }
    }
   });
  })().catch(e => { if (!controller.signal.aborted) { setBusy(false); setError(getApiMessage(e)); } });
  return () => { window.clearTimeout(renew); controller.abort(); container.replaceChildren(); };
 }, [scene, state?.enabled, state?.required, state?.configured, revision, refresh]);
 useEffect(() => { if (!grant) return; const timer = window.setTimeout(() => { setGrant(""); setError("验证已过期，请重新验证"); setRevision(value => value + 1); }, Math.max(0, expires - Date.now())); return () => window.clearTimeout(timer); }, [grant, expires]);
 const reset = async () => { setGrant(""); setError(""); setRevision(value => value + 1); await refresh().catch(e => setError(getApiMessage(e))); };
 const prepare = async () => { const next = await refresh(); if (!next.enabled || !next.required) return ""; if (!grant || expires <= Date.now()) throw new Error("请先完成人机验证"); const value = grant; setGrant(""); return value; };
 const element = state?.enabled && state.required ? <div className="grid gap-3">
  <div ref={host} />
  {busy && <Loader />}
  {!state.configured && <Banner variant="error" title="人机验证配置暂不可用，请联系管理员。" />}
  {error && <Banner variant="error" title={error} />}
  {!busy && error && <Button type="button" variant="secondary" onClick={() => { setError(""); setRevision(value => value + 1); }}>重新加载验证</Button>}
 </div> : error ? <Banner variant="error" title="验证状态读取失败" description={error} /> : null;
 return { element, prepare, reset, busy };
}
