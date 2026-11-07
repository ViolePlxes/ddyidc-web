import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Banner, Button, Input, LayerCard, Select, Tabs, Text } from "@cloudflare/kumo";
import { ConfigurableTable, type TableColumn } from "../../../shared/components/ConfigurableTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { domainsApi, type DomainOperation } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";

type DNSRecord = { id: string; host: string; type: string; line: string; value: string; weight: string; priority: string; ttl: string; remark: string; updated: string; isNew?: boolean };
type OperationHandler = (operation: DomainOperation, initial: Record<string, string>) => void;
const columns: readonly TableColumn[] = [
  { key: "host", label: "主机记录", width: 160, min: 120, required: true },
  { key: "type", label: "记录类型", width: 110, min: 90 },
  { key: "line", label: "线路类型", width: 110, min: 90 },
  { key: "value", label: "记录值", width: 300, min: 180 },
  { key: "weight", label: "权重", width: 80, min: 70 },
  { key: "priority", label: "优先级", width: 90, min: 80 },
  { key: "ttl", label: "TTL", width: 80, min: 70 },
  { key: "remark", label: "备注", width: 130, min: 100 },
  { key: "updated", label: "最后操作时间", width: 180, min: 160 },
  { key: "actions", label: "操作", width: 130, min: 110, required: true },
];
const recordTypes: Record<string, string> = { A: "A", AAAA: "AAAA", CNAME: "CNAME", MX: "MX", TXT: "TXT", NS: "NS", SRV: "SRV" };
const lines: Record<string, string> = { "默认": "默认", "电信": "电信", "联通": "联通", "移动": "移动", "教育网": "教育网" };
const emptyForm = { host: "@", type: "A", line: "默认", value: "", weight: "", priority: "", ttl: "600", remark: "" };

