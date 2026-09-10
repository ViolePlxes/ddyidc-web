import { Badge, Button, LayerCard } from "@cloudflare/kumo";
import { ArrowRightIcon, PackageIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { useProducts } from "../../../shared/hooks/useConsoleData";
import { getApiMessage } from "../../../shared/api/request";
import { cycleLabels } from "../../../shared/utils/format";

export function ConsoleProducts({ publicPath = false }: { publicPath?: boolean }) {
  const query = useProducts();
  const products = query.data?.items ?? [];
  const groups = Object.entries(
    products.reduce<Record<string, typeof products>>((result, product) => {
      (result[product.groupId] ??= []).push(product);
      return result;
    }, {}),
  );

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
              <h2 className="text-lg font-semibold text-kumo-strong">商品分组 {groupId}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-animate-list>
                {items?.map((product) => {
                  const unavailable = product.stock !== null && product.stock <= 0;
                  return (
                    <LayerCard key={product.id} className="interactive-card flex h-80 flex-col gap-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="grid size-10 place-items-center bg-kumo-control text-kumo-brand"><PackageIcon /></div>
                        <Badge variant={unavailable ? "secondary" : "success"}>{unavailable ? "暂无库存" : "可订购"}</Badge>
                      </div>
                      <div className="grid gap-2">
                        <h3 className="text-lg font-semibold text-kumo-strong">{product.name}</h3>
                        <p className="line-clamp-3 text-base text-kumo-subtle">{product.summary || product.description || "暂无商品简介"}</p>
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
                        <Link to={`${publicPath ? "/products" : "/console/products"}/${product.id}`} viewTransition>
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
