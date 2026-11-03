import {CaretDownIcon} from '@phosphor-icons/react';
import {usePublicSite,usePublicPages} from '../../api/publicContent';
import {publicContentURL,publicDestination,publicHeaderLinks} from '../../utils/publicPages';
import {Fragment,type CSSProperties,type ReactNode} from "react";
import {LegalDocumentDialog} from "../LegalDocumentDialog";
import {defaultSiteFooterColumns,type SiteFooterColumns,type SiteLink} from "./siteNavigation";
import "./marketing-shell.css";

function FooterLink({link}:{link:SiteLink}){
 return link.document?<span className="marketing-footer-document"><LegalDocumentDialog kind={link.document} label={link.label}/></span>:<a className="marketing-footer-link" href={publicDestination(link.href!)}>{link.label}</a>;
}

export interface SiteFooterProps {
 variant?:"cloudflare"|"tencent";
 id?:string;
 brand?:string;
 homeHref?:string;
 copyrightName?:string;
 copyrightText?:string;
 columns?:SiteFooterColumns;
 legalLinks?:readonly SiteLink[];
 privacyAction?:ReactNode;
 filing?:string;
 filingHref?:string;
}

/** One shared implementation; consumers configure content, never copy the grid. */
function SiteFooterView({variant="cloudflare",id="site-footer",brand="多多云",homeHref="/",copyrightName="ddoidc.com",columns=defaultSiteFooterColumns,legalLinks=[{label:"隐私政策",document:"privacy"},{label:"报告安全问题",href:"/console/tickets/create"},{label:"服务条款",document:"service"},{label:"关于平台",href:"/about"}],privacyAction,filing,filingHref,copyrightText}:SiteFooterProps){
 if(variant==="tencent")return <footer id={id} className="marketing-tencent-footer" aria-label="网站底栏"><div className="marketing-tencent-frame"><div className="marketing-tencent-assurances">{[{label:"账户安全保护",symbol:"✓",href:"/console/security"},{label:"实名认证服务",symbol:"▤",href:"/console/certification"},{label:"专属工单支持",symbol:"✓",href:"/console/tickets"},{label:"在线自助服务",symbol:"24",href:"/console"}].map(item=><a href={publicDestination(item.href)} key={item.label}><span className="marketing-tencent-service-icon" aria-hidden="true">{item.symbol}</span><span>{item.label}</span></a>)}</div><div className="marketing-tencent-main" style={{'--marketing-footer-column-count':Math.min(4,Math.max(1,columns.length))} as CSSProperties}>{columns.map((groups,index)=><nav className="marketing-tencent-links" key={index} aria-label={`底栏${groups[0]?.title}`}>{groups.slice(0,1).map(group=><Fragment key={group.title}><h2>{group.title}</h2>{group.links.map(link=><FooterLink key={link.label+link.href} link={link}/>)}</Fragment>)}</nav>)}<section className="marketing-tencent-contact"><h2>关注或联系我们</h2><p>产品使用、账户及订单问题，请通过工单联系我们</p><div className="marketing-tencent-contact-options"><a href="/help"><span aria-hidden="true">▤</span>帮助文档</a><a href={publicDestination("/console/tickets")}><span aria-hidden="true">☏</span>我的工单</a></div><p>在线提交问题，随时查看处理进度</p><a className="marketing-tencent-contact-button" href={publicDestination("/console/tickets/create")}>联系我们</a></section></div><div className="marketing-tencent-bottom"><div><div className="marketing-tencent-brand-row"><a className="marketing-tencent-brand" href={homeHref}>{brand}</a><nav aria-label="底栏法律信息">{legalLinks.map(link=><FooterLink key={link.label} link={link}/>)}</nav></div><p>{copyrightText||`Copyright © ${new Date().getFullYear()} ${copyrightName}. All rights reserved.`}</p><p>云服务与账户管理平台</p>{filing&&<p>{publicContentURL(filingHref)?<a href={filingHref}>{filing}</a>:filing}</p>}</div><a className="marketing-tencent-region" href="/">◎ 中国站 <CaretDownIcon size={12} aria-hidden="true"/></a></div></div></footer>;
 return <footer id={id} className="marketing-site-footer" aria-label="网站底栏"><div className="marketing-footer-frame"><div className="marketing-footer-main"><a className="marketing-footer-wordmark" href={homeHref} aria-label={`${brand} 首页`}>{brand}</a><div className="marketing-footer-columns">{columns.map((groups,index)=><div className="marketing-footer-column" key={index}>{groups.map(group=><nav className="marketing-footer-group" key={group.title} aria-label={`底栏${group.title}`}><h2 className="marketing-footer-heading">{group.title}</h2>{group.links.map(link=><FooterLink key={link.label} link={link}/>)}</nav>)}</div>)}</div></div><div className="marketing-footer-legal"><p>{copyrightText||`© ${new Date().getFullYear()} ${copyrightName}`}</p><nav className="marketing-footer-legal-nav" aria-label="底栏法律信息">{legalLinks.map(link=><FooterLink key={link.label} link={link}/>)}<span className="marketing-footer-privacy-action">{privacyAction??<><span className="marketing-privacy-symbol" aria-hidden="true"><span>✓</span><span>×</span></span><LegalDocumentDialog kind="privacy" label="隐私与数据选择"/></>}</span></nav></div></div></footer>;
}

export function SiteFooter(props:SiteFooterProps){
 const query=usePublicSite();const pages=usePublicPages();const site=query.data?.site;
 if(site&&!site.footerEnabled)return null;
 const columns:SiteFooterColumns|undefined=site?.footer?publicHeaderLinks(site.footer,window.location.hostname,pages.data).map(link=>[{title:link.label,links:(link.children?.length?link.children:[link]).filter(item=>publicContentURL(item.href)).map(item=>({label:item.label,href:publicDestination(item.href)}))}]):undefined;
 return <SiteFooterView {...props} brand={site?.brand?.replace(/DD[YO]IDC/gi,'多多云')||props.brand} columns={columns??props.columns} filing={site?.filing??props.filing} filingHref={site?.filingUrl??props.filingHref} copyrightText={site?.copyright?.replace(/DD[YO]IDC/gi,'多多云')||props.copyrightText} copyrightName={site?.copyright?.replace(/DD[YO]IDC/gi,'多多云')||props.copyrightName}/>;
}
