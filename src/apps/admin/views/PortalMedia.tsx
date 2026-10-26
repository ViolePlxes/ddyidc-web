import { Banner, Button, Input, LayerCard } from '@cloudflare/kumo';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPortalMedia, uploadPortalMedia, portalMediaURL, type PortalMediaItem } from '../../../shared/api/portalContent';
import { getApiMessage } from '../../../shared/api/request';

export function PortalMedia({ onSelect }: { onSelect?: (item: PortalMediaItem) => void }) {
  const query = useQuery({ queryKey: ['admin', 'portal-media'], queryFn: getPortalMedia });
  const cache = useQueryClient();
  const picker = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const upload = useMutation({ mutationFn: async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/gif'].includes(file.type) || file.size > 8 * 1024 * 1024 - 4096) throw new Error('请选择小于 8 MB 的 PNG、JPEG 或 GIF 图片');
    return uploadPortalMedia(file);
  }, onSuccess: async () => { setNotice('图片已上传'); await cache.invalidateQueries({ queryKey: ['admin', 'portal-media'] }); } });
  return <div className="grid gap-4"><div className="flex flex-wrap items-end gap-3"><Input label="搜索媒体" value={search} onChange={event => setSearch(event.target.value)} /><Button loading={upload.isPending} disabled={upload.isPending} onClick={() => picker.current?.click()}>上传图片</Button><input ref={picker} type="file" className="sr-only" aria-label="选择媒体图片" accept="image/png,image/jpeg,image/gif" onChange={event => { const file = event.target.files?.[0]; if (file) { setNotice(''); upload.mutate(file); } event.target.value = ''; }} /></div><p className="text-sm text-kumo-subtle">支持 PNG、JPEG、GIF，小于 8 MB，最大 2500 万像素。此处图片会作为网站公开资源。</p>
    {notice && <Banner title={notice} />}{query.error && <Banner variant="error" title="读取媒体失败" description={getApiMessage(query.error)} />}{upload.error && <Banner variant="error" title="上传失败" description={getApiMessage(upload.error)} />}
    {query.isPending ? <p>正在读取图片…</p> : !query.data?.length ? <p className="text-sm text-kumo-subtle">暂无媒体，请先上传图片。</p> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{query.data.filter(item => item.name.toLowerCase().includes(search.toLowerCase())).map(item => <LayerCard key={item.id} className="grid content-start gap-3 px-4 py-3"><img src={portalMediaURL(item.id)} alt={item.name} loading="lazy" className="h-32 w-full object-contain" /><p className="truncate text-sm" title={item.name}>{item.name}</p><div className="flex flex-wrap gap-2">{onSelect && <Button onClick={() => onSelect(item)}>用作封面</Button>}<Button variant="secondary" onClick={() => { void navigator.clipboard.writeText(new URL(portalMediaURL(item.id), window.location.origin).href).then(() => setNotice('图片链接已复制')).catch(() => setNotice('复制失败，请检查浏览器剪贴板权限')); }}>复制链接</Button></div></LayerCard>)}</div>}
  </div>;
}
