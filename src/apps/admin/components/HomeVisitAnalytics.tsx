import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banner, Button, Empty, LayerCard, Loader, Select, SkeletonLine, type MapGeoJson, type SankeyLinkData, type SankeyNodeData } from '@cloudflare/kumo';
import world from '../../../shared/assets/world-110m.geo.json';
import { getApiMessage } from '../../../shared/api/request';
import { visitAnalyticsApi, visitRangeDates, type VisitClientKind, type VisitFlowRow, type VisitIdentity, type VisitRangeKey } from '../../../shared/api/visitAnalytics';
import { VisitTrafficPanel, type ClientRankingRow, type StatusRankingRow } from '../../../shared/components/visit-analytics/VisitTrafficPanel';
import { VisitGeographyPanel, type VisitRegion } from '../../../shared/components/visit-analytics/VisitGeographyPanel';
import { countryMapName } from '../../../shared/components/visit-analytics/countryNames';

const ranges: Record<VisitRangeKey, string> = { today: '今天', '7d': '近 7 天', '30d': '近 30 天' };
const identities: Record<VisitIdentity, string> = { all: '全部身份', customer: '客户', admin: '管理员', guest: '游客' };
const clientKinds: Record<VisitClientKind, string> = { all: '全部客户端', browser: '浏览器', bot: '爬虫', api: '接口调用' };
const identityLabels: Record<string, string> = { guest: '游客', customer: '客户', admin: '管理员' };
const stageOrder = ['source', 'client', 'page', 'identity'] as const;
type Stage = (typeof stageOrder)[number];
const stageFallback: Record<Stage, string> = { source: '其他来源', client: '其他客户端', page: '其他页面', identity: '其他身份' };
const stageLimit: Record<Stage, number> = { source: 8, client: 6, page: 10, identity: 4 };

function stageValue(row: VisitFlowRow, stage: Stage): string {
  if (stage === 'identity') return identityLabels[row.identity] ?? row.identity;
  return row[stage];
}

interface FlowFocus { stage: Stage; label: string }

/** Builds the four-stage flow from the joint rows; per-node totals stay conserved. */
function buildFlow(rows: VisitFlowRow[], identity: VisitIdentity, clientKind: VisitClientKind, focus: FlowFocus | null): { nodes: SankeyNodeData[]; links: SankeyLinkData[] } {
  const scoped = rows.filter(row =>
    (identity === 'all' || row.identity === identity) &&
    (clientKind === 'all' || row.clientKind === clientKind) &&
    (!focus || stageValue(row, focus.stage) === focus.label));
  if (!scoped.length) return { nodes: [], links: [] };
  const totals = new Map<Stage, Map<string, number>>(stageOrder.map(stage => [stage, new Map<string, number>()]));
  for (const row of scoped) {
    for (const stage of stageOrder) {
      const value = stageValue(row, stage);
      const bucket = totals.get(stage)!;
      bucket.set(value, (bucket.get(value) ?? 0) + row.requests);
    }
  }
  const keep = new Map<Stage, Set<string>>(stageOrder.map(stage => {
    const ranked = [...totals.get(stage)!.entries()].sort((left, right) => right[1] - left[1]).slice(0, stageLimit[stage]);
    return [stage, new Set(ranked.map(([label]) => label))];
  }));
  const label = (stage: Stage, value: string) => (value && keep.get(stage)!.has(value) ? value : stageFallback[stage]);
  const joints = new Map<string, { values: Record<Stage, string>; requests: number }>();
  for (const row of scoped) {
    const values = {
      source: label('source', stageValue(row, 'source')),
      client: label('client', stageValue(row, 'client')),
      page: label('page', stageValue(row, 'page')),
      identity: label('identity', stageValue(row, 'identity')),
    } as Record<Stage, string>;
    const key = [values.source, values.client, values.page, values.identity].join('\u0001');
    const existing = joints.get(key);
    if (existing) existing.requests += row.requests;
    else joints.set(key, { values, requests: row.requests });
  }
  const linkTotals = new Map<string, { from: Stage; to: Stage; source: string; target: string; value: number }>();
  const addLink = (from: Stage, to: Stage, source: string, target: string, value: number) => {
    const key = [from, source, to, target].join('\u0001');
    const existing = linkTotals.get(key);
    if (existing) existing.value += value;
    else linkTotals.set(key, { from, to, source, target, value });
  };
  for (const joint of joints.values()) {
    addLink('source', 'client', joint.values.source, joint.values.client, joint.requests);
    addLink('client', 'page', joint.values.client, joint.values.page, joint.requests);
    addLink('page', 'identity', joint.values.page, joint.values.identity, joint.requests);
  }
  const nodes: SankeyNodeData[] = [];
  const index = new Map<string, number>();
  const nodeFor = (stage: Stage, name: string) => {
    const key = `${stage}\u0001${name}`;
    const existing = index.get(key);
    if (existing !== undefined) return existing;
    nodes.push({ id: key, name, value: totals.get(stage)!.get(name) ?? 0 });
    index.set(key, nodes.length - 1);
    return nodes.length - 1;
  };
  const links: SankeyLinkData[] = [];
  for (const link of linkTotals.values()) {
    if (link.value <= 0) continue;
    links.push({ id: `${link.from}\u0001${link.source}\u0001${link.to}\u0001${link.target}`, source: nodeFor(link.from, link.source), target: nodeFor(link.to, link.target), value: link.value });
  }
  return { nodes, links };
}

