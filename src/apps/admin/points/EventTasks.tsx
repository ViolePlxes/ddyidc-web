import {ScopedTable as Table} from '../../../shared/components/ScopedTable';
import { Button, LayerCard} from '@cloudflare/kumo';
import { useQuery } from '@tanstack/react-query';
import { pointsAdminApi } from '../../../shared/api/points';
import { PageState } from '../../../shared/components/PageState';
import { Badge } from '../../../shared/components/Badge';
import { getApiMessage } from '../../../shared/api/request';

export function EventTasks() {
 const query=useQuery({queryKey:['admin','points','event-tasks'],queryFn:pointsAdminApi.eventTasks,refetchInterval:30_000});
 const names:Record<string,string>={order:'消费奖励',first_purchase:'首购奖励',renew:'续费奖励',group_buy:'成团奖励',ticket:'工单奖励',recharge:'充值奖励'};
 return <LayerCard className="min-w-0">
  <LayerCard.Secondary><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">积分处理任务</h2><Button variant="secondary" loading={query.isFetching} onClick={()=>void query.refetch()}>刷新</Button></div></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
  <p className="text-base text-kumo-subtle">显示最近100条任务，每30秒刷新。失败仅重试积分处理，不能重新执行付款或机器操作。</p>
  <PageState loading={query.isLoading} error={query.error?getApiMessage(query.error):null} empty={query.data?.length===0} emptyTitle="暂无积分处理任务">
   <div className="overflow-x-auto"><Table tableId="apps/admin/points/EventTasks.tsx:1"><Table.Header><Table.Row><Table.Head>业务 / 客户</Table.Head><Table.Head>状态</Table.Head><Table.Head>次数</Table.Head><Table.Head>预计处理时间 / 说明</Table.Head></Table.Row></Table.Header><Table.Body>{query.data?.map(row=><Table.Row key={row.key}><Table.Cell>{names[row.event]??row.event}<p className="text-base text-kumo-subtle">客户 {row.userId} · {row.key}</p></Table.Cell><Table.Cell><Badge variant={row.status==='done'?'success':row.status==='retry'?'warning':'secondary'}>{row.status==='done'?'完成':row.status==='retry'?'等待重试':'待处理'}</Badge></Table.Cell><Table.Cell>{row.attempts}</Table.Cell><Table.Cell>{row.status==='done'?'—':row.availableAt}{row.error?<p className="text-base text-kumo-subtle">{row.error}</p>:null}</Table.Cell></Table.Row>)}</Table.Body></Table></div>
  </PageState>
 </LayerCard.Primary></LayerCard>;
}
