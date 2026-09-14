import { Button, Input, LayerCard, Select } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminOverviewApi } from "../../../shared/api/adminOverview";
import { getApiMessage } from "../../../shared/api/request";
import { DataTable } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { formatDate, formatMoney, orderStatusCode } from "../../../shared/utils/format";

export function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const pageSize = 10;
  const query = useQuery({
    queryKey: ["admin", "orders", page, status, keyword],
    queryFn: () => adminOverviewApi.orders({ page, pageSize, status: status === "all" ? undefined : status, keyword: keyword || undefined }),
  });
  const rows = (query.data?.items ?? []).map((order) => ({
    id: order.id,
    primary: `${order.username || "未知客户"} · ${order.productName || "未命名商品"}`,
    secondary: order.orderNo,
    meta: `创建于 ${formatDate(order.createdAt)}`,
    amount: formatMoney(order.payAmount),
    status: orderStatusCode(order.status),
  }));

  return (
    <>
      <PageHeader title="订单管理" description="按真实订单数据筛选和分页查看。" />
      <LayerCard className="shadow-none grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
        <Input aria-label="订单关键词" placeholder="订单号、客户或商品…" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
        <Select aria-label="订单状态" value={status} onValueChange={(value) => { setStatus(value ?? "all"); setPage(1); }} items={{ all: "全部状态", "1": "待支付", "2": "已支付", "3": "已取消", "4": "已退款", "5": "部分退款", "6": "已完成" }} />
        <Button variant="secondary" onClick={() => { setKeyword(draftKeyword.trim()); setPage(1); }}>筛选</Button>
      </LayerCard>
      <PageState loading={query.isLoading} skeleton="table" error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无订单">
        <DataTable
          rows={rows}
          primaryLabel="客户 / 商品"
          secondaryLabel="订单号"
          withPagination
          page={page}
          onPageChange={setPage}
          perPage={pageSize}
          totalCount={query.data?.total ?? 0}
          showActions={false}
        />
      </PageState>
    </>
  );
}
