import {ScopedTable as Table} from '../../../shared/components/ScopedTable';
import {ConfigurableTable} from "../../../shared/components/ConfigurableTable";
import type {TableColumn} from "../../../shared/utils/tableLayout";
import type {AdminRecharge} from "../../../shared/api/adminRecharges";
import type {ReactNode} from "react";
import { AdminTableCopyText } from "../../../shared/components/AdminTableCopyText";
import { Badge, Banner, Button, Input, LayerDialog, Link, Select} from '@cloudflare/kumo';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminRechargeApi } from '../../../shared/api/adminRecharges';
import { getApiMessage } from '../../../shared/api/request';
import { PageState } from '../../../shared/components/PageState';
import { Pagination } from '../../../shared/components/Pagination';
import { adminBase } from '../../../shared/utils/adminEntry';
import { formatDate } from '../../../shared/utils/format';
import { rechargeChannels, rechargeStatuses, rechargePaymentStatuses, rechargeRecordID } from '../../../shared/utils/adminRecharges';
import { useAdminAuthStore } from '../../../shared/stores/staffAuth';
const rechargeColumns:readonly TableColumn[]=[{key:'number',label:'充值单号',width:270,min:180,required:true},{key:'customer',label:'客户',width:180,min:120},{key:'amount',type:'N',label:'充值金额',width:130,min:100},{key:'channel',label:'支付渠道',width:130,min:100},{key:'status',label:'充值状态',width:130,min:100},{key:'created',label:'创建时间',width:180,min:140},{key:'paid',label:'支付时间',width:180,min:140},{key:'credit',label:'关联入账',width:180,min:120},{key:'actions',label:'操作',width:100,min:80,required:true}];
const time = (value: string | null) => value ? formatDate(value) : '—';
const channel = (value:string) => rechargeChannels[value] ?? (value || '未记录');
function ChannelBadge({value}:{value:string}) { return value==='alipay' ? <Badge variant="blue">支付宝</Badge> : value==='wechat' ? <Badge variant="green">微信</Badge> : <span>{channel(value)}</span>; }
export function AdminRechargeOrders() {
 const [params,setParams]=useSearchParams(); const adminID=useAdminAuthStore(state=>state.user?.id);
 const page=Math.max(1,Math.min(100000,Math.floor(Number(params.get('page')))||1)); const status=params.get('status')??'all'; const gateway=params.get('channel')??'all'; const keyword=params.get('keyword')??''; const selected=params.get('recharge')??'';
 const [draft,setDraft]=useState(keyword);
 const patch=(values:Record<string,string|undefined>)=>{const next=new URLSearchParams(params);Object.entries(values).forEach(([key,value])=>{if(value)next.set(key,value);else next.delete(key);});setParams(next);};
 const query=useQuery({placeholderData:(previous,previousQuery)=>previousQuery?.queryKey[1]===adminID?previous:undefined,queryKey:['admin',adminID,'recharge-orders',page,status,gateway,keyword],queryFn:()=>adminRechargeApi.list({page,pageSize:10,status:status==='all'?undefined:status,channel:gateway==='all'?undefined:gateway,keyword:keyword||undefined}),retry:false});
 const detail=useQuery({queryKey:['admin',adminID,'recharge-detail',selected],queryFn:()=>adminRechargeApi.detail(selected),enabled:rechargeRecordID(selected),retry:false});
 const row=detail.data?.order;
 function rechargeCell(item:AdminRecharge,key:string):ReactNode{switch(key){
  case 'number':return <AdminTableCopyText value={item.rechargeNo} label="充值单号"><Button variant="ghost" size="xs" className="min-w-0 truncate" onClick={()=>patch({recharge:item.id})}>{item.rechargeNo}</Button></AdminTableCopyText>;
  case 'customer':return <AdminTableCopyText value={item.customerId} label="用户 ID"><Link variant="plain" href={`${adminBase}/customers/${item.customerId}`}>{item.customerId}</Link></AdminTableCopyText>;
  case 'amount':return `¥${item.amount}`;
  case 'channel':return <ChannelBadge value={item.channel}/>;
  case 'status':return rechargeStatuses[item.status]??'未知状态';
  case 'created':return time(item.createdAt);
  case 'paid':return time(item.paidAt);
  case 'credit':return item.creditCount>0?<span title={`入账时间：${time(item.creditedAt)}`}>¥{item.creditedAmount}</span>:'未匹配到流水';
  case 'actions':return <Button variant="ghost" size="xs" onClick={()=>patch({recharge:item.id})}>详情</Button>;
 }}
 return <div className="grid min-w-0 gap-4"><form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_auto]" onSubmit={e=>{e.preventDefault();patch({keyword:draft.trim()||undefined,page:undefined});}}><Input aria-label="充值订单关键词" placeholder="充值单号、客户、支付流水…" maxLength={200} value={draft} onChange={e=>setDraft(e.target.value)} /><Select aria-label="充值订单状态" value={status} items={{all:'全部状态',...rechargeStatuses}} onValueChange={value=>patch({status:value==='all'?undefined:value??undefined,page:undefined})} /><Select aria-label="充值支付渠道" value={gateway} items={{all:'全部渠道',...rechargeChannels}} onValueChange={value=>patch({channel:value==='all'?undefined:value??undefined,page:undefined})} /><Button type="submit" variant="secondary">筛选</Button></form>
 <div aria-busy={query.isFetching} className="grid min-w-0 gap-3">{query.error?<Banner variant="error" title="充值订单加载失败" description={getApiMessage(query.error)}/>:null}<ConfigurableTable loading={query.isPending} key={adminID??'anonymous'} columns={rechargeColumns} rows={query.data?.items??[]} storageKey={`ddyidc-admin-order-columns:v3:recharge:${adminID??'anonymous'}`} label="充值订单列表" renderCell={rechargeCell} rowKey={item=>item.id}/>
 <Pagination page={page} setPage={value=>patch({page:String(value)})} perPage={10} totalCount={query.data?.total??0}/></div>
 <LayerDialog.Root open={Boolean(selected)} onOpenChange={open=>{if(!open)patch({recharge:undefined});}}><LayerDialog.Content size="xl" closeLabel="关闭"><LayerDialog.Title>充值订单详情</LayerDialog.Title><LayerDialog.Description>只读取本地订单、支付记录和关联账本，不发起查单、扣款或入账。</LayerDialog.Description><LayerDialog.Body>{!rechargeRecordID(selected)?<Banner variant="error" title="充值订单编号无效"/>:<PageState loading={detail.isPending} error={detail.error?getApiMessage(detail.error):null}>{row&&<div className="grid gap-5"><dl className="grid gap-3 sm:grid-cols-2">{[['充值单号',row.rechargeNo],['客户',row.customerId],['充值金额',`¥${row.amount}`],['记录的赠送金额',`¥${row.bonus}`],['充值状态',rechargeStatuses[row.status]??'未知状态'],['渠道',channel(row.channel)],['创建时间',time(row.createdAt)],['支付时间',time(row.paidAt)],['关联入账金额',row.creditCount>0?`¥${row.creditedAmount}`:'未匹配到流水'],['入账时间',time(row.creditedAt)]].map(([label,value])=><div key={label} className="min-w-0"><dt className="text-sm text-kumo-subtle">{label}</dt><dd className="break-all text-sm">{label === '渠道' ? <ChannelBadge value={row.channel}/> : ['充值单号','客户'].includes(label ?? '') ? <AdminTableCopyText value={value} label={label ?? '字段'}/> : value}</dd></div>)}</dl>{row.creditCount===0&&<Banner title="未找到可关联的入账流水" description="历史记录可能缺少关联信息，不能据此判断未到账。此处不提供补款或重试操作。"/>}<h3 className="font-medium">支付记录</h3><div className="overflow-x-auto"><Table tableId="apps/admin/views/AdminRechargeOrders.tsx:1" className="min-w-[56rem]"><Table.Header><Table.Row>{['支付单号','渠道','渠道订单号','渠道交易流水','金额','支付状态','支付时间'].map(label=><Table.Head key={label} className="whitespace-nowrap">{label}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{detail.data?.payments.map(payment=><Table.Row key={payment.id}><Table.Cell><AdminTableCopyText value={payment.paymentNo} label="支付单号"/></Table.Cell><Table.Cell className="whitespace-nowrap"><ChannelBadge value={payment.channel}/></Table.Cell><Table.Cell><AdminTableCopyText value={payment.outTradeNo} label="渠道订单号"/></Table.Cell><Table.Cell className="break-all"><AdminTableCopyText value={payment.transactionId} label="渠道交易流水"/></Table.Cell><Table.Cell className="whitespace-nowrap">¥{payment.amount}</Table.Cell><Table.Cell className="whitespace-nowrap">{rechargePaymentStatuses[payment.status]??payment.status}</Table.Cell><Table.Cell className="whitespace-nowrap">{time(payment.paidAt)}</Table.Cell></Table.Row>)}</Table.Body></Table></div>{!detail.data?.payments.length&&<p className="text-sm text-kumo-subtle">暂无关联支付记录。</p>}<h3 className="font-medium">关联入账流水</h3><div className="overflow-x-auto"><Table tableId="apps/admin/views/AdminRechargeOrders.tsx:2"><Table.Header><Table.Row><Table.Head>流水号</Table.Head><Table.Head>入账金额</Table.Head><Table.Head>入账时间</Table.Head></Table.Row></Table.Header><Table.Body>{detail.data?.credits.map(credit=><Table.Row key={credit.id}><Table.Cell><AdminTableCopyText value={credit.txNo} label="流水号"/></Table.Cell><Table.Cell>¥{credit.amount}</Table.Cell><Table.Cell>{time(credit.createdAt)}</Table.Cell></Table.Row>)}</Table.Body></Table></div><p className="text-sm text-kumo-subtle">赠送金额为充值单原始记录；实际入账以所列账本为准。</p></div>}</PageState>}</LayerDialog.Body></LayerDialog.Content></LayerDialog.Root>
 </div>;
}
