import type { CatalogProduct, ProductGroupSummary } from "../api/console";

export type CatalogPage = { items: CatalogProduct[]; groups: ProductGroupSummary[]; total: number; page: number; pageSize: number };
function id(value: unknown): string {
  if (typeof value === "string" && /^\d+$/.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return String(value);
  throw new Error("商品目录字段异常，请重新加载");
}
export function normalizeCatalogPage(data: CatalogPage): CatalogPage {
  if (!data || !Array.isArray(data.items) || !Array.isArray(data.groups) ||
      !Number.isSafeInteger(data.total) || data.total < 0) {
    throw new Error("商品目录响应不完整，请重新加载");
  }
  return { ...data, items: data.items.map(item => {
    if (!item || typeof item.configurable !== "boolean") throw new Error("商品目录版本不一致，请重新加载");
    return { ...item, id: id(item.id), groupId: id(item.groupId), parentGroupId: id(item.parentGroupId) };
  }), groups: data.groups.map(group => {
    if (!group || ![0, 1, "0", "1"].includes(group.status)) throw new Error("商品分类字段异常，请重新加载");
    return { ...group, id: id(group.id), parentId: id(group.parentId), status: Number(group.status) };
  }) };
}
export function completeCatalog(first: CatalogPage, pages: CatalogPage[]): CatalogPage {
  if (pages.some(page => page.total !== first.total)) throw new Error("商品目录正在更新，请重新加载");
  const items = Array.from(new Map([first, ...pages].flatMap(page => page.items).map(item => [item.id, item])).values());
  if (items.length !== first.total) throw new Error("商品目录加载不完整，请重新加载");
  return { ...first, items };
}
