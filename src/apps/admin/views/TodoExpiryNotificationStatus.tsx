import { Badge } from "../../../shared/components/Badge";
import type { TodoEntry } from "../../../shared/api/adminTodos";
const statuses: Record<string, {label: string; variant: "neutral" | "success" | "warning" | "error"}> = {
 delivered: {label: "已送达", variant: "success"},
 delivery_failed: {label: "投递失败", variant: "error"},
 receipt_pending: {label: "等待回执", variant: "warning"},
 receipt_unknown: {label: "送达待核查", variant: "warning"},
 not_sent: {label: "未发送", variant: "neutral"},
 success: {label: "已发送", variant: "success"},
 submitted: {label: "服务商已接收", variant: "warning"},
 pending: {label: "等待发送", variant: "neutral"},
 sending: {label: "发送中", variant: "warning"},
 failed: {label: "发送失败", variant: "error"},
 unknown: {label: "待核查", variant: "warning"},
 canceled: {label: "已取消", variant: "neutral"},
 skipped: {label: "已跳过", variant: "neutral"},
};
export function TodoExpiryNotificationStatus({row}: {row: TodoEntry}) {
 return <div className="grid gap-1.5">{([['sms','短信'],['email','邮件']] as const).map(([channel,label])=>{
  const status = channel==="sms"&&row.expiryNotifications?.sms==="success" ? {label:"已提交",variant:"warning" as const} : row.expiryNotifications ? statuses[row.expiryNotifications[channel]] ?? {label: "待核查",variant: "warning" as const} : {label: "未获取",variant: "neutral" as const};
  return <div key={channel} className="flex items-center gap-2"><span>{label}</span><Badge variant={status.variant}>{status.label}</Badge></div>;
 })}</div>;
}
