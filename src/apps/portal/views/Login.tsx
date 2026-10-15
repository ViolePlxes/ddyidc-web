import { type FormEvent, useEffect, useState } from "react";
import { Banner, Button, Checkbox, Input } from "@cloudflare/kumo";
import { ArrowRightIcon, UserCircleIcon } from "@phosphor-icons/react";
import { readRememberedProfile, renewUserSession } from "../../../shared/api/refreshSession";
import { getSession } from "../../../shared/api/auth";
import { Link, useLocation } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { useAuthStore } from "../../../shared/stores/auth";
import { useHumanVerification } from "../../../shared/components/captcha/HumanVerification";
import { ExternalRedirect } from "../../../shared/router/EntryGuards";
import { TermsAgreement } from "../components/TermsAgreement";
import { AuthPageShell, SocialLoginOptions, authSubmitClassName } from "../components/AuthPageShell";

const rememberedAccountKey = "ddyidc-remembered-account";
function readRememberedAccount() {
  try { return localStorage.getItem(rememberedAccountKey) ?? ""; } catch { return ""; }
}

export function LoginPage() {
  const human = useHumanVerification("user_login");
  const [account, setAccount] = useState(readRememberedAccount);
  const [rememberMe, setRememberMe] = useState(() => Boolean(readRememberedAccount()));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [quickProfile, setQuickProfile] = useState(readRememberedProfile);
  const [quickLoading, setQuickLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const signIn = useAuthStore((state) => state.signIn);
  const location = useLocation();
  useEffect(() => {
    const update = () => setQuickProfile(readRememberedProfile());
    const timer = window.setInterval(update, 1000);
    window.addEventListener("storage", update);
    return () => { window.clearInterval(timer); window.removeEventListener("storage", update); };
  }, []);

  const switchingAccount = new URLSearchParams(location.search).get("switchAccount") === "1";
  if (user && !quickProfile && !switchingAccount) return <ExternalRedirect to={useAuthStore.getState().needBindMobile ? "/bind-mobile" : "/console"} />;
  const redirect = new URLSearchParams(location.search).get("redirect");
  const safeRedirect = redirect && !redirect.startsWith("//") &&
    (["/cart", "/order/confirm", "/bind-mobile", "/console"].includes(redirect) || redirect.startsWith("/console/")) ? redirect : null;

  const submitCredentials = async () => {
    if (loading) return;
    if (!account.trim() || !password) { setError("请输入账号和密码"); return; }
    setError("");
    try {
      await signIn(account.trim(), password, rememberMe, await human.prepare());
      try {
        if (rememberMe) localStorage.setItem(rememberedAccountKey, account.trim());
        else localStorage.removeItem(rememberedAccountKey);
      } catch { /* Storage availability must not prevent sign-in. */ }
      window.location.replace(useAuthStore.getState().needBindMobile ? "/bind-mobile" : safeRedirect ?? "/console");
    } catch (nextError) { setError(getApiMessage(nextError)); await human.reset(); }
  };
  const quickLogin = async () => {
    if (quickLoading) return;
    setQuickLoading(true); setError("");
    try {
      await renewUserSession();
      const payload = await getSession();
      useAuthStore.getState().setSession(payload.user, payload.needBindMobile);
      window.location.replace(payload.needBindMobile ? "/bind-mobile" : safeRedirect ?? "/console");
    } catch (next) { setQuickProfile(readRememberedProfile()); setError(getApiMessage(next)); }
    finally { setQuickLoading(false); }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void submitCredentials();
  };

  return (
    <AuthPageShell title="欢迎回来" description="请登录你的账户">
      {quickProfile ? <div className="grid gap-2">
        <Button type="button" variant="secondary" className="h-auto w-full min-w-0 justify-start gap-3 p-5" loading={quickLoading} onClick={() => void quickLogin()} aria-label={`以 ${quickProfile.name} 登录`}>
          {quickProfile.avatar?.startsWith("https://") ? <img src={quickProfile.avatar} className="size-10 object-cover" alt="" referrerPolicy="no-referrer" /> : <UserCircleIcon className="size-10" />}
          <span className="truncate">{quickProfile.name}</span>
        </Button>
        <Link className="text-right text-base text-kumo-default hover:underline" to="/login?switchAccount=1" onClick={() => { setAccount(""); setPassword(""); }}>切换账号</Link>
      </div> : null}
      <form className="grid gap-5" onSubmit={submit}>
        <Input label="Email" value={account} onChange={(event) => setAccount(event.target.value)} autoComplete="username" placeholder="邮箱、账号或手机号" required autoFocus />
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-base">
            <label htmlFor="login-password">密码</label>
            <Link className="text-kumo-default hover:underline" to="/reset-password">忘记密码？</Link>
          </div>
          <Input id="login-password" aria-label="密码" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </div>
        <Checkbox label={<span title="保持登录 30 天，活跃访问时自动续期">记住我</span>} checked={rememberMe} onCheckedChange={(checked) => {
          setRememberMe(checked === true);
          if (checked !== true) { try { localStorage.removeItem(rememberedAccountKey); } catch { /* Storage is optional. */ } }
        }} />
        {error && <Banner variant="error" title="登录失败" description={error} />}
        {human.element}
        <div className="grid gap-2">
          <Button type="submit" variant="secondary" size="lg" className={authSubmitClassName} loading={loading}>登录 <ArrowRightIcon /></Button>
          <TermsAgreement />
        </div>
      </form>
      <div className="text-center text-base text-kumo-subtle">新用户？ <Link className="text-kumo-default hover:underline" to="/register">注册</Link></div>
      <SocialLoginOptions rememberMe={rememberMe} />
      {new URLSearchParams(location.search).has("socialError") && <Banner variant="error" title="社交登录未完成" description="授权已取消、过期或账号无法使用，请重新发起登录。" />}
    </AuthPageShell>
  );
}
