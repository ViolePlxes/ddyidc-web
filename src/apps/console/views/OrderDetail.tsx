import { Banner, Button, LayerCard } from "@cloudflare/kumo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { consoleApi } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { DefinitionList } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { PaymentDialog } from "../../../shared/components/PaymentDialog";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { useOrder } from "../../../shared/hooks/useConsoleData";
import { cycleLabels, formatMoney, orderStatusCode } from "../../../shared/utils/format";

const payTypes: Record<number, string> = { 1: "支付宝", 2: "微信支付", 3: "余额支付" };

export function OrderDetail() {
  const { id = "" } = useParams();
  const query = useOrder(id);
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => consoleApi.cancelOrder(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders", id] }),
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
      ]);
    },
  });
  const order = query.data;
  const item = order?.items?.[0];
  const snapshot = item?.configSnapshot;
  const configRows = Object.entries(snapshot?.configOptions ?? {})
    .sort(([, left], [, right]) => left.position - right.position)
    .map(([, option]) => ({
      label: option.displayName,
      value: option.displayValue,
    }));

  return (
    <>
      <PageHeader
        title="订单详情"
        description={order ? `订单 ${order.orderNo}` : "读取订单信息"}
        actions={order ? <StatusBadge status={orderStatusCode(order.status)} /> : undefined}
      />
      <PageState
        loading={query.isLoading}
        skeleton="detail"
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.error && !order}
        emptyTitle="订单不存在"
      >
        {order ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="grid gap-4">
              <LayerCard className="p-5">
                <DefinitionList
                  rows={[
                    { label: "订单号", value: order.orderNo },
                    { label: "商品", value: order.productName || order.items?.[0]?.productName || "—" },
                    { label: "下单时间", value: order.createdAt },
                    { label: "支付方式", value: order.payType ? payTypes[order.payType] ?? `类型 ${order.payType}` : "尚未支付" },
                    ...configRows,
                    ...(snapshot?.hostname
                      ? [{ label: "主机名", value: snapshot.hostname }]
                      : []),
                    ...(snapshot?.passwordSet
                      ? [{ label: "实例密码", value: snapshot.passwordMasked || "已安全保存" }]
                      : []),
                    {
                      label: "购买周期",
                      value:
                        (snapshot?.billingCycle &&
                          (cycleLabels[snapshot.billingCycle] || snapshot.billingCycle)) ||
                        item?.durationText ||
                        "—",
                    },
                    { label: "数量", value: `${item?.quantity ?? 1} 台` },
                  ]}
                />
              </LayerCard>
              <Banner
                variant={order.status === 1 ? "alert" : "default"}
                title={order.status === 1 ? "等待在线支付" : "支付结果已由服务端确认"}
                description={order.status === 1
                  ? "可选择微信扫码或支付宝电脑网站支付；验签到账后系统将异步向上游发起开通。"
                  : "订单支付状态来自支付平台回调；实例状态来自真实上游响应。"}
              />
            </div>
            <LayerCard className="grid gap-4 p-5">
              <span className="text-sm text-kumo-subtle">应付金额</span>
              <strong className="text-3xl text-kumo-strong">{formatMoney(order.payAmount)}</strong>
              <PaymentDialog
                businessType="order"
                businessId={order.id}
                amountCents={order.payAmount}
                disabled={order.status !== 1}
                onPaid={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["orders", id] }),
                    queryClient.invalidateQueries({ queryKey: ["orders"] }),
                    queryClient.invalidateQueries({ queryKey: ["instances"] }),
                  ]);
                }}
              />
              <Button
                variant="secondary"
                disabled={order.status !== 1}
                loading={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                取消订单
              </Button>
              {cancel.error ? <Banner variant="error" title="取消失败" description={getApiMessage(cancel.error)} /> : null}
            </LayerCard>
          </div>
        ) : null}
      </PageState>
    </>
  );
}
