import type { AxiosResponse } from "axios";
import type { ProductSpec } from "./console";
import { adminRequest, type ApiEnvelope } from "./request";

export interface AdminProduct {
  id: string;
  name: string;
  groupId: string;
  parentGroupId: string;
  groupName: string;
  status: number;
  hidden: boolean;
  sort: number;
  price: number;
  cycle: string;
  specCount: number;
}

export type ProductSpecInput = Omit<ProductSpec, "id" | "productId">;

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

export const adminProductsApi = {
  list: (groupId?: string) => unwrap(adminRequest.get<ApiEnvelope<{ items: AdminProduct[]; total: number }>>("/products", { params: { pageSize: 100, groupId: groupId || undefined } })),
  sort: (groupId: string, ids: string[]) => unwrap(adminRequest.put<ApiEnvelope<{ sorted: boolean }>>("/products/sort", { groupId, ids })),
  specs: (productId: string) => unwrap(adminRequest.get<ApiEnvelope<{ items: ProductSpec[] }>>(`/products/${productId}/specs`)),
  saveSpecs: (productId: string, items: ProductSpecInput[]) => unwrap(adminRequest.put<ApiEnvelope<{ items: ProductSpec[] }>>(`/products/${productId}/specs`, { items })),
};
