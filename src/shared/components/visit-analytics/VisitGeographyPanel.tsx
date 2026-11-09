import {useMemo,useRef} from 'react';
import {Button,ChoroplethMap,LayerCard,type MapGeoJson} from '@cloudflare/kumo';
import * as echarts from 'echarts/core';
import {MapChart} from 'echarts/charts';
import {TooltipComponent,VisualMapComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
import {useTheme} from '../../hooks/useTheme';
echarts.use([MapChart,TooltipComponent,VisualMapComponent,CanvasRenderer]);
export interface VisitRegion {country:string;label:string;count:number}
const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function VisitGeographyPanel({geoJson,regions,selected,onSelect,onReset,simulated=false}:{geoJson:MapGeoJson;regions:VisitRegion[];selected?:string|null;onSelect:(region:VisitRegion)=>void;onReset:()=>void;simulated?:boolean}){
 const {theme}=useTheme();const sum=regions.reduce((value,row)=>value+row.count,0);
 const selectRef=useRef(onSelect);selectRef.current=onSelect;
 // Kumo 2.15 map view omission on setOption can leave ECharts with a singular transform.
 // Keep unchanged geographic snapshots mounted; rebuild only when data/theme actually changes.
 const signature=JSON.stringify(regions);
 const stableRegions=useMemo<VisitRegion[]>(()=>JSON.parse(signature),[signature]);
 const map=useMemo(()=><ChoroplethMap key={`${theme}:${signature}`} echarts={echarts} geoJson={geoJson} mapName="ddoidc-world-110m-v1" data={stableRegions} name="country" value="count" isDarkMode={theme==='dark'} onRegionClick={region=>selectRef.current(region)} tooltipFormatter={row=>`${escape(row.label)}<br/>${row.count.toLocaleString('zh-CN')} 次${simulated?'模拟':''}请求`}/>,[theme,geoJson,signature,stableRegions,simulated]);
 return <LayerCard className="min-w-0 overflow-hidden p-0"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-kumo-line px-4 py-3"><h2 className="text-sm font-semibold">访问地域分布{simulated?' · 模拟数据':''}</h2><span className="text-sm text-kumo-subtle">世界 · Choropleth Map</span></div><div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span>请求数 <strong className="font-medium">{regions.length?sum.toLocaleString('zh-CN'):'—'}</strong><span className="ml-3 text-kumo-subtle">{regions.length?`${regions.length} 个国家／地区`:'暂无访问数据'}</span></span>{selected&&<span className="text-kumo-subtle">已选：{regions.find(row=>row.country===selected)?.label}</span>}{selected&&<Button size="xs" variant="secondary" onClick={onReset}>清除地域筛选</Button>}</div><div data-testid="home-choropleth" className="px-4 pb-3" role="img" aria-label={simulated?'按模拟请求量着色的世界访问地图':'世界访问地图'}><div className="mx-auto w-full max-w-md">{map}</div></div></LayerCard>;
}
