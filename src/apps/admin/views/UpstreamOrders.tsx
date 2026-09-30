import { Button, Input, LayerCard, Select } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiMessage } from "../../../shared/api/request";
import { upstreamAdminApi } from "../../../shared/api/upstreamAdmin";
import { DataTable } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { formatDate } from "../../../shared/utils/format";

function yuan(value: number): string {
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(value);
}

export function UpstreamOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const pageSize = 10;
  const query = useQuery({
    queryKey: ["admin", "upstream-orders", page, status, keyword],
    queryFn: () => upstreamAdminApi.orders({ page, pageSize, keyword: keyword || undefined, status: status === "all" ? undefined : status }),
  });
  const data = query.data;
  const metrics = data ? [
    { label: "销售额", value: yuan(data.metrics.sales), hint: "已关联上游的有效订单" },
    { label: "利润", value: yuan(data.metrics.profit), hint: "销售额减上游成本" },
    { label: "映射商品", value: String(data.metrics.productCount), hint: "真实上游商品映射" },
    { label: "上游实例", value: String(data.metrics.hostCount), hint: "已同步实例记录" },
  ] : [];
  const rows = (data?.items ?? []).map((order) => ({
    id: order.id,
    primary: `${order.user || order.email || order.mobile || "未知客户"} · ${order.productName || "未命名商品"}`,
    secondary: order.orderNo,
    meta: `${order.payType} · 成本 ${yuan(order.cost)} · 利润 ${yuan(order.profit)} · ${formatDate(order.createdAt)}`,
    amount: yuan(order.amount),
    status: order.status === "已付款" ? "paid" as const : "pending" as const,
  }));

  return (
    <>
      <PageHeader title="上游订单管理" description="销售额、成本、利润与订单均来自真实上游关联数据。" />
      <LayerCard className="shadow-none grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
        <Input aria-label="上游订单关键词" placeholder="订单号、客户或商品…" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
        <Select aria-label="上游订单状态" value={status} onValueChange={(value) => { setStatus(value ?? "all"); setPage(1); }} items={{ all: "全部状态", paid: "已付款", unpaid: "未付款" }} />
        <Button variant="secondary" onClick={() => { setKeyword(draftKeyword.trim()); setPage(1); }}>筛选</Button>
      </LayerCard>
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null}>
        {data ? <MetricGrid metrics={metrics} /> : null}
      </PageState>
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无上游订单">
        <DataTable rows={rows} primaryLabel="客户 / 商品" secondaryLabel="订单号" withPagination page={page} onPageChange={setPage} perPage={pageSize} totalCount={data?.total ?? 0} showActions={false} />
      </PageState>
    </>
  );
}
