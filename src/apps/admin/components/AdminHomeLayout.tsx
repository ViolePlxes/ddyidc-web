import './adminHomeLayout.css';
import type {ReactNode} from 'react';
import {LayerCard} from '@cloudflare/kumo';
import type {Metric} from '../../../shared/components/MetricGrid';

/** Presentation only: the owning page keeps all queries, actions and metric semantics. */
export function AdminHomeLayout({metrics,monitor,revenue,operations,visitAnalytics}:{metrics:Metric[];monitor:ReactNode;revenue:ReactNode;operations:ReactNode;visitAnalytics?:ReactNode}){
 return <div className="grid min-w-0 gap-3" data-admin-home-layout="firewall">
  <section aria-label="经营指标" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(metric=><LayerCard key={metric.label} className="grid content-start gap-2 px-4 py-3"><span className="border-l-2 border-kumo-brand pl-2 text-sm text-kumo-subtle">{metric.label}</span><strong className="text-2xl font-semibold text-kumo-strong">{metric.value}</strong><span className="text-sm text-kumo-subtle">{metric.hint}</span></LayerCard>)}</section>
  <div className="grid min-w-0 items-start gap-3 xl:grid-cols-[230px_minmax(0,1fr)]">
   <aside className="grid min-w-0 gap-3" aria-label="服务器监控与运行观察">{monitor}{operations}</aside>
   <div className="grid min-w-0 gap-3">{visitAnalytics}{revenue}</div>
  </div>
 </div>;
}
