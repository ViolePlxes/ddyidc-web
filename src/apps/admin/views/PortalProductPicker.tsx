import { Banner, Button, Checkbox, Input } from '@cloudflare/kumo';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getPortalProducts, type PortalModule } from '../../../shared/api/portalContent';
import { getApiMessage } from '../../../shared/api/request';
import { selectedProductIDs } from '../../../shared/utils/contentScopes';

export function PortalProductPicker({ module, change }: { module: PortalModule; change: (value: PortalModule) => void }) {
  const query = useQuery({ queryKey: ['admin', 'portal-catalog'], queryFn: getPortalProducts });
  const [search, setSearch] = useState('');
  const ids = selectedProductIDs(module.productIds);
  const rows = (query.data ?? []).filter(item => `${item.name} ${item.id} ${item.group}`.toLowerCase().includes(search.toLowerCase()));
  const missing = ids.filter(id => query.data && !query.data.some(item => item.id === id));
  return <div className="grid gap-3"><Input label="展示产品数量（0 使用默认6，最多100）" type="number" min={0} max={100} value={typeof module.limit === 'number' ? module.limit : 6} onChange={e => change({ ...module, limit: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} /><Input label="搜索公开产品" value={search} onChange={e => setSearch(e.target.value)} /><p className="text-sm text-kumo-subtle">已指定 {ids.length} 个产品；未指定时使用当前公开目录。产品价格和是否可售仍以商品配置为准。</p>{query.error && <Banner variant="error" title="读取产品失败" description={getApiMessage(query.error)} />}{query.isPending && <p role="status">正在读取产品…</p>}<div className="grid max-h-72 gap-3 overflow-y-auto">{rows.slice(0, 100).map(item => <Checkbox key={item.id} label={`${item.name} · ${item.group || '未分组'} · ¥${item.price}`} checked={ids.includes(item.id)} disabled={!ids.includes(item.id) && ids.length >= 100} onCheckedChange={checked => change({ ...module, productIds: checked ? [...ids, item.id] : ids.filter(id => id !== item.id) })} />)}</div>{rows.length > 100 && <p className="text-sm text-kumo-subtle">仅显示前100条，请搜索缩小范围。</p>}{query.data && rows.length === 0 && <p>没有匹配的公开产品。</p>}{missing.length > 0 && <Banner title="部分已选产品不在当前公开目录" description="保留原选择，未公开产品不会因此重新上架。" />}<Button variant="secondary" disabled={!ids.length} onClick={() => change({ ...module, productIds: [] })}>恢复使用公开目录</Button></div>;
}
