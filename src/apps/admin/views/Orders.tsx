import { useSearchParams } from "react-router-dom";
import { Button, Input, LayerCard, Pagination, Select } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminOverviewApi } from "../../../shared/api/adminOverview";
import { getApiMessage } from "../../../shared/api/request";
import { AdminOrdersTable } from "./AdminOrdersTable";
import { useAdminAuthStore } from "../../../shared/stores/staffAuth";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { ReceiptReviews } from "./ReceiptReviews";
import { DeliveryTasks } from "./DeliveryTasks";

export function AdminOrders() {
  const [params, setParams] = useSearchParams(); const record=params.get("record") ?? "";
  const adminId = useAdminAuthStore(state => state.user?.id ?? "anonymous");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const pageSize = 10;
  const query = useQuery({
    queryKey: ["admin", "orders", page, status, keyword, record],
    queryFn: () => adminOverviewApi.orders({ page, pageSize, status: status === "all" ? undefined : status, keyword: keyword || undefined, record:record||undefined }),
  });
  const rows = query.data?.items ?? [];

  return (
    <>
      <PageHeader title="订单管理" description="按真实订单数据筛选和分页查看。" />
      {record ? <div className="flex items-center gap-3"><span>已定位订单：{record}</span><Button variant="secondary" onClick={()=>setParams({})}>清除对象定位</Button></div> : null}
      <LayerCard className="grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
        <Input aria-label="订单关键词" placeholder="订单号、客户或商品…" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
        <Select aria-label="订单状态" value={status} onValueChange={(value) => { setStatus(value ?? "all"); setPage(1); }} items={{ all: "全部状态", "1": "待支付", "2": "已支付", "3": "已取消", "4": "已退款", "5": "部分退款", "6": "已完成" }} />
        <Button variant="secondary" onClick={() => { setKeyword(draftKeyword.trim()); setPage(1); }}>筛选</Button>
      </LayerCard>
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无订单">
        <div className="grid min-w-0 gap-3">
        <AdminOrdersTable key={adminId} rows={rows} adminId={adminId} />
        <Pagination
          page={page}
          setPage={setPage}
          perPage={pageSize}
          totalCount={query.data?.total ?? 0}
        />
        </div>
      </PageState>
      <ReceiptReviews />
      <DeliveryTasks />
    </>
  );
}
