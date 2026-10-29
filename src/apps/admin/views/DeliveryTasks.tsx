import {ScopedTable as Table} from '../../../shared/components/ScopedTable';
import { Dialog } from "../../../shared/components/Dialog";
import { Banner, Button, Input, LayerCard} from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminRequest, type ApiEnvelope, getApiMessage } from "../../../shared/api/request";
import { PageState } from "../../../shared/components/PageState";

interface DeliveryTask { id: string; taskKey: string; businessId: string; status: string; attempt: number; safeError: string; availableAt: string; reviewNote?: string }
const labels: Record<string, string> = { pending: "待执行", running: "执行中", unknown: "结果待核实", succeeded: "已完成", failed: "执行失败", cancelled: "已取消" };
export function DeliveryTasks() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DeliveryTask>();
  const [reason, setReason] = useState("");
 const [remoteInstanceId,setRemoteInstanceId]=useState("");
  const client = useQueryClient();
  const reconcile = useMutation({
    mutationFn: async (action: "resume" | "record_review") => {
      if (!selected || !reason.trim()) throw new Error("请填写核对依据");
      await adminRequest.post(`/payment/delivery-tasks/${selected.id}/reconcile`, action === "record_review"
        ? { action, expectedAttempt: selected.attempt, reason: reason.trim() }
        : { reason: reason.trim(), remoteInstanceId: remoteInstanceId.trim() || undefined });
    },
    onSuccess: async () => { setSelected(undefined); await client.invalidateQueries({ queryKey: ["admin", "delivery-tasks"] }); },
  });
  const query = useQuery({ queryKey: ["admin", "delivery-tasks", page], queryFn: async () => (await adminRequest.get<ApiEnvelope<DeliveryTask[]>>("/payment/delivery-tasks", { params: { page } })).data.data });
  return <LayerCard >
    <LayerCard.Secondary><div className="flex items-center justify-between"><h2>支付后业务任务</h2><Button variant="secondary" loading={query.isFetching} onClick={() => void query.refetch()}>刷新</Button></div></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
    <p>任务在支付事务内登记。外部结果不确定或执行中断时暂停，需核对远端订单与本地记录，不能直接重复采购。</p>
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !query.data?.length} emptyTitle="暂无业务任务">
      <Table tableId="apps/admin/views/DeliveryTasks.tsx:1"><Table.Header><Table.Row>{["任务", "业务 ID", "状态", "执行次数", "下次执行", "处理说明", "操作"].map(label => <Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header>
        <Table.Body>{query.data?.map(row => <Table.Row key={row.id}><Table.Cell>{row.taskKey}</Table.Cell><Table.Cell>{row.businessId}</Table.Cell><Table.Cell>{labels[row.status] ?? row.status}</Table.Cell><Table.Cell>{row.attempt}</Table.Cell><Table.Cell>{row.availableAt || "不自动重试"}</Table.Cell><Table.Cell><p>{row.safeError || "—"}</p>{row.reviewNote ? <p>最近核对：{row.reviewNote}</p> : null}</Table.Cell><Table.Cell><Button variant="secondary" disabled={row.status !== "unknown"} onClick={() => { reconcile.reset(); setReason(""); setRemoteInstanceId(""); setSelected(row); }}>核对事实</Button></Table.Cell></Table.Row>)}</Table.Body>
      </Table>
    </PageState>
    <div className="flex justify-end gap-2"><Button variant="secondary" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}>上一页</Button><span>第 {page} 页</span><Button variant="secondary" disabled={query.isFetching || (query.data?.length ?? 0) < 20} onClick={() => setPage(page + 1)}>下一页</Button></div>
    <Dialog.Root open={Boolean(selected)} onOpenChange={open => { if (!open && !reconcile.isPending) setSelected(undefined); }}>
      <Dialog className="grid gap-4 p-8"><Dialog.Title>核对业务任务</Dialog.Title><Dialog.Description>业务 {selected?.businessId}。系统仅恢复可幂等执行的本地交付规划，或确认已有实例的完成事实。恢复规划可能继续交付尚未执行的单元；远端采购结果未知的单元不会重新采购。续费仅在已保存本次付款成功证据、并只读确认到期时间更新后完成本地交付，不会再次续费付款；付款结果未知时继续暂停。请先核对订单，操作会记录管理员和原因。</Dialog.Description>
        {selected?.taskKey.startsWith("delivery-unit:") ? <><Input label="远端实例 ID（可选）" value={remoteInstanceId} maxLength={20} onChange={e=>setRemoteInstanceId(e.target.value)} /><p>仅用于已产生账单但尚未关联本地实例的采购。系统只读核对产品、账单和有效实例是否匹配，通过后恢复本地关联，不会再次下单或扣款。留空则仅核对已有本地事实。</p></> : null}
        <Input label="核对依据" value={reason} maxLength={remoteInstanceId.trim()?100:256} onChange={e => setReason(e.target.value)} />
        <p>暂未取得完整远端证据时，可记录核对进度并保持暂停。记录不会改变付款结果或触发重试；请勿填写密码、验证码或完整个人资料。</p>
        {reconcile.error ? <Banner variant="error" title="未能安全恢复" description={getApiMessage(reconcile.error)} /> : null}
        <div className="flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={reconcile.isPending} onClick={() => setSelected(undefined)}>取消</Button><Button variant="secondary" disabled={reconcile.isPending || !reason.trim()} onClick={() => reconcile.mutate("record_review")}>记录核对，保持暂停</Button><Button loading={reconcile.isPending} disabled={!reason.trim()} onClick={() => reconcile.mutate("resume")}>核对并恢复</Button></div>
      </Dialog>
    </Dialog.Root>
  </LayerCard.Primary></LayerCard>;
}
