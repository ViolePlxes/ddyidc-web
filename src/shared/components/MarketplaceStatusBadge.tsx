import { Badge } from "./Badge";
const labels: Record<string, string> = {
  pending: "待处理",
  pending_pay: "待支付",
  passed: "已通过",
  on_sale: "在售",
  locked: "交易锁定",
  sold: "已售出",
  paid: "待确认收货",
 refund_pending:"待后台审核退款",
  settled: "已完成",
  refunded: "已退款",
  rejected: "已拒绝",
  off_shelf: "已下架",
  cancelled: "已取消",
  approved: "已通过",
  processed: "已处理",
  ignored: "已忽略",
  open: "求购中",
  matched: "已匹配",
  closed: "已关闭",
};

export function MarketplaceStatusBadge({ status }: { status: string }) {
  const variant = ["on_sale", "paid", "settled", "passed", "approved"].includes(status)
    ? "success"
    : ["rejected", "refunded", "cancelled"].includes(status)
      ? "error"
      : "outline";
  return <Badge variant={variant}>{labels[status] ?? status}</Badge>;
}

export function marketplaceFee(amount: string, type: string, rate: string, fixed: string) {
  const cents = Math.round(Math.max(0, Number(amount || 0)) * 100);
  const basisPoints = Math.round(Math.max(0, Number(rate || 0)) * 100);
  return type === "fixed" ? Math.round(Math.max(0, Number(fixed || 0)) * 100) / 100 : Math.floor((cents * basisPoints + 5_000) / 10_000) / 100;
}

export function marketplaceFlowLabel(type: string): string {
  const labels: Record<string, string> = {
    buyer_paid: "买家付款", seller_pending: "卖家待结算", settled_to_balance: "结算至主账户",
    platform_commission: "平台佣金收益", settled: "交易结算", refund_reversed: "退款回滚",
    refund_retained: "退款后已使用费用结算", refund_retained_to_balance: "退款后已使用费用入余额",
    withdraw: "提现", withdraw_reject: "提现拒绝退回", withdraw_hold: "申请提现冻结",
  };
  return labels[type] ?? type;
}
