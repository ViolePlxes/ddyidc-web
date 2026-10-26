import { contentMenuRoots } from '../utils/contentMenu';
import { withDomainNavigation } from "../domains/navigation";
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
 const statisticsHref=scope==="admin"?adminPath("/admin/cdnsell/statistics"):"/console/cdnsell/statistics";
 const statisticsItem=availableItems.find(item=>item.href===statisticsHref);
 if(statisticsItem&&!groups.some(group=>group.items.some(item=>item.href===statisticsHref))){const cdnGroup=groups.find(group=>group.items.some(item=>plugin(item.href)==="cdnsell"));if(cdnGroup)cdnGroup.items.push(statisticsItem)}
 for(const group of groups)for(const item of group.items)if(item.href===statisticsHref){item.children=Object.entries({bandwidth:"带宽数据统计",traffic:"流量数据统计",requests:"访问数据统计",hit:"命中率统计",status:"状态码统计",distribution:"数据分布统计",uv:"独立IP数据统计",live:"直播数据统计",comparison:"带宽环比"}).map(([kind,label])=>({label,href:statisticsHref+"/"+kind,icon:item.icon}))}
 if(statisticsItem){const base=scope==="admin"?adminPath("/admin/cdnsell"):"/console/cdnsell";const group=groups.find(group=>group.items.some(item=>plugin(item.href)==="cdnsell"));if(group){group.items=group.items.filter(item=>![base+"/certs",base+"/ipcheck",base+"/tools"].includes(item.href));group.items.push({label:"高级工具",href:base+"/tools",icon:statisticsItem.icon,children:Object.entries({certificates:"证书管理",csr:"CSR证书管理","auto-refresh":"CDN自动刷新",ipcheck:"IP检测"}).map(([key,label])=>({label,href:base+"/tools/"+key,icon:statisticsItem.icon}))})}}
 const adminGroups = scope === "admin" ? mergeProductNavigation(groups) : groups;
 if (scope === 'admin' && query.isSuccess) {
  const content = availableItems.find(item => item.href === adminPath('/admin/content/site'));
  if (content) {
   const children = contentMenuRoots.map(root => ({ label: root.label, href: adminPath('/admin/content/' + root.groups[0]!.items[0]!.id), icon: content.icon }));
   let found = false;
   for (const group of adminGroups) group.items = group.items.flatMap(item => {
    if (item.href !== content.href) return [item];
    found = true;
    return children;
   });
   if (!found) adminGroups.push({ label: '前台内容', items: children });
  }
 }
 return { ...query, groups: scope === 'admin' ? withTodoCounts(adminGroups, todos.data) : scope === 'console' ? withDomainNavigation(groups) : groups };
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
