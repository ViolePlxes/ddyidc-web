import { Banner, Button, Input, LayerCard, Select, Tabs } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { adminProductsApi, type AdminProduct } from "../../../shared/api/adminProducts";
import type { ProductSpec } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { Badge } from "../../../shared/components/Badge";
import { PageState } from "../../../shared/components/PageState";
import { DragHandle, SortableList } from "../../../shared/components/SortableTableBody";
import { invalidateCatalog, publishCatalogChange } from "../../../shared/utils/catalogCache";

function SpecsEditor({ product, onClose, onDirtyChange, onBusyChange }: { product: AdminProduct; onClose: () => void; onDirtyChange: (dirty: boolean) => void; onBusyChange: (busy: boolean) => void }) {
  const queryClient = useQueryClient();
  const specsQuery = useQuery({ queryKey: ["admin", "products", product.id, "specs"], queryFn: () => adminProductsApi.specs(product.id) });
  const [row, setRow] = useState<ProductSpec | null>(null);
  useEffect(() => { if (specsQuery.data?.items[0]) setRow((current) => current ?? { ...specsQuery.data.items[0]! }); }, [specsQuery.data]);
  const save = useMutation({
    mutationFn: () => {
      if (!row) throw new Error("规格数据尚未加载");
      const { id: _id, productId: _productId, ...input } = row;
      return adminProductsApi.saveSpecs(product.id, [{ ...input, sort: 0 }]);
    },
    onMutate: () => onBusyChange(true),
    onSettled: () => onBusyChange(false),
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin", "products"] }), queryClient.invalidateQueries({ queryKey: ["product", product.id] }), queryClient.invalidateQueries({ queryKey: ["products"] })]);
      onClose();
    },
  });
  const update = <K extends keyof ProductSpec>(key: K, value: ProductSpec[K]) => { onDirtyChange(true); setRow((current) => current ? { ...current, [key]: value } : current); };
  const upstreamStock = specsQuery.data?.upstreamStock;
  return (
    <LayerCard className="grid gap-5 p-4">
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="text-lg font-semibold text-kumo-strong">商品规格配置</h3><p className="text-kumo-subtle">{product.name} · 每个商品保存一条规格配置。</p></div>
          <Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" disabled={save.isPending} onClick={onClose} />
        </div>
        <PageState loading={specsQuery.isLoading} error={specsQuery.error ? getApiMessage(specsQuery.error) : null}>
          {row ? <fieldset disabled={save.isPending} className="grid gap-4">
            <p className="text-sm text-kumo-subtle">{specsQuery.data?.capturedAt ? `本地上游快照：${new Date(specsQuery.data.capturedAt).toLocaleString()}。未提供的字段留空。` : "此商品尚无上游规格快照，可在对接商品页同步商品后查看；也可直接填写本地配置。"}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="实例规格" maxLength={64} value={row.name} onChange={(event) => update("name", event.target.value)} />
              <Input label="vCPU" type="number" min={0} max={1024} value={row.vcpu || ""} onChange={(event) => update("vcpu", Number(event.target.value))} />
              <Input label="内存" maxLength={32} value={row.memory} onChange={(event) => update("memory", event.target.value)} />
              <Input label="处理器型号" maxLength={128} value={row.processorModel} onChange={(event) => update("processorModel", event.target.value)} />
              <Input label="处理器主频 / 睿频" maxLength={64} value={row.processorFrequency} onChange={(event) => update("processorFrequency", event.target.value)} />
              <Input label="基础防御" maxLength={64} value={row.defense} onChange={(event) => update("defense", event.target.value)} />
              <Input label="上行带宽" maxLength={64} value={row.upstreamBandwidth} onChange={(event) => update("upstreamBandwidth", event.target.value)} />
              <Input label="下行速率" maxLength={64} value={row.downstreamRate} onChange={(event) => update("downstreamRate", event.target.value)} />
              <Input label="库存数量" type="number" min={0} value={row.stock ?? ""} description={`留空使用上游库存：${upstreamStock ?? "—"}`} onChange={(event) => update("stock", event.target.value === "" ? null : Number(event.target.value))} />
              <Select label="价格模式" value={row.priceMode} onValueChange={(value) => value && update("priceMode", value as ProductSpec["priceMode"])} items={{ fixed: "固定售价", upstream: "跟随上游代理价" }} />
              <Input label="参考月价（元）" type="number" min={0} step="0.01" value={row.price} disabled={row.priceMode === "upstream"} onChange={(event) => update("price", Number(event.target.value))} />
            </div>
          </fieldset> : null}
        </PageState>
        {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" disabled={save.isPending} onClick={onClose}>取消</Button><Button loading={save.isPending} disabled={!row || specsQuery.isLoading || Boolean(specsQuery.error)} onClick={() => save.mutate()}>保存规格</Button></div>
    </LayerCard>
  );
}
export function GroupProducts({ groupId, expanded, blocked, beginSave, endSave, onDirtyChange, onEditingChange }: {
  groupId: string; expanded: boolean; blocked: boolean; beginSave: () => boolean; endSave: () => void; onDirtyChange: (dirty: boolean) => void; onEditingChange: (editing: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [activeProduct, setActiveProduct] = useState<AdminProduct | null>(null);
  const saving = useRef(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const products = useQuery({ queryKey: ["admin", "products", groupId], queryFn: () => adminProductsApi.list(groupId), enabled: expanded, staleTime: 60_000 });
  const listing = useMutation({mutationFn: (product: AdminProduct) => adminProductsApi.setListed(product, product.hidden), onMutate: () => { beginSave(); }, onSuccess: async () => { await invalidateCatalog(queryClient); publishCatalogChange(); }, onSettled: endSave});
  const sort = useMutation({
    mutationFn: (ids: string[]) => adminProductsApi.sort(groupId, ids),
    onSuccess: async () => { await invalidateCatalog(queryClient); publishCatalogChange(); },
    onSettled: () => { saving.current = false; endSave(); },
  });
  const submitSort = (ids: string[]) => {
    const rows = products.data?.items ?? [];
    if (saving.current || blocked || products.isFetching || ids.length !== rows.length || rows.length !== products.data?.total || new Set(ids).size !== rows.length || ids.some((id) => !rows.some((row) => row.id === id && row.groupId === groupId))) return;
    if (!beginSave()) return;
    saving.current = true;
    sort.mutate(ids);
  };
  const filtering = Boolean(search.trim()) || filter !== "all";
  const visibleProducts = (products.data?.items ?? []).filter((product) => (!search.trim() || `${product.name} ${product.id}`.toLowerCase().includes(search.trim().toLowerCase())) && (filter === "all" || (filter === "active" ? product.status === 1 && !product.hidden : product.status !== 1 || product.hidden)));
  const disabled = filtering || blocked || sort.isPending || products.isError || products.isFetching;
  const move = (index: number, offset: number) => {
    const rows = products.data?.items ?? [];
    const target = index + offset;
    if (target < 0 || target >= rows.length) return;
    const ordered = [...rows];
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    submitSort(ordered.map((item) => item.id));
  };
  if (!expanded) return null;
  if (activeProduct) return <SpecsEditor product={activeProduct} onDirtyChange={onDirtyChange} onBusyChange={(busy) => { if (busy) beginSave(); else endSave(); }} onClose={() => { setActiveProduct(null); onDirtyChange(false); onEditingChange(false); }} />;
  return (
    <LayerCard id={`products-${groupId}`}><LayerCard.Secondary>分组商品</LayerCard.Secondary><LayerCard.Primary>
      <div className="mb-3 flex flex-wrap items-center gap-3"><Input size="sm" className="min-w-0 flex-1" aria-label="搜索商品" placeholder="搜索商品名称或ID…" value={search} onChange={(event) => setSearch(event.target.value)} /><Tabs variant="segmented" size="sm" className="shrink-0" tabs={[{value:"all",label:"全部"},{value:"active",label:"上架中"},{value:"inactive",label:"已下架"}]} value={filter} onValueChange={setFilter} /></div>
      {listing.error ? <Banner variant="error" title="上下架失败" description={getApiMessage(listing.error)} /> : null}
      {sort.error ? <Banner variant="error" title="排序保存失败" description={`${getApiMessage(sort.error)}；已恢复原顺序，请刷新后重试。`} /> : null}
      <PageState loading={products.isLoading} keepContent error={!products.data && products.error ? getApiMessage(products.error) : null} empty={!products.isLoading && !products.error && (products.data?.items.length ?? 0) === 0} emptyTitle="该分组暂无商品">
        <div className="overflow-x-auto -mx-1 text-sm">
          <div className="min-w-[480px] px-1">
            <div className="grid grid-cols-[minmax(0,1fr)_5rem_15rem] gap-x-4 border-b border-kumo-fill pb-2 text-xs font-medium text-kumo-subtle"><span>商品</span><span className="text-right">售价</span><span className="text-right">操作</span></div>
            <div className="[&>div]:gap-0">
              <SortableList scope="products" listId={groupId} disabled={disabled} onDrop={(event) => { if (event.source === groupId && event.target === groupId) submitSort(event.targetIds); }}>
                {visibleProducts.map((product, index, rows) => <div key={product.id} data-sort-id={product.id} className="sort-item grid grid-cols-[minmax(0,1fr)_5rem_15rem] items-center gap-x-4 border-b border-kumo-hairline py-2.5">
                  <div className="flex min-w-0 items-center gap-1"><DragHandle scope="products" label={`拖动商品 ${product.name}`} disabled={disabled} /><span className="truncate font-medium text-kumo-default" title={`${product.name} · #${product.id}`}>{product.name}</span></div>
                  <span className="text-right text-kumo-subtle">¥{product.price.toFixed(2)}</span>
                  <div className="flex items-center justify-end gap-1"><Button variant="ghost" size="sm" aria-label={`切换上架状态 ${product.name}`} disabled={blocked || listing.isPending || products.isFetching || product.status !== 1} loading={listing.isPending && listing.variables?.id === product.id} onClick={() => listing.mutate(product)}><Badge variant={product.status === 1 && !product.hidden ? "success" : "neutral"}>{product.status === 1 && !product.hidden ? "上架中" : "已下架"}</Badge></Button><Button size="sm" variant="ghost" shape="square" icon={<ArrowUpIcon />} aria-label={`上移 ${product.name}`} disabled={disabled || index === 0} onClick={() => move(index, -1)} /><Button size="sm" variant="ghost" shape="square" icon={<ArrowDownIcon />} aria-label={`下移 ${product.name}`} disabled={disabled || index === rows.length - 1} onClick={() => move(index, 1)} /><Button size="sm" variant="ghost" disabled={blocked} onClick={() => { setActiveProduct(product); onEditingChange(true); }}>编辑</Button></div>
                </div>)}
              </SortableList>
            </div>
          </div>
        </div>
      </PageState>
      {!products.isLoading && !products.isError && visibleProducts.length === 0 && (products.data?.total ?? 0) > 0 ? <p className="py-4 text-sm text-kumo-subtle">没有符合条件的商品</p> : null}
      <p className="mt-3 text-xs text-kumo-subtle">显示 {visibleProducts.length} / {products.data?.total ?? 0} 个商品{filtering ? " · 清除筛选后可调整排序" : ""}</p>
    </LayerCard.Primary></LayerCard>
  );
}