export function HomeVisitAnalytics() {
  const [range, setRange] = useState<VisitRangeKey>('7d');
  const [identity, setIdentity] = useState<VisitIdentity>('all');
  const [clientKind, setClientKind] = useState<VisitClientKind>('all');
  const [mode, setMode] = useState('requests');
  const [focus, setFocus] = useState<FlowFocus | null>(null);
  const window = useMemo(() => visitRangeDates(range), [range]);

  const overview = useQuery({ queryKey: ['admin', 'visit-analytics', 'overview', window, identity, clientKind], queryFn: ({ signal }) => visitAnalyticsApi.overview(window, identity, clientKind, signal), staleTime: 30_000 });
  const flow = useQuery({ queryKey: ['admin', 'visit-analytics', 'flow', window], queryFn: ({ signal }) => visitAnalyticsApi.flow(window, signal), staleTime: 30_000 });
  const geography = useQuery({ queryKey: ['admin', 'visit-analytics', 'geography', window], queryFn: ({ signal }) => visitAnalyticsApi.geography(window, signal), staleTime: 30_000 });
  const clients = useQuery({ queryKey: ['admin', 'visit-analytics', 'clients', window], queryFn: ({ signal }) => visitAnalyticsApi.clients(window, signal), staleTime: 30_000 });
  const status = useQuery({ queryKey: ['admin', 'visit-analytics', 'status', window], queryFn: ({ signal }) => visitAnalyticsApi.status(window, signal), staleTime: 30_000 });
  const queries = [overview, flow, geography, clients, status];

  const failed = queries.find(query => query.error);
  const loading = queries.some(query => query.isLoading);
  const fetching = queries.some(query => query.isFetching);
  const retry = () => queries.forEach(query => { void query.refetch(); });
  const total = overview.data?.requests ?? 0;
  const empty = !loading && !failed && overview.data !== undefined && total === 0;

  const chartRows = useMemo(() => {
    const rows = flow.data ?? [];
    if (mode === 'bots') return rows.filter(row => row.clientKind === 'bot');
    if (mode === 'clients') return rows.filter(row => row.clientKind !== 'bot');
    return rows;
  }, [flow.data, mode]);
  const chart = useMemo(() => buildFlow(chartRows, identity, clientKind, focus), [chartRows, identity, clientKind, focus]);

  const clientRanking: ClientRankingRow[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of clients.data ?? []) {
      const parts = [row.browser, row.os, row.device].filter(part => part && part !== '未知' && part !== 'unknown');
      const label = parts.join(' · ') + (row.isBot ? ' · 爬虫' : '');
      counts.set(label, (counts.get(label) ?? 0) + row.requests);
    }
    return [...counts.entries()].map(([client, count]) => ({ client, count })).sort((left, right) => right.count - left.count).slice(0, 10);
  }, [clients.data]);

  const statusRanking: StatusRankingRow[] = useMemo(() => (status.data ?? []).slice(0, 10).map(row => ({ status: row.status, count: row.requests })), [status.data]);

  const regions: VisitRegion[] = useMemo(() => {
    const merged = new Map<string, VisitRegion>();
    for (const row of geography.data ?? []) {
      const country = countryMapName(row.country) || row.country;
      const label = row.region && row.region !== row.country ? `${row.country} · ${row.region}` : row.country;
      const existing = merged.get(country);
      if (existing) existing.count += row.requests;
      else merged.set(country, { country, label, count: row.requests });
    }
    return [...merged.values()].sort((left, right) => right.count - left.count).slice(0, 60);
  }, [geography.data]);

  const geoMissing = overview.data?.collection?.geo?.loaded === false;
  const onNodeClick = (node: SankeyNodeData) => {
    const [stage, label] = String(node.id ?? '').split('\u0001');
    if (!stageOrder.includes(stage as Stage) || !label) return;
    setFocus({ stage: stage as Stage, label });
  };

  return <section className="grid min-w-0 gap-3" aria-label="访问分析">
    <LayerCard className="grid min-w-0 gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="访问时间范围">
          <h2 className="text-sm font-semibold text-kumo-strong">访问分析</h2>
          {(Object.keys(ranges) as VisitRangeKey[]).map(key => <Button key={key} size="xs" variant={range === key ? 'secondary' : 'ghost'} onClick={() => { setRange(key); setFocus(null); }}>{ranges[key]}</Button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-32"><Select size="sm" label="访问身份" value={identity} onValueChange={value => { setIdentity((value as VisitIdentity) ?? 'all'); setFocus(null); }} items={identities} /></div>
          <div className="w-32"><Select size="sm" label="客户端类型" value={clientKind} onValueChange={value => { setClientKind((value as VisitClientKind) ?? 'all'); setFocus(null); }} items={clientKinds} /></div>
          <Button size="xs" variant="secondary" disabled={fetching} onClick={retry}>{fetching ? '刷新中…' : '刷新'}</Button>
        </div>
      </div>
      <p className="text-sm text-kumo-subtle">{window.from} 至 {window.to} · 请求数 <strong className="font-medium text-kumo-default">{overview.data ? total.toLocaleString('zh-CN') : '—'}</strong>{overview.data ? ` · 访客数 ${overview.data.visitors.toLocaleString('zh-CN')}（按日去重）` : ''}{overview.data ? ` · 5xx ${overview.data.errors.toLocaleString('zh-CN')}` : ''}{focus ? ` · 已筛选：${focus.label}` : ''}</p>
    </LayerCard>
    {failed ? <Banner variant="error" title="访问统计加载失败" description={getApiMessage(failed.error)} action={<Button variant="secondary" onClick={retry}>重试</Button>} /> : null}
    {loading ? <LayerCard className="grid gap-3 px-4 py-6"><div role="status" className="flex items-center gap-2 text-sm text-kumo-subtle"><Loader /><span>正在加载访问数据…</span></div><SkeletonLine /><SkeletonLine /><SkeletonLine /></LayerCard> : null}
    {empty ? <LayerCard className="px-4 py-8"><Empty title="当前时间范围暂无访问数据" description="访问数据按批次入库，通常在两秒内可见；如刚启用采集，请稍后刷新。" /></LayerCard> : null}
    {!loading && !failed && !empty ? <>
      <VisitTrafficPanel
        nodes={chart.nodes}
        links={chart.links}
        clientRanking={clientRanking}
        statusRanking={statusRanking}
        stages={['访问来源', '客户端', '访问页面', '访问身份']}
        mode={mode}
        onModeChange={setMode}
        onNodeClick={onNodeClick}
        onReset={() => setFocus(null)}
        filtered={focus !== null}
        total={total}
        geography={<VisitGeographyPanel geoJson={world as MapGeoJson} regions={regions} selected={null} onSelect={() => undefined} onReset={() => undefined} />}
      />
      {geoMissing ? <p className="text-sm text-kumo-subtle">未加载离线地域库（GeoIP 文件），地域统计显示为未知。可在配置 VisitAnalytics.GeoIPFile 后重启生效。</p> : null}
    </> : null}
  </section>;
}
