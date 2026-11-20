import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import { useCallback, useEffect, useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import {
  certificationApi,
  type CertificationInfo,
  type CertificationInput,
  type TencentCertificationResult,
} from "../api/certification";
import { getApiMessage } from "../api/request";
import { PhoneCountrySelect } from "./PhoneCountrySelect";
import { PaymentDialog } from "./PaymentDialog";

// The provider returns the H5 entry URL on its own domain; anything else is a
// malformed response and must not be navigated to.
function validatedEntryURL(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !/(^|\.)tencentcloudapi\.com$/.test(url.hostname))
    throw new Error("认证地址无效");
  return value;
}

export function TencentCertification({
  info,
  changed,
}: {
  info: CertificationInfo;
  changed: () => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<CountryCode>("CN");
  const [prefix, setPrefix] = useState("+86");
  const [result, setResult] = useState<TencentCertificationResult>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [polling, setPolling] = useState(false);
  const showForm = info.settings.enabled && info.settings.channel === "tencent";
  const accept = useCallback((next: TencentCertificationResult) => {
    if (next.url) validatedEntryURL(next.url);
    setResult(next);
    setMessage("");
  }, []);
  // A pending record re-enters the same核身 session instead of starting a new
  // one, so attempts and fees stay untouched.
  useEffect(() => {
    let active = true;
    if (info.record?.certifyChannel === "tencent" && info.status === 1) {
      void certificationApi
        .tencentCertify()
        .then((value) => {
          if (active) accept(value);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [info.record?.id, info.record?.certifyChannel, info.status, accept]);
  // The provider redirect lands on /console/certification?tencent=done.
  useEffect(() => {
    const done =
      new URLSearchParams(window.location.search).get("tencent") === "done";
    if (done && info.status === 1) setPolling(true);
  }, [info.status]);
  useEffect(() => {
    if (!polling || info.status === 2) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    async function poll() {
      try {
        const value = await certificationApi.tencentStatus();
        if (!active) return;
        if (value.status === 2 || value.status === 3) {
          setPolling(false);
          setResult(undefined);
          await changed();
          return;
        }
        count++;
        if (count >= 60) {
          setPolling(false);
          setMessage("自动查询已暂停，请稍后点击查询结果。");
          return;
        }
        timer = setTimeout(() => void poll(), 2000);
      } catch (e) {
        if (active) {
          setPolling(false);
          setError(getApiMessage(e));
        }
      }
    }
    timer = setTimeout(() => void poll(), 2000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [polling, info.status, changed]);
  async function initialize() {
    setBusy(true);
    setError("");
    try {
      const input: CertificationInput = {
        name,
        phone: prefix + phone,
        documentNumber,
        documentType: 1,
        front: "",
        back: "",
        companyName: "",
        companyCode: "",
        license: "",
        legalType: 1,
        authorization: "",
      };
      const next = await certificationApi.tencentInitialize(input);
      accept(next);
      await changed();
      if (next.url) window.location.assign(next.url);
    } catch (e) {
      setError(getApiMessage(e));
    } finally {
      setBusy(false);
    }
  }
  function query() {
    setError("");
    setPolling(true);
  }
  if (info.status === 2) return null;
  return (
    <LayerCard className="grid gap-4 px-5 py-4">
      <h2>个人认证 · 腾讯云慧眼人脸核身</h2>
      {error && <Banner variant="error" title={error} />}
      {message && <p role="status">{message}</p>}
      {result?.url ? (
        <>
          <p>
            请在腾讯云核身页面按提示完成眨眼与光线活体检测。完成后回到本页即可自动读取结果。
          </p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            打开腾讯云核身页面
          </a>
          <div className="flex flex-wrap gap-2">
            <Button disabled={polling} onClick={query}>
              {polling ? "正在查询核身结果…" : "查询结果"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPolling(false);
                setResult(undefined);
                setMessage("");
              }}
            >
              返回 / 重新发起
            </Button>
          </div>
          <p>核身令牌两小时内有效，过期后请重新发起。</p>
        </>
      ) : showForm ? (
        <form
          className="grid gap-4"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            void initialize();
          }}
        >
          <p>
            免费认证 {info.settings.freeAttempts} 次，已发起{" "}
            {info.record?.certifyAttempts ?? 0} 次；超出后每次 ¥
            {info.settings.fee}
            。已通过后终身有效，不可再次提交。未通过可重试，每分钟1次、每天最多3次。
          </p>
          <Input
            label="姓名"
            required
            value={name}
            maxLength={32}
            onChange={(e) => setName(e.target.value)}
          />
          <p>证件类型：居民身份证</p>
          <Input
            label="身份证号码"
            required
            value={documentNumber}
            minLength={18}
            maxLength={18}
            onChange={(e) => setDocumentNumber(e.target.value.toUpperCase())}
          />
          <div className="flex flex-wrap items-end gap-2">
            <PhoneCountrySelect
              value={country}
              onChange={(value, code) => {
                setCountry(value);
                setPrefix(code);
              }}
            />
            <Input
              label="手机号"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "正在发起…" : "发起人脸核身"}
          </Button>
          {result?.paymentRequired && result.orderId && (
            <>
              <p>请先支付本次认证手续费，支付成功后点击发起认证继续。</p>
              <PaymentDialog
                businessType="order"
                businessId={result.orderId}
                amountCents={result.amountCents ?? 0}
                onPaid={() => {
                  setMessage("手续费已支付，请点击发起人脸核身继续。");
                  setResult(undefined);
                }}
              />
            </>
          )}
        </form>
      ) : (
        <p>通道已关闭；已发起的认证仍可查询结果。</p>
      )}
    </LayerCard>
  );
}
