import { AdvancedToolsPage } from "../../../shared/components/cdnsell/AdvancedToolsPage";
import { useLocation } from "react-router-dom";
import { StatisticsPage } from "../../../shared/components/cdnsell/StatisticsPage";
import { TrafficCalculator } from "./TrafficCalculator";

import { Banner, Button, LayerCard, Table, Tabs } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cdnsellApi, type CdnProduct, type PurchaseResult } from "../../../shared/api/cdnsell";
import { getApiMessage } from "../../../shared/api/request";
import { CdnStatus, formatTraffic } from "../../../shared/components/Cdnsell";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { PaymentDialog } from "../../../shared/components/PaymentDialog";
import { TrendChart } from "../../../shared/components/TrendChart";
import { formatMoney } from "../../../shared/utils/format";

export function CdnOverview(){const query=useQuery({queryKey:["cdnsell","overview"],queryFn:cdnsellApi.overview});return <><PageHeader title="CDN 流量服务" description="查看可用流量、今日消耗和临近到期批次。"/><PageState loading={query.isLoading} error={query.error?getApiMessage(query.error):null}>{query.data?<><MetricGrid metrics={[{label:"剩余流量",value:formatTraffic(query.data.remainingBytes),hint:`${query.data.activeBatches} 个有效批次`},{label:"累计使用",value:formatTraffic(query.data.usedBytes),hint:"按到期时间优先扣减"},{label:"今日用量",value:formatTraffic(query.data.todayBytes),hint:"5 分钟用量统计"},{label:"加速域名",value:String(query.data.activeDomains),hint:query.data.expiringAt?`最近到期 ${new Date(query.data.expiringAt).toLocaleDateString("zh-CN")}`:"暂无到期提醒"}]} /><TrendChart title="流量使用趋势" yAxisName="流量（GB）" valuePrefix="" valueSuffix=" GB" values={query.data.trend.map(v=>[new Date(v.time).getTime(),v.bytes/1024**3])}/></>:null}</PageState></>}

