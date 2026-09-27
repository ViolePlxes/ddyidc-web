import { PhoneCountrySelect } from "../../../shared/components/PhoneCountrySelect";
import { Banner, Button, Input } from "@cloudflare/kumo";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { AuthPageShell, SocialLoginOptions, authSubmitClassName } from "../components/AuthPageShell";
import { useMutation } from "@tanstack/react-query";
import { type CountryCode } from "libphonenumber-js";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { register, sendRegistrationSMS } from "../../../shared/api/auth";
import { getApiMessage } from "../../../shared/api/request";
import { ExternalRedirect } from "../../../shared/router/EntryGuards";
import { useAuthStore } from "../../../shared/stores/auth";
import { TermsAgreement } from "../components/TermsAgreement";
import { AgreementConsentDialog } from "../components/AgreementConsentDialog";

type RegistrationForm = {
  account: string;
  password: string;
  country: CountryCode;
  countryCode: string;
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
    countryCode: "+86",
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
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [countdown]);

  const mutation = useMutation({
    mutationFn: (agreedToTerms: boolean) =>
      register({
        account: form.account.trim(),
        password: form.password,
        countryCode: form.countryCode,
        mobile: form.mobile.trim(),
        smsCode: form.smsCode.trim(),
        agreedToTerms,
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
      sendRegistrationSMS({
        countryCode: form.countryCode,
        mobile: form.mobile.trim(),
      }),
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
    key: Exclude<keyof RegistrationForm, "countryCode" | "agreedToTerms">,
    value: string,
  ) => setForm((current) => ({ ...current, [key]: value }));

  const validateMobile = () => {
    const value = form.mobile.trim();
    const error = !value
      ? "请输入手机号"
      : form.countryCode === "+86" && !mainlandMobilePattern.test(value)
        ? "请输入正确的 11 位中国大陆手机号"
        : "";
    setMobileError(error);
    return !error;
  };

  const requestCode = () => {
    setSMSError("");
    setSMSMessage("");
    if (!validateMobile()) return;
    if (form.countryCode !== "+86") {
      setSMSError("该地区暂不支持验证码，敬请期待");
      return;
    }
    sendSMS.mutate();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!validateMobile()) return;
    if (!form.agreedToTerms) {
      setShowAgreementDialog(true);
      return;
    }
    mutation.mutate(true);
  };

  const agreeAndSubmit = () => {
    setForm((current) => ({ ...current, agreedToTerms: true }));
    setShowAgreementDialog(false);
    mutation.mutate(true);
  };

  return (
    <AuthPageShell title="创建账户" description="欢迎加入，请填写你的注册信息">
        <form className="grid gap-4" onSubmit={submit}>
          <Input
            label="账号"
            value={form.account}
            onChange={(event) => updateText("account", event.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="密码"
            type="password"
            value={form.password}
            onChange={(event) => updateText("password", event.target.value)}
            autoComplete="new-password"
            required
          />
          <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <PhoneCountrySelect
              value={form.country}
              onChange={(country, countryCode) => {
                setForm((current) => ({ ...current, country, countryCode }));
                setMobileError("");
                setSMSMessage("");
                setSMSError(
                  countryCode === "+86" ? "" : "该地区暂不支持验证码，敬请期待",
                );
              }}
            />
            <Input
              label="手机号"
              placeholder="请输入手机号"
              value={form.mobile}
              onChange={(event) => {
                const mobile = event.target.value;
                updateText("mobile", mobile);
                if (form.countryCode === "+86") {
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
              error={
                mobileError ? { message: mobileError, match: true } : undefined
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Input
              label="手机验证码"
              value={form.smsCode}
              onChange={(event) => updateText("smsCode", event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
            <Button
              type="button"
              variant="secondary"
              loading={sendSMS.isPending}
              disabled={countdown > 0}
              onClick={requestCode}
            >
              {countdown > 0 ? `重新获取 (${countdown}s)` : "获取验证码"}
            </Button>
          </div>
          {smsMessage ? <Banner variant="default" title={smsMessage} /> : null}
          {smsError ? <Banner variant="alert" title={smsError} /> : null}
          <Input
            label="邮箱（可选）"
            type="email"
            value={form.email}
            onChange={(event) => updateText("email", event.target.value)}
          />
          <div className="grid gap-4">
            <Input
              label="优惠码（可选）"
              placeholder="请输入优惠码"
              value={form.inviteCode}
              onChange={(event) => updateText("inviteCode", event.target.value)}
            />
            <Input
              label="销售工号（可选）"
              value={form.salesCode}
              onChange={(event) => updateText("salesCode", event.target.value)}
            />
          </div>
          <TermsAgreement
            checked={form.agreedToTerms}
            onCheckedChange={(agreedToTerms) =>
              setForm((current) => ({ ...current, agreedToTerms }))
            }
          />
          {mutation.error ? (
            <Banner
              variant="error"
              title="注册失败"
              description={getApiMessage(mutation.error)}
            />
          ) : null}
          <Button type="submit" variant="secondary" size="lg" className={authSubmitClassName} loading={mutation.isPending}>
            注册 <ArrowRightIcon />
          </Button>
        </form>
        <div className="text-center text-sm text-kumo-subtle">
          已有账号？{" "}
          <Link className="text-kumo-link hover:underline" to="/login">
            返回登录
          </Link>
        </div>
      <SocialLoginOptions />
      <AgreementConsentDialog
        open={showAgreementDialog}
        onOpenChange={setShowAgreementDialog}
        onAgree={agreeAndSubmit}
      />
    </AuthPageShell>
  );
}
