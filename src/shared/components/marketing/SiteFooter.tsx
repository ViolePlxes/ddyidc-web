import type {ReactNode} from "react";
import {LegalDocumentDialog} from "../LegalDocumentDialog";
import {defaultSiteFooterColumns,type SiteFooterColumns,type SiteLink} from "./siteNavigation";
import "./marketing-shell.css";

function FooterLink({link}:{link:SiteLink}){
 return link.document?<span className="marketing-footer-document"><LegalDocumentDialog kind={link.document} label={link.label}/></span>:<a className="marketing-footer-link" href={link.href}>{link.label}</a>;
}

export interface SiteFooterProps {
 variant?:"cloudflare"|"tencent";
 id?:string;
 brand?:string;
 homeHref?:string;
 copyrightName?:string;
 columns?:SiteFooterColumns;
 legalLinks?:readonly SiteLink[];
 privacyAction?:ReactNode;
}

/** One shared implementation; consumers configure content, never copy the grid. */
export function SiteFooter({variant="cloudflare",id="site-footer",brand="DDOIDC",homeHref="/",copyrightName="ddoidc.com",columns=defaultSiteFooterColumns,legalLinks=[{label:"隐私政策",document:"privacy"},{label:"报告安全问题",href:"/console/tickets/create"},{label:"服务条款",document:"service"},{label:"关于平台",href:"/about"}],privacyAction}:SiteFooterProps){
 if(variant==="tencent")return <footer id={id} className="marketing-tencent-footer" aria-label="网站底栏"><div className="marketing-tencent-frame"><div className="marketing-tencent-assurances">{[{label:"账户安全保护",symbol:"✓",href:"/console/security"},{label:"实名认证服务",symbol:"▤",href:"/console/certification"},{label:"专属工单支持",symbol:"✓",href:"/console/tickets"},{label:"在线自助服务",symbol:"24",href:"/console"}].map(item=><a href={item.href} key={item.label}><span className="marketing-tencent-service-icon" aria-hidden="true">{item.symbol}</span><span>{item.label}</span></a>)}</div><div className="marketing-tencent-main">{columns.map((groups,index)=><nav className="marketing-tencent-links" key={index} aria-label={`底栏${groups[0]?.title}`}><h2>{groups[0]?.title}</h2>{groups[0]?.links.map(link=><FooterLink key={link.label} link={link}/>)}</nav>)}<section className="marketing-tencent-contact"><h2>关注或联系我们</h2><p>产品使用、账户及订单问题，请通过工单联系我们</p><div className="marketing-tencent-contact-options"><a href="https://docs.ddoidc.com"><span aria-hidden="true">▤</span>帮助文档</a><a href="/console/tickets"><span aria-hidden="true">☏</span>我的工单</a></div><p>在线提交问题，随时查看处理进度</p><a className="marketing-tencent-contact-button" href="/console/tickets/create">联系我们</a></section></div><div className="marketing-tencent-bottom"><div><div className="marketing-tencent-brand-row"><a className="marketing-tencent-brand" href={homeHref}>{brand}</a><nav aria-label="底栏法律信息">{legalLinks.map(link=><FooterLink key={link.label} link={link}/>)}</nav></div><p>Copyright © {new Date().getFullYear()} {copyrightName}. All rights reserved.</p><p>云服务与账户管理平台</p></div><a className="marketing-tencent-region" href="/">◎ 中国站 <span aria-hidden="true">▾</span></a></div></div></footer>;
 return <footer id={id} className="marketing-site-footer" aria-label="网站底栏"><div className="marketing-footer-frame"><div className="marketing-footer-main"><a className="marketing-footer-wordmark" href={homeHref} aria-label={`${brand} 首页`}>{brand}</a><div className="marketing-footer-columns">{columns.map((groups,index)=><div className="marketing-footer-column" key={index}>{groups.map(group=><nav className="marketing-footer-group" key={group.title} aria-label={`底栏${group.title}`}><h2 className="marketing-footer-heading">{group.title}</h2>{group.links.map(link=><FooterLink key={link.label} link={link}/>)}</nav>)}</div>)}</div></div><div className="marketing-footer-legal"><p>© {new Date().getFullYear()} {copyrightName}</p><nav className="marketing-footer-legal-nav" aria-label="底栏法律信息">{legalLinks.map(link=><FooterLink key={link.label} link={link}/>)}<span className="marketing-footer-privacy-action">{privacyAction??<><span className="marketing-privacy-symbol" aria-hidden="true"><span>✓</span><span>×</span></span><LegalDocumentDialog kind="privacy" label="隐私与数据选择"/></>}</span></nav></div></div></footer>;
}
