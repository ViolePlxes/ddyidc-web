import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Banner, Button, Input, LayerCard, Select, Tabs, Text } from "@cloudflare/kumo";
import { ConfigurableTable, type TableColumn } from "../../../shared/components/ConfigurableTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { domainsApi, type DomainOperation } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";

type DNSRecord = { id: string; host: string; type: string; line: string; value: string; priority: string; ttl: string; updated: string; paused: boolean; isNew?: boolean };
type OperationHandler = (operation: DomainOperation, initial: Record<string, string>) => void;
const columns: readonly TableColumn[] = [
  { key: "host", label: "主机记录", width: 160, min: 120, required: true },
  { key: "type", label: "记录类型", width: 110, min: 90 },
  { key: "line", label: "线路类型", width: 110, min: 90 },
  { key: "value", label: "记录值", width: 300, min: 180 },
  { key: "priority", label: "优先级", width: 90, min: 80 },
  { key: "ttl", label: "TTL", width: 80, min: 70 },
  { key: "updated", label: "最后操作时间", width: 180, min: 160 },
  { key: "actions", label: "操作", width: 220, min: 180, required: true },
];
const recordTypes: Record<string, string> = { A: "A", AAAA: "AAAA", CNAME: "CNAME", MX: "MX", TXT: "TXT", NS: "NS", SRV: "SRV" };
const lines: Record<string, string> = { "默认": "默认", "LTEL": "电信", "LCNC": "联通", "LMOB": "移动", "LEDU": "教育网" };
const plans: Record<string, string> = { dns001: "DNS管理II型 · 500 条", dns002: "DNS管理II型 · 1000 条", dns003: "DNS管理3型 · 2000 条", dns004: "DNS管理4型 · 4000 条" };
const emptyForm = { host: "@", type: "A", line: "默认", value: "", priority: "", ttl: "600" };

