import { Dialog, DialogPresence } from "../../../shared/components/Dialog";
import { Banner, Button, Input, LayerDialog, Select, Switch, Tabs, Text } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, CaretRightIcon, FolderIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useRef, useState } from "react";
import { navigationApi, type NavigationCategory, type NavigationInput, type NavigationNode, type NavigationScope } from "../../../shared/api/navigation";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { DragHandle, SortableList } from "../../../shared/components/SortableTableBody";
import { navigationChanged } from "../../../shared/hooks/useNavigation";
import { navigationIcon, navigationIcons } from "../../../shared/utils/navigationIcons";

const UNCATEGORIZED = "未分类";

function CategoryManager({ open, close, categories, reload }: {
 open: boolean; close: () => void; categories: NavigationCategory[]; reload: () => Promise<unknown>;
}) {
 const [name, setName] = useState("");
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [drafts, setDrafts] = useState<Record<string, string>>({});
 const run = async (operation: () => Promise<unknown>) => {
  setBusy(true); setError(null);
  try { await operation(); setDrafts({}); await reload(); }
  catch (cause) { setError(getApiMessage(cause)); }
  finally { setBusy(false); }
 };
 const move = (index: number, delta: number) => {
  const ids = categories.map((row) => row.id);
  if (index + delta < 0 || index + delta >= ids.length) return;
  [ids[index], ids[index + delta]] = [ids[index + delta]!, ids[index]!];
  void run(() => navigationApi.sortCategories(ids));
 };
 return <LayerDialog.Root open={open} onOpenChange={value => { if (!value && !busy) close(); }}>
  <LayerDialog.Content size="lg">
   <LayerDialog.Title>管理大类</LayerDialog.Title>
   <LayerDialog.Description>大类是侧栏的一级分组，改名会同步到该大类下的所有分类，删除前需先移走其中的分类。</LayerDialog.Description>
   <LayerDialog.Body>
    <div className="grid gap-2">
     {categories.map((row, index) => <div key={row.id} className="flex items-center gap-2 rounded-lg border border-kumo-line bg-kumo-base px-3 py-2">
      <span className="w-6 shrink-0 text-sm tabular-nums text-kumo-subtle">{index + 1}</span>
      <Input className="min-w-0 flex-1" aria-label={`大类 ${row.name}`} maxLength={32} value={drafts[row.id] ?? row.name} disabled={busy}
       onChange={event => setDrafts(current => ({ ...current, [row.id]: event.target.value }))}
       onBlur={() => { const next = (drafts[row.id] ?? row.name).trim(); if (next && next !== row.name) void run(() => navigationApi.saveCategory(next, row.id)); }} />
      <Button variant="ghost" shape="square" icon={<ArrowUpIcon />} aria-label={`上移 ${row.name}`} disabled={busy || index === 0} onClick={() => move(index, -1)} />
      <Button variant="ghost" shape="square" icon={<ArrowDownIcon />} aria-label={`下移 ${row.name}`} disabled={busy || index === categories.length - 1} onClick={() => move(index, 1)} />
      <Button variant="ghost" shape="square" icon={<TrashIcon />} aria-label={`删除 ${row.name}`} disabled={busy} onClick={() => void run(() => navigationApi.removeCategory(row.id))} />
     </div>)}
     {!categories.length ? <p className="py-3 text-base text-kumo-subtle">还没有大类，先在下方添加一个。</p> : null}
    </div>
    <div className="my-5 h-px bg-kumo-line" />
    <div className="grid gap-2"><Text variant="heading">新增大类</Text><div className="flex items-end gap-2"><Input className="min-w-0 flex-1" label="名称" maxLength={32} placeholder="例如：服务保障" value={name} disabled={busy} onChange={event => setName(event.target.value)} /><Button loading={busy} disabled={!name.trim()} onClick={() => void run(async () => { await navigationApi.saveCategory(name.trim()); setName(""); })}>添加</Button></div></div>
    {error ? <p role="alert" className="mt-3 text-sm text-kumo-danger">{error}</p> : null}
   </LayerDialog.Body>
   <LayerDialog.Actions dismissLabel="关闭"><LayerDialog.Action variant="primary" disabled={busy} onClick={close}>完成</LayerDialog.Action></LayerDialog.Actions>
  </LayerDialog.Content>
 </LayerDialog.Root>;
}

