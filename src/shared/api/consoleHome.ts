import { consoleApi } from "./console";
import { userTicketApi } from "./tickets";
import { userRequest, type ApiEnvelope } from "./request";
import type { SearchItem } from "../components/SearchPalette";

export interface ConsoleOverview {
  balance: string;
  active: number;
  products: number;
  unpaid: number;
  asOf: string;
  series: Record<"balance" | "active" | "products" | "unpaid", { time: number; value: number }[]>;
}
export async function getConsoleOverview(days: number) {
  const { data } = await userRequest.get<ApiEnvelope<ConsoleOverview>>("/console/overview", { params: { days } });
  if (data.code !== 0) throw new Error(data.message || "读取概览失败");
  return data.data;
}

export async function getConsoleSearch(): Promise<SearchItem[]> {
  const [products, services, tickets] = await Promise.all([
    consoleApi.products(),
    (async () => {
      const first = await consoleApi.userInstances({ page: 1, pageSize: 100 });
      const items = [...first.items];
      for (let page = 2; items.length < first.total; page++) {
        const next = await consoleApi.userInstances({ page, pageSize: 100 });
        if (!next.items.length) throw new Error("服务列表已变化，请重试搜索");
        items.push(...next.items);
      }
      return items;
    })(),
    (async () => {
      const first = await userTicketApi.list({ page: 1, pageSize: 100 });
      const items = [...first.list];
      for (let page = 2; items.length < first.total; page++) {
        const next = await userTicketApi.list({ page, pageSize: 100 });
        if (!next.list.length) throw new Error("工单列表已变化，请重试搜索");
        items.push(...next.list);
      }
      return items;
    })(),
  ]);
  return [
    ...products.items.map((p) => ({ id: `product-${p.id}`, title: p.name, path: `/console/products/${p.id}`, group: "可订购产品" })),
    ...services.map((s) => ({ id: `instance-${s.id}`, title: `${s.name || s.productName} ${s.primaryIp || ""}`, path: `/console/instances/${s.id}`, group: "已有服务" })),
    ...tickets.map((t) => ({ id: `ticket-${t.id}`, title: `${t.title} ${t.ticketNum}`, path: `/console/tickets/${t.id}`, group: "工单" })),
  ];
}
