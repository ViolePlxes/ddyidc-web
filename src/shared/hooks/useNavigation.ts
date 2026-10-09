import { adminPath } from "../utils/adminEntry";
import { useInstanceDetailRoute } from './useInstanceDetailRoute';
import { transfersApi } from "../api/transfers";
import { useEffect } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { navigationApi, type NavigationScope } from "../api/navigation";
import { navigationIcon } from "../utils/navigationIcons";
import type { NavigationGroup } from "../../layouts/DashboardLayout";
import { useAdminTodos } from './useAdminTodos';
import { withTodoCounts } from '../utils/todoCounts';

const signal = "ddyidc:navigation-changed";
export async function navigationChanged(client: QueryClient) {
 await client.invalidateQueries({ queryKey: ["navigation"] });
 window.dispatchEvent(new Event(signal));
 try { localStorage.setItem(signal, crypto.randomUUID()); } catch { /* Local refresh remains available. */ }
}
const pluginPath = (href: string) => {
 try {
  const url = new URL(href, window.location.origin);
  // Also inspect same-host absolute links, escaped paths and query/hash variants.
  return decodeURIComponent(url.pathname).replace(/^\/dd-admin-[a-z0-9]{24,64}(?=\/|$)/,"/admin");
 } catch { return href; }
};
const plugin = (href: string) => pluginPath(href).match(/^\/(?:console|admin)\/(?:marketing\/)?(groupbuy|marketplace|points|cdnsell)(?:\/|$)/)?.[1];
export function useNavigation(scope: NavigationScope, available: NavigationGroup[]) {
 const client = useQueryClient();
 const quiet=useInstanceDetailRoute();
 const push = useQuery({queryKey:["transfers","navigation"],queryFn:()=>transfersApi.status(),enabled:scope==="console",refetchInterval:quiet?false:5_000});
 const query = useQuery({ queryKey: ["navigation", scope], queryFn: () => navigationApi.list(scope), refetchInterval: quiet?false:15_000 });
 useEffect(() => {
  const refresh = () => { void client.invalidateQueries({ queryKey: ["navigation"] }); };
  const storage = (event: StorageEvent) => { if (event.key === signal) refresh(); };
  window.addEventListener(signal, refresh); window.addEventListener("storage", storage);
  return () => { window.removeEventListener(signal, refresh); window.removeEventListener("storage", storage); };
 }, [client]);
 const availableItems = available.flatMap(group => group.items);
 const permitted = (href: string) => {
  if(pluginPath(href)==="/console/transfers")return push.data?.enabled===true;
 const module = plugin(href); if (!module) return true;
  const path = pluginPath(href);
  const feature = path.match(/^\/console\/points\/(signin|tasks|mall|orders)(?:\/|$)/)?.[1];
  if (feature) return availableItems.some(item => item.href === `/console/points/${feature}`);
  // Known subfeatures (e.g. points signin/mall) retain their individual Gate switches.
  const known = query.data?.nodes.some(node => node.gate === path);
  return known ? availableItems.some(item => item.href === adminPath(path)) : availableItems.some(item => plugin(item.href) === module);
 };
 const nodes = query.data?.nodes ?? [];
 const todos = useAdminTodos(scope === 'admin' && nodes.some(node => node.badge !== undefined && node.href.startsWith(adminPath('/admin/todos'))));
 const groups: NavigationGroup[] = nodes.filter(node => node.parentId === "0").map(group => ({
  label: group.name, id: group.id, icon: navigationIcon(group.icon), badge: group.badge,
  items: nodes.filter(node => node.parentId === group.id && (!node.gate || permitted(node.gate)) && permitted(node.href)).map(node => ({
   id: node.id, label: node.href === "/console/groupbuy" && node.name === "拼团" ? (availableItems.find(item => item.href === node.href)?.label ?? node.name) : node.name,
   href: scope === "console" && pluginPath(node.href).replace(/\/$/, "") === "/console/tickets" ? "/console/help" : node.href, icon: navigationIcon(node.icon), badge: node.badge, target: node.target === "blank" ? "_blank" as const : undefined,
  })),
 }));
 // Keep saved navigation compatible without changing navigation records in the database.
 const adminGroups = scope === "admin" ? mergeProductNavigation(groups) : groups;
 return { ...query, groups: scope === 'admin' ? withTodoCounts(adminGroups, todos.data) : groups };
}

function mergeProductNavigation(groups: NavigationGroup[]): NavigationGroup[] {
 let seen = false;
 return groups.map(group => ({ ...group, items: group.items.flatMap(item => {
  const path = pluginPath(item.href).replace(/\/$/, "");
  if (path !== "/admin/products" && path !== "/admin/products/groups") return [item];
  if (seen) return [];
  seen = true;
  return [{ ...item, label: "商品管理", href: adminPath("/admin/products") }];
 }) })).filter(group => group.items.length > 0);
}
