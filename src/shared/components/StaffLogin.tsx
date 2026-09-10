import { FormEvent, useState } from "react";
import { Badge, Button, Input, LayerCard } from "@cloudflare/kumo";
import { ShieldCheckIcon } from "@phosphor-icons/react";
import { useLocation } from "react-router-dom";
import { getApiMessage } from "../api/request";
import type { AuthUser } from "../types/auth";
import { ExternalRedirect } from "../router/EntryGuards";

export function StaffLogin({
  title,
  subtitle,
  roleLabel,
  homePath,
  expectedRole,
  user,
  loading,
  signIn,
}: {
  title: string;
  subtitle: string;
  roleLabel: string;
  homePath: string;
  expectedRole: "admin" | "sales";
  user: AuthUser | null;
  loading: boolean;
  signIn: (account: string, password: string) => Promise<AuthUser>;
}) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();

  if (user?.role === expectedRole) return <ExternalRedirect to={homePath} />;

  const redirect = new URLSearchParams(location.search).get("redirect");
  const safeRedirect =
    redirect?.startsWith(homePath) && !redirect.startsWith("//")
      ? redirect
      : homePath;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!account.trim() || !password) {
      setError("请输入账号和密码");
      return;
    }
    setError("");
    try {
      const nextUser = await signIn(account.trim(), password);
      if (nextUser.role !== expectedRole) {
        setError("该账号无权访问此入口");
        return;
      }
      window.location.replace(safeRedirect);
    } catch (nextError) {
      setError(getApiMessage(nextError));
    }
  };

  return (
    <main className="grid min-h-svh place-items-center bg-kumo-recessed p-4">
      <div className="grid w-full max-w-sm gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold text-kumo-strong">DDYIDC</span>
            <span className="text-xs text-kumo-subtle">v1.0.0 · 开发环境</span>
          </div>
          <Badge variant="secondary">{roleLabel}</Badge>
        </div>
        <LayerCard className="grid gap-5 p-6">
          <div className="grid gap-1">
            <h1 className="text-xl font-semibold text-kumo-strong">{title}</h1>
            <p className="text-sm text-kumo-subtle">{subtitle}</p>
          </div>
          <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <Input
              label="账号"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              autoComplete="username"
              placeholder={`${roleLabel}账号`}
              autoFocus
            />
            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              error={error || undefined}
            />
            <Button type="submit" loading={loading} className="w-full">
              登录{title}
            </Button>
          </form>
          <div className="flex items-start gap-2 border-t border-kumo-line pt-4 text-xs text-kumo-subtle">
            <ShieldCheckIcon className="mt-0.5 shrink-0" />
            <span>此入口使用独立的 httpOnly Cookie 与服务端会话。</span>
          </div>
        </LayerCard>
      </div>
    </main>
  );
}