export function CdnPackages() {
  const query=useQuery({queryKey:["cdnsell","products"],queryFn:cdnsellApi.products});
  const [kind,setKind]=useState("traffic");
  const [chosen,setChosen]=useState<Record<string,string>>({});
  const [order,setOrder]=useState<PurchaseResult>();
  const client=useQueryClient();
  const options=(query.data??[]).filter(p=>(p.resourceKind??"traffic")===kind);
  const product=options.find(p=>p.id===chosen[kind])??options[0];
  const buy=useMutation({mutationFn:()=>{if(!product||product.previewOnly||product.resourceKind==="https")throw new Error("此规格暂不支持购买");return cdnsellApi.purchase(product.id,1)},onSuccess:setOrder});
  const label=(p:CdnProduct)=>p.specification??formatTraffic(p.capacityBytes);
  const preview=query.data?.some(p=>p.previewOnly);
  return <><PageHeader title="购买资源包" description="选择 CDN 流量包或 HTTPS 请求包。"/>
    {order?<Banner title={`订单 ${order.orderNo} 已创建`} action={<PaymentDialog businessType="order" businessId={order.orderId} amountCents={Math.round(Number(order.amount)*100)} defaultOpen onPaid={()=>client.invalidateQueries({queryKey:["cdnsell"]})}/>}/>:null}
    <PageState loading={query.isLoading} error={query.error?getApiMessage(query.error):null} empty={!query.isLoading&&!query.data?.length} emptyTitle="暂无可购买资源包">
      <LayerCard><LayerCard.Secondary><Tabs tabs={[{value:"traffic",label:"CDN流量包"},{value:"https",label:"HTTPS请求包"}]} value={kind} onValueChange={v=>{setKind(v);buy.reset()}}/></LayerCard.Secondary>
      <LayerCard.Primary className="grid gap-6 p-5 sm:p-6">
        <h2 className="border-b border-kumo-line pb-3 font-semibold text-kumo-strong">购买配置</h2>
        <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]"><span className="text-sm text-kumo-subtle">适用产品</span><p className="text-sm">适用于 CDN 音视频点播、大文件下载、图片及小文件加速，不包含直播业务。</p></div>
        <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]"><span className="text-sm text-kumo-subtle">适用机房</span><div className="grid justify-items-start gap-2"><Button variant="secondary" aria-pressed>中国大陆</Button><p className="text-sm text-kumo-subtle">适用于中国大陆地区加速</p></div></div>
        <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]"><span className="text-sm text-kumo-subtle">{kind==="traffic"?"流量":"HTTPS请求数"}</span><div className="grid gap-3"><div role="group" aria-label="资源包规格" className="flex flex-wrap gap-2">{options.map(p=><Button key={p.id} variant={product?.id===p.id?"primary":"secondary"} aria-pressed={product?.id===p.id} onClick={()=>{setChosen(v=>({...v,[kind]:p.id}));buy.reset()}}>{label(p)}</Button>)}</div><p className="text-sm text-kumo-subtle">{kind==="traffic"?"按日流量计费模式优先抵扣资源包流量，HTTPS请求需单独购买请求包。":"仅抵扣静态 HTTPS 请求数。"}资源包使用后不支持退订。</p>{!options.length?<p className="text-sm text-kumo-subtle">暂无此类资源包</p>:null}</div></div>
        <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]"><span className="text-sm text-kumo-subtle">有效期</span><div><Button variant="secondary" aria-pressed>{product?.validityMonths?`${product.validityMonths}个月`:product?`${product.validDays}天`:"12个月"}</Button></div></div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-kumo-line pt-5"><div className="grid gap-1"><span className="text-sm text-kumo-subtle">配置费用</span><strong className="text-2xl text-kumo-strong">{product&&product.priceConfirmed!==false?formatMoney(Math.round(Number(product.price)*100)):"价格暂未提供"}</strong></div><Button disabled={!product||product.previewOnly||product.resourceKind==="https"||product.priceConfirmed===false} loading={buy.isPending} onClick={()=>buy.mutate()}>{preview?"本地展示，暂不下单":"创建订单"}</Button></div>
        {buy.error?<Banner variant="error" title="创建订单失败" description={getApiMessage(buy.error)}/>:null}
      </LayerCard.Primary></LayerCard>
    </PageState><TrafficCalculator/></>;
}
export function CdnUsage(){const batches=useQuery({queryKey:["cdnsell","batches"],queryFn:cdnsellApi.batches});const usage=useQuery({queryKey:["cdnsell","usage"],queryFn:cdnsellApi.usage});return <><PageHeader title="用量与流量批次" description="5 分钟粒度账本保留修订记录，流量按最早到期批次优先扣减。"/><h2 className="text-lg font-semibold text-kumo-strong">流量批次</h2><PageState loading={batches.isLoading} error={batches.error?getApiMessage(batches.error):null} empty={!batches.isLoading&&!batches.data?.length}><LayerCard className="shadow-none overflow-x-auto p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>批次</Table.Head><Table.Head>原始流量</Table.Head><Table.Head>已用 / 剩余</Table.Head><Table.Head>有效期</Table.Head><Table.Head>状态</Table.Head></Table.Row></Table.Header><Table.Body>{batches.data?.map(b=><Table.Row key={b.id}><Table.Cell>{b.id}</Table.Cell><Table.Cell>{formatTraffic(b.originalBytes)}</Table.Cell><Table.Cell>{formatTraffic(b.consumedBytes)} / {formatTraffic(b.remainingBytes)}</Table.Cell><Table.Cell>{new Date(b.effectiveTime).toLocaleDateString("zh-CN")} – {new Date(b.expireTime).toLocaleDateString("zh-CN")}</Table.Cell><Table.Cell><CdnStatus value={b.status}/></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard></PageState><h2 className="text-lg font-semibold text-kumo-strong">计量账本</h2><PageState loading={usage.isLoading} error={usage.error?getApiMessage(usage.error):null} empty={!usage.isLoading&&!usage.data?.length}><LayerCard className="shadow-none overflow-x-auto p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>时间窗口</Table.Head><Table.Head>域名 ID</Table.Head><Table.Head>确认流量</Table.Head><Table.Head>修订值</Table.Head><Table.Head>状态</Table.Head></Table.Row></Table.Header><Table.Body>{usage.data?.map(v=><Table.Row key={v.id}><Table.Cell>{new Date(v.windowStart).toLocaleString("zh-CN")}</Table.Cell><Table.Cell>{v.domainId}</Table.Cell><Table.Cell>{formatTraffic(v.confirmedBytes)}</Table.Cell><Table.Cell>{v.revisedBytes?formatTraffic(v.revisedBytes):"—"}</Table.Cell><Table.Cell><CdnStatus value={v.status}/></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard></PageState><CdnOverageBills/></>}

export { CdnCertificates, CdnDomainPage, CdnDomains, CdnIPCheck, CdnLogs, CdnRefresh } from "./p2";

function CdnOverageBills(){
 const client=useQueryClient();const query=useQuery({queryKey:["cdnsell","overage-bills"],queryFn:cdnsellApi.overageBills});const [order,setOrder]=useState<PurchaseResult>();
 const purchase=useMutation({mutationFn:cdnsellApi.purchaseOverage,onSuccess:setOrder});
 return <LayerCard><LayerCard.Secondary>超额流量账单</LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
 <p className="text-sm text-kumo-subtle">按已确认用量生成账单，单价在计量时固定。需核对的账单暂停付款。</p>
 {purchase.error?<Banner variant="error" title={getApiMessage(purchase.error)}/>:null}
 {order?<PaymentDialog businessType="order" businessId={order.orderId} amountCents={Math.round(Number(order.amount)*100)} defaultOpen onPaid={()=>client.invalidateQueries({queryKey:["cdnsell"]})}/>:null}
 <PageState loading={query.isLoading} error={query.error?getApiMessage(query.error):null} empty={!query.isLoading&&!query.data?.length} emptyTitle="暂无超额账单"><div className="overflow-x-auto"><Table><Table.Header><Table.Row><Table.Head>账单 / 域名</Table.Head><Table.Head>用量</Table.Head><Table.Head>金额</Table.Head><Table.Head>状态</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{query.data?.map(b=><Table.Row key={b.id}><Table.Cell>{b.billNo}<p className="text-xs text-kumo-subtle">{b.domainId}</p></Table.Cell><Table.Cell>{formatTraffic(b.trafficBytes)}</Table.Cell><Table.Cell>{formatMoney(Math.round(Number(b.amount)*100))}</Table.Cell><Table.Cell>{({unpaid:"待支付",paid:"已支付",cancelled:"已取消",recalculated:"待核对"} as Record<string,string>)[b.status]??"待核对"}</Table.Cell><Table.Cell><Button variant="secondary" disabled={b.status!=="unpaid"||purchase.isPending} onClick={()=>purchase.mutate(b.id)}>支付账单</Button></Table.Cell></Table.Row>)}</Table.Body></Table></div></PageState>
 </LayerCard.Primary></LayerCard>
}

export function CdnStatistics(){const location=useLocation();const kind=location.pathname.split("/").at(-1);return <StatisticsPage key={kind} initialKind={kind}/>}

export function CdnAdvancedTools(){const location=useLocation();return <AdvancedToolsPage key={location.pathname}/>}
