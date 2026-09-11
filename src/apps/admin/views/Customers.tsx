import { Button, Input, LayerCard, Select } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminOverviewApi } from "../../../shared/api/adminOverview";
import { getApiMessage } from "../../../shared/api/request";
import { DataTable } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

export function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const pageSize = 10;
  const query = useQuery({
    queryKey: ["admin", "customers", page, status, keyword],
    queryFn: () => adminOverviewApi.customers({ page, pageSize, status: status === "all" ? undefined : status, keyword: keyword || undefined }),
  });
  const rows = (query.data?.items ?? []).map((customer) => ({
    id: customer.id,
    primary: customer.username,
    secondary: customer.phone || "未绑定手机",
    meta: `${customer.email || "未绑定邮箱"} · ${customer.orderCount} 单 / ${customer.instanceCount} 台`,
    amount: `Lv.${customer.level}`,
    status: customer.status === 1 ? "running" as const : "suspended" as const,
  }));

  return (
    <>
      <PageHeader title="客户管理" description="按真实客户数据查看账户状态和资源摘要。" />
      <LayerCard className="grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
        <Input aria-label="客户关键词" placeholder="账号、邮箱或手机号…" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
        <Select aria-label="客户状态" value={status} onValueChange={(value) => { setStatus(value ?? "all"); setPage(1); }} items={{ all: "全部状态", "1": "启用", "2": "停用" }} />
        <Button variant="secondary" onClick={() => { setKeyword(draftKeyword.trim()); setPage(1); }}>筛选</Button>
      </LayerCard>
      <PageState loading={query.isLoading} skeleton="table" error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无客户">
        <DataTable
          rows={rows}
          primaryLabel="客户账号"
          secondaryLabel="手机号"
          amountLabel="等级"
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
