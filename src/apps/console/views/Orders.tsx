import { Button, LayerCard, Pagination, Table, Tabs } from "@cloudflare/kumo";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { useOrders } from "../../../shared/hooks/useConsoleData";
import { formatMoney, orderStatusCode } from "../../../shared/utils/format";

const statusValues: Record<string, number | undefined> = {
  all: undefined,
  pending: 1,
  paid: 2,
  cancelled: 3,
};

export function OrderList() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const query = useOrders(statusValues[status], page);
  const rows = query.data?.list ?? [];

  return (
    <>
      <PageHeader title="我的订单" description="订单状态、金额和时间均来自实时订单接口。" />
      <Tabs
        variant="underline"
        tabs={[
          { value: "all", label: "全部" },
          { value: "pending", label: "待支付" },
          { value: "paid", label: "已支付" },
          { value: "cancelled", label: "已取消" },
        ]}
        value={status}
        onValueChange={(value) => { setStatus(value); setPage(1); }}
      />
      <PageState
        loading={query.isLoading}
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.error && rows.length === 0}
        emptyTitle="暂无订单"
      >
        <div className="grid gap-3">
          <LayerCard className="shadow-none overflow-x-auto p-0">
            <Table>
              <Table.Header variant="compact">
                <Table.Row>
                  <Table.Head>商品</Table.Head>
                  <Table.Head>订单号</Table.Head>
                  <Table.Head>状态</Table.Head>
                  <Table.Head className="text-right">应付金额</Table.Head>
                  <Table.Head className="w-16"><span className="sr-only">查看</span></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body data-animate-list>
                {rows.map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell>
                      <div className="grid gap-0.5">
                        <strong className="font-medium text-kumo-strong">{order.productName || "订单商品"}</strong>
                        <span className="text-sm text-kumo-subtle">{order.createdAt}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{order.orderNo}</Table.Cell>
                    <Table.Cell><StatusBadge status={orderStatusCode(order.status)} /></Table.Cell>
                    <Table.Cell className="text-right">{formatMoney(order.payAmount)}</Table.Cell>
                    <Table.Cell>
                      <Link to={`/console/orders/${order.id}`} viewTransition>
                        <Button variant="ghost" shape="square" size="sm" icon={<ArrowRightIcon />} aria-label={`查看订单 ${order.orderNo}`} />
                      </Link>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </LayerCard>
          {(query.data?.total ?? 0) > 10 ? (
            <Pagination page={page} setPage={setPage} perPage={10} totalCount={query.data?.total ?? 0} />
          ) : null}
        </div>
      </PageState>
    </>
  );
}
