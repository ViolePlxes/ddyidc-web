import dayjs from "dayjs";

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(cents / 100);
}

export function formatDate(value: string): string {
  return dayjs(value).format("YYYY-MM-DD HH:mm");
}

export const cycleLabels: Record<string, string> = {
  monthly: "月付",
  quarterly: "季付",
  semiannually: "半年付",
  annually: "年付",
};

export function orderStatusCode(status: number) {
  if (status === 1) return "pending" as const;
  if (status === 2) return "paid" as const;
  if (status === 3) return "cancelled" as const;
  if (status === 4 || status === 5) return "refunded" as const;
  if (status === 6) return "completed" as const;
  return "failed" as const;
}

export function rechargeStatusLabel(status: number) {
  return ({ 1: "待支付", 2: "充值成功", 3: "充值失败", 4: "已关闭" } as Record<number, string>)[status] ?? "未知";
}
