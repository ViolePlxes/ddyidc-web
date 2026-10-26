import { Button, Input } from '@cloudflare/kumo';
import type { PortalLink } from '../../../shared/api/portalContent';

export function PortalLinks({ value, change, depth = 0 }: { value: PortalLink[] | null; change: (value: PortalLink[]) => void; depth?: number }) {
  const links = value ?? [];
  const update = (index: number, value: PortalLink) => change(links.map((item, i) => i === index ? value : item));
  return <div className="grid gap-4">{links.map((item, index) => <div key={index} className="grid gap-3 border-l border-kumo-line pl-4"><div className="flex flex-wrap items-end gap-3"><Input label="链接名称" value={item.label} maxLength={100} onChange={event => update(index, { ...item, label: event.target.value })} /><Input label="链接地址" value={item.href} onChange={event => update(index, { ...item, href: event.target.value })} /><Button onClick={() => change(links.filter((_, i) => i !== index))}>移除草稿链接{item.children?.length ? '及子项' : ''}</Button></div>{depth < 2 && <PortalLinks depth={depth + 1} value={item.children} change={children => update(index, { ...item, children })} />}</div>)}<Button disabled={links.length >= 100} onClick={() => change([...links, { label: depth ? '新子菜单' : '新链接', href: '/', children: [] }])}>{depth ? '添加子菜单' : '添加链接'}</Button></div>;
}
