import { type FormEvent, useState } from "react";
import { Banner, Button, Checkbox, Input } from "@cloudflare/kumo";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { useAuthStore } from "../../../shared/stores/auth";
import { ExternalRedirect } from "../../../shared/router/EntryGuards";
import { TermsAgreement } from "../components/TermsAgreement";
import { AgreementConsentDialog } from "../components/AgreementConsentDialog";
import { AuthPageShell, SocialLoginOptions, authSubmitClassName } from "../components/AuthPageShell";

const rememberedAccountKey = "ddyidc-remembered-account";
function readRememberedAccount() {
  try { return localStorage.getItem(rememberedAccountKey) ?? ""; } catch { return ""; }
}

export function LoginPage() {
  const [account, setAccount] = useState(readRememberedAccount);
  const [rememberMe, setRememberMe] = useState(() => Boolean(readRememberedAccount()));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const signIn = useAuthStore((state) => state.signIn);
  const location = useLocation();

  if (user) return <ExternalRedirect to="/console" />;
  const redirect = new URLSearchParams(location.search).get("redirect");
  const safeRedirect = redirect && !redirect.startsWith("//") &&
    (["/cart", "/order/confirm", "/bind-mobile", "/console"].includes(redirect) || redirect.startsWith("/console/")) ? redirect : null;

  const submitCredentials = async () => {
    if (loading) return;
    if (!account.trim() || !password) { setError("请输入账号和密码"); return; }
    setError("");
    try {
      await signIn(account.trim(), password, rememberMe);
      try {
        if (rememberMe) localStorage.setItem(rememberedAccountKey, account.trim());
        else localStorage.removeItem(rememberedAccountKey);
      } catch { /* Storage availability must not prevent sign-in. */ }
      window.location.replace(safeRedirect ?? "/console");
    } catch (nextError) { setError(getApiMessage(nextError)); }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!agreedToTerms) { setShowAgreementDialog(true); return; }
    void submitCredentials();
  };

  return (
    <AuthPageShell title="欢迎回来" description="请登录你的账户">
      <form className="grid gap-5" onSubmit={submit}>
        <Input label="Email" value={account} onChange={(event) => setAccount(event.target.value)} autoComplete="username" placeholder="邮箱、账号或手机号" required autoFocus />
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <label htmlFor="login-password">密码</label>
            <Link className="text-kumo-subtle hover:underline" to="/reset-password">忘记密码？</Link>
          </div>
          <Input id="login-password" aria-label="密码" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </div>
        <Checkbox label={<span title="保持登录 30 天，活跃访问时自动续期">记住我</span>} checked={rememberMe} onCheckedChange={(checked) => {
          setRememberMe(checked === true);
          if (checked !== true) { try { localStorage.removeItem(rememberedAccountKey); } catch { /* Storage is optional. */ } }
        }} />
        {error && <Banner variant="error" title="登录失败" description={error} />}
        <Button type="submit" variant="secondary" size="lg" className={authSubmitClassName} loading={loading}>登录 <ArrowRightIcon /></Button>
      </form>
      <div className="text-center text-sm text-kumo-subtle">新用户？ <Link className="text-kumo-default hover:underline" to="/register">注册</Link></div>
      <SocialLoginOptions />
      <TermsAgreement checked={agreedToTerms} onCheckedChange={setAgreedToTerms} />
      <AgreementConsentDialog open={showAgreementDialog} onOpenChange={setShowAgreementDialog} onAgree={() => { setAgreedToTerms(true); setShowAgreementDialog(false); void submitCredentials(); }} />
    </AuthPageShell>
  );
}