export function DomainDNSPage({ domain, onBack, contracts, onOperation }: { domain: string; onBack: () => void; contracts: DomainOperation[]; onOperation: OperationHandler }) {
  const [tab, setTab] = useState("records");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const operation = (ref: string) => contracts.find((item) => item.key === ref);
  const records = useQuery({ queryKey: ["domains", "dns", domain], queryFn: () => domainsApi.execute({ action: "3.10", params: { domain }, requestId: crypto.randomUUID(), confirmed: true }) });
  const detail = useQuery({ queryKey: ["domains", "detail", domain], queryFn: () => domainsApi.execute({ action: "4.8", params: { domain }, requestId: crypto.randomUUID(), confirmed: true }) });
  const logs = useQuery({ queryKey: ["domains", "records"], queryFn: domainsApi.records });
  const rawRows = Array.isArray(records.data?.data) ? records.data.data as Record<string, unknown>[] : [];
  const rows: DNSRecord[] = rawRows.map((item, index) => ({ id: String(item.id ?? index), host: String(item.host ?? "@"), type: String(item.type ?? "A"), line: String(item.line ?? "默认"), value: String(item.value ?? ""), weight: String(item.weight ?? "—"), priority: String(item.level ?? "—"), ttl: String(item.ttl ?? "600"), remark: String(item.remark ?? "—"), updated: String(item.updated ?? item.update_time ?? "—") }));
  const detailData = (detail.data?.data ?? {}) as Record<string, unknown>;
  const dnsList = Array.isArray(detailData.dns) ? detailData.dns as string[] : [];
  const startEdit = (row: DNSRecord) => { setEditingId(row.id); setForm({ host: row.host, type: row.type, line: row.line, value: row.value, weight: row.weight, priority: row.priority === "—" ? "" : row.priority, ttl: row.ttl, remark: row.remark === "—" ? "" : row.remark }); };
  const addRow = () => { const id = `new-${Date.now()}`; setEditingId(id); setForm(emptyForm); setRowsNew(id); };
  const [newSeed, setNewSeed] = useState<{ id: string; host: string; type: string; line: string; value: string; weight: string; priority: string; ttl: string; remark: string; updated: string; isNew: boolean } | null>(null);
  function setRowsNew(id: string) { setNewSeed({ id, host: "", type: "A", line: "默认", value: "", weight: "—", priority: "—", ttl: "600", remark: "—", updated: "", isNew: true }); }
  const visible = newSeed && !rows.some((row) => row.id === newSeed.id) ? [newSeed, ...rows] : rows;
  const cancel = () => { setEditingId(null); setNewSeed(null); };
  const confirm = async () => {
    setError(""); setNotice("");
    if (!editingId || !form.host.trim() || !form.value.trim()) return;
    setBusy(true);
    try {
      if (editingId.startsWith("new-")) {
        const params: Record<string, string> = { domain, host: form.host.trim(), type: form.type, value: form.value.trim(), ttl: form.ttl };
        if (form.priority.trim()) params.level = form.priority.trim();
        if (form.line) params.line = form.line;
        await domainsApi.execute({ action: "3.7", params, requestId: crypto.randomUUID(), confirmed: true });
        setNotice("解析记录已添加");
      } else {
        await domainsApi.execute({ action: "3.8", params: { domain, id: editingId, value: form.value.trim(), ttl: form.ttl }, requestId: crypto.randomUUID(), confirmed: true });
        setNotice("解析记录已修改");
      }
      setEditingId(null); setNewSeed(null); await records.refetch();
    } catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
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
      if (key === "line") return <Select className="w-full" aria-label="线路类型" value={form.line} items={lines} disabled={!row.isNew} onValueChange={(value) => value && setForm({ ...form, line: value })} />;
      if (key === "value") return <Input className="w-full" aria-label="记录值" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />;
      if (key === "priority") return <Input className="w-full" aria-label="优先级" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value.replace(/\D/g, "") })} />;
      if (key === "ttl") return <Input className="w-full" aria-label="TTL" value={form.ttl} onChange={(event) => setForm({ ...form, ttl: event.target.value.replace(/\D/g, "") })} />;
      if (key === "weight" || key === "remark" || key === "updated") return <span className="text-kumo-subtle">—</span>;
      if (key === "actions") return <div className="flex gap-2 whitespace-nowrap"><Button variant="destructive" size="sm" onClick={cancel}>取消</Button><Button size="sm" loading={busy} disabled={!form.host.trim() || !form.value.trim()} onClick={() => void confirm()}>{row.isNew ? "确认新增" : "确认"}</Button></div>;
    }
    if (key === "host") return <button type="button" className="flex w-full cursor-pointer items-center gap-2 text-left hover:text-[color:var(--color-blue-600)]" onClick={() => startEdit(row)}>{row.host}{editing ? "" : <span className="text-[10px] opacity-60">✎</span>}</button>;
    if (key === "type") return row.type;
    if (key === "line") return row.line;
    if (key === "value") return <button type="button" className="w-full cursor-pointer break-all text-left hover:text-[color:var(--color-blue-600)]" onClick={() => startEdit(row)}>{row.value}</button>;
    if (key === "weight") return row.weight;
    if (key === "priority") return row.priority;
    if (key === "ttl") return row.ttl;
    if (key === "remark") return row.remark;
    if (key === "updated") return row.updated;
    if (key === "actions") return <div className="flex gap-2 whitespace-nowrap text-[color:var(--color-blue-600)]"><button type="button" className="cursor-pointer hover:underline" onClick={() => startEdit(row)}>修改</button><button type="button" className="cursor-pointer hover:underline" onClick={() => void remove(row)}>删除</button></div>;
    return null;
  };
  return <div className="grid gap-3">
    <PageHeader title={`解析管理 · ${domain}`} description="管理解析记录、DNS 服务器、DNS 安全和操作日志。" actions={<Button variant="secondary" onClick={onBack}>返回域名列表</Button>} />
    <Tabs variant="underline" value={tab} onValueChange={setTab} tabs={[{ value: "records", label: "记录管理" }, { value: "settings", label: "解析设置" }, { value: "security", label: "DNS安全" }, { value: "logs", label: "操作日志" }]} />
    {error ? <Banner variant="error" title={error} /> : null}
    {notice ? <Banner title={notice} /> : null}
    {tab === "records" ? <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><Text variant="secondary" size="sm">共 {visible.length} 条记录</Text><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={addRow}>添加记录</Button><Button variant="secondary" size="sm" onClick={() => records.refetch()}>刷新</Button></div></div>
      {records.error ? <Banner variant="error" title={getApiMessage(records.error)} /> : null}
      <ConfigurableTable rows={visible} columns={columns} storageKey={`ddyidc-domain-dns:${domain}`} label="解析记录" renderCell={cell} rowKey={(row) => row.id} loading={records.isLoading} emptyContent="暂无解析记录" />
      <Text variant="secondary" size="sm">西部接口支持：主机记录、类型、线路、记录值、优先级、TTL；权重、备注和最后操作时间上游不返回，显示为 —。</Text>
    </div> : null}
    {tab === "settings" ? <LayerCard className="grid gap-4 px-5 py-4">
      <div><Text as="h2" size="sm" bold>DNS 服务器</Text><Text variant="secondary" size="sm">修改域名的权威 DNS 服务器，修改后解析记录需在新 DNS 中配置。</Text></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((index) => <Input key={index} label={`DNS ${index + 1}`} value={settings[`dns${index + 1}`] ?? dnsList[index] ?? ""} onChange={(event) => setSettings({ ...settings, [`dns${index + 1}`]: event.target.value })} />)}
      </div>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setSettings({})}>重置</Button><Button loading={busy} disabled={!operation("3.6")} onClick={() => void saveDNS()}>保存 DNS</Button></div>
    </LayerCard> : null}
    {tab === "security" ? <div className="grid gap-2">
      {([["域名锁定", "3.12"], ["DNSSEC", "3.29"], ["WHOIS 隐私保护", "3.33"], ["注册局安全锁", "3.16"]] as [string,string][]).map(([label, ref]) => <div key={label} className="flex flex-wrap items-center justify-between gap-3 rounded border border-kumo-line px-4 py-3"><div><Text size="sm" bold>{label}</Text><Text variant="secondary" size="sm">通过西部域名接口提交，涉及审核或费用时以操作结果为准。</Text></div><Button variant="secondary" size="sm" disabled={!operation(ref)} onClick={() => { const op = operation(ref); if (op) onOperation(op, { domain }); }}>管理</Button></div>)}
      <Text variant="secondary" size="sm">DNSSEC 删除与同步、隐私保护关闭等细分操作在「管理」弹窗的安全页中继续使用。</Text>
    </div> : null}
    {tab === "logs" ? <div className="grid gap-2">
      {logs.error ? <Banner variant="error" title={getApiMessage(logs.error)} /> : null}
      <div className="overflow-x-auto rounded border border-kumo-line"><table className="w-full text-sm"><thead className="bg-kumo-recessed text-left"><tr><th className="px-3 py-2">时间</th><th className="px-3 py-2">操作</th><th className="px-3 py-2">域名</th><th className="px-3 py-2">状态</th></tr></thead><tbody>{(logs.data ?? []).filter((row) => !row.domain || row.domain === domain).map((row) => <tr key={row.id} className="border-t border-kumo-line"><td className="px-3 py-2">{new Date(row.createdAt).toLocaleString("zh-CN")}</td><td className="px-3 py-2">{row.action}</td><td className="px-3 py-2">{row.domain || domain}</td><td className="px-3 py-2"><Badge variant={row.status === "succeeded" ? "success" : row.status === "failed" ? "error" : "warning"}>{row.status}</Badge></td></tr>)}{!logs.isLoading && !(logs.data ?? []).length ? <tr><td colSpan={4} className="px-3 py-6 text-center text-kumo-subtle">暂无操作记录</td></tr> : null}</tbody></table></div>
    </div> : null}
  </div>;
}
