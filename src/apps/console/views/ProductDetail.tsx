import { Banner } from "@cloudflare/kumo";
import { useParams } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { ProductConfig } from "../../../shared/components/ProductConfig";
import { useOrderPage, useProduct } from "../../../shared/hooks/useConsoleData";

export function ConsoleProductDetail({ publicView = false }: { publicView?: boolean }) {
  const { id = "" } = useParams();
  const productQuery = useProduct(id);
  const product = productQuery.data;
  const orderPageQuery = useOrderPage(product?.supplierId ?? "", product?.upstreamProductId ?? "");

  return (
    <>
      <PageHeader
        title={product?.name ?? (publicView ? "云服务器配置" : "配置云服务器")}
        description="查看产品规格与可选配置，提交前请核对计费明细。"
      />
      <PageState
        loading={productQuery.isLoading}
        skeleton="product"
        error={productQuery.error ? getApiMessage(productQuery.error) : null}
        empty={!productQuery.isLoading && !productQuery.error && !product}
        emptyTitle="商品不存在或已下架"
      >
        {product ? (
          <div className="grid gap-4">
            {product.supplierId !== "0" && orderPageQuery.error ? (
              <Banner
                variant="error"
                title="产品配置读取失败"
                description={getApiMessage(orderPageQuery.error)}
              />
            ) : null}
            <PageState loading={orderPageQuery.isLoading && product.supplierId !== "0"} skeleton="product">
              <ProductConfig product={product} orderPage={orderPageQuery.data} />
            </PageState>
          </div>
        ) : null}
      </PageState>
    </>
  );
}
