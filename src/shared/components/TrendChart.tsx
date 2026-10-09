import { lazy, Suspense, type ComponentProps } from "react";
import { LayerCard, Loader } from "@cloudflare/kumo";

const MiniTrendRenderer = lazy(() => import("./TrendChartRenderer").then((module) => ({ default: module.MiniTrend })));
const TrendChartRenderer = lazy(() => import("./TrendChartRenderer").then((module) => ({ default: module.TrendChart })));

type MiniTrendProps = ComponentProps<typeof import("./TrendChartRenderer").MiniTrend>;
type TrendChartProps = ComponentProps<typeof import("./TrendChartRenderer").TrendChart>;

export function MiniTrend(props: MiniTrendProps) {
  return <Suspense fallback={<div className="flex h-[140px] items-center justify-center" aria-label={`${props.title}加载中`}><Loader /></div>}><MiniTrendRenderer {...props} /></Suspense>;
}

export function TrendChart(props: TrendChartProps) {
  return <Suspense fallback={<section className="grid gap-3"><h2 className="text-lg font-semibold text-kumo-strong">{props.title ?? "消费趋势"}</h2><LayerCard className="flex min-h-[320px] items-center justify-center p-5" aria-label="图表加载中"><Loader /></LayerCard></section>}><TrendChartRenderer {...props} /></Suspense>;
}
