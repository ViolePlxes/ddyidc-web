import type { AxiosResponse } from "axios";
import { userRequest, type ApiEnvelope } from "./request";

export type PaymentChannel = "wechat" | "alipay";
export type PaymentBusinessType = "order" | "recharge" | "marketplace";
export type AlipayCheckoutMode = "page" | "wap";
export type PaymentState = "pending" | "paid" | "closed" | "failed" | "refunded" | "received_review";

export interface PaymentCheckout {
  paymentId: string;
  payNo: string;
  status: PaymentState;
  expireAt: string;
  wechat?: { codeUrl: string };
  alipay?: { payUrl: string; mode: AlipayCheckoutMode };
}

export interface PaymentStatus {
  payNo: string;
  status: PaymentState;
  channel: PaymentChannel;
  paidAmount: string;
  paidAt?: string;
}

function unwrap<T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>) {
  return request.then((response) => {
    if (response.data.code !== 0) throw new Error(response.data.message || "支付操作失败，请核对后重试");
    return response.data.data;
  });
}

export const paymentApi = {
  payBalance: (orderId: string, businessType: PaymentBusinessType = "order") => unwrap(userRequest.post<ApiEnvelope<{ id: string; status: number }>>(businessType === "marketplace" ? `/marketplace/orders/${orderId}/pay` : `/orders/${orderId}/pay`, { method: "balance" })),
  create: (businessType: PaymentBusinessType, businessId: string, channel: PaymentChannel, mode: AlipayCheckoutMode) =>
    businessType === "marketplace" ? unwrap(userRequest.post<ApiEnvelope<PaymentCheckout>>(`/marketplace/orders/${businessId}/pay`,{method:channel,mode})) : businessType === "order"
      ? unwrap(userRequest.post<ApiEnvelope<PaymentCheckout>>(`/payment/order/${businessId}/create`, { channel, mode }))
      : unwrap(userRequest.post<ApiEnvelope<PaymentCheckout>>("/payment/recharge/create", { rechargeId: businessId, channel, mode })),
  status: (businessType: PaymentBusinessType, businessId: string) =>
    unwrap(userRequest.get<ApiEnvelope<PaymentStatus>>(
      businessType === "order"
        ? `/payment/order/${businessId}/status`
        : `/payment/recharge/${businessId}/status`,
    )),
  statusByPayNo: (payNo: string) =>
    unwrap(userRequest.get<ApiEnvelope<PaymentStatus>>(`/payment/${encodeURIComponent(payNo)}/status`)),
  closeOrder: (orderId: string) =>
    unwrap(userRequest.post<ApiEnvelope<{ status: PaymentState }>>(`/payment/order/${orderId}/close`)),
};
