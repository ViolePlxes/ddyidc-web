import { ConfigurableTable, type TableColumn } from "../../../shared/components/ConfigurableTable";
import { Button, InlineCopyText, Input, Tabs } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { destroyApi, type DestroyOption, type DestroyRequestRow } from "../../../shared/api/destroyRequests";
import { instanceManagementApi } from "../../../shared/api/instanceManagement";
import { getApiMessage } from "../../../shared/api/request";
import { Dialog } from "../../../shared/components/Dialog";
import { EmailVerificationFields, useEmailVerification } from "../../../shared/components/EmailVerificationFields";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { Pagination } from "../../../shared/components/Pagination";
import { formatDate } from "../../../shared/utils/format";

const requestLabels: Record<number, string> = { 0: "待审核", 1: "审核通过，处理中", 2: "已拒绝", 4: "已退款" };
const PAGE_SIZE = 10;

const optionColumns: readonly TableColumn[] = [
  { key: "instance", label: "产品 / 实例", width: 260, min: 180, required: true },
  { key: "ip", label: "IP", width: 140, min: 110 },
  { key: "expires", label: "到期时间", width: 140, min: 110 },
  { key: "refundable", type: "N", label: "预计可退款余额", width: 240, min: 180, required: true },
  { key: "note", label: "说明", width: 260, min: 140 },
  { key: "actions", label: "操作", width: 110, min: 90, required: true },
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

export function DestroyRequests() {
  const client = useQueryClient();
  const [tab, setTab] = useState("instances");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<DestroyOption>();
  const [reason, setReason] = useState("");
  const options = useQuery({ queryKey: ["destroy-options"], queryFn: destroyApi.options });
  const requests = useQuery({ queryKey: ["destroy-requests"], queryFn: destroyApi.list });
  const emailStatus = useQuery({
    queryKey: ["destroy-email-status", target?.instanceId],
    queryFn: () => instanceManagementApi(String(target?.instanceId)).productionLockEmail("destroy"),
    enabled: Boolean(target),
    staleTime: 0,
    retry: false,
  });
  const verification = useEmailVerification({
    status: emailStatus.data,
    statusLoading: emailStatus.isLoading,
    statusError: emailStatus.error ? getApiMessage(emailStatus.error) : undefined,
    send: email => instanceManagementApi(String(target?.instanceId)).sendProductionLockEmail(false, email, "destroy").then(() => undefined),
  });
  useEffect(() => {
    if (target) verification.reset();
    // Reset only when the chosen machine changes, not on every verification state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.instanceId]);
  const submit = useMutation({
    mutationFn: () => destroyApi.submit(String(target?.instanceId), reason.trim(), requestID(), verification.email.trim(), verification.code.join("")),
    onSuccess: async () => {
      setTarget(undefined);
      setReason("");
      setTab("requests");
      await Promise.all([client.invalidateQueries({ queryKey: ["destroy-requests"] }), client.invalidateQueries({ queryKey: ["destroy-options"] })]);
    },
  });
  const rows: DestroyOption[] = options.data?.items ?? [];
  const history: DestroyRequestRow[] = requests.data?.items ?? [];
  const total = tab === "instances" ? rows.length : history.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, pages);
  const pagedOptions = useMemo(() => rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), [rows, current]);
  const pagedHistory = useMemo(() => history.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), [history, current]);
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
          <span>{row.eligible ? `实付 ¥${row.paidAmount}` : row.reason || "暂不能核算"}</span>
          {row.lastRejectReason ? <span className="text-sm text-kumo-danger">上次拒绝原因：{row.lastRejectReason}</span> : null}
        </div>;
      case "actions":
        return <Button variant="ghost" size="sm" disabled={!row.eligible} onClick={() => { submit.reset(); verification.reset(); setReason(""); setTarget(row); }}>申请销毁</Button>;
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
    <Tabs variant="underline" value={tab} onValueChange={(value) => { setTab(value ?? "instances"); setPage(1); }} tabs={[{ value: "instances", label: "可销毁实例" }, { value: "requests", label: "我的销毁申请" }]} />
    {tab === "instances"
      ? <PageState loading={options.isLoading} error={options.error ? getApiMessage(options.error) : null} empty={!options.isLoading && !rows.length} emptyTitle="暂无可销毁实例">
        <ConfigurableTable<DestroyOption> rows={pagedOptions} columns={optionColumns} storageKey="ddyidc-console-destroy-columns:v1:instances" loading={options.isLoading} label="可销毁实例" renderCell={optionCell} rowKey={(row) => row.instanceId} emptyContent="暂无可销毁实例" />
      </PageState>
      : <PageState loading={requests.isLoading} error={requests.error ? getApiMessage(requests.error) : null} empty={!requests.isLoading && !history.length} emptyTitle="暂无销毁申请">
        <ConfigurableTable<DestroyRequestRow> rows={pagedHistory} columns={requestColumns} storageKey="ddyidc-console-destroy-columns:v2:requests" loading={requests.isLoading} label="我的销毁申请" renderCell={requestCell} rowKey={(row) => row.id} emptyContent="暂无销毁申请" />
      </PageState>}
    {total > PAGE_SIZE ? <div className="flex flex-wrap items-center justify-end gap-3"><Pagination page={current} totalCount={total} perPage={PAGE_SIZE} setPage={setPage} /></div> : null}
    <Dialog.Root open={Boolean(target)} onOpenChange={(open) => { if (!open && !submit.isPending) { setTarget(undefined); submit.reset(); } }}>
      <Dialog className="grid gap-4 p-8">
        <Dialog.Title>申请销毁实例</Dialog.Title>
        <Dialog.Description>实例 {target?.productName || target?.instanceNo} 销毁后不可恢复，提交后需后台审核。</Dialog.Description>
        {target ? <p>预计可退：<strong>¥{target.refundableAmount}</strong><span className="text-sm text-kumo-subtle">（提交时核算）</span></p> : null}
        <Input aria-label="销毁原因" placeholder="请填写销毁原因（必填）" maxLength={200} value={reason} onChange={(event) => setReason(event.target.value)} />
        {target ? <EmailVerificationFields state={verification} idPrefix={`destroy-email-${target.instanceId}`} onCodeChange={() => submit.reset()} /> : null}
        {submit.error ? <p role="alert" className="text-sm text-kumo-danger">{getApiMessage(submit.error)}</p> : null}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" disabled={submit.isPending} onClick={() => setTarget(undefined)}>取消</Button>
          <Button loading={submit.isPending} disabled={!reason.trim() || !verification.ready} onClick={() => submit.mutate()}>提交销毁申请</Button>
        </div>
      </Dialog>
    </Dialog.Root>
  </div>;
}
