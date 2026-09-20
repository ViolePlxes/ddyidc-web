import { ClipboardText, LayerCard } from "@cloudflare/kumo";
import type { ReactNode } from "react";
import { InstanceOrder, InstanceRenewal } from "../../../shared/components/InstanceManagement";
import type { InstanceDetail, InstanceMonitor, MonitorPoint } from "../../../shared/api/console";
import { TrendChart } from "../../../shared/components/TrendChart";
import { cycleLabels, formatDate } from "../../../shared/utils/format";

export function configValue(instance: InstanceDetail, fields: string[], names: string[] = []) {
  const matches = instance.config.filter((item) => fields.includes((item.field || "").toLowerCase()) || names.includes(item.displayName));
  return [...new Set(matches.map((item) => item.displayValue).filter(Boolean))].join(" / ") || "—";
}

export function CopyValue({ value, label }: { value?: string; label: string }) {
  return value && value !== "—" ? <ClipboardText text={value} size="sm" tooltip={{ text: `复制${label}`, copiedText: "已复制" }} /> : <>—</>;
}

export function InfoGroup({ title, rows, action, columns = 1 }: { columns?: 1 | 2 | 3; title: string; rows: { label: string; value: ReactNode }[]; action?: ReactNode }) {
  return <LayerCard className="grid min-w-0 gap-4 p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{title}</h2>{action}</div>
    <dl className={columns === 1 ? "grid gap-3" : columns === 2 ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"}>{rows.map((row) => <div key={row.label} className={columns === 1 ? "grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] items-start gap-3" : "grid min-w-0 content-start gap-1"}>
      <dt className="text-sm text-kumo-subtle">{row.label}</dt><dd className="min-w-0 break-words text-sm">{row.value}</dd>
    </div>)}</dl>
  </LayerCard>;
}

export function expiryLabel(expiresAt?: string, now = Date.now()) {
  if (!expiresAt) return "—";
  const expires = Date.parse(expiresAt);
  if (!Number.isFinite(expires)) return expiresAt;
  const days = Math.ceil(Math.abs(expires - now) / 86_400_000);
  return `${formatDate(expiresAt)}（${expires > now ? `剩余 ${days} 天` : `已到期 ${days} 天`}）`;
}

export function BillingInfo({ instance }: { instance: InstanceDetail }) {
  return <InfoGroup title="计费信息" rows={[
    { label: "开通时间", value: instance.activatedAt ? formatDate(instance.activatedAt) : "尚未开通" },
    { label: "到期时间", value: expiryLabel(instance.expiresAt) },
    { label: "支付周期", value: cycleLabels[instance.billingCycle || ""] || instance.billingCycle || "—" },
    { label: "续费价格", value: instance.renewalAmount ? `¥${instance.renewalAmount}（以实时报价为准）` : "打开续费查看实时报价" },

    { label: "计费管理", value: <InstanceRenewal key={instance.id} instance={instance}/> },
    { label: "关联订单", value: <InstanceOrder instance={instance}/> },
  ]} />;
}

export function monitorPoints(points: MonitorPoint[] = []): [number, number][] {
  return points.filter((p) => Number.isFinite(p.timestamp) && Number.isFinite(p.value))
    .map((p): [number, number] => [p.timestamp * (p.timestamp < 10_000_000_000 ? 1000 : 1), p.value]).sort((a, b) => a[0] - b[0]);
}

export function InstanceMonitoring({ monitor, loading, error }: { monitor?: InstanceMonitor; loading: boolean; error?: string }) {
  const charts = [
    { title: "CPU 使用量", unit: "%", series: [{ name: "CPU", data: monitorPoints(monitor?.cpu) }] },
    { title: "硬盘 IO", unit: "KB/s", series: [{ name: "读取", data: monitorPoints(monitor?.diskRead) }, { name: "写入", data: monitorPoints(monitor?.diskWrite) }] },
    { title: "内存用量", unit: "%", series: [{ name: "内存", data: monitorPoints(monitor?.memory) }] },
    { title: "网卡", unit: "bps", series: [{ name: "流入", data: monitorPoints(monitor?.networkIn) }, { name: "流出", data: monitorPoints(monitor?.networkOut) }] },
  ];
  return <section aria-label="实例监控" className="grid min-w-0 content-start gap-4">
    <div><h2 className="text-lg font-semibold">实例监控</h2><p className="text-sm text-kumo-subtle">最近 24 小时 · 时间范围以实际采样为准</p></div>
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">{charts.map((chart) => {
      const timestamps = chart.series.flatMap((s) => s.data.map((p) => p[0]));
      const hasData = monitor?.available && timestamps.length > 0 && !error;
      const range = hasData ? `${new Date(Math.min(...timestamps)).toLocaleString()} — ${new Date(Math.max(...timestamps)).toLocaleString()}` : "时间范围：—";
      return <section key={chart.title} aria-label={chart.title} className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-kumo-subtle">{range}</p>
        {hasData ? <TrendChart title={chart.title} values={[]} series={chart.series} yAxisName={chart.unit} valuePrefix="" valueSuffix={` ${chart.unit}`} /> : <LayerCard className="grid min-h-80 content-start gap-4 p-5">
          <h3 className="font-semibold">{chart.title}</h3><p role="status" className="text-sm text-kumo-subtle">{loading ? "正在读取监控数据…" : error || monitor?.message || "当前实例暂无监控数据。"}</p>
        </LayerCard>}
      </section>;
    })}</div>
  </section>;
}
