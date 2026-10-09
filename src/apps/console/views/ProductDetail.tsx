import { Banner } from "@cloudflare/kumo";
import { useParams } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { ProductConfig } from "../../../shared/components/ProductConfig";
import { ProductConfigSkeleton } from "../../../shared/components/skeletons";
import { useOrderPage, useProduct } from "../../../shared/hooks/useConsoleData";

export function ConsoleProductDetail({ publicView = false }: { publicView?: boolean }) {
  const { id = "" } = useParams();
  const productQuery = useProduct(id);
  const product = productQuery.data;
  const orderPageQuery = useOrderPage(product?.id ?? "", product?.configurable ?? false);

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
          <div className="grid gap-4">
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
              <ProductConfig product={product} orderPage={orderPageQuery.data} />
            </PageState>
          </div>
        ) : null}
      </PageState>
    </>
  );
}
