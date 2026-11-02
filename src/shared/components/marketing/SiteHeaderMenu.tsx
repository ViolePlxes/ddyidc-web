import {useLayoutEffect,useRef,useState} from "react";
import {CloudIcon,GlobeIcon,ShieldCheckIcon,ShoppingBagIcon,UsersThreeIcon,LifebuoyIcon,BookOpenIcon,LightningIcon} from "@phosphor-icons/react";
import type {SiteHeaderLink} from "./siteNavigation";

type View={item:SiteHeaderLink|null;index:number|null;previous:SiteHeaderLink|null;revision:number};
type Change={height:number;direction:number;fromTransform:string;fromOpacity:string;opening:boolean;closing:boolean;frameTransform:string;frameOpacity:string};
const ease="cubic-bezier(0,0,.58,1)";
function MenuContent({item,onNavigate}:{item:SiteHeaderLink;onNavigate:()=>void}){
 const links=item.children??[];
 const columns=Array.from({length:Math.min(3,links.length)},()=>[] as SiteHeaderLink[]);
 links.forEach((link,index)=>columns[index%columns.length]?.push(link));
 const iconFor=(href:string)=>href.includes("domains")?GlobeIcon:href.includes("security")?ShieldCheckIcon:href.includes("marketplace")?ShoppingBagIcon:href.includes("groupbuy")?UsersThreeIcon:href.includes("tickets")?LifebuoyIcon:href.includes("docs")?BookOpenIcon:href.includes("cdnsell")?LightningIcon:CloudIcon;
 return <nav className="marketing-cf-menu-grid" aria-label="分类页面" style={{gridTemplateColumns:`repeat(${Math.max(1,columns.length)},minmax(0,1fr))`}}>{columns.map((column,index)=><div className="marketing-cf-menu-column" key={index} style={{gridTemplateRows:`repeat(${Math.ceil(links.length/Math.max(1,columns.length))},auto)`}}>{column.map(link=>{const Icon=iconFor(link.href);return <a href={link.href} key={link.href} onClick={onNavigate}><Icon size={16} aria-hidden="true"/><span className="marketing-cf-menu-copy"><strong>{link.label}</strong>{link.description?<span>{link.description}</span>:null}</span></a>})}</div>)}</nav>;
}

/** CF NavigationContainer timing, implemented with browser animations (no added dependency). */
export function SiteHeaderMenu({item,index,left,id,onNavigate}:{item:SiteHeaderLink|null;index:number|null;left:number;id:string;onNavigate:()=>void}){
 const [view,setView]=useState<View>({item:null,index:null,previous:null,revision:0});
 const panel=useRef<HTMLElement>(null);
 const current=useRef<HTMLDivElement>(null);
 const previous=useRef<HTMLDivElement>(null);
 const pending=useRef<Change|null>(null);
 const animations=useRef<Animation[]>([]);
 const generation=useRef(0);
 const stop=()=>{animations.current.forEach(animation=>animation.cancel());animations.current=[]};
 useLayoutEffect(()=>{
  if(item===view.item&&index===view.index&&!pending.current?.closing)return;
  const node=panel.current;
  const frameStyle=node?getComputedStyle(node):null;
  const computed=current.current?getComputedStyle(current.current):null;
  pending.current={height:Number.parseFloat(frameStyle?.height??"")||node?.getBoundingClientRect().height||0,direction:view.index===null||index===null||index>view.index?1:-1,fromTransform:computed?.transform??"none",fromOpacity:computed?.opacity??"1",opening:!view.item,closing:!item,frameTransform:frameStyle?.transform??"none",frameOpacity:frameStyle?.opacity??"1"};
  generation.current++;stop();
  if(!item){
   if(!view.item)return;
   const token=generation.current;
   if(!node||matchMedia("(prefers-reduced-motion:reduce)").matches){setView({item:null,index:null,previous:null,revision:generation.current});return}
   const animation=node.animate([{opacity:pending.current.frameOpacity,transform:pending.current.frameTransform,height:`${pending.current.height}px`},{opacity:0,transform:"scale(.9)",height:`${pending.current.height}px`}],{duration:100,easing:ease,fill:"forwards"});animations.current=[animation];
   animation.finished.then(()=>{if(token===generation.current){setView({item:null,index:null,previous:null,revision:generation.current})}},()=>{});
  }else setView({item,index,previous:item===view.item?null:view.item,revision:generation.current});
 },[item,index]);
 useLayoutEffect(()=>{
  const change=pending.current;const node=panel.current;
  if(!view.item||!change||change.closing||!node)return;
  const token=generation.current;
  pending.current=null;
  if(matchMedia("(prefers-reduced-motion:reduce)").matches){setView(value=>({...value,previous:null}));return}
  const nextHeight=node.getBoundingClientRect().height;
  if(change.opening)animations.current.push(node.animate([{opacity:0,transform:"scale(.9)"},{opacity:1,transform:"scale(1)"}],{duration:100,easing:ease}));
  else {if(Number(change.frameOpacity)<1)animations.current.push(node.animate([{opacity:change.frameOpacity,transform:change.frameTransform},{opacity:1,transform:"scale(1)"}],{duration:100,easing:ease}));animations.current.push(node.animate([{height:`${change.height}px`},{height:`${nextHeight}px`}],{duration:200,easing:ease}));}
  if(current.current)animations.current.push(current.current.animate([{opacity:0,transform:`translateX(${change.direction*24}px)`},{opacity:1,transform:"translateX(0)"}],{duration:150,easing:ease}));
  if(previous.current)animations.current.push(previous.current.animate([{opacity:change.fromOpacity,transform:change.fromTransform},{opacity:0,transform:`translateX(${-change.direction*24}px)`}],{duration:150,easing:ease,fill:"forwards"}));
  const running=[...animations.current];
  Promise.all(running.map(animation=>animation.finished.catch(()=>{}))).then(()=>{if(token===generation.current){setView(value=>({...value,previous:null}))}});
 },[view.revision]);
 useLayoutEffect(()=>()=>{generation.current++;stop()},[]);
 return <section ref={panel} id={id} hidden={!view.item} inert={!item} aria-hidden={!item} className="marketing-cf-dropdown" data-menu-index={view.index??undefined} style={{left}} aria-label={`${view.item?.label??""}菜单`}>{view.previous?<div ref={previous} className="marketing-cf-menu-exiting" aria-hidden="true" inert><MenuContent item={view.previous} onNavigate={()=>{}}/></div>:null}<div ref={current} className="marketing-cf-menu-current">{view.item?<MenuContent item={view.item} onNavigate={onNavigate}/>:null}</div></section>;
}
