import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Banner, Button, Input, LayerDialog, Select, Table, Tabs, Text } from "@cloudflare/kumo";
import { domainsApi, type DomainOperation } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";

type OperationHandler = (operation: DomainOperation, initial: Record<string, string>) => void;
type DNSRecord = { id?: string | number; host?: string; type?: string; value?: string; ttl?: string | number; line?: string; level?: string | number };

const recordTypes: Record<string, string> = { A: "A", AAAA: "AAAA", CNAME: "CNAME", MX: "MX", TXT: "TXT", SRV: "SRV", NS: "NS" };
const ttlOptions: Record<string, string> = { "600": "600 秒", "3600": "1 小时", "86400": "1 天" };

export function DomainManageDialog({ domain, open, onOpenChange, contracts, onOperation }: { domain: string; open: boolean; onOpenChange: (value: boolean) => void; contracts: DomainOperation[]; onOperation: OperationHandler }) {
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DNSRecord>();
  const [form, setForm] = useState({ host: "@", type: "A", value: "", ttl: "600", level: "", line: "" });
  const [busy, setBusy] = useState(false);
  const operation = (ref: string) => contracts.find((item) => item.key === ref);
  const detail = useQuery({ queryKey: ["domains", "detail", domain], queryFn: () => domainsApi.execute({ action: "4.8", params: { domain }, requestId: crypto.randomUUID(), confirmed: true }), enabled: open });
  const records = useQuery({ queryKey: ["domains", "dns", domain], queryFn: () => domainsApi.execute({ action: "3.10", params: { domain }, requestId: crypto.randomUUID(), confirmed: true }), enabled: open && tab === "dns" });
  const detailData = (detail.data?.data ?? {}) as Record<string, unknown>;
  const rows = useMemo(() => Array.isArray(records.data?.data) ? records.data.data as DNSRecord[] : [], [records.data]);
  const runAction = (operation: DomainOperation, initial: Record<string, string>) => {
    onOpenChange(false);
    onOperation(operation, initial);
  };
  const submitDNS = async () => {
    setError("");
    if (!form.host.trim() || !form.value.trim()) { setError("请填写主机记录和解析值"); return; }
    setBusy(true);
    try {
      if (editing?.id !== undefined) {
        await domainsApi.execute({ action: "3.8", params: { domain, id: String(editing.id), value: form.value.trim(), ttl: form.ttl }, requestId: crypto.randomUUID(), confirmed: true });
      } else {
        const params: Record<string, string> = { domain, host: form.host.trim(), type: form.type, value: form.value.trim(), ttl: form.ttl };
        if (form.level) params.level = form.level;
        if (form.line) params.line = form.line;
        await domainsApi.execute({ action: "3.7", params, requestId: crypto.randomUUID(), confirmed: true });
      }
      setAdding(false); setEditing(undefined); setForm({ host: "@", type: "A", value: "", ttl: "600", level: "", line: "" });
      await records.refetch();
    } catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  const removeRecord = async (record: DNSRecord) => {
    if (record.id === undefined) return;
    setBusy(true); setError("");
    try {
      await domainsApi.execute({ action: "3.9", params: { domain, id: String(record.id) }, requestId: crypto.randomUUID(), confirmed: true });
      await records.refetch();
    } catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  return <LayerDialog.Root open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
    <LayerDialog.Content size="xl" closeLabel="关闭">
      <LayerDialog.Title>管理域名 · {domain}</LayerDialog.Title>
      <LayerDialog.Description>查看域名状态，管理解析、安全设置与注册资料。</LayerDialog.Description>
      <LayerDialog.Body><div className="grid gap-4">
        <Tabs variant="underline" value={tab} onValueChange={setTab} tabs={[{ value: "overview", label: "概览" }, { value: "dns", label: "解析" }, { value: "security", label: "安全" }, { value: "profile", label: "资料" }]} />
        {error ? <Banner variant="error" title={error} /> : null}
        {tab === "overview" ? <div className="grid gap-3">
          {detail.error ? <Banner variant="error" title={getApiMessage(detail.error)} /> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {[["域名", domain], ["到期时间", String(detailData.rexpiredate ?? "—")], ["注册时间", String(detailData.regdate ?? "—")], ["DNS 服务器", Array.isArray(detailData.dns) ? (detailData.dns as string[]).join(" / ") : String(detailData.dns ?? "—")], ["状态", String(detailData.status ?? "—")], ["所有者", String(detailData.owner ?? detailData.registrant ?? "—")]].map(([label, value]) => <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2"><Text variant="secondary" size="sm">{label}</Text><Text size="sm">{value}</Text></div>)}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!operation("3.2")} onClick={() => { const op = operation("3.2"); if (op) runAction(op, { domain }); }}>续费</Button>
            <Button variant="secondary" disabled={!operation("3.28")} onClick={() => { const op = operation("3.28"); if (op) runAction(op, { domain }); }}>赎回</Button>
            <Button variant="secondary" disabled={!operation("3.11")} onClick={() => { const op = operation("3.11"); if (op) runAction(op, { domain }); }}>域名证书</Button>
          </div>
        </div> : null}
        {tab === "dns" ? <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><Text as="h2" size="sm" bold>解析记录</Text><Button size="sm" onClick={() => { setAdding(true); setEditing(undefined); setForm({ host: "@", type: "A", value: "", ttl: "600", level: "", line: "" }); }}>添加记录</Button></div>
          {records.error ? <Banner variant="error" title={getApiMessage(records.error)} /> : null}
          <div className="overflow-x-auto rounded border border-kumo-line"><Table><Table.Header><Table.Row><Table.Head>主机记录</Table.Head><Table.Head>类型</Table.Head><Table.Head>解析值</Table.Head><Table.Head>TTL</Table.Head><Table.Head>线路</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>
            {rows.map((record) => <Table.Row key={String(record.id)}><Table.Cell>{record.host ?? "@"}</Table.Cell><Table.Cell><Badge variant="secondary">{record.type ?? "A"}</Badge></Table.Cell><Table.Cell><span className="break-all">{record.value}</span></Table.Cell><Table.Cell>{record.ttl ?? "—"}</Table.Cell><Table.Cell>{record.line || "默认"}</Table.Cell><Table.Cell><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => { setEditing(record); setForm({ host: record.host ?? "@", type: record.type ?? "A", value: record.value ?? "", ttl: String(record.ttl ?? "600"), level: String(record.level ?? ""), line: record.line ?? "" }); }}>修改</Button><Button variant="secondary" size="sm" loading={busy} onClick={() => void removeRecord(record)}>删除</Button></div></Table.Cell></Table.Row>)}
            {!records.isLoading && !rows.length ? <Table.Row><Table.Cell colSpan={6}>暂无解析记录</Table.Cell></Table.Row> : null}
          </Table.Body></Table></div>
          {adding || editing ? <div className="grid gap-3 rounded border border-kumo-line p-3 sm:grid-cols-3">
            <Input label="主机记录" value={form.host} onChange={(event) => setForm({ ...form, host: event.target.value })} disabled={Boolean(editing)} />
            <Select label="类型" value={form.type} items={recordTypes} onValueChange={(value) => value && setForm({ ...form, type: value })} />
            <Input label="解析值" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} />
            <Select label="TTL" value={form.ttl} items={ttlOptions} onValueChange={(value) => value && setForm({ ...form, ttl: value })} />
            <Input label="优先级" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value.replace(/\D/g, "") })} description="MX 记录使用" />
            <Input label="线路" value={form.line} onChange={(event) => setForm({ ...form, line: event.target.value })} description="留空为默认线路" />
            <div className="sm:col-span-3 flex justify-end gap-2"><Button variant="secondary" onClick={() => { setAdding(false); setEditing(undefined); }}>取消</Button><Button loading={busy} onClick={() => void submitDNS()}>{editing ? "保存修改" : "添加记录"}</Button></div>
          </div> : null}
        </div> : null}
        {tab === "security" ? <div className="grid gap-2">
          {([["修改 DNS 服务器", "3.6"], ["域名锁定", "3.12"], ["隐私保护", "3.33"], ["注册局安全锁", "3.16"], ["管理密码", "3.4"], ["WHOIS 查询", "3.13"]] as [string,string][]).map(([label, ref]) => <div key={label} className="flex items-center justify-between gap-3 rounded border border-kumo-line px-4 py-3"><Text size="sm" bold>{label}</Text><Button variant="secondary" size="sm" disabled={!operation(ref)} onClick={() => { const op = operation(ref); if (op) runAction(op, { domain }); }}>设置</Button></div>)}
        </div> : null}
        {tab === "profile" ? <div className="grid gap-2">
          {([["域名详情", "4.8"], ["修改联系人资料", "4.7"], ["持有人过户", "4.11"], ["域名转出", ""]] as [string,string][]).map(([label, ref]) => <div key={label} className="flex items-center justify-between gap-3 rounded border border-kumo-line px-4 py-3"><Text size="sm" bold>{label}</Text><Button variant="secondary" size="sm" disabled={!ref || !operation(ref)} onClick={() => { if (!ref) return; const op = operation(ref); if (op) runAction(op, { domain }); }}>进入</Button></div>)}
        </div> : null}
      </div></LayerDialog.Body>
      <LayerDialog.Actions dismissLabel="关闭"><LayerDialog.Action onClick={() => onOpenChange(false)}>完成</LayerDialog.Action></LayerDialog.Actions>
    </LayerDialog.Content>
  </LayerDialog.Root>;
}
