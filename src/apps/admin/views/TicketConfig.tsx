import { Banner, Button, Dialog, Input, LayerCard, Switch, Table, Textarea } from "@cloudflare/kumo";
import { PencilSimpleIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getApiMessage } from "../../../shared/api/request";
import { adminTicketApi, type TicketPrereply, type TicketStatus, type TicketType } from "../../../shared/api/tickets";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { TicketStatusBadge } from "../../../shared/components/tickets/TicketStatusBadge";

function EditTrigger({ label, editing }: { label: string; editing: boolean }) {
  return editing ? (
    <Button variant="ghost" shape="square" icon={<PencilSimpleIcon />} title={label} aria-label={label} />
  ) : (
    <Button icon={<PlusIcon />}>{label}</Button>
  );
}

function DialogHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex justify-between gap-4">
      <div>
        <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
        <Dialog.Description className="text-kumo-subtle">{description}</Dialog.Description>
      </div>
      <Dialog.Close render={<Button variant="ghost" shape="square" icon={<XIcon />} title="关闭" aria-label="关闭" />} />
    </div>
  );
}

function TypeDialog({ value, onSaved, onError }: { value?: TicketType; onSaved: () => void; onError: (message: string) => void }) {
  const [name, setName] = useState(value?.name ?? "");
  const mutation = useMutation({
    mutationFn: () => adminTicketApi.saveType(value?.id, { name }),
    onSuccess: onSaved,
    onError: (reason) => onError(getApiMessage(reason)),
  });
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<EditTrigger label={value ? `编辑 ${value.name}` : "新增类型"} editing={Boolean(value)} />} />
      <Dialog className="grid gap-5 p-6">
        <DialogHeading title={`${value ? "编辑" : "新增"}工单类型`} description="类型用于客户创建工单和后台分流。" />
        <Input label="类型名称" value={name} onChange={(event) => setName(event.target.value)} />
        <div className="flex justify-end gap-2">
          <Dialog.Close render={<Button variant="secondary">取消</Button>} />
          <Button loading={mutation.isPending} disabled={!name.trim()} onClick={() => mutation.mutate()}>保存</Button>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

export function TicketTypes() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tickets", "admin", "types"], queryFn: adminTicketApi.types });
  const [error, setError] = useState<string | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["tickets", "admin", "types"] });
  const remove = useMutation({ mutationFn: adminTicketApi.deleteType, onSuccess: refresh, onError: (reason) => setError(getApiMessage(reason)) });
  return (
    <>
      <PageHeader title="工单类型" description="维护客户创建工单时可选的业务分类。" actions={<TypeDialog onSaved={refresh} onError={setError} />} />
      {error ? <Banner variant="error" title="操作失败" description={error} /> : null}
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !query.data?.length}>
        <LayerCard className="shadow-none p-0">
          <Table>
            <Table.Header variant="compact"><Table.Row><Table.Head>类型名称</Table.Head><Table.Head>创建时间</Table.Head><Table.Head className="w-28">操作</Table.Head></Table.Row></Table.Header>
            <Table.Body>{(query.data ?? []).map((item) => <Table.Row key={item.id}><Table.Cell>{item.name}</Table.Cell><Table.Cell>{item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN") : "—"}</Table.Cell><Table.Cell><div className="flex gap-1"><TypeDialog value={item} onSaved={refresh} onError={setError} /><Button variant="ghost" shape="square" icon={<TrashIcon />} title={`删除 ${item.name}`} aria-label={`删除 ${item.name}`} loading={remove.isPending} onClick={() => remove.mutate(item.id)} /></div></Table.Cell></Table.Row>)}</Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </>
  );
}

function StatusDialog({ value, onSaved, onError }: { value?: TicketStatus; onSaved: () => void; onError: (message: string) => void }) {
  const [name, setName] = useState(value?.name ?? "");
  const [color, setColor] = useState(value?.color ?? "#779500");
  const [final, setFinal] = useState(value?.final ?? false);
  const [isDefault, setIsDefault] = useState(value?.isDefault ?? false);
  const mutation = useMutation({ mutationFn: () => adminTicketApi.saveStatus(value?.id, { name, color, final, isDefault }), onSuccess: onSaved, onError: (reason) => onError(getApiMessage(reason)) });
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<EditTrigger label={value ? `编辑 ${value.name}` : "新增状态"} editing={Boolean(value)} />} />
      <Dialog className="grid gap-5 p-6">
        <DialogHeading title={`${value ? "编辑" : "新增"}工单状态`} description="颜色字段映射到 Kumo 语义 Badge，不引入自定义视觉色。" />
        <Input label="状态名称" value={name} onChange={(event) => setName(event.target.value)} />
        <Input label="颜色（#RRGGBB）" value={color} onChange={(event) => setColor(event.target.value)} />
        <Switch checked={final} onCheckedChange={setFinal} label="完结状态" />
        <Switch checked={isDefault} onCheckedChange={setIsDefault} label="创建工单时默认" />
        <div className="flex justify-end gap-2"><Dialog.Close render={<Button variant="secondary">取消</Button>} /><Button loading={mutation.isPending} disabled={!name.trim() || !/^#[0-9a-fA-F]{6}$/.test(color)} onClick={() => mutation.mutate()}>保存</Button></div>
      </Dialog>
    </Dialog.Root>
  );
}

