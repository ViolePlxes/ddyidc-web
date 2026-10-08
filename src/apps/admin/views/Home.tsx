import { useQuery } from "@tanstack/react-query";
import { Button } from "@cloudflare/kumo";
import { adminOverviewApi, type AdminOrderRow } from "../../../shared/api/adminOverview";
import { getApiMessage } from "../../../shared/api/request";
import { DataTable } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { TrendChart } from "../../../shared/components/TrendChart";
import { formatDate, formatMoney, orderStatusCode } from "../../../shared/utils/format";
import { ServerMonitor } from "../components/ServerMonitor";

function toOrderRow(order: AdminOrderRow) {
  return {
    id: order.id,
    primary: `${order.username || "未知客户"} · ${order.productName || "未命名商品"}`,
    secondary: order.orderNo,
    meta: `创建于 ${formatDate(order.createdAt)}`,
    amount: formatMoney(order.payAmount),
    status: orderStatusCode(order.status),
  };
}

export function AdminHome() {
  const operations = useQuery({ queryKey: ["admin", "operations"], queryFn: adminOverviewApi.operations, staleTime: 60_000, refetchOnWindowFocus: false });
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminOverviewApi.dashboard,
  });
  const data = dashboard.data;
  const metrics = data
    ? [
        { label: "订单总数", value: data.metrics.totalOrders.toLocaleString("zh-CN"), hint: `今日 ${data.metrics.todayOrders} 笔` },
        { label: "今日充值金额", value: formatMoney(data.metrics.todayRechargeCents), hint: `今日成功充值 ${data.metrics.todayPaidRecharges} 笔` },
        { label: "客户总数", value: data.metrics.totalCustomers.toLocaleString("zh-CN"), hint: `本周新增 ${data.metrics.newCustomersThisWeek}` },
        { label: "运行实例", value: `${data.metrics.runningInstances} / ${data.metrics.totalInstances}`, hint: `待支付订单 ${data.metrics.pendingOrders} · 待处理工单 ${data.metrics.openTickets}` },
      ]
    : [];
  const trend = (data?.revenueTrend ?? []).map((point) => [
    new Date(`${point.date}T00:00:00+08:00`).getTime(),
    point.revenueCents / 100,
  ] as [number, number]);

  return (
    <>
      <PageHeader
        title="管理后台"
        description="查看全站经营指标和待处理事项。"
      />
      <PageState loading={dashboard.isLoading} error={dashboard.error ? getApiMessage(dashboard.error) : null}>
        {data ? <div className="grid gap-6">
          <MetricGrid metrics={metrics} />
          <ServerMonitor />
          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-kumo-strong">运行观察</h2>
              <Button variant="secondary" disabled={operations.isFetching} onClick={() => void operations.refetch()}>刷新运行指标</Button>
            </div>
            <PageState loading={operations.isLoading} error={operations.error ? getApiMessage(operations.error) : null}>
              {operations.data ? <>
                <p className="text-sm text-kumo-subtle">采样时间：{formatDate(operations.data.sampledAt)}。仅按需读取；不可用不代表数值为零。</p>
                <MetricGrid metrics={operations.data.metrics.map((metric) => ({ label: metric.label, value: metric.value === null ? "不可用" : `${metric.value.toLocaleString("zh-CN")} ${metric.unit}`, hint: metric.hint }))} />
              </> : null}
            </PageState>
          </section>
          <TrendChart title="近 30 天收入" type="bar" values={trend} />
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold text-kumo-strong">最近订单</h2>
            <DataTable rows={(data.recentOrders ?? []).map(toOrderRow)} primaryLabel="客户 / 商品" secondaryLabel="订单号" showActions={false} />
          </section>
        </div> : null}
      </PageState>
    </>
  );
}
