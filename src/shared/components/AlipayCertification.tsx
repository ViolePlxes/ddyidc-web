import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import { useCallback, useEffect, useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import QRCode from "qrcode";
import {
  certificationApi,
  type AlipayCertificationResult,
  type CertificationInfo,
  type CertificationInput,
} from "../api/certification";
import { getApiMessage } from "../api/request";
import { PhoneCountrySelect } from "./PhoneCountrySelect";
import { PaymentDialog } from "./PaymentDialog";

export function AlipayCertification({
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
  const [result, setResult] = useState<AlipayCertificationResult>();
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState("");
  const showForm = info.settings.enabled && info.settings.channel === "alipay";
  const accept = useCallback((next: AlipayCertificationResult) => {
    if (next.url) {
      const url = new URL(next.url);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "openapi.alipay.com" ||
        url.pathname !== "/gateway.do"
      )
        throw new Error("认证地址无效");
    }
    setResult(next);
    setPolling(Boolean(next.url));
    setMessage("");
  }, []);
  useEffect(() => {
    let active = true;
    if (info.record?.certifyChannel === "alipay" && info.status !== 2) {
      void certificationApi
        .alipayCertify()
        .then((value) => {
          if (active) accept(value);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [info.record?.id, info.record?.certifyChannel, info.status, accept]);
  useEffect(() => {
    let active = true;
    setQr("");
    if (result?.url)
      void QRCode.toDataURL(result.url, { width: 280, margin: 2 })
        .then((value) => {
          if (active) setQr(value);
        })
        .catch(() => {
          if (active) setError("二维码生成失败，请使用认证链接");
        });
    return () => {
      active = false;
    };
  }, [result?.url]);
  useEffect(() => {
    if (!polling || info.status === 2) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    async function poll() {
      try {
        const value = await certificationApi.alipayStatus();
        if (!active) return;
        if (value.status === 2) {
          setPolling(false);
          setResult(undefined);
          setQr("");
          await changed();
          return;
        }
        count++;
        if (count >= 100) {
          setPolling(false);
          setMessage("自动查询已暂停，请稍后点击查询结果。");
          return;
        }
        timer = setTimeout(() => void poll(), 3000);
      } catch (e) {
        if (active) {
          setPolling(false);
          setError(getApiMessage(e));
        }
      }
    }
    timer = setTimeout(() => void poll(), 3000);
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
      accept(await certificationApi.alipayInitialize(input));
      await changed();
    } catch (e) {
      setError(getApiMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      accept(await certificationApi.alipayCertify());
    } catch (e) {
      setError(getApiMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (info.status === 2) return null;
  return (
    <LayerCard className="grid gap-4 px-5 py-4">
      <h2>个人认证 · 支付宝芝麻信用</h2>
      {error && <Banner variant="error" title={error} />}
      {message && <p role="status">{message}</p>}
      {result?.url ? (
        <>
          <p>请使用支付宝扫码完成认证，认证方式以支付宝页面提示为准。</p>
          {qr && (
            <img src={qr} width={280} height={280} alt="支付宝实名认证二维码" />
          )}
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            打开支付宝认证页面
          </a>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void refresh()}>
              刷新二维码
            </Button>
            <Button
              disabled={polling}
              onClick={() => {
                setError("");
                setPolling(true);
              }}
            >
              {polling ? "正在查询认证结果…" : "查询结果"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setPolling(false);
                setResult(undefined);
                setQr("");
              }}
            >
              返回 / 重新认证
            </Button>
          </div>
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
            maxLength={64}
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
            {busy ? "正在发起…" : "发起支付宝认证"}
          </Button>
          {result?.paymentRequired && result.orderId && (
            <>
              <p>请先支付本次认证手续费，支付成功后点击发起认证继续。</p>
              <PaymentDialog
                businessType="order"
                businessId={result.orderId}
                amountCents={result.amountCents ?? 0}
                onPaid={() => {
                  setMessage("手续费已支付，请点击发起支付宝认证继续。");
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
