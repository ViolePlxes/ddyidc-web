import type { AxiosResponse } from "axios";
import { adminRequest, type ApiEnvelope } from "./request";

export interface UpstreamSupplier {
  id: string;
  name: string;
  type: string;
  url: string;
  username: string;
  rate: number;
  currencyCode: string;
  status: number;
  remark: string;
  createdAt: number;
  updatedAt: number;
}

export interface SupplierInput {
  name: string;
  type: "finance" | "zjmf" | "default";
  url: string;
  username: string;
  token: string;
  secret: string;
  rate: number;
  currencyCode: string;
  status: number;
  remark: string;
}

export interface UpstreamOrderRow {
  id: string;
  orderNo: string;
  user: string;
  email: string;
  mobile: string;
  productName: string;
  payType: string;
  status: string;
  amount: number;
  cost: number;
  profit: number;
  createdAt: string;
}

export interface UpstreamOrderResult {
  metrics: {
    sales: number;
    profit: number;
    productCount: number;
    hostCount: number;
  };
  items: UpstreamOrderRow[];
  total: number;
}

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

export const upstreamAdminApi = {
  suppliers: () => unwrap(adminRequest.get<ApiEnvelope<UpstreamSupplier[]>>("/upstream/suppliers")),
  createSupplier: (input: SupplierInput) => unwrap(adminRequest.post<ApiEnvelope<UpstreamSupplier>>("/upstream/suppliers", input)),
  updateSupplier: (id: string, input: SupplierInput) => unwrap(adminRequest.put<ApiEnvelope<UpstreamSupplier>>(`/upstream/suppliers/${id}`, input)),
  removeSupplier: (id: string) => unwrap(adminRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/upstream/suppliers/${id}`)),
  testSupplier: (id: string) => unwrap(adminRequest.post<ApiEnvelope<{ status: string }>>(`/upstream/suppliers/${id}/test`)),
  orders: (params: { page: number; pageSize: number; keyword?: string; status?: string }) =>
    unwrap(adminRequest.get<ApiEnvelope<UpstreamOrderResult>>("/upstream/orders", { params })),
};
