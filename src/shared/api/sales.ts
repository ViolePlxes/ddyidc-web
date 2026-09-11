import type { AxiosResponse } from "axios";
import { salesRequest, type ApiEnvelope } from "./request";

export interface SalesCustomer {
  customerId: string;
  username: string;
  mobile: string;
  email: string;
  realName: string;
  status: number;
  createdAt: string;
  orderCount?: number;
  totalSpend?: number;
  balance?: number;
  lastPayAt?: string;
}

export interface SalesCustomerPage {
  list: SalesCustomer[];
  total: number;
  page: number;
  pageSize: number;
}

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

export const salesApi = {
  customers: (params: { page: number; pageSize: number; keyword?: string }) =>
    unwrap(salesRequest.get<ApiEnvelope<SalesCustomerPage>>("/sales/customers", { params })),
};
