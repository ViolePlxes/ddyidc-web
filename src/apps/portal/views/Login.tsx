import { FormEvent, useState } from "react";
import { Button, Input, LayerCard } from "@cloudflare/kumo";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import { checkAccount } from "../../../shared/api/auth";
import { getApiMessage } from "../../../shared/api/request";
import { useAuthStore } from "../../../shared/stores/auth";
import { ExternalRedirect } from "../../../shared/router/EntryGuards";
import { TermsAgreement } from "../components/TermsAgreement";

type LoginStep = "account" | "password";

export function LoginPage() {
  const [step, setStep] = useState<LoginStep>("account");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const signIn = useAuthStore((state) => state.signIn);
  const location = useLocation();

  if (user) return <ExternalRedirect to="/console" />;

  const redirect = new URLSearchParams(location.search).get("redirect");
  const safeRedirect =
    redirect &&
    !redirect.startsWith("//") &&
    (redirect === "/cart" ||
      redirect === "/order/confirm" ||
      redirect === "/bind-mobile" ||
      redirect === "/console" ||
      redirect.startsWith("/console/"))
      ? redirect
      : null;

  const handleAccount = async (event: FormEvent) => {
    event.preventDefault();
    const value = account.trim();
    if (!value) {
      setError("请输入账号、邮箱或手机号");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const exists = await checkAccount(value);
      if (!exists) {
        setError("未找到该账号，请检查后重试");
        return;
      }
      setAccount(value);
      setStep("password");
    } catch (nextError) {
      setError(getApiMessage(nextError));
    } finally {
      setChecking(false);
    }
  };

  const handlePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!password) {
      setError("请输入密码");
      return;
    }
    setError("");
    try {
      await signIn(account, password);
      window.location.replace(safeRedirect ?? "/console");
    } catch (nextError) {
      setError(getApiMessage(nextError));
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-kumo-recessed p-4">
      <div className="grid w-full max-w-md gap-6">
        <LayerCard className="grid gap-6 p-6 md:p-8">
          <div className="grid gap-2">
            <h1 className="text-2xl font-semibold text-kumo-strong">
              {step === "account" ? "登录控制台" : "输入密码"}
            </h1>
            <p className="text-base text-kumo-subtle">
              {step === "account"
                ? "使用你的客户账号继续，管理与销售入口相互独立。"
                : account}
            </p>
          </div>
          {step === "account" ? (
            <form
              className="grid gap-5"
              onSubmit={(event) => void handleAccount(event)}
            >
              <Input
                label="账号"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                autoComplete="username"
                placeholder="账号、邮箱或手机号"
                error={error || undefined}
                autoFocus
              />
              <Button
                type="submit"
                loading={checking}
                disabled={!agreedToTerms}
                icon={<ArrowRightIcon />}
              >
                下一步
              </Button>
            </form>
          ) : (
            <form
              className="grid gap-5"
              onSubmit={(event) => void handlePassword(event)}
            >
              <Input
                label="密码"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                error={error || undefined}
                autoFocus
              />
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  icon={<ArrowLeftIcon />}
                  onClick={() => {
                    setStep("account");
                    setError("");
                    setPassword("");
                  }}
                >
                  返回
                </Button>
                <Button type="submit" loading={loading} disabled={!agreedToTerms}>
                  登录
                </Button>
              </div>
            </form>
          )}
          <TermsAgreement checked={agreedToTerms} onCheckedChange={setAgreedToTerms} />
          <div className="flex items-start gap-2 border-t border-kumo-line pt-4 text-sm text-kumo-subtle">
            <ShieldCheckIcon className="mt-0.5 shrink-0" />
            <span>登录凭据通过 httpOnly Cookie 与服务端会话保护。</span>
          </div>
          <div className="text-center text-sm text-kumo-subtle">
            还没有客户账号？ <Link className="text-kumo-link hover:underline" to="/register">创建账号</Link>
          </div>
        </LayerCard>
      </div>
    </main>
  );
}
