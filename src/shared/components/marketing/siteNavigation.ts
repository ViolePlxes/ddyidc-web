export type SiteLink = {label:string;href:string;document?:never}|{label:string;document:"service"|"privacy";href?:never};
export interface SiteLinkGroup {title:string;links:readonly SiteLink[]}
export type SiteFooterColumns=readonly (readonly SiteLinkGroup[])[];

export const defaultSiteFooterColumns:SiteFooterColumns=[
 [{title:"开始使用",links:[{label:"产品选购",href:"/products"},{label:"拼团活动",href:"/groupbuy"},{label:"注册账户",href:"/register"},{label:"登录账户",href:"/login"},{label:"用户中心",href:"/console"},{label:"我的订单",href:"/console/orders"},{label:"账户充值",href:"/wallet/recharge"}]},{title:"关于平台",links:[{label:"关于多多云",href:"/about"},{label:"服务说明",document:"service"},{label:"隐私保护",document:"privacy"},{label:"账户安全",href:"/console/security"},{label:"实名认证",href:"/console/certification"},{label:"联系我们",href:"/console/tickets/create"}]}],
 [{title:"平台服务",links:[{label:"云服务器",href:"/products"},{label:"域名服务",href:"/console/domains"},{label:"流量分发",href:"/console/cdnsell"},{label:"交易市场",href:"/marketplace"},{label:"优惠活动",href:"/groupbuy"}]},{title:"安全与合规",links:[{label:"服务条款",document:"service"},{label:"隐私政策",document:"privacy"},{label:"实名认证",href:"/console/certification"},{label:"账户安全",href:"/console/security"},{label:"工单支持",href:"/console/tickets"},{label:"问题反馈",href:"/console/tickets/create"}]}],
 [{title:"资源与支持",links:[{label:"帮助文档",href:"https://docs.ddoidc.com"},{label:"工单支持",href:"/console/tickets"},{label:"提交工单",href:"/console/tickets/create"},{label:"产品目录",href:"/products"},{label:"订单记录",href:"/console/orders"},{label:"充值记录",href:"/wallet/recharge-records"},{label:"消费记录",href:"/wallet/consume-records"}]},{title:"使用指南",links:[{label:"文档中心",href:"https://docs.ddoidc.com"},{label:"进入控制台",href:"/console"},{label:"提交问题",href:"/console/tickets/create"}]}],
 [{title:"解决方案",links:[{label:"云服务器拼团",href:"/groupbuy"},{label:"云资源管理",href:"/console/instances"},{label:"域名管理",href:"/console/domains"},{label:"内容分发服务",href:"/console/cdnsell"},{label:"云资源交易",href:"/marketplace"},{label:"账户与安全",href:"/console/security"}]}],
];

export interface SiteHeaderLink {label:string;href:string;description?:string;children?:readonly SiteHeaderLink[]}
export const defaultSiteHeaderLinks:readonly SiteHeaderLink[]=[
 {label:"最新活动",href:"/groupbuy"},
 {label:"产品",href:"/products",children:[{label:"云服务器",href:"/products",description:"选择适合业务的云资源配置"},{label:"域名服务",href:"/console/domains",description:"管理域名与相关服务"},{label:"流量分发",href:"/console/cdnsell",description:"查看内容分发服务"},{label:"拼团活动",href:"/groupbuy",description:"邀请好友组团享优惠"}]},
 {label:"解决方案",href:"/products",children:[{label:"云资源管理",href:"/console/instances",description:"集中管理已有云服务器"},{label:"云资源交易",href:"/marketplace",description:"浏览平台资源交易市场"},{label:"云服务器拼团",href:"/groupbuy",description:"按业务需求选择拼团方案"},{label:"内容分发",href:"/console/cdnsell",description:"集中查看与管理内容分发服务"},{label:"域名管理",href:"/console/domains",description:"管理域名和相关服务"},{label:"账户安全",href:"/console/security",description:"保护账户并管理安全设置"},{label:"工单支持",href:"/console/tickets",description:"查看服务问题及处理进度"}]},

 {label:"定价",href:"/products"},
 {label:"企业中心",href:"/console/certification"},
 {label:"云市场",href:"/marketplace"},
 {label:"开发者",href:"https://docs.ddoidc.com",children:[{label:"帮助文档",href:"https://docs.ddoidc.com",description:"产品说明与使用指南"},{label:"工单支持",href:"/console/tickets",description:"查看问题与处理进度"},{label:"账户安全",href:"/console/security",description:"管理账户安全设置"},{label:"关于平台",href:"/about",description:"了解多多云 平台"}]},
 {label:"客户支持",href:"/console/tickets"},
 {label:"合作与生态",href:"/referral"},
 {label:"了解多多云",href:"/about"},
];
