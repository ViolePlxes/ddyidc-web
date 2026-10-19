import { Dialog, DialogPresence } from "../../../shared/components/Dialog";
import { Banner, Button, Input, LayerCard, Select, Switch, Table } from "@cloudflare/kumo";
import { PencilSimpleIcon, PlusIcon, PlugsConnectedIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiMessage } from "../../../shared/api/request";
import { adapterModulesApi, upstreamAdminApi, type SupplierInput, type UpstreamSupplier } from "../../../shared/api/upstreamAdmin";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

function supplierInput(supplier?: UpstreamSupplier): SupplierInput {
  return {
    name: supplier?.name ?? "",
    type: supplier?.type ?? "finance",
    url: supplier?.url ?? "",
    username: supplier?.username ?? "",
    token: "",
    secret: "",
    rate: supplier?.rate ?? 1,
    currencyCode: supplier?.currencyCode || "CNY",
    status: supplier?.status ?? 1,
    remark: supplier?.remark ?? "",
  };
}

function SupplierDialog({ supplier, onClose }: { supplier?: UpstreamSupplier; onClose: () => void }) {
  const client = useQueryClient();
  const [form, setForm] = useState(() => supplierInput(supplier));
  const modules=useQuery({queryKey:["admin","adapter-module-options"],queryFn:adapterModulesApi.options});
  const available=modules.data?.filter(m=>m.capabilities.purchase==="implemented")??[];
  const systemTypes=Object.fromEntries(available.flatMap(m=>m.variants.map(v=>[v,`${m.name} / ${v}`])));
  if(supplier&&!systemTypes[supplier.type])systemTypes[supplier.type]=`${supplier.type}（保留原协议）`;

  const credentialFields=(modules.data?.find(module=>module.variants.includes(form.type))?.configFields??[]).filter(field=>["username","token","secret"].includes(field.name));
  const save = useMutation({
    mutationFn: () => supplier
      ? upstreamAdminApi.updateSupplier(supplier.id, form)
      : upstreamAdminApi.createSupplier(form),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["admin", "upstream-suppliers"] });
      onClose();
    },
  });
  const invalid = !form.name.trim() || !form.url.trim() || (!supplier && credentialFields.some(field=>field.required&&!form[field.name as "username"|"token"|"secret"].trim())) || form.rate <= 0;
  const update = <K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog size="lg" className="grid max-h-[90vh] gap-4 overflow-y-auto p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-2xl font-semibold">{supplier ? "编辑供应商" : "新增供应商"}</Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">凭据仅提交到服务端加密保存，列表接口不会返回凭据。</Dialog.Description>
          </div>
          <Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" onClick={onClose} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="供应商名称" required value={form.name} onChange={(event) => update("name", event.target.value)} />
          <Select disabled={Boolean(supplier)||modules.isPending||Boolean(modules.error)} label="系统类型" value={form.type} onValueChange={(value) => value && update("type", value as SupplierInput["type"])} items={systemTypes} />
          <Input className="sm:col-span-2" label="接口地址" required placeholder="https://provider.example.com" value={form.url} onChange={(event) => update("url", event.target.value)} description="保存时自动移除末尾斜杠" />
          {credentialFields.map(field=>{const name=field.name as "username"|"token"|"secret";return <Input key={name} label={`${field.label}${supplier&&field.secret?"（留空不修改）":""}`} required={!supplier&&field.required} type={field.secret?"password":"text"} autoComplete={field.secret?"new-password":"off"} value={form[name]} onChange={event=>update(name,event.target.value)}/>;})}
          <Input label="汇率" type="number" min={0.0001} step="0.0001" value={form.rate} onChange={(event) => update("rate", Number(event.target.value))} />
          <Input label="币种" value={form.currencyCode} onChange={(event) => update("currencyCode", event.target.value.toUpperCase())} />
          <Input className="sm:col-span-2" label="备注" value={form.remark} onChange={(event) => update("remark", event.target.value)} />
          <Switch className="sm:col-span-2" label="启用供应商" checked={form.status === 1} onCheckedChange={(checked) => update("status", checked ? 1 : 2)} />
        </div>
        {modules.error ? <Banner variant="error" title="无法读取对接能力" description={getApiMessage(modules.error)}/> : null}
        {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button loading={save.isPending} disabled={invalid||modules.isPending||Boolean(modules.error)} onClick={() => save.mutate()}>保存供应商</Button>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

function SnapshotDialog({supplier,onClose}:{supplier:UpstreamSupplier;onClose:()=>void}){
 const client=useQueryClient();
 const [enabled,setEnabled]=useState(supplier.snapshotSync?.enabled??true);
 const [minutes,setMinutes]=useState(supplier.snapshotSync?.intervalMinutes??120);
 const save=useMutation({mutationFn:()=>upstreamAdminApi.configureSnapshot(supplier.id,enabled,minutes),onSuccess:async()=>{await client.invalidateQueries({queryKey:["admin","upstream-suppliers"]});onClose()}});
 return <Dialog.Root open onOpenChange={open=>{if(!open)onClose()}}><Dialog className="grid gap-4 p-8"><Dialog.Title>信息同步设置</Dialog.Title><Dialog.Description>定期同步已关联机器的到期信息、IP 和当前周期续费原价。与手动同步互斥，失败时保留上次有效信息。</Dialog.Description><Switch label="启用定时同步" checked={enabled} onCheckedChange={setEnabled}/><Input label="同步间隔（分钟）" type="number" min={15} max={1440} value={minutes} onChange={event=>setMinutes(Number(event.target.value))} description="默认 120 分钟，允许 15 至 1440 分钟。关闭定时同步后仍可手动同步。"/>{save.error?<Banner variant="error" title="保存失败" description={getApiMessage(save.error)}/>:null}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button disabled={!Number.isInteger(minutes)||minutes<15||minutes>1440} loading={save.isPending} onClick={()=>save.mutate()}>保存</Button></div></Dialog></Dialog.Root>;
}
const snapshotLabels:Record<string,string>={never:"尚未同步",running:"同步中",success:"同步完成",partial:"部分失败",failed:"同步失败",interrupted:"同步中断"};

export function UpstreamSuppliers() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "upstream-suppliers"], queryFn: upstreamAdminApi.suppliers });
  const moduleOptions = useQuery({queryKey:["admin","adapter-module-options"],queryFn:adapterModulesApi.options});
  const [editing, setEditing] = useState<UpstreamSupplier | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UpstreamSupplier | null>(null);
  const [message, setMessage] = useState("");
  const [syncSettings,setSyncSettings]=useState<UpstreamSupplier|null>(null);
  const sync=useMutation({mutationFn:(supplier:UpstreamSupplier)=>upstreamAdminApi.startSnapshot(supplier.id),onSuccess:async(data)=>{setMessage(data.message||"同步任务已提交");await refresh()},onError:error=>setMessage(`同步失败：${getApiMessage(error)}`)});
  const refresh = () => client.invalidateQueries({ queryKey: ["admin", "upstream-suppliers"] });
  const updateStatus = useMutation({
    mutationFn: ({ supplier, status }: { supplier: UpstreamSupplier; status: number }) => upstreamAdminApi.updateSupplier(supplier.id, { ...supplierInput(supplier), status }),
    onSuccess: refresh,
  });
  const test = useMutation({
    mutationFn: (supplier: UpstreamSupplier) => upstreamAdminApi.testSupplier(supplier.id),
    onSuccess: (_data, supplier) => setMessage(`${supplier.name} 连接测试成功`),
    onError: (error, supplier) => setMessage(`${supplier.name} 连接测试失败：${getApiMessage(error)}`),
  });
  const remove = useMutation({
    mutationFn: (supplier: UpstreamSupplier) => upstreamAdminApi.removeSupplier(supplier.id),
    onSuccess: async (_data, supplier) => {
      setMessage(`${supplier.name} 已删除`);
      setDeleteTarget(null);
      await refresh();
    },
  });
  const suppliers = query.data ?? [];

  return (
    <>
      <PageHeader title="供应商管理" description="列表、凭据维护与连接测试均使用真实上游接口。" actions={<div className="flex gap-2"><Button variant="secondary" onClick={()=>void refresh()}>刷新</Button><Button icon={<PlusIcon />} onClick={() => setEditing("new")}>新增供应商</Button></div>} />
      {message ? <Banner variant={message.includes("失败") ? "error" : "default"} title={message} /> : null}
      {updateStatus.error ? <Banner variant="error" title="状态更新失败" description={getApiMessage(updateStatus.error)} /> : null}
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && suppliers.length === 0} emptyTitle="暂无供应商">
        <LayerCard className="overflow-x-auto p-0">
          <Table>
            <Table.Header variant="compact"><Table.Row><Table.Head>供应商</Table.Head><Table.Head>系统类型</Table.Head><Table.Head>接口地址 / 账号</Table.Head><Table.Head>汇率</Table.Head><Table.Head>状态</Table.Head><Table.Head>上次同步时间</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header>
            <Table.Body>
              {suppliers.map((supplier) => (
                <Table.Row key={supplier.id}>
                  <Table.Cell><div className="grid"><strong className="text-kumo-strong font-medium">{supplier.name}</strong><span className="text-sm text-kumo-subtle">#{supplier.id} · {supplier.remark || "无备注"}</span></div></Table.Cell>
                  <Table.Cell>{moduleOptions.data?.find(module=>module.variants.includes(supplier.type))?.name ?? supplier.type} / {supplier.type}</Table.Cell>
                  <Table.Cell><div className="grid"><span>{supplier.url}</span><span className="text-sm text-kumo-subtle">{supplier.username}</span></div></Table.Cell>
                  <Table.Cell>{supplier.rate.toFixed(4)} {supplier.currencyCode || "CNY"}</Table.Cell>
                  <Table.Cell><Switch label={`启用 ${supplier.name}`} checked={supplier.status === 1} disabled={updateStatus.isPending} onCheckedChange={(checked) => updateStatus.mutate({ supplier, status: checked ? 1 : 2 })} /></Table.Cell>
                  <Table.Cell><div className="grid gap-1"><span>{supplier.lastSyncedAt?new Date(supplier.lastSyncedAt*1000).toLocaleString("zh-CN"):"尚无完整成功同步"}</span><span className="text-sm text-kumo-subtle">{snapshotLabels[supplier.snapshotSync?.state??"never"]??"状态未知"} · {supplier.snapshotSync?.enabled===false?"定时已关闭":`每 ${supplier.snapshotSync?.intervalMinutes??120} 分钟`}</span>{supplier.snapshotSync?.lastAttemptAt?<span className="text-sm text-kumo-subtle">最近尝试 {new Date(supplier.snapshotSync.lastAttemptAt*1000).toLocaleString("zh-CN")} · 完成 {supplier.snapshotSync.completed}/{supplier.snapshotSync.total} · 失败 {supplier.snapshotSync.failed}</span>:null}</div></Table.Cell>
                  <Table.Cell><div className="flex flex-wrap gap-2"><Button variant="secondary" loading={sync.isPending&&sync.variables?.id===supplier.id} disabled={supplier.status!==1||supplier.snapshotSync?.state==="running"} onClick={()=>sync.mutate(supplier)}>同步信息</Button><Button variant="secondary" onClick={()=>setSyncSettings(supplier)}>同步设置</Button>
                    <Button variant="secondary" shape="square" icon={<PlugsConnectedIcon />} aria-label={`测试 ${supplier.name} 连接`} loading={test.isPending && test.variables?.id === supplier.id} onClick={() => test.mutate(supplier)} />
                    <Button variant="secondary" shape="square" icon={<PencilSimpleIcon />} aria-label={`编辑 ${supplier.name}`} onClick={() => setEditing(supplier)} />
                    <Button variant="destructive" shape="square" icon={<TrashIcon />} aria-label={`删除 ${supplier.name}`} onClick={() => setDeleteTarget(supplier)} />
                  </div></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
      <DialogPresence>{syncSettings?<SnapshotDialog supplier={syncSettings} onClose={()=>setSyncSettings(null)}/>:null}</DialogPresence>
      <DialogPresence>{editing ? <SupplierDialog supplier={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} /> : null}</DialogPresence>
      <DialogPresence>{deleteTarget ? <Dialog.Root open onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}><Dialog className="grid gap-4 p-8"><Dialog.Title className="text-2xl font-semibold">删除供应商</Dialog.Title><Dialog.Description className="text-kumo-subtle">确定删除“{deleteTarget.name}”？存在依赖时服务端会拒绝操作。</Dialog.Description>{remove.error ? <Banner variant="error" title="删除失败" description={getApiMessage(remove.error)} /> : null}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeleteTarget(null)}>取消</Button><Button variant="destructive" loading={remove.isPending} onClick={() => remove.mutate(deleteTarget)}>确认删除</Button></div></Dialog></Dialog.Root> : null}</DialogPresence>
    </>
  );
}
