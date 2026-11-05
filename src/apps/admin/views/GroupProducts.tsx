import { Banner, Button, Input, LayerCard, LayerDialog, Select, Tabs } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { adminProductsApi, type AdminProduct } from "../../../shared/api/adminProducts";
import type { ProductSpec } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { Badge } from "../../../shared/components/Badge";
import { PageState } from "../../../shared/components/PageState";
import { DragHandle, SortableList } from "../../../shared/components/SortableTableBody";
import { invalidateCatalog, publishCatalogChange } from "../../../shared/utils/catalogCache";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-sm font-medium text-kumo-strong">{label}</span>{children}</label>;
}

export function GroupProducts({ groupId, expanded, blocked, beginSave, endSave, onDirtyChange, onEditingChange }: {
  groupId: string; expanded: boolean; blocked: boolean; beginSave: () => boolean; endSave: () => void; onDirtyChange: (dirty: boolean) => void; onEditingChange: (editing: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [activeProduct, setActiveProduct] = useState<AdminProduct | null>(null);
  const [row, setRow] = useState<ProductSpec | null>(null);
  const saving = useRef(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const products = useQuery({ queryKey: ["admin", "products", groupId], queryFn: () => adminProductsApi.list(groupId), enabled: expanded, staleTime: 60_000 });
  const specsQuery = useQuery({ queryKey: ["admin", "products", activeProduct?.id, "specs"], queryFn: () => adminProductsApi.specs(activeProduct!.id), enabled: Boolean(activeProduct) });
  useEffect(() => {
    const first = specsQuery.data?.items[0];
    if (first) setRow({ ...first });
  }, [specsQuery.data]);
  const closeEditor = () => { setActiveProduct(null); setRow(null); saveSpecs.reset(); onDirtyChange(false); onEditingChange(false); };
  const saveSpecs = useMutation({
    mutationFn: () => {
      if (!activeProduct || !row) throw new Error("规格数据尚未加载");
      const { id: _id, productId: _productId, ...input } = row;
      return adminProductsApi.saveSpecs(activeProduct.id, [{ ...input, sort: 0 }]);
    },
    onMutate: () => { beginSave(); },
    onSettled: () => { endSave(); },
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin", "products"] }), queryClient.invalidateQueries({ queryKey: ["product", activeProduct?.id] }), queryClient.invalidateQueries({ queryKey: ["products"] })]);
      closeEditor();
    },
  });
  const update = <K extends keyof ProductSpec>(key: K, value: ProductSpec[K]) => { onDirtyChange(true); setRow((current) => current ? { ...current, [key]: value } : current); };
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
  const upstreamStock = specsQuery.data?.upstreamStock;
  return (
    <>
    <LayerCard id={`products-${groupId}`}><LayerCard.Secondary>分组商品</LayerCard.Secondary><LayerCard.Primary>
      <div className="mb-3 flex flex-wrap items-center gap-3"><Input size="sm" className="min-w-0 flex-1" aria-label="搜索商品" placeholder="搜索商品名称或ID…" value={search} onChange={(event) => setSearch(event.target.value)} /><Tabs variant="segmented" size="sm" className="shrink-0" tabs={[{value:"all",label:"全部"},{value:"active",label:"上架中"},{value:"inactive",label:"已下架"}]} value={filter} onValueChange={setFilter} /></div>
      {listing.error ? <Banner variant="error" title="上下架失败" description={getApiMessage(listing.error)} /> : null}
      {sort.error ? <Banner variant="error" title="排序保存失败" description={`${getApiMessage(sort.error)}；已恢复原顺序，请刷新后重试。`} /> : null}
      <PageState loading={products.isLoading} keepContent error={!products.data && products.error ? getApiMessage(products.error) : null} empty={!products.isLoading && !products.error && (products.data?.items.length ?? 0) === 0} emptyTitle="该分组暂无商品">
        <div className="overflow-x-auto -mx-1 text-base">
          <div className="min-w-[480px] px-1">
            <div className="grid grid-cols-[minmax(0,1fr)_5rem_15rem] gap-x-4 border-b border-kumo-fill pb-2 text-base font-medium text-kumo-subtle"><span>商品</span><span className="text-right">售价</span><span className="text-right">操作</span></div>
            <div className="[&>div]:gap-0">
              <SortableList scope="products" listId={groupId} disabled={disabled} onDrop={(event) => { if (event.source === groupId && event.target === groupId) submitSort(event.targetIds); }}>
                {visibleProducts.map((product, index, rows) => <div key={product.id} data-sort-id={product.id} className="sort-item grid grid-cols-[minmax(0,1fr)_5rem_15rem] items-center gap-x-4 border-b border-kumo-hairline py-2.5">
                  <div className="flex min-w-0 items-center gap-1"><DragHandle scope="products" label={`拖动商品 ${product.name}`} disabled={disabled} /><span className="truncate font-medium text-kumo-default" title={`${product.name} · #${product.id}`}>{product.name}</span></div>
                  <span className="text-right text-kumo-subtle">¥{product.price.toFixed(2)}</span>
                  <div className="flex items-center justify-end gap-1"><Button variant="ghost" size="sm" aria-label={`切换上架状态 ${product.name}`} disabled={blocked || listing.isPending || products.isFetching || product.status !== 1} loading={listing.isPending && listing.variables?.id === product.id} onClick={() => listing.mutate(product)}><Badge variant={product.status === 1 && !product.hidden ? "success" : "neutral"}>{product.status === 1 && !product.hidden ? "上架中" : "已下架"}</Badge></Button><Button size="sm" variant="ghost" shape="square" icon={<ArrowUpIcon />} aria-label={`上移 ${product.name}`} disabled={disabled || index === 0} onClick={() => move(index, -1)} /><Button size="sm" variant="ghost" shape="square" icon={<ArrowDownIcon />} aria-label={`下移 ${product.name}`} disabled={disabled || index === rows.length - 1} onClick={() => move(index, 1)} /><Button size="sm" variant="ghost" disabled={blocked} onClick={() => { setActiveProduct(product); setRow(null); saveSpecs.reset(); onEditingChange(true); }}>编辑</Button></div>
                </div>)}
              </SortableList>
            </div>
          </div>
        </div>
      </PageState>
      {!products.isLoading && !products.isError && visibleProducts.length === 0 && (products.data?.total ?? 0) > 0 ? <p className="py-4 text-base text-kumo-subtle">没有符合条件的商品</p> : null}
      <p className="mt-3 text-base text-kumo-subtle">显示 {visibleProducts.length} / {products.data?.total ?? 0} 个商品{filtering ? " · 清除筛选后可调整排序" : ""}</p>
    </LayerCard.Primary></LayerCard>
    <LayerDialog.Root open={Boolean(activeProduct)} onOpenChange={(open) => { if (!open) closeEditor(); }}>
      <LayerDialog.Content size="xl" closeLabel="关闭">
        <LayerDialog.Title>编辑商品</LayerDialog.Title>
        <LayerDialog.Description>{activeProduct ? `${activeProduct.name} · 调整规格、系统与售价，保存后立即生效。` : "调整商品规格与售价。"}</LayerDialog.Description>
        <LayerDialog.Body>
          <PageState loading={specsQuery.isLoading} error={specsQuery.error ? getApiMessage(specsQuery.error) : null}>
            {row ? <div className="grid gap-6">
              <section className="grid gap-3">
                <div><h3 className="text-sm font-semibold text-kumo-strong">基础规格</h3><p className="text-xs text-kumo-subtle">实例的计算资源与处理器信息。</p></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="实例规格"><Input maxLength={64} value={row.name} onChange={(event) => update("name", event.target.value)} /></Field>
                  <Field label="vCPU"><Input type="number" min={0} max={1024} value={row.vcpu || ""} onChange={(event) => update("vcpu", Number(event.target.value))} /></Field>
                  <Field label="内存"><Input maxLength={32} value={row.memory} onChange={(event) => update("memory", event.target.value)} /></Field>
                  <Field label="处理器型号"><Input maxLength={128} value={row.processorModel} onChange={(event) => update("processorModel", event.target.value)} /></Field>
                  <Field label="处理器主频 / 睿频"><Input maxLength={64} value={row.processorFrequency} onChange={(event) => update("processorFrequency", event.target.value)} /></Field>
                </div>
              </section>
              <section className="grid gap-3 border-t border-kumo-line pt-5">
                <div><h3 className="text-sm font-semibold text-kumo-strong">系统支持</h3><p className="text-xs text-kumo-subtle">选择该商品可安装的操作系统类型。</p></div>
                <Tabs variant="segmented" value={row.osFamily || "all"} onValueChange={(value) => update("osFamily", value)} tabs={[{ value: "all", label: "都支持" }, { value: "linux", label: "仅 Linux" }, { value: "windows", label: "仅 Windows" }]} />
                <p className="text-xs text-kumo-subtle">{!row.osFamily || row.osFamily === "all" ? "该商品允许安装 Windows 与 Linux 系统。" : row.osFamily === "linux" ? "该商品仅允许安装 Linux 系统。" : "该商品仅允许安装 Windows 系统。"}</p>
              </section>
              <section className="grid gap-3 border-t border-kumo-line pt-5">
                <div><h3 className="text-sm font-semibold text-kumo-strong">网络与防御</h3><p className="text-xs text-kumo-subtle">带宽与防御能力。</p></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="上行带宽"><Input maxLength={64} value={row.upstreamBandwidth} onChange={(event) => update("upstreamBandwidth", event.target.value)} /></Field>
                  <Field label="下行速率"><Input maxLength={64} value={row.downstreamRate} onChange={(event) => update("downstreamRate", event.target.value)} /></Field>
                  <Field label="基础防御"><Input maxLength={64} value={row.defense} onChange={(event) => update("defense", event.target.value)} /></Field>
                </div>
              </section>
              <section className="grid gap-3 border-t border-kumo-line pt-5">
                <div><h3 className="text-sm font-semibold text-kumo-strong">库存与售价</h3><p className="text-xs text-kumo-subtle">库存留空时跟随上游库存。</p></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="库存数量"><Input type="number" min={0} value={row.stock ?? ""} placeholder="跟随上游" onChange={(event) => update("stock", event.target.value === "" ? null : Number(event.target.value))} /></Field>
                  <Field label="价格模式"><Select value={row.priceMode} onValueChange={(value) => value && update("priceMode", value as ProductSpec["priceMode"])} items={{ fixed: "固定售价", upstream: "跟随上游代理价" }} /></Field>
                  <Field label="参考月价（元）"><Input type="number" min={0} step="0.01" value={row.price} disabled={row.priceMode === "upstream"} onChange={(event) => update("price", Number(event.target.value))} /></Field>
                </div>
                <p className="text-xs text-kumo-subtle">上游库存：{upstreamStock ?? "—"}</p>
              </section>
            </div> : null}
          </PageState>
          {saveSpecs.error ? <Banner variant="error" title="保存失败" description={getApiMessage(saveSpecs.error)} /> : null}
        </LayerDialog.Body>
        <LayerDialog.Actions dismissLabel="取消">
          <LayerDialog.Action loading={saveSpecs.isPending} disabled={!row || specsQuery.isLoading || Boolean(specsQuery.error) || saveSpecs.isPending} onClick={() => saveSpecs.mutate()}>保存规格</LayerDialog.Action>
        </LayerDialog.Actions>
      </LayerDialog.Content>
    </LayerDialog.Root>
    </>
  );
}
