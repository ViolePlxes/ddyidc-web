import type { AxiosResponse } from "axios";
import { userRequest, type ApiEnvelope } from "./request";

export type PaymentChannel = "wechat" | "alipay";
export type PaymentBusinessType = "order" | "recharge";
export type AlipayCheckoutMode = "page" | "wap";
export type PaymentState = "pending" | "paid" | "closed" | "failed" | "refunded";

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
  return request.then((response) => response.data.data);
}

export const paymentApi = {
  create: (businessType: PaymentBusinessType, businessId: string, channel: PaymentChannel, mode: AlipayCheckoutMode) =>
    businessType === "order"
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
