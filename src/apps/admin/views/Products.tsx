import { Banner, Button, Dialog, Input, LayerCard, Select, Table } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { adminProductGroupsApi } from "../../../shared/api/adminProductGroups";
import { adminProductsApi, type AdminProduct } from "../../../shared/api/adminProducts";
import type { ProductSpec } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

function SpecsDialog({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const queryClient = useQueryClient();
  const specsQuery = useQuery({ queryKey: ["admin", "products", product.id, "specs"], queryFn: () => adminProductsApi.specs(product.id) });
  const [row, setRow] = useState<ProductSpec | null>(null);
  useEffect(() => { if (specsQuery.data?.items[0]) setRow({ ...specsQuery.data.items[0] }); }, [specsQuery.data]);
  const save = useMutation({
    mutationFn: () => {
      if (!row) throw new Error("规格数据尚未加载");
      const { id: _id, productId: _productId, ...input } = row;
      return adminProductsApi.saveSpecs(product.id, [{ ...input, sort: 0 }]);
    },
    onSuccess: async () => {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin", "products"] }), queryClient.invalidateQueries({ queryKey: ["product", product.id] }), queryClient.invalidateQueries({ queryKey: ["products"] })]);
      onClose();
    },
  });
  const update = <K extends keyof ProductSpec>(key: K, value: ProductSpec[K]) => setRow((current) => current ? { ...current, [key]: value } : current);
  const upstreamStock = specsQuery.data?.upstreamStock;
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog size="xl" className="grid max-h-[90vh] gap-5 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div><Dialog.Title className="text-xl font-semibold">商品规格配置</Dialog.Title><Dialog.Description className="text-kumo-subtle">{product.name} · 每个商品保存一条规格配置。</Dialog.Description></div>
          <Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" onClick={onClose} />
        </div>
        <PageState loading={specsQuery.isLoading} error={specsQuery.error ? getApiMessage(specsQuery.error) : null}>
          {row ? <div className="grid gap-4">
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
          </div> : null}
        </PageState>
        {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button loading={save.isPending} disabled={!row || specsQuery.isLoading || Boolean(specsQuery.error)} onClick={() => save.mutate()}>保存规格</Button></div>
      </Dialog>
    </Dialog.Root>
  );
}
export function AdminProducts() {
  const queryClient = useQueryClient();
  const [activeProduct, setActiveProduct] = useState<AdminProduct | null>(null);
  const [groupId, setGroupId] = useState("all");
  const roots = useQuery({ queryKey: ["admin", "product-groups", "0"], queryFn: () => adminProductGroupsApi.list("0") });
  const childQueries = useQueries({ queries: (roots.data?.list ?? []).map((root) => ({ queryKey: ["admin", "product-groups", root.id], queryFn: () => adminProductGroupsApi.list(root.id) })) });
  const groupItems = useMemo(() => Object.fromEntries([
    ["all", "全部二级分组"],
    ...childQueries.flatMap((query, index) => (query.data?.list ?? []).map((group) => [group.id, `${roots.data?.list[index]?.name ?? "商品分组"} / ${group.name}`])),
  ]), [childQueries, roots.data?.list]);
  const products = useQuery({ queryKey: ["admin", "products", groupId], queryFn: () => adminProductsApi.list(groupId === "all" ? undefined : groupId) });
  const sort = useMutation({
    mutationFn: (ids: string[]) => adminProductsApi.sort(groupId, ids),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
  });
  const move = (index: number, offset: number) => {
    const rows = products.data?.items ?? [];
    const target = index + offset;
    if (groupId === "all" || target < 0 || target >= rows.length) return;
    const ordered = [...rows];
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    sort.mutate(ordered.map((item) => item.id));
  };
  return (
    <>
      <PageHeader title="商品管理" description="维护商品分组顺序与单商品规格。" />
      <LayerCard className="p-4"><Select label="二级分组筛选" value={groupId} onValueChange={(value) => setGroupId(value ?? "all")} items={groupItems} /></LayerCard>
      {sort.error ? <Banner variant="error" title="排序保存失败" description={getApiMessage(sort.error)} /> : null}
      <PageState loading={products.isLoading} error={products.error ? getApiMessage(products.error) : null} empty={!products.isLoading && !products.error && (products.data?.items.length ?? 0) === 0} emptyTitle="暂无商品">
        <LayerCard className="overflow-hidden p-0">
          <Table>
            <Table.Header variant="compact"><Table.Row><Table.Head>商品</Table.Head><Table.Head>所属分组</Table.Head><Table.Head>售价</Table.Head><Table.Head>周期</Table.Head><Table.Head>规格配置</Table.Head><Table.Head>状态</Table.Head><Table.Head>排序</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header>
            <Table.Body>
              {(products.data?.items ?? []).map((product, index, rows) => (
                <Table.Row key={product.id}><Table.Cell><div className="grid"><strong className="text-kumo-strong">{product.name}</strong><span className="text-xs text-kumo-subtle">#{product.id}</span></div></Table.Cell><Table.Cell>{product.groupName || "未分组"}</Table.Cell><Table.Cell>¥{product.price.toFixed(2)}</Table.Cell><Table.Cell>{product.cycle || "—"}</Table.Cell><Table.Cell>{product.specCount ? "已配置" : "上游快照"}</Table.Cell><Table.Cell>{product.status === 1 && !product.hidden ? "销售中" : "未上架"}</Table.Cell><Table.Cell>{product.sort}</Table.Cell><Table.Cell><div className="flex flex-wrap gap-2"><Button variant="secondary" shape="square" icon={<ArrowUpIcon />} aria-label="商品上移" disabled={groupId === "all" || index === 0 || sort.isPending} onClick={() => move(index, -1)} /><Button variant="secondary" shape="square" icon={<ArrowDownIcon />} aria-label="商品下移" disabled={groupId === "all" || index === rows.length - 1 || sort.isPending} onClick={() => move(index, 1)} /><Button variant="secondary" onClick={() => setActiveProduct(product)}>规格配置</Button></div></Table.Cell></Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
      {activeProduct ? <SpecsDialog product={activeProduct} onClose={() => setActiveProduct(null)} /> : null}
    </>
  );
}
