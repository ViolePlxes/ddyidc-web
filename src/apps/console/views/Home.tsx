import { Banner, LayerCard, Table } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { CubeIcon } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { consoleApi } from "../../../shared/api/console";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { TrendChart } from "../../../shared/components/TrendChart";
import { formatMoney, orderStatusCode } from "../../../shared/utils/format";

export function ConsoleHome() {
  const orders = useQuery({ queryKey: ["orders", "overview"], queryFn: () => consoleApi.orders(undefined, 1, 20) });
  const coupons = useQuery({ queryKey: ["coupons", "overview"], queryFn: () => consoleApi.coupons(0, 1, 1) });
  const instances = useQuery({ queryKey: ["instances", "overview"], queryFn: consoleApi.instances, retry: false });
  const notifications = useQuery({ queryKey: ["notifications", "overview"], queryFn: consoleApi.notifications, retry: false });
  const loading = orders.isLoading || coupons.isLoading || instances.isLoading || notifications.isLoading;
  const list = orders.data?.list ?? [];
  const pending = list.filter((order) => order.status === 1);
  const paidTrend = Object.entries(
    list.filter((order) => order.status === 2).reduce<Record<string, number>>((result, order) => {
      const day = order.createdAt.slice(0, 10);
      result[day] = (result[day] ?? 0) + order.payAmount / 100;
      return result;
    }, {}),
  ).map(([day, amount]) => [new Date(`${day}T00:00:00`).getTime(), amount] as [number, number]);
  const metrics = [
    { label: "我的实例", value: instances.error ? "加载失败" : String(instances.data?.length ?? 0), hint: instances.error ? "实例接口暂时不可用" : "实时实例总数" },
    { label: "待支付订单", value: String(pending.length), hint: `合计 ${formatMoney(pending.reduce((sum, order) => sum + order.payAmount, 0))}` },
    { label: "可用优惠券", value: String(coupons.data?.total ?? 0), hint: "实时可用券数量" },
    { label: "未读通知", value: notifications.error ? "未开放" : String(notifications.data?.length ?? 0), hint: notifications.error ? "通知接口返回 404" : "实时通知数量" },
  ];

  return (
    <>
      <PageHeader title="控制台总览" description="查看账户订单、优惠券与资源接口状态。" />
      <PageState loading={loading} skeleton="dashboard">
      <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-animate-list>
        {metrics.map((metric) => (
          <LayerCard key={metric.label} className="grid min-h-36 gap-3 p-5">
            <span className="text-sm text-kumo-sub-subtle">{metric.label}</span>
            <strong className="text-3xl font-semibold text-kumo-strong">{metric.value}</strong>
            <span className="text-sm text-kumo-subtle">{metric.hint}</span>
          </LayerCard>
        ))}
      </section>
      {instances.error || notifications.error ? (
        <Banner variant="alert" title="部分基础资源暂不可用" description="通知接口暂时不可用；实例数据仍来自真实接口，页面未以静态记录补齐。" />
      ) : null}
      {paidTrend.length ? <TrendChart title="消费趋势（由订单列表聚合）" values={paidTrend} /> : null}
      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-kumo-strong">最近订单</h2>
          <Link to="/console/orders" viewTransition className="text-sm text-kumo-link hover:underline">查看全部</Link>
        </div>
        <PageState loading={orders.isLoading} empty={!orders.isLoading && !orders.error && list.length === 0} error={orders.error ? "订单数据加载失败" : null} emptyTitle="暂无订单">
          <LayerCard className="overflow-hidden p-0">
            <Table>
              <Table.Body data-animate-list>
                {list.slice(0, 5).map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center bg-kumo-control text-kumo-subtle"><CubeIcon /></span>
                        <span className="grid gap-0.5"><strong className="font-medium text-kumo-strong">{order.productName || "订单商品"}</strong><span className="text-sm text-kumo-subtle">{order.orderNo}</span></span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-right"><strong>{formatMoney(order.payAmount)}</strong><div className="text-sm text-kumo-subtle">{order.createdAt}</div></Table.Cell>
                    <Table.Cell className="w-24 text-right"><StatusBadge status={orderStatusCode(order.status)} /></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </LayerCard>
        </PageState>
      </section>
      </div>
      </PageState>
    </>
  );
}
