import { useQuery } from "@tanstack/react-query";
import { Banner, Chart, ChartPalette, LayerCard, Tooltip, type KumoChartOption } from "@cloudflare/kumo";
import * as echarts from "echarts/core";
import { BarChart, PieChart } from "echarts/charts";
import { GridComponent, AriaComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { fetchServerMonitor } from "../../../shared/api/serverMonitor";
import { useTheme } from "../../../shared/hooks/useTheme";
import { getApiMessage } from "../../../shared/api/request";
import type { ReactNode } from "react";

echarts.use([BarChart, PieChart, GridComponent, AriaComponent, TooltipComponent, CanvasRenderer]);
const pct = (value: number) => `${value.toFixed(1)}%`;
function capacity(used: number, total: number) { const unit = total >= 1024 ** 4 ? 4 : 3; return `${(used / 1024 ** unit).toFixed(1)} / ${(total / 1024 ** unit).toFixed(1)} ${unit === 4 ? "TiB" : "GiB"}`; }
function bytes(value: number) { return `${(value / 1024 ** 3).toFixed(value < 1024 ** 3 ? 2 : 1)} GiB`; }

function MonitorCard({ title, value, hint, details, options, dark }: { title: string; value: string; hint: string; details: ReactNode; options: KumoChartOption | null; dark: boolean }) {
  return <Tooltip content={<div className="grid max-h-80 max-w-sm gap-2 overflow-auto text-base">{details}</div>} render={<LayerCard tabIndex={0} aria-label={`${title}：${value}，悬浮或聚焦查看详情`} className="grid min-w-0 gap-2 px-4 py-3">
    <span className="text-base text-kumo-subtle">{title}</span>
    <strong className="text-base font-semibold text-kumo-strong">{value}</strong>
    {options ? <Chart echarts={echarts} options={options} height={128} isDarkMode={dark} /> : <div className="flex h-32 items-center justify-center text-base text-kumo-subtle">暂无采样数据</div>}
    <span className="text-base text-kumo-subtle">{hint}</span>
  </LayerCard>} />;
}

export function ServerMonitor() {
  const { theme } = useTheme(); const dark = theme === "dark";
  const query = useQuery({ queryKey: ["admin", "server-monitor"], queryFn: ({ signal }) => fetchServerMonitor(signal), refetchInterval: 10_000, refetchIntervalInBackground: false, staleTime: 8_000, retry: 1 });
  const data = query.data;
  const color = ChartPalette.categorical(0, dark);
  const remaining = ChartPalette.sequential("blues", dark)[0];
  const ring = (value: number, index: number): KumoChartOption => ({ animationDurationUpdate: 300, aria: { enabled: true }, series: [{ type: "pie", radius: ["65%", "85%"], center: ["50%", "50%"], label: { show: false }, emphasis: { disabled: true }, data: [{ name: "已使用", value, itemStyle: { color: ChartPalette.categorical(index, dark) } }, { name: "未使用", value: Math.max(0, 100 - value), itemStyle: { color: remaining } }] }] });
  const cores: KumoChartOption | null = data?.cpu ? { animationDurationUpdate: 300, aria: { enabled: true }, grid: { top: 8, left: 0, right: 0, bottom: 24 }, xAxis: { type: "category", data: data.cpu.cores.map(core => core.name), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: ChartPalette.text("primary", dark), interval: "auto" } }, yAxis: { type: "value", max: 100, show: false }, series: [{ type: "bar", data: data.cpu.cores.map(core => core.usedPercent), itemStyle: { color }, showBackground: true, backgroundStyle: { color: remaining }, barMaxWidth: 24 }] } : null;
  const coreDetails = <><strong className="font-medium">各逻辑核心使用率</strong><div className="grid grid-cols-2 gap-x-4 gap-y-1">{data?.cpu?.cores.map(core => <span key={core.name}>{core.name}：{pct(core.usedPercent)}</span>)}</div></>;
  return <section className="grid gap-3" aria-label="服务器状态监控">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold text-kumo-strong">服务器状态</h2><span className="text-base text-kumo-subtle" role="status">{query.isLoading ? "正在读取服务器…" : data ? `每 10 秒刷新 · 采样于 ${new Date(data.sampledAt).toLocaleTimeString("zh-CN")}` : "等待采样"}</span></div>
    {query.error ? <Banner variant="error" title="监控刷新失败" description={`${getApiMessage(query.error)}${data ? "；当前显示上次成功采样，请注意采样时间。" : ""}`} /> : null}
    {data?.warnings.length ? <Banner variant="alert" title="部分指标不可用" description={data.warnings.join("；")} /> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MonitorCard title="CPU 总占用率" value={data?.cpu ? pct(data.cpu.usedPercent) : "不可用"} hint="所有逻辑核心综合使用率" dark={dark} options={data?.cpu ? ring(data.cpu.usedPercent, 0) : null} details={<><strong className="font-medium">CPU 总占用率：{data?.cpu ? pct(data.cpu.usedPercent) : "不可用"}</strong><span>采样区间：{data?.cpu?.sampleSeconds.toFixed(1) ?? "—"} 秒</span><span>负载（1 / 5 / 15 分钟）：{data?.cpu?.load.map(value => value.toFixed(2)).join(" / ") || "不可用"}</span>{coreDetails}</>} />
      <MonitorCard title="CPU 核心使用率" value={data?.cpu ? `${data.cpu.cores.length} 个逻辑核心` : "不可用"} hint="每根柱条代表一个逻辑核心" dark={dark} options={cores} details={data?.cpu ? coreDetails : "CPU 采样不可用"} />
      <MonitorCard title="内存占用" value={data?.memory ? capacity(data.memory.used, data.memory.total) : "不可用"} hint={data?.memory ? `已使用 ${pct(data.memory.usedPercent)} · 可用 ${bytes(data.memory.available)}` : "按系统可用内存计算"} dark={dark} options={data?.memory ? ring(data.memory.usedPercent, 1) : null} details={data?.memory ? <><strong className="font-medium">物理内存</strong><span>已用：{bytes(data.memory.used)}</span><span>总计：{bytes(data.memory.total)}</span><span>剩余可用：{bytes(data.memory.available)}</span><span>可回收缓存计入可用内存；不包含交换空间。</span></> : "内存采样不可用"} />
      <MonitorCard title="磁盘占用" value={data?.disk ? capacity(data.disk.used, data.disk.total) : "不可用"} hint={data?.disk ? `已使用 ${pct(data.disk.usedPercent)} · ${data.disk.partitions.length} 个文件系统` : "按独立文件系统汇总"} dark={dark} options={data?.disk ? ring(data.disk.usedPercent, 2) : null} details={data?.disk ? <><strong className="font-medium">磁盘分区明细</strong>{data.disk.partitions.map(partition => <div key={partition.mount} className="grid gap-1"><strong className="font-medium">{partition.mount} · {partition.filesystem}</strong><span>{partition.device}</span><span>{bytes(partition.used)} / {bytes(partition.total)}（{pct(partition.usedPercent)}）</span><span>普通用户可用：{bytes(partition.available)}</span></div>)}<span>重复挂载不重复计数；不含内存文件系统。可用空间扣除系统保留块。</span></> : "磁盘采样不可用"} />
    </div>
  </section>;
}
