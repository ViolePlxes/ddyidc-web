import type { AxiosResponse } from "axios";
import { adminRequest, type ApiEnvelope } from "./request";

export interface AdminList<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MarketingConfigItem {
  key: string;
  value: string;
  description: string;
}

export interface MarketingInvite {
  id: string;
  userId: string;
  code: string;
  status: number;
  rejectReason?: string;
  inviteCount: number;
  createdAt: string;
  username: string;
}

export interface MarketingReward {
  id: string;
  orderId: string;
  orderNo: string;
  username: string;
  rewardUserName: string;
  level: number;
  amount: number;
  status: number;
  settledAt?: string;
  remark?: string;
  createdAt: string;
}

export interface SalesUser {
  id: string;
  staffNo: string;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  status: number;
  createdAt: string;
}

export interface SalesVisibility {
  salesId: string;
  canViewMobile: boolean;
  canViewEmail: boolean;
  canViewOrders: boolean;
  canViewSpend: boolean;
  canViewBalance: boolean;
  canViewRealname: boolean;
  canFollowup: boolean;
}

export interface SalesCreateInput {
  staffNo: string;
  username: string;
  password: string;
  name: string;
  phone: string;
  email: string;
}

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

export const adminMarketingApi = {
  config: () => unwrap(adminRequest.get<ApiEnvelope<{ items: MarketingConfigItem[] }>>("/marketing/config")),
  saveConfig: (values: Record<string, string>) => unwrap(adminRequest.put<ApiEnvelope<{ saved: boolean }>>("/marketing/config", { values })),
  invites: (params: { page: number; pageSize: number; keyword?: string; status?: string }) => unwrap(adminRequest.get<ApiEnvelope<AdminList<MarketingInvite>>>("/marketing/invites", { params })),
  setInviteStatus: (id: string, status: 1 | 2) => unwrap(adminRequest.post<ApiEnvelope<{ updated: boolean }>>(`/marketing/invites/${id}/status`, { status })),
  reviewInvite: (id: string, approve: boolean, reason = "") => unwrap(adminRequest.post<ApiEnvelope<{ reviewed: boolean }>>(`/marketing/invites/${id}/review`, { approve, reason })),
  rewards: (params: { page: number; pageSize: number; keyword?: string; status?: string; level?: string }) => unwrap(adminRequest.get<ApiEnvelope<AdminList<MarketingReward>>>("/marketing/rewards", { params })),
  settleReward: (id: string) => unwrap(adminRequest.post<ApiEnvelope<{ settled: boolean }>>(`/marketing/rewards/${id}/settle`)),
  sales: (params: { page: number; pageSize: number; keyword?: string }) => unwrap(adminRequest.get<ApiEnvelope<AdminList<SalesUser>>>("/marketing/sales", { params })),
  createSales: (input: SalesCreateInput) => unwrap(adminRequest.post<ApiEnvelope<SalesUser>>("/marketing/sales", input)),
  setSalesStatus: (id: string, status: 1 | 2) => unwrap(adminRequest.post<ApiEnvelope<{ updated: boolean }>>(`/marketing/sales/${id}/status`, { status })),
  visibility: (id: string) => unwrap(adminRequest.get<ApiEnvelope<SalesVisibility>>(`/marketing/sales/${id}/visibility`)),
  saveVisibility: (id: string, input: SalesVisibility) => unwrap(adminRequest.put<ApiEnvelope<{ saved: boolean }>>(`/marketing/sales/${id}/visibility`, input)),
};
