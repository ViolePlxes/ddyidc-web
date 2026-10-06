import { Dialog } from "../../../shared/components/Dialog";
import { Banner, Button, Input, LayerCard, Select, Switch, Tabs, Text } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon, PencilSimpleIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { navigationApi, type NavigationInput, type NavigationNode, type NavigationScope } from "../../../shared/api/navigation";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { DragHandle, SortableList } from "../../../shared/components/SortableTableBody";
import { navigationChanged } from "../../../shared/hooks/useNavigation";
import { navigationIcon, navigationIcons } from "../../../shared/utils/navigationIcons";

function Editor({ node, parentId, busy, error, save, close }: {
 node?: NavigationNode; parentId: string; busy: boolean; error: string | null;
 save: (value: NavigationInput) => void; close: () => void;
}) {
 const [value, setValue] = useState<NavigationInput>(() => ({
  parentId, name: node?.name ?? "", href: node?.href ?? "", icon: node?.icon ?? "FolderIcon", target: node?.target ?? "self", enabled: node?.enabled ?? true,
 }));
 const Icon = navigationIcon(value.icon);
 return <Dialog.Root open onOpenChange={open => { if (!open && !busy) close(); }}>
  <Dialog className="grid gap-5 p-6">
   <div className="flex items-center justify-between"><Dialog.Title>{node ? "编辑" : "新增"}{parentId === "0" ? "分类" : "菜单项"}</Dialog.Title><Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" disabled={busy} onClick={close} /></div>
   <Dialog.Description>此配置仅影响导航入口，页面访问权限仍由原有权限与插件开关控制。</Dialog.Description>
   <Input label="名称" required maxLength={80} value={value.name} onChange={event => setValue({ ...value, name: event.target.value })} />
   {parentId !== "0" && <>
    <Input label="跳转地址" required maxLength={2048} placeholder="/console/orders 或 https://example.com" value={value.href} onChange={event => setValue({ ...value, href: event.target.value })} />
    <Select label="跳转方式" value={value.target} items={{ self: "本页跳转", blank: "新增页面跳转" }} onValueChange={target => setValue({ ...value, target: target === "blank" ? "blank" : "self" })} />
   </>}
   <div className="flex items-end gap-3"><Select label="系统图标" value={value.icon} items={Object.fromEntries(Object.keys(navigationIcons).map(key => [key, key]))} onValueChange={icon => setValue({ ...value, icon: icon ?? "FolderIcon" })} /><Icon size={24} aria-label="图标预览" /></div>
   <Switch label="启用" checked={value.enabled} onCheckedChange={enabled => setValue({ ...value, enabled })} />
   {error && <Banner variant="error" title="保存失败" description={error} />}
   <div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={close}>取消</Button><Button loading={busy} disabled={!value.name.trim() || (parentId !== "0" && !value.href.trim())} onClick={() => save(value)}>保存</Button></div>
  </Dialog>
 </Dialog.Root>;
}

