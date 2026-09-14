import { adminRequest, salesRequest, userRequest, type ApiEnvelope } from "./request";
export type NavigationScope = "console" | "sales" | "admin";
export interface NavigationNode {
 id: string; scope: NavigationScope; parentId: string; name: string; href: string;
 icon: string; gate: string; target: "self" | "blank"; enabled: boolean; sort: number;
 createdAt: string; updatedAt: string;
}
export interface NavigationSnapshot { revision: number; nodes: NavigationNode[] }
export type NavigationInput = Pick<NavigationNode, "parentId" | "name" | "href" | "icon" | "target" | "enabled">;
export const navigationApi = {
 async list(scope: NavigationScope, manage = false) {
  const client = manage || scope === "admin" ? adminRequest : scope === "sales" ? salesRequest : userRequest;
  const path = manage ? `/navigation-config/${scope}` : scope === "sales" ? "/sales/navigation" : "/navigation";
  return (await client.get<ApiEnvelope<NavigationSnapshot>>(path)).data.data;
 },
 async save(scope: NavigationScope, revision: number, value: NavigationInput, id?: string) {
  const path = `/navigation-config/${scope}/nodes`;
  return id ? adminRequest.put(`${path}/${id}`, { ...value, revision }) : adminRequest.post(path, { ...value, revision });
 },
 async remove(scope: NavigationScope, revision: number, id: string) {
  return adminRequest.delete(`/navigation-config/${scope}/nodes/${id}`, { data: { revision } });
 },
 async sort(scope: NavigationScope, revision: number, parentId: string, ids: string[]) {
  return adminRequest.put(`/navigation-config/${scope}/sort`, { revision, parentId, ids });
 },
};
