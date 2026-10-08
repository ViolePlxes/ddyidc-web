import { useEffect, useRef, useState } from 'react';
import { Button } from '@cloudflare/kumo';
import { ArrowRightIcon, ArrowUpRightIcon, CloudIcon, GlobeHemisphereWestIcon, StackIcon, ReceiptIcon, ShieldCheckIcon, CheckCircleIcon } from '@phosphor-icons/react';
const nodes = [
  { name: '业务应用', caption: '网站与应用', Icon: GlobeHemisphereWestIcon, description: '从网站到业务应用，按实际需求选择运行资源。' },
  { name: '云资源', caption: '计算 · 存储 · 网络', Icon: CloudIcon, description: '选择 CPU、内存与存储配置，为业务提供合适的运行环境。' },
  { name: '统一管理', caption: '资源 · 订单 · 账户', Icon: StackIcon, description: '在一个控制台中查看资源、订单和账户记录。' },
] as const;
const route = 'M125 123H190Q210 123 210 145V203Q210 225 235 225H300V280Q300 300 325 300H460';
export function PortalHero({ onConsole }: { onConsole: () => void }) {
  const [saved, setSaved] = useState(1);
  const [preview, setPreview] = useState<number | null>(null);
  const [playing, setPlaying] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [loop, setLoop] = useState(false);
  const [step, setStep] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [feedback, setFeedback] = useState(false);
  const [pulse, setPulse] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const current = preview ?? saved;
  const node = nodes[current] ?? nodes[1];
  const automatic = playing && !hovered && !focused && visible && !hidden && !reduced;
  const permitted = visible && !hidden && !reduced;
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), { threshold: .15 });
    if (ref.current) observer.observe(ref.current);
    const visibility = () => setHidden(document.hidden);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setReduced(media.matches); if (media.matches) { setPlaying(false); setFeedback(false); } };
    document.addEventListener('visibilitychange', visibility);
    media.addEventListener('change', change);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', change); };
  }, []);
  useEffect(() => {
    if (!automatic) return;
    const timer = setTimeout(() => { if (step === 2 && !loop) setPlaying(false); else setStep(previous => (previous + 1) % 3); }, 3600);
    return () => clearTimeout(timer);
  }, [automatic, step, loop]);
  useEffect(() => {
    if (!feedback || !permitted) return;
    const timer = setTimeout(() => setFeedback(false), 3000);
    return () => clearTimeout(timer);
  }, [feedback, pulse, permitted]);
  const select = (index: number) => {
    setPlaying(false);
    setPreview(null);
    if (index !== saved) { setSaved(index); setPulse(previous => previous + 1); setFeedback(!reduced); }
  };
  return <section ref={ref} className="new-hero" aria-labelledby="hero-title">
    <div className="hero-grid" aria-hidden="true" /><div className="hero-glow" aria-hidden="true" />
    <div className="hero-layout">
      <div className="hero-copy">
        <p className="hero-label"><span />为每一阶段的业务而构建</p>
        <h1 id="hero-title">云资源，<br /><span className="text-kumo-subtle">清晰掌握。</span></h1>
        <p className="hero-description">从一个想法，到一项业务。<br />选择适合的配置，让选购与日常管理<br className="hidden md:block" />在同一个工作空间中有序发生。</p>
        <div className="hero-actions"><Button variant="primary" size="lg" icon={<ArrowRightIcon />} onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' })}>探索云产品</Button><Button variant="secondary" size="lg" icon={<ArrowUpRightIcon />} onClick={() => onConsole()}>进入控制台</Button></div>
        <div className="hero-footnote"><ShieldCheckIcon size={18} />按需选择<span>／</span>统一管理<span>／</span>清晰可控</div>
      </div>
      <div className="infra-art">
        <div className="art-topline"><span>你的云端基础设施 · 示意图</span><Button variant="ghost" size="sm" aria-pressed={playing} onClick={() => { setFeedback(false); if (playing) setPlaying(false); else { setLoop(true); setStep(0); setPlaying(true); } }}>{playing ? '暂停演示' : '播放演示'}</Button></div>
        <div className="diagram" role="group" aria-label="技术关系图，选择节点查看说明" onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPreview(null); }} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) { setFocused(false); setPreview(null); } }}>
          <svg className="diagram-lines" viewBox="0 0 600 440" preserveAspectRatio="none" aria-hidden="true">
            <ellipse cx="300" cy="232" rx="250" ry="150" className="orbit" /><ellipse cx="300" cy="232" rx="195" ry="115" className="orbit" />
            <path d={route} className="connection" />
            <path d="M300 225V125Q300 102 325 102H455M300 225H395Q420 225 420 250V345H475M300 225H140Q120 225 120 250V335" className="connection muted" />
            <circle cx="300" cy="225" r="62" className="core-ring" /><circle cx="300" cy="225" r="79" className="core-ring outer" />
            <path d={current === 0 ? 'M125 123H190Q210 123 210 145V203Q210 225 235 225H300' : current === 2 ? 'M300 225V280Q300 300 325 300H460' : route} className="selected-connection" />
            {!reduced && (playing || feedback) && <path data-transfer-cycle={feedback ? `click-${pulse}` : `demo-${step}`} key={feedback ? `click-${pulse}` : `demo-${step}`} d={route} pathLength="1" className="transfer" style={{ animationPlayState: (feedback ? permitted : automatic) ? 'running' : 'paused' }} />}
          </svg>
          <div className="coordinate top-coordinate">业务应用 → 云资源 → 统一管理</div>
          {nodes.map(({ name, caption, Icon }, index) => <div className={`infra-node node-${index} ${saved === index ? 'node-saved' : ''} ${preview === index ? 'node-preview' : ''}`} key={name}>
            <div className="node-art-frame"><Button variant={saved === index ? 'secondary' : 'ghost'} aria-label={`选择${name}`} aria-pressed={saved === index} onPointerEnter={() => setPreview(index)} onPointerLeave={() => setPreview(null)} onFocus={() => setPreview(index)} onBlur={() => setPreview(null)} onClick={() => select(index)} icon={<Icon size={24} weight="duotone" />}>{name}</Button></div>
            <span className="node-caption">{caption}</span>
            <span className="node-state">{saved === index ? <><CheckCircleIcon size={12} />已选择</> : preview === index ? '预览中' : '点击选择'}</span>
          </div>)}
          <div className="satellite satellite-one"><ReceiptIcon size={17} />订单记录</div><div className="satellite satellite-two"><ShieldCheckIcon size={17} />账户记录</div><div className="satellite satellite-three">CPU / RAM / SSD</div>
          <span className="coord coord-left">01 / 连接</span><span className="coord coord-right">03 / 管理</span>
        </div>
        <div className="art-description" role="status" aria-live="polite" aria-atomic="true"><span className="art-number">0{current + 1}</span><div className="description-transition" key={current}><strong>{node.name} · {preview !== null && preview !== saved ? '临时预览' : '已保存选择'}</strong><p>{node.description}</p></div></div>
        <p className="demo-status">{reduced ? '已减少动态：静态图仍可选择' : feedback ? '传输反馈 · 播放一次' : playing ? automatic ? '自动演示 · 业务应用 → 云资源 → 管理' : '演示已暂缓' : '演示已停止 · 点击播放可循环'}{playing && !loop && !reduced ? '（首次一轮）' : ''}</p>
      </div>
    </div>
    <div className="hero-bottom"><span>计算资源</span><span>产品配置</span><span>订单管理</span><span>统一控制台</span></div>
  </section>;
}
