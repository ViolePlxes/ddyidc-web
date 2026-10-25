import {Banner,Button,Input,LayerCard,LayerDialog,Link,Select,Table,Text} from '@cloudflare/kumo';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {domainsAdminApi,type AdminDomainAsset} from '../../../shared/api/domains';
import {getApiMessage} from '../../../shared/api/request';
import {PageState} from '../../../shared/components/PageState';
import {adminPath} from '../../../shared/utils/adminEntry';
import {domainStatus} from '../../console/domains/DomainOperationDialog';

const date=(value?:string)=>value?new Date(value).toLocaleString('zh-CN'):'—';
const status=(value:string)=>value==='pending'?'归属待确认':domainStatus[value]??value;

export function DomainManagement(){
 const cache=useQueryClient();
 const [keyword,setKeyword]=useState('');
 const [filter,setFilter]=useState({keyword:'',status:'',expiry:'',page:1,pageSize:20});
 const [selected,setSelected]=useState<AdminDomainAsset>();
 const [detailOpen,setDetailOpen]=useState(false);
 const [confirm,setConfirm]=useState(false);
 const list=useQuery({queryKey:['admin','domains','assets',filter],queryFn:()=>domainsAdminApi.assets(filter)});
 const detail=useQuery({queryKey:['admin','domains','asset',selected?.id],queryFn:()=>domainsAdminApi.asset(selected!.id),enabled:detailOpen&&!!selected});
 const refresh=useMutation({mutationFn:()=>domainsAdminApi.refreshAsset(selected!.id),onSuccess:async()=>{setConfirm(false);await cache.invalidateQueries({queryKey:['admin','domains']})}});
 const summary=list.data?.summary;
 return <>
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{([['域名总数',summary?.total],['正常域名',summary?.active],['归属待确认',summary?.pending],['30天内到期',summary?.expiring],['已到期',summary?.expired],['异常订单',summary?.reviewOrders]] as const).map(([label,value])=><LayerCard key={label} className="grid gap-2 px-5 py-4"><Text variant="secondary">{label}</Text><Text as="h2" variant="heading">{value??'—'}</Text></LayerCard>)}</div>
  <LayerCard className="grid gap-4 px-5 py-4">
   <div className="flex flex-wrap items-center justify-between gap-3"><Text as="h2" variant="heading">客户域名</Text><Button variant="secondary" disabled={list.isFetching} onClick={()=>void list.refetch()}>刷新列表</Button></div>
   <form className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={e=>{e.preventDefault();setFilter(v=>({...v,keyword:keyword.trim(),page:1}))}}>
    <Input label="域名 / 客户账号 / 客户编号" value={keyword} maxLength={253} onChange={e=>setKeyword(e.target.value)}/>
    <Select label="域名状态" value={filter.status} items={{'':'全部状态',active:'正常',pending:'归属待确认'}} onValueChange={v=>setFilter(f=>({...f,status:v??'',page:1}))}/>
    <Select label="到期情况" value={filter.expiry} items={{'':'全部时间',expiring:'30天内到期',expired:'已到期'}} onValueChange={v=>setFilter(f=>({...f,expiry:v??'',page:1}))}/>
    <Button type="submit" variant="secondary">查询</Button>
   </form>
   <Text variant="secondary">统计覆盖全部客户。到期时间仅供核对，不代表已被注册商删除；归属待确认的域名不能执行管理操作。</Text>
   <PageState loading={list.isLoading} error={list.error?getApiMessage(list.error):undefined} empty={list.isSuccess&&!list.data.items.length} emptyTitle="暂无符合条件的域名">
    <div className="overflow-x-auto"><Table><Table.Header><Table.Row>{['域名','所属客户','状态','到期时间','更新时间','操作'].map(v=><Table.Head key={v}>{v}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{list.data?.items.map(asset=><Table.Row key={asset.id}>
     <Table.Cell><span className="break-all">{asset.domain}</span></Table.Cell><Table.Cell><Link href={adminPath(`/admin/customers/${asset.customerId}`)}>{asset.customerName}</Link><div><Text variant="secondary">{asset.customerId}</Text></div></Table.Cell>
     <Table.Cell>{status(asset.status)}</Table.Cell><Table.Cell>{date(asset.expiresAt)}</Table.Cell><Table.Cell>{date(asset.updatedAt)}</Table.Cell><Table.Cell><Button variant="secondary" onClick={()=>{setSelected(asset);setDetailOpen(true);setConfirm(false);refresh.reset()}}>查看详情</Button></Table.Cell>
    </Table.Row>)}</Table.Body></Table></div>
   </PageState>
   {list.data?<div className="flex flex-wrap items-center justify-between gap-3"><Text variant="secondary">共 {list.data.total} 个域名，第 {filter.page} 页</Text><div className="flex gap-2"><Button variant="secondary" disabled={filter.page<=1||list.isFetching} onClick={()=>setFilter(f=>({...f,page:f.page-1}))}>上一页</Button><Button variant="secondary" disabled={filter.page*filter.pageSize>=list.data.total||list.isFetching} onClick={()=>setFilter(f=>({...f,page:f.page+1}))}>下一页</Button></div></div>:null}
  </LayerCard>
  <LayerDialog.Root open={detailOpen} dismissDisabled={refresh.isPending} onOpenChange={open=>{if(!refresh.isPending)setDetailOpen(open)}}><LayerDialog.Content>
   <LayerDialog.Title>域名详情</LayerDialog.Title><LayerDialog.Description>{selected?.domain} · {selected?.customerName}（{selected?.customerId}）</LayerDialog.Description>
   <LayerDialog.Body><div className="grid max-h-[60vh] gap-4 overflow-y-auto text-sm"><PageState loading={detail.isLoading} error={detail.error?getApiMessage(detail.error):undefined}>
    {detail.data?<><Text>状态：{status(detail.data.asset.status)} · 到期：{date(detail.data.asset.expiresAt)}</Text><Text as="h2" variant="heading">关联订单</Text><Text variant="secondary">最近50笔，同一客户与域名；支付情况请进入平台订单核对。</Text>{detail.data.orders.length?<div className="overflow-x-auto"><Table><Table.Header><Table.Row>{['订单','金额（元）','处理状态','创建时间'].map(v=><Table.Head key={v}>{v}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{detail.data.orders.map(order=><Table.Row key={order.id}><Table.Cell><Link href={adminPath(`/admin/orders/${order.id}`)}>{order.id}</Link></Table.Cell><Table.Cell>{order.amount}</Table.Cell><Table.Cell>{domainStatus[order.status]??order.status}</Table.Cell><Table.Cell>{date(order.createdAt)}</Table.Cell></Table.Row>)}</Table.Body></Table></div>:<Text variant="secondary">暂无关联订单</Text>}<Text as="h2" variant="heading">操作记录</Text>{detail.data.operations.length?<div className="overflow-x-auto"><Table><Table.Header><Table.Row>{['操作编号','接口','状态','结果代码','时间'].map(v=><Table.Head key={v}>{v}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{detail.data.operations.map(op=><Table.Row key={op.id}><Table.Cell>{op.id}</Table.Cell><Table.Cell>{op.action}</Table.Cell><Table.Cell>{domainStatus[op.status]??op.status}</Table.Cell><Table.Cell>{op.errorCode||'—'}</Table.Cell><Table.Cell>{date(op.createdAt)}</Table.Cell></Table.Row>)}</Table.Body></Table></div>:<Text variant="secondary">暂无操作记录</Text>}</>:null}
   </PageState>
   {refresh.error?<Banner variant="error" title={getApiMessage(refresh.error)}/>:null}{refresh.isSuccess?<Banner title="域名信息已核对"/>:null}
   {confirm?<Banner title="确认核对注册商信息？" description="仅更新已确认归属域名的到期时间并记录审计，不会续费或重试订单。"/>:null}
   {confirm?<Button variant="secondary" className="justify-self-start" disabled={refresh.isPending} onClick={()=>setConfirm(false)}>取消核对</Button>:null}
   </div></LayerDialog.Body><LayerDialog.Actions dismissLabel="关闭"><LayerDialog.Action loading={refresh.isPending} disabled={refresh.isPending||!detail.data||detail.data.asset.status!=='active'} onClick={()=>{if(confirm)refresh.mutate();else{refresh.reset();setConfirm(true)}}}>{confirm?'确认核对':'核对注册商信息'}</LayerDialog.Action></LayerDialog.Actions>
  </LayerDialog.Content></LayerDialog.Root>
 </>;
}
