import { Banner } from "@cloudflare/kumo";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { MobileBillDock } from "../../../shared/components/MobileBillDock";
import { ProductConfig } from "../../../shared/components/ProductConfig";
import { ProductConfigSkeleton } from "../../../shared/components/skeletons";
import { useCatalogDesktopLayout } from "../../../shared/hooks/useMediaQuery";
import { useOrderPage, useProduct } from "../../../shared/hooks/useConsoleData";

export function ConsoleProductDetail({ publicView = false }: { publicView?: boolean }) {
  const { id = "" } = useParams();
  const productQuery = useProduct(id);
  const product = productQuery.data;
  const orderPageQuery = useOrderPage(product?.id ?? "", product?.configurable ?? false);
  // Below `xl` the self-contained sticky bill moves to the fixed bottom bar and
  // the detail dialog; the desktop layout keeps its current behaviour.
  const desktop = useCatalogDesktopLayout();
  const [billTarget, setBillTarget] = useState<HTMLDivElement | null>(null);
  const [billBar, setBillBar] = useState<HTMLDivElement | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const mobileBill = !desktop && Boolean(product) && Boolean(orderPageQuery.data);

  return (
    <>
      <PageHeader
        title={product?.name ?? (publicView ? "云服务器配置" : "配置云服务器")}
        description="查看产品规格与可选配置，提交前请核对计费明细。"
      />
      <PageState
        loading={productQuery.isLoading}
        skeleton={<ProductConfigSkeleton />}
        error={productQuery.error ? getApiMessage(productQuery.error) : null}
        empty={!productQuery.isLoading && !productQuery.error && !product}
        emptyTitle="商品不存在或已下架"
      >
        {product ? (
          <div className={desktop ? "grid gap-4" : "grid gap-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]"}>
			{product.readOnly ? <Banner variant="secondary" title={product.infoSource === "upstream" ? "已获取实时商品信息" : "当前显示已保存的商品信息"} description="当前仅开放规格查询，购买暂未开放。" /> : null}
			{product.warning ? <Banner variant="alert" title="商品信息提示" description={product.warning} /> : null}
            {product.configurable && orderPageQuery.error ? (
              <Banner
                variant="error"
                title="产品配置读取失败"
                description={getApiMessage(orderPageQuery.error)}
              />
            ) : null}
            <PageState loading={orderPageQuery.isLoading && product.configurable} skeleton={<ProductConfigSkeleton />}>
              <ProductConfig product={product} orderPage={orderPageQuery.data} billTarget={desktop ? undefined : billTarget} billBar={desktop ? undefined : billBar} onShowDetail={() => setDetailOpen(true)} />
            </PageState>
          </div>
        ) : null}
      </PageState>
      {mobileBill ? <MobileBillDock open={detailOpen} onOpenChange={setDetailOpen} onBar={setBillBar} onDetail={setBillTarget} /> : null}
    </>
  );
}
