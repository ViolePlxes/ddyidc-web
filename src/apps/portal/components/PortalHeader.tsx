import { useEffect, useRef, useState } from 'react';
import { Button, Link, LinkButton } from '@cloudflare/kumo';
import { ArrowUpRightIcon, CloudIcon, ListIcon, XIcon } from '@phosphor-icons/react';
const defaultContainer = 'mx-auto w-full max-w-6xl px-5 md:px-8';
const sections = [{ label: '云产品', href: '#products' }, { label: '管理体验', href: '#management' }, { label: '服务说明', href: '#service' }];
export function PortalHeader({loginHref,consoleHref,homeHref='/',containerClassName=defaultContainer,extraLinks=[]}:{loginHref:string;consoleHref:string;homeHref?:string;containerClassName?:string;extraLinks?:{label:string;href:string}[]}) {
 const container=containerClassName; const navigation=[...sections.map(section=>({...section,href:homeHref+section.href})),...extraLinks];
  const sentinel = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLAnchorElement>(null);
  const login = useRef<HTMLDivElement>(null);
  const consoleAction = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const [compact, setCompact] = useState(false);
  const [menu, setMenu] = useState(false);
  const [tone, setTone] = useState({ logo: false, login: false, console: false });
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setCompact(entry ? !entry.isIntersecting : false));
    if (sentinel.current) observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setMenu(false); }, [compact]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const areas = Array.from(document.querySelectorAll<HTMLElement>('[data-header-tone="inverse"]'));
      const overlaps = (element: HTMLElement | null) => {
        if (!element) return false;
        const anchor = element.getBoundingClientRect();
        const x = anchor.left + anchor.width / 2, y = anchor.top + anchor.height / 2;
        return areas.some(area => { const rect = area.getBoundingClientRect(); return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom; });
      };
      setTone({ logo: overlaps(logo.current), login: overlaps(login.current), console: overlaps(consoleAction.current) });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => { resize.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);
  return <>
    <div ref={sentinel} className="h-20" aria-hidden="true" />
    <header data-portal-header={compact ? 'compact' : 'full'} className={`pointer-events-none fixed! inset-x-0 top-0 z-40 ${compact && !menu ? 'bg-transparent!' : 'border-b border-kumo-hairline bg-kumo-base'}`} onKeyDown={event => { if (event.key === 'Escape' && menu) { setMenu(false); menuButton.current?.focus(); } }}>
      <div className={`${container} grid h-20 grid-cols-[1fr_auto] items-center gap-2 lg:grid-cols-[1fr_auto_1fr]`}>
        <Link ref={logo} href={homeHref} variant="plain" aria-label="多多云首页" className="pointer-events-auto flex w-fit items-center gap-2 text-base font-semibold text-kumo-strong">
          <CloudIcon size={32} weight="fill" aria-hidden="true" className={compact && !menu && tone.logo ? 'text-kumo-inverse' : 'text-kumo-brand'} />
          {!compact && <span className="hidden sm:inline">多多云</span>}
        </Link>
        <nav aria-label="主导航" className={`pointer-events-auto items-center gap-8 ${compact ? 'hidden' : 'hidden lg:flex'}`}>{navigation.map(section => <Link key={section.href} href={section.href} variant="plain">{section.label}</Link>)}</nav>
        <div className="pointer-events-auto flex items-center justify-end gap-2 lg:col-start-3">
          <div ref={login}><LinkButton href={loginHref} variant={compact && tone.login ? 'secondary' : compact ? 'ghost' : 'secondary'} >登录</LinkButton></div>
          <div ref={consoleAction}><LinkButton href={consoleHref} aria-label="进入控制台" variant={compact && tone.console ? 'secondary' : 'primary'} icon={<ArrowUpRightIcon />}><span className="hidden sm:inline">进入</span>控制台</LinkButton></div>
          <Button ref={menuButton} className="lg:hidden" variant="secondary" shape="square" aria-label="展开导航" aria-expanded={menu} aria-controls="portal-mobile-navigation" onClick={() => setMenu(previous => !previous)} icon={menu ? <XIcon /> : <ListIcon />} />
        </div>
      </div>
      {menu && <nav id="portal-mobile-navigation" aria-label="手机导航" className={`${container} pointer-events-auto grid gap-4 border-t border-kumo-hairline py-5 lg:hidden`}>{navigation.map(section => <Link key={section.href} href={section.href} variant="plain" onClick={() => setMenu(false)}>{section.label}</Link>)}</nav>}
    </header>
  </>;
}
