import { Banner, Button, Input, LayerCard, Select } from "@cloudflare/kumo";
import { useMutation } from "@tanstack/react-query";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { register, sendRegistrationSMS } from "../../../shared/api/auth";
import { getApiMessage } from "../../../shared/api/request";
import { ExternalRedirect } from "../../../shared/router/EntryGuards";
import { useAuthStore } from "../../../shared/stores/auth";
import { TermsAgreement } from "../components/TermsAgreement";

type RegistrationForm = {
  account: string;
  password: string;
  country: CountryCode;
  mobile: string;
  smsCode: string;
  email: string;
  inviteCode: string;
  salesCode: string;
  agreedToTerms: boolean;
};

const mainlandMobilePattern = /^1[3-9]\d{9}$/;

export function RegisterPage() {
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState<RegistrationForm>({
    account: "",
    password: "",
    country: "CN",
    mobile: "",
    smsCode: "",
    email: "",
    inviteCode: "",
    salesCode: "",
    agreedToTerms: false,
  });
  const [mobileError, setMobileError] = useState("");
  const [smsMessage, setSMSMessage] = useState("");
  const [smsError, setSMSError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const countryNames = useMemo(
    () => new Intl.DisplayNames(["zh-CN"], { type: "region" }),
    [],
  );
  const countries = useMemo(
    () =>
      getCountries()
        .map((country) => ({
          value: country,
          label: `${countryNames.of(country) ?? country} +${getCountryCallingCode(country)}`,
        }))
        .sort((left, right) =>
          left.value === "CN"
            ? -1
            : right.value === "CN"
              ? 1
              : left.label.localeCompare(right.label, "zh-CN"),
        ),
    [countryNames],
  );
  const countryCode = `+${getCountryCallingCode(form.country)}`;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [countdown]);

  const mutation = useMutation({
    mutationFn: () =>
      register({
        account: form.account.trim(),
        password: form.password,
        countryCode,
        mobile: form.mobile.trim(),
        smsCode: form.smsCode.trim(),
        agreedToTerms: form.agreedToTerms,
        email: form.email.trim() || undefined,
        inviteCode: form.inviteCode.trim() || undefined,
        salesCode: form.salesCode.trim() || undefined,
      }),
    onSuccess: (payload) => {
      setSession(payload.user, payload.needBindMobile);
      window.location.replace("/console");
    },
  });
  const sendSMS = useMutation({
    mutationFn: () =>
      sendRegistrationSMS({ countryCode, mobile: form.mobile.trim() }),
    onSuccess: () => {
      setSMSError("");
      setSMSMessage("验证码已发送，请注意查收");
      setCountdown(60);
    },
    onError: (error) => {
      setSMSMessage("");
      setSMSError(getApiMessage(error));
    },
  });

  if (user) return <ExternalRedirect to="/console" />;

  const updateText = (
    key: Exclude<keyof RegistrationForm, "country" | "agreedToTerms">,
    value: string,
  ) => setForm((current) => ({ ...current, [key]: value }));

  const validateMobile = () => {
    const value = form.mobile.trim();
    const error = !value
      ? "请输入手机号"
      : form.country === "CN" && !mainlandMobilePattern.test(value)
        ? "请输入正确的 11 位中国大陆手机号"
        : "";
    setMobileError(error);
    return !error;
  };

  const requestCode = () => {
    setSMSError("");
    setSMSMessage("");
    if (!validateMobile()) return;
    if (form.country !== "CN") {
      setSMSError("该地区暂不支持验证码，敬请期待");
      return;
    }
    sendSMS.mutate();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validateMobile()) return;
    mutation.mutate();
  };

  return (
    <main className="grid min-h-svh place-items-center bg-kumo-recessed p-4">
      <LayerCard className="grid w-full max-w-lg gap-5 p-6 md:p-8">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold text-kumo-strong">创建客户账号</h1>
          <p className="text-base text-kumo-subtle">注册成功后将直接建立用户端安全会话。</p>
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          <Input label="账号" value={form.account} onChange={(event) => updateText("account", event.target.value)} autoComplete="username" required />
          <Input label="密码" type="password" value={form.password} onChange={(event) => updateText("password", event.target.value)} autoComplete="new-password" required />
          <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <Select<CountryCode>
              label="国家 / 地区"
              items={countries}
              value={form.country}
              onValueChange={(country) => {
                if (!country) return;
                setForm((current) => ({ ...current, country }));
                setMobileError("");
                setSMSMessage("");
                setSMSError(country === "CN" ? "" : "该地区暂不支持验证码，敬请期待");
              }}
            />
            <Input
              label={`手机号（${countryCode}）`}
              value={form.mobile}
              onChange={(event) => {
                const mobile = event.target.value;
                updateText("mobile", mobile);
                if (form.country === "CN") {
                  setMobileError(
                    mobile && !mainlandMobilePattern.test(mobile.trim())
                      ? "请输入正确的 11 位中国大陆手机号"
                      : "",
                  );
                }
              }}
              onBlur={validateMobile}
              inputMode="tel"
              autoComplete="tel-national"
              required
              error={mobileError || undefined}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Input label="手机验证码" value={form.smsCode} onChange={(event) => updateText("smsCode", event.target.value)} inputMode="numeric" autoComplete="one-time-code" required />
            <Button type="button" variant="secondary" loading={sendSMS.isPending} disabled={countdown > 0} onClick={requestCode}>
              {countdown > 0 ? `重新获取 (${countdown}s)` : "获取验证码"}
            </Button>
          </div>
          {smsMessage ? <Banner variant="default" title={smsMessage} /> : null}
          {smsError ? <Banner variant="alert" title={smsError} /> : null}
          <Input label="邮箱（可选）" type="email" value={form.email} onChange={(event) => updateText("email", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="优惠码（可选）" placeholder="请输入优惠码" value={form.inviteCode} onChange={(event) => updateText("inviteCode", event.target.value)} />
            <Input label="销售工号（可选）" value={form.salesCode} onChange={(event) => updateText("salesCode", event.target.value)} />
          </div>
          <TermsAgreement checked={form.agreedToTerms} onCheckedChange={(agreedToTerms) => setForm((current) => ({ ...current, agreedToTerms }))} />
          {mutation.error ? <Banner variant="error" title="注册失败" description={getApiMessage(mutation.error)} /> : null}
          <Button type="submit" loading={mutation.isPending} disabled={!form.agreedToTerms}>创建账号</Button>
        </form>
        <div className="text-center text-sm text-kumo-subtle">已有账号？ <Link className="text-kumo-link hover:underline" to="/login">返回登录</Link></div>
      </LayerCard>
    </main>
  );
}
