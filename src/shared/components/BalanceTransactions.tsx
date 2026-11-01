import {ScopedTable as Table} from './ScopedTable';
import { Pagination } from "./Pagination";
import { Banner,Button,Input,LayerCard,Link,Select,Tabs} from "@cloudflare/kumo";
import { usePrefetchedLedger } from "./usePrefetchedLedger";
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
 const [draft,setDraft]=useState(empty),[filters,setFilters]=useState(empty),[page,setPage]=useState(1);
 const [generation,setGeneration]=useState(0);
 const [showFilters,setShowFilters]=useState(false);
 const [start,setStart]=useState(''),[end,setEnd]=useState(''),[exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
 const query=usePrefetchedLedger({scope:['console','balance-transactions',userID,{...filters,direction:''},generation],page,direction:(filters.direction||'all') as 'all'|'increase'|'decrease',enabled:Boolean(userID),load:(direction,nextPage,snapshotVersion,signal)=>getBalanceStatement({...filters,direction:direction==='all'?'':direction,page:nextPage,pageSize:20,snapshotVersion},signal),version:statement=>statement.snapshotVersion});
 const version=query.snapshot;
 useEffect(()=>{setGeneration(g=>g+1);setPage(1);setExportError('');setDraft(empty);setFilters(empty);setStart('');setEnd('')},[userID]);
 const refresh=()=>{setGeneration(g=>g+1);setPage(1)};
 useEffect(()=>{const changed=()=>{setGeneration(g=>g+1);setPage(1)};window.addEventListener('ddyidc:balance-changed',changed);window.addEventListener('ddyidc:order-created',changed);return()=>{window.removeEventListener('ddyidc:balance-changed',changed);window.removeEventListener('ddyidc:order-created',changed)}},[]);
 const apply=()=>{setGeneration(g=>g+1);setPage(1);setFilters({...draft,startAt:start?`${start}+08:00`:'',endAt:end?`${end}+08:00`:''});setExportError('')};
 const changeDirection=(value:string)=>{const direction=value==='all'?'':value;if(direction===filters.direction)return;setDraft(current=>({...current,direction}));setFilters(current=>({...current,direction}));setPage(1);setExportError('')};
 const search=(keyword:string)=>{setDraft(current=>({...current,keyword}));setFilters(current=>({...current,keyword}));setPage(1);setExportError('')};
 const clearFilters=()=>{setGeneration(g=>g+1);setDraft(empty);setFilters(empty);setStart('');setEnd('');setPage(1);setExportError('')};
 const download=async()=>{setExporting(true);setExportError('');const owner=userID;try{const blob=await exportBalanceStatement({...filters,snapshotVersion:version});if(useAuthStore.getState().user?.id!==owner)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='余额流水.csv';a.click();URL.revokeObjectURL(url)}catch(e){setExportError(getApiMessage(e))}finally{setExporting(false)}};
 const data=userID?query.data:undefined;
 return <section className="grid min-w-0 gap-4" aria-label="余额流水">
  {data&&<div className="grid gap-3 sm:grid-cols-3">{data.account.exists||data.integrity==='consistent'?<>{[['可用余额',data.account.balance],['冻结余额',data.account.frozenBalance],['资产合计',assetTotal(data.account.balance,data.account.frozenBalance)]].map(([label,value])=><LayerCard key={label}><LayerCard.Secondary>{label}</LayerCard.Secondary><LayerCard.Primary><p className="text-base font-semibold tabular-nums">¥{value}</p></LayerCard.Primary></LayerCard>)}</>:<Banner variant="alert" title="账户记录缺失，余额待核查" description="下方保留已有资金流水。"/>}</div>}
  {data?.integrity==='needs_review'&&<Banner variant="alert" title="账户资金记录需核查" description="仍可查看流水；余额交易将在核查通过后恢复。"/>}
  <LayerCard className="min-w-0">
   <LayerCard.Secondary className="flex flex-wrap items-center justify-between gap-2">
    <h2>余额流水</h2>
    <div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="secondary" aria-expanded={showFilters} aria-controls="balance-ledger-filters" onClick={()=>setShowFilters(v=>!v)}>{showFilters?'收起筛选':'筛选'}</Button><Button type="button" size="sm" variant="ghost" onClick={clearFilters}>清除筛选</Button><Button size="sm" variant="secondary" onClick={refresh} disabled={query.isFetching}>刷新</Button><Button size="sm" variant="secondary" onClick={()=>void download()} disabled={!data||exporting||query.isFetching}>{exporting?'正在导出…':'导出 CSV'}</Button></div>
   </LayerCard.Secondary>
   <LayerCard.Primary className="min-w-0">
    <form className="mb-2 grid gap-3" onSubmit={e=>{e.preventDefault();apply()}}>
     <div className="flex items-center gap-3">
      <Input size="sm" aria-label="流水编号或客户说明" placeholder="搜索流水编号或客户说明…" className="min-w-0 flex-1" value={draft.keyword} maxLength={100} onChange={e=>search(e.target.value)}/>
      <Tabs variant="segmented" size="sm" className="shrink-0" value={filters.direction||'all'} onValueChange={changeDirection} tabs={[{value:'all',label:'全部'},{value:'increase',label:'增加'},{value:'decrease',label:'减少'}]}/>
     </div>
     {showFilters&&<div id="balance-ledger-filters" className="grid gap-3 border-t border-kumo-line pt-3">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)]"><Select label="流水类型" value={draft.type} items={[{value:'',label:'全部类型'},...types.map(([value,label])=>({value,label}))]} onValueChange={v=>setDraft({...draft,type:v??''})}/><DateRangeField label="记录时间范围（北京时间）" from={start} to={end} withTime seconds onValueChange={(a,b)=>{setStart(a);setEnd(b)}}/></div>
      <div className="flex flex-wrap items-center gap-2"><Button type="submit" size="sm" disabled={query.isFetching}>应用筛选</Button><Button type="button" size="sm" variant="ghost" onClick={clearFilters}>清除筛选</Button><span className="text-base text-kumo-subtle">起始时间包含，结束时间不包含</span></div>
     </div>}
    </form>
    {exportError&&<Banner variant="error" title={exportError}/>}
    {query.error&&data&&<Banner variant="error" title="流水更新失败，请重试" description={getApiMessage(query.error)}/>}
    <PageState loading={query.isLoading&&!data} error={query.error&&!data?getApiMessage(query.error):null} empty={!query.isLoading&&!query.error&&data?.items.length===0} emptyTitle="暂无符合条件的余额流水">
     <div className="-mx-1 min-w-0 overflow-x-auto text-base" aria-busy={query.isFetching}>
      <Table tableId="shared/components/BalanceTransactions.tsx:1" role="table" aria-label="余额流水记录" className="min-w-[66rem]">
       <Table.Header><Table.Row role="row" className="align-top border-b border-kumo-fill px-1 pb-2 text-base font-medium text-kumo-subtle">{['时间','类型','可用余额变动','可用余额前 → 后','冻结余额前 → 后','客户说明','流水编号','关联业务'].map((v,i)=><Table.Head role="columnheader" className={i>=2&&i<=4?'text-right':''} key={v}>{v}</Table.Head>)}</Table.Row></Table.Header>
       <Table.Body role="rowgroup">{data?.items.map((row,index)=><Table.Row role="row" key={row.id} className={`align-top py-2.5 ${index<data.items.length-1?'border-b border-kumo-hairline':''}`}>
        <Table.Cell role="cell" className="whitespace-nowrap tabular-nums">{displayTime(row.createdAt)}</Table.Cell><Table.Cell role="cell" className="font-medium text-kumo-default">{row.typeLabel}</Table.Cell><Table.Cell role="cell" className="text-right font-medium tabular-nums">{row.amount.startsWith('-')?row.amount:`+${row.amount}`}</Table.Cell><Table.Cell role="cell" className="text-right tabular-nums text-kumo-subtle">{row.balanceBefore} → {row.balanceAfter}</Table.Cell><Table.Cell role="cell" className="text-right tabular-nums text-kumo-subtle">{row.frozenBefore} → {row.frozenAfter}</Table.Cell><Table.Cell role="cell" className="break-words">{row.description}</Table.Cell><Table.Cell role="cell">#{row.id}</Table.Cell><Table.Cell role="cell">{row.href?<Link href={row.href}>查看订单</Link>:row.relatedType==='balance_withdrawal'?`提现 #${row.relatedId}`:'—'}</Table.Cell>
       </Table.Row>)}</Table.Body>
      </Table>
     </div>
    </PageState>
    {data&&<div className="-mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-kumo-fill pt-2"><p className="text-base text-kumo-subtle">共 {data.total} 条记录 · 每页 20 条</p><Pagination page={page} setPage={setPage} perPage={20} totalCount={data.total}/></div>}
    {query.error&&<Button variant="secondary" onClick={()=>void query.refetch()}>重试查询</Button>}
   </LayerCard.Primary>
  </LayerCard>
  <div className="grid gap-1 text-base text-kumo-subtle"><p>金额单位：元 · 时间：北京时间。冻结与释放是可用资金转移。</p>{data&&<><p>本页净变动 {data.pageNet} 元 · 筛选范围增加 {data.increase} 元 / 减少 {data.decrease} 元 / 净变动 {data.net} 元。包含冻结与释放，不代表最终消费统计。</p><p>查询版本 {data.snapshotVersion} · {displayTime(data.asOf)}。刷新后查看最新变动。</p></>}</div>
 </section>;
}
