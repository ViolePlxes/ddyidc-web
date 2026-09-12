import type { AxiosResponse } from "axios";
import { adminRequest, type ApiEnvelope } from "./request";

export interface AdminOrderRow {
  id: string;
  orderNo: string;
  username: string;
  productName: string;
  payAmount: number;
  status: number;
  payType: number;
  createdAt: string;
}

export interface AdminCustomerRow {
  id: string;
  username: string;
  displayName: string;
  realnameStatus: number;
  email: string;
  phone: string;
  status: number;
  level: number;
  socialLogin: string;
  country: string;
  address: string;
  language: string;
  remark: string;
  activeProductCount: number;
  productCount: number;
  balance: number;
  consumeAmount: number;
  refundAmount: number;
  withdrawalAmount: number;
  orderCount: number;
  instanceCount: number;
  createdAt: string;
}

export interface AdminCreateCustomerInput {
  name: string;
  countryCode: string;
  mobile?: string;
  email?: string;
  password: string;
}

export interface AdminDashboard {
  metrics: {
    totalOrders: number;
    todayOrders: number;
    todayRevenueCents: number;
    todayPaidOrders: number;
    totalCustomers: number;
    newCustomersThisWeek: number;
    totalInstances: number;
    runningInstances: number;
    pendingOrders: number;
    openTickets: number;
  };
  revenueTrend: {
    date: string;
    revenueCents: number;
    orderCount: number;
  }[];
  recentOrders: AdminOrderRow[];
}

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminCustomerPage extends AdminPage<AdminCustomerRow> {
  pageBalanceSum: number;
  totalBalanceSum: number;
  totalUsers: number;
}

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

export const adminOverviewApi = {
  dashboard: () => unwrap(adminRequest.get<ApiEnvelope<AdminDashboard>>("/dashboard")),
  orders: (params: { page: number; pageSize: number; status?: string; keyword?: string }) =>
    unwrap(adminRequest.get<ApiEnvelope<AdminPage<AdminOrderRow>>>("/orders", { params })),
  customers: (params: { page: number; pageSize: number; status?: string; keyword?: string }) =>
    unwrap(adminRequest.get<ApiEnvelope<AdminCustomerPage>>("/customers", { params })),
  customer: (id: string) =>
    unwrap(adminRequest.get<ApiEnvelope<AdminCustomerRow>>(`/customers/${id}`)),
  createCustomer: (input: AdminCreateCustomerInput) =>
    unwrap(adminRequest.post<ApiEnvelope<AdminCustomerRow>>("/customers", input)),
};
