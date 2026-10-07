import { Banner, Button, Checkbox, Input } from "@cloudflare/kumo";
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
 const blocked = quote.isFetching ? "正在核算退款金额，请稍候。" : quote.isError ? "退款核算失败，请重新核算；核算成功后才能提交。" : !calculation ? "尚未取得退款金额，不能提交。" : lockedIntent ? "已有退款处理任务，请按上方状态核查，不能重复提交。" : !canRetry && !reason.trim() ? "请填写处理说明。" : action === "upstream" && !confirmed ? "请勾选金额、服务权益及业务中断影响确认。" : Number(calculation.paidAmount) > 50000 && !large ? "请勾选大额退款二次确认。" : undefined;
 return <Dialog.Root open={open} onOpenChange={value => { if (!submit.isPending) { setOpen(value); if (value) { setConfirmed(false); setLarge(false); submit.reset(); } } }}><Dialog.Trigger render={<Button variant="secondary" size="sm">{label}</Button>} /><Dialog className="grid gap-4 p-6">
 <Dialog.Title>{label}</Dialog.Title><Dialog.Description>{action === "direct_balance" ? "退入客户余额并结束本地服务权益，不向供应商发送任何退款请求。供应商账单费用由平台自行承担。" : "提交后供应商可能立即暂停服务。审核期间不会退客户余额，核实退款成功后由定时任务自动入账。"}</Dialog.Description>
 {quote.isPending ? <p>正在核算退款金额…</p> : null}{quote.error ? <Banner variant="error" title={getApiMessage(quote.error)} /> : null}
 {calculation ? <><DefinitionList rows={[{ label: "核算时间（用户申请时间）", value: new Date(calculation.appliedAt).toLocaleString("zh-CN") }, { label: "原实付", value: `¥${calculation.paidAmount}` }, { label: "开通费（不退）", value: `¥${calculation.fees.setup}` }, { label: "退入余额", value: `¥${calculation.refundAmount}` }]} />{calculation.periods.map(period => <p key={period.instanceId}>机器 {period.instanceId} · 本期 {period.totalDays} 天 · 已使用 {period.usedDays} 天 · 可退 {period.remainingDays} 天</p>)}</> : null}
 {lockedIntent && quote.data?.intent ? <Banner title={stateLabels[quote.data.intent.State] ?? "退款操作待核查"} description={`操作人：${quote.data.intent.AdminName}；金额：¥${quote.data.intent.Amount}。请勿重复提交。`} /> : <><Input label="处理说明（必填，留审计记录）" disabled={!calculation || quote.isFetching || submit.isPending} value={reason} maxLength={200} onChange={event => setReason(event.target.value)} />{action === "upstream" ? <Checkbox label="确认：已核对金额、服务权益及业务中断影响（必选）" disabled={!calculation || quote.isFetching || submit.isPending} checked={confirmed} onCheckedChange={value => setConfirmed(value === true)} /> : null}{Number(calculation?.paidAmount) > 50000 ? <Checkbox label="大额退款二次确认（必选）" checked={large} onCheckedChange={value => setLarge(value === true)} /> : null}</>}
 {quote.isError ? <Button variant="secondary" loading={quote.isFetching} onClick={() => { setConfirmed(false); setLarge(false); void quote.refetch(); }}>重新核算</Button> : null}
 {blocked ? <p className="text-sm text-kumo-subtle" role="status">{blocked}</p> : null}
 {submit.error ? <Banner variant="error" title={getApiMessage(submit.error)} /> : null}
 <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={submit.isPending} onClick={() => setOpen(false)}>关闭</Button><Button loading={submit.isPending} disabled={Boolean(blocked) || submit.isPending} onClick={() => submit.mutate()}>{label}</Button></div>
 </Dialog></Dialog.Root>;
}
