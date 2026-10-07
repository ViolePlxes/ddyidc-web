import { Dialog } from "./Dialog";
import { Banner, Button, LayerCard } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  paymentApi,
  type AlipayCheckoutMode,
  type PaymentBusinessType,
  type PaymentCheckout,
  type PaymentChannel,
} from "../api/payment";
import { getApiMessage } from "../api/request";
import { formatMoney } from "../utils/format";

interface PaymentDialogProps {
  businessType: PaymentBusinessType;
  businessId: string;
  amountCents: number;
  disabled?: boolean;
  defaultOpen?: boolean;
  triggerLabel?: string;
  onPaid?: () => void | Promise<void>;
}

const finalStates = new Set(["paid", "closed", "failed", "refunded", "received_review"]);
const allowedAlipayHosts = new Set([
  "openapi.alipay.com",
  "openapi.alipaydev.com",
  "openapi-sandbox.dl.alipaydev.com",
]);

function checkoutMode(): AlipayCheckoutMode {
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return mobileUserAgent || window.matchMedia("(max-width: 767px)").matches ? "wap" : "page";
}

function verifiedCheckoutURL(raw: string): string {
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:" || !allowedAlipayHosts.has(parsed.hostname)) {
    throw new Error("支付宝返回了无效的收银台地址");
  }
  return parsed.toString();
}

