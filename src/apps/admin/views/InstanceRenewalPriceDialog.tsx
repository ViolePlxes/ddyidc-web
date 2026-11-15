import { useEffect, useState } from "react";
import { Badge, Banner, Button, Dialog, Input, Switch } from "@cloudflare/kumo";
import { adminInstanceApi } from "../../../shared/api/adminInstance";
import { getApiMessage } from "../../../shared/api/request";

type Row = { cycle: string; label: string; base: string; cost: string; active: boolean; enabled: boolean; value: string };

// Every upstream renewal duration can carry its own contract price; an empty
// input keeps the catalogue price for that cycle.
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
    <Dialog.Root open={open} onOpenChange={(value) => { if (!saving) onOpenChange(value); }}>
      <Dialog className="grid max-w-2xl gap-4 p-6">
        <Dialog.Title>续费价格</Dialog.Title>
        <Dialog.Description>按上游每个续费时长分别定价；留空表示按目录价出账，关闭后用户端不再显示该续费时长。保存后新的续费订单按协议价。</Dialog.Description>
        {loading ? (
          <p role="status">正在读取续费价格…</p>
        ) : error && !loaded ? (
          <div className="grid gap-3">
            <Banner variant="error" title="无法读取续费价格" description={error} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={saving} onClick={() => onOpenChange(false)}>关闭</Button>
              <Button loading={loading} onClick={() => void load()}>重试</Button>
            </div>
          </div>
        ) : rows.length ? (
          <div className="grid gap-3">
            <div className="grid grid-cols-[minmax(0,1fr)_6rem_6rem_9rem] gap-2 text-sm text-kumo-subtle">
              <span>续费时长</span><span>目录价</span><span>上游成本</span><span>自定义价（元）</span>
            </div>
            {rows.map((row, index) => (
              <div key={row.cycle} className="grid grid-cols-[minmax(0,1fr)_6rem_6rem_9rem] items-center gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate">{row.label}</span>
                  <span className="text-xs text-kumo-subtle">{row.cycle}</span>
                  {row.active ? <Badge variant={row.enabled ? "success" : "neutral"}>{row.enabled ? "协议价" : "已关闭"}</Badge> : row.enabled ? null : <Badge variant="neutral">已关闭</Badge>}
                </span>
                <span>¥{row.base}</span>
                <span>¥{row.cost}</span>
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`${row.label}自定义价`}
                    inputMode="decimal"
                    placeholder={row.base}
                    value={row.value}
                    disabled={!row.enabled}
                    onChange={(event) => setRows((current) => current.map((item, position) => position === index ? { ...item, value: event.target.value } : item))}
                  />
                  <Switch label="显示" checked={row.enabled} onCheckedChange={(checked) => setRows((current) => current.map((item, position) => position === index ? { ...item, enabled: checked } : item))} />
                </div>
              </div>
            ))}
            <Input label="调价原因" value={reason} maxLength={200} onChange={(event) => setReason(event.target.value)} description="至少 2 个字，记录到审计日志。" />
            {error ? <Banner variant="error" title="保存失败" description={error} /> : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" disabled={saving} onClick={() => void clear()}>恢复全部目录价</Button>
              <Button variant="secondary" disabled={saving} onClick={() => onOpenChange(false)}>取消</Button>
              <Button loading={saving} disabled={reason.trim().length < 2} onClick={() => void save()}>保存</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-kumo-subtle">没有读取到续费周期。</p>
        )}
      </Dialog>
    </Dialog.Root>
  );
}
