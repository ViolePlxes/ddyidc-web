import { useEffect, useState } from "react";
import { Banner, Button, Input } from "@cloudflare/kumo";
import { chooseSocialAccount, completeSocialLogin } from "../../../shared/api/socialAuth";
import { getApiMessage } from "../../../shared/api/request";
import { useAuthStore } from "../../../shared/stores/auth";
import { AuthPageShell, authSubmitClassName } from "../components/AuthPageShell";
import { SocialInitialMobileForm } from "./SocialMobileBinding";

// React StrictMode may mount effects twice. One callback ticket has one exchange.
let completion: ReturnType<typeof completeSocialLogin> | undefined;
export function SocialComplete() {
  const [error, setError] = useState("");
  const [choiceRequired, setChoiceRequired] = useState(false);
  const [choice, setChoice] = useState<"bind" | "register" | null>(null);
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    completion ??= completeSocialLogin();
    void completion.then(payload => {
      if ("accountChoiceRequired" in payload) { setChoiceRequired(true); return; }
      useAuthStore.getState().setSession(payload.user, payload.needBindMobile);
      window.location.replace(payload.needBindMobile ? "/bind-mobile" : "/console");
    }).catch(next => setError(getApiMessage(next)));
  }, []);
  if (choiceRequired && choice === "register") return <SocialInitialMobileForm pendingRegistration onBack={() => setChoice(null)} />;
  if (choiceRequired) return <AuthPageShell title={choice === "bind" ? "绑定已有账号" : "关联你的账号"} description="此第三方账号尚未绑定本地账号，请选择如何继续。">
    {choice === null ? <div className="grid gap-3"><Button variant="secondary" size="lg" onClick={() => setChoice("bind")}>绑定已有账号</Button><Button variant="secondary" size="lg" onClick={() => setChoice("register")}>辅助注册新账号并绑定手机号</Button></div> : <form className="grid gap-5" onSubmit={event => {
      event.preventDefault(); if (saving) return;
      setSaving(true); setError("");
      void chooseSocialAccount({ mode: "bind", countryCode: "+86", mobile: mobile.trim(), password }).then(payload => {
        setPassword(""); useAuthStore.getState().setSession(payload.user, payload.needBindMobile); window.location.replace(payload.needBindMobile ? "/bind-mobile" : "/console");
      }).catch(next => setError(getApiMessage(next))).finally(() => setSaving(false));
    }}><Input label="手机号" value={mobile} onChange={event => setMobile(event.target.value)} inputMode="tel" autoComplete="tel-national" required /><Input label="密码" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required />{error ? <Banner variant="error" title="绑定未完成" description={error} /> : null}<Button type="submit" variant="secondary" size="lg" className={authSubmitClassName} loading={saving}>登录并绑定</Button><Button type="button" variant="ghost" disabled={saving} onClick={() => { setChoice(null); setPassword(""); setError(""); }}>返回账号选择</Button></form>}
  </AuthPageShell>;
  return <AuthPageShell title="完成社交登录" description="正在验证账号并建立登录会话。">
    {error ? <><Banner variant="error" title="登录未完成" description={error} /><Button onClick={() => window.location.replace("/login")}>返回登录</Button></> : <p role="status">正在登录，请稍候…</p>}
  </AuthPageShell>;
}
