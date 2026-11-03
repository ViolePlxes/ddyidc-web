import type { PortalDocument, PortalPage } from '../api/portalContent';

export interface ContentScope { title: string; path: string; types?: string[]; moduleIDs?: string[] }
export const contentScopes: Record<string, ContentScope> = {
  company: {title:'企业信息',path:'/company',types:['hero','feature_sections','final_cta']},
  contact: {title:'联系我们',path:'/contact',types:['hero','feature_sections','final_cta']},
  recruit: {title:'人才招聘',path:'/recruit',types:['job_list','hero','feature_sections','final_cta']},
  productModules: { title: '产品展示模块', path: '/', moduleIDs: ['home-products'] },
  carousel: { title: '首页轮播', path: '/', moduleIDs: ['home-hero'] },
  belowCarousel: { title: '轮播下方', path: '/', moduleIDs: ['home-services'] },
  carouselSettings: { title: '轮播全局', path: '/', moduleIDs: ['home-hero'] },
  environment: { title: '公司环境', path: '/company-environment', types: ['feature_sections'] },
  honors: { title: '荣耀证书', path: '/honors', types: ['image_gallery','feature_sections','faq'] },
  licenses: { title: '许可证书', path: '/licenses', types: ['image_gallery','feature_sections','faq'] },
  sponsors: { title: '百站赞助', path: '/sponsors', types: ['partner_logos'] },
  about: { title: '简介与资质', path: '/about', types: ['hero', 'feature_sections'] },
  solutions: { title: '解决方案', path: '/solutions', types: ['feature_sections', 'final_cta'] },
  guarantees: { title: '服务保障', path: '/service-guarantees', types: ['feature_sections'] },
  referralPage: { title: '推广返利介绍', path: '/referral', types: ['feature_sections', 'final_cta'] },
  agency: { title: '代理合作', path: '/agency', types: ['feature_sections', 'final_cta'] },
  panel: { title: '宝塔面板介绍', path: '/panel', types: ['feature_sections', 'final_cta'] },
  campaignPage: { title: '活动页面', path: '/campaigns', types: ['banner_carousel', 'feature_sections', 'final_cta'] },
  newsHelp: { title: '新闻帮助入口', path: '/', moduleIDs: ['home-benefits'] },
};
export function validateContentPath(value: string, pages: PortalPage[], excludeID?: string): string | undefined {
  if (!/^\/(?:[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*)?$/.test(value)) return '请使用以 / 开头的英文、数字、短横线或下划线路径';
  const controlledProduct=Boolean(excludeID&&pages.some(page=>page.id===excludeID&&page.path===value&&((page.kind==='products'&&value==='/products')||(page.kind==='product'&&/^\/products\/\d{1,20}$/.test(value)))));
  if (!controlledProduct && /^\/(api|admin|dd-admin-[a-z0-9]+|console|sales|wallet|user|login|register|reset-password|bind-mobile|auth|cart|order|assets|products|groupbuy|marketplace)(\/|$)/.test(value)) return '该路径由系统保留，请选择其他路径';
  if (pages.some(page => page.id !== excludeID && page.path === value)) return '该路径已被其他页面使用';
}
export function addContentPage(document: PortalDocument, title: string, path: string, id: string): PortalDocument {
  const error = validateContentPath(path, document.pages);
  if (error || !title.trim() || document.pages.length >= 500) throw new Error(error ?? '请填写页面标题，页面总数不能超过500');
  return { ...document, pages: [...document.pages, { id, title: title.trim(), path, kind: 'page', enabled: false, seo: { title: '', keywords: '', description: '', image: '', noIndex: false }, updatedAt: '', modules: [] }] };
}

export function campaignPages(document: PortalDocument) { return document.pages.filter(page => page.kind === 'page' && page.path.startsWith('/campaigns/')); }
export function selectedProductIDs(value: unknown): string[] { return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && /^[0-9]{1,20}$/.test(id)))].slice(0, 100) : []; }