export function PaymentDialog({
  businessType,
  businessId,
  amountCents,
  disabled = false,
  defaultOpen = false,
  triggerLabel = "在线支付",
  onPaid,
}: PaymentDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const queryClient = useQueryClient();
  const [balancePaid, setBalancePaid] = useState(false);
  const balancePayment = useMutation({
    mutationFn: () => paymentApi.payBalance(businessId, businessType),
    onSuccess: async () => {
      setBalancePaid(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["console", "overview"] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["finance"] }),
      ]);
      await onPaid?.();
    },
  });
  const [checkout, setCheckout] = useState<PaymentCheckout>();
  const [qrImage, setQrImage] = useState<string>();
  const [qrError, setQrError] = useState(false);
  const handledPaymentId = useRef<string | undefined>(undefined);
  const pollCount = useRef(0);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const pollStartedAt = useRef(0);

  const create = useMutation({
    mutationFn: async ({ channel, mode, popup }: { channel: PaymentChannel; mode: AlipayCheckoutMode; popup?: Window | null }) => {
      try {
        const result = await paymentApi.create(businessType, businessId, channel, mode);
        if (channel === "wechat") {
          if (!result.wechat?.codeUrl?.startsWith("weixin://wxpay/")) throw new Error("微信未返回有效的收款二维码");
          return result;
        }
        if (!result.alipay?.payUrl) throw new Error("支付宝未返回收银台地址");
        const payURL = verifiedCheckoutURL(result.alipay.payUrl);
        if (mode === "wap") {
          window.location.assign(payURL);
        } else {
          if (!popup) throw new Error("浏览器阻止了支付宝支付窗口，请允许本站打开新窗口");
          popup.opener = null;
          popup.location.replace(payURL);
        }
        return result;
      } catch (error) {
        popup?.close();
        throw error;
      }
    },
    onSuccess: (result) => {
      handledPaymentId.current = undefined;
      pollCount.current = 0;
      setPollAttempts(0);
      setPollTimedOut(false);
      pollStartedAt.current = Date.now();
      setCheckout(result);
    },
  });

  const status = useQuery({
    queryKey: ["payment", checkout?.payNo],
    queryFn: async () => {
      if (!checkout) throw new Error("支付单不存在");
      pollCount.current += 1;
      setPollAttempts(pollCount.current);
      return paymentApi.statusByPayNo(checkout.payNo);
    },
    enabled: open && Boolean(checkout?.payNo) && !pollTimedOut,
    refetchInterval: (query) => {
      if (finalStates.has(query.state.data?.status ?? "") || pollTimedOut || pollCount.current >= 30) return false;
      return 2_000;
    },
    refetchIntervalInBackground: false,
    retry: false,
  });

  useEffect(() => {
    if (!open || !checkout) return;
    const remaining = Math.max(0, 60_000 - (Date.now() - pollStartedAt.current));
    const timer = window.setTimeout(() => setPollTimedOut(true), remaining);
    return () => window.clearTimeout(timer);
  }, [open, checkout]);

  const close = useMutation({
    mutationFn: () => paymentApi.closeOrder(businessId),
    onSuccess: () => void status.refetch(),
  });

  useEffect(() => {
    if (status.data?.status !== "paid" || !checkout || handledPaymentId.current === checkout.paymentId) return;
    handledPaymentId.current = checkout.paymentId;
    void onPaid?.();
  }, [checkout, onPaid, status.data?.status]);

  useEffect(() => {
    let active = true;
    setQrImage(undefined);
    setQrError(false);
    if (checkout?.wechat?.codeUrl) {
      void QRCode.toDataURL(checkout.wechat.codeUrl, { width: 280, margin: 2 })
        .then((value) => { if (active) setQrImage(value); })
        .catch(() => { if (active) setQrError(true); });
    }
    return () => { active = false; };
  }, [checkout]);

  function startPayment(channel: PaymentChannel) {
    const mode = checkoutMode();
    const popup = channel === "alipay" && mode === "page" ? window.open("about:blank", "_blank") : undefined;
    create.mutate({ channel, mode, popup });
  }

  const currentState = status.data?.status ?? checkout?.status;
  const expired = checkout ? new Date(checkout.expireAt).getTime() <= Date.now() : false;
  const pollingStopped = Boolean(checkout) && (pollTimedOut || pollAttempts >= 30) && !finalStates.has(currentState ?? "");

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button disabled={disabled}>{businessType !== "recharge" && triggerLabel === "在线支付" ? "支付订单" : triggerLabel}</Button>} />
      <Dialog size="lg" className="grid gap-5 p-6">
        <div className="flex justify-between gap-4">
          <div className="grid min-w-0 gap-2">
            <Dialog.Title className="text-xl font-semibold">{businessType !== "recharge" ? "支付订单" : "在线支付"}</Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              应付 {formatMoney(amountCents)}。支付结果以服务端核对并确认的状态为准。
            </Dialog.Description>
          </div>
          <Dialog.Close render={<Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" />} />
        </div>

        {!checkout && !balancePaid ? (
          <LayerCard className="shadow-none grid gap-2 p-5">
            <strong className="text-kumo-strong">选择支付方式</strong>
            <span className="text-sm text-kumo-subtle">{businessType !== "recharge" ? "可使用账户余额，余额不足时可充值或选择在线支付。" : "支付宝打开官方收银台；微信支付生成扫码付款二维码。未开通的通道会提示不可用。"}</span>
          </LayerCard>
        ) : null}
        {checkout?.wechat && currentState === "pending" && !expired ? (
          <LayerCard className="grid justify-items-center gap-3 p-5">
            <strong>请使用微信扫码支付 {formatMoney(amountCents)}</strong>
            {qrImage ? <img src={qrImage} width={280} height={280} className="h-auto max-w-full" alt="微信支付二维码" /> : <span>正在生成二维码…</span>}
            {qrError ? <Banner variant="error" title="二维码生成失败" description="请关闭后重新打开支付窗口。" /> : null}
          </LayerCard>
        ) : null}

        {checkout?.alipay ? (
          <Banner
            title={checkout.alipay.mode === "wap" ? "正在前往支付宝" : "支付宝收银台已打开"}
            description="完成或取消后会返回本站；当前页面最多轮询 60 秒确认支付结果。"
          />
        ) : null}
        {currentState === "paid" ? <Banner title="支付成功" description="服务端已确认到账，后续业务正在处理。" /> : null}
        {currentState === "received_review" ? <Banner title="已收到付款，待核对" description="订单已关闭或已由另一笔付款完成。本次收款已记录，请联系平台核对原路退款，无需再次付款。" /> : null}
        {currentState === "closed" || currentState === "failed" || (expired && currentState === "pending")
          ? <Banner variant="error" title="支付单不可继续" description="支付单已关闭、失败或过期，请刷新业务页面后重试。" />
          : null}
        {pollingStopped ? <Banner variant="alert" title="仍在等待结果" description="尚未收到支付异步通知，可刷新状态或稍后在订单中查看。" /> : null}
        {create.error ? <Banner variant="error" title="创建支付失败" description={getApiMessage(create.error)} /> : null}
        {balancePayment.error ? <Banner variant="error" title="余额支付失败" description={getApiMessage(balancePayment.error)} /> : null}
        {balancePaid ? <Banner title="余额支付成功" description="订单已支付，后续服务由系统处理。" /> : null}
        {status.error ? <Banner variant="error" title="查询支付状态失败" description={getApiMessage(status.error)} /> : null}
        {close.error ? <Banner variant="error" title="关闭支付单失败" description={getApiMessage(close.error)} /> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
          {checkout && businessType === "order" && currentState === "pending"
            ? <Button variant="secondary" loading={close.isPending} onClick={() => close.mutate()}>关闭支付单</Button>
            : null}
          {pollingStopped ? <Button variant="secondary" loading={status.isFetching} onClick={() => void status.refetch()}>刷新支付状态</Button> : null}
          {!checkout && !balancePaid ? <>{businessType !== "recharge" ? <Button variant="primary" disabled={create.isPending} loading={balancePayment.isPending} onClick={() => balancePayment.mutate()}>确认余额支付 {formatMoney(amountCents)}</Button> : null}<Button disabled={create.isPending || balancePayment.isPending} onClick={() => startPayment("wechat")}>微信扫码支付</Button><Button disabled={balancePayment.isPending} loading={create.isPending} onClick={() => startPayment("alipay")}>确认并前往支付宝</Button></> : null}
          <Dialog.Close render={<Button variant="secondary">{currentState === "paid" || balancePaid ? "完成" : "稍后处理"}</Button>} />
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