function Editor({ node, parentId, busy, error, save, close, categoryNames }: {
 node?: NavigationNode; parentId: string; busy: boolean; error: string | null;
 save: (value: NavigationInput) => void; close: () => void; categoryNames: string[];
}) {
 const [value, setValue] = useState<NavigationInput>(() => ({
  parentId, name: node?.name ?? "", href: node?.href ?? "", icon: node?.icon ?? "FolderIcon", target: node?.target ?? "self", enabled: node?.enabled ?? true,
  category: node?.category ?? "",
 }));
 const Icon = navigationIcon(value.icon);
 return <LayerDialog.Root open onOpenChange={open => { if (!open && !busy) close(); }}>
  <LayerDialog.Content size="base">
   <LayerDialog.Title>{node ? "编辑" : "新增"}{parentId === "0" ? "分类" : "菜单项"}</LayerDialog.Title>
   <LayerDialog.Description>此配置仅影响导航入口，页面访问权限仍由原有权限与插件开关控制。</LayerDialog.Description>
   <LayerDialog.Body>
    <div className="grid gap-4">
     <Input label="名称" required maxLength={80} value={value.name} onChange={event => setValue({ ...value, name: event.target.value })} />
     {parentId === "0"
       ? <Select label="大类" value={value.category || categoryNames[0] || UNCATEGORIZED} items={Object.fromEntries(categoryNames.map((category) => [category, category]))} onValueChange={category => setValue({ ...value, category: category ?? "" })} />
       : <>
         <Input label="跳转地址" required maxLength={2048} placeholder="/console/orders 或 https://example.com" value={value.href} onChange={event => setValue({ ...value, href: event.target.value })} />
         <Select label="跳转方式" value={value.target} items={{ self: "本页跳转", blank: "新增页面跳转" }} onValueChange={target => setValue({ ...value, target: target === "blank" ? "blank" : "self" })} />
       </>}
     <div className="flex items-end gap-3"><Select label="系统图标" value={value.icon} items={Object.fromEntries(Object.keys(navigationIcons).map(key => [key, key]))} onValueChange={icon => setValue({ ...value, icon: icon ?? "FolderIcon" })} /><Icon size={24} aria-label="图标预览" /></div>
     <div className="h-px bg-kumo-line" />
     <Switch label="启用" checked={value.enabled} onCheckedChange={enabled => setValue({ ...value, enabled })} />
     {error && <Banner variant="error" title="保存失败" description={error} />}
    </div>
   </LayerDialog.Body>
   <LayerDialog.Actions dismissLabel="取消"><LayerDialog.Action variant="primary" loading={busy} disabled={!value.name.trim() || (parentId !== "0" && !value.href.trim())} onClick={() => save(value)}>保存</LayerDialog.Action></LayerDialog.Actions>
  </LayerDialog.Content>
 </LayerDialog.Root>;
}

