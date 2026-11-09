import {useContext,type ReactNode} from 'react';
import {TableScopeContext} from '../tableScope';
import {Button,ChartPalette,LayerCard,SankeyChart,type SankeyNodeData,type SankeyLinkData} from '@cloudflare/kumo';
import * as echarts from 'echarts/core';
import {SankeyChart as SankeySeries} from 'echarts/charts';
import {TooltipComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
import {useTheme} from '../../hooks/useTheme';
import {ConfigurableTable} from '../ConfigurableTable';
echarts.use([SankeySeries,TooltipComponent,CanvasRenderer]);
export interface ClientRankingRow {client:string;count:number}
export interface StatusRankingRow {status:string;count:number}
/** Data-agnostic presentation. Demo fixtures are supplied only by the local preview entry. */
export function VisitTrafficPanel({nodes,links,clientRanking,statusRanking,stages,mode,onModeChange,onNodeClick,onReset,filtered=false,total,simulated=false,geography}:{nodes:SankeyNodeData[];links:SankeyLinkData[];clientRanking:ClientRankingRow[];statusRanking:StatusRankingRow[];stages:string[];mode:string;onModeChange:(mode:string)=>void;onNodeClick:(node:SankeyNodeData)=>void;onReset:()=>void;filtered?:boolean;total:number;simulated?:boolean;geography?:ReactNode}){
  const scope=useContext(TableScopeContext)??'anonymous';
  const {theme}=useTheme();const dark=theme==='dark';
  return <section className="grid min-w-0 gap-3" aria-label="网站访问面板">
   <LayerCard className="min-w-0 overflow-hidden p-0"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-kumo-line px-4 py-3"><h2 className="text-sm font-semibold">访问流向{simulated?' · 模拟数据':''}</h2><div className="flex flex-wrap gap-1">{[['requests','访问'],['clients','客户端'],['bots','爬虫']].map(([id,label])=><Button key={id} size="xs" variant={mode===id?'secondary':'ghost'} onClick={()=>onModeChange(id!)}>{label}</Button>)}</div></div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-kumo-line px-4 py-2 text-sm"><span className="text-kumo-subtle">请求数 <strong className="font-medium text-kumo-default">{(nodes.length?total.toLocaleString('zh-CN'):'—')}</strong>{nodes.length?' · 点击节点筛选':''}</span>{filtered&&<Button size="xs" variant="secondary" onClick={onReset}>清除访问筛选</Button>}<span className="text-kumo-subtle">{simulated?'未连接真实日志':nodes.length?'同一请求集合':'暂无访问数据'}</span></div>
    <div className="min-w-0"><div className="min-w-0 overflow-x-auto"><div className="min-w-[640px] px-4 pt-3"><div className="flex justify-between pr-28 text-sm text-kumo-subtle">{stages.map(stage=><span key={stage}>{stage}</span>)}</div><div data-testid="home-traffic-sankey">{nodes.length?<SankeyChart echarts={echarts} nodes={nodes.map((node,index)=>({...node,color:ChartPalette.categorical(index%6,dark)}))} links={links} height={350} left={6} right={130} nodeWidth={10} nodePadding={16} nodeLabelLayout="inline" linkColor="gradient" linkOpacity={.18} isDarkMode={dark} onNodeClick={onNodeClick}/>:<div className="flex h-[350px] items-center justify-center text-sm text-kumo-subtle">暂无访问数据</div>}</div></div></div>
    </div></LayerCard>


  <div className="grid min-w-0 items-stretch gap-3 2xl:grid-cols-[minmax(0,1fr)_712px]">{geography}<div className="grid min-w-0 items-stretch gap-3 md:grid-cols-[minmax(0,4fr)_minmax(0,3fr)]">
  <div className="min-w-0"><ConfigurableTable fillHeight fieldButtonAfterLabel columns={[{key:'client',label:'客户端',width:230,min:160,required:true},{key:'count',label:'请求数',width:100,min:80,type:'N'},{key:'share',label:'占比',width:70,min:60,type:'N'}]} rows={clientRanking} label="首页客户端排行" rowKey={row=>row.client} storageKey={`ddoidc-home-client-ranking:v5:${scope}`} renderCell={(row,key)=>key==='count'?row.count.toLocaleString('zh-CN'):key==='share'?`${total?(row.count/total*100).toFixed(1):0}%`:row[key as keyof typeof row]}/></div><div className="min-w-0"><ConfigurableTable fillHeight fieldButtonAfterLabel columns={[{key:'status',label:'状态码',width:132,min:120,required:true},{key:'count',label:'请求数',width:94,min:80,type:'N'},{key:'share',label:'占比',width:74,min:60,type:'N'}]} rows={statusRanking} label="首页状态码排行" rowKey={row=>row.status} storageKey={`ddoidc-home-status-ranking:v1:${scope}`} renderCell={(row,key)=>key==='status'?<span className="font-mono">{row.status}</span>:key==='count'?row.count.toLocaleString('zh-CN'):`${total?(row.count/total*100).toFixed(1):0}%`}/></div></div></div>
  </section>;
}