export function TicketStatuses() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tickets", "admin", "statuses"], queryFn: adminTicketApi.statuses });
  const [error, setError] = useState<string | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["tickets", "admin", "statuses"] });
  const remove = useMutation({ mutationFn: adminTicketApi.deleteStatus, onSuccess: refresh, onError: (reason) => setError(getApiMessage(reason)) });
  return (
    <>
      <PageHeader title="工单状态" description="系统状态可改名称与展示属性，核心流转状态不可删除。" actions={<StatusDialog onSaved={refresh} onError={setError} />} />
      {error ? <Banner variant="error" title="操作失败" description={error} /> : null}
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !query.data?.length}>
        <LayerCard className="shadow-none p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>状态</Table.Head><Table.Head>颜色配置</Table.Head><Table.Head>属性</Table.Head><Table.Head className="w-28">操作</Table.Head></Table.Row></Table.Header><Table.Body>{(query.data ?? []).map((item) => <Table.Row key={item.id}><Table.Cell><TicketStatusBadge status={item} /></Table.Cell><Table.Cell>{item.color}</Table.Cell><Table.Cell>{item.final ? "已完结" : "处理中"}{item.isDefault ? " · 默认" : ""}</Table.Cell><Table.Cell><div className="flex gap-1"><StatusDialog value={item} onSaved={refresh} onError={setError} /><Button variant="ghost" shape="square" icon={<TrashIcon />} title={`删除 ${item.name}`} aria-label={`删除 ${item.name}`} disabled={Number(item.id) <= 5} loading={remove.isPending} onClick={() => remove.mutate(item.id)} /></div></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
      </PageState>
    </>
  );
}

function PrereplyDialog({ value, onSaved, onError }: { value?: TicketPrereply; onSaved: () => void; onError: (message: string) => void }) {
  const [content, setContent] = useState(value?.content ?? "");
  const [sort, setSort] = useState(value?.sort ?? 0);
  const mutation = useMutation({ mutationFn: () => adminTicketApi.savePrereply(value?.id, { content, sort }), onSuccess: onSaved, onError: (reason) => onError(getApiMessage(reason)) });
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<EditTrigger label={value ? "编辑预设回复" : "新增预设回复"} editing={Boolean(value)} />} />
      <Dialog className="grid gap-5 p-6">
        <DialogHeading title={`${value ? "编辑" : "新增"}预设回复`} description="客服可在回复工单时一键填入。" />
        <Textarea label="回复内容" rows={8} value={content} onChange={(event) => setContent(event.target.value)} />
        <Input label="排序" type="number" value={String(sort)} onChange={(event) => setSort(Number(event.target.value) || 0)} />
        <div className="flex justify-end gap-2"><Dialog.Close render={<Button variant="secondary">取消</Button>} /><Button loading={mutation.isPending} disabled={!content.trim()} onClick={() => mutation.mutate()}>保存</Button></div>
      </Dialog>
    </Dialog.Root>
  );
}

export function TicketPrereplies() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tickets", "admin", "prereplies"], queryFn: adminTicketApi.prereplies });
  const [error, setError] = useState<string | null>(null);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["tickets", "admin", "prereplies"] });
  const remove = useMutation({ mutationFn: adminTicketApi.deletePrereply, onSuccess: refresh, onError: (reason) => setError(getApiMessage(reason)) });
  return (
    <>
      <PageHeader title="预设回复" description="维护客服常用回复模板及显示顺序。" actions={<PrereplyDialog onSaved={refresh} onError={setError} />} />
      {error ? <Banner variant="error" title="操作失败" description={error} /> : null}
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !query.data?.length}>
        <LayerCard className="shadow-none p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>排序</Table.Head><Table.Head>回复内容</Table.Head><Table.Head className="w-28">操作</Table.Head></Table.Row></Table.Header><Table.Body>{(query.data ?? []).map((item) => <Table.Row key={item.id}><Table.Cell>{item.sort}</Table.Cell><Table.Cell><p className="max-w-3xl whitespace-pre-wrap">{item.content}</p></Table.Cell><Table.Cell><div className="flex gap-1"><PrereplyDialog value={item} onSaved={refresh} onError={setError} /><Button variant="ghost" shape="square" icon={<TrashIcon />} title="删除预设回复" aria-label="删除预设回复" loading={remove.isPending} onClick={() => remove.mutate(item.id)} /></div></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
      </PageState>
    </>
  );
}
