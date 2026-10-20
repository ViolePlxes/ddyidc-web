import {Banner,Button,LayerCard,Table} from '@cloudflare/kumo';
import {useQuery} from '@tanstack/react-query';
import {useState} from 'react';
import {renewalQuoteAudit} from '../../../shared/api/instanceManagement';
import {getApiMessage} from '../../../shared/api/request';
import {Pagination} from '../../../shared/components/Pagination';
import {PageState} from '../../../shared/components/PageState';
const reasons:Record<string,string>={live_verification_required:'付款前需实时核验',quote_evidence_missing:'缺少报价证据，付款前需核验',snapshot_price_differs:'本地快照金额不同，需实时核验',snapshot_stale_live_verification_required:'本地快照过期，需实时核验',paid_execution_review_required:'已付未完成，请核对执行状态'};
const states:Record<string,string>={unpaid:'待支付',paid:'已支付',queued:'等待执行',invoicing:'核对账单中',paying:'付款中',uncertain:'结果待核对',manual_pending:'待人工处理'};
const cycles:Record<string,string>={monthly:'月付',quarterly:'季付',semiannually:'半年付',annually:'年付',biennially:'两年付',triennially:'三年付'};
const when=(value?:string)=>value?new Date(value).toLocaleString():'—';
export function RenewalQuoteAudit(){
 const [page,setPage]=useState(1);
 const query=useQuery({queryKey:['admin','renewal-quote-audit',page],queryFn:({signal})=>renewalQuoteAudit(page,signal),retry:false});
 return <div className="grid min-w-0 gap-4"><div className="flex items-center justify-between gap-3"><h1 className="text-xl font-semibold">续费报价核查</h1><Button variant="secondary" loading={query.isFetching} onClick={()=>void query.refetch()}>刷新</Button></div>
 <Banner variant="secondary" title="只读核查" description="展示未完成续费订单及已保存的报价证据。本地快照和证据不代表当前可支付价格，付款时仍须实时核验；此页不会改价、扣款或执行续费。"/>
 <PageState loading={query.isLoading} keepContent error={query.error?getApiMessage(query.error):null} empty={!query.isLoading&&!query.error&&!query.data?.items.length} emptyTitle="没有待核查的续费订单"><LayerCard className="min-w-0 overflow-x-auto p-0"><Table><Table.Header><Table.Row>{['订单','供应商 / 周期','原金额 / 应付','报价来源','核验时间 / 失效时间','本地快照','核查提示'].map(label=><Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{query.data?.items.map(row=><Table.Row key={row.orderId}><Table.Cell>{row.orderId}<p className="text-kumo-subtle">{states[row.state]||row.state}</p></Table.Cell><Table.Cell>{row.supplier}<p>{cycles[row.cycle]||row.cycle}</p></Table.Cell><Table.Cell>¥{row.grossAmount}<p>¥{row.payableAmount}</p></Table.Cell><Table.Cell>{row.evidenceSource==='upstream_original'?'服务商完整原价':row.evidenceSource?'已记录报价':'尚无证据'}</Table.Cell><Table.Cell>{when(row.evidenceVerifiedAt)}<p className="text-kumo-subtle">{when(row.evidenceExpiresAt)}</p></Table.Cell><Table.Cell>{row.snapshotAmount?`¥${row.snapshotAmount}`:'—'}<p className="text-kumo-subtle">{when(row.snapshotVerifiedAt)}</p></Table.Cell><Table.Cell>{reasons[row.finding]||row.finding}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard></PageState>
 <Pagination page={page} totalCount={query.data?.total||0} perPage={20} setPage={setPage}/></div>;
}
