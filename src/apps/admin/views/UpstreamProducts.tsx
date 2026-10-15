import { useEffect, useMemo, useState } from "react";
import { Banner, Button, LayerCard, Select, Switch, Table } from "@cloudflare/kumo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { upstreamProductsApi } from "../../../shared/api/upstreamProducts";
import { adminProductsApi } from "../../../shared/api/adminProducts";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { UpstreamCatalogComparison, type ComparisonProduct } from "./UpstreamCatalogComparison";

export function UpstreamProducts() {
 const qc=useQueryClient();const [supplierId,setSupplierId]=useState("");const [notice,setNotice]=useState("");const [guardBusy,setGuardBusy]=useState(false);const [showMetrics,setShowMetrics]=useState(false);
 const suppliers=useQuery({queryKey:["admin","upstream-suppliers"],queryFn:upstreamProductsApi.suppliers});
 useEffect(()=>{if(!supplierId&&suppliers.data?.length)setSupplierId(suppliers.data.find(x=>x.status===1)?.id??suppliers.data[0]!.id)},[supplierId,suppliers.data]);
 const catalog=useQuery({queryKey:["admin","upstream-comparison-catalog",supplierId],queryFn:()=>upstreamProductsApi.comparisonCatalog(supplierId),enabled:Boolean(supplierId),staleTime:60_000,retry:false,refetchOnWindowFocus:false});
 const mappings=useQuery({queryKey:["admin","upstream-all-mappings"],queryFn:()=>upstreamProductsApi.allMappings(""),refetchOnWindowFocus:false});
 const local=useQuery({queryKey:["admin","products","comparison"],queryFn:()=>adminProductsApi.list(),refetchOnWindowFocus:false});
 const groups=useQuery({queryKey:["admin","upstream-local-groups"],queryFn:upstreamProductsApi.groups});
 const traffic=useQuery({queryKey:["admin","upstream-request-metrics"],queryFn:upstreamProductsApi.metrics,enabled:showMetrics,refetchInterval:showMetrics?5000:false});
 const guard=useQuery({queryKey:["admin","upstream-loss-guard"],queryFn:upstreamProductsApi.lossGuard});
 const matching=(mappings.data??[]).filter(x=>x.supplierId===supplierId);
 const upstreamRows:ComparisonProduct[]=(catalog.data?.items??[]).map(p=>{const m=matching.find(x=>x.upstreamProductId===p.upstreamProductId&&x.mode==="sync"&&x.productId!=="0"&&x.productId);return {id:p.upstreamProductId,name:p.name,groupId:p.groupId,price:m?.cost??null,mapped:Boolean(m),counterpartName:m?local.data?.items.find(x=>x.id===m.productId)?.name:undefined}});
 const localRows=useMemo<ComparisonProduct[]>(()=> (local.data?.items??[]).map(p=>{const links=(mappings.data??[]).filter(x=>x.productId===p.id);const m=links.length===1?links[0]:undefined;return {id:p.id,localId:p.id,groupId:p.groupId,name:p.name,price:p.price,mapped:Boolean(m),supplierId:m?.supplierId,upstreamId:m?.upstreamProductId,counterpartName:m?.name,deletable:m?.deletable??false,hidden:p.hidden}}),[local.data,mappings.data]);
 const unknown=upstreamRows.filter(p=>!(catalog.data?.categories??[]).some(c=>c.id===p.groupId)).length;
 const refresh=async()=>{const results=await Promise.all([mappings.refetch(),local.refetch(),groups.refetch()]);if(results.some(x=>x.isError))setNotice("操作已完成，但部分列表刷新失败，请手动刷新后核对。");await qc.invalidateQueries({queryKey:["products"]})};
 const findLink=async(p:ComparisonProduct)=>{const all=await upstreamProductsApi.allMappings("");const links=all.filter(x=>x.productId===p.localId&&x.supplierId===p.supplierId&&x.upstreamProductId===p.upstreamId);if(links.length!==1)throw new Error("商品关联已变化，请刷新后核对");return links[0]!};
 const connect=async(p:ComparisonProduct,groupId:string)=>{
  setNotice("");const latest=await upstreamProductsApi.allMappings(supplierId);if(latest.some(x=>x.upstreamProductId===p.id&&x.mode==="sync"&&x.productId&&x.productId!=="0")){await refresh();throw new Error("该商品已对接，请勿重复操作")}
  const source=catalog.data?.items.find(x=>x.upstreamProductId===p.id);if(!source)throw new Error("上游目录已变化，请刷新后重试");
  await upstreamProductsApi.create({supplierId,upstreamProductId:Number(p.id),name:source.name,description:source.description,productGroupId:groupId,profitType:2,profitValue:0,renewProfitType:2,renewProfitValue:0,upgradeProfitType:2,upgradeProfitValue:0,priceBasis:"upstream",mode:"sync",autoSetup:true});await refresh();
 };
 const disconnect=async(p:ComparisonProduct)=>{setNotice("");const m=await findLink(p);if(!m.deletable){await refresh();throw new Error("该商品存在订单或机器关联，禁止删除，请改为隐藏")};try{await upstreamProductsApi.remove([m.id])}catch(e){await refresh();throw e};await refresh()};
 const sync=async(p:ComparisonProduct)=>{setNotice("");const m=await findLink(p);const result=await upstreamProductsApi.sync(m.id);await refresh();setNotice(`同步完成：价格变更 ${result.summary.price}，库存变更 ${result.summary.stock}，规格变更 ${result.summary.specification}。`)};
 const hide=async(p:ComparisonProduct)=>{setNotice("");const m=await findLink(p);await upstreamProductsApi.hidden(m.id,true);await refresh()};
 const fatal=[suppliers,catalog,mappings,local,groups].find(q=>q.error&&!q.data)?.error;
 return <>
  <PageHeader title="供应商映射" description="左侧查看上游完整商品目录，右侧对比全部本地商品。拖入右侧二级分类可直接对接。" actions={<Button variant="secondary" loading={catalog.isFetching||mappings.isFetching||local.isFetching} onClick={()=>{void Promise.all([catalog.refetch(),refresh()])}}>刷新目录</Button>}/>
  <LayerCard className="mb-4 flex flex-wrap items-end justify-between gap-4 px-4 py-3"><Select label="供应商" value={supplierId} onValueChange={v=>{setSupplierId(v??"");setNotice("")}} items={Object.fromEntries((suppliers.data??[]).map(x=>[x.id,`${x.name}（${x.type}）`]))}/><Switch label="亏本交易拦截" checked={guard.data?.enabled??false} disabled={guardBusy||!guard.data} onCheckedChange={v=>{setGuardBusy(true);void upstreamProductsApi.setLossGuard(v).then(()=>guard.refetch()).catch(e=>setNotice(getApiMessage(e))).finally(()=>setGuardBusy(false))}}/></LayerCard>
  {notice&&<div className="mb-4"><Banner title="操作提示" description={notice}/></div>}
  {(catalog.data?.warning||unknown>0)&&<div className="mb-4"><Banner variant="alert" title="部分上游分类信息未返回" description={catalog.data?.warning||`${unknown} 个商品未返回可识别分类层级，仍完整保留在未分组中。`}/></div>}
  <PageState loading={suppliers.isLoading||catalog.isLoading||mappings.isLoading||local.isLoading||groups.isLoading} error={fatal?getApiMessage(fatal):null} empty={!suppliers.isLoading&&!suppliers.data?.length} emptyTitle="请先添加供应商">
   {supplierId&&<UpstreamCatalogComparison key={supplierId} upstreamCategories={catalog.data?.categories??[]} upstreamProducts={upstreamRows} localCategories={groups.data??[]} localProducts={localRows} onConnect={connect} onDisconnect={disconnect} onHide={hide} onSync={sync}/>}
  </PageState>
  <div className="mt-4"><Button variant="secondary" onClick={()=>setShowMetrics(v=>!v)}>{showMetrics?"收起访问统计":"访问统计"}</Button></div>
  {showMetrics&&<LayerCard className="mt-3 overflow-auto px-4 py-3"><h2 className="mb-3 font-semibold">上游访问频率</h2>{traffic.error&&<Banner variant="error" title="统计读取失败" description={getApiMessage(traffic.error)}/>}<Table><Table.Header><Table.Row><Table.Head>供应商</Table.Head><Table.Head>最近1分钟</Table.Head><Table.Head>最近5分钟</Table.Head><Table.Head>最近15分钟</Table.Head><Table.Head>平均间隔（秒）</Table.Head></Table.Row></Table.Header><Table.Body>{(traffic.data?.items??[]).map(x=><Table.Row key={x.supplierId}><Table.Cell>{x.name}</Table.Cell><Table.Cell>{x.oneMinute}</Table.Cell><Table.Cell>{x.fiveMinutes}</Table.Cell><Table.Cell>{x.fifteenMinutes}</Table.Cell><Table.Cell>{x.averageInterval?.toFixed(2)??"—"}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>}

 </>;
}
