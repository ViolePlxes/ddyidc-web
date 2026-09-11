import type { AxiosResponse } from "axios";
import { adminRequest, type ApiEnvelope } from "./request";

export interface UpstreamSupplier {
  id: string;
  name: string;
  type: string;
  rate: number;
  currencyCode: string;
  status: number;
}

export interface CatalogProduct {
  id: string;
  supplierId: string;
  upstreamProductId: string;
  name: string;
  description: string;
  type: string;
  price: number;
  cycle: string;
  currencyCode: string;
  status: string;
}

export interface UpstreamProduct {
  id: string;
  supplierId: string;
  upstreamProductId: string;
  productId: string;
  name: string;
  description: string;
  productGroupId: string;
  groupName: string;
  parentGroupId: string;
  profitType: number;
  profitValue: number;
  renewProfitType: number;
  renewProfitValue: number;
  upgradeProfitType: number;
  upgradeProfitValue: number;
  autoSetup: boolean;
  hidden: boolean;
  mode: "only_api" | "sync";
  priceBasis: string;
  upstreamPrice: number;
  price: number;
  cycle: string;
  cost: number;
  deletable: boolean;
}

export interface ProductMappingInput {
  supplierId: string;
  upstreamProductId: number;
  name: string;
  description: string;
  productGroupId: string;
  profitType: number;
  profitValue: number;
  renewProfitType: number;
  renewProfitValue: number;
  upgradeProfitType: number;
  upgradeProfitValue: number;
  priceBasis: string;
  mode: "only_api" | "sync";
  autoSetup: boolean;
}

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

export const upstreamProductsApi = {
  suppliers: () => unwrap(adminRequest.get<ApiEnvelope<UpstreamSupplier[]>>("/upstream/suppliers")),
  list: (supplierId?: string) => unwrap(adminRequest.get<ApiEnvelope<{ items: UpstreamProduct[]; total: number; lossGuard: boolean }>>("/upstream/products", { params: { page: 1, pageSize: 100, supplierId: supplierId || undefined } })),
  catalog: (supplierId: string, keyword: string, page: number) => unwrap(adminRequest.get<ApiEnvelope<{ items: CatalogProduct[]; total: number; syncedAt: number; stale: boolean }>>(`/upstream/suppliers/${supplierId}/catalog`, { params: { keyword: keyword || undefined, page, pageSize: 20 } })),
  pull: (supplierId: string) => unwrap(adminRequest.get<ApiEnvelope<{ id: string; status: string }>>(`/upstream/suppliers/${supplierId}/products/pull`)),
  create: (input: ProductMappingInput) => unwrap(adminRequest.post<ApiEnvelope<UpstreamProduct>>("/upstream/products", input)),
  connect: (supplierId: string, items: CatalogProduct[], groupId: string) => unwrap(adminRequest.post<ApiEnvelope<{ items: UpstreamProduct[]; count: number }>>("/upstream/products/connect", {
    supplierId,
    groupId,
    items: items.map((item) => ({
      upstreamProductId: Number(item.upstreamProductId),
      name: item.name,
      description: item.description,
      profitType: 2,
      profitValue: 0,
      renewProfitType: 2,
      renewProfitValue: 0,
      upgradeProfitType: 2,
      upgradeProfitValue: 0,
      priceBasis: "upstream",
      autoSetup: true,
    })),
  })),
  remove: (ids: string[]) => unwrap(adminRequest.post<ApiEnvelope<{ deleted: boolean }>>("/upstream/products/batch-delete", { ids })),
  hidden: (id: string, hidden: boolean) => unwrap(adminRequest.put<ApiEnvelope<{ hidden: boolean }>>(`/upstream/products/${id}/hidden`, { hidden })),
  sync: (id: string) => unwrap(adminRequest.post<ApiEnvelope<{ taskId: string; status: string }>>(`/upstream/products/${id}/sync`)),
  setLossGuard: (enabled: boolean) => unwrap(adminRequest.put<ApiEnvelope<{ enabled: boolean }>>("/upstream/config/loss-guard", { enabled })),
};
