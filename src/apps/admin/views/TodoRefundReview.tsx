import { Banner, Button, Input } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminRequest, type ApiEnvelope, getApiMessage } from "../../../shared/api/request";
import type { TodoEntry } from "../../../shared/api/adminTodos";
interface Receipt { paymentId: string; amount: string; channel: string; status: string; payNo: string; updatedAt: string }
export function TodoRefundReview({ row, onDone }: { row: TodoEntry; onDone: () => void }) {
  const cache = useQueryClient(); const [reason, setReason] = useState(""); const [requestId] = useState(() => crypto.randomUUID());
  const receipt = useQuery({ queryKey: ["todo-refund-receipt", row.source, row.id], queryFn: async () => (await adminRequest.get<ApiEnvelope<Receipt>>(`/todos/refunds/${row.source}/${row.id}/receipt`)).data.data });
  const submit = useMutation({ mutationFn: async () => {
    if (!receipt.data) throw new Error("收款记录未加载");
    await adminRequest.post(`/todos/refunds/${receipt.data.paymentId}/application`, { reason, requestId, expectedUpdatedAt: receipt.data.updatedAt });
  }, onSuccess: async () => {
    await Promise.all([cache.invalidateQueries({ queryKey: ["admin-todos"] }), cache.invalidateQueries({ queryKey: ["admin-todo-items"] })]); onDone();
  } });
  const eligible = receipt.data?.status === "received_review";
  return <div className="grid gap-3">
    <Banner title="退款须后台审核，只退账户余额" description="先核查是否确为多余收款，再建立审核申请。建立申请不会退款；费用明细核算和最终审核在退款申请中完成。" />
    {receipt.data ? <><p>原收款：{receipt.data.payNo} · {receipt.data.channel} · ¥{receipt.data.amount}</p>
      {eligible ? <><Input label="多余收款事实及申请原因" maxLength={255} value={reason} onChange={event => setReason(event.target.value)} />
        <Button loading={submit.isPending} disabled={!reason.trim()} onClick={() => submit.mutate()}>建立待审核退款申请</Button></> : <Banner title="历史退款结果须核查" description="请先确认原交易未退款、服务权益和费用依据。结果不明时不能再次退入余额，也不能登记外部退款完成。" />}
    </> : null}
    {receipt.error ? <Banner variant="error" title={getApiMessage(receipt.error)} /> : null}
    {submit.error ? <Banner variant="error" title={getApiMessage(submit.error)} /> : null}
  </div>;
}
