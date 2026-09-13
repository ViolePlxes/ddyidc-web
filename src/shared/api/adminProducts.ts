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

interface AdminProductListResponse {
  items: AdminProduct[] | null;
  total: number;
}

interface ProductSpecListResponse {
  items: ProductSpec[] | null;
  upstreamStock: string | number | null;
  capturedAt: string | null;
  configured: boolean;
}

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

export const adminProductsApi = {
  list: async (groupId?: string) => {
    const data = await unwrap(adminRequest.get<ApiEnvelope<AdminProductListResponse>>("/products", { params: { pageSize: 100, groupId: groupId || undefined } }));
    return { ...data, items: data.items ?? [] };
  },
  sort: (groupId: string, ids: string[]) => unwrap(adminRequest.put<ApiEnvelope<{ sorted: boolean }>>("/products/sort", { groupId, ids })),
  specs: async (productId: string) => {
    const data = await unwrap(adminRequest.get<ApiEnvelope<ProductSpecListResponse>>(`/products/${productId}/specs`));
    return { ...data, items: data.items ?? [] };
  },
  saveSpecs: async (productId: string, items: ProductSpecInput[]) => {
    const data = await unwrap(adminRequest.put<ApiEnvelope<ProductSpecListResponse>>(`/products/${productId}/specs`, { items }));
    return { ...data, items: data.items ?? [] };
  },
};
