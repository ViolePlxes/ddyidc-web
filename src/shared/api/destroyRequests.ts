import { adminRequest, userRequest, type ApiEnvelope } from "./request";

export interface DestroyPeriod {
  period?: { startAt?: string; endAt?: string };
  refundAmount?: string;
  remainingDays?: number;
}

export interface DestroyRequestRow {
  id: string;
  refundNo: string;
  instanceId: string;
  productName: string;
  instanceNo: string;
  ip: string;
  amount: string;
  reason: string;
  status: number;
  createdAt: string;
  refundedAt?: string;
  reviewReason?: string;
}

export interface DestroyQuote {
  instanceId: string;
  instanceNo: string;
  productName: string;
  paidAmount: string;
  refundableAmount: string;
  periods: DestroyPeriod[];
  requests: DestroyRequestRow[];
}

export interface DestroyOption {
  instanceId: string;
  instanceNo: string;
  productName: string;
  ip?: string;
  expiresAt?: string;
  remaining?: string;
  paidAmount: string;
  refundableAmount: string;
  eligible: boolean;
  reason?: string;
  lastRejectReason?: string;
}

// The mailbox proof of a destroy application is an admin switch. The console
// reads the resolved value so the dialog can hide the email step when the
// administrator turned it off; when the call fails the dialog keeps requiring it.
export interface DestroySettings {
  requireEmailVerification: boolean;
}

/** Request id for idempotent destroy submissions. */
export function destroyRequestId() {
  const random =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `destroy-${random}`.slice(0, 64);
}

export const destroyApi = {
  async options() {
    return (await userRequest.get<ApiEnvelope<{ items: DestroyOption[] }>>("/destroy-options")).data.data;
  },
  async settings() {
    return (await userRequest.get<ApiEnvelope<DestroySettings>>("/destroy-settings")).data.data;
  },
  async quote(instanceId: string) {
    return (await userRequest.get<ApiEnvelope<DestroyQuote>>(`/instance/${encodeURIComponent(instanceId)}/destroy-quote`)).data.data;
  },
  async submit(instanceId: string, reason: string, requestId: string, email = "", code = "") {
    return (await userRequest.post<ApiEnvelope<{ id: string; refundNo: string; amount: string; status: number }>>(`/instance/${encodeURIComponent(instanceId)}/destroy-request`, { reason, requestId, email, code })).data.data;
  },
  async list() {
    return (await userRequest.get<ApiEnvelope<{ items: DestroyRequestRow[] }>>("/destroy-requests")).data.data;
  },
};

export const destroyAdminApi = {
  async settings() {
    return (await adminRequest.get<ApiEnvelope<DestroySettings>>("/instances/destroy-settings")).data.data;
  },
  async save(input: DestroySettings) {
    return (await adminRequest.put<ApiEnvelope<DestroySettings>>("/instances/destroy-settings", input)).data.data;
  },
};
