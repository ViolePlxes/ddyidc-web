import type { AxiosResponse } from "axios";
import { adminRequest, type ApiEnvelope } from "./request";

export interface SupplierSnapshotInfo {
 enabled:boolean; intervalMinutes:number; state:string; lastSuccessAt:number; lastAttemptAt:number; nextRunAt:number; total:number; completed:number; failed:number; message:string;
}

export interface UpstreamSupplier {
  lastSyncedAt?:number;
  snapshotSync?:SupplierSnapshotInfo;
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
  type: string;
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
  configureSnapshot: (id:string,enabled:boolean,intervalMinutes:number) => unwrap(adminRequest.put<ApiEnvelope<SupplierSnapshotInfo>>(`/upstream/suppliers/${id}/snapshot-sync`,{enabled,intervalMinutes})),
  startSnapshot: (id:string) => unwrap(adminRequest.post<ApiEnvelope<SupplierSnapshotInfo>>(`/upstream/suppliers/${id}/snapshot-sync`)),
  suppliers: () => unwrap(adminRequest.get<ApiEnvelope<UpstreamSupplier[]>>("/upstream/suppliers")),
  createSupplier: (input: SupplierInput) => unwrap(adminRequest.post<ApiEnvelope<UpstreamSupplier>>("/upstream/suppliers", input)),
  updateSupplier: (id: string, input: SupplierInput) => unwrap(adminRequest.put<ApiEnvelope<UpstreamSupplier>>(`/upstream/suppliers/${id}`, input)),
  removeSupplier: (id: string) => unwrap(adminRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/upstream/suppliers/${id}`)),
  testSupplier: (id: string) => unwrap(adminRequest.post<ApiEnvelope<{ status: string }>>(`/upstream/suppliers/${id}/test`)),
  orders: (params: { page: number; pageSize: number; keyword?: string; status?: string }) =>
    unwrap(adminRequest.get<ApiEnvelope<UpstreamOrderResult>>("/upstream/orders", { params })),
};

export interface AdapterModule {
 configFields?: Array<{name:string;label:string;secret:boolean;required:boolean}>;
 id: string; name: string; version: string; contractVersion: number; variants: string[];
 capabilities: Record<string,string>; description: string; status: "enabled"|"sales_stopped"|"disabled";
 revision: number; suppliers: number; products: number; hosts: number; pendingOrders: number; uninstallable: boolean;
}
export const adapterModulesApi = {
 options: () => unwrap(adminRequest.get<ApiEnvelope<AdapterModule[]>>("/upstream/module-options")),
 list: () => unwrap(adminRequest.get<ApiEnvelope<AdapterModule[]>>("/upstream/modules")),
 update: (id: string, status: AdapterModule["status"], revision: number, notes: string) => unwrap(adminRequest.put<ApiEnvelope<{updated:boolean}>>(`/upstream/modules/${id}`,{status,revision,notes})),
};
