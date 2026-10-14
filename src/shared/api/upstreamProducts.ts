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
  groupId: string;
  name: string;
  description: string;
  type: string;
  price: number;
  cycle: string;
  currencyCode: string;
  status: string;
}

export interface UpstreamProduct {
  checkedAt: number;
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

export interface UpstreamChangeSummary {
  supplierId: string; upstreamProductId: number; checkedAt: number;
  price: number; stock: number; specification: number; unavailable: number; unchanged: number;
  stockCompared: boolean; specificationCompared: boolean;
}
export interface UpstreamRequestMetric {
  supplierId: string; name: string; oneMinute: number; fiveMinutes: number; fifteenMinutes: number; averageInterval: number | null;
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

async function readCompletePages<T extends { id: string }>(path: string, supplierId: string) {
  const items: T[] = [];
  let expectedTotal: number | undefined;
  for (let page = 1; ; page++) {
    const data = await unwrap(adminRequest.get<ApiEnvelope<{ items: T[] | null; total: number }>>(path, { params: { supplierId, page, pageSize: 100 } }));
    if (expectedTotal !== undefined && expectedTotal !== data.total) throw new Error("目录正在变化，请重新加载完整目录");
    expectedTotal = data.total;
    const rows = data.items ?? [];
    if (!rows.length && items.length < data.total) throw new Error("目录返回不完整，请重试");
    items.push(...rows);
    if (items.length >= data.total) break;
  }
  if (items.length !== expectedTotal || new Set(items.map(item => item.id)).size !== expectedTotal) throw new Error("目录发生重复或缺失，请重试");
  return items;
}

export const upstreamProductsApi = {
  comparisonCatalog: (supplierId: string) => unwrap(adminRequest.get<ApiEnvelope<{items: CatalogProduct[]; categories: {id:string; parentId:string; name:string}[]; warning:string; fetchedAt:number}>>(`/upstream/suppliers/${supplierId}/comparison-catalog`, {timeout:75_000})),
  groups: () => unwrap(adminRequest.get<ApiEnvelope<{id:string;parentId:string;name:string}[]>>("/upstream/groups")),
  lossGuard: () => unwrap(adminRequest.get<ApiEnvelope<{enabled:boolean}>>("/upstream/config/loss-guard")),
  allMappings: (supplierId: string) => readCompletePages<UpstreamProduct>("/upstream/products", supplierId),
  allCatalog: (supplierId: string) => readCompletePages<CatalogProduct>(`/upstream/suppliers/${supplierId}/catalog`, supplierId),
  metrics: () => unwrap(adminRequest.get<ApiEnvelope<{ items: UpstreamRequestMetric[] }>>("/upstream/metrics")),
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
  sync: (id: string) => unwrap(adminRequest.post<ApiEnvelope<{ status: string; summary: UpstreamChangeSummary }>>(`/upstream/products/${id}/sync`)),
  setLossGuard: (enabled: boolean) => unwrap(adminRequest.put<ApiEnvelope<{ enabled: boolean }>>("/upstream/config/loss-guard", { enabled })),
};
