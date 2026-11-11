import { RefundAmountChoice, selectedRefundAmount, type RefundAmountMode } from "./RefundAmountChoice";
import { Banner, Button, Input, Switch } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminRequest, type ApiEnvelope, getApiMessage } from "../../../shared/api/request";
import { MachineRefundDialog } from "./MachineRefundDialog";
import { Dialog } from "../../../shared/components/Dialog";
import { DefinitionList } from "../../../shared/components/DataTable";
import type { TodoEntry } from "../../../shared/api/adminTodos";
interface Fees { setup: string; installation: string; handling: string; gift: string; traffic: string; valueAdded: string; evidence: string }
interface Calculation { policy: string; appliedAt: string; paidAmount: string; unusedServiceAmount: string; refundAmount: string; fees: Fees; periods: { instanceId: string; startAt?: string; endAt?: string; unstarted: boolean; totalDays: number; usedDays: number; remainingDays: number; partialDayDeductionDays: number; unusedServiceAmount: string }[] }
interface Application { id: string; amount: string; reason: string; status: number; updatedAt: string; reviewReason: string; request?: { source: string; snapshot: { paidAmount: string; balancePaid: string; warnings: string[]; minimumSetupAmount: string; minimumHandlingAmount: string; periods?: { instanceId: string; renewalId?: string; unstarted: boolean }[] } }; calculation?: Calculation }
// A machine application is either an order-level purchase refund or the newer
// machine-level destruction request; the latter carries every completed renewal.
function isMachineRefund(request?: Application["request"]) {
  const periods = request?.snapshot.periods;
  if (!request || !periods?.length) return false;
  if (request.source === "instance") return periods.every(period => period.instanceId !== "0" && !period.unstarted);
  return request.source === "order" && periods.every(period => period.instanceId !== "0" && !period.unstarted && (!period.renewalId || period.renewalId === "0"));
}
export function TodoRefundApplication({ row, onDone, readOnly = false }: { row: TodoEntry; onDone: () => void; readOnly?: boolean }) {
  const [amountMode,setAmountMode]=useState<RefundAmountMode>("daily"); const [customAmount,setCustomAmount]=useState("");
 const cache = useQueryClient(); const [reason, setReason] = useState(""); const [confirmLarge, setConfirmLarge] = useState(false); const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const query = useQuery({ queryKey: ["todo-refund-application", row.id, row.updatedAt], queryFn: async () => (await adminRequest.get<ApiEnvelope<Application>>(`/todos/refund-applications/${row.id}`)).data.data });
  const review = useMutation({ mutationFn: async (action: string) => adminRequest.post(`/todos/refund-applications/${row.id}/review`, { action, reason, requestId, fees: automaticQuote.data?.fees, expectedAmount: selectedAmount ?? "", amountMode, customAmount: amountMode === "custom" ? customAmount : "", confirmLarge, expectedUpdatedAt: query.data?.updatedAt }), onSuccess: async () => { await Promise.all([cache.invalidateQueries({ queryKey: ["todo-refund-application", row.id] }), cache.invalidateQueries({ queryKey: ["admin-todos"] }), cache.invalidateQueries({ queryKey: ["admin-todo-items"] })]); onDone(); } });
  const machine = isMachineRefund(query.data?.request);
  const snapshot = query.data?.request?.snapshot;
  const locked = readOnly || query.data?.status !== 0 || !snapshot || Boolean(snapshot.warnings.length);
  const automaticQuote = useQuery({
    queryKey: ["todo-refund-automatic-quote", row.id, query.data?.updatedAt],
    enabled: !locked && !machine,
    retry: false,
    queryFn: async () => {
      if (!snapshot?.minimumSetupAmount || !snapshot.minimumHandlingAmount) throw new Error("原始订单费用快照不完整，请核查后再退款");
      const fees: Fees = { setup: snapshot.minimumSetupAmount, handling: snapshot.minimumHandlingAmount, installation: "0.00", gift: "0.00", traffic: "0.00", valueAdded: "0.00", evidence: "系统根据原始订单计费快照自动核算；开通费及手续费不退，未使用服务费按申请时间折算" };
      return (await adminRequest.post<ApiEnvelope<Calculation>>(`/todos/refund-applications/${row.id}/preview`, fees)).data.data;
    },
  });
  const calculation = automaticQuote.data ?? query.data?.calculation;
  const quote = automaticQuote.data;
 const selectedAmount=selectedRefundAmount(amountMode,customAmount,quote?.refundAmount,quote?.paidAmount);
  return <div className="grid gap-3">{query.error ? <Banner variant="error" title={getApiMessage(query.error)} /> : null}{query.data ? <><p>申请原因：{query.data.reason}</p>{query.data.reviewReason ? <p>审核说明：{query.data.reviewReason}</p> : null}
    <Banner title="只退账户余额，必须后台审核" description="默认按申请时间核算未使用服务费，不足一天按一天扣费；订单人工退款可全退或指定金额，上限为原实付金额。核算和审核不会调用微信、支付宝或其他外部退款接口。" />
    {query.data.request ? <p>原实付总额：¥{query.data.request.snapshot.paidAmount} · 其中余额抵扣：¥{query.data.request.snapshot.balancePaid}</p> : <Banner title="历史记录需核查" description="此记录缺少费用与服务周期快照，不能按旧原路退款流程完成。" />}
    {query.data.request?.snapshot.warnings.map((warning) => <Banner key={warning} variant="error" title={warning} />)}
    {!readOnly && query.data.status === 0 && machine ? <div className="flex flex-wrap gap-3"><MachineRefundDialog row={row} action="direct_balance" onDone={onDone} /><MachineRefundDialog row={row} action="upstream" onDone={onDone} /></div> : !readOnly && query.data.status === 0 ? <>
      {automaticQuote.isFetching ? <p role="status">正在自动核算退款金额…</p> : null}
      {quote && query.data.request?.source === "order" ? <RefundAmountChoice mode={amountMode} custom={customAmount} paid={quote.paidAmount} onMode={setAmountMode} onCustom={setCustomAmount} disabled={review.isPending}/> : null}
      {quote ? <p className="font-semibold text-kumo-strong">退入客户余额：¥{selectedAmount ?? "金额无效"}</p> : null}
      <Input label="处理原因（必填，留审计记录）" maxLength={255} value={reason} disabled={review.isPending} onChange={(event) => setReason(event.target.value)} />
      {quote && Number(quote.paidAmount) > 50000 ? <Switch label="大额退款二次确认" checked={confirmLarge} onCheckedChange={setConfirmLarge} /> : null}
      <div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={!reason.trim() || review.isPending || !query.data.request} onClick={() => review.mutate("reject")}>拒绝申请</Button><Button loading={review.isPending} disabled={locked || automaticQuote.isFetching || !quote || !selectedAmount || !reason.trim() || (Number(quote?.paidAmount) > 50000 && !confirmLarge)} onClick={() => review.mutate("approve")}>直接退余额</Button></div>
      {automaticQuote.isError ? <><Banner variant="error" title={getApiMessage(automaticQuote.error)} /><Button variant="secondary" loading={automaticQuote.isFetching} onClick={() => { setConfirmLarge(false); setRequestId(crypto.randomUUID()); void automaticQuote.refetch(); }}>重新核算</Button></> : null}
    </> : null}
    {calculation && (readOnly || query.data.status !== 0) ? <><DefinitionList rows={[{ label: "计算截止点", value: new Date(calculation.appliedAt).toLocaleString("zh-CN") }, { label: "不退开通费", value: `¥${calculation.fees.setup}` }, { label: "不退安装费", value: `¥${calculation.fees.installation}` }, { label: "不退手续费", value: `¥${calculation.fees.handling}` }, { label: "不退赠送余额", value: `¥${calculation.fees.gift}` }, { label: "未使用服务费", value: `¥${calculation.unusedServiceAmount}` }, { label: "流量费扣除", value: `¥${calculation.fees.traffic}` }, { label: "增值服务费扣除", value: `¥${calculation.fees.valueAdded}` }, { label: "最终可退入余额", value: `¥${calculation.refundAmount}` }]} />{calculation.periods.map((period, index) => <p key={`${period.instanceId}-${index}`}>{period.instanceId !== "0" ? `机器 ${period.instanceId}` : "未开通服务"} · {period.unstarted ? "尚未使用" : `本期 ${period.totalDays} 天，扣除使用 ${period.usedDays} 天${period.partialDayDeductionDays ? `，另扣不足一天 ${period.partialDayDeductionDays} 天` : ""}，可退 ${period.remainingDays} 天`} · 未使用服务费 ¥{period.unusedServiceAmount}</p>)}<p>核验依据：{calculation.fees.evidence}</p></> : null}</> : null}
    {review.error ? <Banner variant="error" title={getApiMessage(review.error)} /> : null}</div>;
}

