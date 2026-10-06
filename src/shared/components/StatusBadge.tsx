import { Badge } from "@cloudflare/kumo";
import { MachineStatusBadge } from './MachineStatusBadge';

const statusMap = {
  pending: { label: "待支付", variant: "info" },
  paid: { label: "已支付", variant: "success" },
  cancelled: { label: "已取消", variant: "secondary" },
  running: { label: "运行中", variant: "success" },
  stopped: { label: "已关机", variant: "secondary" },
  destroyed: { label: "已销毁", variant: "error" },
  suspended: { label: "已暂停", variant: "warning" },
  expired: { label: "已到期", variant: "error" },
  provisioning: { label: "开通中", variant: "info" },
  refunded: { label: "已退款", variant: "warning" },
  completed: { label: "已完成", variant: "success" },
  failed: { label: "失败", variant: "error" },
} as const;

export type StatusCode = keyof typeof statusMap;

export function StatusBadge({ status }: { status: StatusCode }) {
  const item = statusMap[status];
  if (['running', 'stopped', 'destroyed', 'suspended', 'expired', 'provisioning'].includes(status)) {
    return <MachineStatusBadge status={status} label={item.label} />;
  }
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
