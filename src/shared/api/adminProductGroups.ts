import type { AxiosResponse } from "axios";
import { adminRequest, type ApiEnvelope } from "./request";

export interface ProductGroup {
  id: string;
  parentId: string;
  name: string;
  icon: string;
  sort: number;
  status: number;
  productCount: number;
}

export interface ProductGroupInput {
  name: string;
  parentId: string;
  icon?: string;
  status: number;
}

async function unwrap<T>(response: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

export const adminProductGroupsApi = {
  list: (parentId = "0") => unwrap(adminRequest.get<ApiEnvelope<{ list: ProductGroup[]; count: number }>>("/product-groups", { params: { parentId } })),
  create: (input: ProductGroupInput) => unwrap(adminRequest.post<ApiEnvelope<ProductGroup>>("/product-groups", input)),
  update: (id: string, input: ProductGroupInput) => unwrap(adminRequest.put<ApiEnvelope<{ updated: boolean }>>(`/product-groups/${id}`, input)),
  remove: (id: string) => unwrap(adminRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/product-groups/${id}`)),
  hidden: (id: string, hidden: boolean) => unwrap(adminRequest.put<ApiEnvelope<{ hidden: number }>>(`/product-groups/${id}/hidden`, { hidden: hidden ? 1 : 0 })),
  sort: (parentId: string, ids: string[]) => unwrap(adminRequest.put<ApiEnvelope<{ sorted: boolean }>>("/product-groups/sort", { parentId, ids })),
  moveProducts: (ids: string[], targetGroupId: string) => unwrap(adminRequest.put<ApiEnvelope<{ moved: boolean }>>("/products/move-group", { ids, targetGroupId })),
};
