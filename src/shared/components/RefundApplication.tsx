import { Banner, Button, Input } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { userRequest, type ApiEnvelope, getApiMessage } from "../api/request";
interface Data { applications: { id: string; status: number; amount: string; reason: string; reviewReason: string }[]; canApply: boolean; destination: "balance" }
export function RefundApplication({ orderId }: { orderId: string }) {
  const cache = useQueryClient(); const [reason, setReason] = useState(""); const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const query = useQuery({ queryKey: ["refund-applications", orderId], queryFn: async () => (await userRequest.get<ApiEnvelope<Data>>("/payment/refund-applications", { params: { orderId } })).data.data });
  const submit = useMutation({ mutationFn: async () => userRequest.post("/payment/refund-applications", { orderId, reason, requestId }), onSuccess: async () => { setRequestId(crypto.randomUUID()); setReason(""); await cache.invalidateQueries({ queryKey: ["refund-applications", orderId] }); } });
  const active = query.data?.applications.some((application) => application.status !== 2);
  return <div className="grid gap-3"><h3>服务退款申请</h3><Banner title="退款经平台审核后退入账户余额" description="仅退未使用期间的服务费，申请时间作为计费截止点，不足一天按一天扣除。开通费、安装费、手续费及赠送余额不退；产生的流量费和增值服务费另行扣除。" />
    {query.error ? <Banner variant="error" title={getApiMessage(query.error)} /> : null}
    {query.data?.applications.map((application) => <p key={application.id}>申请 {application.id} · {application.status === 0 ? "退款金额待审核核算" : `¥${application.amount}`} · {({ 0: "待后台审核", 1: "待核查", 2: "已拒绝", 3: "处理中", 4: "已退入账户余额", 5: "退款失败待核查", 6: "结果待核查" } as Record<number, string>)[application.status] ?? "状态待核查"}{application.reviewReason ? ` · ${application.reviewReason}` : ""}</p>)}
    {query.data?.canApply && !active ? <><Input label="退款申请原因" maxLength={255} value={reason} onChange={(event) => setReason(event.target.value)} /><Button loading={submit.isPending} disabled={!reason.trim()} onClick={() => submit.mutate()}>提交后台审核</Button></> : null}
    {query.data && !query.data.canApply && !query.data.applications.length ? <p>当前订单不符合服务退款申请条件，请联系平台核查。</p> : null}{submit.error ? <Banner variant="error" title={getApiMessage(submit.error)} /> : null}</div>;
}
