import { Banner, Button, ClipboardText, DatePicker, Dialog, Input, Select, SensitiveInput, Switch } from '@cloudflare/kumo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { InstanceDetail } from '../api/console';
import { instanceManagementApi } from '../api/instanceManagement';
import { getApiMessage } from '../api/request';
import { PaymentDialog } from './PaymentDialog';

export function InstanceCredentials({instance,customerId}:{instance:InstanceDetail;customerId?:string}){
 const [open,setOpen]=useState(false); const generation=useRef(0);
 const [data,setData]=useState<{username:string;password:string;port:string}>();const [error,setError]=useState('');const [loading,setLoading]=useState(false);
 function close(){generation.current++;setOpen(false);setData(undefined);setError('');setLoading(false)}
 async function load(){const current=++generation.current;setOpen(true);setData(undefined);setError('');setLoading(true);try{const result=await instanceManagementApi(instance.id,customerId).credentials();if(current===generation.current)setData(result)}catch(e){if(current===generation.current)setError(getApiMessage(e))}finally{if(current===generation.current)setLoading(false)}}
 return <Dialog.Root open={open} onOpenChange={v=>{if(!v)close()}}>
  <Button variant="secondary" size="sm" onClick={()=>void load()}>查看登录信息</Button>
  <Dialog className="grid gap-4 p-6"><Dialog.Title>实例登录信息</Dialog.Title><Dialog.Description>仅实例所有者与管理员可查看，读取操作会记录审计。</Dialog.Description>
   {loading&&<p role="status">正在读取…</p>}{error&&<Banner variant="error" title={error}/>}
   {data&&<><div>用户名：{data.username?<ClipboardText text={data.username}/>:"服务未提供"}</div><div>端口：{data.port?<ClipboardText text={data.port}/>:"服务未提供有效端口"}</div>{data.password?<SensitiveInput label="实例密码" value={data.password} readOnly/>:<p>服务未提供密码，请通过重置密码设置。</p>}</>}
   <Button variant="secondary" onClick={close}>关闭</Button>
  </Dialog>
 </Dialog.Root>;
}

