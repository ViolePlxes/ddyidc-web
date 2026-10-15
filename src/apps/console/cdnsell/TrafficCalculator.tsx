import { Input, LayerCard, Table, Tabs } from "@cloudflare/kumo";
import { useState } from "react";

const tiers = [
  { limit: 10_000, cents: 22, label: "0–10TB（含）" },
  { limit: 50_000, cents: 20, label: "10–50TB（含）" },
  { limit: 100_000, cents: 18, label: "50–100TB（含）" },
  { limit: 1_000_000, cents: 15, label: "100TB–1PB（含）" },
  { limit: Infinity, cents: 13, label: "大于1PB" },
];
const units = { GB: 1, TB: 1000, PB: 1_000_000 };
const quantity = (n: number) => n.toLocaleString("zh-CN", { maximumFractionDigits: 6 });
const money = (cents: number) => (cents / 100).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Display estimate only. Official mainland rates; not a billing or payment entry point.
export function estimateTraffic(gb: number) {
  if (!Number.isFinite(gb) || gb < 0 || gb > 1_000_000_000) return null;
  let lower = 0;
  const rows = tiers.map(tier => {
    const used = Math.max(0, Math.min(gb, tier.limit) - lower);
    lower = tier.limit;
    return { ...tier, used, amount: used * tier.cents };
  });
  return { rows, totalCents: Math.round(rows.reduce((sum, row) => sum + row.amount, 0)) };
}

export function TrafficCalculator() {
  const [value, setValue] = useState("15");
  const [unit, setUnit] = useState<keyof typeof units>("TB");
  const validInput = /^\d+(?:\.\d{1,6})?$/.test(value);
  const gb = Number(value) * units[unit];
  const result = validInput ? estimateTraffic(gb) : null;
  return <LayerCard className="mt-6">
    <LayerCard.Secondary>按量付费价格计算器</LayerCard.Secondary>
    <LayerCard.Primary className="grid gap-5 p-5 sm:p-6">
      <p className="text-base text-kumo-subtle">中国大陆流量按自然月分段累进计费。1TB = 1000GB，1PB = 1000TB；此估算不含 HTTPS 请求费，也不扣除已购资源包。</p>
      <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Input label="预计月流量" type="number" min={0} step="any" value={value} onChange={e => setValue(e.target.value)} aria-invalid={!result} />
        <Tabs variant="segmented" value={unit} onValueChange={v => setUnit(v as keyof typeof units)} tabs={Object.keys(units).map(v => ({ value: v, label: v }))} />
      </div>
      {!result ? <p role="alert" className="text-base text-kumo-subtle">请输入非负流量，最多6位小数，换算后不超过10亿GB。</p> : <>
        <div className="grid gap-1"><span className="text-base text-kumo-subtle">{quantity(gb)} GB · 预计流量费用</span><strong aria-live="polite" className="text-base text-kumo-strong font-medium">¥{money(result.totalCents)}</strong></div>
        <div className="overflow-x-auto"><Table><Table.Header><Table.Row><Table.Head>流量阶梯</Table.Head><Table.Head>单价（元/GB）</Table.Head><Table.Head>本段用量（GB）</Table.Head><Table.Head>本段费用（元）</Table.Head></Table.Row></Table.Header><Table.Body>{result.rows.map(row => <Table.Row key={row.label}><Table.Cell>{row.label}</Table.Cell><Table.Cell>{(row.cents / 100).toFixed(2)}</Table.Cell><Table.Cell>{quantity(row.used)}</Table.Cell><Table.Cell>{money(row.amount)}</Table.Cell></Table.Row>)}</Table.Body></Table></div>
      </>}
    </LayerCard.Primary>
  </LayerCard>;
}
