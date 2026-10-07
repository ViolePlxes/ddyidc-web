import { userRequest, adminRequest, type ApiEnvelope } from "./request";
import type { AxiosResponse } from "axios";
export interface PromoCouponConfig {
  enabled: boolean;
  directEnabled: boolean;
  offerEnabled: boolean;
  pointsEnabled: boolean;
  balanceEnabled: boolean;
  renewalEnabled: boolean;
  reviewRequired: boolean;
  pointsPerYuan: number;
  faceMax: string;
  batchMax: number;
  dailyCount: number;
  dailyBudget: string;
  validDaysMax: number;
  productIds: string[];
  maintenanceSeconds: number;
  version: number;
  updatedAt: string;
}
export interface PromoCouponTemplate {
  id: string;
  name: string;
  face: string;
  minimum: string;
  validDays: number;
  enabled: boolean;
}
export interface PromoCouponInput {
  templateId: string;
  mode: "direct" | "offer";
  source: "points" | "balance";
  quantity: number;
  recipientIds: string[];
  claimPoints: number;
  requestId: string;
  quote?: string;
}
export interface PromoCouponQuote {
  token: string;
  expiresAt: string;
  pointCost: number;
  balanceCost: string;
  quantity: number;
  face: string;
  minimum: string;
  claimPoints: number;
  name: string;
  reviewRequired: boolean;
}
export interface PromoCouponBatch {
  id: string;
  ownerId: string;
  orderId: string;
  name: string;
  mode: string;
  source: string;
  quantity: number;
  face: string;
  minimum: string;
  pointCost: number;
  claimPoints: number;
  balanceCost: string;
  refundedPoints: number;
  refundedBalance: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}
export interface PromoCouponUnit {
  id: string;
  recipientId: string;
  status: string;
  ownerPoints: number;
  recipientPoints: number;
  ownerBalance: string;
  discountAmount: string;
}
export interface PromoCouponEvent {
  id: string;
  event: string;
  actorId: string;
  actorRole: string;
  notes: string;
  points: number;
  amount: string;
  createdAt: string;
}
export interface PromoCouponTask {
  id: string;
  batchId: string;
  kind: string;
  status: string;
  attempts: number;
  nextAt: string;
  lastError: string;
}
export interface PromoCouponDetail {
  batch: PromoCouponBatch;
  units: PromoCouponUnit[];
  events: PromoCouponEvent[];
}
export interface Page<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
const unwrap = <T>(r: Promise<AxiosResponse<ApiEnvelope<T>>>) =>
  r.then((v) => v.data.data);