export function DomainDNSPage({ domain, onBack, contracts, onOperation }: { domain: string; onBack: () => void; contracts: DomainOperation[]; onOperation: OperationHandler }) {
  const [tab, setTab] = useState("records");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newSeed, setNewSeed] = useState<DNSRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState("dns001");
  const [years, setYears] = useState("1");
  const operation = (ref: string) => contracts.find((item) => item.key === ref);
  const records = useQuery({ queryKey: ["domains", "dns", domain], queryFn: () => domainsApi.execute({ action: "3.10", params: { domain }, requestId: crypto.randomUUID(), confirmed: true }) });
  const detail = useQuery({ queryKey: ["domains", "detail", domain], queryFn: () => domainsApi.execute({ action: "4.8", params: { domain }, requestId: crypto.randomUUID(), confirmed: true }) });
  const logs = useQuery({ queryKey: ["domains", "records"], queryFn: domainsApi.records });
  const dnssec = useQuery({ queryKey: ["domains", "dnssec", domain], queryFn: () => domainsApi.execute({ action: "3.31", params: { domain }, requestId: crypto.randomUUID(), confirmed: true }), enabled: tab === "security" });
  const stats = useQuery({ queryKey: ["domains", "stats", domain], queryFn: () => domainsApi.execute({ action: "3.41", params: { domain }, requestId: crypto.randomUUID(), confirmed: true }), enabled: tab === "stats" });
  const price = useQuery({ queryKey: ["domains", "smartdns-price", plan, years], queryFn: () => domainsApi.execute({ action: "3.45", params: { proid: plan, years }, requestId: crypto.randomUUID(), confirmed: true }), enabled: tab === "package" });
  const rawRows = Array.isArray(records.data?.data) ? records.data.data as Record<string, unknown>[] : [];
  const rows: DNSRecord[] = rawRows.map((item, index) => ({ id: String(item.id ?? index), host: String(item.host ?? "@"), type: String(item.type ?? "A"), line: String(item.line ?? "默认"), value: String(item.value ?? ""), priority: String(item.level ?? "—"), ttl: String(item.ttl ?? "600"), updated: String(item.updated ?? item.update_time ?? "—"), paused: String(item.paused ?? item.pause ?? "") === "1" }));
  const detailData = (detail.data?.data ?? {}) as Record<string, unknown>;
  const dnsList = Array.isArray(detailData.dns) ? detailData.dns as string[] : [];
  const visible = newSeed && !rows.some((row) => row.id === newSeed.id) ? [newSeed, ...rows] : rows;
  const startEdit = (row: DNSRecord) => { setEditingId(row.id); setForm({ host: row.host, type: row.type, line: row.line, value: row.value, priority: row.priority === "—" ? "" : row.priority, ttl: row.ttl }); };
  const addRow = () => { const row: DNSRecord = { id: `new-${Date.now()}`, host: "", type: "A", line: "默认", value: "", priority: "", ttl: "600", updated: "", paused: false, isNew: true }; setNewSeed(row); setEditingId(row.id); setForm(emptyForm); };
  const cancel = () => { setEditingId(null); setNewSeed(null); };
  const confirm = async () => {
    setError(""); setNotice("");
    if (!editingId || !form.host.trim() || !form.value.trim()) return;
    setBusy(true);
    try {
      if (editingId.startsWith("new-")) {
        const params: Record<string, string> = { domain, host: form.host.trim(), type: form.type, value: form.value.trim(), ttl: form.ttl };
        if (form.priority.trim()) params.level = form.priority.trim();
        if (form.line && form.line !== "默认") params.line = form.line;
        await domainsApi.execute({ action: "3.7", params, requestId: crypto.randomUUID(), confirmed: true });
        setNotice("解析记录已添加");
      } else {
        const params: Record<string, string> = { domain, id: editingId, value: form.value.trim(), ttl: form.ttl };
        if (form.priority.trim()) params.level = form.priority.trim();
        if (form.line) params.line = form.line === "默认" ? "" : form.line;
        await domainsApi.execute({ action: "3.8", params, requestId: crypto.randomUUID(), confirmed: true });
        setNotice("解析记录已修改");
      }
      setEditingId(null); setNewSeed(null); await records.refetch();
    } catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  const pause = async (row: DNSRecord) => {
    if (!window.confirm(`确认${row.paused ? "启用" : "暂停"}解析记录 ${row.host}？`)) return;
    setBusy(true); setError("");
    try { await domainsApi.execute({ action: "3.40", params: { domain, id: row.id, val: row.paused ? "1" : "0" }, requestId: crypto.randomUUID(), confirmed: true }); setNotice(row.paused ? "解析已启用" : "解析已暂停"); await records.refetch(); }
    catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  const remove = async (row: DNSRecord) => {
    if (!window.confirm(`确认删除解析记录 ${row.host}？`)) return;
    setBusy(true); setError("");
    try { await domainsApi.execute({ action: "3.9", params: { domain, id: row.id }, requestId: crypto.randomUUID(), confirmed: true }); setNotice("解析记录已删除"); await records.refetch(); }
    catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  const saveDNS = async () => {
    setBusy(true); setError("");
    try {
      const params: Record<string, string> = { domain, dns1: settings.dns1 ?? dnsList[0] ?? "", dns2: settings.dns2 ?? dnsList[1] ?? "" };
      for (const key of ["dns3", "dns4", "dns5", "dns6"]) if (settings[key]) params[key] = settings[key];
      await domainsApi.execute({ action: "3.6", params, requestId: crypto.randomUUID(), confirmed: true });
      setNotice("DNS 服务器已更新"); await detail.refetch();
    } catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  const cell = (row: DNSRecord, key: string) => {
    const editing = editingId === row.id;
    if (editing) {
      if (key === "host") return <Input className="w-full" aria-label="主机记录" value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} disabled={!row.isNew} autoFocus />;
      if (key === "type") return <Select className="w-full" aria-label="记录类型" value={form.type} items={recordTypes} disabled={!row.isNew} onValueChange={(value) => value && setForm({ ...form, type: value })} />;
      if (key === "line") return <Select className="w-full" aria-label="线路类型" value={form.line} items={lines} onValueChange={(value) => value && setForm({ ...form, line: value })} />;
      if (key === "value") return <Input className="w-full" aria-label="记录值" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />;
      if (key === "priority") return <Input className="w-full" aria-label="优先级" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value.replace(/\D/g, "") })} />;
      if (key === "ttl") return <Input className="w-full" aria-label="TTL" value={form.ttl} onChange={(event) => setForm({ ...form, ttl: event.target.value.replace(/\D/g, "") })} />;
      if (key === "updated") return <span className="text-kumo-subtle">{row.isNew ? "待创建" : row.updated}</span>;
      if (key === "actions") return <div className="flex gap-2 whitespace-nowrap"><Button variant="destructive" size="sm" onClick={cancel}>取消</Button><Button size="sm" loading={busy} disabled={!form.host.trim() || !form.value.trim()} onClick={() => void confirm()}>{row.isNew ? "确认新增" : "确认"}</Button></div>;
    }
    if (key === "host") return <button type="button" className="flex w-full cursor-pointer items-center gap-2 text-left hover:text-[color:var(--color-blue-600)]" onClick={() => startEdit(row)}><span className={`h-2 w-2 rounded-full ${row.paused ? "bg-kumo-warning" : "bg-kumo-success"}`} />{row.host}</button>;
    if (key === "type") return row.type;
    if (key === "line") return row.line;
    if (key === "value") return <button type="button" className="w-full cursor-pointer break-all text-left hover:text-[color:var(--color-blue-600)]" onClick={() => startEdit(row)}>{row.value}</button>;
    if (key === "priority") return row.priority;
    if (key === "ttl") return row.ttl;
    if (key === "updated") return row.updated;
    if (key === "actions") return <div className="flex gap-2 whitespace-nowrap text-[color:var(--color-blue-600)]"><button type="button" className="cursor-pointer hover:underline" onClick={() => startEdit(row)}>修改</button><button type="button" className="cursor-pointer hover:underline" onClick={() => void pause(row)}>{row.paused ? "启用" : "暂停"}</button><button type="button" className="cursor-pointer hover:underline" onClick={() => void remove(row)}>删除</button></div>;
    return null;
  };
  const statRows = (() => { const data = (stats.data?.data ?? {}) as Record<string, unknown>; const list = Array.isArray(data.data) ? data.data : Array.isArray((data.chart as Record<string, unknown> | undefined)?.rows) ? (data.chart as Record<string, unknown>).rows as unknown[] : []; return list.map((item) => item as Record<string, unknown>); })();
  const priceData = (price.data?.data ?? {}) as Record<string, unknown>;
  return <div className="grid gap-3">
    <PageHeader title={`解析管理 · ${domain}`} description="管理解析记录、DNS 服务器、DNSSEC、数据统计与智能 DNS 套餐。" actions={<Button variant="secondary" onClick={onBack}>返回域名列表</Button>} />
    <Tabs variant="underline" value={tab} onValueChange={setTab} tabs={[{ value: "records", label: "记录管理" }, { value: "settings", label: "解析设置" }, { value: "security", label: "DNS安全" }, { value: "stats", label: "数据统计" }, { value: "package", label: "套餐服务" }, { value: "logs", label: "操作日志" }]} />
    {error ? <Banner variant="error" title={error} /> : null}
    {notice ? <Banner title={notice} /> : null}
    {tab === "records" ? <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><Text variant="secondary" size="sm">共 {visible.length} 条记录</Text><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={addRow}>添加记录</Button><Button variant="secondary" size="sm" onClick={() => records.refetch()}>刷新</Button></div></div>
      {records.error ? <Banner variant="error" title={getApiMessage(records.error)} /> : null}
      <ConfigurableTable rows={visible} columns={columns} storageKey={`ddyidc-domain-dns:${domain}`} label="解析记录" renderCell={cell} rowKey={(row) => row.id} loading={records.isLoading} emptyContent="暂无解析记录" />
    </div> : null}
    {tab === "settings" ? <LayerCard className="grid gap-4 px-5 py-4">
      <div><Text as="h2" size="sm" bold>DNS 服务器</Text><Text variant="secondary" size="sm">修改域名的权威 DNS 服务器，修改后解析记录需在新 DNS 中配置。</Text></div>
      <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3, 4, 5].map((index) => <Input key={index} label={`DNS ${index + 1}`} value={settings[`dns${index + 1}`] ?? dnsList[index] ?? ""} onChange={(event) => setSettings({ ...settings, [`dns${index + 1}`]: event.target.value })} />)}</div>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setSettings({})}>重置</Button><Button loading={busy} disabled={!operation("3.6")} onClick={() => void saveDNS()}>保存 DNS</Button></div>
    </LayerCard> : null}
    {tab === "security" ? <div className="grid gap-3">
      <LayerCard className="grid gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><Text size="sm" bold>DNSSEC</Text><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={!operation("3.31")} onClick={() => dnssec.refetch()}>刷新</Button><Button variant="secondary" size="sm" disabled={!operation("3.32")} onClick={() => { const op = operation("3.32"); if (op) onOperation(op, { domain }); }}>同步</Button><Button size="sm" disabled={!operation("3.29")} onClick={() => { const op = operation("3.29"); if (op) onOperation(op, { domain }); }}>添加 DS</Button></div></div>
        {dnssec.error ? <Banner variant="error" title={getApiMessage(dnssec.error)} /> : null}
        <div className="overflow-x-auto rounded border border-kumo-line"><table className="w-full text-sm"><thead className="bg-kumo-recessed text-left"><tr><th className="px-3 py-2">Key Tag</th><th className="px-3 py-2">算法</th><th className="px-3 py-2">摘要类型</th><th className="px-3 py-2">摘要</th><th className="px-3 py-2">操作</th></tr></thead><tbody>
          {(Array.isArray(dnssec.data?.data) ? dnssec.data.data as Record<string, unknown>[] : []).map((item, index) => <tr key={index} className="border-t border-kumo-line"><td className="px-3 py-2">{String(item.keytag ?? "—")}</td><td className="px-3 py-2">{String(item.keyalg ?? "—")}</td><td className="px-3 py-2">{String(item.keytype ?? "—")}</td><td className="px-3 py-2 break-all">{String(item.keydigest ?? "—")}</td><td className="px-3 py-2"><button type="button" className="cursor-pointer text-[color:var(--color-blue-600)] hover:underline" onClick={() => { const op = operation("3.30"); if (op) onOperation(op, { domain, keytag: String(item.keytag ?? "") }); }}>删除</button></td></tr>)}
          {!dnssec.isLoading && !(Array.isArray(dnssec.data?.data) && dnssec.data.data.length) ? <tr><td colSpan={5} className="px-3 py-6 text-center text-kumo-subtle">暂无 DNSSEC 记录</td></tr> : null}
        </tbody></table></div>
      </LayerCard>
      <div className="grid gap-2">{([["域名锁定", "3.12"], ["WHOIS 隐私保护", "3.33"], ["注册局安全锁", "3.16"]] as [string,string][]).map(([label, ref]) => <div key={label} className="flex flex-wrap items-center justify-between gap-3 rounded border border-kumo-line px-4 py-3"><Text size="sm" bold>{label}</Text><Button variant="secondary" size="sm" disabled={!operation(ref)} onClick={() => { const op = operation(ref); if (op) onOperation(op, { domain }); }}>管理</Button></div>)}</div>
    </div> : null}
    {tab === "stats" ? <div className="grid gap-3">
      {stats.error ? <Banner variant="error" title={getApiMessage(stats.error)} /> : null}
      <LayerCard className="grid gap-3 px-5 py-4">
        <div className="flex items-center justify-between"><Text size="sm" bold>最近 30 天解析趋势</Text><Button variant="secondary" size="sm" onClick={() => stats.refetch()}>刷新</Button></div>
        {statRows.length ? <div className="overflow-x-auto rounded border border-kumo-line"><table className="w-full text-sm"><thead className="bg-kumo-recessed text-left"><tr><th className="px-3 py-2">日期</th><th className="px-3 py-2">解析量</th></tr></thead><tbody>{statRows.map((item, index) => <tr key={index} className="border-t border-kumo-line"><td className="px-3 py-2">{String(item.day ?? item.date ?? "—")}</td><td className="px-3 py-2">{String(item.count ?? item.value ?? "0")}</td></tr>)}</tbody></table></div> : <Text variant="secondary" size="sm">{stats.isLoading ? "加载中…" : "暂无统计数据（需使用西部 DNS 且已产生解析量）"}</Text>}
      </LayerCard>
    </div> : null}
    {tab === "package" ? <LayerCard className="grid gap-4 px-5 py-4">
      <div><Text as="h2" size="sm" bold>智能 DNS 套餐</Text><Text variant="secondary" size="sm">套餐用于提升解析记录数量和智能线路能力，开通后由西部扣费。</Text></div>
      <div className="grid gap-3 sm:grid-cols-3"><Select label="套餐型号" value={plan} items={plans} onValueChange={(value) => value && setPlan(value)} /><Select label="年限" value={years} items={{ "1": "1 年", "2": "2 年", "3": "3 年" }} onValueChange={(value) => value && setYears(value)} /><div className="flex items-end"><Text size="sm">价格：{price.isLoading ? "查询中…" : priceData.buyprice !== undefined ? `¥${String(priceData.buyprice)}` : "—"}</Text></div></div>
      {price.error ? <Banner variant="error" title={getApiMessage(price.error)} /> : null}
      <div className="flex justify-end"><Button disabled={!operation("3.46")} onClick={() => { const op = operation("3.46"); if (op) onOperation(op, { domain, proid: plan, years }); }}>开通套餐</Button></div>
    </LayerCard> : null}
    {tab === "logs" ? <div className="grid gap-2">
      {logs.error ? <Banner variant="error" title={getApiMessage(logs.error)} /> : null}
      <div className="overflow-x-auto rounded border border-kumo-line"><table className="w-full text-sm"><thead className="bg-kumo-recessed text-left"><tr><th className="px-3 py-2">时间</th><th className="px-3 py-2">操作</th><th className="px-3 py-2">域名</th><th className="px-3 py-2">状态</th></tr></thead><tbody>{(logs.data ?? []).filter((row) => !row.domain || row.domain === domain).map((row) => <tr key={row.id} className="border-t border-kumo-line"><td className="px-3 py-2">{new Date(row.createdAt).toLocaleString("zh-CN")}</td><td className="px-3 py-2">{row.action}</td><td className="px-3 py-2">{row.domain || domain}</td><td className="px-3 py-2"><Badge variant={row.status === "succeeded" ? "success" : row.status === "failed" ? "error" : "warning"}>{row.status}</Badge></td></tr>)}{!logs.isLoading && !(logs.data ?? []).length ? <tr><td colSpan={4} className="px-3 py-6 text-center text-kumo-subtle">暂无操作记录</td></tr> : null}</tbody></table></div>
    </div> : null}
  </div>;
}
