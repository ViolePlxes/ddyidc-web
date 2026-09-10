import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { register } from "../../../shared/api/auth";
import { getApiMessage } from "../../../shared/api/request";
import { ExternalRedirect } from "../../../shared/router/EntryGuards";
import { useAuthStore } from "../../../shared/stores/auth";

export function RegisterPage() {
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ account: "", password: "", mobile: "", email: "", inviteCode: "", salesCode: "" });
  const mutation = useMutation({
    mutationFn: () => register(form),
    onSuccess: (payload) => {
      setSession(payload.user, payload.needBindMobile);
      window.location.replace("/console");
    },
  });
  if (user) return <ExternalRedirect to="/console" />;
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate(); };
  return (
    <main className="grid min-h-svh place-items-center bg-kumo-recessed p-4">
      <LayerCard className="grid w-full max-w-lg gap-5 p-6 md:p-8">
        <div className="grid gap-2"><h1 className="text-2xl font-semibold text-kumo-strong">创建客户账号</h1><p className="text-base text-kumo-subtle">注册成功后将直接建立用户端安全会话。</p></div>
        <form className="grid gap-4" onSubmit={submit}>
          <Input label="账号" value={form.account} onChange={(event) => update("account", event.target.value)} autoComplete="username" required />
          <Input label="密码" type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" required />
          <Input label="手机号（可选）" value={form.mobile} onChange={(event) => update("mobile", event.target.value)} inputMode="tel" />
          <Input label="邮箱（可选）" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="邀请码（可选）" value={form.inviteCode} onChange={(event) => update("inviteCode", event.target.value)} />
            <Input label="销售工号（可选）" value={form.salesCode} onChange={(event) => update("salesCode", event.target.value)} />
          </div>
          {mutation.error ? <Banner variant="error" title="注册失败" description={getApiMessage(mutation.error)} /> : null}
          <Button type="submit" loading={mutation.isPending}>创建账号</Button>
        </form>
        <div className="text-center text-sm text-kumo-subtle">已有账号？ <Link className="text-kumo-link hover:underline" to="/login">返回登录</Link></div>
      </LayerCard>
    </main>
  );
}
