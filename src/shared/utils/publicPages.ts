import {publicPageLayout} from './publicPageLayouts';
import type {SiteHeaderLink} from '../components/marketing/siteNavigation';
import type {PortalDocument, PortalPage} from '../api/portalContent';
export const publicPageCatalog = [
 ['/about','关于多多云'],['/company','企业信息'],['/contact','联系我们'],['/company-environment','公司环境'],['/honors','荣誉资质'],['/licenses','许可证书'],['/service-guarantees','服务保障'],['/solutions','解决方案'],['/referral','推广合作'],['/agency','代理合作'],['/sponsors','合作伙伴'],['/panel','管理面板'],['/campaigns','活动中心'],['/news','新闻公告'],['/help','帮助中心'],['/cloud','云服务器'],['/cdn','内容分发'],['/domain','域名服务'],['/security','安全服务'],['/recruit','人才招聘'],['/icp','备案服务'],['/aup','可接受使用政策']
] as const;
export function publicPageDraft(path:string,title:string):PortalPage {
 const titles:Record<string,string[]>={'/company':['企业简介','业务与服务'],'/about':['关于多多云','服务理念'],'/contact':['联系渠道','服务支持'],'/honors':['荣誉资质'],'/licenses':['许可证书'],'/company-environment':['公司环境'],'/recruit':['招聘岗位','应聘方式']};
 return {id:`page-${crypto.randomUUID()}`,path,title,layout:publicPageLayout(undefined,path),kind:'page',enabled:false,updatedAt:'',seo:{title:'',description:'',keywords:'',image:'',noIndex:false},modules:(titles[path]??[title]).map((heading,index)=>({id:`body-${crypto.randomUUID()}`,type:'feature_sections',enabled:true,sort:index*10,title:heading,text:''}))};
}
export function addMissingPublicPages(document:PortalDocument):PortalDocument {
 const missing=publicPageCatalog.filter(([path])=>!document.pages.some(page=>page.path===path));
 if(document.pages.length+missing.length>500)throw new Error('页面总数不能超过500');
 return {...document,pages:[...document.pages,...missing.map(([path,title])=>publicPageDraft(path,title))]};
}
/** No executable, protocol-relative, traversal, or control-character URLs from CMS. */
export function publicContentURL(value:unknown):string|undefined {
 if(typeof value!=='string'||!value||/[\\\x00-\x20]/.test(value)||value.startsWith('//'))return;
 if(value.startsWith('/'))return value.includes('..')?undefined:value;
 try {const url=new URL(value);if(url.protocol==='https:'&&!url.username&&!url.password)return value;}catch{/* invalid */}
}

export function publishedPage(pages:PortalPage[]|undefined,path:string){return pages?.find(page=>page.enabled&&page.path===path);}
export function publicNavigation(){return [
 {label:'产品与服务',href:'/products',children:[{label:'云服务器',href:'/cloud',children:[]},{label:'内容分发',href:'/cdn',children:[]},{label:'域名服务',href:'/domain',children:[]}]},
 {label:'企业信息',href:'/company',children:[{label:'关于多多云',href:'/about',children:[]},{label:'联系我们',href:'/contact',children:[]},{label:'荣誉资质',href:'/honors',children:[]},{label:'许可证书',href:'/licenses',children:[]}]},
 {label:'服务支持',href:'/help',children:[{label:'帮助中心',href:'/help',children:[]},{label:'新闻公告',href:'/news',children:[]},{label:'服务保障',href:'/service-guarantees',children:[]}]},
 {label:'合作与生态',href:'/agency',children:[{label:'代理合作',href:'/agency',children:[]},{label:'推广合作',href:'/referral',children:[]},{label:'合作伙伴',href:'/sponsors',children:[]}]}
];}

export function publicDestination(href:string,hostname:string=window.location.hostname){
 return hostname==='cloud.ddoidc.com'&&/^\/(?:console|wallet|login|register|reset-password|groupbuy|marketplace|auth)(?:[/?#]|$)/.test(href)?'https://console.ddoidc.com'+href:href;
}

/** A leaf must not acquire children:[]: the navigation would open an empty menu. */
interface PublicNavLink{enabled?:boolean;label:string;href:string;description?:string;children?:readonly PublicNavLink[]|null}
export function publicHeaderLinks(input:readonly PublicNavLink[],hostname:string,pages?:PortalPage[]):SiteHeaderLink[]{
 const visible=(href:string)=>!pages||!publicPageCatalog.some(([path])=>path===href)||pages.some(page=>page.path===href&&page.enabled);
 const leaves=(links:readonly PublicNavLink[],depth=0):SiteHeaderLink[]=>depth>3?[]:links.filter(link=>link.enabled!==false).flatMap(link=>{
  const href=publicContentURL(link.href);const entry=href&&visible(href)?[{label:link.label,href:publicDestination(href,hostname),description:link.description}]:[];
  return [...entry,...leaves(link.children??[],depth+1)];
 });
 return input.filter(link=>link.enabled!==false).flatMap(link=>{const href=publicContentURL(link.href);const children=leaves(link.children??[]);if((!href||!visible(href))&&!children.length)return [];return [{label:link.label,description:link.description,href:publicDestination(href??'/',hostname),...(children.length?{children}: {})}];});
}