export const promoCouponsApi = {
  notices: () =>
    unwrap(
      userRequest.get<
        ApiEnvelope<
          { id: string; title: string; content: string; createdAt: string }[]
        >
      >("/promo-coupons/notices"),
    ),
  options: () =>
    unwrap(
      userRequest.get<
        ApiEnvelope<{
          config: PromoCouponConfig;
          templates: PromoCouponTemplate[];
          balance: string;
          points: number;
        }>
      >("/promo-coupons/options"),
    ),
  customers: (page = 1, keyword = "") =>
    unwrap(
      userRequest.get<ApiEnvelope<Page<{ userId: string }>>>(
        "/promo-coupons/customers",
        { params: { page, keyword } },
      ),
    ),
  quote: (input: PromoCouponInput) =>
    unwrap(
      userRequest.post<ApiEnvelope<PromoCouponQuote>>(
        "/promo-coupons/quotes",
        input,
      ),
    ),
  create: (input: PromoCouponInput) =>
    unwrap(
      userRequest.post<ApiEnvelope<PromoCouponBatch>>(
        "/promo-coupons/batches",
        input,
      ),
    ),
  batches: (page = 1) =>
    unwrap(
      userRequest.get<ApiEnvelope<Page<PromoCouponBatch>>>(
        "/promo-coupons/batches",
        { params: { page } },
      ),
    ),
  detail: (id: string) =>
    unwrap(
      userRequest.get<ApiEnvelope<PromoCouponDetail>>(
        `/promo-coupons/batches/${id}`,
      ),
    ),
  fund: (id: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<PromoCouponBatch>>(
        `/promo-coupons/batches/${id}/fund`,
        {},
      ),
    ),
  close: (id: string, notes: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<boolean>>(
        `/promo-coupons/batches/${id}/close`,
        { notes },
      ),
    ),
  offers: (page = 1) =>
    unwrap(
      userRequest.get<ApiEnvelope<Page<PromoCouponBatch>>>(
        "/promo-coupons/offers",
        { params: { page } },
      ),
    ),
  claim: (id: string, requestId: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<unknown>>(
        `/promo-coupons/offers/${id}/claim`,
        { requestId },
      ),
    ),
  apply: (orderId: string, couponId: string) =>
    unwrap(
      userRequest.post<ApiEnvelope<boolean>>(
        `/promo-coupons/orders/${orderId}/apply`,
        { couponId },
      ),
    ),
};
export interface PromoCouponPermission {
  adminId: string;
  canView: boolean;
  canReview: boolean;
  canClose: boolean;
  canRetry: boolean;
  canConfig: boolean;
}
export const adminPromoCouponsApi = {
  permissions: () =>
    unwrap(
      adminRequest.get<ApiEnvelope<PromoCouponPermission[]>>(
        "/promo-coupons/permissions",
      ),
    ),
  savePermission: (permission: PromoCouponPermission, notes: string) =>
    unwrap(
      adminRequest.put<ApiEnvelope<boolean>>("/promo-coupons/permissions", {
        permission,
        notes,
      }),
    ),
  config: () =>
    unwrap(
      adminRequest.get<ApiEnvelope<PromoCouponConfig>>("/promo-coupons/config"),
    ),
  saveConfig: (config: PromoCouponConfig, notes: string) =>
    unwrap(
      adminRequest.put<ApiEnvelope<boolean>>("/promo-coupons/config", {
        config,
        notes,
      }),
    ),
  templates: () =>
    unwrap(
      adminRequest.get<ApiEnvelope<PromoCouponTemplate[]>>(
        "/promo-coupons/templates",
      ),
    ),
  saveTemplate: (template: PromoCouponTemplate, notes: string) =>
    unwrap(
      adminRequest.post<ApiEnvelope<boolean>>("/promo-coupons/templates", {
        template,
        notes,
      }),
    ),
  batches: (page = 1) =>
    unwrap(
      adminRequest.get<ApiEnvelope<Page<PromoCouponBatch>>>(
        "/promo-coupons/batches",
        { params: { page } },
      ),
    ),
  detail: (id: string) =>
    unwrap(
      adminRequest.get<ApiEnvelope<PromoCouponDetail>>(
        `/promo-coupons/batches/${id}`,
      ),
    ),
  review: (id: string, approve: boolean, notes: string) =>
    unwrap(
      adminRequest.post<ApiEnvelope<boolean>>(
        `/promo-coupons/batches/${id}/review`,
        { approve, notes },
      ),
    ),
  close: (id: string, notes: string) =>
    unwrap(
      adminRequest.post<ApiEnvelope<boolean>>(
        `/promo-coupons/batches/${id}/close`,
        { notes },
      ),
    ),
  tasks: (page = 1) =>
    unwrap(
      adminRequest.get<ApiEnvelope<Page<PromoCouponTask>>>(
        "/promo-coupons/tasks",
        { params: { page } },
      ),
    ),
  retry: (id: string, notes: string) =>
    unwrap(
      adminRequest.post<ApiEnvelope<boolean>>(
        `/promo-coupons/tasks/${id}/retry`,
        { notes },
      ),
    ),
  audit: (page = 1) =>
    unwrap(
      adminRequest.get<ApiEnvelope<Page<PromoCouponEvent>>>(
        "/promo-coupons/audit",
        { params: { page } },
      ),
    ),
  reconciliation: () =>
    unwrap(
      adminRequest.get<
        ApiEnvelope<
          {
            id: string;
            day: string;
            batch_id: string;
            healthy: boolean;
            details: unknown;
          }[]
        >
      >("/promo-coupons/reconciliation"),
    ),
};
export const promoCouponStatus: Record<string, string> = {
  pending_review: "待审核",
  awaiting_payment: "待确认出资",
  active: "进行中",
  closing: "回收中",
  closed: "已结束",
  cancelled: "已取消",
  rejected: "已拒绝",
  stock: "可领取",
  claimed: "已领取",
  locked: "订单占用",
  used: "已使用",
  refunding: "退还中",
  refunded: "已退还",
};

export const promoCouponEvent: Record<string, string> = {
  created: "创建批次",
  funded: "确认出资",
  claimed: "领取优惠券",
  refunded: "原资产退还",
  close_requested: "申请回收",
  cancelled: "取消批次",
  rejected: "审核拒绝",
  awaiting_payment: "审核通过",
  order_refunded: "订单退款恢复权益",
  order_locked: "订单使用优惠券",
  config_updated: "配置更新",
  template_updated: "模板更新",
  permission_updated: "权限更新",
  task_retry: "任务重试",
  task_retried: "任务重试",
};
