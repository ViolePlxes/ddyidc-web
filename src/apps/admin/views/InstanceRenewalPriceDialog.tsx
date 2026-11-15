import { useEffect, useState } from "react";
import { Badge, Banner, Button, Input, LayerDialog, Switch } from "@cloudflare/kumo";
import { adminInstanceApi } from "../../../shared/api/adminInstance";
import { getApiMessage } from "../../../shared/api/request";

type Row = { cycle: string; label: string; base: string; cost: string; active: boolean; enabled: boolean; value: string };

// Compact editor: one line per upstream renewal duration on desktop, two lines
// on narrow screens, with a per-cycle contract price and visibility switch.
export function InstanceRenewalPriceDialog({ customerId, instanceId, open, onOpenChange, onSaved }: {
  customerId: string;
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (message: string) => void;
}) {
  const api = adminInstanceApi(customerId, instanceId);
  const [rows, setRows] = useState<Row[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const view = await api.renewalPrice();
      setRows((view.cycles ?? []).map((cycle) => ({
        cycle: cycle.cycle,
        label: cycle.label || cycle.cycle,
        base: cycle.baseAmount,
        cost: cycle.cost,
        active: cycle.active,
        enabled: cycle.enabled !== false,
        value: cycle.active && cycle.enabled !== false && (!cycle.mode || cycle.mode === "fixed") ? cycle.value ?? "" : "",
      })));
      setReason("");
      setLoaded(true);
    } catch (current) {
      setError(getApiMessage(current));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setLoaded(false);
      void load();
    }
  }, [open, customerId, instanceId]);

  function update(index: number, patch: Partial<Row>) {
    setRows((current) => current.map((row, position) => position === index ? { ...row, ...patch } : row));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const items = rows.flatMap((row) => {
        if (!row.enabled) return [{ cycle: row.cycle, enabled: false }];
        const value = row.value.trim();
        return value ? [{ cycle: row.cycle, enabled: true, mode: "fixed" as const, value }] : [];
      });
      await api.setRenewalPrices({ reason: reason.trim(), items });
      onSaved(items.length ? "续费价格已保存" : "已恢复目录价");
      onOpenChange(false);
    } catch (current) {
      setError(getApiMessage(current));
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    setSaving(true);
    setError("");
    try {
      await api.setRenewalPrices({ reason: reason.trim() || "恢复目录价", items: [] });
      onSaved("已恢复目录价");
      onOpenChange(false);
    } catch (current) {
      setError(getApiMessage(current));
    } finally {
      setSaving(false);
    }
  }

  return (
    <LayerDialog.Root open={open} onOpenChange={onOpenChange} dismissDisabled={saving}>
      <LayerDialog.Content size="xl">
        <LayerDialog.Title>续费价格</LayerDialog.Title>
        <LayerDialog.Description>留空按目录价；关闭后用户端不显示该周期。</LayerDialog.Description>
        <LayerDialog.Body>
          {loading ? (
            <p role="status" className="py-4 text-center text-kumo-subtle">正在读取续费价格…</p>
          ) : error && !loaded ? (
            <div className="grid gap-3">
              <Banner variant="error" title="无法读取续费价格" description={error} />
              <div className="flex justify-end">
                <Button size="sm" variant="secondary" loading={loading} onClick={() => void load()}>重试</Button>
              </div>
            </div>
          ) : rows.length ? (
            <div className="grid gap-3">
              <div className="hidden grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_9rem_3.5rem] items-center gap-3 px-1 text-xs text-kumo-subtle sm:grid">
                <span>续费时长</span><span>目录价</span><span>上游成本</span><span>自定义价（元）</span><span className="text-right">显示</span>
              </div>
              <div className="divide-y divide-kumo-hairline rounded-lg border border-kumo-hairline">
                {rows.map((row, index) => (
                  <div key={row.cycle} className="grid gap-x-3 gap-y-1.5 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_9rem_3.5rem] sm:items-center sm:gap-3 sm:py-1.5">
                    <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium">{row.label}</span>
                        <span className="hidden text-xs text-kumo-subtle md:inline">{row.cycle}</span>
                        {row.active ? (
                          <Badge variant={row.enabled ? "success" : "neutral"}>{row.enabled ? "协议价" : "已关闭"}</Badge>
                        ) : row.enabled ? null : <Badge variant="neutral">已关闭</Badge>}
                      </div>
                      <div className="sm:hidden">
                        <Switch aria-label={`${row.label}用户端显示`} checked={row.enabled} onCheckedChange={(checked) => update(index, { enabled: checked })} />
                      </div>
                    </div>
                    <div className="hidden text-sm sm:block">¥{row.base}</div>
                    <div className="hidden text-sm sm:block">¥{row.cost}</div>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 text-xs text-kumo-subtle sm:hidden">目录 ¥{row.base} · 成本 ¥{row.cost}</span>
                      <Input
                        size="sm"
                        className="min-w-0 flex-1 sm:flex-none"
                        aria-label={`${row.label}自定义价`}
                        inputMode="decimal"
                        placeholder={row.base}
                        value={row.value}
                        disabled={!row.enabled}
                        onChange={(event) => update(index, { value: event.target.value })}
                      />
                    </div>
                    <div className="hidden justify-end sm:flex">
                      <Switch aria-label={`${row.label}用户端显示`} checked={row.enabled} onCheckedChange={(checked) => update(index, { enabled: checked })} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-48 flex-1">
                  <Input size="sm" label="调价原因" placeholder="至少 2 个字，记录到审计日志" value={reason} maxLength={200} onChange={(event) => setReason(event.target.value)} />
                </div>
                <Button size="sm" variant="secondary" disabled={saving} onClick={() => void clear()}>恢复全部目录价</Button>
              </div>
              {error ? <Banner variant="error" title="保存失败" description={error} /> : null}
            </div>
          ) : (
            <p className="py-4 text-center text-kumo-subtle">没有读取到续费周期。</p>
          )}
        </LayerDialog.Body>
        <LayerDialog.Actions dismissLabel="取消">
          <LayerDialog.Action loading={saving} disabled={reason.trim().length < 2} onClick={() => void save()}>保存</LayerDialog.Action>
        </LayerDialog.Actions>
      </LayerDialog.Content>
    </LayerDialog.Root>
  );
}
