import { Banner, Button, LayerCard, Link } from "@cloudflare/kumo";
import { CopyIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminOverviewApi } from "../../api/adminOverview";
import { customerDetailApi } from "../../api/customerDetail";
import { adminInstancesApi } from "../../api/adminInstances";
import type { Ticket } from "../../api/tickets";
import { adminBase } from "../../utils/adminEntry";
import { Badge } from "../Badge";

export function TicketCustomerSidebar({ ticket }: { ticket: Ticket }) {
  const customer = useQuery({ queryKey: ["ticket-customer", ticket.clientId], queryFn: () => adminOverviewApi.customer(ticket.clientId), staleTime: 60000, retry: false });
  const profile = useQuery({ queryKey: ["ticket-profile", ticket.clientId], queryFn: () => customerDetailApi.profile(ticket.clientId), staleTime: 60000, retry: false });
  const instance = useQuery({ queryKey: ["ticket-instance", ticket.clientId, ticket.hostId], queryFn: async () => { const result = await adminInstancesApi.list({ customerId: ticket.clientId, search: ticket.hostId!, page: "1", pageSize: "20" }); return result.items.find(item => item.id === ticket.hostId && item.customerId === ticket.clientId) ?? null; }, enabled: Boolean(ticket.hostId), staleTime: 60000, retry: false });
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const realname = profile.data?.realname?.find(item => item.status === 2);
  const realDisplay = realname?.companyName || realname?.name;
  const instanceStatuses: Record<number, string> = { 1: "待开通", 2: "开通中", 3: "运行中", 4: "已暂停", 5: "已到期", 6: "已终止" };
  const hostHref = `${adminBase}/customers/${ticket.clientId}/instances/${ticket.hostId}`;
  const ip = instance.data?.primaryIp || instance.data?.ips?.[0];
  const time = (value?: string | null) => value ? new Date(value).toLocaleString("zh-CN") : "—";
  return <aside className="min-h-0 min-w-0 p-px xl:h-full" aria-label="客户资料">
    <LayerCard className="min-h-0 xl:h-full"><div className="divide-y divide-kumo-line overflow-y-auto xl:h-full"><section className="grid gap-4 px-4 py-4">
      <h2 className="font-semibold">客户资料</h2>
      <div className="grid gap-1"><Link href={`${adminBase}/customers/${ticket.clientId}/profile`}>{realDisplay || (profile.isPending ? "正在加载实名…" : profile.isError ? "实名信息不可用" : "未实名")}</Link><Link href={`${adminBase}/customers/${ticket.clientId}/profile`} className="text-sm">#{ticket.clientId}</Link></div>
      {customer.isError || profile.isError ? <Banner title="部分客户资料不可用" description="请检查查看权限或稍后重试；不影响工单回复。" /> : null}
      {customer.isPending ? <p className="text-sm text-kumo-subtle">正在加载客户信息…</p> : customer.data ? <dl className="grid gap-3 text-sm">
        <div><dt className="text-kumo-subtle">账号</dt><dd className="break-all">{customer.data.username || "—"}</dd></div>
        <div><dt className="text-kumo-subtle">手机</dt><dd>{customer.data.phone || "未设置"}</dd></div>
        <div><dt className="text-kumo-subtle">邮箱</dt><dd className="break-all">{customer.data.email || "未设置"}</dd></div>
        <div className="flex flex-wrap gap-2"><Badge variant={realDisplay ? "success" : "neutral"}>{realDisplay ? "已实名" : "未实名"}</Badge><Badge variant={customer.data.status === 1 ? "success" : "neutral"}>{customer.data.status === 1 ? "账户正常" : "账户受限"}</Badge></div>
      </dl> : null}
      {customer.isError || profile.isError ? <Button variant="secondary" size="sm" onClick={() => { void customer.refetch(); void profile.refetch(); }}>重新加载资料</Button> : null}
    </section>
    <section className="grid gap-3 px-4 py-4"><h2 className="font-semibold">关联产品</h2>{ticket.hostId ? <>
      <Link href={hostHref}>{ticket.hostName || instance.data?.productName || "查看关联产品"}</Link>
      <Link href={hostHref} className="break-all text-sm">{instance.data?.instanceNo || `#${ticket.hostId}`}</Link>
      {instance.isPending ? <p className="text-sm text-kumo-subtle">正在加载产品信息…</p> : instance.isError ? <p className="text-sm text-kumo-subtle">产品资料不可用，可进入详情核查。</p> : <>
        <div className="flex items-center gap-2 text-sm">{ip ? <><Link href={hostHref}>{ip}</Link><Button variant="ghost" size="sm" shape="square" icon={<CopyIcon />} aria-label="复制机器IP" onClick={() => { void navigator.clipboard.writeText(ip).then(() => { setCopied(true); setCopyFailed(false); }, () => { setCopyFailed(true); }); }} /></> : "暂无IP"}</div>
        {copied ? <span role="status" className="text-sm text-kumo-subtle">IP已复制</span> : null}{copyFailed ? <span role="alert" className="text-sm text-kumo-subtle">复制失败，请手动复制</span> : null}
        <Badge variant={instance.data?.status === 3 ? "success" : "neutral"}>{instance.data ? instanceStatuses[instance.data.status] || "未知状态" : "未找到关联产品"}</Badge><dl className="grid gap-3 text-sm"><div><dt className="text-kumo-subtle">实例ID</dt><dd><Link href={hostHref}>#{ticket.hostId}</Link></dd></div><div><dt className="text-kumo-subtle">到期时间</dt><dd>{time(instance.data?.expiresAt)}</dd></div></dl>
      </>}
    </> : <p className="text-sm text-kumo-subtle">未关联产品</p>}</section>
    <section className="grid gap-3 px-4 py-4"><h2 className="font-semibold">工单信息</h2><dl className="grid gap-3 text-sm"><div><dt className="text-kumo-subtle">负责人</dt><dd>{ticket.adminName || "等待接单"}</dd></div><div><dt className="text-kumo-subtle">创建时间</dt><dd>{time(ticket.createdAt)}</dd></div><div><dt className="text-kumo-subtle">最后回复</dt><dd>{time(ticket.lastReplyTime)}</dd></div></dl></section></div></LayerCard>
  </aside>;
}
