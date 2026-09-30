import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { CountryCode } from "libphonenumber-js";
import { IdentityForm } from "./IdentityForm";
import { socialAuthApi } from "../../../shared/api/socialAuth";
import { userRequest, getApiMessage, type ApiEnvelope } from "../../../shared/api/request";
import { readRememberedProfile, saveRefreshSession, type RefreshPayload } from "../../../shared/api/refreshSession";
import { PhoneCountrySelect } from "../../../shared/components/PhoneCountrySelect";
import { PageHeader } from "../../../shared/components/PageHeader";
import { FormSkeleton } from "../../../shared/components/skeletons";
import { useAuthStore } from "../../../shared/stores/auth";
import type { AuthPayload } from "../../../shared/types/auth";

// The existing password + SMS form stays unchanged. Only social registrations
// with their original generated password enter the first-password form below.
export function MobileBindingPage() {
  const profile = useQuery({ queryKey: ["social-initial-profile"], queryFn: socialAuthApi.profile, retry: false, staleTime: 0 });
  if (profile.isLoading) return <FormSkeleton rows={4} />;
  if (profile.error) return <Banner variant="error" title="读取账号状态失败" description={getApiMessage(profile.error)} />;
  return profile.data?.initialPasswordRequired ? <SocialInitialMobileForm /> : <IdentityForm mode="bind" />;
}

function SocialInitialMobileForm() {
  const [country, setCountry] = useState<CountryCode>("CN");
  const [countryCode, setCountryCode] = useState("+86");
  const [mobile, setMobile] = useState("");
  const [smsCode, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [validation, setValidation] = useState("");
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(n => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);
  const send = useMutation({
    mutationFn: async () => {
      if (countryCode !== "+86" || !/^1[3-9]\d{9}$/.test(mobile.trim())) throw new Error("请输入支持的中国大陆手机号");
      const response = await userRequest.post<ApiEnvelope<unknown>>("/auth/sms/send", { countryCode, mobile: mobile.trim(), scene: "bindMobile" });
      if (response.data.code !== 0) throw new Error(response.data.message || "验证码发送失败");
    },
    onSuccess: () => setCountdown(60),
  });
  const save = useMutation({
    mutationFn: async () => {
      const response = await userRequest.post<ApiEnvelope<AuthPayload>>("/auth/social/bind-mobile", { countryCode, mobile: mobile.trim(), smsCode: smsCode.trim(), password, rememberMe: Boolean(readRememberedProfile()) });
      if (response.data.code !== 0) throw new Error(response.data.message || "绑定失败");
      return response.data.data;
    },
    onSuccess: payload => {
      setPassword(""); setConfirmation(""); setCode("");
      saveRefreshSession(payload as AuthPayload & RefreshPayload, payload.rememberMe === true);
      useAuthStore.getState().setSession(payload.user, payload.needBindMobile);
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault(); setValidation("");
    if (countryCode !== "+86" || !/^1[3-9]\d{9}$/.test(mobile.trim()) || !/^\d{6}$/.test(smsCode.trim()) || password.length < 6 || password.length > 20) { setValidation("请检查手机号、6位验证码和6-20位新密码"); return; }
    if (password !== confirmation) { setValidation("两次密码输入不一致"); return; }
    save.mutate();
  };
  return <div className="mx-auto grid w-full max-w-lg gap-6 py-10">
    <PageHeader title="绑定手机号" description="验证手机号并设置登录密码后进入用户中心。" />
    <LayerCard className="grid gap-4 p-6">
      {save.isSuccess ? <><Banner title="手机号已绑定" /><Link to="/console">进入用户中心</Link></> : <form className="grid gap-4" onSubmit={submit}>
        <PhoneCountrySelect value={country} onChange={(value, code) => { setCountry(value); setCountryCode(code); }} />
        <Input label="手机号" value={mobile} onChange={e => setMobile(e.target.value)} inputMode="tel" autoComplete="tel-national" required />
        <div className="flex items-end gap-2"><Input label="短信验证码" value={smsCode} onChange={e => setCode(e.target.value)} maxLength={6} inputMode="numeric" autoComplete="one-time-code" required /><Button type="button" variant="secondary" disabled={countdown > 0 || save.isPending} loading={send.isPending} onClick={() => send.mutate()}>{countdown ? `${countdown}秒后重发` : "获取验证码"}</Button></div>
        <Input label="新密码" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" minLength={6} maxLength={20} required />
        <Input label="确认新密码" type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" minLength={6} maxLength={20} required />
        {send.isSuccess ? <Banner title="验证码已发送，请注意查收" /> : null}
        {validation || save.error || send.error ? <Banner variant="error" title="未完成操作" description={validation || getApiMessage(save.error ?? send.error)} /> : null}
        <Button type="submit" loading={save.isPending} disabled={send.isPending}>完成绑定</Button>
      </form>}
    </LayerCard>
  </div>;
}
