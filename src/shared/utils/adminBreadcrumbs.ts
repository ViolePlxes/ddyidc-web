import { resolveContentMenu } from './contentMenu';
import { adminRouteMetadata } from './adminRouteMetadata';

export interface Crumb { label: string; href?: string }
export interface BreadcrumbGroup { label: string; items: { label: string; href: string; children?: { label: string; href: string }[] }[] }

// Explicit route metadata; static routes win over dynamic IDs. Never render URL parameters.
export const adminDetailRoutes: [string, string, string][] = [
  ['/orders/:id', '订单详情', '/orders'],
  ['/customers/:id/:tab?', '客户详情', '/customers'],
  ['/customers/:customerId/instances/:instanceId', '实例详情', '/instances'],
  ['/customers/:customerId/instances/:instanceId/vnc', 'VNC 控制台', '/instances'],
  ['/messages/broadcasts/new', '新建消息群发', '/messages/broadcasts'],
  ['/messages/broadcasts/:id', '消息群发详情', '/messages/broadcasts'],
  ['/tickets/types', '工单类型', '/tickets'],
  ['/tickets/statuses', '工单状态', '/tickets'],
  ['/tickets/prereplies', '预设回复', '/tickets'],
  ['/tickets/:id', '工单详情', '/tickets'],
  ['/products/groups', '商品分组', '/products'],
  ['/instances/renewal-quote-audit', '续费报价核查', '/instances'],
  ['/todos/:kind?', '待办事项', '/todos'],
  ['/cdnsell/tools/:tool', '高级工具', '/cdnsell/tools'],
  ['/cdnsell/statistics/:kind', '数据统计', '/cdnsell/statistics'],
];

function matches(pattern: string, path: string) {
  const parts = pattern.split('/').slice(1);
  const expression = parts.map(part => part.startsWith(':') ? (part.endsWith('?') ? '(?:/[^/]+)?' : '/[^/]+') : `/${part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).join('');
  return new RegExp(`^${expression}/?$`).test(path);
}

export function adminBreadcrumbs(pathname: string, base: string, groups: BreadcrumbGroup[]): Crumb[] {
  const path = pathname.split(/[?#]/)[0]!.replace(/\/$/, '') || '/';
  if (path !== base && !path.startsWith(`${base}/`)) return [{ label: '未找到页面' }];
  const entries = groups.flatMap(group => group.items.flatMap(item => [{ ...item, group: group.label }, ...(item.children ?? []).map(child => ({ ...child, group: group.label }))]));
  const permitted = (href: string) => entries.some(item => item.href === href);
  const home: Crumb = { label: '管理后台', ...(permitted(base) ? { href: base } : {}) };
  if (path === base) return [{ label: '经营概览' }];
  if (path === `${base}/content` || path.startsWith(`${base}/content/`)) {
    const route = path.slice(`${base}/content/`.length) || 'site';
    const { root, item } = resolveContentMenu(path === `${base}/content` ? 'site' : route);
    if (!item) return [home, { label: '未找到页面' }];
    const first = root.groups[0]!.items[0]!;
    const rootHref = `${base}/content/${first.id}`;
    const allowed = permitted(rootHref);
    const group = root.groups.find(group => group.items.some(child => child.id === item.id))!;
    const trail: Crumb[] = [
      { label: '前台内容', ...(entries.some(entry => entry.href.startsWith(`${base}/content/`)) ? { href: `${base}/content/site` } : {}) },
      { label: root.label, ...(allowed ? { href: rootHref } : {}) },
      ...(group.label !== root.label && group.label !== item.label ? [{ label: group.label }] : []),
      { label: item.label },
    ];
    // A parent pointing to the current page is text, not a redundant navigation action.
    return trail.map(crumb => crumb.href === path ? { label: crumb.label } : crumb);
  }
  const exact = entries.find(item => item.href.replace(/\/$/, '') === path);
  if (exact) return [home, ...(exact.group !== exact.label ? [{ label: exact.group }] : []), { label: exact.label }];
  const relative = path.slice(base.length);
  const detail = [...adminDetailRoutes].sort((a, b) => a[0].split(':').length - b[0].split(':').length || b[0].length - a[0].length).find(([pattern]) => matches(pattern, relative));
  if (!detail) {
    const declared = adminRouteMetadata.find(([pattern]) => matches(pattern, relative));
    return [home, { label: declared?.[1] ?? '未找到页面' }];
  }
  const [, label, parent] = detail;
  const parentEntry = entries.find(item => item.href === base + parent);
  return [home, ...(parentEntry ? [{ label: parentEntry.label, href: parentEntry.href }] : []), { label }];
}
