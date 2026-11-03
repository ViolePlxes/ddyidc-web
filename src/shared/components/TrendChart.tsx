import { useEffect, useId, useMemo, useState } from "react";
import { Slider } from "../vendor/kumo-slider/Slider";
import { ChartPalette, LayerCard, TimeseriesChart } from "@cloudflare/kumo";
import { useTheme } from "../hooks/useTheme";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import {
  BrushComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
} from "echarts/components";

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  LegendComponent,
  BrushComponent,
  ToolboxComponent,
  TooltipComponent,
]);

/** Decorative placeholder only: the wave never represents measured data. */
export function NoDataWave({height=140}:{height?:number}) {
 const gradient=useId().replace(/:/g, "");
 const points=Array.from({length:61},(_,i)=>{const x=i*400/60;const y=40+8*Math.sin(i*0.24)+5*Math.cos(i*0.61)+3*Math.sin(i*0.89);return `${i?"L":"M"}${x.toFixed(2)},${y.toFixed(2)}`}).join(" ");
 return <div role="img" aria-label="暂无趋势数据" className="relative -mx-4 h-full min-h-20 overflow-hidden" style={{minHeight:height}}>
  <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 400 110" preserveAspectRatio="none" className="absolute inset-0 block h-full w-full">
   <defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-kumo-line)" stopOpacity="0.15"/><stop offset="100%" stopColor="var(--color-kumo-line)" stopOpacity="0"/></linearGradient></defs>
   <path d={`${points} L400,110 L0,110 Z`} fill={`url(#${gradient})`}/>
   <path d={points} fill="none" stroke="var(--color-kumo-line)" strokeOpacity="0.6" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
  </svg>
  <span className="pointer-events-none absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-kumo-base px-2 py-1 text-xs font-medium text-kumo-subtle ring ring-kumo-line">无数据</span>
 </div>;
}

export function MiniTrend({ title, values, money = false, valueFormat, height = 140 }: { height?: number; title: string; values: [number, number][]; money?: boolean; valueFormat?: (value: number) => string }) {
  const { theme } = useTheme();
  if(values.length===0) return <NoDataWave height={height}/>;
  return <TimeseriesChart echarts={echarts} height={height} isDarkMode={theme === "dark"}
    ariaDescription={title} xAxisTickCount={3} yAxisTickCount={2}
    tooltipValueFormat={(value) => valueFormat ? valueFormat(value) : money ? `${value.toFixed(2)} 元` : `${value} 个`}
    data={[{ name: title, color: ChartPalette.categorical(0), data: values }]} />;
}

export function TrendChart({
  title = "消费趋势",
  type = "line",
  values,
  yAxisName = "金额（元）",
  valuePrefix = "¥",
  valueSuffix = "",
  series,
  zoomable = false,
  height = 280,
  compact = false,
}: {
  title?: string;
  type?: "line" | "bar";
  values: [number, number][];
  yAxisName?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  series?: { name: string; data: [number, number][] }[];
  zoomable?: boolean;
  height?: number;
  compact?: boolean;
}) {
  const { theme } = useTheme();
  const times = useMemo(()=>[...new Set((series ? series.flatMap(item=>item.data) : values).map(point=>point[0]).filter(Number.isFinite))].sort((a,b)=>a-b),[series,values]);
  const timeKey=times.join(",");
  const [window,setWindow]=useState<readonly number[]>([0,Number.MAX_SAFE_INTEGER]);
  useEffect(()=>setWindow([0,Math.max(1,times.length-1)]),[timeKey]);
  const last=Math.max(1,times.length-1);
  const startIndex=Math.min(Math.max(0,window[0]??0),last-1),endIndex=Math.min(Math.max(startIndex+1,window[1]??last),last);
  const lower=times[startIndex]??0,upper=times[endIndex]??lower;
  const within=(point:[number,number])=>!zoomable||(point[0]>=lower&&point[0]<=upper);
  const chartValues = values.filter(within);
  const visibleSeries=series?.map(item=>({...item,data:item.data.filter(within)}));
  const clock=(index:number,full=false)=>{const timestamp=times[Math.round(index)];return timestamp===undefined?"—":new Date(timestamp).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai",hour12:false,...(full?{month:"2-digit",day:"2-digit"}:{}),hour:"2-digit",minute:"2-digit"})};
  return (
    <section className={compact?"grid min-w-0 overflow-hidden rounded-lg ring ring-kumo-line":"grid gap-3"}>
      {compact?<h2 className="border-b border-kumo-line bg-kumo-base px-4 py-3 text-sm font-semibold text-kumo-strong">{title}</h2>:
      <h2 className="text-lg font-semibold text-kumo-strong">{title}</h2>
      }
      <LayerCard className={compact?"rounded-none px-4 py-3 ring-0":" px-5 py-4"}>
        <TimeseriesChart
          echarts={echarts}
          type={type}
          height={height}
          isDarkMode={theme === "dark"}
          ariaDescription={title}
          yAxisName={yAxisName}
          tooltipValueFormat={(value) => `${valuePrefix}${value.toFixed(2)}${valueSuffix}`}
          data={visibleSeries ? visibleSeries.map((item, index) => ({ ...item, color: ChartPalette.categorical(index) })) : [
            {
              name: title,
              color: ChartPalette.categorical(0),
              data: chartValues,
            },
          ]}
        />
        {zoomable&&times.length>1?<div className="mt-5 grid min-w-0 gap-3">
          <Slider size="sm" min={0} max={last} step={1} value={[startIndex,endIndex]} getAriaLabel={index=>index===0?"图表起始时间":"图表结束时间"} formatValue={index=>clock(index)} onValueChange={next=>{if(!Array.isArray(next)||next.length!==2)return;let start=Math.max(0,Math.min(last-1,Math.round(next[0]??0)));const end=Math.max(start+1,Math.min(last,Math.round(next[1]??last)));start=Math.min(start,end-1);setWindow([start,end])}} className="w-full min-w-0"/>
          <p className="text-base text-kumo-subtle" aria-live="polite">显示：{clock(startIndex,true)} – {clock(endIndex,true)} · {endIndex-startIndex+1}/{times.length} 个时间点</p>
        </div>:null}
      </LayerCard>
    </section>
  );
}
