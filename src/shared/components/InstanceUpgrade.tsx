import { adminBase } from "../utils/adminEntry";
import { Banner, Button, LayerCard, Select } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { InstanceDetail } from "../api/console";
import { adminRequest, userRequest, type ApiEnvelope, getApiMessage } from "../api/request";
import { Dialog } from "./Dialog";
import { PaymentDialog } from "./PaymentDialog";
interface Plan { productId: string; name: string; cycles: { id: string; label: string }[] }
interface Quote { id: string; productId: string; name: string; cycle: string; amount: string; state: string; expiresAt: string; orderId?: string; orderNo?: string }
export function InstanceUpgrade({ instance, customerId }: { instance: InstanceDetail; customerId?: string }) {
 const [product, setProduct] = useState(""); const [cycle, setCycle] = useState(""); const [open, setOpen] = useState(false); const [requestId, setRequestId] = useState(() => crypto.randomUUID()); const cache = useQueryClient();
 const client = customerId ? adminRequest : userRequest; const path = customerId ? `/customers/${customerId}/instances/${instance.id}` : `/instance/${instance.id}`;
 const plans = useQuery({ queryKey: ["instance-upgrade-plans", customerId ?? "self", instance.id], retry: false, queryFn: async () => (await client.get<ApiEnvelope<{ items: Plan[] }>>(`${path}/upgrade-options`, { timeout: 65000 })).data.data.items });
 const quote = useMutation({ retry: false, mutationFn: async () => (await client.post<ApiEnvelope<Quote>>(`${path}/upgrade-quote`, { productId: product, cycle, requestId }, { timeout: 90000 })).data.data, onSuccess: () => setOpen(true) });
 const create = useMutation({ retry: false, mutationFn: async () => (await client.post<ApiEnvelope<Quote>>(`${path}/upgrades`, { quoteId: quote.data?.id }, { timeout: 65000 })).data.data, onSuccess: () => { void cache.invalidateQueries({ queryKey: ["orders"] }); } });
 const selected = plans.data?.find(plan => plan.productId === product); const busy = quote.isPending || create.isPending;
 if (instance.readOnly || instance.status === 6) return <Banner title="当前实例暂不能升降配" />;
 return <LayerCard className="grid gap-4 p-6"><h2 className="text-lg font-semibold">产品升级降级</h2><p className="text-kumo-subtle">仅展示当前服务支持且已上架的方案。核算差价后创建平台订单，支付完成后处理配置变更。涉及返款或数据缩容的方案须先人工核查。</p>
 {plans.isPending ? <p>正在获取可选方案…</p> : null}{plans.error ? <Banner variant="error" title={getApiMessage(plans.error)} /> : null}{plans.data?.length === 0 ? <Banner title="当前服务没有可用的在线升降配方案" description="可联系工作人员核查服务支持的方案。" /> : null}
 <div className="grid gap-4 md:grid-cols-2"><Select label="目标产品" value={product} items={{ "": "请选择产品", ...Object.fromEntries((plans.data ?? []).map(plan => [plan.productId, plan.name])) }} disabled={busy} onValueChange={value => { setProduct(value ?? ""); setCycle(""); setRequestId(crypto.randomUUID()); quote.reset(); create.reset(); }} /><Select label="计费周期" value={cycle} items={{ "": "请选择周期", ...Object.fromEntries((selected?.cycles ?? []).map(option => [option.id, option.label || option.id])) }} disabled={busy || !selected} onValueChange={value => { setCycle(value ?? ""); setRequestId(crypto.randomUUID()); quote.reset(); create.reset(); }} /></div>
 {quote.error ? <Banner variant="error" title={getApiMessage(quote.error)} /> : null}<div><Button disabled={!product || !cycle || busy} loading={quote.isPending} onClick={() => quote.mutate()}>核算升降配差价</Button></div>
 <Dialog.Root open={open} onOpenChange={value => { if (!create.isPending) setOpen(value); }}><Dialog className="grid gap-4 p-6"><Dialog.Title>确认升降配方案</Dialog.Title><Dialog.Description>配置变更可能重启实例，请提前备份重要数据。核算报价有效期为 10 分钟；未付款的订单不会执行配置变更。</Dialog.Description>
 {quote.data ? <><p>目标：{quote.data.name}</p><p>本次差价：¥{quote.data.amount}</p><p className="text-sm text-kumo-subtle">报价到期：{new Date(quote.data.expiresAt).toLocaleString("zh-CN")}</p></> : null}
 {create.error ? <Banner variant="error" title={getApiMessage(create.error)} /> : null}{create.data ? <><p>订单 {create.data.orderNo} · ¥{create.data.amount}</p>{!customerId && create.data.orderId ? <PaymentDialog businessType="order" businessId={create.data.orderId} amountCents={Math.round(Number(create.data.amount) * 100)} onPaid={async () => { await cache.invalidateQueries({ queryKey: ["instances", instance.id] }); }} /> : null}<Link className="text-kumo-link" to={customerId ? `${adminBase}/customers/${customerId}/orders` : `/console/orders/${create.data.orderId}`}>查看升降配订单</Link></> : null}
 <div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={create.isPending} onClick={() => setOpen(false)}>关闭</Button>{!create.data ? <Button disabled={!quote.data || Date.now() >= Date.parse(quote.data.expiresAt)} loading={create.isPending} onClick={() => create.mutate()}>创建升降配订单</Button> : null}</div>
 </Dialog></Dialog.Root>
 </LayerCard>;
}
