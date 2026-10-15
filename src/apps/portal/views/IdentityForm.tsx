import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { CountryCode } from "libphonenumber-js";
import { PhoneCountrySelect } from "../../../shared/components/PhoneCountrySelect";
import { PageHeader } from "../../../shared/components/PageHeader";
import { userRequest, getApiMessage, type ApiEnvelope } from "../../../shared/api/request";
import type { AuthPayload } from "../../../shared/types/auth";
import { useAuthStore } from "../../../shared/stores/auth";
import { AuthPageShell, authSubmitClassName } from "../components/AuthPageShell";

export function IdentityForm({ mode }: { mode: "bind" | "reset" }) {
  const [country, setCountry] = useState<CountryCode>("CN");
  const [countryCode, setCountryCode] = useState("+86");
  const [mobile, setMobile] = useState("");
  const [smsCode, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [validation, setValidation] = useState("");
  const binding = mode === "bind";
  const setSession = useAuthStore(s => s.setSession);
  const clearSession = useAuthStore(s => s.clearSession);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(n => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);
  const send = useMutation({
    mutationFn: async () => {
      if (countryCode !== "+86" || !/^1[3-9]\d{9}$/.test(mobile.trim())) throw new Error("请输入支持的中国大陆手机号");
      const response = await userRequest.post<ApiEnvelope<unknown>>("/auth/sms/send", { countryCode, mobile: mobile.trim(), scene: binding ? "bindMobile" : "reset" });
      if (response.data.code !== 0) throw new Error(response.data.message || "验证码发送失败");
    },
    onSuccess: () => setCountdown(60),
  });
  const save = useMutation({
    mutationFn: async () => {
      const response = await userRequest.post<ApiEnvelope<AuthPayload | { saved: boolean }>>(`/auth/${binding ? "bind-mobile" : "reset-password"}`, { countryCode, mobile: mobile.trim(), smsCode: smsCode.trim(), password });
      if (response.data.code !== 0) throw new Error(response.data.message || "账号信息更新失败");
      return response.data.data;
    },
    onSuccess: payload => {
      setPassword(""); setConfirmation(""); setCode("");
      if (binding && "user" in payload) setSession(payload.user, payload.needBindMobile);
      else clearSession();
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault(); setValidation("");
    if (countryCode !== "+86" || !/^1[3-9]\d{9}$/.test(mobile.trim()) || !/^\d{6}$/.test(smsCode.trim()) || password.length < 6 || password.length > 20) { setValidation("请检查手机号、6位验证码和6-20位密码"); return; }
    if (!binding && password !== confirmation) { setValidation("两次密码输入不一致"); return; }
    save.mutate();
  };
  const content = save.isSuccess ? <><Banner title={binding ? "手机号已绑定" : "密码已重置，请重新登录"} /><Link to={binding ? "/console" : "/login"}>{binding ? "进入用户中心" : "返回登录"}</Link></> : <form className="grid gap-4" onSubmit={submit}>
        <PhoneCountrySelect value={country} onChange={(value, code) => { setCountry(value); setCountryCode(code); }} />
        <Input label={binding ? "手机号" : "已绑定手机号"} value={mobile} onChange={e => setMobile(e.target.value)} inputMode="tel" autoComplete="tel-national" required />
        <div className="flex items-end gap-2"><Input label="短信验证码" value={smsCode} onChange={e => setCode(e.target.value)} maxLength={6} inputMode="numeric" autoComplete="one-time-code" required /><Button type="button" variant="secondary" disabled={countdown > 0 || save.isPending} loading={send.isPending} onClick={() => send.mutate()}>{countdown ? `${countdown}秒后重发` : "获取验证码"}</Button></div>
        <Input label={binding ? "当前登录密码" : "新密码"} type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete={binding ? "current-password" : "new-password"} minLength={6} maxLength={20} required />
        {!binding ? <Input label="确认新密码" type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" minLength={6} maxLength={20} required /> : null}
        {send.isSuccess ? <Banner title="验证码已发送，请注意查收" /> : null}
        {validation || save.error || send.error ? <Banner variant="error" title="未完成操作" description={validation || getApiMessage(save.error ?? send.error)} /> : null}
        <Button type="submit" variant={binding ? "secondary" : "primary"} className={binding ? authSubmitClassName : undefined} loading={save.isPending} disabled={send.isPending}>{binding ? "完成绑定" : "重置密码"}</Button>
      </form>;
  if (binding) return <AuthPageShell unstyledBackground title="绑定手机号" description="验证当前密码及手机后完成首次绑定。">{content}</AuthPageShell>;
  return <div className="mx-auto grid w-full max-w-lg gap-6 py-10"><PageHeader title="找回密码" description="验证已绑定手机号后设置新密码，原有登录将失效。" /><LayerCard className="grid gap-4 px-6 py-5">{content}</LayerCard></div>;
}
