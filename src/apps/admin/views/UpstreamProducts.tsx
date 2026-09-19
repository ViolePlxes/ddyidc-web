import { Banner, Button, Checkbox, Dialog, Input, LayerCard, Select, Switch, Table } from "@cloudflare/kumo";
import { ArrowsClockwiseIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { adminProductGroupsApi, type ProductGroup } from "../../../shared/api/adminProductGroups";
import { getApiMessage } from "../../../shared/api/request";
import { upstreamProductsApi, type CatalogProduct, type ProductMappingInput } from "../../../shared/api/upstreamProducts";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

function GroupSelectors({ roots, children, primaryId, secondaryId, onPrimaryChange, onSecondaryChange }: {
  roots: ProductGroup[];
  children: ProductGroup[];
  primaryId: string;
  secondaryId: string;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
}) {
  const secondaryItems = children.filter((item) => item.parentId === primaryId);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select label="本地一级分组" value={primaryId} onValueChange={(value) => { const next = value ?? "0"; onPrimaryChange(next); onSecondaryChange("0"); }} items={Object.fromEntries([["0", "暂不分组"], ...roots.map((item) => [item.id, item.name])])} />
      <Select label="本地二级分组" value={secondaryId} disabled={primaryId === "0"} onValueChange={(value) => onSecondaryChange(value ?? "0")} items={Object.fromEntries([["0", "请选择二级分组"], ...secondaryItems.map((item) => [item.id, item.name])])} />
    </div>
  );
}

