import { Banner, Button, Dialog, LayerCard, Radio } from "@cloudflare/kumo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { XIcon } from "@phosphor-icons/react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { paymentApi, type PaymentBusinessType, type PaymentChannel, type PaymentCheckout } from "../api/payment";
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

export function PaymentDialog({
  businessType,
  businessId,
  amountCents,
  disabled = false,
  defaultOpen = false,
  triggerLabel = "去支付",
  onPaid,
}: PaymentDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [channel, setChannel] = useState<PaymentChannel>("wechat");
  const [checkout, setCheckout] = useState<PaymentCheckout>();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const handledPaymentId = useRef<string | undefined>(undefined);

  const create = useMutation({
    mutationFn: async ({ selectedChannel, popup }: { selectedChannel: PaymentChannel; popup?: Window | null }) => {
      try {
        const result = await paymentApi.create(businessType, businessId, selectedChannel);
        if (selectedChannel === "alipay") {
          if (!result.alipay?.form) throw new Error("支付宝未返回收银台表单");
          if (!popup) throw new Error("浏览器阻止了支付宝支付窗口，请允许本站打开新窗口");
          popup.opener = null;
          popup.document.open();
          popup.document.write(result.alipay.form);
          popup.document.close();
        }
        return result;
      } catch (error) {
        popup?.close();
        throw error;
      }
    },
    onSuccess: (result) => {
      handledPaymentId.current = undefined;
      setCheckout(result);
    },
  });

  const status = useQuery({
    queryKey: ["payment", businessType, businessId],
    queryFn: () => paymentApi.status(businessType, businessId),
    enabled: open && Boolean(checkout),
    refetchInterval: (query) => finalStates.has(query.state.data?.status ?? "") ? false : 3_000,
    refetchIntervalInBackground: false,
  });

  const close = useMutation({
    mutationFn: () => paymentApi.closeOrder(businessId),
    onSuccess: () => void status.refetch(),
  });

  useEffect(() => {
    const codeUrl = checkout?.wechat?.codeUrl;
    if (!codeUrl) {
      setQrDataUrl("");
      return;
    }
    let active = true;
    void QRCode.toDataURL(codeUrl, { width: 240, margin: 1, errorCorrectionLevel: "M" })
      .then((dataUrl) => { if (active) setQrDataUrl(dataUrl); });
    return () => { active = false; };
  }, [checkout?.wechat?.codeUrl]);

  useEffect(() => {
    if (status.data?.status !== "paid" || !checkout || handledPaymentId.current === checkout.paymentId) return;
    handledPaymentId.current = checkout.paymentId;
    void onPaid?.();
  }, [checkout, onPaid, status.data?.status]);

  function startPayment() {
    const popup = channel === "alipay" ? window.open("", "_blank") : undefined;
    create.mutate({ selectedChannel: channel, popup });
  }

  const currentState = status.data?.status ?? checkout?.status;
  const expired = checkout ? new Date(checkout.expireAt).getTime() <= Date.now() : false;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button disabled={disabled}>{triggerLabel}</Button>} />
      <Dialog className="grid gap-5 p-6">
        <div className="flex justify-between gap-4">
          <div className="grid gap-2">
            <Dialog.Title className="text-xl font-semibold">在线支付</Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              应付 {formatMoney(amountCents)}。支付是否成功仅以服务端验签回调为准。
            </Dialog.Description>
          </div>
          <Dialog.Close render={<Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" />} />
        </div>

        {!checkout ? (
          <Radio.Group<PaymentChannel> legend="选择支付方式" value={channel} onValueChange={setChannel} className="grid gap-3 sm:grid-cols-2">
            <Radio.Item<PaymentChannel> value="wechat" label="微信支付" description="使用微信扫码支付" />
            <Radio.Item<PaymentChannel> value="alipay" label="支付宝" description="在新窗口打开电脑网站收银台" />
          </Radio.Group>
        ) : null}

        {checkout?.wechat ? (
          <LayerCard className="grid justify-items-center gap-3 p-5">
            {qrDataUrl ? <img src={qrDataUrl} width={240} height={240} alt="微信支付二维码" /> : <span className="text-kumo-subtle">正在生成二维码…</span>}
            <span className="text-sm text-kumo-subtle">请使用微信扫描二维码完成支付</span>
          </LayerCard>
        ) : null}

        {checkout?.alipay ? (
          <Banner title="支付宝收银台已打开" description="请在新窗口完成支付，然后返回此处等待支付结果。" />
        ) : null}

        {currentState === "paid" ? <Banner title="支付成功" description="服务端已确认到账，业务处理正在继续。" /> : null}
        {currentState === "closed" || currentState === "failed" || expired
          ? <Banner variant="error" title="支付单不可继续" description="支付单已关闭、失败或过期，请刷新业务页面后重试。" />
          : null}
        {create.error ? <Banner variant="error" title="创建支付失败" description={getApiMessage(create.error)} /> : null}
        {status.error ? <Banner variant="error" title="查询支付状态失败" description={getApiMessage(status.error)} /> : null}
        {close.error ? <Banner variant="error" title="关闭支付单失败" description={getApiMessage(close.error)} /> : null}

        <div className="flex justify-end gap-3">
          {checkout && businessType === "order" && currentState === "pending"
            ? <Button variant="secondary" loading={close.isPending} onClick={() => close.mutate()}>关闭支付单</Button>
            : null}
          {!checkout ? <Button loading={create.isPending} onClick={startPayment}>确认并前往支付</Button> : null}
          <Dialog.Close render={<Button variant="secondary">{currentState === "paid" ? "完成" : "稍后处理"}</Button>} />
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
