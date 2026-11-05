import {useAuthStore} from '../../../shared/stores/auth';
import {Banner,Button,Input,LayerDialog,Select,Table,Tabs} from '@cloudflare/kumo';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {billingApi,type Bill} from '../../../shared/api/billing';
import {getApiMessage} from '../../../shared/api/request';
import {PageHeader} from '../../../shared/components/PageHeader';
import {Pagination} from '../../../shared/components/Pagination';
import {PaymentDialog} from '../../../shared/components/PaymentDialog';
import {AdminTableCopyText} from '../../../shared/components/AdminTableCopyText';
import {ConfigurableTable} from '../../../shared/components/ConfigurableTable';
import {Badge} from '../../../shared/components/Badge';
import {formatDate,formatMoney} from '../../../shared/utils/format';
import type {TableColumn} from '../../../shared/utils/tableLayout';
const statuses:Record<string,string>={pending:'待支付',paid:'已支付',closed:'已关闭',refunded:'已退款',partial_refund:'部分退款',failed:'支付失败',review:'收款待核对',unknown:'待核对'};
const statusVariants:Record<string,'success'|'warning'|'error'|'neutral'>={pending:'warning',paid:'success',closed:'neutral',refunded:'neutral',partial_refund:'warning',failed:'error',review:'warning',unknown:'neutral'};
const categories:Record<string,string>={instance_upgrade:'升降配',instance_renewal:'产品续费',recharge:'账户充值',domain:'域名服务',groupbuy:'拼团',marketplace:'资源交易',certification:'实名认证',promo_coupon:'优惠券',cdnsell:'内容分发'};
const time=(value?:string)=>value?formatDate(value):'—';
function BillStatusBadge({status}:{status:string}){const variant=statusVariants[status]??'neutral';return <Badge variant={variant}>{statuses[status]??'待核对'}</Badge>}
const columns:readonly TableColumn[]=[
 {key:'number',label:'账单号',width:280,min:180,required:true},
 {key:'title',label:'项目',width:260,min:160},
 {key:'category',label:'类型',width:140,min:100},
 {key:'amount',type:'N',label:'应付金额',width:130,min:100},
 {key:'status',label:'状态',width:130,min:110},
 {key:'created',label:'创建时间',width:180,min:140},
 {key:'actions',label:'操作',width:120,min:100,required:true},
];
export function BillingList(){
 const accountId=useAuthStore(state=>state.user?.id);const tableKey=accountId??'anonymous';
 const [params,setParams]=useSearchParams();const [keyword,setKeyword]=useState(params.get('keyword')??'');const [selected,setSelected]=useState<Pick<Bill,'id'|'kind'>|null>(null);const cache=useQueryClient();
 const page=Math.max(1,Number(params.get('page'))||1);const kind=params.get('kind')??'';const status=params.get('status')??'';
 const query=useQuery({queryKey:['billing',accountId,{page,kind,status,keyword:params.get('keyword')??''}],queryFn:()=>billingApi.list({page,pageSize:10,kind,status,keyword:params.get('keyword')??''})});
 const detail=useQuery({queryKey:['bill',accountId,selected?.kind,selected?.id],enabled:!!selected,queryFn:()=>billingApi.detail(selected!.kind,selected!.id)});
 useEffect(()=>setSelected(null),[accountId]);
 const change=(key:string,value:string)=>{const next=new URLSearchParams(params);if(value)next.set(key,value);else next.delete(key);if(key!=='page')next.delete('page');setParams(next)};
 const refresh=async()=>{await Promise.all([cache.invalidateQueries({queryKey:['billing']}),cache.invalidateQueries({queryKey:['bill']}),cache.invalidateQueries({queryKey:['orders']})])};
 function cell(bill:Bill,key:string){
  switch(key){
   case 'number':return <AdminTableCopyText value={bill.number} label="账单号"><span className="block truncate">{bill.number}</span></AdminTableCopyText>;
   case 'title':return <span className="block truncate" title={bill.title}>{bill.title}</span>;
   case 'category':return categories[bill.category]??(bill.kind==='recharge'?'账户充值':'产品与服务');
   case 'amount':return formatMoney(Math.round(Number(bill.amount)*100));
   case 'status':return <BillStatusBadge status={bill.status}/>;
   case 'created':return time(bill.createdAt);
   case 'actions':return <Button variant="secondary" size="sm" onClick={()=>setSelected({kind:bill.kind,id:bill.id})}>{bill.status==='pending'?'查看并支付':'查看详情'}</Button>;
  }
 }
 return <><PageHeader title="统一账单" description="集中查看产品购买、续费、升降配及账户充值账单。"/>
 <div className="grid gap-4"><Tabs variant="underline" value={status} tabs={[{value:'',label:'全部'},{value:'pending',label:'待支付'},{value:'paid',label:'已支付'},{value:'closed',label:'已关闭'},{value:'refunded',label:'已退款'},{value:'partial_refund',label:'部分退款'},{value:'failed',label:'支付失败'},{value:'review',label:'收款待核对'}]} onValueChange={value=>change('status',value)}/>
 <form className="flex flex-wrap items-end gap-3" onSubmit={event=>{event.preventDefault();change('keyword',keyword.trim())}}><Select label="账单类型" value={kind} items={{'':'全部账单',order:'业务账单',recharge:'充值账单',marketplace:'资源交易账单',groupbuy:'拼团账单'}} onValueChange={value=>change('kind',value??'')}/><Input aria-label="搜索账单" placeholder="搜索账单号或商品名称" value={keyword} onChange={event=>setKeyword(event.target.value)}/><Button type="submit" variant="secondary">搜索</Button></form>
 <div className="grid min-w-0 gap-3" aria-busy={query.isFetching}>
  {query.error?<Banner variant="error" title="账单加载失败" description={getApiMessage(query.error)}/>:null}
  <ConfigurableTable key={accountId} rows={query.data?.list??[]} columns={columns} storageKey={`ddyidc-console-billing-columns:v1:${tableKey}`} loading={query.isPending} label="统一账单列表" renderCell={cell} rowKey={bill=>`${bill.kind}:${bill.id}`} emptyContent="暂无账单"/>
  {query.data?<Pagination page={page} setPage={value=>change('page',String(value))} perPage={10} totalCount={query.data.total}/>:null}
 </div>
 </div>
 <LayerDialog.Root open={!!selected} onOpenChange={open=>{if(!open)setSelected(null)}}><LayerDialog.Content size="lg" closeLabel="关闭"><LayerDialog.Title>账单详情</LayerDialog.Title><LayerDialog.Description>核对账单内容与金额，付款后可在此查看最新状态。</LayerDialog.Description><LayerDialog.Body>{detail.isLoading?<p role="status">正在读取账单…</p>:null}{detail.error?<Banner variant="error" title={getApiMessage(detail.error)}/>:null}{detail.data?<div className="grid gap-4 text-sm"><dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3"><dt>账单号</dt><dd>{detail.data.number}</dd><dt>原业务单号</dt><dd>{detail.data.sourceNo}</dd><dt>项目</dt><dd>{detail.data.title}</dd><dt>状态</dt><dd><BillStatusBadge status={detail.data.status}/></dd><dt>应付金额</dt><dd>{formatMoney(Math.round(Number(detail.data.amount)*100))}</dd><dt>创建时间</dt><dd>{time(detail.data.createdAt)}</dd><dt>支付时间</dt><dd>{time(detail.data.paidAt)}</dd></dl>{detail.data.items?.length?<Table><Table.Header><Table.Row><Table.Head>费用项目</Table.Head><Table.Head>金额</Table.Head></Table.Row></Table.Header><Table.Body>{detail.data.items.map((line,index)=><Table.Row key={index}><Table.Cell>{line.description}</Table.Cell><Table.Cell>{formatMoney(Math.round(Number(line.amount)*100))}</Table.Cell></Table.Row>)}</Table.Body></Table>:null}{detail.data.status==='review'?<Banner variant="alert" title="已收到付款，待核对，请勿重复支付"/>:null}{detail.data.kind==='order'?<Link to={`/console/orders/${detail.data.sourceId}`}>查看业务订单与交付详情</Link>:null}{detail.data.status==='pending'&&detail.data.category!=='promo_coupon'&&Number(detail.data.amount)>0?<PaymentDialog businessType="invoice" allowBalance={detail.data.kind!=='recharge'} businessId={detail.data.id} amountCents={Math.round(Number(detail.data.amount)*100)} onPaid={refresh}/>:null}</div>:null}</LayerDialog.Body><LayerDialog.Actions dismissLabel="关闭"><LayerDialog.Action onClick={()=>setSelected(null)}>完成</LayerDialog.Action></LayerDialog.Actions></LayerDialog.Content></LayerDialog.Root></>;
}