// Only delivered, non-renewal machine applications support supplier refunds.
export function PendingRefundActions({ row, onDone }: { row: TodoEntry; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const query = useQuery({ queryKey: ["todo-refund-application", row.id, row.updatedAt], retry: false, queryFn: async () => (await adminRequest.get<ApiEnvelope<Application>>(`/todos/refund-applications/${row.id}`)).data.data });
  const periods = query.data?.request?.snapshot.periods;
  const machine = isMachineRefund(query.data?.request);
  if (query.isPending) return <p role="status">正在核对退款类型…</p>;
  if (query.isError) return <div className="grid gap-2"><Banner variant="error" title={getApiMessage(query.error)} /><Button variant="secondary" onClick={() => void query.refetch()}>重新核对</Button></div>;
  if (machine) return <><MachineRefundDialog row={row} action="direct_balance" onDone={onDone} /><MachineRefundDialog row={row} action="upstream" onDone={onDone} /></>;
  const unavailable = periods?.some(period => period.unstarted || period.instanceId === "0") ? "实例尚未开通，没有可申请退款的供应商实例；填写处理原因后可直接退余额。" : "此申请不属于已开通机器退款，系统自动核算金额后退入客户余额。";
  return <div className="grid gap-2"><div className="flex flex-wrap gap-2"><Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger render={<Button variant="secondary" size="sm">直接退余额</Button>} /><Dialog className="grid gap-4 p-8"><Dialog.Title>直接退余额</Dialog.Title><Dialog.Description>{unavailable}</Dialog.Description><TodoRefundApplication row={row} onDone={() => { setOpen(false); onDone(); }} /></Dialog></Dialog.Root><Button variant="secondary" size="sm" disabled title={unavailable}>向上游申请退款</Button></div><p className="text-base text-kumo-subtle">{unavailable}</p></div>;
}
