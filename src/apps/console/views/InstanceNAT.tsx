import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banner, Button, Input, LayerCard, LayerDialog, Select, Table } from "@cloudflare/kumo";
import { consoleApi, type InstanceNATInput } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";

const protocols: Record<string, string> = { "1": "TCP", "2": "UDP", "3": "TCP + UDP" };

export function InstanceNAT({ instanceId, disabled }: { instanceId: string; disabled?: boolean }) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["instances", instanceId, "nat"], queryFn: () => consoleApi.instanceNATRules(instanceId) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<InstanceNATInput>({ name: "", external: "", internal: "", protocol: "3" });
  const [error, setError] = useState("");
  const refresh = () => cache.invalidateQueries({ queryKey: ["instances", instanceId, "nat"] });
  const create = useMutation({
    mutationFn: () => consoleApi.createInstanceNATRule(instanceId, form),
    onSuccess: () => { setOpen(false); setForm({ name: "", external: "", internal: "", protocol: "3" }); setError(""); return refresh(); },
    onError: (cause) => setError(getApiMessage(cause)),
  });
  const remove = useMutation({
    mutationFn: (ruleId: string) => consoleApi.deleteInstanceNATRule(instanceId, ruleId),
    onSuccess: () => refresh(),
    onError: (cause) => setError(getApiMessage(cause)),
  });
  const submit = () => {
    setError("");
    if (!form.name.trim() || !form.internal.trim()) { setError("请填写规则名称和内部端口"); return; }
    create.mutate();
  };
  return <LayerCard className="grid gap-4 px-5 py-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-kumo-strong">NAT 转发</h2><p className="text-base text-kumo-subtle">将公网端口转发到实例内部端口，支持 TCP、UDP 或两者同时。</p></div>
      <Button disabled={disabled} onClick={() => { setError(""); setOpen(true); }}>创建转发</Button>
    </div>
    {error ? <Banner variant="error" title={error} /> : null}
    {query.error ? <Banner variant="error" title={getApiMessage(query.error)} /> : null}
    <div className="overflow-x-auto">
      <Table>
        <Table.Header><Table.Row><Table.Head>名称</Table.Head><Table.Head>外部地址</Table.Head><Table.Head>内部端口</Table.Head><Table.Head>协议</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header>
        <Table.Body>
          {(query.data ?? []).map((rule) => <Table.Row key={rule.id}>
            <Table.Cell>{rule.name}</Table.Cell>
            <Table.Cell>{rule.external || "—"}</Table.Cell>
            <Table.Cell>{rule.internal}</Table.Cell>
            <Table.Cell>{rule.protocol}</Table.Cell>
            <Table.Cell><Button variant="ghost" size="sm" disabled={disabled || remove.isPending} onClick={() => { if (window.confirm(`确认删除 NAT 规则「${rule.name}」？`)) remove.mutate(rule.id); }}>删除</Button></Table.Cell>
          </Table.Row>)}
          {!query.isLoading && !query.error && !query.data?.length ? <Table.Row><Table.Cell colSpan={5}>暂无 NAT 转发规则</Table.Cell></Table.Row> : null}
        </Table.Body>
      </Table>
    </div>
    <LayerDialog.Root open={open} onOpenChange={(value) => { if (!create.isPending) setOpen(value); }}>
      <LayerDialog.Content size="sm" closeLabel="关闭">
        <LayerDialog.Title>创建 NAT 转发</LayerDialog.Title>
        <LayerDialog.Description>外部端口留空时由上游自动分配。</LayerDialog.Description>
        <LayerDialog.Body><div className="grid gap-3">
          <Input label="名称" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={255} />
          <Input label="外部端口" inputMode="numeric" value={form.external} onChange={(event) => setForm({ ...form, external: event.target.value.replace(/\D/g, "") })} description="留空自动分配，范围 1-65535" />
          <Input label="内部端口" inputMode="numeric" value={form.internal} onChange={(event) => setForm({ ...form, internal: event.target.value.replace(/\D/g, "") })} />
          <Select label="协议" value={form.protocol ?? "3"} items={protocols} onValueChange={(value) => value && setForm({ ...form, protocol: value })} />
          {error ? <Banner variant="error" title={error} /> : null}
        </div></LayerDialog.Body>
        <LayerDialog.Actions dismissLabel="取消"><LayerDialog.Action loading={create.isPending} onClick={submit}>创建</LayerDialog.Action></LayerDialog.Actions>
      </LayerDialog.Content>
    </LayerDialog.Root>
  </LayerCard>;
}
