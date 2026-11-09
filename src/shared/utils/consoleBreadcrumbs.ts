import { domainHref, domainSections } from '../domains/catalog';
import type { BreadcrumbGroup, Crumb } from './adminBreadcrumbs';

export const consoleRoutes: [string, string, string?][] = [
  ['/console','用户中心'], ['/console/messages','消息中心'], ['/console/messages/:id','消息详情','/console/messages'], ['/console/components','组件'], ['/console/products','选购产品'], ['/console/products/:id','商品详情','/console/products'],
  ['/console/instances','产品列表'], ['/console/instances/:instanceId','实例','/console/instances'], ['/console/instance/:instanceId/vnc','VNC 控制台','/console/instances'],
  ['/user/productList.htm','产品列表'], ['/user/instance/:instanceId.htm','实例','/console/instances'],
  ['/console/billing','统一账单'], ['/billing','统一账单'], ['/console/orders','统一账单'], ['/console/orders/:id','订单详情','/console/billing'], ['/console/payment/result','支付结果','/console/orders'],
  ['/console/video-bindings','视频绑定'], ['/console/transfers','实例转让'], ['/console/certification','实名认证'], ['/console/profile','个人中心'], ['/console/security','安全中心'],
  ['/console/promo','我的推广'], ['/console/coupons','优惠券'], ['/console/tickets','工单中心'], ['/console/tickets/create','创建工单','/console/tickets'], ['/console/tickets/:id','工单详情','/console/tickets'],
  ['/console/invoices','发票管理'], ['/console/invoices/list','发票列表','/console/invoices'], ['/console/invoices/titles','发票抬头','/console/invoices'], ['/console/invoices/addresses','发票地址','/console/invoices'],
  ['/console/transactions','交易记录'], ['/console/logs','操作日志'], ['/console/api','API 管理'], ['/console/help','支持中心'],
  ['/console/groupbuy','拼团活动'], ['/console/groupbuy/activities/:id','活动详情','/console/groupbuy'], ['/console/groupbuy/groups/:id','拼团详情','/console/groupbuy'], ['/console/groupbuy/my','我的拼团','/console/groupbuy'], ['/console/groupbuy/share/:inviteCode','拼团分享','/console/groupbuy'],
  ['/console/marketplace','交易市场'], ['/console/points','积分中心'], ['/console/points/signin','每日签到','/console/points'], ['/console/points/tasks','积分任务','/console/points'], ['/console/points/mall','积分商城','/console/points'], ['/console/points/orders','兑换订单','/console/points'],
  ['/console/cdnsell','CDN 加速'], ['/console/cdnsell/packages','套餐购买','/console/cdnsell'], ['/console/cdnsell/usage','用量统计','/console/cdnsell'], ['/console/cdnsell/domains','加速域名','/console/cdnsell'], ['/console/cdnsell/domains/:id','域名详情','/console/cdnsell/domains'],
  ['/console/cdnsell/certs','证书管理','/console/cdnsell'], ['/console/cdnsell/refresh','刷新预热','/console/cdnsell'], ['/console/cdnsell/logs','CDN 日志','/console/cdnsell'], ['/console/cdnsell/tools/:tool','高级工具','/console/cdnsell'], ['/console/cdnsell/statistics','数据统计','/console/cdnsell'], ['/console/cdnsell/statistics/:kind','数据统计','/console/cdnsell/statistics'], ['/console/cdnsell/ipcheck','IP 检测','/console/cdnsell'],
  ['/wallet/recharge','账户充值'], ['/wallet/recharge-records','充值记录','/wallet/recharge'], ['/wallet/consume-records','消费记录','/wallet/recharge'],
  ['/console/finance','财务中心'], ['/console/recharge','账户充值'], ['/cart','购物车'], ['/order/confirm','确认订单'],
];
function matches(pattern: string, path: string) {
  return new RegExp('^' + pattern.split('/').map(part => part.startsWith(':') ? '[^/]+' + (part.endsWith('.htm') ? '\\.htm' : '') : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('/') + '$').test(path);
}
export function consoleBreadcrumbs(pathname: string, groups: BreadcrumbGroup[]): Crumb[] {
  const path = pathname.split(/[?#]/)[0]!.replace(/\/$/, '');
  const entries = groups.flatMap(group => group.items.flatMap(item => [item, ...(item.children ?? [])]));
  const allowed = (href: string) => entries.some(item => item.href === href);
  const home: Crumb = { label: '用户中心', ...(allowed('/console') ? { href: '/console' } : {}) };
  if (path === '/console') return [{ label: '用户中心' }];
  for (const section of domainSections) for (const page of section.pages) if (path === domainHref(section, page)) return [home, { label: section.title, ...(allowed(domainHref(section)) ? { href: domainHref(section) } : {}) }, { label: page.title }];
  const domainSection = domainSections.find(section => path === domainHref(section));
  if (domainSection) return [home, { label: domainSection.title }];
  if (path === '/console/domains') return [home, { label: '域名服务' }];
  const row = [...consoleRoutes].sort((a,b) => a[0].split(':').length - b[0].split(':').length || b[0].length - a[0].length).find(([pattern]) => matches(pattern,path));
  if (!row) return [home, { label: '未找到页面' }];
  const exact = entries.find(item => item.href === path);
  const parent = row[2];
  return [home, ...(parent ? [{ label: entries.find(item => item.href === parent)?.label ?? consoleRoutes.find(item => item[0] === parent)?.[1] ?? '上级页面', ...(allowed(parent) ? { href: parent } : {}) }] : []), { label: exact?.label ?? row[1] }];
}
