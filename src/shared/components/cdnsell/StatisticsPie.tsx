import { ChartPalette, LayerCard } from "@cloudflare/kumo";
import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { PieChart } from "echarts/charts";
import { LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useTheme } from "../../hooks/useTheme";
echarts.use([PieChart,LegendComponent,TooltipComponent,CanvasRenderer]);
export function StatisticsPie({title,values}:{title:string;values:{name:string;value:number}[]}){
 const target=useRef<HTMLDivElement>(null);const {theme}=useTheme();
 useEffect(()=>{if(!target.current||!values.length)return;const chart=echarts.init(target.current,theme==="dark"?"dark":undefined);chart.setOption({backgroundColor:"transparent",color:values.map((_,i)=>ChartPalette.categorical(i)),tooltip:{trigger:"item"},legend:{type:"scroll",bottom:0},series:[{type:"pie",radius:["35%","65%"],data:values,label:{show:false}}]});const resize=new ResizeObserver(()=>chart.resize());resize.observe(target.current);return()=>{resize.disconnect();chart.dispose()}},[theme,values]);
 return <LayerCard><LayerCard.Secondary>{title}</LayerCard.Secondary><LayerCard.Primary>{values.some(v=>v.value>0)?<div ref={target} className="h-72 min-w-0" role="img" aria-label={title+"："+values.map(v=>v.name+" "+v.value).join("，")}/>:<p className="py-5 text-base text-kumo-subtle">暂无可计算的占比数据</p>}</LayerCard.Primary></LayerCard>;
}
