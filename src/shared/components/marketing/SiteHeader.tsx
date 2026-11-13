import {usePublicSite,usePublicPages} from '../../api/publicContent';
import {publicContentURL,publicDestination,publicHeaderLinks} from '../../utils/publicPages';
import {useEffect,useLayoutEffect,useId,useRef,useState,type ReactNode} from "react";
import {CaretDownIcon,CaretRightIcon} from "@phosphor-icons/react";
import {defaultSiteHeaderLinks,type SiteHeaderLink} from "./siteNavigation";
import "./marketing-header.css";
import {SiteSearch} from "./SiteSearch";
import {CloudBrandMark} from "./CloudBrandMark";
import {SiteHeaderMenu} from "./SiteHeaderMenu";

export interface SiteHeaderProps {
 searchLinks?:readonly SiteHeaderLink[];brand?:string;homeHref?:string;tagline?:string;links?:readonly SiteHeaderLink[];action?:ReactNode;logo?:ReactNode;supportLink?:{label:string;href:string};loginLink?:{label?:string;href:string};account?:{label:string;href:string};
}
/** Shared Aliyun-style public navigation; content remains platform-owned and configurable. */
function SiteHeaderView({searchLinks,brand="多多云",homeHref="/",links=defaultSiteHeaderLinks,action,logo,supportLink={label:"支持",href:"/console/tickets/create"},loginLink,account={label:"账户",href:"/console"}}:SiteHeaderProps){
 // The desktop actions block is hidden below 1120px, so mobile keeps one
 // Aliyun-style text entry that stays outside the caller-supplied actions.
 const mobileLogin=loginLink??{label:"登录",href:publicDestination(account?.href??"/console")};
 const [open,setOpen]=useState(false);const [active,setActive]=useState<number|null>(null);const [search,setSearch]=useState(false);
 const [panelLeft,setPanelLeft]=useState(16);
 const [highlightSearch,setHighlightSearch]=useState(()=>window.scrollY>100);
 useEffect(()=>{let last=window.scrollY;const onScroll=()=>{const next=window.scrollY;if(Math.abs(next-last)<10)return;if(next>last&&next>100)setHighlightSearch(true);else if(next<last&&next<100)setHighlightSearch(false);last=next};window.addEventListener("scroll",onScroll,{passive:true});return()=>window.removeEventListener("scroll",onScroll)},[]);
 const indicator=useRef<HTMLLIElement>(null);
 const root=useRef<HTMLElement>(null);const triggers=useRef<(HTMLButtonElement|null)[]>([]);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);const id=useId();
 const cancelClose=()=>{if(timer.current)clearTimeout(timer.current)};
 const close=()=>{cancelClose();setOpen(false);setActive(null);setSearch(false)};
 useEffect(()=>{const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node)){setOpen(false);setActive(null)}};document.addEventListener("pointerdown",outside);return()=>{document.removeEventListener("pointerdown",outside);if(timer.current)clearTimeout(timer.current)}},[]);

 const current=active!==null?links[active]:null;
 useLayoutEffect(()=>{const position=()=>{const highlight=indicator.current;const trigger=active!==null?triggers.current[active]:null;if(!trigger){if(highlight)highlight.style.opacity="0";return}const rect=trigger.getBoundingClientRect();if(highlight){const parent=highlight.parentElement!.getBoundingClientRect();const entering=highlight.style.opacity!=="1";if(entering)highlight.style.transition="none";highlight.style.left=`${rect.left-parent.left}px`;highlight.style.width=`${rect.width}px`;highlight.style.opacity="1";if(entering)void highlight.offsetHeight;highlight.style.transition="left .2s ease-out,width .2s ease-out,opacity .2s ease-out";}const width=Math.min(820,innerWidth-32);setPanelLeft(Math.max(16,Math.min(rect.left+rect.width/2-width/2,innerWidth-width-16)))};position();window.addEventListener("resize",position);return()=>window.removeEventListener("resize",position)},[active]);

 return <header ref={root} className={`marketing-aliyun-header marketing-tc-header pls-nav pls-nav-air fixed${highlightSearch?" is-search-highlighted":""}`} onMouseEnter={cancelClose} onMouseLeave={()=>{if(matchMedia("(hover:hover) and (min-width:1121px)").matches){cancelClose();timer.current=setTimeout(()=>setActive(null),180)}}} onKeyDown={event=>{if(event.key==="Escape"){if(active!==null)triggers.current[active]?.focus();close()}}}><div className="pls-nav-mod"><div className="marketing-tc-top pls-nav-top"><button type="button" className="marketing-tc-toggle" aria-label={open?"收起导航":"展开导航"} aria-expanded={open} aria-controls={`${id}-nav`} onClick={()=>{setOpen(value=>!value);setActive(null);setSearch(false)}}><span className="marketing-ali-burger" aria-hidden="true"><span/></span></button><a href={homeHref} className="marketing-tc-logo pls-nav-top-logo" aria-label={`${brand} 首页`}>{logo??<CloudBrandMark/>}</a><nav aria-label="网站导航" id={`${id}-nav`} className={`marketing-tc-nav pls-nav-list-wrap${open?" is-open":""}`}><ul className="pls-nav-list"><li ref={indicator} className="marketing-cf-nav-indicator" role="presentation" aria-hidden="true"/><li className="pls-nav-item is-model"><a href={publicDestination("/groupbuy")} onClick={close}><span className="pls-nav-model-text">云拼团</span></a></li>{links.map((link,index)=><li key={`${link.label}:${link.href}`} className="marketing-tc-nav-item pls-nav-item" onMouseEnter={()=>{cancelClose();if(matchMedia("(hover:hover) and (min-width:1121px)").matches){setActive(link.children?index:null);setSearch(false)}}}>{link.children?<button type="button" ref={element=>{triggers.current[index]=element}} aria-expanded={active===index} aria-controls={`${id}-menu`} onClick={event=>{setActive(value=>event.detail>0&&matchMedia("(hover:hover) and (min-width:1121px)").matches?index:value===index?null:index);setSearch(false);setOpen(false)}} onKeyDown={event=>{if(event.key==="ArrowDown"){event.preventDefault();setActive(index);requestAnimationFrame(()=>document.getElementById(`${id}-menu`)?.querySelector<HTMLAnchorElement>("a")?.focus())}}}>{link.label}</button>:<a href={publicDestination(link.href!)} onClick={close}>{link.label}</a>}</li>)}</ul>{highlightSearch?<button type="button" className="marketing-nav-restore" aria-label="展开全部导航" onClick={()=>setHighlightSearch(false)}><CaretRightIcon size={12}/></button>:null}</nav><div className="marketing-tc-tools pls-nav-top-operation"><SiteSearch open={search} onOpenChange={next=>{cancelClose();setSearch(next);if(next){setActive(null);setOpen(false)}}} links={searchLinks??links} brand={brand}/><a className="marketing-tc-region" href={homeHref}>中国站<CaretDownIcon size={10}/></a><a className="marketing-tc-docs" href="/help">文档</a>{supportLink?<a className="marketing-tc-support" href={publicDestination(supportLink.href)}>{supportLink.label}</a>:null}<div className="marketing-tc-actions">{action??<><a href={publicDestination("/console")}>控制台</a>{account?<a className="marketing-tc-account" href={publicDestination(account.href)} aria-label={account.label+"入口"} title={account.label}>{account.label}</a>:<a className="marketing-tc-register" href={publicDestination("/register")}>免费注册</a>}</>}</div>{mobileLogin?<a className="marketing-tc-mobile-login" href={mobileLogin.href} onClick={close}>{mobileLogin.label??"登录"}</a>:null}</div></div><SiteHeaderMenu item={current?.children?current:null} index={active} left={panelLeft} id={`${id}-menu`} onNavigate={close}/></div></header>;
}

export function SiteHeader(props:SiteHeaderProps){
 const query=usePublicSite();const pages=usePublicPages();const site=query.data?.site;
 if(site&&!site.headerEnabled)return null;
 const links=publicHeaderLinks(site?.navigation??props.links??defaultSiteHeaderLinks,window.location.hostname,pages.data);
 const searchLinks=[...links,...(pages.data??[]).filter(page=>page.enabled&&page.path!=='/').map(page=>({label:page.title,href:publicDestination(page.path),description:page.seo.description}))];
 return <SiteHeaderView {...props} searchLinks={searchLinks} brand={site?.brand?.replace(/DD[YO]IDC/gi,'多多云')||props.brand} links={(links??props.links??defaultSiteHeaderLinks).map(link=>({...link,href:publicDestination(link.href),children:link.children?.map(item=>({...item,href:publicDestination(item.href)}))}))} logo={publicContentURL(site?.logo)?<img src={site!.logo} alt="" className="h-8 w-auto"/>:props.logo}/>;
}
