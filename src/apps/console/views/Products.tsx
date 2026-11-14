import { Pagination } from "../../../shared/components/Pagination";
import { Badge } from "../../../shared/components/Badge";
import { Banner, Button, LayerCard, Radio } from "@cloudflare/kumo";

import { ArrowRightIcon, PackageIcon, WindowsLogoIcon, LinuxLogoIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { type CatalogProduct, type ProductGroupSummary, type ProductSummary } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { CardSkeleton, ProductConfigSkeleton } from "../../../shared/components/skeletons";
import { BottomCheckoutBar } from "../../../shared/components/BottomCheckoutBar";
import { OrderStepsBreadcrumbs } from "../../../shared/components/OrderStepsBreadcrumbs";
import { MobileCatalogSpecs } from "../../../shared/components/MobileSpecList";
import { useCatalogDesktopLayout } from "../../../shared/hooks/useMediaQuery";
import { useFillingPageSize } from "../../../shared/hooks/useFillingPageSize";
import { usePaneFillHeight } from "../../../shared/hooks/usePaneFillHeight";
import { ProductConfig } from "../../../shared/components/ProductConfig";
import { scrollToProductStep } from "../../../shared/components/ProductSteps";
import { Tabs } from "../../../shared/components/Tabs";
import { useOrderPage, useProduct, useProducts } from "../../../shared/hooks/useConsoleData";
import { cycleLabels } from "../../../shared/utils/format";

import { belongsToGroup, catalogStock, isCatalogAvailable as isAvailable, isUpstreamProduct, secondaryGroups } from "../../../shared/utils/productCatalog";
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
}) {
 // One control for both breakpoints: Kumo's own horizontal overflow (scroll
 // buttons + drag on desktop, native touch scroll on phones). The wrapper only
 // constrains width so Kumo can detect the overflow.
 const rows = [
  { key: "primary", label: "一级分类", value: selectedGroup, onChange: onPrimaryChange, tabs: Array.from(primaryGroups, ([value, label]) => ({ value, label })) },
  { key: "secondary", label: "二级分类", value: secondary?.id ?? "", onChange: onSecondaryChange, tabs: children.map((group) => ({ value: group.id, label: group.name })) },
 ];
 return (<LayerCard className="grid min-w-0 gap-3 px-4 py-3" aria-label="产品分类">
  {rows.map((row) => (
   <div key={row.key} className="flex min-w-0 flex-col gap-1 md:flex-row md:items-center md:gap-3">
    <strong className="shrink-0 whitespace-nowrap text-sm font-medium md:text-base">{row.label}</strong>
    <div className="min-w-0 flex-1">
     {row.key === "secondary" && !children.length
      ? <span className="text-sm text-kumo-subtle">{loading ? "正在加载分类…" : "当前一级分类暂无二级分类，请切换其他分类。"}</span>
      : <Tabs aria-label={row.label} variant="segmented" tabs={row.tabs} value={row.value} onValueChange={row.onChange} />}
    </div>
   </div>
  ))}
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
  const [selectedSecondaryId, setSelectedSecondaryId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  // Bottom checkout bar hosts: the bar itself and the detail body (desktop panel
  // or phone drawer). Both are portals owned by `ProductConfig`.
  const [billBar, setBillBar] = useState<HTMLDivElement | null>(null);
  const [billTarget, setBillTarget] = useState<HTMLDivElement | null>(null);
  const [stepsTarget, setStepsTarget] = useState<HTMLDivElement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const desktop = useCatalogDesktopLayout();
  const specHost = useRef<HTMLDivElement>(null);
  // The page fills the pane, its content scrolls above the fixed checkout bar.
  const pageRoot = useRef<HTMLDivElement>(null);
  usePaneFillHeight(pageRoot, `${desktop}`);
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
  // Rows fill the space above the pagination and the sticky checkout bar, so the
  // spec list never makes the page scroll just to see its own footer.
  const perPage = useFillingPageSize({
    host: specHost,
    paneSelector: "[data-order-scroll]",
    resetKey: `${desktop}:${selectedGroup}:${secondary?.id ?? ""}`,
    dataKey: `${linkedProducts.length}:${productsQuery.isLoading ? 1 : 0}`,
    reserveSelectors: ["[data-catalog-pagination]"],
    reserve: 20,
    reserveChrome: false,
    headSelector: desktop ? "thead" : undefined,
    rowSelector: desktop ? "tbody tr" : "[data-fill-row]",
    rowGap: desktop ? 0 : 12,
  });
  useEffect(() => { setPage(1); }, [perPage]);
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
  // Keep a picked SKU configured even when it moves to another page (a height
  // change or `查看明细` can shrink the page size).
  const selectedProduct = linkedProducts.find((item) => item.id === selectedProductId && isAvailable(item));
  const product = selectedProduct ?? pageProducts.find(isAvailable);
  // Only the selected SKU loads purchase details. Never render another SKU's
  // placeholder detail while React Query changes keys.
  const detailQuery = useProduct(product?.id ?? "");
  const detail = !detailQuery.isPlaceholderData && detailQuery.data?.id === product?.id ? detailQuery.data : undefined;
  const orderPageQuery = useOrderPage(detail?.id ?? "", detail?.configurable ?? false);
  const orderPage = orderPageQuery.isPlaceholderData ? undefined : orderPageQuery.data;
  const configError = detailQuery.error ?? (detail ? orderPageQuery.error : null);
  const configLoading = Boolean(product) && !configError && (!detail || orderPageQuery.isPending || orderPageQuery.isPlaceholderData);
  const configReady = Boolean(product && orderPage && detail) && !configLoading;
  const retryConfig = () => {
    if (!detail || detailQuery.error) void detailQuery.refetch();
    else void orderPageQuery.refetch();
  };
  // Category switches clear the selection. When page size changes (breakpoint or
  // the detail panel) the page returns to 1 but the picked SKU stays configured.
  const orderScroll = () => document.querySelector<HTMLElement>("[data-order-scroll]") ?? document.querySelector<HTMLElement>("[data-dashboard-scroll]");
  const keepSpecsVisible = () => {
    const pane = orderScroll();
    const target = document.getElementById("catalog-specifications");
    if (!target) return;
    const offset = pane ? target.getBoundingClientRect().top - pane.getBoundingClientRect().top : target.getBoundingClientRect().top;
    if (offset < 0) scrollToProductStep("catalog-specifications", pane);
  };
  const selectPrimary = (value: string) => { setSelectedGroup(value); setSelectedSecondaryId(""); setSelectedProductId(""); setPage(1); keepSpecsVisible(); };
  const selectSecondary = (value: string) => { setSelectedSecondaryId(value); setSelectedProductId(""); setPage(1); keepSpecsVisible(); };
  return (
    <PageState loading={productsQuery.isLoading} keepContent>
      {/* The page owns the pane height: the content scrolls in its own region and
          the checkout bar keeps a real bottom row instead of floating over it. */}
      <div ref={pageRoot} className="-mx-4 -mb-4 flex min-h-0 min-w-0 flex-col md:-mx-6 md:-mb-6 lg:-mx-8 lg:-mb-8">
        <div data-order-scroll className="min-h-0 flex-1 overflow-y-auto px-4 md:px-6 lg:px-8">
          <PageHeader title="订购产品" description="选择分类和计算规格，再配置资源与购买周期。" />
          {/* The trail sticks to the top of the content region and stays visible
              while the configuration is edited, so the step jump is always reachable. */}
          <div
            data-order-steps
            className="sticky top-0 z-20 -mx-4 mt-5 border-b border-kumo-line bg-kumo-canvas px-4 py-2 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
          >
            <div className="mx-auto w-full max-w-7xl">
              <div ref={setStepsTarget} />
              {configLoading || !orderPage || !detail ? (
                <OrderStepsBreadcrumbs steps={[{ id: "catalog-specifications", title: "计算规格" }]} />
              ) : null}
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 pt-5">
            <ProductCategories primaryGroups={primaryGroups} selectedGroup={selectedGroup} children={children} secondary={secondary} loading={productsQuery.isLoading}
              onPrimaryChange={selectPrimary}
              onSecondaryChange={selectSecondary} />

            <section id="catalog-specifications" className="grid min-w-0 scroll-mt-4 gap-4">
              <h2 className="text-lg font-semibold text-kumo-strong">计算规格</h2>
              {catalogIssue || categoryIssue || productsQuery.error ? (<div className="grid gap-3"><Banner variant="error"
                title={productsQuery.error ? "商品目录加载失败" : "商品目录暂不可用"}
                description={"未能确认当前分类的可选商品，请重新加载；仍无法显示时，可将诊断信息提供给客服。" + diagnosticNotice}
                />
                <div className="flex flex-wrap gap-2"><Button variant="secondary" loading={productsQuery.isFetching} onClick={retryCatalog}>重新加载</Button><Button variant="secondary" onClick={() => void copyDiagnostic()}>{diagnosticCopied ? "已复制诊断信息" : "复制诊断信息"}</Button></div></div>)
                : <div ref={specHost} className="min-w-0">
                  {desktop ? (
                    productsQuery.isLoading || linkedProducts.length ? <Radio.Group aria-label="计算规格" value={product?.id ?? ""} onValueChange={setSelectedProductId} className="min-w-0">
                      <ConfigurableTable<CatalogProduct>
                        columns={catalogTableColumns}
                        rows={productsQuery.isLoading ? [] : pageProducts}
                        storageKey={`ddyidc-console-catalog-specs:${secondary?.id ?? selectedGroup}`}
                        label="计算规格"
                        loading={productsQuery.isLoading}
                        stickyEdges
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
                </div>}
              {!product && linkedProducts.length ? <Banner title="当前规格暂无库存" description="请选择其他分类的可用规格。" /> : null}
              {linkedProducts.length > perPage ? (
                <div data-catalog-pagination className="flex flex-wrap items-center justify-end gap-3">
                  <Pagination page={currentPage} setPage={setPage} perPage={perPage} totalCount={linkedProducts.length} controls={desktop ? undefined : "simple"} />
                </div>
              ) : null}
            </section>

            {productsQuery.isLoading ? <ProductConfigSkeleton externalBill /> : null}
            {product ? <section aria-label="产品配置">
              <PageState loading={configLoading} skeleton={<ProductConfigSkeleton externalBill />} error={configError ? getApiMessage(configError) : null}>
                {orderPage && detail ? <ProductConfig key={product.id} product={detail} orderPage={orderPage} billTarget={billTarget} billBar={billBar} stepsTarget={stepsTarget} detailOpen={detailOpen} onShowDetail={() => setDetailOpen((open) => !open)} catalogSelection /> : null}
              </PageState>
              {!configError ? null : <Banner variant="error" title="配置暂不可用" description="重新加载配置后可继续结算。" action={<Button onClick={retryConfig}>重试配置</Button>} />}
            </section> : null}
          </div>
        </div>
        <BottomCheckoutBar
          variant="inline"
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onBar={setBillBar}
          onDetail={setBillTarget}
          desktop={desktop}
          placeholder={configReady ? null : (
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span className="text-sm text-kumo-subtle">当前应付</span>
                <strong className="text-lg font-semibold text-kumo-strong">—</strong>
                <span className="whitespace-nowrap text-sm text-kumo-subtle">· 折合 —/月</span>
              </div>
              <p className="min-w-0 flex-1 truncate text-sm text-kumo-subtle">{configError ? "配置暂不可用，请重试" : productsQuery.isLoading ? "正在加载商品目录" : "请选择计算规格后查看价格"}</p>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" className="min-h-11" disabled>查看明细</Button>
                <Button className="min-h-11" disabled>立即购买</Button>
              </div>
            </div>
          )}
        />
      </div>
    </PageState>
  );
}

export function ConsoleProducts({ publicPath = false }: { publicPath?: boolean }) {
  return publicPath ? <PublicProductCatalog /> : <IntegratedProductCatalog />;
}
