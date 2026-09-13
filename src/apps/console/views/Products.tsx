import { Badge, Banner, Button, LayerCard, Pagination, Radio, Table, Tabs } from "@cloudflare/kumo";
import { useQueries } from "@tanstack/react-query";
import { ArrowRightIcon, PackageIcon } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { consoleApi, type ProductDetail, type ProductGroupSummary, type ProductSummary } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { ProductConfig } from "../../../shared/components/ProductConfig";
import { useOrderPage, useProducts } from "../../../shared/hooks/useConsoleData";
import { cycleLabels } from "../../../shared/utils/format";

import { belongsToGroup, isUpstreamProduct, secondaryGroups } from "../../../shared/utils/productCatalog";

function isAvailable(product: ProductSummary) {
  const stock = (product as ProductDetail).catalogSpec?.stock ?? product.stock;
  return stock === null || stock > 0;
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

function CatalogProductRow({ product, selected }: { product: ProductDetail; selected: boolean }) {
  const spec = product.catalogSpec;
  const stock = spec?.stock ?? product.upstreamStock ?? product.stock;
  return (
    <Table.Row variant={selected ? "selected" : "default"}>
      <Table.Cell><Radio.Item value={product.id} label={spec?.name || product.name} disabled={!isAvailable(product)} /></Table.Cell>
      <Table.Cell>{spec?.vcpu || "—"}</Table.Cell>
      <Table.Cell>{spec?.memory || "—"}</Table.Cell>
      <Table.Cell>{spec?.processorModel || "—"}</Table.Cell>
      <Table.Cell>{spec?.processorFrequency || "—"}</Table.Cell>
      <Table.Cell>{spec?.defense || "—"}</Table.Cell>
      <Table.Cell>{spec?.upstreamBandwidth || "—"}</Table.Cell>
      <Table.Cell>{spec?.downstreamRate || "—"}</Table.Cell>
      <Table.Cell>{stock === null || stock === undefined || stock === "" ? "—" : stock}</Table.Cell>
      <Table.Cell>¥{(spec?.price ?? product.price).toFixed(2)} / {cycleLabels[product.cycle] || product.cycle || "周期以配置为准"} 起</Table.Cell>
    </Table.Row>
  );
}
function IntegratedProductCatalog() {
  const productsQuery = useProducts();
  const products = productsQuery.data?.items ?? [];
  const groups = productsQuery.data?.groups ?? [];
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedSecondaryId, setSelectedSecondaryId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [billTarget, setBillTarget] = useState<HTMLDivElement | null>(null);
  const primaryGroups = useMemo(() => buildPrimaryGroups(products, groups), [groups, products]);
  const children = secondaryGroups(groups, selectedGroup);
  const secondary = children.find((group) => group.id === selectedSecondaryId) ?? children[0];
  const visibleProducts = secondary ? products.filter((product) => belongsToGroup(product, secondary)) : [];
  // The public summary does not carry supplier identifiers. Verify each detail
  // using the same cached endpoint as the existing product configuration page.
  const details = useQueries({ queries: visibleProducts.map((item) => ({
    queryKey: ["product", item.id], queryFn: () => consoleApi.product(item.id), staleTime: 10 * 60 * 1000,
  })) });
  const linkedProducts = details.flatMap((result) => result.data && isUpstreamProduct(result.data) ? [result.data] : []);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(linkedProducts.length / perPage)));
  const pageProducts = linkedProducts.slice((currentPage - 1) * perPage, currentPage * perPage);
  const product = pageProducts.find((item) => item.id === selectedProductId && isAvailable(item))
    ?? pageProducts.find(isAvailable);
  const orderPageQuery = useOrderPage(product?.supplierId ?? "", product?.upstreamProductId ?? "");
  const orderPage = orderPageQuery.isPlaceholderData ? undefined : orderPageQuery.data;
  const detailsLoading = details.some((result) => result.isPending);
  const detailsFailed = details.some((result) => result.isError);
  const configLoading = Boolean(product) && (orderPageQuery.isPending || orderPageQuery.isPlaceholderData);
  const refresh = () => {
    void productsQuery.refetch();
    for (const result of details) void result.refetch();
  };

  return (
    <>
      <PageHeader title="订购产品" description="选择分类和计算规格，再配置资源与购买周期。" />
      <PageState loading={productsQuery.isLoading} skeleton="products" error={productsQuery.error ? getApiMessage(productsQuery.error) : null}>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
          <div className="grid min-w-0 gap-5">
            <LayerCard className="grid gap-4 p-4">
              <div className="grid min-w-0 gap-3 md:grid-cols-[6rem_minmax(0,1fr)] md:items-center">
                <strong>一级分类</strong>
                <div className="min-w-0 overflow-x-auto"><Tabs variant="segmented"
                  tabs={[{ value: "all", label: "全部" }, ...Array.from(primaryGroups, ([value, label]) => ({ value, label }))]}
                  value={selectedGroup} onValueChange={(value) => { setSelectedGroup(value); setSelectedSecondaryId(""); setSelectedProductId(""); setPage(1); refresh(); }}
                /></div>
              </div>
              <div className="grid min-w-0 gap-3 md:grid-cols-[6rem_minmax(0,1fr)] md:items-center">
                <strong>二级分类</strong>
                <div className="min-w-0 overflow-x-auto">{children.length ? <Tabs variant="segmented"
                  tabs={children.map((group) => ({ value: group.id, label: selectedGroup === "all" ? `${primaryGroups.get(group.parentId)} / ${group.name}` : group.name }))}
                  value={secondary?.id ?? ""} onValueChange={(value) => { setSelectedSecondaryId(value); setSelectedProductId(""); setPage(1); refresh(); }}
                /> : <span>当前一级分类暂无二级分类，请切换其他分类。</span>}</div>
              </div>
            </LayerCard>

            <LayerCard className="grid gap-4 p-5">
              <h2>计算规格</h2>
              {detailsFailed ? <Banner variant="error" title="部分产品读取失败" description="可选择已加载的规格，或重试读取。" action={<Button variant="secondary" onClick={refresh}>重试</Button>} /> : null}
              {linkedProducts.length ? <Radio.Group aria-label="计算规格" value={product?.id ?? ""} onValueChange={setSelectedProductId} className="overflow-x-auto">
                <Table className="whitespace-nowrap">
                  <Table.Header><Table.Row><Table.Head>实例规格</Table.Head><Table.Head>vCPU</Table.Head><Table.Head>内存</Table.Head><Table.Head>处理器型号</Table.Head><Table.Head>处理器主频 / 睿频</Table.Head><Table.Head>基础防御</Table.Head><Table.Head>上行带宽</Table.Head><Table.Head>下行速率</Table.Head><Table.Head>库存数量</Table.Head><Table.Head>参考价格</Table.Head></Table.Row></Table.Header>
                  <Table.Body>{pageProducts.map((item) => <CatalogProductRow key={item.id} product={item} selected={item.id === product?.id} />)}</Table.Body>
                </Table>
              </Radio.Group> : <PageState loading={detailsLoading} skeleton="table" empty={!detailsLoading}
                emptyTitle={secondary ? "当前分类暂无已对接产品" : "请选择其他分类"}
                emptyDescription="请选择其他分类查看可订购商品。"><span /></PageState>}
              {detailsLoading && linkedProducts.length ? <span role="status">正在读取其余计算规格…</span> : null}
              {!product && linkedProducts.length ? <Banner title="当前规格暂无库存" description="请选择其他分类的可用规格。" /> : null}
              {linkedProducts.length > perPage ? <Pagination page={currentPage} setPage={(value) => { setPage(value); setSelectedProductId(""); }} perPage={perPage} totalCount={linkedProducts.length} /> : null}
            </LayerCard>

            {product ? <section aria-label="产品配置">
              <PageState loading={configLoading} skeleton="product" error={orderPageQuery.error ? getApiMessage(orderPageQuery.error) : null}>
                {orderPage ? <ProductConfig key={product.id} product={product} orderPage={orderPage} billTarget={billTarget} catalogSelection /> : null}
              </PageState>
            </section> : null}
          </div>
          <aside className="min-w-0 xl:sticky xl:top-20" aria-label="当前应付账单">
            <div ref={setBillTarget} />
            {!product ? <PageState empty emptyTitle="请选择计算规格" emptyDescription="选择有库存的计算规格后显示实时账单。"><span /></PageState> : null}
            {configLoading ? <PageState loading skeleton="detail"><span /></PageState> : null}
            {product && orderPageQuery.error ? <Banner variant="error" title="配置暂不可用" description="重新加载配置后可继续结算。" action={<Button onClick={() => void orderPageQuery.refetch()}>重试配置</Button>} /> : null}
          </aside>
        </div>
      </PageState>
    </>
  );
}

export function ConsoleProducts({ publicPath = false }: { publicPath?: boolean }) {
  return publicPath ? <PublicProductCatalog /> : <IntegratedProductCatalog />;
}
