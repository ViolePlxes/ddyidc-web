import { Banner, Button, Input, Switch } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminRequest, type ApiEnvelope, getApiMessage } from "../../../shared/api/request";
import { DefinitionList } from "../../../shared/components/DataTable";
interface Transfer { id: string; amount: string; payer: string; transactionNo: string; transferredAt: string; evidence: string; evidenceId:string; status: string; revision: number; reason: string }
export function TodoOfflineReview({ id, onDone }: { id: string; onDone: () => void }) {
  const cache = useQueryClient();
  const [confirmed,setConfirmed]=useState(false);
  const [reason, setReason] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  const query = useQuery({ queryKey: ["offline-transfer", id], queryFn: async () => (await adminRequest.get<ApiEnvelope<Transfer>>(`/payment/offline-transfers/${id}`)).data.data });
  const review = useMutation({ mutationFn: async (action: "approve" | "reject") => { if (!query.data || !reason.trim()) throw new Error("请填写到账核验依据或拒绝原因"); await adminRequest.post(`/payment/offline-transfers/${id}/review`, { action, revision: query.data.revision, requestId, reason: reason.trim(),confirmLarge:confirmed }); }, onSuccess: async () => { await Promise.all([cache.invalidateQueries({ queryKey: ["admin-todos"] }), cache.invalidateQueries({ queryKey: ["admin-todo-items"] }), cache.invalidateQueries({ queryKey: ["offline-transfer", id] })]); onDone(); } });
  return <div className="grid gap-4">{query.error ? <Banner variant="error" title={getApiMessage(query.error)} /> : null}{query.data ? <>
    <DefinitionList rows={[{ label: "付款人", value: query.data.payer }, { label: "转账流水", value: query.data.transactionNo }, { label: "转账时间", value: new Date(query.data.transferredAt).toLocaleString("zh-CN") }, { label: "凭证说明", value: query.data.evidence }, { label: "处理说明", value: query.data.reason || "—" }]} />
    {query.data.evidenceId?<a href={`/admin/v1/payment/todo-evidence/${query.data.evidenceId}`} target="_blank" rel="noreferrer"><Button variant="secondary">下载原始转账凭证</Button></a>:<Banner variant="error" title="缺少原始凭证，请补充材料"/>}<Banner title="核验实际到账" description="凭证说明不代表银行到账。通过后将确认订单付款并继续交付，请先独立核验平台收款账户。" />
    <Input label="核验依据 / 拒绝原因" value={reason} maxLength={500} onChange={e => setReason(e.target.value)} />
    {Number(query.data.amount)>50000?<Switch label="已再次核对大额实际到账、付款人及订单" checked={confirmed} onCheckedChange={setConfirmed}/>:null}<div className="flex justify-end gap-3"><Button variant="secondary" disabled={review.isPending || !reason.trim() || query.data.status !== "pending"} onClick={() => review.mutate("reject")}>拒绝申请</Button><Button loading={review.isPending} disabled={!query.data.evidenceId || !reason.trim() || query.data.status !== "pending" || (Number(query.data.amount)>50000&&!confirmed)} onClick={() => review.mutate("approve")}>确认真实到账 ¥{query.data.amount}</Button></div>
  </> : null}{review.error ? <Banner variant="error" title="审核未完成" description={getApiMessage(review.error)} /> : null}</div>;
}
