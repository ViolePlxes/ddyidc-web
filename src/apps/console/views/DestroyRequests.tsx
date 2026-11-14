import { ConfigurableTable, type TableColumn } from "../../../shared/components/ConfigurableTable";
import { Button, InlineCopyText, Input, Tabs } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { destroyApi, type DestroyOption, type DestroyRequestRow } from "../../../shared/api/destroyRequests";
import { getApiMessage } from "../../../shared/api/request";
import { DestroyVerifyDialog } from "../../../shared/components/DestroyVerifyDialog";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { Pagination } from "../../../shared/components/Pagination";
import { formatDate } from "../../../shared/utils/format";

const requestLabels: Record<number, string> = { 0: "待审核", 1: "审核通过，处理中", 2: "已拒绝", 4: "已退款" };
/** Vertical gap between the page blocks (`gap-5`). */
const PAGE_GAP = 20;

const optionColumns: readonly TableColumn[] = [
  { key: "instance", label: "产品 / 实例", width: 235, min: 170, required: true },
  { key: "ip", label: "IP", width: 130, min: 100 },
  { key: "expires", label: "到期时间", width: 110, min: 95 },
  { key: "refundable", type: "N", label: "预计可退款余额", width: 185, min: 150, required: true },
  { key: "note", label: "说明", width: 175, min: 130 },
  { key: "actions", label: "操作", width: 100, min: 90, required: true },
];

const requestColumns: readonly TableColumn[] = [
  { key: "refundNo", label: "申请单号", width: 300, min: 200, required: true },
  { key: "product", label: "产品 / 实例", width: 260, min: 180, required: true },
  { key: "ip", label: "IP", width: 140, min: 110 },
  { key: "amount", type: "N", label: "可退款金额", width: 160, min: 130 },
  { key: "status", label: "状态", width: 150, min: 110 },
  { key: "reason", label: "原因", width: 260, min: 140 },
  { key: "created", label: "提交时间", width: 180, min: 140 },
  { key: "refunded", label: "完成时间", width: 180, min: 140 },
];

function requestID() {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `destroy-${random}`.slice(0, 64);
}