export function InstanceEdit({instance,customerId}:{instance:InstanceDetail;customerId:string}){
 const [open,setOpen]=useState(false);const [upstream,setUpstream]=useState(instance.upstreamInstanceId||'');
 const [created,setCreated]=useState<Date|undefined>(new Date(instance.createdAt));const [activated,setActivated]=useState<Date|undefined>(instance.activatedAt?new Date(instance.activatedAt):undefined);
 const client=useQueryClient();const save=useMutation({mutationFn:()=>instanceManagementApi(instance.id,customerId).edit({upstreamInstanceId:upstream,createdAt:created?.toISOString(),activatedAt:activated?.toISOString()}),onSuccess:async()=>{await client.invalidateQueries({queryKey:['admin','customer-instance',customerId,instance.id]});await client.invalidateQueries({queryKey:['admin','customer-records',customerId,'products']});setOpen(false)}});
 function changeDay(old:Date|undefined,next:Date|undefined,set:(value:Date|undefined)=>void){if(!next)return;const value=new Date(next);if(old)value.setHours(old.getHours(),old.getMinutes(),old.getSeconds());set(value)}
 function timeValue(d?:Date){return d?`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`:''}
 function changeTime(d:Date|undefined,value:string,set:(value:Date|undefined)=>void){if(!d||!value)return;const [h=0,m=0,s=0]=value.split(':').map(Number);const next=new Date(d);next.setHours(h,m,s);set(next)}
 return <Dialog.Root open={open} onOpenChange={v=>{if(!save.isPending)setOpen(v)}}><Button size="sm" variant="secondary" onClick={()=>{setUpstream(instance.upstreamInstanceId||'');setCreated(new Date(instance.createdAt));setActivated(instance.activatedAt?new Date(instance.activatedAt):undefined);save.reset();setOpen(true)}}>编辑实例信息</Button>
 <Dialog className="grid max-h-[90vh] max-w-3xl gap-4 overflow-auto p-6"><Dialog.Title>编辑实例信息</Dialog.Title><Dialog.Description>保存后重新拉取所填上游实例的 IP、配置与状态。日期使用当前浏览器时区，修改仅影响本地管理记录。</Dialog.Description>
 <Input label="上游实例 ID" inputMode="numeric" value={upstream} onChange={e=>setUpstream(e.target.value)} disabled={save.isPending}/>
 <div className="grid gap-4 md:grid-cols-2"><div className="grid gap-2"><p>创建时间</p><DatePicker labels={{labelPrevious:()=>"上个月",labelNext:()=>"下个月",labelDayButton:(date)=>date.toLocaleDateString("zh-CN")}} formatters={{formatCaption:date=>date.toLocaleDateString("zh-CN",{year:"numeric",month:"long"}),formatWeekdayName:date=>date.toLocaleDateString("zh-CN",{weekday:"short"})}} mode="single" selected={created} onChange={d=>changeDay(created,d,setCreated)} disabled={save.isPending}/><Input label="创建时刻" type="time" step={1} value={timeValue(created)} onChange={e=>changeTime(created,e.target.value,setCreated)} disabled={save.isPending}/></div><div className="grid gap-2"><p>开通时间</p><DatePicker labels={{labelPrevious:()=>"上个月",labelNext:()=>"下个月",labelDayButton:(date)=>date.toLocaleDateString("zh-CN")}} formatters={{formatCaption:date=>date.toLocaleDateString("zh-CN",{year:"numeric",month:"long"}),formatWeekdayName:date=>date.toLocaleDateString("zh-CN",{weekday:"short"})}} mode="single" selected={activated} onChange={d=>changeDay(activated,d,setActivated)} disabled={save.isPending}/><Input label="开通时刻" type="time" step={1} value={timeValue(activated)} onChange={e=>changeTime(activated,e.target.value,setActivated)} disabled={save.isPending}/></div></div>
 {save.error&&<Banner variant="error" title={getApiMessage(save.error)}/>}<div className="flex justify-end gap-2"><Button variant="secondary" disabled={save.isPending} onClick={()=>setOpen(false)}>取消</Button><Button loading={save.isPending} disabled={!/^[1-9]\d*$/.test(upstream)||!created||!activated} onClick={()=>save.mutate()}>保存并同步</Button></div>
 </Dialog></Dialog.Root>;
}
export function InstanceRenewal({instance,customerId}:{instance:InstanceDetail;customerId?:string}){
 const [open,setOpen]=useState(false);const [cycle,setCycle]=useState('');const api=instanceManagementApi(instance.id,customerId);const client=useQueryClient();
 const options=useQuery({queryKey:['renewal-options',customerId||'self',instance.id],queryFn:api.options,enabled:open,retry:false});
 const create=useMutation({mutationFn:()=>api.renew(cycle)});const refresh=async()=>{await client.invalidateQueries({queryKey:customerId?['admin','customer-instance',customerId,instance.id]:['instances',instance.id]})};
 const pay=useMutation({mutationFn:()=>api.pay(create.data!.orderId),onSettled:refresh});
 const auto=useMutation({mutationFn:api.auto,onSuccess:refresh});
 return <div className="grid gap-3"><Switch label="自动余额续费" checked={instance.autoRenew||false} disabled={auto.isPending} onCheckedChange={v=>auto.mutate(v)}/><p className="text-xs text-kumo-subtle">开启后，到期前 3 天按当前周期创建订单，余额充足时自动支付续费。余额不足不扣款。</p>{auto.error&&<Banner variant="error" title={getApiMessage(auto.error)}/>}
 <Dialog.Root open={open} onOpenChange={v=>{if(!create.isPending&&!pay.isPending)setOpen(v)}}><Button variant="secondary" size="sm" onClick={()=>{setOpen(true);pay.reset();create.reset();setCycle('')}}>续费</Button><Dialog className="grid gap-4 p-6"><Dialog.Title>实例续费</Dialog.Title><Dialog.Description>报价来自当前服务，创建订单后可选择支付方式。请核对周期和金额。</Dialog.Description>
 <Select label="续费周期" value={cycle} items={{"":"请选择续费周期",...Object.fromEntries((options.data?.items||[]).map(x=>[x.cycle,`${x.label||x.cycle} · ¥${x.amount}`]))}} onValueChange={v=>setCycle(v||'')} disabled={create.isPending||!!create.data}/>
 {options.error&&<Banner variant="error" title={getApiMessage(options.error)}/>}{create.error&&<Banner variant="error" title={getApiMessage(create.error)}/>}{pay.error&&<Banner variant="error" title={getApiMessage(pay.error)}/>}
 {!create.data?<Button disabled={!cycle||options.isLoading} loading={create.isPending} onClick={()=>create.mutate()}>创建续费订单</Button>:<><p>订单 {create.data.orderNo} · ¥{create.data.amount}</p><Button disabled={pay.isPending||pay.isSuccess} loading={pay.isPending} onClick={()=>pay.mutate()}>确认余额支付 ¥{create.data.amount}</Button>{!customerId&&<PaymentDialog businessType="order" businessId={create.data.orderId} amountCents={Math.round(Number(create.data.amount)*100)} onPaid={refresh}/>}<Link className="text-kumo-link" to={customerId?`/admin/customers/${customerId}/orders`:`/console/orders/${create.data.orderId}`}>查看续费订单</Link></>}
 {pay.isSuccess&&<Banner title="余额支付已受理，请以到期时间更新为准"/>}<Button variant="secondary" disabled={create.isPending||pay.isPending} onClick={()=>setOpen(false)}>关闭</Button></Dialog></Dialog.Root></div>;
}
export function InstanceOrder({instance,customerId}:{instance:InstanceDetail;customerId?:string}){
 if(instance.orderNo)return <Link className="text-kumo-link hover:underline" to={customerId?`/admin/customers/${customerId}/orders`:`/console/orders/${instance.orderId}`}>{instance.orderNo}</Link>;
 if(instance.upstreamOrderNo||instance.upstreamOrderId)return <div className="grid gap-1"><span>{instance.upstreamOrderNo||instance.upstreamOrderId}</span>{instance.invoiceId&&<span>账单 #{instance.invoiceId}</span>}{instance.firstPayment&&<span>首付 ¥{instance.firstPayment}</span>}<span className="text-xs text-kumo-subtle">已开通服务的原始订单，无重复收费</span></div>;
 return <>未返回订单信息</>;
}
