import {publicPageCatalog} from './publicPages';
import {adminRouteMetadata} from './adminRouteMetadata';
import {adminBreadcrumbs} from './adminBreadcrumbs';
import {consoleBreadcrumbs} from './consoleBreadcrumbs';

export const SITE_BRAND='多多云';
export const HOME_TITLE='多多云｜云计算产品与服务';
const publicTitles:Record<string,string>={
 '/billing':'统一账单', '/login':'用户登录','/register':'注册账户','/reset-password':'重置密码','/forgot-password':'找回密码','/bind-mobile':'绑定手机号',
 '/products':'云产品与服务','/groupbuy':'云服务拼团','/marketplace':'云资源交易市场','/about':'关于多多云',
 '/agreement/service':'服务条款','/agreement/privacy':'隐私政策','/terms':'服务条款','/privacy':'隐私政策',
 '/terms/service':'服务条款','/terms/privacy':'隐私政策','/auth/social/complete':'账户授权',
 '/news':'新闻资讯','/help':'帮助中心','/referral':'推广合作'
};
const todoTitles:Record<string,string>={'tickets':'待处理工单','certifications':'实名审核','recommendations':'优惠码审核','refunds':'退款审核','withdrawals':'提现审核','offline-transfers':'线下转账审核','provisioning':'待开通产品','expiring':'即将到期产品','manual-products':'待手动处理产品'};
/** Use static route labels only: no customer names, IDs, queries or tokens in browser tabs. */
export function pageTitle(pathname:string):string {
 const path=pathname.split(/[?#]/)[0]!.replace(/\/$/,'')||'/';
 if(path==='/')return HOME_TITLE;
 const admin=path.match(/^\/dd-admin-[a-z0-9]{24,64}(?=\/|$)/)?.[0];
 let label=publicTitles[path]??publicPageCatalog.find(([route])=>route===path)?.[1];
 if(admin){const relative=path.slice(admin.length);label=todoTitles[relative.startsWith('/todos/')?relative.slice(7):'']??adminRouteMetadata.find(([route])=>route===path.slice(admin.length))?.[1]??adminBreadcrumbs(path,admin,[]).at(-1)?.label;if(path===admin)label='管理控制台';if(path===admin+'/login')label='管理后台登录';}
 else if(/^\/console(?:\/|$)/.test(path)||path.startsWith('/wallet/')||path.startsWith('/user/')||path==='/cart'||path==='/order/confirm'){
  label=consoleBreadcrumbs(path,[]).at(-1)?.label;if(path==='/console')label='用户控制台';
 }else if(/^\/sales(?:\/|$)/.test(path))label=path==='/sales/login'?'销售登录':path==='/sales/customers'?'授权客户管理':/^\/sales\/customers\//.test(path)?'授权客户详情':'销售工作台';
 else if(/^\/products\//.test(path))label='云产品详情';
 else if(/^\/marketplace\//.test(path))label='云资源详情';
 else if(/^\/groupbuy\//.test(path))label='拼团活动详情';
 else if(/^\/news\//.test(path))label='资讯详情';
 else if(/^\/help\//.test(path))label='帮助文档';
 return (label==='未找到页面'?'页面未找到':label||'服务门户')+' - '+SITE_BRAND;
}