export function Navigation() {
 const [scope, setScope] = useState<NavigationScope>("console");
 const [entry, setEntry] = useState("front");
 const client = useQueryClient();
 const query = useQuery({ queryKey: ["navigation", "manage", scope], queryFn: () => navigationApi.list(scope, true) });
 const categoryQuery = useQuery({ queryKey: ["navigation", "categories"], queryFn: navigationApi.categories });
 const [managingCategories, setManagingCategories] = useState(false);
 const [editing, setEditing] = useState<{ node?: NavigationNode; parentId: string } | null>(null);
 const [removing, setRemoving] = useState<NavigationNode | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [busy, setBusy] = useState(false);
 const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
 const lock = useRef(false);
 const nodes = query.data?.nodes ?? [];
 const categoryRows = categoryQuery.data ?? [];
 const categoryNames = categoryRows.map(row => row.name);
 const children = (parentId: string) => nodes.filter(node => node.parentId === parentId);
 const submit = async (operation: () => Promise<unknown>) => {
  if (lock.current || !query.data) return;
  lock.current = true; setBusy(true); setError(null);
  try { await operation(); setEditing(null); setRemoving(null); await navigationChanged(client); }
  catch (cause) { setError(getApiMessage(cause)); await query.refetch(); }
  finally { lock.current = false; setBusy(false); }
 };
 const sort = (parentId: string, ids: string[]) => {
  const expected = children(parentId);
  if (ids.length !== expected.length || new Set(ids).size !== expected.length || ids.some(id => !expected.some(node => node.id === id))) { setError("当前层级数据不完整，请刷新后重试"); return; }
  void submit(() => navigationApi.sort(scope, query.data!.revision, parentId, ids));
 };
 const shift = (node: NavigationNode, delta: number) => {
  const ids = children(node.parentId).map(row => row.id); const i = ids.indexOf(node.id);
  if (i + delta < 0 || i + delta >= ids.length) return;
  [ids[i], ids[i + delta]] = [ids[i + delta]!, ids[i]!]; sort(node.parentId, ids);
 };
 const payload = (node: NavigationNode, enabled: boolean): NavigationInput => {
  const { parentId, name, href, icon, target, category } = node;
  return { parentId, name, href, icon, target, category, enabled };
 };
 const actions = (node: NavigationNode) => <div className="flex shrink-0 items-center gap-1">
  <Switch aria-label={`启用 ${node.name}`} checked={node.enabled} disabled={busy} onCheckedChange={enabled => void submit(() => navigationApi.save(scope, query.data!.revision, payload(node, enabled), node.id))} />
  <Button variant="ghost" shape="square" icon={<ArrowUpIcon />} aria-label={`上移 ${node.name}`} disabled={busy || children(node.parentId)[0]?.id === node.id} onClick={() => shift(node, -1)} />
  <Button variant="ghost" shape="square" icon={<ArrowDownIcon />} aria-label={`下移 ${node.name}`} disabled={busy || children(node.parentId).at(-1)?.id === node.id} onClick={() => shift(node, 1)} />
  <Button variant="ghost" shape="square" icon={<PencilSimpleIcon />} aria-label={`编辑 ${node.name}`} disabled={busy} onClick={() => { setError(null); setEditing({ node, parentId: node.parentId }); }} />
  <Button variant="ghost" shape="square" icon={<TrashIcon />} aria-label={`删除 ${node.name}`} disabled={busy} onClick={() => { setError(null); setRemoving(node); }} />
 </div>;
 const branch = (group: NavigationNode) => {
  const Icon = navigationIcon(group.icon);
  const open = !collapsed[group.id];
  const items = children(group.id);
  return <div key={group.id} data-sort-id={group.id} className="sort-item relative rounded-lg border border-kumo-line bg-kumo-base">
   <span aria-hidden className="absolute -top-2 -left-px h-2 w-px bg-kumo-line" />
   <span aria-hidden className="absolute top-6 -left-4 h-px w-4 bg-kumo-line" />
   <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
    <Button variant="ghost" shape="square" icon={open ? <CaretDownIcon /> : <CaretRightIcon />} aria-label={`${open ? "折叠" : "展开"} ${group.name}`} onClick={() => setCollapsed(current => ({ ...current, [group.id]: open }))} />
    <DragHandle scope="navigation-groups" label={`拖拽分类 ${group.name}`} disabled={busy} />
    <Icon size={18} />
    <Text variant="heading">{group.name}</Text>
    <span className="rounded-full bg-kumo-recessed px-2 py-0.5 text-xs text-kumo-subtle">{items.length} 项</span>
    <span className="flex-1" />
    {actions(group)}
    <Button variant="secondary" icon={<PlusIcon />} disabled={busy} onClick={() => { setError(null); setEditing({ parentId: group.id }); }}>新增菜单</Button>
   </div>
   {open && <div className="relative ml-6 border-l border-kumo-line pb-2 pl-4">
    {items.length === 0 ? <p className="py-2 text-base text-kumo-subtle">暂无菜单项</p> : <SortableList scope={`navigation-items-${group.id}`} listId={group.id} disabled={busy} onDrop={drop => sort(group.id, drop.targetIds)}>
     {items.map(node => {
      const ItemIcon = navigationIcon(node.icon);
      return <div key={node.id} data-sort-id={node.id} className="sort-item relative flex flex-wrap items-center gap-3 rounded-md py-2 pr-2">
       <span aria-hidden className="absolute top-6 -left-4 h-px w-4 bg-kumo-line" />
       <DragHandle scope={`navigation-items-${group.id}`} label={`拖拽菜单 ${node.name}`} disabled={busy} /><ItemIcon size={16} /><div className="min-w-0 flex-1"><Text>{node.name}</Text><p className="break-all text-base text-kumo-subtle">{node.href} · {node.target === "blank" ? "新增页面跳转" : "本页跳转"}</p>{node.gate && <Text variant="secondary">{node.gate.startsWith('/admin/todos') ? "仅超级管理员可见" : "受插件开关控制"}</Text>}</div>{actions(node)}
      </div>;
     })}
    </SortableList>}
   </div>}
  </div>;
 };
 const groups = children("0");
 return <>
  <PageHeader title="路由管理" description="按大类分支树配置用户中心、销售端与后台的侧栏导航。拖拽手柄可调整同级顺序。" actions={<div className="flex gap-2"><Button variant="secondary" icon={<FolderIcon />} disabled={busy} onClick={() => setManagingCategories(true)}>管理大类</Button><Button icon={<PlusIcon />} disabled={busy || !query.data} onClick={() => { setError(null); setEditing({ parentId: "0" }); }}>新增分类</Button></div>} />
  <Tabs variant="underline" value={entry} onValueChange={value => { if (!busy) { setEntry(value); setScope(value === "admin" ? "admin" : "console"); setError(null); } }} tabs={[{ value: "front", label: "前台" }, { value: "admin", label: "后台" }]} />
  {entry === "front" && <Select label="前台入口" value={scope} disabled={busy} items={{ console: "用户中心", sales: "销售端" }} onValueChange={value => { setScope(value === "sales" ? "sales" : "console"); setError(null); }} />}
  {error && !editing && <Banner variant="error" title="操作失败，顺序已恢复" description={error} />}
  <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !nodes.length} emptyTitle="暂无导航分类">
   <div className="relative grid gap-1 pl-4">
    <span aria-hidden className="absolute top-0 bottom-0 left-0 w-px bg-kumo-line" />
    <SortableList scope="navigation-groups" listId="0" disabled={busy} onDrop={drop => sort("0", drop.targetIds)}>
     {[...categoryNames, UNCATEGORIZED].map(category => {
      const section = groups.filter(group => (group.category || UNCATEGORIZED) === category);
      if (!section.length) return null;
      return <Fragment key={category}>
       <div className="mt-3 flex items-center gap-3 first:mt-0">
        <span aria-hidden className="absolute left-0 h-px w-4 bg-kumo-line" />
        <h2 className="text-sm font-semibold tracking-wide text-kumo-subtle">{category}</h2>
        <span className="h-px flex-1 bg-kumo-line" />
        <span className="text-xs text-kumo-subtle">{section.length} 个分类</span>
       </div>
       <div className="grid gap-2 pl-4">{section.map(branch)}</div>
      </Fragment>;
     })}
    </SortableList>
   </div>
  </PageState>
  <CategoryManager open={managingCategories} close={() => setManagingCategories(false)} categories={categoryRows} reload={() => categoryQuery.refetch()} />
  <DialogPresence>{editing && <Editor key={editing.node?.id ?? editing.parentId} {...editing} busy={busy} error={error} close={() => setEditing(null)} save={value => void submit(() => navigationApi.save(scope, query.data!.revision, value, editing.node?.id))} categoryNames={categoryNames} />}</DialogPresence>
  <Dialog.Root open={Boolean(removing)} onOpenChange={open => { if (!open && !busy) setRemoving(null); }}><Dialog className="grid gap-4 p-8"><Dialog.Title>删除“{removing?.name}”</Dialog.Title><Dialog.Description>{removing?.parentId === "0" ? "分类及其全部菜单项将被移除。" : "该导航入口将被移除。"}实际页面与访问权限不会改变。</Dialog.Description><div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setRemoving(null)}>取消</Button><Button variant="destructive" loading={busy} onClick={() => { if (removing) void submit(() => navigationApi.remove(scope, query.data!.revision, removing.id)); }}>删除</Button></div></Dialog></Dialog.Root>
 </>;
}
