import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { destroyApi, type DestroyRequestRow, type DestroyQuote } from "../../../shared/api/destroyRequests";
import { consoleApi, type ResourceRecord } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { Dialog } from "../../../shared/components/Dialog";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { ScopedTable as Table } from "../../../shared/components/ScopedTable";
import { formatDate } from "../../../shared/utils/format";

const requestLabels: Record<number, string> = { 0: "待审核", 1: "审核通过，处理中", 2: "已拒绝", 4: "已退款" };

function requestID() {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `destroy-${random}`.slice(0, 64);
}

export function DestroyRequests() {
  const client = useQueryClient();
  const [target, setTarget] = useState<ResourceRecord>();
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  const instances = useQuery({ queryKey: ["console", "instances"], queryFn: () => consoleApi.instances() });
  const requests = useQuery({ queryKey: ["destroy-requests"], queryFn: destroyApi.list });
  const quote = useQuery<DestroyQuote>({
    queryKey: ["destroy-quote", target?.id],
    queryFn: () => destroyApi.quote(String(target?.id)),
    enabled: Boolean(target?.id),
    retry: false,
  });
  const submit = useMutation({
    mutationFn: () => destroyApi.submit(String(target?.id), reason.trim(), requestID()),
    onSuccess: async (result) => {
      setNotice(`已提交销毁申请 ${result.refundNo}，预计退款 ¥${result.amount}，等待后台审核。`);
      setTarget(undefined);
      setReason("");
      await Promise.all([client.invalidateQueries({ queryKey: ["destroy-requests"] }), client.invalidateQueries({ queryKey: ["console", "instances"] })]);
    },
  });
  const rows = (instances.data ?? []).filter((instance) => instance.id);
  const history: DestroyRequestRow[] = requests.data?.items ?? [];
  return <div className="grid gap-5">
    <PageHeader title="实例销毁申请" description="按整台机器申请销毁：已付的开通与续费按未使用天数核算，审核通过后原路退入账户余额，机器随即销毁。" />
    <Banner title="退款口径" description="开通费只在首购订单扣除一次；赠送金额不可退；退款金额以提交时的核算为准，审核阶段会再次校验。" />
    {notice ? <Banner title={notice} /> : null}
    <PageState loading={instances.isLoading} error={instances.error ? getApiMessage(instances.error) : null} empty={!instances.isLoading && !rows.length} emptyTitle="暂无可销毁的实例">
      <LayerCard className="overflow-x-auto">
        <Table tableId="apps/console/views/DestroyRequests.tsx:instances">
          <Table.Header><Table.Row>{["实例", "产品", "到期时间", "操作"].map((label) => <Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header>
          <Table.Body>{rows.map((instance) => <Table.Row key={instance.id}>
            <Table.Cell><Link to={`/console/instances/${instance.id}`}>{instance.name || instance.id}</Link><p className="text-base text-kumo-subtle">{instance.id}</p></Table.Cell>
            <Table.Cell>{instance.productName || "—"}</Table.Cell>
            <Table.Cell>{instance.expiresAt ? formatDate(instance.expiresAt) : "—"}</Table.Cell>
            <Table.Cell><Button variant="secondary" onClick={() => { setNotice(""); submit.reset(); setTarget(instance); }}>申请销毁</Button></Table.Cell>
          </Table.Row>)}</Table.Body>
        </Table>
      </LayerCard>
    </PageState>
    <div className="grid gap-3">
      <h2 className="text-lg font-semibold">我的销毁申请</h2>
      <PageState loading={requests.isLoading} error={requests.error ? getApiMessage(requests.error) : null} empty={!requests.isLoading && !history.length} emptyTitle="暂无销毁申请">
        <LayerCard className="overflow-x-auto">
          <Table tableId="apps/console/views/DestroyRequests.tsx:requests">
            <Table.Header><Table.Row>{["申请单号", "退款金额", "状态", "原因", "提交时间", "完成时间"].map((label) => <Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header>
            <Table.Body>{history.map((row) => <Table.Row key={row.id}>
              <Table.Cell>{row.refundNo}</Table.Cell>
              <Table.Cell>¥{row.amount}</Table.Cell>
              <Table.Cell>{requestLabels[row.status] ?? `状态 ${row.status}`}{row.reviewReason ? <p className="text-base text-kumo-subtle">{row.reviewReason}</p> : null}</Table.Cell>
              <Table.Cell>{row.reason}</Table.Cell>
              <Table.Cell>{formatDate(row.createdAt)}</Table.Cell>
              <Table.Cell>{row.refundedAt ? formatDate(row.refundedAt) : "—"}</Table.Cell>
            </Table.Row>)}</Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </div>
    <Dialog.Root open={Boolean(target)} onOpenChange={(open) => { if (!open && !submit.isPending) { setTarget(undefined); submit.reset(); } }}>
      <Dialog className="grid gap-4 p-8">
        <Dialog.Title>申请销毁实例</Dialog.Title>
        <Dialog.Description>实例 {target?.name || target?.id} 销毁后不可恢复，提交后需后台审核。</Dialog.Description>
        {quote.isPending ? <p>正在核算可退金额…</p> : null}
        {quote.error ? <Banner variant="error" title={getApiMessage(quote.error)} /> : null}
        {quote.data ? <div className="grid gap-2">
          <p>已付金额：¥{quote.data.paidAmount}</p>
          <p>预计可退：<strong>¥{quote.data.refundableAmount}</strong></p>
          <p className="text-base text-kumo-subtle">包含首购与已完成续费周期，按申请时间的未使用天数折算。</p>
        </div> : null}
        <Input aria-label="销毁原因" placeholder="请填写销毁原因（必填）" maxLength={200} value={reason} onChange={(event) => setReason(event.target.value)} />
        {submit.error ? <Banner variant="error" title={getApiMessage(submit.error)} /> : null}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" disabled={submit.isPending} onClick={() => setTarget(undefined)}>取消</Button>
          <Button loading={submit.isPending} disabled={!reason.trim() || !quote.data || Boolean(quote.error)} onClick={() => submit.mutate()}>提交销毁申请</Button>
        </div>
      </Dialog>
    </Dialog.Root>
  </div>;
}
