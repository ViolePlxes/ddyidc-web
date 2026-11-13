import { Pagination } from "../../../shared/components/Pagination";
import { Badge } from "../../../shared/components/Badge";
import { Banner, Button, LayerCard, Radio, Select, Tabs } from "@cloudflare/kumo";

import { ArrowRightIcon, PackageIcon, WindowsLogoIcon, LinuxLogoIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { type CatalogProduct, type ProductGroupSummary, type ProductSummary } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { CardSkeleton, ProductBillSkeleton, ProductConfigSkeleton } from "../../../shared/components/skeletons";
import { MobileBillDock } from "../../../shared/components/MobileBillDock";
import { MobileCatalogSpecs } from "../../../shared/components/MobileSpecList";
import { useCatalogDesktopLayout } from "../../../shared/hooks/useMediaQuery";
import { ProductConfig } from "../../../shared/components/ProductConfig";
import { ProductSteps, scrollToProductStep } from "../../../shared/components/ProductSteps";
import { useOrderPage, useProduct, useProducts } from "../../../shared/hooks/useConsoleData";
import { cycleLabels } from "../../../shared/utils/format";

import { belongsToGroup, catalogLayout, catalogStock, isCatalogAvailable as isAvailable, isUpstreamProduct, secondaryGroups } from "../../../shared/utils/productCatalog";
import { ConfigurableTable, type TableColumn } from "../../../shared/components/ConfigurableTable";

function productSummary(product: ProductSummary) {
  return (product.summary || product.description || "暂无商品简介")
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function groupName(product: ProductSummary) {
  return product.groupName?.trim() || `商品分组 ${product.groupId}`;
}

function primaryGroupId(product: ProductSummary) {
  return product.parentGroupId && product.parentGroupId !== "0" ? product.parentGroupId : product.groupId;
}

export function buildPrimaryGroups(products: ProductSummary[], groups: ProductGroupSummary[]) {
  const result = new Map<string, string>();
  for (const group of groups.filter((item) => item.parentId === "0").sort((left, right) => left.sort - right.sort)) {
    result.set(group.id, group.name);
  }
  for (const product of products) {
    const id = primaryGroupId(product);
    if (!result.has(id)) result.set(id, groupName(product));
  }
  return result;
}

export function ProductCategories({ primaryGroups, selectedGroup, children, secondary, loading, onPrimaryChange, onSecondaryChange }: {
 primaryGroups: Map<string,string>; selectedGroup: string; children: ProductGroupSummary[]; secondary?: ProductGroupSummary; loading: boolean; onPrimaryChange: (value:string)=>void; onSecondaryChange:(value:string)=>void;
}) { return (<LayerCard className="grid min-w-0 gap-3 px-4 py-3" aria-label="产品分类">
              <div className="flex min-w-0 items-center gap-3">
                <strong className="shrink-0 whitespace-nowrap font-medium">一级分类</strong>
                <div className="min-w-0 overflow-x-auto p-1"><Tabs variant="segmented" listClassName="w-max"
                  tabs={Array.from(primaryGroups, ([value, label]) => ({ value, label }))}
                  value={selectedGroup} onValueChange={(value) => { onPrimaryChange(value); }}
                /></div>
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <strong className="shrink-0 whitespace-nowrap font-medium">二级分类</strong>
                <div className="min-w-0 overflow-x-auto p-1">{children.length ? <Tabs variant="segmented"
                  listClassName="w-max"
                  tabs={children.map((group) => ({ value: group.id, label: group.name, className: "shrink-0 whitespace-nowrap" }))}
                  value={secondary?.id ?? ""} onValueChange={(value) => { onSecondaryChange(value); }}
                /> : <span>{loading ? "正在加载分类…" : "当前一级分类暂无二级分类，请切换其他分类。"}</span>}</div>
              </div>
            </LayerCard>); }

/** Mobile category picker: `Select` for the primary level, scrollable chips for the secondary. */
function MobileProductCategories({ primaryGroups, selectedGroup, children, secondary, loading, onPrimaryChange, onSecondaryChange }: {
 primaryGroups: Map<string,string>; selectedGroup: string; children: ProductGroupSummary[]; secondary?: ProductGroupSummary; loading: boolean; onPrimaryChange: (value:string)=>void; onSecondaryChange:(value:string)=>void;
}) {
  const primaryItems = Object.fromEntries(Array.from(primaryGroups, ([value, label]) => [value, label]));
  return (<LayerCard className="grid min-w-0 gap-3 px-4 py-3" aria-label="产品分类">
              <Select label="一级分类" value={selectedGroup} items={primaryItems} onValueChange={(value) => { if (value) onPrimaryChange(value); }} />
              <div className="grid min-w-0 gap-2">
                <strong className="font-medium">二级分类</strong>
                <div className="-mx-1 min-w-0 overflow-x-auto p-1">{children.length ? <Tabs variant="segmented"
                  listClassName="w-max"
                  tabs={children.map((group) => ({ value: group.id, label: group.name, className: "shrink-0 whitespace-nowrap" }))}
                  value={secondary?.id ?? ""} onValueChange={(value) => { onSecondaryChange(value); }}
                /> : <span className="text-sm text-kumo-subtle">{loading ? "正在加载分类…" : "当前一级分类暂无二级分类，请切换其他分类。"}</span>}</div>
              </div>
            </LayerCard>); }

function PublicProductCatalog() {
  const query = useProducts();
  const products = query.data?.items ?? [];
  const primaryGroups = buildPrimaryGroups(products, query.data?.groups ?? []);
  const groups = Object.entries(
    products.reduce<Record<string, typeof products>>((result, product) => {
      (result[primaryGroupId(product)] ??= []).push(product);
      return result;
    }, {}),
  ).sort(([left], [right]) => Array.from(primaryGroups.keys()).indexOf(left) - Array.from(primaryGroups.keys()).indexOf(right));

  return (
    <>
      <PageHeader title="订购产品" description="商品、库存和价格均来自实时目录。" />
      <PageState
        loading={query.isLoading}
        skeleton="products"
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.error && products.length === 0}
        emptyTitle="暂无可售商品"
      >
        <div className="grid gap-6">
          {groups.map(([groupId, items]) => (
            <section key={groupId} className="grid gap-3">
              <h2 className="text-lg font-semibold text-kumo-strong">{primaryGroups.get(groupId) ?? groupName(items[0]!)}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-animate-list>
                {items.map((product) => {
                  const unavailable = !isAvailable(product);
                  return (
                    <LayerCard key={product.id} className=" flex h-80 flex-col gap-4 px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid size-10 place-items-center bg-kumo-control text-kumo-brand"><PackageIcon /></div>
                        <Badge variant={unavailable ? "secondary" : "success"}>{unavailable ? "暂无库存" : "可订购"}</Badge>
                      </div>
                      <div className="grid gap-2">
                        <h3 className="text-lg font-semibold text-kumo-strong">{product.name}</h3>
                        <p className="line-clamp-3 text-base text-kumo-subtle">{productSummary(product)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{cycleLabels[product.cycle] || product.cycle || "周期以详情为准"}</Badge>
                        <Badge variant="outline">{product.moduleType}</Badge>
                      </div>
                      <div className="mt-auto flex items-end justify-between gap-4 border-t border-kumo-line pt-4">
                        <div>
                          <strong className="text-base text-kumo-strong font-medium">¥{product.price.toFixed(2)}</strong>
                        </div>
                        <Link to={`/products/${product.id}`} viewTransition>
                          <Button icon={<ArrowRightIcon />} disabled={unavailable}>查看配置</Button>
                        </Link>
                      </div>
                    </LayerCard>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </PageState>
    </>
  );
}

export const catalogTableColumns: readonly TableColumn[] = [
  { key: "name", label: "实例规格", width: 240, min: 180, required: true },
  { key: "vcpu", label: "vCPU", width: 90, min: 70, type: "N" },
  { key: "memory", label: "内存", width: 100, min: 80 },
  { key: "processor", label: "处理器型号", width: 190, min: 140 },
  { key: "frequency", label: "处理器主频 / 睿频", width: 180, min: 140 },
  { key: "defense", label: "基础防御", width: 120, min: 90 },
  { key: "upstream", label: "上行带宽", width: 120, min: 90 },
  { key: "downstream", label: "下行速率", width: 120, min: 90 },
  { key: "stock", label: "库存数量", width: 110, min: 90, type: "N" },
  { key: "system", label: "系统", width: 130, min: 110 },
  { key: "price", label: "参考价格", width: 120, min: 100, type: "N" },
];

export function catalogCell(product: CatalogProduct, key: string): ReactNode {
  const spec = product.catalogSpec;
  switch (key) {
    case "name":
      return <Radio.Item value={product.id} label={spec?.name || product.name} disabled={!isAvailable(product)} />;
    case "vcpu":
      return spec?.vcpu || "—";
    case "memory":
      return spec?.memory || "—";
    case "processor":
      return spec?.processorModel || "—";
    case "frequency":
      return spec?.processorFrequency || "—";
    case "defense":
      return spec?.defense || "—";
    case "upstream":
      return spec?.upstreamBandwidth || "—";
    case "downstream":
      return spec?.downstreamRate || "—";
    case "stock": {
      const stock = catalogStock(product);
      return stock === null || stock === undefined || stock === "" ? "—" : stock;
    }
    case "system": {
      const family = (spec?.osFamily || "all").toLowerCase();
      const supportsWindows = family !== "linux";
      const supportsLinux = family !== "windows";
      const label = supportsWindows && supportsLinux ? "系统类型：Windows、Linux" : supportsWindows ? "系统类型：Windows" : "系统类型：Linux";
      return <div className="flex items-center gap-2 text-kumo-subtle" aria-label={label}>{supportsWindows ? <span title="Windows"><WindowsLogoIcon size={18} aria-label="Windows" /></span> : null}{supportsLinux ? <span title="Linux"><LinuxLogoIcon size={18} aria-label="Linux" /></span> : null}</div>;
    }
    case "price": {
      const unit = (cycleLabels[product.cycle] ?? "").replace(/付$/, "") || "周期";
      return `¥${(isUpstreamProduct(product) ? product.price : spec?.price ?? product.price).toFixed(2)}/${unit}`;
    }
    default:
      return null;
  }
}
function IntegratedProductCatalog() {
  const productsQuery = useProducts();
  const products = productsQuery.data?.items ?? [];
  const groups = productsQuery.data?.groups ?? [];
  const [selectedGroupId, setSelectedGroup] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedSecondaryId, setSelectedSecondaryId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [billTarget, setBillTarget] = useState<HTMLDivElement | null>(null);
  const [stepsTarget, setStepsTarget] = useState<HTMLDivElement | null>(null);
  // Mobile hosts: the bottom bar and the body of the 明细 dialog.
  const [billBar, setBillBar] = useState<HTMLDivElement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const desktop = useCatalogDesktopLayout();
  const primaryGroups = useMemo(() => buildPrimaryGroups(products, groups), [groups, products]);
  const selectedGroup = primaryGroups.has(selectedGroupId) ? selectedGroupId : (primaryGroups.keys().next().value ?? "all");
  const children = secondaryGroups(groups, selectedGroup);
  const secondary = children.find((group) => group.id === selectedSecondaryId) ?? children[0];
  const visibleProducts = secondary ? products.filter((product) => belongsToGroup(product, secondary)) : [];
  const linkedProducts = visibleProducts.filter(isUpstreamProduct);
  const catalogIssue = !productsQuery.isLoading && !productsQuery.error && (
    (products.length === 0 && groups.length > 0) ||
    (products.length > 0 && !products.some(isUpstreamProduct)) ||
    (products.length > 0 && !groups.some(group => products.some(item => belongsToGroup(item, group))))
  );
  const categoryIssue = (visibleProducts.length > 0 && linkedProducts.length === 0)
    || (Boolean(secondary) && visibleProducts.length === 0 && products.some(item => item.groupId === secondary?.id));
  const recoveryAttempted = useRef(false);
  const [diagnosticCopied, setDiagnosticCopied] = useState(false);
  const [diagnosticNotice, setDiagnosticNotice] = useState("");
  useEffect(() => {
    if (catalogIssue && !recoveryAttempted.current && !productsQuery.isFetching) {
      recoveryAttempted.current = true;
      void productsQuery.refetch();
    }
  }, [catalogIssue, productsQuery.isFetching, productsQuery.refetch]);
  const retryCatalog = () => { void productsQuery.refetch(); };
  const copyDiagnostic = async () => {
    const diagnostic = {
      module: "product-catalog", version: import.meta.env.VITE_DDYIDC_VERSION || "unmarked",
      recordedAt: new Date().toISOString(), total: productsQuery.data?.total ?? null,
      loaded: products.length, groups: groups.length, matched: visibleProducts.length,
      selectable: linkedProducts.length,
      state: productsQuery.error ? "request-error" : catalogIssue ? "catalog-inconsistent" : categoryIssue ? "category-unavailable" : "category-empty",
    };
    try { await navigator.clipboard.writeText(JSON.stringify(diagnostic)); setDiagnosticCopied(true); }
    catch { setDiagnosticCopied(false); setDiagnosticNotice("浏览器不支持复制，请截图此页面联系平台客服。"); }
  };

  const currentPage = Math.min(page, Math.max(1, Math.ceil(linkedProducts.length / perPage)));
  const pageProducts = linkedProducts.slice((currentPage - 1) * perPage, currentPage * perPage);
  const product = pageProducts.find((item) => item.id === selectedProductId && isAvailable(item))
    ?? pageProducts.find(isAvailable);
  // Only the selected SKU loads purchase details. Never render another SKU's
  // placeholder detail while React Query changes keys.
  const detailQuery = useProduct(product?.id ?? "");
  const detail = !detailQuery.isPlaceholderData && detailQuery.data?.id === product?.id ? detailQuery.data : undefined;
  const orderPageQuery = useOrderPage(detail?.id ?? "", detail?.configurable ?? false);
  const orderPage = orderPageQuery.isPlaceholderData ? undefined : orderPageQuery.data;
  const configError = detailQuery.error ?? (detail ? orderPageQuery.error : null);
  const configLoading = Boolean(product) && !configError && (!detail || orderPageQuery.isPending || orderPageQuery.isPlaceholderData);
  const retryConfig = () => {
    if (!detail || detailQuery.error) void detailQuery.refetch();
    else void orderPageQuery.refetch();
  };
  // Category switches clear the selection. On mobile also return to the top of
  // the spec list when it has already scrolled out of view above.
  const keepSpecsVisible = () => {
    if (desktop) return;
    const pane = document.querySelector("[data-dashboard-scroll]");
    const target = document.getElementById("catalog-specifications");
    if (!target) return;
    const offset = pane ? target.getBoundingClientRect().top - pane.getBoundingClientRect().top : target.getBoundingClientRect().top;
    if (offset < 0) scrollToProductStep("catalog-specifications", pane);
  };
  const selectPrimary = (value: string) => { setSelectedGroup(value); setSelectedSecondaryId(""); setSelectedProductId(""); setPage(1); keepSpecsVisible(); };
  const selectSecondary = (value: string) => { setSelectedSecondaryId(value); setSelectedProductId(""); setPage(1); keepSpecsVisible(); };
  return (
    <>
      <PageHeader title="订购产品" description="选择分类和计算规格，再配置资源与购买周期。" />
      <PageState loading={productsQuery.isLoading} keepContent>
        <div className={desktop ? catalogLayout : "grid min-w-0 gap-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]"}>
          {desktop ? (
            <aside className="hidden min-w-0 xl:sticky xl:top-4 xl:flex xl:max-h-[calc(100dvh-12rem)] xl:flex-col xl:overflow-y-auto">
              <div ref={setStepsTarget} />
              {configLoading || !orderPage || !detail ? <ProductSteps steps={[{ id: "catalog-specifications", title: "计算规格" }]} /> : null}
            </aside>
          ) : null}
          <div className="grid min-w-0 gap-5">
            {desktop ? <ProductCategories primaryGroups={primaryGroups} selectedGroup={selectedGroup} children={children} secondary={secondary} loading={productsQuery.isLoading}
              onPrimaryChange={selectPrimary}
              onSecondaryChange={selectSecondary} /> : <MobileProductCategories primaryGroups={primaryGroups} selectedGroup={selectedGroup} children={children} secondary={secondary} loading={productsQuery.isLoading}
              onPrimaryChange={selectPrimary}
              onSecondaryChange={selectSecondary} />}
            {desktop ? null : <div ref={setStepsTarget} className="min-w-0" />}
            {desktop || (!configLoading && orderPage && detail) ? null : <ProductSteps steps={[{ id: "catalog-specifications", title: "计算规格" }]} variant="chips" />}

            <section id="catalog-specifications" className="grid min-w-0 scroll-mt-4 gap-4">
              <h2 className="text-lg font-semibold text-kumo-strong">计算规格</h2>
              {catalogIssue || categoryIssue || productsQuery.error ? (<div className="grid gap-3"><Banner variant="error"
                title={productsQuery.error ? "商品目录加载失败" : "商品目录暂不可用"}
                description={"未能确认当前分类的可选商品，请重新加载；仍无法显示时，可将诊断信息提供给客服。" + diagnosticNotice}
                />
                <div className="flex flex-wrap gap-2"><Button variant="secondary" loading={productsQuery.isFetching} onClick={retryCatalog}>重新加载</Button><Button variant="secondary" onClick={() => void copyDiagnostic()}>{diagnosticCopied ? "已复制诊断信息" : "复制诊断信息"}</Button></div></div>)
                : desktop ? (
                  productsQuery.isLoading || linkedProducts.length ? <Radio.Group aria-label="计算规格" value={product?.id ?? ""} onValueChange={setSelectedProductId}>
                    <ConfigurableTable<CatalogProduct>
                      columns={catalogTableColumns}
                      rows={productsQuery.isLoading ? [] : pageProducts}
                      storageKey={`ddyidc-console-catalog-specs:${secondary?.id ?? selectedGroup}`}
                      label="计算规格"
                      loading={productsQuery.isLoading}
                      renderCell={catalogCell}
                      rowKey={(item) => item.id}
                      rowProps={(item) => ({ variant: item.id === product?.id ? "selected" : "default" })}
                      emptyContent="当前分类暂无可选规格"
                    />
                  </Radio.Group> : <PageState empty
                    emptyTitle={secondary ? "当前分类暂无可选产品" : "请选择其他分类"}
                    emptyDescription="请选择其他分类查看可订购商品。"><span /></PageState>
                ) : productsQuery.isLoading ? (
                  <div className="grid gap-3" role="status" aria-label="正在加载计算规格">{[0, 1, 2].map((index) => <CardSkeleton key={index} compact />)}</div>
                ) : linkedProducts.length ? (
                  <MobileCatalogSpecs products={pageProducts} value={product?.id ?? ""} onSelect={setSelectedProductId} />
                ) : (
                  <PageState empty
                    emptyTitle={secondary ? "当前分类暂无可选产品" : "请选择其他分类"}
                    emptyDescription="请选择其他分类查看可订购商品。"><span /></PageState>
                )}
              {!product && linkedProducts.length ? <Banner title="当前规格暂无库存" description="请选择其他分类的可用规格。" /> : null}
              {linkedProducts.length > perPage ? <Pagination page={currentPage} setPage={(value) => { setPage(value); setSelectedProductId(""); }} perPage={perPage} totalCount={linkedProducts.length} controls={desktop ? undefined : "simple"} /> : null}
            </section>

            {productsQuery.isLoading ? <ProductConfigSkeleton externalBill /> : null}
            {product ? <section aria-label="产品配置">
              <PageState loading={configLoading} skeleton={<ProductConfigSkeleton externalBill />} error={configError ? getApiMessage(configError) : null}>
                {orderPage && detail ? <ProductConfig key={product.id} product={detail} orderPage={orderPage} billTarget={billTarget} billBar={desktop ? undefined : billBar} stepsTarget={stepsTarget} stepsVariant={desktop ? "list" : "chips"} onShowDetail={() => setDetailOpen(true)} catalogSelection /> : null}
              </PageState>
              {desktop || !configError ? null : <Banner variant="error" title="配置暂不可用" description="重新加载配置后可继续结算。" action={<Button onClick={retryConfig}>重试配置</Button>} />}
            </section> : null}
          </div>
          {desktop ? (
            <aside className="min-w-0 xl:sticky xl:top-20" aria-label="当前应付账单">
              <div ref={setBillTarget} />
              {!product && !productsQuery.isLoading ? <PageState empty emptyTitle="请选择计算规格" emptyDescription="选择有库存的计算规格后显示实时账单。"><span /></PageState> : null}
              {productsQuery.isLoading || configLoading ? <ProductBillSkeleton /> : null}
              {product && configError ? <Banner variant="error" title="配置暂不可用" description="重新加载配置后可继续结算。" action={<Button onClick={retryConfig}>重试配置</Button>} /> : null}
            </aside>
          ) : null}
        </div>
      </PageState>
      {!desktop && product && orderPage && detail ? <MobileBillDock open={detailOpen} onOpenChange={setDetailOpen} onBar={setBillBar} onDetail={setBillTarget} /> : null}
    </>
  );
}

export function ConsoleProducts({ publicPath = false }: { publicPath?: boolean }) {
  return publicPath ? <PublicProductCatalog /> : <IntegratedProductCatalog />;
}
