import aliases from './public-route-aliases.json';
import type {PortalPage} from '../api/portalContent';
export const pageLayouts=[{value:'overview',label:'企业概览'},{value:'contact',label:'联系与支持'},{value:'certificates',label:'资质与证书'},{value:'service',label:'产品与服务'},{value:'partners',label:'合作计划'},{value:'careers',label:'招聘岗位'},{value:'catalog',label:'产品目录'},{value:'solutions',label:'解决方案'},{value:'campaign',label:'活动专题'},{value:'document',label:'文档与政策'}] as const;
export type PublicPageLayout=typeof pageLayouts[number]['value'];
export const pageReferences:Record<string,{layout:PublicPageLayout;source:string}>={
 '/about':{layout:'overview',source:'https://www.aliyun.com/about'},'/company':{layout:'overview',source:'https://www.aliyun.com/about'},'/company-environment':{layout:'overview',source:'https://www.aliyun.com/about'},
 '/contact':{layout:'contact',source:'https://www.aliyun.com/contact'},'/honors':{layout:'certificates',source:'https://security.aliyun.com/trust-center/compliance'},'/licenses':{layout:'certificates',source:'https://security.aliyun.com/trust-center/compliance'},
 '/service-guarantees':{layout:'service',source:'https://www.aliyun.com/service'},'/agency':{layout:'partners',source:'https://partner.aliyun.com/management/v2'},'/sponsors':{layout:'partners',source:'https://partner.aliyun.com/management/v2'},'/referral':{layout:'partners',source:'https://dashi.aliyun.com/'},
 '/recruit':{layout:'careers',source:'https://careers.aliyun.com/'},'/products':{layout:'catalog',source:'https://www.aliyun.com/product/list'},'/cloud':{layout:'service',source:'https://www.aliyun.com/product/ecs'},'/cdn':{layout:'service',source:'https://www.aliyun.com/product/cdn'},'/domain':{layout:'service',source:'https://wanwang.aliyun.com/'},'/security':{layout:'service',source:'https://www.aliyun.com/product/aegis'},'/panel':{layout:'service',source:'https://www.aliyun.com/product/ecs'},
 '/solutions':{layout:'solutions',source:'https://www.aliyun.com/solution/tech-solution/'},'/campaigns':{layout:'campaign',source:'https://www.aliyun.com/activity'},'/icp':{layout:'service',source:'https://beian.aliyun.com/'},
 '/news':{layout:'document',source:'https://www.aliyun.com/notice/'},'/help':{layout:'document',source:'https://help.aliyun.com/zh/'},'/aup':{layout:'document',source:'https://help.aliyun.com/zh/legal/'},'/privacy':{layout:'document',source:'https://help.aliyun.com/zh/legal/latest/alibaba-cloud-privacy-policy'},'/terms/service':{layout:'document',source:'https://help.aliyun.com/zh/legal/'},'/terms/privacy':{layout:'document',source:'https://help.aliyun.com/zh/legal/latest/alibaba-cloud-privacy-policy'}
};
export function publicPageLayout(page:Pick<PortalPage,'layout'|'kind'|'path'>|undefined,path:string):PublicPageLayout {
 if(page?.layout&&pageLayouts.some(layout=>layout.value===page.layout))return page.layout as PublicPageLayout;
 if(page?.kind==='article')return 'document';
 return pageReferences[path]?.layout??(path.startsWith('/products/')?'service':path.startsWith('/solutions/')?'solutions':path.startsWith('/campaigns/')?'campaign':'overview');
}
export function articleType(page:PortalPage):'news'|'help'{return page.contentType??(page.path.startsWith('/help/')?'help':'news');}
export function articleResults(pages:PortalPage[],kind:'news'|'help',query:string,category:string){const word=query.trim().toLocaleLowerCase();return pages.filter(page=>page.enabled&&page.kind==='article'&&articleType(page)===kind&&(!category||page.categoryId===category)&&(!word||`${page.title} ${page.seo.description} ${page.modules?.filter(module=>module.enabled).map(module=>module.text).join(' ')}`.toLocaleLowerCase().includes(word))).sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));}

export const canonicalPublicPath=(path:string)=>(aliases as Record<string,string>)[path]??path;
