import { InstanceSetting } from "./InstanceProductControls";
import { adminBase } from "../utils/adminEntry";
import { Dialog } from "./Dialog";
import { DateField } from "./DateField";
import { localDateTime } from "../utils/localDate";
import { Banner, Button, Input, Select, SensitiveInput, Textarea } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { InstanceDetail } from '../api/console';
import { instanceManagementApi, type RenewalOrder } from '../api/instanceManagement';
import { getApiMessage } from '../api/request';
import { PaymentDialog } from './PaymentDialog';

export function InstanceCredentials({instance,customerId}:{instance:InstanceDetail;customerId?:string}){
 const identity=`${customerId||'self'}:${instance.id}:${instance.upstreamInstanceId||''}`;
 const [state,setState]=useState<{identity:string;password?:string;error?:string}>();
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  let active=true;
  setState(undefined);
  void instanceManagementApi(instance.id,customerId).credentials().then(result=>{
   if(active)setState({identity,password:result.password});
  }).catch(error=>{if(active)setState({identity,error:getApiMessage(error)})});
  return ()=>{active=false};
 },[identity,instance,customerId,retry]);
 if(state?.identity!==identity)return <span role="status">正在读取密码…</span>;
 if(state.error)return <div className="grid gap-2"><p role="alert">{state.error}</p><Button size="sm" variant="secondary" onClick={()=>setRetry(x=>x+1)}>重新读取密码</Button></div>;
 return state.password ? <SensitiveInput key={`${identity}:${retry}`} aria-label="实例密码" value={state.password} readOnly/> : <span>服务未提供密码，请通过重置密码设置。</span>;
}

export function InstanceRemark({instance,customerId}:{instance:InstanceDetail;customerId?:string}){
 const [editing,setEditing]=useState(false);const [value,setValue]=useState(instance.remark||'');
 const [savedRemark,setSavedRemark]=useState(instance.remark||'');
 useEffect(()=>setSavedRemark(instance.remark||''),[instance.remark]);
 const client=useQueryClient();
 const save=useMutation({mutationFn:(remark:string)=>instanceManagementApi(instance.id,customerId).remark(remark),onSuccess:(_result,remark)=>{
  setSavedRemark(remark.trim());setEditing(false);
  // Keep the mounted detail and credential views stable; revisit fetches fresh data.
  void client.invalidateQueries({queryKey:['instances',instance.id],exact:true,refetchType:'none'});
  void client.invalidateQueries({queryKey:['instances','product-list'],refetchType:'none'});
  if(customerId){
   void client.invalidateQueries({queryKey:['admin','customer-instance',customerId,instance.id],exact:true,refetchType:'none'});
   void client.invalidateQueries({queryKey:['admin','customer-records',customerId,'products'],refetchType:'none'});
  }
 }});
 if(!editing)return <div className="flex flex-wrap items-center gap-2"><span className="min-w-0 break-words whitespace-pre-wrap">{savedRemark||'未填写备注'}</span><Button size="sm" variant="secondary" disabled={instance.readOnly||instance.productionLocked} aria-label="编辑实例备注" onClick={()=>{setValue(savedRemark);save.reset();setEditing(true)}}>编辑</Button></div>;
 return <div className="grid gap-2"><Textarea aria-label="实例备注" rows={2} maxLength={1000} value={value} disabled={save.isPending} onChange={e=>setValue(e.target.value)}/><span className="text-base text-kumo-subtle">{Array.from(value).length}/1000</span>{save.error&&<p role="alert">{getApiMessage(save.error)}</p>}<div className="flex gap-2"><Button size="sm" loading={save.isPending} onClick={()=>save.mutate(value)}>保存备注</Button><Button size="sm" variant="secondary" disabled={save.isPending} onClick={()=>setEditing(false)}>取消</Button></div></div>;
}

