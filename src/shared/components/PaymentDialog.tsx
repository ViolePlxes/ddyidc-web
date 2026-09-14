import { Banner, Button, Dialog, LayerCard } from "@cloudflare/kumo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import {
  paymentApi,
  type AlipayCheckoutMode,
  type PaymentBusinessType,
  type PaymentCheckout,
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

const finalStates = new Set(["paid", "closed", "failed", "refunded"]);
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
  triggerLabel = "支付宝支付",
  onPaid,
}: PaymentDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [checkout, setCheckout] = useState<PaymentCheckout>();
  const handledPaymentId = useRef<string | undefined>(undefined);
  const pollCount = useRef(0);

  const create = useMutation({
    mutationFn: async ({ mode, popup }: { mode: AlipayCheckoutMode; popup?: Window | null }) => {
      try {
        const result = await paymentApi.create(businessType, businessId, "alipay", mode);
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
      setCheckout(result);
    },
  });

  const status = useQuery({
    queryKey: ["payment", checkout?.payNo],
    queryFn: async () => {
      if (!checkout) throw new Error("支付单不存在");
      pollCount.current += 1;
      return paymentApi.statusByPayNo(checkout.payNo);
    },
    enabled: open && Boolean(checkout?.payNo),
    refetchInterval: (query) => {
      if (finalStates.has(query.state.data?.status ?? "") || pollCount.current >= 30) return false;
      return 2_000;
    },
    refetchIntervalInBackground: false,
    retry: false,
  });

  const close = useMutation({
    mutationFn: () => paymentApi.closeOrder(businessId),
    onSuccess: () => void status.refetch(),
  });

  useEffect(() => {
    if (status.data?.status !== "paid" || !checkout || handledPaymentId.current === checkout.paymentId) return;
    handledPaymentId.current = checkout.paymentId;
    void onPaid?.();
  }, [checkout, onPaid, status.data?.status]);

  function startPayment() {
    const mode = checkoutMode();
    const popup = mode === "page" ? window.open("about:blank", "_blank") : undefined;
    create.mutate({ mode, popup });
  }

  const currentState = status.data?.status ?? checkout?.status;
  const expired = checkout ? new Date(checkout.expireAt).getTime() <= Date.now() : false;
  const pollingStopped = Boolean(checkout) && pollCount.current >= 30 && !finalStates.has(currentState ?? "");

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button disabled={disabled}>{triggerLabel}</Button>} />
      <Dialog className="grid gap-5 p-6">
        <div className="flex justify-between gap-4">
          <div className="grid gap-2">
            <Dialog.Title className="text-xl font-semibold">支付宝支付</Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              应付 {formatMoney(amountCents)}。到账状态只以服务端验签结果为准。
            </Dialog.Description>
          </div>
          <Dialog.Close render={<Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" />} />
        </div>

        {!checkout ? (
          <LayerCard className="shadow-none grid gap-2 p-5">
            <strong className="text-kumo-strong">支付宝</strong>
            <span className="text-sm text-kumo-subtle">电脑端打开电脑网站收银台，移动端跳转手机网站收银台。</span>
          </LayerCard>
        ) : null}

        {checkout?.alipay ? (
          <Banner
            title={checkout.alipay.mode === "wap" ? "正在前往支付宝" : "支付宝收银台已打开"}
            description="完成或取消后会返回本站；当前页面最多轮询 60 秒确认支付结果。"
          />
        ) : null}
        {currentState === "paid" ? <Banner title="支付成功" description="服务端已确认到账，后续业务正在处理。" /> : null}
        {currentState === "closed" || currentState === "failed" || expired
          ? <Banner variant="error" title="支付单不可继续" description="支付单已关闭、失败或过期，请刷新业务页面后重试。" />
          : null}
        {pollingStopped ? <Banner variant="alert" title="仍在等待结果" description="尚未收到支付宝异步通知，可稍后在订单或充值记录中再次查看。" /> : null}
        {create.error ? <Banner variant="error" title="创建支付失败" description={getApiMessage(create.error)} /> : null}
        {status.error ? <Banner variant="error" title="查询支付状态失败" description={getApiMessage(status.error)} /> : null}
        {close.error ? <Banner variant="error" title="关闭支付单失败" description={getApiMessage(close.error)} /> : null}

        <div className="flex justify-end gap-3">
          {checkout && businessType === "order" && currentState === "pending"
            ? <Button variant="secondary" loading={close.isPending} onClick={() => close.mutate()}>关闭支付单</Button>
            : null}
          {!checkout ? <Button loading={create.isPending} onClick={startPayment}>确认并前往支付宝</Button> : null}
          <Dialog.Close render={<Button variant="secondary">{currentState === "paid" ? "完成" : "稍后处理"}</Button>} />
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
