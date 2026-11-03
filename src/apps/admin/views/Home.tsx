import { useQuery } from "@tanstack/react-query";
import { Button, LayerCard } from "@cloudflare/kumo";
import type { ReactNode } from "react";
import { adminOverviewApi } from "../../../shared/api/adminOverview";
import { getApiMessage } from "../../../shared/api/request";
import { PageState } from "../../../shared/components/PageState";
import { TrendChart } from "../../../shared/components/TrendChart";
import { formatDate, formatMoney } from "../../../shared/utils/format";
import { ServerMonitor } from "../components/ServerMonitor";
import { HomeVisitAnalytics } from '../components/HomeVisitAnalytics';
import { AdminHomeLayout } from "../components/AdminHomeLayout";

export function AdminHome({visitAnalytics}: {visitAnalytics?:ReactNode} = {}) {
  const operations = useQuery({ queryKey: ["admin", "operations"], queryFn: adminOverviewApi.operations, staleTime: 60_000, refetchOnWindowFocus: false });
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminOverviewApi.dashboard,
  });
  const data = dashboard.data;
  const metrics = data
    ? [
        { label: "订单总数", value: data.metrics.totalOrders.toLocaleString("zh-CN"), hint: `今日 ${data.metrics.todayOrders} 笔` },
        { label: "今日充值金额", value: formatMoney(data.metrics.todayRechargeCents), hint: `今日真实收款 ${data.metrics.todayPaidRecharges} 笔` },
        { label: "客户总数", value: data.metrics.totalCustomers.toLocaleString("zh-CN"), hint: `本周新增 ${data.metrics.newCustomersThisWeek}` },
        { label: "已开通实例（正常 / 全部）", value: `${data.metrics.runningInstances} / ${data.metrics.totalInstances}`, hint: `开通中、暂停、过期、删除不计入正常 · 待支付订单 ${data.metrics.pendingOrders} · 待处理工单 ${data.metrics.openTickets}` },
      ]
    : [];
  const trend = (data?.revenueTrend ?? []).map((point) => [
    new Date(`${point.date}T00:00:00+08:00`).getTime(),
    point.revenueCents / 100,
  ] as [number, number]);

  return (
    <>
      <PageState loading={dashboard.isLoading} error={dashboard.error ? getApiMessage(dashboard.error) : null}>
        {data ? <AdminHomeLayout metrics={metrics}
          monitor={<ServerMonitor layout="sidebar"/>}
          visitAnalytics={visitAnalytics ?? <HomeVisitAnalytics/>}
          operations={<LayerCard className="grid min-w-0 gap-3 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-kumo-strong">运行观察</h2>
              <Button size="xs" variant="secondary" disabled={operations.isFetching} onClick={() => void operations.refetch()}>刷新运行指标</Button>
            </div>
            <PageState loading={operations.isLoading} error={operations.error ? getApiMessage(operations.error) : null}>
              {operations.data ? <>
                <p className="text-sm text-kumo-subtle">采样时间：{formatDate(operations.data.sampledAt)}。仅按需读取；不可用不代表数值为零。</p>
                <dl className="grid divide-y divide-kumo-line">{operations.data.metrics.map(metric=><div key={metric.key} className="grid gap-1 py-3"><div className="flex items-start justify-between gap-2"><dt className="text-sm text-kumo-subtle">{metric.label}</dt><dd className="text-sm font-medium">{metric.value===null?'不可用':`${metric.value.toLocaleString('zh-CN')} ${metric.unit}`}</dd></div><p className="text-sm text-kumo-subtle">{metric.hint}</p></div>)}</dl>
              </> : null}
            </PageState>
          </LayerCard>}
          revenue={<TrendChart title="近 30 天收入" type="bar" values={trend} compact height={200}/>}
        /> : null}
      </PageState>
    </>
  );
}