export function InstanceEdit({instance,customerId}:{instance:InstanceDetail;customerId:string}){
 const [open,setOpen]=useState(false);const [upstream,setUpstream]=useState(instance.upstreamInstanceId||'');
 const [created,setCreated]=useState<Date|undefined>(new Date(instance.createdAt));const [activated,setActivated]=useState<Date|undefined>(instance.activatedAt?new Date(instance.activatedAt):undefined);
 const client=useQueryClient();const save=useMutation({mutationFn:()=>instanceManagementApi(instance.id,customerId).edit({upstreamInstanceId:upstream,createdAt:created?.toISOString(),activatedAt:activated?.toISOString()}),onSuccess:async()=>{await client.invalidateQueries({queryKey:['admin','customer-instance',customerId,instance.id]});await client.invalidateQueries({queryKey:['admin','customer-records',customerId,'products']});void client.invalidateQueries({queryKey:['admin','global-instances']});void client.invalidateQueries({queryKey:['instances','product-list'],refetchType:'none'});void client.invalidateQueries({queryKey:['instances','filter-list'],refetchType:'none'});setOpen(false)}});
 const repair=useMutation({mutationFn:()=>instanceManagementApi(instance.id,customerId).edit({upstreamInstanceId:instance.upstreamInstanceId,productOnly:true}),onSuccess:async()=>{await client.invalidateQueries({queryKey:['admin','customer-instance',customerId,instance.id]});await client.invalidateQueries({queryKey:['admin','customer-records',customerId,'products']});void client.invalidateQueries({queryKey:['admin','global-instances']});setOpen(false)}});
 return <Dialog.Root open={open} onOpenChange={v=>{if(!save.isPending&&!repair.isPending)setOpen(v)}}><Button size="sm" variant="secondary" onClick={()=>{setUpstream(instance.upstreamInstanceId||'');setCreated(new Date(instance.createdAt));setActivated(instance.activatedAt?new Date(instance.activatedAt):undefined);save.reset();repair.reset();setOpen(true)}}>编辑实例信息</Button>
 <Dialog className="grid max-h-[90vh] max-w-3xl gap-4 overflow-auto p-8"><Dialog.Title>编辑实例信息</Dialog.Title><Dialog.Description>以填写的上游实例 ID 为准，重新获取商品、IP、配置与状态。商品不一致时自动修正关联；尚未对接的商品建立隐藏关联，不开放销售。“仅修正商品关联”保留本地到期时间和待确认续费状态。日期使用当前浏览器时区，不修改原订单或账务。</Dialog.Description>
 <Input label="上游实例 ID" inputMode="numeric" value={upstream} onChange={e=>setUpstream(e.target.value)} disabled={save.isPending}/>
 <div className="grid gap-4 md:grid-cols-2"><DateField label="创建时间" withTime seconds clearable={false} value={localDateTime(created,true)} onValueChange={value=>setCreated(new Date(value))} disabled={save.isPending}/><DateField label="开通时间" withTime seconds clearable={false} value={localDateTime(activated,true)} onValueChange={value=>setActivated(new Date(value))} disabled={save.isPending}/></div>
 {(save.error||repair.error)&&<Banner variant="error" title={getApiMessage(save.error||repair.error)}/>}<div className="flex justify-end gap-2"><Button variant="secondary" disabled={save.isPending||repair.isPending} onClick={()=>setOpen(false)}>取消</Button><Button variant="secondary" loading={repair.isPending} disabled={save.isPending||!instance.upstreamInstanceId||upstream!==instance.upstreamInstanceId} onClick={()=>repair.mutate()}>仅修正商品关联</Button><Button loading={save.isPending} disabled={repair.isPending||!/^[1-9]\d*$/.test(upstream)||!created||!activated} onClick={()=>save.mutate()}>保存并同步</Button></div>
 </Dialog></Dialog.Root>;
}
export function InstanceRenewal({instance,customerId}:{instance:InstanceDetail;customerId?:string}){
 const [open,setOpen]=useState(()=>new URLSearchParams(window.location.search).get("action")==="renew");const [cycle,setCycle]=useState('');const [order,setOrder]=useState<RenewalOrder>();const api=instanceManagementApi(instance.id,customerId);const client=useQueryClient();
 const options=useQuery({queryKey:['renewal-options',customerId||'self',instance.id],queryFn:api.options,enabled:open,retry:false});
 const refresh=async()=>{await client.invalidateQueries({queryKey:customerId?['admin','customer-instance',customerId,instance.id]:['instances',instance.id]})};
 const create=useMutation({mutationFn:async()=>{
  const latest=await api.options();const quote=latest.items.find(item=>item.cycle===cycle);
  if(!quote)throw new Error('当前周期暂不可续费，请稍后重试');
  return api.renew(cycle,quote.quoteRevision);
 },onSuccess:setOrder});
 const pay=useMutation({mutationFn:()=>api.pay(order!.orderId),onSettled:refresh});
 if(instance.readOnly)return <Banner variant="secondary" title="当前仅开放信息查询，续费与自动续费暂未开放"/>;
 if(instance.status===6||instance.powerStatus==='deleted')return <Banner title="实例已删除，不支持续费"/>;
 return <div className="grid gap-3"><div className="flex items-center gap-3"><span>自动续费</span><InstanceSetting instance={instance} customerId={customerId} kind="auto" /></div>
 <Dialog.Root open={open} onOpenChange={value=>{if(!create.isPending&&!pay.isPending)setOpen(value)}}><Button variant="secondary" size="sm" disabled={instance.readOnly} onClick={()=>{setOpen(true);pay.reset();create.reset();setOrder(undefined);setCycle('')}}>续费</Button><Dialog className="grid gap-4 p-8"><Dialog.Title>实例续费</Dialog.Title><Dialog.Description>请选择续费周期和支付方式。</Dialog.Description>
 <Select label="续费周期" value={cycle} items={{"":"请选择续费周期",...Object.fromEntries((options.data?.items||[]).map(item=>[item.cycle,`${item.label||item.cycle} · ¥${item.amount}`]))}} onValueChange={value=>setCycle(value||'')} disabled={create.isPending||!!order}/>
{(()=>{const q=(options.data?.items||[]).find(i=>i.cycle===cycle);return q?.discount&&Number(q.discount)>0?<p className="text-sm text-kumo-subtle">原价 ¥{q.listAmount}，已优惠 ¥{q.discount}</p>:null})()}
 {options.error&&<Banner variant="error" title={getApiMessage(options.error)}/>}{create.error&&<Banner variant="error" title={getApiMessage(create.error)}/>}{pay.error&&<Banner variant="error" title={getApiMessage(pay.error)}/>}
 {!order?<Button disabled={instance.readOnly||!cycle||options.isLoading} loading={create.isPending} onClick={()=>create.mutate()}>创建续费订单</Button>:<><p>订单 {order.orderNo} · ¥{order.amount}</p><Button disabled={instance.readOnly||pay.isPending||pay.isSuccess} loading={pay.isPending} onClick={()=>pay.mutate()}>确认余额支付 ¥{order.amount}</Button>{!customerId&&<PaymentDialog businessType="order" businessId={order.orderId} amountCents={Math.round(Number(order.amount)*100)} onPaid={refresh}/>}<Link className="text-kumo-link" to={customerId?`${adminBase}/customers/${customerId}/orders`:`/console/orders/${order.orderId}`}>查看续费订单</Link></>}
 {pay.isSuccess&&<Banner title="余额支付已受理，请以到期时间更新为准"/>}<Button variant="secondary" disabled={create.isPending||pay.isPending} onClick={()=>setOpen(false)}>关闭</Button></Dialog></Dialog.Root></div>;
}
export function InstanceOrder({instance,customerId}:{instance:InstanceDetail;customerId?:string}){
 if(instance.orderNo)return <Link className="text-kumo-link hover:underline" to={customerId?`${adminBase}/customers/${customerId}/orders`:`/console/orders/${instance.orderId}`}>{instance.orderNo}</Link>;
 // 上游订单号、发票号与首付金额属于平台采购数据，只允许后台排障视图展示。
 if(customerId&&(instance.upstreamOrderNo||instance.upstreamOrderId))return <div className="grid gap-1"><span>{instance.upstreamOrderNo||instance.upstreamOrderId}</span>{instance.invoiceId&&<span>账单 #{instance.invoiceId}</span>}{instance.firstPayment&&<span>首付 ¥{instance.firstPayment}</span>}<span className="text-base text-kumo-subtle">上游原始订单，仅内部核对使用</span></div>;
 return <span className="text-base text-kumo-subtle">原始订单由平台管理，无需重复支付；如需核对请联系客服</span>;
}
