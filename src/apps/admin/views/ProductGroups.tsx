import { Dialog, DialogPresence } from "../../../shared/components/Dialog";
import { GroupProducts } from "./GroupProducts";
import { invalidateCatalog, publishCatalogChange } from "../../../shared/utils/catalogCache";
import { Banner, Button, Checkbox, Input, LayerCard, Select, Sidebar, Switch } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon, FolderIcon, FolderPlusIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { adminProductGroupsApi, type ProductGroup, type ProductGroupInput } from "../../../shared/api/adminProductGroups";
import { adminProductsApi } from "../../../shared/api/adminProducts";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

function GroupEditor({ group, parentId, onSaved, onDirtyChange, onBusyChange, onCancel }: {
  group?: ProductGroup; parentId: string; onSaved: (id: string) => void;
  onDirtyChange: (dirty: boolean) => void; onBusyChange: (busy: boolean) => void; onCancel: () => void;
}) {
  const client = useQueryClient();
  const [name, setName] = useState(group?.name ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "");
  const [enabled, setEnabled] = useState((group?.status ?? 1) === 1);
  const [notice, setNotice] = useState("");
  const dirty = (nextName: string, nextIcon: string, nextEnabled: boolean) => {
    setNotice("");
    onDirtyChange(nextName !== (group?.name ?? "") || nextIcon !== (group?.icon ?? "") || nextEnabled !== ((group?.status ?? 1) === 1));
  };
  const save = useMutation({
    mutationFn: async () => {
      const input: ProductGroupInput = { name: name.trim(), icon: icon.trim(), parentId, status: enabled ? 1 : 0 };
      if (group) { await adminProductGroupsApi.update(group.id, input); return group.id; }
      return (await adminProductGroupsApi.create(input)).id;
    },
    onMutate: () => onBusyChange(true),
    onSettled: () => onBusyChange(false),
    onSuccess: async (id) => {
      await invalidateCatalog(client); publishCatalogChange();
      onDirtyChange(false); setNotice("分组已保存"); onSaved(id);
    },
  });
  return <fieldset disabled={save.isPending} className="grid gap-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="分组名称" value={name} maxLength={64} onChange={(e) => { setName(e.target.value); dirty(e.target.value, icon, enabled); }} />
      <Input label="图标标识" value={icon} maxLength={255} placeholder="留空使用默认图标" onChange={(e) => { setIcon(e.target.value); dirty(name, e.target.value, enabled); }} />
    </div>
    <Switch label="显示此分组" checked={enabled} disabled={save.isPending} onCheckedChange={(value) => { setEnabled(value); dirty(name, icon, value); }} />
    {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
    {notice ? <Banner variant="default" title={notice} /> : null}
    <div className="flex gap-2"><Button loading={save.isPending} disabled={!name.trim()} onClick={() => save.mutate()}>保存分组</Button><Button variant="secondary" disabled={save.isPending} onClick={onCancel}>取消修改</Button></div>
  </fieldset>;
}
function MoveProductsDialog({ source, targets, onClose }: { source: ProductGroup; targets: ProductGroup[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ["admin", "products", source.id], queryFn: () => adminProductsApi.list(source.id) });
  const [selected, setSelected] = useState<string[]>([]);
  const [targetGroupId, setTargetGroupId] = useState("");
  const move = useMutation({
    mutationFn: () => adminProductGroupsApi.moveProducts(selected, targetGroupId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "product-groups"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
      onClose();
    },
  });
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog size="lg" className="grid max-h-[85vh] gap-4 overflow-y-auto p-8">
        <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-2xl font-semibold">移动商品</Dialog.Title><Dialog.Description className="text-kumo-subtle">从“{source.name}”批量移动到另一个二级分组。</Dialog.Description></div><Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" onClick={onClose} /></div>
        <PageState loading={products.isLoading} error={products.error ? getApiMessage(products.error) : null} empty={!products.isLoading && (products.data?.items.length ?? 0) === 0} emptyTitle="该分组暂无商品">
          <Checkbox.Group legend="选择商品" value={selected} onValueChange={setSelected} className="grid gap-3">
            {(products.data?.items ?? []).map((product) => <Checkbox.Item key={product.id} value={product.id} label={`${product.name}（#${product.id}）`} />)}
          </Checkbox.Group>
        </PageState>
        <Select label="目标二级分组" value={targetGroupId} onValueChange={(value) => setTargetGroupId(value ?? "")} items={Object.fromEntries(targets.filter((item) => item.id !== source.id).map((item) => [item.id, item.name]))} />
        {move.error ? <Banner variant="error" title="移动失败" description={getApiMessage(move.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button loading={move.isPending} disabled={!selected.length || !targetGroupId} onClick={() => move.mutate()}>移动所选商品</Button></div>
      </Dialog>
    </Dialog.Root>
  );
}



export function ProductGroups() {
  const workspace = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = workspace.current;
    if (!element) return;
    const scrollArea = element.closest<HTMLElement>("[data-dashboard-scroll]");
    const updateHeight = () => {
      const bottom = scrollArea?.getBoundingClientRect().bottom ?? window.innerHeight;
      const padding = scrollArea?.firstElementChild ? parseFloat(getComputedStyle(scrollArea.firstElementChild).paddingBottom) || 0 : 16;
      const top = element.getBoundingClientRect().top + (scrollArea?.scrollTop ?? 0);
      element.style.setProperty("--product-workspace-height", `${Math.max(160, bottom - top - padding)}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (element.parentElement) observer.observe(element.parentElement);
    if (scrollArea) observer.observe(scrollArea);
    window.addEventListener("resize", updateHeight);
    return () => { observer.disconnect(); window.removeEventListener("resize", updateHeight); };
  }, []);
  const client = useQueryClient();
  const roots = useQuery({ queryKey: ["admin", "product-groups", "0"], queryFn: () => adminProductGroupsApi.list("0") });
  const childrenQueries = useQueries({ queries: (roots.data?.list ?? []).map((root) => ({ queryKey: ["admin", "product-groups", root.id], queryFn: () => adminProductGroupsApi.list(root.id) })) });
  const children = useMemo(() => childrenQueries.flatMap((q) => q.data?.list ?? []), [childrenQueries]);
  const all = [...(roots.data?.list ?? []), ...children];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState<{ parentId: string } | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const firstExpanded = useRef(false);
  useEffect(() => { const first = roots.data?.list[0]; if (first && !firstExpanded.current) { firstExpanded.current = true; setExpanded(new Set([first.id])); } }, [roots.data]);
  const [dirty, setDirty] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const updateDirty = (value: boolean) => { setDirty(value); if (!value) setNotice(""); };
  const [notice, setNotice] = useState("");
  const [editorRevision, setEditorRevision] = useState(0);
  const [moveSource, setMoveSource] = useState<ProductGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductGroup | null>(null);
  const [targetParent, setTargetParent] = useState("");
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const selected = all.find((group) => group.id === selectedId) ?? roots.data?.list[0];
  const refresh = async () => { await invalidateCatalog(client); publishCatalogChange(); };
  const operation = useMutation({ mutationFn: async (work: () => Promise<unknown>) => work(), onSuccess: refresh });
  const remove = useMutation({ mutationFn: adminProductGroupsApi.remove, onSuccess: async () => { setDeleteTarget(null); setSelectedId(null); await refresh(); } });
  const disabled = pending || operation.isPending || remove.isPending || roots.isFetching || childrenQueries.some((q) => q.isFetching || q.isError);
  const navigate = (id: string | null, parentId?: string) => {
    if (dirty || pending || operation.isPending) { setNotice("请先保存或取消当前修改，再切换分组。"); return; }
    setSelectedId(id); setEditingProduct(false); setCreating(parentId === undefined ? null : { parentId }); setNotice(""); setTargetParent("");
  };
  const reorder = (group: ProductGroup, offset: number) => {
    const siblings = all.filter((g) => g.parentId === group.parentId);
    const index = siblings.findIndex((g) => g.id === group.id), target = index + offset;
    if (target < 0 || target >= siblings.length || disabled || dirty) return;
    const ids = siblings.map((g) => g.id); [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    operation.mutate(() => adminProductGroupsApi.sort(group.parentId, ids));
  };
  const moveGroup = () => {
    if (!selected || !targetParent || selected.parentId === "0" || dirty || disabled) return;
    const group = selected;
    operation.mutate(async () => {
      const [source, target] = await Promise.all([adminProductGroupsApi.list(group.parentId), adminProductGroupsApi.list(targetParent)]);
      if (!source.list.some((g) => g.id === group.id)) throw new Error("分组已变化，请重新读取后重试");
      await adminProductGroupsApi.moveGroup(group.id, targetParent, [...target.list.map((g) => g.id), group.id], source.list.filter((g) => g.id !== group.id).map((g) => g.id));
      setExpanded((old) => new Set([...old, targetParent])); setTargetParent(""); setEditorRevision((v) => v + 1);
    });
  };
  const visibleRoots = (roots.data?.list ?? []).filter((root) => !search.trim() || root.name.toLowerCase().includes(search.trim().toLowerCase()) || children.some((child) => child.parentId === root.id && child.name.toLowerCase().includes(search.trim().toLowerCase())));
  return <div className="grid min-w-0 gap-4">
    <PageHeader title="商品管理" description="选择左侧分组，在右侧编辑分组和商品。" actions={<Button icon={<PlusIcon />} onClick={() => navigate(null, "0")}>新建一级分组</Button>} />
    {notice ? <Banner variant="alert" title={notice} /> : null}
    {operation.error ? <Banner variant="error" title="操作失败" description={getApiMessage(operation.error)} /> : null}
    <div ref={workspace} className="min-h-0 lg:h-(--product-workspace-height)"><LayerCard className="h-full min-h-0 overflow-hidden p-0">
      <Sidebar.Provider contained collapsible="none" mobileBreakpoint={0} className="relative flex min-h-0 w-full flex-col lg:h-full lg:flex-row">
        <Sidebar className="h-80 min-h-0 [--sidebar-width:100%] shrink-0 lg:h-full border-b border-kumo-line lg:[--sidebar-width:16rem] lg:border-r lg:border-b-0">
          <Sidebar.Header><Input className="w-full" aria-label="搜索分组" placeholder="搜索分组…" value={search} onChange={(e) => setSearch(e.target.value)} /></Sidebar.Header>
          <Sidebar.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {roots.isLoading ? <Sidebar.Loading /> : <Sidebar.Group><Sidebar.GroupLabel>商品分组</Sidebar.GroupLabel><Sidebar.Menu>
              {visibleRoots.map((root) => {
                const rootMatches = root.name.toLowerCase().includes(search.trim().toLowerCase());
                const rows = children.filter((child) => child.parentId === root.id && (!search.trim() || rootMatches || child.name.toLowerCase().includes(search.trim().toLowerCase())));
                return <Sidebar.MenuItem key={root.id}><Sidebar.Collapsible open={Boolean(search.trim()) || expanded.has(root.id)} onOpenChange={(open) => setExpanded((old) => { const next = new Set(old); if (open) next.add(root.id); else next.delete(root.id); return next; })}>
                  <Sidebar.CollapsibleTrigger render={<Sidebar.MenuButton icon={FolderIcon} active={!creating && selected?.id === root.id} onClick={() => navigate(root.id)}><span className="min-w-0 flex-1 truncate">{root.name}</span><Sidebar.MenuChevron /></Sidebar.MenuButton>} />
                  <Sidebar.CollapsibleContent><Sidebar.MenuSub>
                    {rows.map((child) => <Sidebar.MenuSubButton key={child.id} className="pl-6" active={!creating && selected?.id === child.id} onClick={() => navigate(child.id)}><FolderIcon className="size-4 shrink-0 text-kumo-subtle" /><span className="min-w-0 flex-1 truncate">{child.name}</span><span className="text-base text-kumo-subtle">{child.productCount}</span></Sidebar.MenuSubButton>)}
                    {childrenQueries[(roots.data?.list ?? []).findIndex((g) => g.id === root.id)]?.isLoading ? <li className="p-2 text-base text-kumo-subtle">加载中…</li> : null}
                  </Sidebar.MenuSub></Sidebar.CollapsibleContent>
                </Sidebar.Collapsible></Sidebar.MenuItem>;
              })}
              {!roots.isLoading && !visibleRoots.length ? <li className="p-3 text-base text-kumo-subtle">{search ? "没有匹配的分组" : "暂无分组"}</li> : null}
            </Sidebar.Menu></Sidebar.Group>}
          </Sidebar.Content>
        </Sidebar>
        <section className="min-h-0 min-w-0 flex-1 p-4 lg:overflow-y-auto lg:overscroll-contain lg:p-6" aria-label="分组编辑与商品列表">
          <PageState loading={roots.isLoading} error={roots.error ? getApiMessage(roots.error) : null}>
            {creating ? <div className="grid gap-5"><h2 className="text-lg font-semibold text-kumo-strong">{creating.parentId === "0" ? "新建一级分组" : "新建二级分组"}</h2><GroupEditor key={`new-${creating.parentId}-${editorRevision}`} parentId={creating.parentId} onDirtyChange={updateDirty} onBusyChange={setPending} onSaved={(id) => { setCreating(null); setSelectedId(id); setDirty(false); }} onCancel={() => { setDirty(false); setCreating(null); }} /></div> : selected ? <div className="grid gap-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-kumo-strong">{selected.name}</h2><p className="mt-1 text-base text-kumo-subtle">{selected.parentId === "0" ? "一级分组" : `${all.find((g) => g.id === selected.parentId)?.name ?? "二级分组"} / 二级分组`} · {selected.productCount} 个商品</p></div><div className="flex flex-wrap gap-2">
                <Button variant="secondary" shape="square" aria-label="分组上移" icon={<ArrowUpIcon />} disabled={disabled || dirty || all.filter((g) => g.parentId === selected.parentId)[0]?.id === selected.id} onClick={() => reorder(selected, -1)} />
                <Button variant="secondary" shape="square" aria-label="分组下移" icon={<ArrowDownIcon />} disabled={disabled || dirty || all.filter((g) => g.parentId === selected.parentId).at(-1)?.id === selected.id} onClick={() => reorder(selected, 1)} />
                {selected.parentId === "0" ? <Button variant="secondary" icon={<FolderPlusIcon />} onClick={() => navigate(null, selected.id)}>新建二级分组</Button> : <Button variant="secondary" onClick={() => setMoveSource(selected)} disabled={dirty || disabled}>移动商品</Button>}
                <Button variant="destructive" shape="square" aria-label="删除分组" icon={<TrashIcon />} disabled={dirty || disabled} onClick={() => setDeleteTarget(selected)} />
              </div></div>
              <div className={editingProduct ? "pointer-events-none opacity-50" : undefined}><GroupEditor key={`${selected.id}-${editorRevision}`} group={selected} parentId={selected.parentId} onDirtyChange={updateDirty} onBusyChange={setPending} onSaved={() => setDirty(false)} onCancel={() => { setDirty(false); setEditorRevision((v) => v + 1); setNotice(""); }} /></div>
              {selected.parentId !== "0" ? <>
                {!editingProduct ? <div className="flex flex-wrap items-end gap-3 border-t border-kumo-line pt-4"><div className="min-w-48 flex-1"><Select disabled={(roots.data?.list.length ?? 0) < 2} label="移动至其他一级分组" value={targetParent} onValueChange={(v) => setTargetParent(v ?? "")} items={Object.fromEntries((roots.data?.list ?? []).filter((g) => g.id !== selected.parentId).map((g) => [g.id, g.name]))} /></div><Button variant="secondary" disabled={!targetParent || disabled || dirty} loading={operation.isPending} onClick={moveGroup}>移动分组</Button></div> : null}
                <div className="min-w-0 border-t border-kumo-line pt-4"><GroupProducts key={selected.id} groupId={selected.id} expanded onDirtyChange={updateDirty} onEditingChange={setEditingProduct} blocked={disabled || dirty} beginSave={() => { if (saving.current) return false; saving.current = true; setPending(true); return true; }} endSave={() => { saving.current = false; setPending(false); }} /></div>
              </> : <p className="border-t border-kumo-line pt-4 text-base text-kumo-subtle">展开左侧一级分组，选择下方二级分组查看并编辑商品。</p>}
            </div> : <p className="text-base text-kumo-subtle">创建一级分组，开始管理商品。</p>}
          </PageState>
        </section>
      </Sidebar.Provider>
    </LayerCard></div>
    <DialogPresence>{moveSource ? <MoveProductsDialog source={moveSource} targets={children} onClose={() => setMoveSource(null)} /> : null}</DialogPresence>
    <DialogPresence>{deleteTarget ? <Dialog.Root open onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}><Dialog className="grid gap-4 p-8"><Dialog.Title className="text-2xl font-semibold">删除商品分组</Dialog.Title><Dialog.Description>确定删除“{deleteTarget.name}”？存在子分组或商品时不能删除。</Dialog.Description>{remove.error ? <Banner variant="error" title="删除失败" description={getApiMessage(remove.error)} /> : null}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeleteTarget(null)}>取消</Button><Button variant="destructive" loading={remove.isPending} onClick={() => remove.mutate(deleteTarget.id)}>确认删除</Button></div></Dialog></Dialog.Root> : null}</DialogPresence>
  </div>;}
