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
    const items: AdminProduct[] = [];
    let total = 0;
    for (let page = 1; ; page++) {
      const data = await unwrap(adminRequest.get<ApiEnvelope<AdminProductListResponse>>("/products", { params: { page, pageSize: 100, groupId: groupId || undefined } }));
      total = data.total;
      if (!data.items?.length && items.length < total) throw new Error("商品目录已变化，请重试读取整组商品");
      items.push(...(data.items ?? []));
      if (items.length >= total) break;
    }
    if (new Set(items.map((item) => item.id)).size !== total || items.length !== total) throw new Error("商品目录已变化，请重试读取整组商品");
    return { items, total };
  },
  setListed: async (product: AdminProduct, listed: boolean) => {
    if (listed && product.status !== 1) throw new Error("商品本身不可售，不能仅通过显示开关上架");
    let mappingId = "";
    for (let page = 1; ; page++) {
      const data = await unwrap(adminRequest.get<ApiEnvelope<{items: {id: string; productId: string}[]; total: number}>>("/upstream/products", {params: {page, pageSize: 100}}));
      const found = (data.items ?? []).filter(item => item.productId === product.id);
      if (found.length > 1 || (found.length && mappingId)) throw new Error("商品存在多个关联，请在供应商映射中核查");
      if (found[0]) mappingId = found[0].id;
      if (page * 100 >= data.total) break;
      if (!data.items?.length) throw new Error("商品关联读取不完整，请重试");
    }
    if (!mappingId) throw new Error("商品没有供应商映射，当前无法切换上下架");
    return unwrap(adminRequest.put<ApiEnvelope<{hidden: boolean}>>(`/upstream/products/${mappingId}/hidden`, {hidden: !listed}));
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
