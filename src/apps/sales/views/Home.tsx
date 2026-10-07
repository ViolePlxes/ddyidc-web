import { Button, Input, LayerCard } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getApiMessage } from "../../../shared/api/request";
import { salesApi } from "../../../shared/api/sales";
import { DataTable } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { formatDate, formatMoney } from "../../../shared/utils/format";

export function SalesHome() {
  const [page, setPage] = useState(1);
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const pageSize = 20;
  const query = useQuery({
    queryKey: ["sales", "customers", page, keyword],
    queryFn: () => salesApi.customers({ page, pageSize, keyword: keyword || undefined }),
  });
  const customers = query.data?.list ?? [];
  const pageOrders = customers.reduce((sum, customer) => sum + (customer.orderCount ?? 0), 0);
  const pageSpend = customers.reduce((sum, customer) => sum + (customer.totalSpend ?? 0), 0);
  const metrics = [
    { label: "授权客户", value: String(query.data?.total ?? 0), hint: "服务端权限范围" },
    { label: "当前页客户", value: String(customers.length), hint: `第 ${page} 页真实记录` },
    { label: "当前页成交单", value: String(pageOrders), hint: "仅统计有权查看的订单" },
    { label: "当前页成交额", value: formatMoney(pageSpend), hint: "仅统计有权查看的金额" },
  ];
  const rows = customers.map((customer) => ({
    id: customer.customerId,
    primary: customer.username,
    secondary: customer.mobile || "手机号不可见",
    meta: customer.lastPayAt ? `最近成交 ${formatDate(customer.lastPayAt)}` : `注册于 ${formatDate(customer.createdAt)}`,
    amount: customer.totalSpend === undefined ? "金额不可见" : formatMoney(customer.totalSpend),
    status: customer.status === 1 ? "running" as const : "suspended" as const,
  }));

  return (
    <>
      <PageHeader title="销售工作台" description="仅展示当前销售账号获授权的真实客户字段。" />
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null}>
        {query.data ? <MetricGrid metrics={metrics} /> : null}
      </PageState>
      <LayerCard className="flex flex-wrap items-end gap-3 p-4">
        <Input className="max-w-md flex-1" label="搜索客户" placeholder="客户账号、邮箱或手机号…" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
        <Button variant="secondary" onClick={() => { setKeyword(draftKeyword.trim()); setPage(1); }}>筛选</Button>
      </LayerCard>
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无授权客户">
        <DataTable rows={rows} primaryLabel="客户" secondaryLabel="可见手机号" amountLabel="可见成交额" withPagination page={page} onPageChange={setPage} perPage={pageSize} totalCount={query.data?.total ?? 0} showActions={false} />
      </PageState>
    </>
  );
}
