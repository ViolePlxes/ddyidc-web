import { ClipboardText, LayerCard } from "@cloudflare/kumo";
import type { ReactNode } from "react";
import { InstanceOrder, InstanceRenewal } from "../../../shared/components/InstanceManagement";
import type { InstanceDetail, InstanceMonitor, MonitorPoint } from "../../../shared/api/console";
import { TrendChart } from "../../../shared/components/TrendChart";
import { cycleLabels, formatDate } from "../../../shared/utils/format";

export function configValue(instance: InstanceDetail, fields: string[], names: string[] = []) {
  // A machine that is still provisioning has no configuration snapshot yet: render the
  // page with blanks and let the next poll fill it in instead of throwing.
  const matches = (instance.config ?? []).filter((item) => fields.includes((item.field || "").toLowerCase()) || names.includes(item.displayName));
  return [...new Set(matches.map((item) => item.displayValue).filter(Boolean))].join(" / ") || "—";
}

export function CopyValue({ value, label }: { value?: string; label: string }) {
  return value && value !== "—" ? <ClipboardText text={value} size="sm" tooltip={{ text: `复制${label}`, copiedText: "已复制" }} /> : <>—</>;
}

export function InfoGroup({ title, rows, asideRows, action, columns = 1 }: {
  columns?: 1 | 2 | 3;
  title: string;
  rows: { label: string; value: ReactNode }[];
  /** Extra label/value rows shown to the right of the list, without a heading. */
  asideRows?: { label: string; value: ReactNode }[];
  action?: ReactNode;
}) {
  const stacked = (items: { label: string; value: ReactNode }[], labelWidth: string) => <dl className="grid min-w-0 content-start gap-3">{items.map((row) => (
    <div key={row.label} className={`grid min-w-0 ${labelWidth} items-center gap-3`}>
      <dt className="text-base text-kumo-subtle">{row.label}</dt><dd className="min-w-0 break-words text-base">{row.value}</dd>
    </div>
  ))}</dl>;
  return <LayerCard className="grid min-w-0 gap-4 px-5 py-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">{title}</h2>{action}</div>
    {asideRows ? <div className="@container">
      <div className="grid min-w-0 gap-x-6 gap-y-3 @[32rem]:grid-cols-[minmax(0,1fr)_minmax(0,11rem)]">
        {stacked(rows, "grid-cols-[6rem_minmax(0,1fr)]")}
        {stacked(asideRows, "grid-cols-[4.5rem_minmax(0,1fr)]")}
      </div>
    </div> : <dl className={columns === 1 ? "grid gap-3" : columns === 2 ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"}>{rows.map((row) => <div key={row.label} className={columns === 1 ? "grid min-w-0 grid-cols-[6rem_minmax(0,1fr)] items-center gap-3" : "grid min-w-0 content-start gap-1"}>
      <dt className="text-base text-kumo-subtle">{row.label}</dt><dd className="min-w-0 break-words text-base">{row.value}</dd>
    </div>)}</dl>}
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
  return (points ?? []).filter((p) => Number.isFinite(p.timestamp) && Number.isFinite(p.value))
    .map((p): [number, number] => [p.timestamp * (p.timestamp < 10_000_000_000 ? 1000 : 1), p.value]).sort((a, b) => a[0] - b[0]);
}

/** Same geometry as a loaded card, so the grid never resizes while monitoring loads. */
function MonitoringPlaceholder({ title, note }: { title: string; note: string }) {
  return <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg ring ring-kumo-line">
    <div className="bg-kumo-base px-4 pt-3 pb-1">
      <h3 className="truncate text-sm font-semibold text-kumo-strong">{title}</h3>
      <p className="mt-0.5 truncate text-xs text-kumo-subtle">{note}</p>
    </div>
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3" aria-hidden="true">
      <div className="min-h-30 flex-1 rounded bg-kumo-overlay/40" />
      <div className="h-4 w-2/3 shrink-0 rounded bg-kumo-overlay/40" />
      <div className="h-7 shrink-0 rounded bg-kumo-overlay/40" />
    </div>
  </div>;
}

export function InstanceMonitoring({ monitor, loading, error }: { monitor?: InstanceMonitor; loading: boolean; error?: string }) {
  const charts = [
    { title: "CPU 使用量", unit: "%", series: [{ name: "CPU", data: monitorPoints(monitor?.cpu) }] },
    { title: "硬盘 IO", unit: "KB/s", series: [{ name: "读取", data: monitorPoints(monitor?.diskRead) }, { name: "写入", data: monitorPoints(monitor?.diskWrite) }] },
    { title: "内存用量", unit: "%", series: [{ name: "内存", data: monitorPoints(monitor?.memory) }] },
    { title: "网卡", unit: "bps", series: [{ name: "流入", data: monitorPoints(monitor?.networkIn) }, { name: "流出", data: monitorPoints(monitor?.networkOut) }] },
  ];
  return <section aria-label="实例监控" className="flex h-full min-w-0 flex-col gap-4">
    <div className="grid min-w-0 flex-1 gap-5 md:auto-rows-fr md:grid-cols-2">{charts.map((chart) => {
      const timestamps = chart.series.flatMap((s) => s.data.map((p) => p[0]));
      const hasData = monitor?.available && timestamps.length > 0 && !error;
      const range = hasData ? `${new Date(Math.min(...timestamps)).toLocaleString()} — ${new Date(Math.max(...timestamps)).toLocaleString()}` : "时间范围：—";
      return <div key={chart.title} aria-label={chart.title} className="grid min-w-0">
        {hasData ? <TrendChart fill compact zoomable title={chart.title} description={range} values={[]} series={chart.series} yAxisName={chart.unit} valuePrefix="" valueSuffix={` ${chart.unit}`} />
          : <MonitoringPlaceholder title={chart.title} note={loading ? "正在读取监控数据…" : error || monitor?.message || "当前实例暂无监控数据。"} />}
      </div>;
    })}</div>
  </section>;
}
