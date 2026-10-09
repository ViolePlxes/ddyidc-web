import type { CatalogProduct, ProductGroupSummary, ProductSummary } from "../api/console";

export const catalogLayout = "grid items-start gap-6 xl:grid-cols-[9rem_minmax(0,1fr)_minmax(22rem,28rem)]";
export const catalogColumns = ["实例规格", "vCPU", "内存", "处理器型号", "处理器主频 / 睿频", "基础防御", "上行带宽", "下行速率", "库存数量", "系统", "参考价格"];

type StockProduct = Pick<ProductSummary, "stock"> & Partial<Pick<CatalogProduct, "catalogSpec" | "upstreamStock">>;

// Match the server's local quota precedence. A resource snapshot is only a
// fallback when neither local quota is configured, never an infinite guarantee.
export function catalogStock(product: StockProduct) {
  return product.catalogSpec?.stock ?? product.stock ?? product.upstreamStock ?? null;
}

export function isCatalogAvailable(product: StockProduct) {
  const stock = catalogStock(product);
  if (typeof stock === "number") return Number.isFinite(stock) && stock > 0;
  if (typeof stock === "string" && /^\d+$/.test(stock.trim())) return Number(stock) > 0;
  // Unknown/textual stock may be configured; the server validates at checkout.
  return true;
}

export function isUpstreamProduct(product: Pick<CatalogProduct, "configurable">) {
  return Boolean(product.configurable);
}

export function secondaryGroups(groups: ProductGroupSummary[], primaryId: string) {
  const roots = new Set(groups.filter((group) => group.parentId === "0").map((group) => group.id));
  return groups.filter((group) => group.status === 1 && roots.has(group.parentId)
    && (primaryId === "all" || group.parentId === primaryId));
}

export function belongsToGroup(product: ProductSummary, group: ProductGroupSummary) {
  return product.groupId === group.id && product.parentGroupId === group.parentId;
}

// Supplier descriptions can contain a complete HTML document and CSS. Render
// text only; never inject supplier markup or use a truncated style as a summary.
export function catalogDescription(product: ProductSummary) {
  return (product.description || product.summary || "")
    .replace(/<(style|script)\b[^>]*>[\s\S]*?(<\/\1\s*>|$)/gi, "")
    .replace(/<br\s*\/?>/gi, " · ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ").trim();
}
