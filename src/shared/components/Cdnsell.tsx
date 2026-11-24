import { Badge } from "./Badge";
// 流量按 1000 进制显示，与金山云 CDN 计量口径（1GB = 10^9 字节）一致。
export function formatTraffic(value:number){if(value>=10**15)return `${(value/10**15).toFixed(2)} PB`;if(value>=10**12)return `${(value/10**12).toFixed(2)} TB`;if(value>=10**9)return `${(value/10**9).toFixed(2)} GB`;if(value>=10**6)return `${(value/10**6).toFixed(2)} MB`;if(value>=10**3)return `${(value/10**3).toFixed(2)} KB`;return `${new Intl.NumberFormat("zh-CN").format(value)} B`}
const cdnStatusLabels: Record<string, string> = {
 running: "正常", active: "正常", confirmed: "已确认", success: "成功", online: "在线", offline: "离线",
 pending: "待处理", creating: "接入中", configuring: "配置中", removing: "移除中", not_created: "待接入",
 failed: "失败", need_manual: "待核查", terminated: "已终止", expired: "已到期", exhausted: "已用完",
 deployed: "已部署", undepolyed: "未部署", verified: "已验证", unverified: "未验证", sent: "已发送",
};
export function CdnStatus({ value, label }: { value: string | boolean | null; label?: string }) {
 const active = value === true || ["running", "active", "confirmed", "success", "online", "deployed", "verified", "sent"].includes(String(value));
 const error = ["failed", "terminated"].includes(String(value));
 const waiting = ["pending", "creating", "configuring", "need_manual", "removing"].includes(String(value));
 const text = label ?? (value === null ? "待实测" : value === true ? "正常" : value === false ? "未开放" : cdnStatusLabels[value] ?? "未知状态");
 return <Badge variant={active ? "success" : error ? "error" : waiting ? "warning" : "neutral"}>{text}</Badge>;
}