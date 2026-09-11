import { useQuery } from "@tanstack/react-query";
import { adminOverviewApi, type AdminOrderRow } from "../../../shared/api/adminOverview";
import { getApiMessage } from "../../../shared/api/request";
import { DataTable } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { TrendChart } from "../../../shared/components/TrendChart";
import { formatDate, formatMoney, orderStatusCode } from "../../../shared/utils/format";

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
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminOverviewApi.dashboard,
  });
  const data = dashboard.data;
  const metrics = data
    ? [
        { label: "订单总数", value: data.metrics.totalOrders.toLocaleString("zh-CN"), hint: `今日 ${data.metrics.todayOrders} 笔` },
        { label: "今日销售额", value: formatMoney(data.metrics.todayRevenueCents), hint: `今日已支付 ${data.metrics.todayPaidOrders} 笔` },
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
      <PageState loading={dashboard.isLoading} skeleton="dashboard" error={dashboard.error ? getApiMessage(dashboard.error) : null}>
        {data ? <div className="grid gap-6">
          <MetricGrid metrics={metrics} />
          <TrendChart title="近 30 天收入" type="bar" values={trend} />
          <section className="grid gap-3">
            <h2 className="text-lg font-semibold text-kumo-strong">最近订单</h2>
            <DataTable rows={data.recentOrders.map(toOrderRow)} primaryLabel="客户 / 商品" secondaryLabel="订单号" showActions={false} />
          </section>
        </div> : null}
      </PageState>
    </>
  );
}
