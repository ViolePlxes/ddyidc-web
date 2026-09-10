import { Banner, Button, Dialog, Input, LayerCard, Select, Table } from "@cloudflare/kumo";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { adminProductsApi, type AdminProduct } from "../../../shared/api/adminProducts";
import type { ProductSpec } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

function emptySpec(productId: string, index: number): ProductSpec {
  return {
    id: `new-${Date.now()}-${index}`,
    productId,
    name: "",
    vcpu: 1,
    memory: "1 GiB",
    processorModel: "",
    processorFrequency: "",
    defense: "",
    upstreamBandwidth: "",
    downstreamRate: "",
    stock: null,
    priceMode: "fixed",
    price: 0,
    sort: index,
  };
}

function SpecsDialog({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const queryClient = useQueryClient();
  const specsQuery = useQuery({
    queryKey: ["admin", "products", product.id, "specs"],
    queryFn: () => adminProductsApi.specs(product.id),
  });
  const [rows, setRows] = useState<ProductSpec[]>([]);
  useEffect(() => {
    if (specsQuery.data) setRows(specsQuery.data.items.map((item) => ({ ...item })));
  }, [specsQuery.data]);

  const save = useMutation({
    mutationFn: () => adminProductsApi.saveSpecs(product.id, rows.map(({ id: _id, productId: _productId, ...row }, index) => ({ ...row, sort: index }))),
    onSuccess: async (result) => {
      setRows(result.items);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["product", product.id] }),
      ]);
      onClose();
    },
  });

  const update = <K extends keyof ProductSpec>(index: number, key: K, value: ProductSpec[K]) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row));
  };
  const move = (index: number, offset: number) => {
    setRows((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog size="xl" className="grid max-h-[90vh] gap-5 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div><Dialog.Title className="text-xl font-semibold">商品规格配置</Dialog.Title><Dialog.Description className="text-kumo-subtle">{product.name} · 规格行由运营维护，不读取上游商品描述。</Dialog.Description></div>
          <Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" onClick={onClose} />
        </div>
        <PageState loading={specsQuery.isLoading} error={specsQuery.error ? getApiMessage(specsQuery.error) : null}>
          <div className="grid gap-4">
            {rows.length ? rows.map((row, index) => (
              <LayerCard key={row.id} className="grid gap-4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-kumo-strong">规格 {index + 1}</strong>
                  <div className="flex gap-2">
                    <Button variant="secondary" shape="square" icon={<ArrowUpIcon />} aria-label="上移" disabled={index === 0} onClick={() => move(index, -1)} />
                    <Button variant="secondary" shape="square" icon={<ArrowDownIcon />} aria-label="下移" disabled={index === rows.length - 1} onClick={() => move(index, 1)} />
                    <Button variant="destructive" shape="square" icon={<TrashIcon />} aria-label="删除规格" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input label="实例规格" value={row.name} onChange={(event) => update(index, "name", event.target.value)} />
                  <Input label="vCPU" type="number" min={1} max={1024} value={row.vcpu} onChange={(event) => update(index, "vcpu", Number(event.target.value))} />
                  <Input label="内存" value={row.memory} onChange={(event) => update(index, "memory", event.target.value)} />
                  <Input label="处理器型号" value={row.processorModel} onChange={(event) => update(index, "processorModel", event.target.value)} />
                  <Input label="处理器主频/睿频" value={row.processorFrequency} onChange={(event) => update(index, "processorFrequency", event.target.value)} />
                  <Input label="基础防御" value={row.defense} onChange={(event) => update(index, "defense", event.target.value)} />
                  <Input label="上行带宽" value={row.upstreamBandwidth} onChange={(event) => update(index, "upstreamBandwidth", event.target.value)} />
                  <Input label="下行速率" value={row.downstreamRate} onChange={(event) => update(index, "downstreamRate", event.target.value)} />
                  <Input label="库存数量（留空为充足）" type="number" min={0} value={row.stock ?? ""} onChange={(event) => update(index, "stock", event.target.value === "" ? null : Number(event.target.value))} />
                  <Select label="价格模式" value={row.priceMode} onValueChange={(value) => value && update(index, "priceMode", value as ProductSpec["priceMode"])} items={{ fixed: "固定售价", upstream: "跟随上游代理价" }} />
                  <Input label="月价（元）" type="number" min={0} step="0.01" value={row.price} disabled={row.priceMode === "upstream"} description={row.priceMode === "upstream" ? `当前代理价 ¥${product.price.toFixed(2)}` : undefined} onChange={(event) => update(index, "price", Number(event.target.value))} />
                </div>
              </LayerCard>
            )) : <LayerCard className="p-5 text-sm text-kumo-subtle">尚未配置规格。前台会显示“规格待配置”并暂停购买。</LayerCard>}
            <Button variant="secondary" icon={<PlusIcon />} onClick={() => setRows((current) => [...current, emptySpec(product.id, current.length)])}>添加规格</Button>
          </div>
        </PageState>
        {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button loading={save.isPending} disabled={specsQuery.isLoading || Boolean(specsQuery.error)} onClick={() => save.mutate()}>保存规格</Button></div>
      </Dialog>
    </Dialog.Root>
  );
}

export function AdminProducts() {
  const [activeProduct, setActiveProduct] = useState<AdminProduct | null>(null);
  const products = useQuery({ queryKey: ["admin", "products"], queryFn: adminProductsApi.list });
  return (
    <>
      <PageHeader title="商品管理" description="维护商品状态与人工销售规格。" />
      <PageState loading={products.isLoading} error={products.error ? getApiMessage(products.error) : null} empty={!products.isLoading && !products.error && products.data?.items.length === 0} emptyTitle="暂无商品">
        <LayerCard className="overflow-hidden p-0">
          <Table>
            <Table.Header variant="compact"><Table.Row><Table.Head>商品</Table.Head><Table.Head>售价</Table.Head><Table.Head>周期</Table.Head><Table.Head>规格行</Table.Head><Table.Head>状态</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header>
            <Table.Body>
              {(products.data?.items ?? []).map((product) => (
                <Table.Row key={product.id}><Table.Cell><div className="grid"><strong className="text-kumo-strong">{product.name}</strong><span className="text-xs text-kumo-subtle">#{product.id}</span></div></Table.Cell><Table.Cell>¥{product.price.toFixed(2)}</Table.Cell><Table.Cell>{product.cycle || "—"}</Table.Cell><Table.Cell>{product.specCount} 行</Table.Cell><Table.Cell>{product.status === 1 && !product.hidden ? "销售中" : "未上架"}</Table.Cell><Table.Cell><Button variant="secondary" onClick={() => setActiveProduct(product)}>规格配置</Button></Table.Cell></Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
      {activeProduct ? <SpecsDialog product={activeProduct} onClose={() => setActiveProduct(null)} /> : null}
    </>
  );
}
