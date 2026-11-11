import { adminRequest, salesRequest, userRequest, type ApiEnvelope } from "./request";
import { adminBase, adminPath } from "../utils/adminEntry";
export type NavigationScope = "console" | "sales" | "admin";
export interface NavigationNode {
 badge?: string;
 id: string; scope: NavigationScope; parentId: string; name: string; href: string;
 icon: string; gate: string; category?: string; target: "self" | "blank"; enabled: boolean; sort: number;
 createdAt: string; updatedAt: string;
}
export interface NavigationSnapshot { revision: number; nodes: NavigationNode[] }
export interface NavigationCategory { id: string; name: string; sort: number }
export type NavigationInput = Pick<NavigationNode, "parentId" | "name" | "href" | "icon" | "target" | "enabled"> & { category?: string };
export const navigationApi = {
 async list(scope: NavigationScope, manage = false) {
  const client = manage || scope === "admin" ? adminRequest : scope === "sales" ? salesRequest : userRequest;
  const path = manage ? `/navigation-config/${scope}` : scope === "sales" ? "/sales/navigation" : "/navigation";
  const snapshot=(await client.get<ApiEnvelope<NavigationSnapshot>>(path)).data.data;
  return scope === "admin" ? {...snapshot,nodes:snapshot.nodes.map(node=>({...node,href:adminPath(node.href)}))} : snapshot;
 },
 async save(scope: NavigationScope, revision: number, value: NavigationInput, id?: string) {
  const path = `/navigation-config/${scope}/nodes`;
  if(scope === "admin" && (value.href === adminBase || value.href.startsWith(adminBase+"/"))) value={...value,href:"/admin"+value.href.slice(adminBase.length)};
  return id ? adminRequest.put(`${path}/${id}`, { ...value, revision }) : adminRequest.post(path, { ...value, revision });
 },
 async remove(scope: NavigationScope, revision: number, id: string) {
  return adminRequest.delete(`/navigation-config/${scope}/nodes/${id}`, { data: { revision } });
 },
 async sort(scope: NavigationScope, revision: number, parentId: string, ids: string[]) {
  return adminRequest.put(`/navigation-config/${scope}/sort`, { revision, parentId, ids });
 },
 async categories() {
  return (await adminRequest.get<ApiEnvelope<{ categories: NavigationCategory[] }>>("/navigation-categories")).data.data.categories;
 },
 async saveCategory(name: string, id?: string) {
  return id ? adminRequest.put("/navigation-categories/rename", { id, name }) : adminRequest.post("/navigation-categories", { name });
 },
 async removeCategory(id: string) {
  return adminRequest.delete("/navigation-categories/remove", { data: { id } });
 },
 async sortCategories(ids: string[]) {
  return adminRequest.put("/navigation-categories/sort", { ids });
 },
};
