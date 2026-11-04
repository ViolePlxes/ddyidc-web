import { adminBase } from "../utils/adminEntry";
import { Banner, Button, LayerCard, LayerDialog, Radio } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { InstanceDetail } from "../api/console";
import { adminRequest, userRequest, type ApiEnvelope, getApiMessage } from "../api/request";
import { PaymentDialog } from "./PaymentDialog";
interface Plan { productId: string; name: string; cycles: { id: string; label: string }[] }
interface Quote { id: string; productId: string; name: string; cycle: string; amount: string; state: string; expiresAt: string; orderId?: string; orderNo?: string; sourceName?: string; sourceUnitPrice?: string; targetUnitPrice?: string; fullCycleDifference?: string; remainingSeconds?: number; cycleSeconds?: number }
export function InstanceUpgrade({ instance, customerId }: { instance: InstanceDetail; customerId?: string }) {
 const [product,setProduct]=useState(""); const [cycle,setCycle]=useState(""); const [open,setOpen]=useState(false); const [requestId,setRequestId]=useState(()=>crypto.randomUUID()); const [now,setNow]=useState(Date.now); const cache=useQueryClient();
 const client=customerId?adminRequest:userRequest; const path=customerId?`/customers/${customerId}/instances/${instance.id}`:`/instance/${instance.id}`;
 const unavailable=!!instance.readOnly||instance.status===6;
 async function unwrap<T>(request:Promise<{data:ApiEnvelope<T>}>):Promise<T>{const {data}=await request;if(data.code!==0)throw new Error(data.message||'请求失败');return data.data;}
 const plans=useQuery({queryKey:["instance-upgrade-plans",customerId??"self",instance.id],enabled:open&&!unavailable&&!instance.productionLocked,retry:false,refetchOnWindowFocus:false,queryFn:async()=>(await unwrap(client.get<ApiEnvelope<{items:Plan[]}>>(`${path}/upgrade-options`,{timeout:65000}))).items});
 const quote=useMutation({retry:false,mutationFn:()=>unwrap(client.post<ApiEnvelope<Quote>>(`${path}/upgrade-quote`,{productId:product,cycle,requestId},{timeout:90000}))});
 const create=useMutation({retry:false,mutationFn:()=>unwrap(client.post<ApiEnvelope<Quote>>(`${path}/upgrades`,{quoteId:quote.data?.id},{timeout:65000})),onSuccess:()=>{void cache.invalidateQueries({queryKey:["orders"]});}});
 const selected=plans.data?.find(plan=>plan.productId===product); const pending=quote.isPending||create.isPending; const busy=!!instance.productionLocked||pending;
 const selectionDisabled=busy||!!create.data;
 const expired=!!quote.data&&now>=Date.parse(quote.data.expiresAt);
 useEffect(()=>{if(!open||!quote.data)return;setNow(Date.now());const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[open,quote.data]);
 const reset=()=>{quote.reset();create.reset();setRequestId(crypto.randomUUID());};
 if(unavailable)return <Banner title="当前实例暂不能升降配"/>;
 return <LayerCard className="grid gap-4 px-6 py-5"><h2 className="text-lg font-semibold">产品升降级</h2><p className="text-sm text-kumo-subtle">选择当前服务支持的套餐，确认应付金额后支付。付款后处理配置变更；涉及返款或数据缩容的方案需人工核查。</p>
 <LayerDialog.Root open={open} dismissDisabled={pending} onOpenChange={value=>{if(pending)return;setOpen(value);if(!value){setProduct('');setCycle('');reset();}}}>
  <LayerDialog.Trigger render={<Button disabled={!!instance.productionLocked}>选择升降配套餐</Button>}/>
  <LayerDialog.Content size="lg" closeLabel="关闭"><LayerDialog.Title>产品升降级</LayerDialog.Title><LayerDialog.Description>先选择套餐和计费周期，确认金额后再创建订单并支付。配置变更可能重启实例，请提前备份重要数据。</LayerDialog.Description>
   <LayerDialog.Body><div className="grid min-w-0 gap-5 text-sm">
    <p className="text-kumo-subtle">当前产品：{quote.data?.sourceName||instance.productName}</p>
    {plans.isPending?<p role="status">正在获取可选套餐…</p>:null}
    {plans.error?<Banner variant="error" title={getApiMessage(plans.error)}/>:null}
    {plans.data?.length===0?<Banner title="当前服务没有可用的在线升降配方案" description="可联系工作人员核查服务支持的方案。"/>:null}
    {plans.data?.length?<><Radio.Group legend="选择套餐" appearance="card" orientation="horizontal" value={product} onValueChange={value=>{if(selectionDisabled)return;setProduct(value);const plan=plans.data?.find(item=>item.productId===value);setCycle(plan?.cycles.find(item=>item.id===instance.billingCycle)?.id??plan?.cycles[0]?.id??'');reset();}}>
     {plans.data.map(plan=><Radio.Item key={plan.productId} value={plan.productId} label={plan.name} description={`可选周期：${plan.cycles.map(item=>item.label||item.id).join('、')}`} disabled={selectionDisabled}/>)}
    </Radio.Group><Radio.Group legend="计费周期" appearance="card" orientation="horizontal" className="[&_[data-kumo-part=items]]:grid-cols-none [&_[data-kumo-part=items]]:grid-flow-col [&_[data-kumo-part=items]]:auto-cols-fr" value={cycle} onValueChange={value=>{if(selectionDisabled)return;setCycle(value);reset();}}>{(selected?.cycles??[]).map(option=><Radio.Item className="border-b-0 border-r last:border-r-0" key={option.id} value={option.id} label={option.label||option.id} disabled={selectionDisabled}/>)}</Radio.Group></>:null}
    {quote.error?<Banner variant="error" title={getApiMessage(quote.error)}/>:null}
    {quote.data?<section aria-label="升降配报价" className="grid gap-3"><h3 className="text-base font-semibold">{quote.data.name}</h3>
     <p className="text-base font-semibold">应付金额：¥{quote.data.amount}</p><p className="text-kumo-subtle">报价到期：{new Date(quote.data.expiresAt).toLocaleString('zh-CN')}</p>
     {expired&&!create.data?<Banner variant="alert" title="报价已过期，请重新核算"/>:null}
     {!create.data?<div><Button variant="secondary" disabled={pending} onClick={reset}>重新选择套餐</Button></div>:null}
    </section>:null}
    {create.error?<Banner variant="error" title={getApiMessage(create.error)}/>:null}
    {create.data?<><p>订单 {create.data.orderNo} · ¥{create.data.amount}</p>{!customerId&&create.data.orderId?<PaymentDialog businessType="order" businessId={create.data.orderId} amountCents={Math.round(Number(create.data.amount)*100)} onPaid={async()=>{await cache.invalidateQueries({queryKey:["instances",instance.id]});}}/>:null}<Link to={customerId?`${adminBase}/customers/${customerId}/orders`:`/console/orders/${create.data.orderId}`}>查看升降配订单</Link></>:null}
   </div></LayerDialog.Body>
   <LayerDialog.Actions dismissLabel="关闭"><LayerDialog.Action disabled={busy||(!create.data&&((!quote.data&&(!product||!cycle))||expired))} loading={pending} onClick={()=>{if(create.data){setOpen(false);setProduct('');setCycle('');reset();}else if(quote.data)create.mutate();else quote.mutate();}}>{create.data?'完成':quote.data?'创建升降配订单':'查看价格'}</LayerDialog.Action></LayerDialog.Actions>
  </LayerDialog.Content>
 </LayerDialog.Root></LayerCard>;
}
