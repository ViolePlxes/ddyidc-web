import {useEffect,useRef,useState,type CSSProperties,type MouseEvent} from 'react';
import {ArrowUpRightIcon,CloudIcon,StackIcon,ShieldCheckIcon,UsersThreeIcon,PauseIcon,PlayIcon} from '@phosphor-icons/react';
import heroVideo from './hero-reference.mp4?url';
import heroPoster from './hero-reference-poster.png?url';
import './aliyun-hero.css';

/** Homepage hero only; source dimensions follow Aliyun banner 0.1.11. */
export function AliyunHero({productsHref,consoleHref}:{productsHref:string;consoleHref:string}){
 const video=useRef<HTMLVideoElement>(null);const [paused,setPaused]=useState(false);
 const base=consoleHref.replace(/\/console\/?$/,'');
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion:reduce)');const apply=()=>{setPaused(media.matches);if(media.matches)video.current?.pause();else void video.current?.play().catch(()=>{})};apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply)},[]);
 const move=(event:MouseEvent<HTMLAnchorElement>)=>{const rect=event.currentTarget.getBoundingClientRect();event.currentTarget.style.setProperty('--mouse-x',`${event.clientX-rect.left}px`);event.currentTarget.style.setProperty('--mouse-y',`${event.clientY-rect.top}px`)};
 const entries=[{title:'云服务器',description:'选择适合网站、应用和开发环境的计算资源，在控制台集中管理。',href:productsHref,icon:CloudIcon},{title:'云服务拼团',description:'查看活动产品与成团规则，选择适合当前业务的配置和周期。',href:`${base}/groupbuy`,icon:UsersThreeIcon},{title:'统一控制台',description:'集中查看实例状态、订单进度及服务周期，让资源管理更清晰。',href:consoleHref,icon:StackIcon},{title:'账户安全',description:'管理登录安全、实名认证和相关记录，关注账户的每一次变化。',href:`${base}/console/security`,icon:ShieldCheckIcon}];
 return <section className="ali-source-hero" aria-label="首页推荐">
  <div className="ali-source-hero-media" aria-hidden="true"><video ref={video} src={heroVideo} poster={heroPoster} autoPlay muted loop playsInline preload="metadata"/><div className="ali-source-hero-edge left"/><div className="ali-source-hero-edge right"/></div>
  <div className="ali-source-hero-width ali-source-hero-copy"><h1>DDOIDC 云计算，<strong>按需选配</strong></h1><p>云服务器、域名与内容分发，一站式选择与管理。为网站、应用和开发环境选择合适的云资源，在统一控制台查看实例、订单与账户记录。</p><div className="ali-source-hero-actions"><a className="ali-source-hero-primary" href={productsHref}>探索云产品<ArrowUpRightIcon size={16}/></a><a className="ali-source-hero-secondary" href={`${base}/console/tickets/create`} onMouseMove={move} style={{'--mouse-x':'-100px','--mouse-y':'-100px'} as CSSProperties}>在线咨询</a></div></div>
  <div className="ali-source-hero-populars"><div className="ali-source-hero-width ali-source-hero-entries">{entries.map(({title,description,href,icon:EntryIcon})=><a href={href} key={title}><EntryIcon size={32} weight="regular" aria-hidden="true"/><div><h3>{title}</h3><p>{description}</p></div></a>)}</div></div>
  <button type="button" className="ali-source-hero-motion" aria-label={paused?'播放背景动画':'暂停背景动画'} onClick={()=>{if(paused)void video.current?.play().then(()=>setPaused(false)).catch(()=>{});else {video.current?.pause();setPaused(true)}}}>{paused?<PlayIcon size={16}/>:<PauseIcon size={16}/>}</button>
 </section>;
}

