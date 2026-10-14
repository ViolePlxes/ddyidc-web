import { Banner,Button,Input,LayerCard,Link,Pagination,Select,Table } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { useEffect,useState } from "react";
import { getBalanceStatement,exportBalanceStatement,type BalanceFilters } from "../api/balanceTransactions";
import { getApiMessage } from "../api/request";
import { useAuthStore } from "../stores/auth";
import { DateRangeField } from "./DateField";
import { PageState } from "./PageState";
const types=[['recharge','充值'],['order_pay','产品订购'],['instance_renewal_pay','产品续费'],['instance_upgrade_pay','产品配置变更'],['refund','退款入账'],['manual_credit','后台人工增加余额'],['manual_debit','后台人工扣减余额'],['freeze','冻结余额'],['unfreeze','解除冻结'],['withdrawal_hold','提现申请冻结'],['withdrawal_release','提现冻结释放'],['withdraw','提现扣款'],['commission','佣金入账'],['points_credit','积分兑换余额'],['marketplace_income','交易市场收入'],['overpayment','多付入账'],['underpayment','补扣费用'],['promo_coupon_pay','优惠券购买'],['promo_coupon_refund','优惠券退款']];
const empty:BalanceFilters={type:'',direction:'',keyword:'',startAt:'',endAt:''};
const displayTime=(raw:string)=>new Date(raw).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
function assetTotal(a:string,b:string){const cents=(v:string)=>BigInt(v.replace('.',''));const n=cents(a)+cents(b);return `${n/100n}.${String(n%100n).padStart(2,'0')}`;}
export function BalanceTransactions(){
 const userID=useAuthStore(s=>s.user?.id);
 const [draft,setDraft]=useState(empty),[filters,setFilters]=useState(empty),[page,setPage]=useState(1),[version,setVersion]=useState<number>();
 const [generation,setGeneration]=useState(0);
 const [start,setStart]=useState(''),[end,setEnd]=useState(''),[exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
 const query=useQuery({queryKey:['console','balance-transactions',userID,filters,page,version,generation],enabled:Boolean(userID),queryFn:({signal})=>getBalanceStatement({...filters,page,pageSize:20,snapshotVersion:version},signal),refetchOnWindowFocus:false,retry:1});
 useEffect(()=>{if(query.data&&query.isSuccess&&!query.isFetching&&version===undefined)setVersion(query.data.snapshotVersion)},[query.data,query.isSuccess,query.isFetching,version]);
 useEffect(()=>{setGeneration(g=>g+1);setVersion(undefined);setPage(1);setExportError('');setDraft(empty);setFilters(empty);setStart('');setEnd('')},[userID]);
 const refresh=()=>{setGeneration(g=>g+1);setPage(1);setVersion(undefined)};
 useEffect(()=>{const update=()=>{if(page===1){setGeneration(g=>g+1);setVersion(undefined)}};const changed=()=>{setGeneration(g=>g+1);setPage(1);setVersion(undefined)};window.addEventListener('ddyidc:balance-changed',changed);const timer=window.setInterval(update,30_000);window.addEventListener('focus',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('ddyidc:balance-changed',changed)}},[page]);
 const apply=()=>{setGeneration(g=>g+1);setPage(1);setVersion(undefined);setFilters({...draft,startAt:start?`${start}+08:00`:'',endAt:end?`${end}+08:00`:''});setExportError('')};
 const download=async()=>{setExporting(true);setExportError('');const owner=userID;try{const blob=await exportBalanceStatement({...filters,snapshotVersion:version});if(useAuthStore.getState().user?.id!==owner)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='余额流水.csv';a.click();URL.revokeObjectURL(url)}catch(e){setExportError(getApiMessage(e))}finally{setExporting(false)}};
 const data=userID?query.data:undefined;
 return <section className="grid min-w-0 gap-4" aria-label="余额流水">
  <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">余额流水</h2><p className="text-sm text-kumo-subtle">所有金额单位为元，时间为北京时间。冻结与释放是可用资金转移。</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={refresh} disabled={query.isFetching}>刷新</Button><Button variant="secondary" onClick={()=>void download()} disabled={!data||exporting||query.isFetching}>导出 CSV</Button></div></div>
  {data&&<LayerCard className="grid gap-2 p-4">{data.account.exists||data.integrity==='consistent'?<div className="flex flex-wrap gap-6"><span>截至查询快照可用余额：¥{data.account.balance}</span><span>冻结余额：¥{data.account.frozenBalance}</span><span>资产合计：¥{assetTotal(data.account.balance,data.account.frozenBalance)}</span></div>:<p>账户记录缺失，余额待核查；下方保留已有资金流水。</p>}<p className="text-sm text-kumo-subtle">查询版本 {data.snapshotVersion} · {displayTime(data.asOf)}。刷新后查看最新变动。</p></LayerCard>}
  {data?.integrity==='needs_review'&&<Banner variant="alert" title="账户资金记录需核查" description="仍可查看流水；余额交易将在核查通过后恢复。"/>}
  <LayerCard className="p-4"><form className="grid gap-4" onSubmit={e=>{e.preventDefault();apply()}}><div className="grid gap-4 md:grid-cols-3"><Select label="流水类型" value={draft.type} items={[{value:'',label:'全部类型'},...types.map(([value,label])=>({value,label}))]} onValueChange={v=>setDraft({...draft,type:v??''})}/><Select label="可用余额变动方向" value={draft.direction} items={[{value:'',label:'全部'},{value:'increase',label:'增加'},{value:'decrease',label:'减少'}]} onValueChange={v=>setDraft({...draft,direction:v??''})}/><Input label="流水编号或客户说明" value={draft.keyword} maxLength={100} onChange={e=>setDraft({...draft,keyword:e.target.value})}/></div><DateRangeField label="记录时间范围（起始含、结束不含，北京时间）" from={start} to={end} withTime seconds onValueChange={(a,b)=>{setStart(a);setEnd(b)}}/><div className="flex flex-wrap gap-2"><Button type="submit" disabled={query.isFetching}>查询</Button><Button type="button" variant="secondary" onClick={()=>{setGeneration(g=>g+1);setDraft(empty);setFilters(empty);setStart('');setEnd('');setPage(1);setVersion(undefined)}}>清除筛选</Button></div></form></LayerCard>
  {exportError&&<Banner variant="error" title={exportError}/>}
  <PageState loading={query.isLoading} error={query.error?getApiMessage(query.error):null} empty={!query.isLoading&&!query.error&&data?.items.length===0} emptyTitle="暂无符合条件的余额流水">
   <LayerCard className="min-w-0 overflow-x-auto p-0"><Table className="whitespace-nowrap"><Table.Header><Table.Row>{['时间','类型','可用余额变动','可用余额前 → 后','冻结余额前 → 后','客户说明','流水编号','关联业务'].map(v=><Table.Head key={v}>{v}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{data?.items.map(row=><Table.Row key={row.id}><Table.Cell>{displayTime(row.createdAt)}</Table.Cell><Table.Cell>{row.typeLabel}</Table.Cell><Table.Cell>{row.amount.startsWith('-')?row.amount:`+${row.amount}`}</Table.Cell><Table.Cell>{row.balanceBefore} → {row.balanceAfter}</Table.Cell><Table.Cell>{row.frozenBefore} → {row.frozenAfter}</Table.Cell><Table.Cell className="max-w-72 whitespace-normal break-words">{row.description}</Table.Cell><Table.Cell>#{row.id}</Table.Cell><Table.Cell>{row.href?<Link href={row.href}>查看订单</Link>:row.relatedType==='balance_withdrawal'?`提现 #${row.relatedId}`:'—'}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
   {data&&<><p className="text-sm text-kumo-subtle">本页可用余额净变动：{data.pageNet} 元 · 筛选范围增加 {data.increase} 元 / 减少 {data.decrease} 元 / 净变动 {data.net} 元。包含冻结与释放，不代表最终消费统计。</p><Pagination page={page} setPage={setPage} perPage={20} totalCount={data.total}/></>}
  </PageState>
  {query.error&&<Button variant="secondary" onClick={()=>void query.refetch()}>重试查询</Button>}
 </section>;
}
