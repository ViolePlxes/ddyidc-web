import type { ProductDetail, ProductGroupSummary, ProductSummary } from "../api/console";

export function isUpstreamProduct(product: ProductDetail) {
  return Boolean(product.supplierId && product.supplierId !== "0" && product.upstreamProductId && product.upstreamProductId !== "0");
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
