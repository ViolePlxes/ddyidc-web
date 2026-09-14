import { GroupProducts } from "./GroupProducts";
import { DragHandle, SortableList } from "../../../shared/components/SortableTableBody";
import { useSortableList, type ListDrop } from "../../../shared/hooks/useSortableList";
import { invalidateCatalog, publishCatalogChange } from "../../../shared/utils/catalogCache";
import { Banner, Button, Checkbox, Dialog, Input, LayerCard, Select, Switch, Table } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, CaretRightIcon, FolderPlusIcon, PencilSimpleIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { adminProductGroupsApi, type ProductGroup, type ProductGroupInput } from "../../../shared/api/adminProductGroups";
import { adminProductsApi } from "../../../shared/api/adminProducts";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

function GroupDialog({ group, parentId, onClose }: { group?: ProductGroup; parentId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(group?.name ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "");
  const [enabled, setEnabled] = useState((group?.status ?? 1) === 1);
  const save = useMutation({
    mutationFn: async () => {
      const input: ProductGroupInput = { name, icon, parentId, status: enabled ? 1 : 0 };
      if (group) await adminProductGroupsApi.update(group.id, input);
      else await adminProductGroupsApi.create(input);
    },
    onSuccess: async () => {
      await invalidateCatalog(queryClient); publishCatalogChange();
      onClose();
    },
  });
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog className="grid gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div><Dialog.Title className="text-xl font-semibold">{group ? "编辑商品分组" : parentId === "0" ? "新建一级分组" : "新建二级分组"}</Dialog.Title><Dialog.Description className="text-kumo-subtle">商品分组最多支持两级。</Dialog.Description></div>
          <Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" onClick={onClose} />
        </div>
        <Input label="分组名称" value={name} maxLength={64} onChange={(event) => setName(event.target.value)} />
        <Input label="图标" value={icon} maxLength={255} description="可填写现有图标标识；留空使用默认分组图标。" onChange={(event) => setIcon(event.target.value)} />
        <Switch label="启用分组" checked={enabled} onCheckedChange={setEnabled} />
        {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button loading={save.isPending} disabled={!name.trim()} onClick={() => save.mutate()}>保存</Button></div>
      </Dialog>
    </Dialog.Root>
  );
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
      <Dialog size="lg" className="grid max-h-[85vh] gap-5 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-semibold">移动商品</Dialog.Title><Dialog.Description className="text-kumo-subtle">从“{source.name}”批量移动到另一个二级分组。</Dialog.Description></div><Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" onClick={onClose} /></div>
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

export function ProductGroups({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const roots = useQuery({ queryKey: ["admin", "product-groups", "0"], queryFn: () => adminProductGroupsApi.list("0") });
  const childQueries = useQueries({
    queries: (roots.data?.list ?? []).map((root) => ({
      queryKey: ["admin", "product-groups", root.id],
      queryFn: () => adminProductGroupsApi.list(root.id),
    })),
  });
  const childGroups = useMemo(() => childQueries.flatMap((query) => query.data?.list ?? []), [childQueries]);
  const [dialog, setDialog] = useState<{ group?: ProductGroup; parentId: string } | null>(null);
  const [moveSource, setMoveSource] = useState<ProductGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductGroup | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const beginSave = () => { if (saving.current) return false; saving.current = true; setPending(true); return true; };
  const endSave = () => { saving.current = false; setPending(false); };
  const refresh = async () => { await invalidateCatalog(queryClient); publishCatalogChange(); };
  const hidden = useMutation({ mutationFn: ({ group, value }: { group: ProductGroup; value: boolean }) => adminProductGroupsApi.hidden(group.id, value), onSuccess: refresh, onError: (cause) => setError(getApiMessage(cause)) });
  const remove = useMutation({ mutationFn: (id: string) => adminProductGroupsApi.remove(id), onSuccess: async () => { setDeleteTarget(null); await refresh(); }, onError: (cause) => setError(getApiMessage(cause)) });
  const submit = async (work: () => Promise<unknown>) => {
    if (saving.current) return;
    saving.current = true; setPending(true); setError(null);
    try { await work(); await refresh(); }
    catch (cause) { setError(`${getApiMessage(cause)}；已恢复原顺序，请刷新后重试。`); await invalidateCatalog(queryClient); }
    finally { saving.current = false; setPending(false); }
  };
  const drop = (event: ListDrop) => {
    if (saving.current) return;
    const all = [...(roots.data?.list ?? []), ...childGroups];
    const moving = all.find((group) => group.id === event.id);
    if (!moving || moving.parentId !== event.source) { setError("分组已变化，请刷新后重试"); return; }
    if (event.source === event.target) {
      const expected = all.filter((group) => group.parentId === event.source);
      if (event.targetIds.length !== expected.length || new Set(event.targetIds).size !== expected.length || event.targetIds.some((id) => !expected.some((group) => group.id === id))) { setError("请先读取整层分组再排序"); return; }
      void submit(() => adminProductGroupsApi.sort(event.source, event.targetIds));
    } else {
      if (moving.parentId === "0" || event.target === "0") { setError("禁止改变分组层级"); return; }
      void submit(() => adminProductGroupsApi.moveGroup(event.id, event.target, event.targetIds, event.sourceIds));
    }
  };
  const disabled = pending || hidden.isPending || remove.isPending || roots.isError || roots.isFetching || childQueries.some((query) => query.isFetching || query.isError);
  const rootRef = useSortableList("roots", false, disabled, drop);
  const reorder = (items: ProductGroup[], index: number, offset: number) => {
    const target = index + offset;
    if (saving.current || target < 0 || target >= items.length) return;
    const ordered = [...items];
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    void submit(() => adminProductGroupsApi.sort(items[index]!.parentId, ordered.map((item) => item.id)));
  };
  return (
    <div className="grid gap-4" inert={pending}>
      <PageHeader title={embedded ? "商品目录" : "商品分组"} description={embedded ? "展开二级分组管理商品；拖动手柄调整顺序，二级分组可跨父移动。" : "维护两级分组；拖动手柄排序，二级分组可跨父移动。"} actions={<Button icon={<PlusIcon />} onClick={() => setDialog({ parentId: "0" })}>新建一级分组</Button>} />
      {error ? <div className="grid gap-2"><Banner variant="error" title="操作失败" description={error} /><Button variant="secondary" onClick={() => void refresh()}>重新读取列表</Button></div> : null}
      <PageState loading={roots.isLoading} error={!roots.data && roots.error ? getApiMessage(roots.error) : null} empty={!roots.isLoading && (roots.data?.list.length ?? 0) === 0} emptyTitle="暂无商品分组">
        <div ref={rootRef} data-sort-list="0" className="grid gap-4">
          {(roots.data?.list ?? []).map((root, rootIndex) => {
            const children = childQueries[rootIndex]?.data?.list ?? [];
            return (
              <LayerCard key={root.id} data-sort-id={root.id} className="sort-item overflow-hidden p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kumo-line p-4">
                  <div className="grid gap-1"><div className="flex items-center gap-2"><DragHandle scope="roots" label={`拖动一级分组 ${root.name}`} disabled={disabled} /><strong className="text-kumo-strong">{root.name}</strong><span className="text-sm text-kumo-subtle">一级 · 排序 {root.sort} · {root.productCount} 个商品</span></div>{root.icon ? <span className="text-xs text-kumo-subtle">图标：{root.icon}</span> : null}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Switch label={root.status === 1 ? "显示" : "隐藏"} checked={root.status === 1} onCheckedChange={(checked) => hidden.mutate({ group: root, value: !checked })} />
                    <Button variant="secondary" shape="square" icon={<ArrowUpIcon />} aria-label="一级分组上移" disabled={rootIndex === 0 || disabled} onClick={() => reorder(roots.data?.list ?? [], rootIndex, -1)} />
                    <Button variant="secondary" shape="square" icon={<ArrowDownIcon />} aria-label="一级分组下移" disabled={rootIndex === (roots.data?.list.length ?? 0) - 1 || disabled} onClick={() => reorder(roots.data?.list ?? [], rootIndex, 1)} />
                    <Button disabled={pending} variant="secondary" icon={<PlusIcon />} onClick={() => setDialog({ parentId: "0" })}>新建同级</Button>
                    <Button disabled={pending} variant="secondary" icon={<FolderPlusIcon />} onClick={() => setDialog({ parentId: root.id })}>新建子级</Button>
                    <Button variant="secondary" shape="square" icon={<PencilSimpleIcon />} aria-label="编辑一级分组" onClick={() => setDialog({ group: root, parentId: root.parentId })} />
                    <Button variant="destructive" shape="square" icon={<TrashIcon />} aria-label="删除一级分组" onClick={() => setDeleteTarget(root)} />
                  </div>
                </div>
                <PageState loading={childQueries[rootIndex]?.isLoading} error={!childQueries[rootIndex]?.data && childQueries[rootIndex]?.error ? getApiMessage(childQueries[rootIndex]?.error) : null}>
                  <div className="overflow-x-auto p-2">
                    <div className="min-w-[1000px]">
                      <Table className="table-fixed"><Table.Header variant="compact"><Table.Row><Table.Head className="w-[28%]">二级分组</Table.Head><Table.Head className="w-[12%]">状态</Table.Head><Table.Head className="w-[8%]">商品数</Table.Head><Table.Head className="w-[8%]">排序</Table.Head><Table.Head className="w-[44%]">操作</Table.Head></Table.Row></Table.Header></Table>
                      <SortableList scope="children" listId={root.id} crossList disabled={disabled} onDrop={drop}>
                        {children.length === 0 ? <p className="p-4 text-sm text-kumo-subtle">拖入二级分组，或点击“新建子级”</p> : null}
                        {children.map((child, index) => (
                          <LayerCard key={child.id} className="sort-item overflow-hidden p-0" data-sort-id={child.id}>
                            <Table className="table-fixed"><Table.Body><Table.Row>
                              <Table.Cell className="w-[28%]"><div className="flex items-center gap-2"><DragHandle scope="children" label={`拖动二级分组 ${child.name}`} disabled={disabled} />{embedded ? <Button variant="ghost" shape="square" aria-label={`${expanded.has(child.id) ? "收起" : "展开"} ${child.name}`} aria-expanded={expanded.has(child.id)} aria-controls={`products-${child.id}`} icon={expanded.has(child.id) ? <CaretDownIcon /> : <CaretRightIcon />} onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(child.id)) next.delete(child.id); else next.add(child.id); return next; })} /> : null}<div><strong className="text-kumo-strong">{child.name}</strong>{child.icon ? <p className="text-xs text-kumo-subtle">图标：{child.icon}</p> : null}</div></div></Table.Cell>
                              <Table.Cell className="w-[12%]"><Switch label={child.status === 1 ? "显示" : "隐藏"} checked={child.status === 1} onCheckedChange={(checked) => hidden.mutate({ group: child, value: !checked })} /></Table.Cell><Table.Cell className="w-[8%]">{child.productCount}</Table.Cell><Table.Cell className="w-[8%]">{child.sort}</Table.Cell>
                              <Table.Cell className="w-[44%]"><div className="flex flex-wrap gap-2"><Button variant="secondary" shape="square" icon={<ArrowUpIcon />} aria-label="二级分组上移" disabled={index === 0 || disabled} onClick={() => reorder(children, index, -1)} /><Button variant="secondary" shape="square" icon={<ArrowDownIcon />} aria-label="二级分组下移" disabled={index === children.length - 1 || disabled} onClick={() => reorder(children, index, 1)} /><Button disabled={pending} variant="secondary" icon={<PlusIcon />} onClick={() => setDialog({ parentId: child.parentId })}>新建同级</Button><Button variant="secondary" onClick={() => setMoveSource(child)}>移动商品</Button><Button variant="secondary" shape="square" icon={<PencilSimpleIcon />} aria-label="编辑二级分组" onClick={() => setDialog({ group: child, parentId: child.parentId })} /><Button variant="destructive" shape="square" icon={<TrashIcon />} aria-label="删除二级分组" onClick={() => setDeleteTarget(child)} /></div></Table.Cell>
                            </Table.Row></Table.Body></Table>
                            {embedded ? <GroupProducts groupId={child.id} expanded={expanded.has(child.id)} blocked={disabled} beginSave={beginSave} endSave={endSave} /> : null}
                          </LayerCard>
                        ))}
                      </SortableList>
                    </div>
                  </div>
                </PageState>
              </LayerCard>
            );
          })}
        </div>
      </PageState>
      {dialog ? <GroupDialog group={dialog.group} parentId={dialog.parentId} onClose={() => setDialog(null)} /> : null}
      {moveSource ? <MoveProductsDialog source={moveSource} targets={childGroups} onClose={() => setMoveSource(null)} /> : null}
      {deleteTarget ? <Dialog.Root open onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}><Dialog className="grid gap-5 p-6"><Dialog.Title className="text-xl font-semibold">删除商品分组</Dialog.Title><Dialog.Description className="text-kumo-subtle">确定删除“{deleteTarget.name}”？存在子分组或商品时系统会拒绝删除。</Dialog.Description><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeleteTarget(null)}>取消</Button><Button variant="destructive" loading={remove.isPending} onClick={() => remove.mutate(deleteTarget.id)}>确认删除</Button></div></Dialog></Dialog.Root> : null}
    </div>
  );
}