/** Row count that fills the visible page without making the whole page scroll. */
function useFillingPageSize(host: React.RefObject<HTMLDivElement | null>, resetKey: string, dataKey: string) {
  const [perPage, setPerPage] = useState(10);
  useEffect(() => {
    const pane = document.querySelector<HTMLElement>("[data-dashboard-scroll]");
    if (!pane) return;
    const measure = () => {
      const node = host.current;
      if (!node) return;
      const paneRect = pane.getBoundingClientRect();
      // The platform footer and the page's bottom padding share the scroll pane,
      // so both have to be reserved before the table is sized.
      const footerHeight = document.querySelector<HTMLElement>('[aria-label="平台页脚"]')?.getBoundingClientRect().height ?? 0;
      let bottomPadding = 0;
      for (let parent: HTMLElement | null = node; parent && bottomPadding === 0; parent = parent.parentElement) {
        bottomPadding = Number.parseFloat(getComputedStyle(parent).paddingBottom || "0") || 0;
      }
      const paginationHeight = document.querySelector<HTMLElement>("[data-destroy-pagination]")?.getBoundingClientRect().height ?? 36;
      const limit = paneRect.bottom - footerHeight - bottomPadding - paginationHeight - PAGE_GAP - 8;
      const available = limit - node.getBoundingClientRect().top;
      const headHeight = node.querySelector<HTMLElement>("thead")?.getBoundingClientRect().height ?? 44;
      const rowHeight = node.querySelector<HTMLElement>("tbody tr")?.getBoundingClientRect().height ?? 48;
      const rows = Math.floor((available - headHeight) / Math.max(28, rowHeight));
      setPerPage(Math.min(50, Math.max(3, rows)));
    };
    measure();
    // Second pass once the first render has real row heights instead of skeletons.
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [host, resetKey, dataKey]);
  return perPage;
}

export function DestroyRequests() {
  const client = useQueryClient();
  const [tab, setTab] = useState("instances");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<DestroyOption>();
  const tableHost = useRef<HTMLDivElement>(null);
  const options = useQuery({ queryKey: ["destroy-options"], queryFn: destroyApi.options });
  const requests = useQuery({ queryKey: ["destroy-requests"], queryFn: destroyApi.list });
  const submit = useMutation({
    mutationFn: (input: { reason: string; email: string; code: string }) => destroyApi.submit(String(target?.instanceId), input.reason, requestID(), input.email, input.code),
    onSuccess: async () => {
      setTarget(undefined);
      setTab("requests");
      await Promise.all([client.invalidateQueries({ queryKey: ["destroy-requests"] }), client.invalidateQueries({ queryKey: ["destroy-options"] })]);
    },
  });
  const rows: DestroyOption[] = options.data?.items ?? [];
  const history: DestroyRequestRow[] = requests.data?.items ?? [];
  const perPage = useFillingPageSize(tableHost, tab, `${rows.length}:${history.length}`);
  const keyword = search.trim().toLowerCase();
  const matches = (values: Array<string | undefined>) => !keyword || values.some((value) => (value ?? "").toLowerCase().includes(keyword));
  const filteredOptions = useMemo(
    () => (keyword ? rows.filter((row) => matches([row.productName, row.instanceNo, row.instanceId, row.ip, row.reason, row.remaining])) : rows),
    [keyword, rows],
  );
  const filteredHistory = useMemo(
    () => (keyword ? history.filter((row) => matches([row.refundNo, row.productName, row.instanceNo, row.instanceId, row.ip, row.reason, row.reviewReason, row.amount, requestLabels[row.status]])) : history),
    [history, keyword],
  );
  const activeRows = tab === "instances" ? filteredOptions : filteredHistory;
  const total = activeRows.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, pages);
  const pagedOptions = useMemo(() => filteredOptions.slice((current - 1) * perPage, current * perPage), [filteredOptions, current, perPage]);
  const pagedHistory = useMemo(() => filteredHistory.slice((current - 1) * perPage, current * perPage), [filteredHistory, current, perPage]);
  const searching = keyword.length > 0;
  const optionCell = (row: DestroyOption, key: string): ReactNode => {
    switch (key) {
      case "instance":
        return <div className="grid gap-1"><RouterLink to={`/console/instances/${row.instanceId}`} className="truncate font-medium text-kumo-brand hover:underline">{row.productName || "未命名产品"}</RouterLink><span className="text-sm text-kumo-subtle">{row.instanceNo || row.instanceId}</span></div>;
      case "ip":
        return row.ip ? <InlineCopyText className="w-fit leading-[normal]" value={row.ip} labels={{ copyAction: "复制 IP", copied: "已复制" }}>{row.ip}</InlineCopyText> : "—";
      case "expires":
        return row.expiresAt ? row.expiresAt.slice(0, 10) : "—";
      case "refundable":
        return row.eligible ? <div className="flex items-center gap-2"><span>{`¥${row.refundableAmount}`}</span>{row.remaining ? <span className="text-sm text-kumo-subtle">{row.remaining}</span> : null}</div> : "—";
      case "note":
        return <div className="grid gap-1">
          <span title={row.eligible ? `实付 ¥${row.paidAmount}` : row.reason || "暂不能核算"}>{row.eligible ? `实付 ¥${row.paidAmount}` : row.reason || "暂不能核算"}</span>
          {row.lastRejectReason ? <span className="text-sm text-kumo-danger" title={`上次拒绝原因：${row.lastRejectReason}`}>拒绝原因：{row.lastRejectReason}</span> : null}
        </div>;
      case "actions":
        return <Button variant="destructive" size="sm" disabled={!row.eligible} onClick={() => { submit.reset(); setTarget(row); }}>申请销毁</Button>;
      default:
        return null;
    }
  };
  const requestCell = (row: DestroyRequestRow, key: string): ReactNode => {
    switch (key) {
      case "refundNo":
        return row.refundNo;
      case "product":
        return <div className="grid gap-1"><RouterLink to={`/console/instances/${row.instanceId}`} className="truncate font-medium text-kumo-brand hover:underline">{row.productName || "未命名产品"}</RouterLink><span className="text-sm text-kumo-subtle">{row.instanceNo || row.instanceId}</span></div>;
      case "ip":
        return row.ip ? <InlineCopyText className="w-fit leading-[normal]" value={row.ip} labels={{ copyAction: "复制 IP", copied: "已复制" }}>{row.ip}</InlineCopyText> : "—";
      case "amount":
        return <div className="grid gap-1"><span>{`¥${row.amount}`}</span><span className="text-sm text-kumo-subtle">提交时核算</span></div>;
      case "status":
        return requestLabels[row.status] ?? `状态 ${row.status}`;
      case "reason":
        return row.status === 2
          ? <span className="block truncate" title={row.reviewReason}>{row.reviewReason ? `拒绝原因：${row.reviewReason}` : "—"}</span>
          : <span className="block truncate" title={row.reason}>{row.reason}</span>;
      case "created":
        return formatDate(row.createdAt);
      case "refunded":
        return row.refundedAt ? formatDate(row.refundedAt) : "—";
      default:
        return null;
    }
  };
  return <div className="grid gap-5">
    <PageHeader title="实例销毁申请" description="按整台机器申请销毁，审核通过后退款退入账户余额。" />
    <div className="flex flex-wrap items-center gap-3">
      <Input
        size="sm"
        className="min-w-0 max-w-md flex-1"
        aria-label="搜索销毁相关记录"
        placeholder={tab === "instances" ? "搜索产品名称、实例编号、IP 或说明" : "搜索申请单号、产品名称、实例编号、IP 或状态"}
        value={search}
        onChange={(event) => { setSearch(event.target.value); setPage(1); }}
      />
      {searching ? <span className="text-sm text-kumo-subtle">匹配 {total} 条，共 {tab === "instances" ? rows.length : history.length} 条</span> : null}
    </div>
    <Tabs variant="underline" value={tab} onValueChange={(value) => { setTab(value ?? "instances"); setPage(1); }} tabs={[{ value: "instances", label: "可销毁实例" }, { value: "requests", label: "我的销毁申请" }]} />
    <div ref={tableHost} className="min-w-0">
      {tab === "instances"
        ? <PageState loading={options.isLoading} error={options.error ? getApiMessage(options.error) : null} empty={!options.isLoading && !filteredOptions.length} emptyTitle={searching ? "没有匹配的实例" : "暂无可销毁实例"}>
          <ConfigurableTable<DestroyOption> rows={pagedOptions} columns={optionColumns} storageKey="ddyidc-console-destroy-columns:v1:instances" loading={options.isLoading} label="可销毁实例" renderCell={optionCell} rowKey={(row) => row.instanceId} emptyContent={searching ? "没有匹配的实例" : "暂无可销毁实例"} />
        </PageState>
        : <PageState loading={requests.isLoading} error={requests.error ? getApiMessage(requests.error) : null} empty={!requests.isLoading && !filteredHistory.length} emptyTitle={searching ? "没有匹配的申请" : "暂无销毁申请"}>
          <ConfigurableTable<DestroyRequestRow> rows={pagedHistory} columns={requestColumns} storageKey="ddyidc-console-destroy-columns:v2:requests" loading={requests.isLoading} label="我的销毁申请" renderCell={requestCell} rowKey={(row) => row.id} emptyContent={searching ? "没有匹配的申请" : "暂无销毁申请"} />
        </PageState>}
    </div>
    {total > perPage ? <div className="flex flex-wrap items-center justify-end gap-3" data-destroy-pagination><Pagination page={current} totalCount={total} perPage={perPage} setPage={setPage} /></div> : null}
    <DestroyVerifyDialog
      target={target ? { instanceId: target.instanceId, instanceNo: target.instanceNo, productName: target.productName, refundableAmount: target.refundableAmount } : undefined}
      open={Boolean(target)}
      onOpenChange={(open) => { if (!open && !submit.isPending) { setTarget(undefined); submit.reset(); } }}
      submitting={submit.isPending}
      error={submit.error}
      onConfirm={async input => { await submit.mutateAsync(input); }}
    />
  </div>;
}
