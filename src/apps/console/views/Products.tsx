import { Badge, Banner, Button, LayerCard, Tabs, type TabsItem } from "@cloudflare/kumo";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRightIcon, PackageIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { consoleApi, type OrderPage, type ProductDetail, type ProductGroupSummary, type ProductSummary } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { ProductConfig } from "../../../shared/components/ProductConfig";
import { useOrderPage, useProduct, useProducts } from "../../../shared/hooks/useConsoleData";
import { cycleLabels } from "../../../shared/utils/format";

type ReadySelection = {
  product: ProductDetail;
  orderPage?: OrderPage;
};

function isAvailable(product: ProductSummary) {
  return product.stock === null || product.stock > 0;
}

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

function buildPrimaryGroups(products: ProductSummary[], groups: ProductGroupSummary[]) {
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
                    <LayerCard key={product.id} className="flex h-80 flex-col gap-4 p-5">
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
                          <strong className="text-xl text-kumo-strong">¥{product.price.toFixed(2)}</strong>
                          <span className="text-sm text-kumo-subtle"> 起</span>
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

function IntegratedProductCatalog() {
  const queryClient = useQueryClient();
  const productsQuery = useProducts();
  const products = productsQuery.data?.items ?? [];
  const groups = productsQuery.data?.groups ?? [];
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [billTarget, setBillTarget] = useState<HTMLDivElement | null>(null);
  const [readySelection, setReadySelection] = useState<ReadySelection | null>(null);

  const primaryGroups = useMemo(() => {
    return buildPrimaryGroups(products, groups);
  }, [groups, products]);

  const visibleProducts = useMemo(
    () => selectedGroup === "all"
      ? products
      : products.filter((product) => primaryGroupId(product) === selectedGroup),
    [products, selectedGroup],
  );

  useEffect(() => {
    setSelectedProductId((current) => {
      if (visibleProducts.some((product) => product.id === current && isAvailable(product))) return current;
      return visibleProducts.find(isAvailable)?.id ?? "";
    });
  }, [visibleProducts]);

  useEffect(() => {
    if (!visibleProducts.length) return;
    let cancelled = false;
    const selectedIndex = visibleProducts.findIndex((item) => item.id === selectedProductId);
    const anchorIndex = selectedIndex >= 0 ? selectedIndex : 0;
    const indexes = [anchorIndex, anchorIndex - 1, anchorIndex + 1];
    const candidates = Array.from(new Set(indexes))
      .map((index) => visibleProducts[index])
      .filter((item): item is ProductSummary => Boolean(item && isAvailable(item)));

    void Promise.all(candidates.map(async (item) => {
      const detail = await queryClient.fetchQuery({
        queryKey: ["product", item.id],
        queryFn: () => consoleApi.product(item.id),
        staleTime: 10 * 60 * 1000,
      });
      if (cancelled || detail.supplierId === "0" || !detail.upstreamProductId) return;
      await queryClient.prefetchQuery({
        queryKey: ["upstream-order-page", detail.supplierId, detail.upstreamProductId],
        queryFn: () => consoleApi.orderPage(detail.supplierId, detail.upstreamProductId),
        staleTime: 10 * 60 * 1000,
      });
    })).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [queryClient, selectedProductId, visibleProducts]);

  const productQuery = useProduct(selectedProductId);
  const product = productQuery.data?.id === selectedProductId ? productQuery.data : undefined;
  const orderPageQuery = useOrderPage(product?.supplierId ?? "", product?.upstreamProductId ?? "");
  const requiresOrderPage = Boolean(product && product.supplierId !== "0");
  const detailLoading = Boolean(selectedProductId) && (
    productQuery.isLoading || productQuery.isPlaceholderData || (!product && !productQuery.error)
  );
  const orderPageLoading = requiresOrderPage && (orderPageQuery.isLoading || orderPageQuery.isPlaceholderData);
  const orderPage = orderPageQuery.isPlaceholderData ? undefined : orderPageQuery.data;
  const currentSelection = product && !orderPageLoading ? { product, orderPage } : null;

  useEffect(() => {
    if (!selectedProductId) {
      setReadySelection(null);
      return;
    }
    if (product && !orderPageLoading) {
      setReadySelection((current) => {
        if (current?.product === product && current.orderPage === orderPage) return current;
        return { product, orderPage };
      });
    }
  }, [orderPage, orderPageLoading, product, selectedProductId]);

  const displayedSelection = productQuery.error ? null : currentSelection ?? readySelection;
  const selectionChanging = Boolean(
    selectedProductId
      && displayedSelection
      && displayedSelection.product.id !== selectedProductId,
  );

  const primaryTabs = [
    { value: "all", label: "全部" },
    ...Array.from(primaryGroups, ([value, label]) => ({ value, label })),
  ];
  const productTabs: TabsItem[] = visibleProducts.map((item) => {
    const unavailable = !isAvailable(item);
    return {
      value: item.id,
      label: (
        <span className="grid gap-0.5 py-1 text-left">
          <span>{item.name}</span>
          <span className="text-xs font-normal text-kumo-subtle">
            ¥{item.price.toFixed(2)} 起{unavailable ? " · 暂无库存" : ""}
          </span>
        </span>
      ),
      className: unavailable ? "cursor-not-allowed opacity-50" : undefined,
      render: unavailable
        ? <button type="button" disabled aria-label={`${item.name}，暂无库存`} />
        : undefined,
    };
  });

  return (
    <>
      <PageHeader title="订购产品" description="商品、库存和价格均来自实时目录。" />
      <PageState
        loading={productsQuery.isLoading}
        skeleton="products"
        error={productsQuery.error ? getApiMessage(productsQuery.error) : null}
        empty={!productsQuery.isLoading && !productsQuery.error && products.length === 0}
        emptyTitle="暂无可售商品"
      >
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="grid min-w-0 gap-5">
            <LayerCard className="grid gap-4 p-4">
              <div className="grid min-w-0 gap-3 md:grid-cols-[6rem_minmax(0,1fr)] md:items-center">
                <strong className="text-sm text-kumo-strong">一级分类</strong>
                <div className="min-w-0 overflow-x-auto">
                  <Tabs
                    variant="segmented"
                    tabs={primaryTabs}
                    value={selectedGroup}
                    onValueChange={setSelectedGroup}
                  />
                </div>
              </div>
              <div className="grid min-w-0 gap-3 border-t border-kumo-line pt-4 md:grid-cols-[6rem_minmax(0,1fr)] md:items-center">
                <strong className="text-sm text-kumo-strong">选择产品</strong>
                <div className="min-w-0 overflow-x-auto">
                  {productTabs.length ? (
                    <Tabs
                      variant="segmented"
                      tabs={productTabs}
                      value={selectedProductId}
                      onValueChange={setSelectedProductId}
                      listClassName="h-auto min-h-14"
                    />
                  ) : (
                    <span className="text-sm text-kumo-subtle">当前分类暂无商品。</span>
                  )}
                </div>
              </div>
            </LayerCard>

            <section
              className="min-w-0"
              aria-label="产品配置"
            >
              <PageState
                loading={detailLoading && !displayedSelection}
                skeleton="product"
                error={!displayedSelection && productQuery.error ? getApiMessage(productQuery.error) : null}
                empty={!selectedProductId}
                emptyTitle="请选择产品"
                emptyDescription="当前分类没有可订购商品，请选择其他商品分类。"
              >
                {displayedSelection ? (
                  <div className="grid gap-4">
                    {selectionChanging ? (
                      <Banner
                        variant="default"
                        title="正在切换产品"
                        description="已保留上一产品配置与账单，新配置读取完成后将自动更新。"
                      />
                    ) : null}
                    {requiresOrderPage && orderPageQuery.error ? (
                      <Banner
                        variant="error"
                        title="上游配置读取失败"
                        description={getApiMessage(orderPageQuery.error)}
                      />
                    ) : null}
                    <PageState loading={orderPageLoading && !displayedSelection} skeleton="product">
                      <ProductConfig
                        key={displayedSelection.product.id}
                        product={displayedSelection.product}
                        orderPage={displayedSelection.orderPage}
                        billTarget={billTarget}
                        billLoading={selectionChanging}
                      />
                    </PageState>
                  </div>
                ) : null}
              </PageState>
            </section>
          </div>

          <aside className="min-w-0 xl:sticky xl:top-20" aria-label="当前应付账单">
            <div ref={setBillTarget} />
            {!selectedProductId ? (
              <PageState
                empty
                emptyTitle="请选择产品"
                emptyDescription="选择产品后将在此显示实时账单。"
              >
                <span />
              </PageState>
            ) : null}
            {selectedProductId && (detailLoading || orderPageLoading) && !displayedSelection ? (
              <PageState loading skeleton="detail"><span /></PageState>
            ) : null}
            {selectedProductId && productQuery.error ? (
              <PageState error={getApiMessage(productQuery.error)}><span /></PageState>
            ) : null}
          </aside>
        </div>
      </PageState>
    </>
  );
}

export function ConsoleProducts({ publicPath = false }: { publicPath?: boolean }) {
  return publicPath ? <PublicProductCatalog /> : <IntegratedProductCatalog />;
}
