import { LayerCard, Pagination, Table } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { userRequest, type ApiEnvelope, getApiMessage } from "../../../shared/api/request";
import { PageState } from "../../../shared/components/PageState";

interface HistoryRow {
  id: string;
  amountYuan: string;
  balanceAfterYuan?: string;
  orderNo?: string;
  productName?: string;
  status?: string;
  paidAt?: string | null;
  createdAt?: string;
  data?: { create_time?: number; client_notes?: string; transaction_number?: string; gateway_name?: string };
}
interface HistoryPage { list: HistoryRow[]; total: number }
type HistoryKind = "orders" | "balance" | "payment";
const titles: Record<HistoryKind, string> = { orders: "历史订单", balance: "迁移前历史余额流水", payment: "历史支付记录" };
const yuan = (value?: string) => value === undefined ? "—" : `¥${Number(value).toFixed(2)}`;
function recordTime(row: HistoryRow) {
  const value = row.paidAt || row.createdAt || (row.data?.create_time ? new Date(row.data.create_time * 1000).toISOString() : null);
  return value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—";
}

export function HistoricalRecords({ kind }: { kind: HistoryKind }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["console", "history", kind, page],
    queryFn: async () => {
      const path = kind === "orders" ? "/console/history/orders" : "/console/history/records";
      const response = await userRequest.get<ApiEnvelope<HistoryPage>>(path, { params: { page, pageSize: 10, ...(kind === "orders" ? {} : { kind }) } });
      if (response.data.code !== 0) throw new Error(response.data.message || "历史记录查询失败");
      return response.data.data;
    },
    staleTime: 30_000,
  });
  const rows = query.data?.list ?? [];
  return <section className="grid gap-3">
    <div><h2 className="text-lg font-semibold text-kumo-strong">{titles[kind]}</h2><p className="text-sm text-kumo-subtle">迁移前历史记录仅供查询，不计入新版余额流水汇总。</p></div>
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle={`暂无${titles[kind]}`}>
      <LayerCard className="shadow-none overflow-x-auto p-0"><Table>
        <Table.Header variant="compact"><Table.Row>
          <Table.Head>{kind === "orders" ? "订单号 / 商品" : kind === "payment" ? "交易号 / 支付方式" : "说明"}</Table.Head>
          <Table.Head>{kind === "orders" ? "支付时间" : "记录时间"}</Table.Head>
          <Table.Head className="text-right">金额（元）</Table.Head>
          <Table.Head>{kind === "orders" ? "状态" : kind === "balance" ? "变动后余额（元）" : "记录类型"}</Table.Head>
        </Table.Row></Table.Header>
        <Table.Body>{rows.map((row) => <Table.Row key={row.id}>
          <Table.Cell><div className="grid gap-1"><span>{kind === "orders" ? row.orderNo : kind === "payment" ? row.data?.transaction_number || "—" : row.data?.client_notes || "余额记录"}</span>{kind === "orders" || kind === "payment" ? <span className="text-sm text-kumo-subtle">{kind === "orders" ? row.productName : row.data?.gateway_name || "历史支付"}</span> : null}</div></Table.Cell>
          <Table.Cell>{recordTime(row)}</Table.Cell><Table.Cell className="text-right">{yuan(row.amountYuan)}</Table.Cell>
          <Table.Cell>{kind === "orders" ? row.status === "Refunded" ? "已退款" : "已支付" : kind === "balance" ? yuan(row.balanceAfterYuan) : "历史支付"}</Table.Cell>
        </Table.Row>)}</Table.Body>
      </Table></LayerCard>
      {(query.data?.total ?? 0) > 10 ? <Pagination page={page} setPage={setPage} perPage={10} totalCount={query.data?.total ?? 0} /> : null}
    </PageState>
  </section>;
}