function CatalogDialog({ supplierId, roots, children, onClose }: { supplierId: string; roots: ProductGroup[]; children: ProductGroup[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CatalogProduct[]>([]);
  const [primaryId, setPrimaryId] = useState("0");
  const [secondaryId, setSecondaryId] = useState("0");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"only_api" | "sync">("sync");
  const [profitType, setProfitType] = useState("2");
  const [profitValue, setProfitValue] = useState(0);
  const catalog = useQuery({ queryKey: ["admin", "upstream-catalog", supplierId, keyword, page], queryFn: () => upstreamProductsApi.catalog(supplierId, keyword, page), enabled: Boolean(supplierId) });

  useEffect(() => {
    if (selected.length === 1) {
      setName(selected[0]!.name);
      setDescription(selected[0]!.description);
    }
  }, [selected]);

  const save = useMutation({
    mutationFn: async () => {
      if (selected.length > 1) {
        await upstreamProductsApi.connect(supplierId, selected, secondaryId);
        return;
      }
      const item = selected[0]!;
      const input: ProductMappingInput = {
        supplierId,
        upstreamProductId: Number(item.upstreamProductId),
        name: name.trim() || item.name,
        description,
        productGroupId: secondaryId,
        profitType: Number(profitType),
        profitValue,
        renewProfitType: Number(profitType),
        renewProfitValue: profitValue,
        upgradeProfitType: Number(profitType),
        upgradeProfitValue: profitValue,
        priceBasis: "upstream",
        mode,
        autoSetup: true,
      };
      await upstreamProductsApi.create(input);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "upstream-products"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
      onClose();
    },
  });

  const toggle = (item: CatalogProduct, checked: boolean) => setSelected((current) => checked ? [...current.filter((value) => value.id !== item.id), item] : current.filter((value) => value.id !== item.id));
  const pageCount = Math.max(1, Math.ceil((catalog.data?.total ?? 0) / 20));
  const invalidGroup = primaryId !== "0" && secondaryId === "0";

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog size="xl" className="grid max-h-[90vh] gap-5 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-semibold">选择上游产品</Dialog.Title><Dialog.Description className="text-kumo-subtle">只对接手工勾选的目录商品；多选时按顺序逐个读取详情并发布。</Dialog.Description></div><Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" onClick={onClose} /></div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><Input label="搜索目录" placeholder="#ID-名称" value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} /><span className="self-end pb-2 text-sm text-kumo-subtle">已选择 {selected.length} 个</span></div>
        <PageState loading={catalog.isLoading} error={catalog.error ? getApiMessage(catalog.error) : null} empty={!catalog.isLoading && (catalog.data?.items.length ?? 0) === 0} emptyTitle="目录缓存暂无商品">
          <LayerCard className="shadow-none overflow-hidden p-0">
            <Table>
              <Table.Header variant="compact"><Table.Row><Table.Head>选择</Table.Head><Table.Head>上游商品</Table.Head><Table.Head>类型</Table.Head><Table.Head>成本参考</Table.Head></Table.Row></Table.Header>
              <Table.Body>{(catalog.data?.items ?? []).map((item) => <Table.Row key={item.id}><Table.Cell><Checkbox.Item checked={selected.some((value) => value.id === item.id)} onCheckedChange={(checked) => toggle(item, checked === true)} label={`选择 ${item.name}`} /></Table.Cell><Table.Cell><div className="grid"><strong className="text-kumo-strong">{item.name}</strong><span className="text-xs text-kumo-subtle">#{item.upstreamProductId}</span></div></Table.Cell><Table.Cell>{item.type || "—"}</Table.Cell><Table.Cell>¥{item.price.toFixed(2)} / {item.cycle || "周期待确认"}</Table.Cell></Table.Row>)}</Table.Body>
            </Table>
          </LayerCard>
        </PageState>
        <div className="flex items-center justify-between gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>上一页</Button><span className="text-sm text-kumo-subtle">第 {page} / {pageCount} 页</span><Button variant="secondary" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>下一页</Button></div>
        <GroupSelectors roots={roots} children={children} primaryId={primaryId} secondaryId={secondaryId} onPrimaryChange={setPrimaryId} onSecondaryChange={setSecondaryId} />
        {selected.length === 1 ? <div className="grid gap-4"><Input label="本地商品名称" value={name} onChange={(event) => setName(event.target.value)} /><Input label="商品描述" value={description} onChange={(event) => setDescription(event.target.value)} /><div className="grid gap-4 sm:grid-cols-3"><Select label="模式" value={mode} onValueChange={(value) => value && setMode(value as "only_api" | "sync")} items={{ only_api: "仅对接", sync: "发布本地商品" }} /><Select label="加价方式" value={profitType} onValueChange={(value) => setProfitType(value ?? "2")} items={{ "2": "百分比加价", "1": "固定加价" }} /><Input label={profitType === "1" ? "固定加价（元）" : "加价比例（%）"} type="number" min={0} value={profitValue} onChange={(event) => setProfitValue(Number(event.target.value))} /></div></div> : null}
        {selected.length > 1 ? <Banner variant="default" title="批量发布" description={`将按至少 2 秒间隔依次对接 ${selected.length} 个所选商品，并发布到所选二级分组。`} /> : null}
        {save.error ? <Banner variant="error" title="对接失败" description={getApiMessage(save.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button loading={save.isPending} disabled={!selected.length || invalidGroup} onClick={() => save.mutate()}>{selected.length > 1 ? "批量对接并发布" : "保存映射"}</Button></div>
      </Dialog>
    </Dialog.Root>
  );
}

export function UpstreamProducts() {
  const queryClient = useQueryClient();
  const traffic = useQuery({ queryKey: ["admin", "upstream-request-metrics"], queryFn: upstreamProductsApi.metrics, refetchInterval: 5_000, staleTime: 0 });
  const suppliers = useQuery({ queryKey: ["admin", "upstream-suppliers"], queryFn: upstreamProductsApi.suppliers });
  const [supplierId, setSupplierId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  useEffect(() => {
    if (!supplierId && suppliers.data?.length) setSupplierId(suppliers.data.find((item) => item.status === 1)?.id ?? suppliers.data[0]!.id);
  }, [supplierId, suppliers.data]);
  const products = useQuery({ queryKey: ["admin", "upstream-products", supplierId], queryFn: () => upstreamProductsApi.list(supplierId), enabled: Boolean(supplierId) });
  const roots = useQuery({ queryKey: ["admin", "product-groups", "0"], queryFn: () => adminProductGroupsApi.list("0") });
  const childQueries = useQueries({ queries: (roots.data?.list ?? []).map((root) => ({ queryKey: ["admin", "product-groups", root.id], queryFn: () => adminProductGroupsApi.list(root.id) })) });
  const children = useMemo(() => childQueries.flatMap((query) => query.data?.list ?? []), [childQueries]);
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin", "upstream-products"] }), queryClient.invalidateQueries({ queryKey: ["admin", "products"] }), queryClient.invalidateQueries({ queryKey: ["products"] })]); };
  const remove = useMutation({ mutationFn: () => upstreamProductsApi.remove(selectedRows), onSuccess: async () => { setSelectedRows([]); await refresh(); } });
  const hidden = useMutation({ mutationFn: ({ id, value }: { id: string; value: boolean }) => upstreamProductsApi.hidden(id, value), onSuccess: refresh });
  const sync = useMutation({ mutationFn: (id: string) => upstreamProductsApi.sync(id), onSuccess: refresh });
  const pull = useMutation({ mutationFn: () => upstreamProductsApi.pull(supplierId), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "upstream-catalog", supplierId] }); } });
  const lossGuard = useMutation({ mutationFn: upstreamProductsApi.setLossGuard, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "upstream-products"] }); } });
  const rows = products.data?.items ?? [];
  const ageSeconds = (checkedAt: number) => Math.max(0, Date.now() / 1000 - checkedAt);
  const staleRows = rows.filter((item) => !item.checkedAt || ageSeconds(item.checkedAt) > 86400);
  const checkedLabel = (checkedAt: number) => !checkedAt ? "暂无检查时间" : ageSeconds(checkedAt) > 86400 ? `${Math.max(1, Math.ceil(ageSeconds(checkedAt) / 86400))} 天未检查` : `上次检查：${ageSeconds(checkedAt) < 3600 ? `${Math.floor(ageSeconds(checkedAt) / 60)} 分钟` : `${Math.floor(ageSeconds(checkedAt) / 3600)} 小时`}前`;
  const metrics = [
    { label: "映射商品数", value: String(products.data?.total ?? 0), hint: `已发布 ${rows.filter((item) => item.mode === "sync").length} 个` },
    { label: "可见映射", value: String(rows.filter((item) => !item.hidden).length), hint: "当前筛选结果" },
    { label: "平均成本", value: rows.length ? `¥${(rows.reduce((sum, item) => sum + item.cost, 0) / rows.length).toFixed(2)}` : "¥0.00", hint: "按供应商汇率换算" },
    { label: "需手动同步", value: String(rows.filter((item) => item.mode === "only_api").length), hint: "仅对接模式" },
  ];
  const operationError = remove.error || hidden.error || sync.error || pull.error || lossGuard.error;

  return (
    <>
      <PageHeader title="上游产品管理" description="从缓存目录选择商品，指定本地两级分组后建立映射或发布。" actions={<div className="flex gap-2"><Button variant="secondary" icon={<TrashIcon />} disabled={!selectedRows.length} loading={remove.isPending} onClick={() => remove.mutate()}>批量删除</Button><Button icon={<PlusIcon />} disabled={!supplierId} onClick={() => setDialogOpen(true)}>添加映射</Button></div>} />
      <MetricGrid metrics={metrics} />
      <LayerCard className="grid gap-3 overflow-x-auto p-4">
        <h2 className="font-semibold">上游访问频率实时观察</h2>
        <p className="text-sm text-kumo-subtle">实时观察数据，不持久化，服务重启清零。当前后端进程按分钟桶统计，含失败与重试；平均间隔为最近 15 分钟内请求间隔，少于两次显示 —。每 5 秒更新。</p>
        {traffic.error ? <Banner variant="error" title="统计读取失败" description={getApiMessage(traffic.error)} /> : null}
        <Table><Table.Header variant="compact"><Table.Row><Table.Head>供应商</Table.Head><Table.Head>最近 1 分钟</Table.Head><Table.Head>最近 5 分钟</Table.Head><Table.Head>最近 15 分钟</Table.Head><Table.Head>平均间隔（秒）</Table.Head></Table.Row></Table.Header><Table.Body>{(traffic.data?.items ?? []).map((item) => <Table.Row key={item.supplierId}><Table.Cell>{item.name}</Table.Cell><Table.Cell>{item.oneMinute}</Table.Cell><Table.Cell>{item.fiveMinutes}</Table.Cell><Table.Cell>{item.fifteenMinutes}</Table.Cell><Table.Cell>{item.averageInterval == null ? "—" : item.averageInterval.toFixed(2)}</Table.Cell></Table.Row>)}</Table.Body></Table>
      </LayerCard>
      <LayerCard className="shadow-none grid gap-4 p-4 lg:grid-cols-[minmax(14rem,1fr)_auto_minmax(14rem,1fr)] lg:items-end">
        <Select label="供应商" value={supplierId} onValueChange={(value) => { setSupplierId(value ?? ""); setSelectedRows([]); }} items={Object.fromEntries((suppliers.data ?? []).map((item) => [item.id, `${item.name}（${item.type}）`]))} />
        <Button variant="secondary" icon={<ArrowsClockwiseIcon />} loading={pull.isPending} disabled={!supplierId} onClick={() => pull.mutate()}>同步目录</Button>
        <Switch label="亏本交易拦截" checked={products.data?.lossGuard ?? false} onCheckedChange={(checked) => lossGuard.mutate(checked)} />
      </LayerCard>
      {operationError ? <Banner variant="error" title="操作失败" description={getApiMessage(operationError)} /> : null}
      {staleRows.length ? <Banner variant="alert" title={`已对接商品配置 ${Math.max(1, ...staleRows.filter((item) => item.checkedAt).map((item) => Math.ceil(ageSeconds(item.checkedAt) / 86400)))} 天未检查，建议检查`} description={`当前列表 ${staleRows.length} 个商品需检查；各商品时间见名称下方。仅查询本地检查记录与快照。`} /> : rows.length ? <p className="text-sm text-kumo-subtle">{checkedLabel(Math.min(...rows.map((item) => item.checkedAt)))}</p> : null}
      {sync.data ? <Banner title={`上游商品 #${sync.data.summary.upstreamProductId} 本次配置变更汇总`} description={`价格变更 ${sync.data.summary.price} 个 · 库存变更 ${sync.data.summary.stock} 个 · 规格配置变更 ${sync.data.summary.specification} 个 · 上游下架/不可用 ${sync.data.summary.unavailable} 个 · 无变化 ${sync.data.summary.unchanged} 个。${!sync.data.summary.stockCompared || !sync.data.summary.specificationCompared ? "缺少可比快照的维度未计入变更；无变化仅指可比较部分。" : ""}`} /> : null}
      <PageState loading={suppliers.isLoading || products.isLoading} error={suppliers.error ? getApiMessage(suppliers.error) : products.error ? getApiMessage(products.error) : null} empty={!products.isLoading && rows.length === 0} emptyTitle="暂无上游商品映射">
        <LayerCard className="shadow-none overflow-x-auto p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>选择</Table.Head><Table.Head>映射商品</Table.Head><Table.Head>所属分组</Table.Head><Table.Head>模式</Table.Head><Table.Head>成本/售价</Table.Head><Table.Head>显示</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{rows.map((item) => <Table.Row key={item.id}><Table.Cell><Checkbox.Item label={`选择 ${item.name}`} checked={selectedRows.includes(item.id)} onCheckedChange={(checked) => setSelectedRows((current) => checked === true ? [...current, item.id] : current.filter((id) => id !== item.id))} /></Table.Cell><Table.Cell><div className="grid"><strong className="text-kumo-strong">{item.name}</strong><span className="text-xs text-kumo-subtle">#{item.upstreamProductId} · 本地 #{item.productId || "未发布"}</span><span className="text-xs text-kumo-subtle">{checkedLabel(item.checkedAt)}</span></div></Table.Cell><Table.Cell>{item.groupName || "未分组"}</Table.Cell><Table.Cell>{item.mode === "sync" ? "已发布（sync）" : "仅对接（only_api）"}</Table.Cell><Table.Cell><div className="grid"><span>成本 ¥{item.cost.toFixed(2)}</span><span className="text-xs text-kumo-subtle">售价 ¥{item.price.toFixed(2)}</span></div></Table.Cell><Table.Cell><Switch label={item.hidden ? "隐藏" : "显示"} checked={!item.hidden} onCheckedChange={(checked) => hidden.mutate({ id: item.id, value: !checked })} /></Table.Cell><Table.Cell><Button variant="secondary" loading={sync.isPending && sync.variables === item.id} onClick={() => sync.mutate(item.id)}>同步</Button></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
      </PageState>
      {dialogOpen ? <CatalogDialog supplierId={supplierId} roots={roots.data?.list ?? []} children={children} onClose={() => setDialogOpen(false)} /> : null}
    </>
  );
}