export function Navigation() {
 const [scope, setScope] = useState<NavigationScope>("console");
 const [entry, setEntry] = useState("front");
 const client = useQueryClient();
 const query = useQuery({ queryKey: ["navigation", "manage", scope], queryFn: () => navigationApi.list(scope, true) });
 const [editing, setEditing] = useState<{ node?: NavigationNode; parentId: string } | null>(null);
 const [removing, setRemoving] = useState<NavigationNode | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [busy, setBusy] = useState(false);
 const lock = useRef(false);
 const nodes = query.data?.nodes ?? [];
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
 const actions = (node: NavigationNode) => <div className="flex shrink-0 items-center gap-1">
  <Switch aria-label={`启用 ${node.name}`} checked={node.enabled} disabled={busy} onCheckedChange={enabled => { const {parentId,name,href,icon,target}=node; void submit(() => navigationApi.save(scope,query.data!.revision,{parentId,name,href,icon,target,enabled},node.id)); }} />
  <Button variant="ghost" shape="square" icon={<ArrowUpIcon />} aria-label={`上移 ${node.name}`} disabled={busy || children(node.parentId)[0]?.id === node.id} onClick={() => shift(node,-1)} />
  <Button variant="ghost" shape="square" icon={<ArrowDownIcon />} aria-label={`下移 ${node.name}`} disabled={busy || children(node.parentId).at(-1)?.id === node.id} onClick={() => shift(node,1)} />
  <Button variant="ghost" shape="square" icon={<PencilSimpleIcon />} aria-label={`编辑 ${node.name}`} disabled={busy} onClick={() => {setError(null);setEditing({node,parentId:node.parentId});}} />
  <Button variant="ghost" shape="square" icon={<TrashIcon />} aria-label={`删除 ${node.name}`} disabled={busy} onClick={() => {setError(null);setRemoving(node);}} />
 </div>;
 return <>
  <PageHeader title="路由管理" description="配置用户中心、销售端与后台的侧栏导航。拖拽手柄可调整同级顺序。" actions={<Button icon={<PlusIcon />} disabled={busy || !query.data} onClick={() => {setError(null);setEditing({parentId:"0"});}}>新增分类</Button>} />
  <Tabs value={entry} onValueChange={value => {if(!busy){setEntry(value);setScope(value === "admin" ? "admin" : "console");setError(null);}}} tabs={[{value:"front",label:"前台"},{value:"admin",label:"后台"}]} />
  {entry === "front" && <Select label="前台入口" value={scope} disabled={busy} items={{console:"用户中心",sales:"销售端"}} onValueChange={value => {setScope(value === "sales" ? "sales" : "console");setError(null);}} />}
  {error && !editing && <Banner variant="error" title="操作失败，顺序已恢复" description={error} />}
  <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !nodes.length} emptyTitle="暂无导航分类">
   <SortableList scope="navigation-groups" listId="0" disabled={busy} onDrop={drop => sort("0",drop.targetIds)}>
    {children("0").map(group => {const Icon=navigationIcon(group.icon);return <LayerCard key={group.id} data-sort-id={group.id} className="sort-item grid gap-4 p-4 shadow-none">
     <div className="flex flex-wrap items-center gap-2"><DragHandle scope="navigation-groups" label={`拖拽分类 ${group.name}`} disabled={busy} /><Icon size={20} /><Text variant="heading">{group.name}</Text><span className="flex-1" />{actions(group)}<Button variant="secondary" icon={<PlusIcon />} disabled={busy} onClick={() => {setError(null);setEditing({parentId:group.id});}}>新增菜单</Button></div>
     <SortableList scope={`navigation-items-${group.id}`} listId={group.id} disabled={busy} onDrop={drop => sort(group.id,drop.targetIds)}>
      {children(group.id).map(node => {const ItemIcon=navigationIcon(node.icon);return <div key={node.id} data-sort-id={node.id} className="sort-item flex flex-wrap items-center gap-3 border-b border-kumo-line py-3 last:border-0">
       <DragHandle scope={`navigation-items-${group.id}`} label={`拖拽菜单 ${node.name}`} disabled={busy} /><ItemIcon size={18} /><div className="min-w-0 flex-1"><Text>{node.name}</Text><p className="break-all text-sm text-kumo-subtle">{node.href} · {node.target === "blank" ? "新增页面跳转" : "本页跳转"}</p>{node.gate && <Text variant="secondary">{node.gate.startsWith("/admin/todos") ? "仅超级管理员可见" : "受插件开关控制"}</Text>}</div>{actions(node)}
      </div>;})}
     </SortableList>
    </LayerCard>;})}
   </SortableList>
  </PageState>
  {editing && <Editor key={editing.node?.id ?? editing.parentId} {...editing} busy={busy} error={error} close={() => setEditing(null)} save={value => void submit(() => navigationApi.save(scope,query.data!.revision,value,editing.node?.id))} />}
  {removing && <Dialog.Root open onOpenChange={open => {if(!open&&!busy)setRemoving(null);}}><Dialog className="grid gap-5 p-6"><Dialog.Title>删除“{removing.name}”</Dialog.Title><Dialog.Description>{removing.parentId === "0" ? "分类及其全部菜单项将被移除。" : "该导航入口将被移除。"}实际页面与访问权限不会改变。</Dialog.Description><div className="flex justify-end gap-2"><Button variant="secondary" disabled={busy} onClick={() => setRemoving(null)}>取消</Button><Button variant="destructive" loading={busy} onClick={() => void submit(() => navigationApi.remove(scope,query.data!.revision,removing.id))}>删除</Button></div></Dialog></Dialog.Root>}
 </>;
}
