import { Button, DropdownMenu, Empty, LayerCard, LinkButton, Select, Text } from "@cloudflare/kumo";
import { ArrowClockwiseIcon, ArrowRightIcon, CubeIcon, DotsThreeIcon, MagnifyingGlassIcon, TicketIcon, WalletIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { consoleApi } from "../../../shared/api/console";
import { getConsoleOverview } from "../../../shared/api/consoleHome";
import { userTicketApi } from "../../../shared/api/tickets";
import { getApiMessage } from "../../../shared/api/request";
import { PageState } from "../../../shared/components/PageState";
import { MiniTrend } from "../../../shared/components/TrendChart";

function RecentRow({ icon, title, description, href }: { icon: ReactNode; title: string; description: string; href: string }) {
  return <div className="flex min-w-0 items-center gap-3 border-b border-kumo-line py-4 last:border-0">
    {icon}
    <div className="grid min-w-0 flex-1 gap-1"><span className="truncate">{title}</span><span className="truncate text-sm text-kumo-subtle">{description}</span></div>
    <LinkButton href={href} variant="ghost" shape="square" icon={<ArrowRightIcon />} aria-label={`查看${title}`} />
  </div>;
}

export function ConsoleHome() {
  const [days, setDays] = useState("7");
  const overview = useQuery({ queryKey: ["console", "overview", days], queryFn: () => getConsoleOverview(Number(days)), refetchInterval: 60_000 });
  const services = useQuery({ queryKey: ["console", "recent-services"], queryFn: () => consoleApi.userInstances({ page: 1, pageSize: 5 }) });
  const tickets = useQuery({ queryKey: ["console", "recent-tickets"], queryFn: () => userTicketApi.list({ page: 1, pageSize: 5 }) });
  const metrics = [
    { key: "balance" as const, title: "余额", value: overview.data ? `¥${Number(overview.data.balance).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—", hint: "每日可用余额净变动（元）", href: "/console/finance" },
    { key: "active" as const, title: "激活产品数量", value: overview.data?.active ?? "—", hint: "当前运行中 · 图表为每日激活记录", href: "/console/instances" },
    { key: "products" as const, title: "产品总量", value: overview.data?.products ?? "—", hint: "全部产品 · 图表为每日新增产品", href: "/console/instances" },
    { key: "unpaid" as const, title: "未支付订单", value: overview.data?.unpaid ?? "—", hint: "当前待支付 · 图表按订单创建日期分布", href: "/console/orders" },
  ];
  return <div className="mx-auto grid w-full max-w-5xl gap-10 pb-8">
    <section className="grid gap-8 pt-6 md:pt-10">
      <div className="text-center"><Text as="h1" variant="heading1">今天，从这里开始。</Text></div>
      <Button variant="secondary" className="h-12 w-full justify-start gap-3" icon={<MagnifyingGlassIcon />} onClick={() => window.dispatchEvent(new Event("ddyidc:open-search"))}>
        <span className="flex-1 text-left">搜索</span><kbd>Ctrl K</kbd>
      </Button>
      <div className="grid gap-8 md:grid-cols-3">
        <section aria-label="快捷入口" className="min-w-0">
          <div className="flex h-8 items-center"><Text as="h2" variant="heading">快捷入口</Text></div>
          <RecentRow icon={<CubeIcon />} title="订购产品" description="选择适合你的云服务" href="/console/products" />
          <RecentRow icon={<WalletIcon />} title="财务中心" description="查看充值与付款记录" href="/console/finance" />
          <RecentRow icon={<TicketIcon />} title="创建工单" description="联系支持团队" href="/console/tickets/create" />
        </section>
        <section aria-label="已有服务" className="min-w-0">
          <div className="flex items-center justify-between"><Text as="h2" variant="heading">已有服务</Text><LinkButton href="/console/instances" variant="ghost" shape="square" icon={<ArrowRightIcon />} aria-label="全部服务" /></div>
          <PageState loading={services.isLoading} error={services.error ? getApiMessage(services.error) : null}>
            {services.data?.items.length ? services.data.items.map(s => <RecentRow key={s.id} icon={<CubeIcon />} title={s.name || s.productName} description={s.primaryIp || s.productName || `#${s.id}`} href={`/console/instances/${s.id}`} />) : <Empty className="bg-kumo-base" icon={<CubeIcon />} title="暂无服务" description="购买的服务将在这里显示。" />}
          </PageState>
        </section>
        <section aria-label="最近工单" className="min-w-0">
          <div className="flex items-center justify-between"><Text as="h2" variant="heading">最近工单</Text><LinkButton href="/console/tickets" variant="ghost" shape="square" icon={<ArrowRightIcon />} aria-label="全部工单" /></div>
          <PageState loading={tickets.isLoading} error={tickets.error ? getApiMessage(tickets.error) : null}>
            {tickets.data?.list.length ? tickets.data.list.map(t => <RecentRow key={t.id} icon={<TicketIcon />} title={t.title} description={`${t.ticketNum} · ${t.status.name}`} href={`/console/tickets/${t.id}`} />) : <Empty className="bg-kumo-base" icon={<TicketIcon />} title="暂无工单" description="你的支持请求将在这里显示。" />}
          </PageState>
        </section>
      </div>
    </section>
    <section aria-label="账户数据分析" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text as="h2" variant="heading">账户数据分析</Text>
        <div className="flex items-center gap-2">
          <Select aria-label="趋势时间范围" value={days} items={[{ value: "7", label: "过去 7 天" }, { value: "30", label: "过去 30 天" }]} onValueChange={v => setDays(v ?? "7")} />
          <Button variant="ghost" shape="square" aria-label="刷新指标" icon={<ArrowClockwiseIcon />} loading={overview.isFetching} onClick={() => void overview.refetch()} />
        </div>
      </div>
      <PageState loading={overview.isLoading} skeleton="dashboard" error={overview.error ? getApiMessage(overview.error) : null}>
        <div className="grid gap-4 sm:grid-cols-2">
          {metrics.map(m => <LayerCard key={m.key} className="grid min-w-0 gap-3 p-5 shadow-none">
            <div className="flex items-center justify-between"><Text>{m.title}</Text><DropdownMenu>
              <DropdownMenu.Trigger render={<Button variant="ghost" shape="square" aria-label={`${m.title}选项`} icon={<DotsThreeIcon />} />} />
              <DropdownMenu.Content><DropdownMenu.LinkItem href={m.href}>查看明细</DropdownMenu.LinkItem><DropdownMenu.Item onClick={() => void overview.refetch()}>刷新数据</DropdownMenu.Item></DropdownMenu.Content>
            </DropdownMenu></div>
            <Text as="p" variant="heading1">{m.value}</Text>
            <span className="text-sm text-kumo-subtle">{m.hint}</span>
            <MiniTrend title={m.hint} money={m.key === "balance"} values={(overview.data?.series[m.key] ?? []).map(p => [p.time, p.value])} />
          </LayerCard>)}
        </div>
      </PageState>
      <p className="text-sm text-kumo-subtle">数量与余额为当前值，图表按服务器日期汇总；当前日期尚未结束。{overview.data ? ` 更新于 ${new Date(overview.data.asOf).toLocaleString("zh-CN")}` : ""}</p>
    </section>
  </div>;
}
