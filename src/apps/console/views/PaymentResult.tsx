import { Banner, Button, LayerCard, LinkButton } from "@cloudflare/kumo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { paymentApi, type PaymentBusinessType } from "../../../shared/api/payment";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

const finalStates = new Set(["paid", "closed", "failed", "refunded"]);

export function PaymentResult() {
  const [params] = useSearchParams();
  const payNo = params.get("payNo")?.trim() ?? "";
  const bizId = params.get("bizId")?.trim() ?? "";
  const rawBizType = params.get("bizType")?.trim();
  const bizType: PaymentBusinessType | undefined = rawBizType === "order" || rawBizType === "recharge" ? rawBizType : undefined;
  const cancelled = params.get("cancelled") === "1";
  const pollCount = useRef(0);
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ["payment", payNo],
    queryFn: async () => {
      pollCount.current += 1;
      return paymentApi.statusByPayNo(payNo);
    },
    enabled: Boolean(payNo),
    retry: false,
    refetchInterval: (query) => {
      if (finalStates.has(query.state.data?.status ?? "") || pollCount.current >= 30) return false;
      return 2_000;
    },
  });

  useEffect(() => {
    if (status.data?.status !== "paid") return;
    if (bizType === "order") {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["orders"] }),
        queryClient.invalidateQueries({ queryKey: ["instances"] }),
      ]);
    } else if (bizType === "recharge") {
      void queryClient.invalidateQueries({ queryKey: ["finance"] });
    }
  }, [bizType, queryClient, status.data?.status]);

  const currentStatus = status.data?.status;
  const timedOut = pollCount.current >= 30 && !finalStates.has(currentStatus ?? "");
  const target = bizType === "order" && bizId ? `/console/orders/${encodeURIComponent(bizId)}` : "/console/finance";

  return (
    <>
      <PageHeader title="支付结果" description="本站正在向服务端确认支付宝异步通知结果。" />
      {!payNo ? (
        <Banner variant="error" title="支付单号缺失" description="请从订单详情或充值记录重新进入支付流程。" />
      ) : (
        <PageState loading={status.isLoading} skeleton="detail" error={status.error ? getApiMessage(status.error) : null}>
          <LayerCard className="shadow-none grid gap-5 p-5">
            {currentStatus === "paid" ? <Banner title="支付成功" description="服务端已完成验签和入账确认。" /> : null}
            {currentStatus === "pending" && !timedOut ? (
              <Banner variant="alert" title={cancelled ? "支付已取消或尚未完成" : "正在确认支付结果"} description="请保留此页面，系统会自动刷新。" />
            ) : null}
            {timedOut ? <Banner variant="alert" title="暂未确认到账" description="60 秒内尚未收到异步通知，请稍后到业务详情页再次查看。" /> : null}
            {currentStatus === "closed" || currentStatus === "failed" || currentStatus === "refunded" ? (
              <Banner variant="error" title="支付未完成" description="该支付单已关闭、失败或退款。" />
            ) : null}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" loading={status.isFetching} onClick={() => void status.refetch()}>立即刷新</Button>
              <LinkButton href={target}>{bizType === "order" ? "查看订单" : "返回财务中心"}</LinkButton>
            </div>
          </LayerCard>
        </PageState>
      )}
    </>
  );
}
