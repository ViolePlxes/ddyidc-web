import { adminRequest, type ApiEnvelope } from "./request";

/** 前台商品目录（公开接口），代客下单时用来挑选客户可买的商品。 */
export interface ProxyCatalogProduct {
  id: string;
  name: string;
  summary?: string;
  price?: string;
  cycle?: string;
  stock?: number;
  configurable?: boolean;
}
export interface ProxyProductSpec {
  id: string;
  name?: string;
  price?: string;
  priceMode?: string;
  vcpu?: number;
  memory?: number;
}
export interface ProxyProductDetail extends ProxyCatalogProduct {
  specs?: ProxyProductSpec[];
  cycle?: string;
  configurable?: boolean;
  stock?: number;
}

async function publicGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" }, credentials: "same-origin", cache: "no-store" });
  const body = (await response.json()) as ApiEnvelope<T> & { message?: string };
  if (!response.ok || body.code !== 0) throw new Error(body.message || "读取前台商品失败");
  return body.data;
}

export const proxyOrderApi = {
  async catalog() {
    const data = await publicGet<{ items?: ProxyCatalogProduct[] }>("/api/v1/products?page=1&pageSize=100");
    return data.items ?? [];
  },
  productDetail(id: string) {
    return publicGet<ProxyProductDetail>(`/api/v1/products/${encodeURIComponent(id)}`);
  },
  async submit(customerId: string, input: {
    productId: string;
    specId?: string;
    durationMonth: number;
    quantity: number;
    billingCycle: string;
    mode: "balance" | "credit_then_balance";
    notes: string;
    requestId: string;
  }) {
    const response = await adminRequest.post<ApiEnvelope<{
      orderId: string; orderNo: string; payAmount: number; status: number; credited: boolean;
    }>>(`/clients/${encodeURIComponent(customerId)}/proxy-order`, input, { timeout: 65_000 });
    if (response.data.code !== 0) throw new Error(response.data.message || "代客下单失败");
    return response.data.data;
  },
};
