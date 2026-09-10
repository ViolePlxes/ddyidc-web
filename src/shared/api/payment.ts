import type { AxiosResponse } from "axios";
import { userRequest, type ApiEnvelope } from "./request";

export type PaymentChannel = "wechat" | "alipay";
export type PaymentBusinessType = "order" | "recharge";
export type PaymentState = "pending" | "paid" | "closed" | "failed" | "refunded";

export interface PaymentCheckout {
  paymentId: string;
  status: PaymentState;
  expireAt: string;
  wechat?: { codeUrl: string };
  alipay?: { form: string };
}

export interface PaymentStatus {
  status: PaymentState;
  channel: PaymentChannel;
  paidAmount: string;
  paidAt?: string;
}

function unwrap<T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>) {
  return request.then((response) => response.data.data);
}

export const paymentApi = {
  create: (businessType: PaymentBusinessType, businessId: string, channel: PaymentChannel) =>
    businessType === "order"
      ? unwrap(userRequest.post<ApiEnvelope<PaymentCheckout>>(`/payment/order/${businessId}/create`, { channel }))
      : unwrap(userRequest.post<ApiEnvelope<PaymentCheckout>>("/payment/recharge/create", { rechargeId: businessId, channel })),
  status: (businessType: PaymentBusinessType, businessId: string) =>
    unwrap(userRequest.get<ApiEnvelope<PaymentStatus>>(
      businessType === "order"
        ? `/payment/order/${businessId}/status`
        : `/payment/recharge/${businessId}/status`,
    )),
  closeOrder: (orderId: string) =>
    unwrap(userRequest.post<ApiEnvelope<{ status: PaymentState }>>(`/payment/order/${orderId}/close`)),
};
