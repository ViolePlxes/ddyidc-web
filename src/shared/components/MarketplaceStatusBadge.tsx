import { Badge } from "@cloudflare/kumo";

const labels: Record<string, string> = {
  pending: "待处理",
  pending_pay: "待支付",
  passed: "已通过",
  on_sale: "在售",
  locked: "交易锁定",
  sold: "已售出",
  paid: "已成交",
  settled: "已结算",
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
  const value = Math.max(0, Number(amount || 0));
  return type === "fixed" ? Math.max(0, Number(fixed || 0)) : value * Math.max(0, Number(rate || 0)) / 100;
}
