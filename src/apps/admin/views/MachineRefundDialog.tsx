import { Banner, Button, Input, Switch } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog } from "../../../shared/components/Dialog";
import { DefinitionList } from "../../../shared/components/DataTable";
import { adminRequest, type ApiEnvelope, getApiMessage } from "../../../shared/api/request";
import type { TodoEntry } from "../../../shared/api/adminTodos";
interface MachineQuote {
 calculation: { appliedAt: string; paidAmount: string; refundAmount: string; fees: { setup: string }; periods: { instanceId: string; totalDays: number; usedDays: number; remainingDays: number }[] };
 intent?: { State: string; Amount: string; AdminName: string; UpdatedAt: string; requestId: string; Reason: string; adminId: string };
}
interface Application { updatedAt: string }
const stateLabels: Record<string, string> = { prepared: "准备提交，待核查", waiting: "等待供应商审核退款", rejected: "供应商已拒绝或取消，请人工核查", completed: "已退入余额" };
export function MachineRefundDialog({ row, action, onDone }: { row: TodoEntry; action: "direct_balance" | "upstream"; onDone: () => void }) {
 const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [confirmed, setConfirmed] = useState(false); const [large, setLarge] = useState(false); const [requestId] = useState(() => crypto.randomUUID()); const cache = useQueryClient();
 const label = action === "direct_balance" ? "直接退余额" : "向上游申请退款";
 const quote = useQuery({ queryKey: ["machine-refund-quote", row.id], enabled: open, retry: false, queryFn: async () => {
  const [quote, application] = await Promise.all([adminRequest.get<ApiEnvelope<MachineQuote>>(`/todos/refund-applications/${row.id}/machine-actions`, { timeout: 35000 }), adminRequest.get<ApiEnvelope<Application>>(`/todos/refund-applications/${row.id}`)]);
  return { ...quote.data.data, updatedAt: application.data.data.updatedAt };
 }});
 const submit = useMutation({ retry: false, mutationFn: () => adminRequest.post(`/todos/refund-applications/${row.id}/machine-actions`, { action, reason: quote.data?.intent?.State === "prepared" ? quote.data.intent.Reason : reason, requestId: quote.data?.intent?.State === "prepared" ? quote.data.intent.requestId : requestId, expectedAmount: quote.data?.calculation.refundAmount, expectedUpdatedAt: quote.data?.updatedAt, confirmLarge: large }, { timeout: 180000 }), onSuccess: async () => { await Promise.all([cache.invalidateQueries({ queryKey: ["admin-todos"] }), cache.invalidateQueries({ queryKey: ["admin-todo-items"] }), cache.invalidateQueries({ queryKey: ["machine-refund-quote", row.id] })]); setOpen(false); onDone(); }, onError: () => { void quote.refetch(); } });
 const calculation = quote.data?.calculation;
 const canFallback=action === "direct_balance" && quote.data?.intent?.State === "rejected";
 const canRetry=action === "upstream" && quote.data?.intent?.State === "prepared";
 const lockedIntent=Boolean(quote.data?.intent) && !canFallback && !canRetry;
 return <Dialog.Root open={open} onOpenChange={value => { if (!submit.isPending) setOpen(value); }}><Dialog.Trigger render={<Button variant="secondary" size="sm">{label}</Button>} /><Dialog className="grid gap-4 p-6">
 <Dialog.Title>{label}</Dialog.Title><Dialog.Description>{action === "direct_balance" ? "退入客户余额并结束本地服务权益，不向供应商发送任何退款请求。供应商账单费用由平台自行承担。" : "提交后供应商可能立即暂停服务。审核期间不会退客户余额，核实退款成功后由定时任务自动入账。"}</Dialog.Description>
 {quote.isPending ? <p>正在核算退款金额…</p> : null}{quote.error ? <Banner variant="error" title={getApiMessage(quote.error)} /> : null}
 {calculation ? <><DefinitionList rows={[{ label: "核算时间（用户申请时间）", value: new Date(calculation.appliedAt).toLocaleString("zh-CN") }, { label: "原实付", value: `¥${calculation.paidAmount}` }, { label: "开通费（不退）", value: `¥${calculation.fees.setup}` }, { label: "退入余额", value: `¥${calculation.refundAmount}` }]} />{calculation.periods.map(period => <p key={period.instanceId}>机器 {period.instanceId} · 本期 {period.totalDays} 天 · 已使用 {period.usedDays} 天 · 可退 {period.remainingDays} 天</p>)}</> : null}
 {lockedIntent && quote.data?.intent ? <Banner title={stateLabels[quote.data.intent.State] ?? "退款操作待核查"} description={`操作人：${quote.data.intent.AdminName}；金额：¥${quote.data.intent.Amount}。请勿重复提交。`} /> : <><Input label="处理说明（留审计记录）" value={reason} maxLength={200} onChange={event => setReason(event.target.value)} /><Switch label="已核对金额、服务权益及业务中断影响" checked={confirmed} onCheckedChange={setConfirmed} />{Number(calculation?.paidAmount) > 50000 ? <Switch label="大额退款二次确认" checked={large} onCheckedChange={setLarge} /> : null}</>}
 {submit.error ? <Banner variant="error" title={getApiMessage(submit.error)} /> : null}
 <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={submit.isPending} onClick={() => setOpen(false)}>关闭</Button><Button loading={submit.isPending} disabled={!calculation || lockedIntent || (!canRetry && !reason.trim()) || !confirmed || (Number(calculation?.paidAmount) > 50000 && !large)} onClick={() => submit.mutate()}>{label}</Button></div>
 </Dialog></Dialog.Root>;
}
