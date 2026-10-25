import { Button, DropdownMenu, LayerCard, Link, Select, Text } from "@cloudflare/kumo";
import { ArrowClockwiseIcon, CaretRightIcon, CubeIcon, DotsThreeIcon, MagnifyingGlassIcon, TicketIcon, WalletIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { cdnsellApi, probeCdnsell } from "../../../shared/api/cdnsell";
import { consoleApi } from "../../../shared/api/console";
import { getConsoleOverview } from "../../../shared/api/consoleHome";
import { userTicketApi } from "../../../shared/api/tickets";
import { getApiMessage } from "../../../shared/api/request";
import { PageState } from "../../../shared/components/PageState";
import { MiniTrend } from "../../../shared/components/TrendChart";
import { getLoginDevices } from "../../../shared/api/auth";
import { certificationApi } from "../../../shared/api/certification";
import { useAuthStore } from "../../../shared/stores/auth";
import { HomeReferralPanel } from "./HomeReferralPanel";

function RecentRow({ icon, title, category, href, description }: { icon: ReactNode; title: string; category: string; href: string; description?: string }) {
  return <Link href={href} variant="plain" title={description || `${category} / ${title}`}
    className="group flex h-14 w-full min-w-0 items-center gap-2! border-b border-kumo-hairline py-4 text-base last:border-0">
    <span className="flex shrink-0 items-center text-kumo-default opacity-50 group-hover:opacity-100">{icon}</span>
    <span className="flex min-w-0 items-baseline overflow-hidden whitespace-nowrap group-hover:underline">
      <span className="min-w-0 shrink truncate text-kumo-subtle">{category}</span>
      <span className="mx-1 shrink-0 text-kumo-subtle">/</span>
      <span className="min-w-0 truncate font-medium text-kumo-default">{title}</span>
    </span>
    <CaretRightIcon size={10} className="ml-auto shrink-0 text-kumo-subtle group-hover:text-kumo-default" />
  </Link>;
}

function RecentHeading({ title, href }: { title: string; href?: string }) {
  return <div className="flex h-8 items-center justify-between gap-2">
    {href?<Link href={href} variant="plain" className="flex h-8 items-center gap-1"><Text as="h2" variant="secondary" size="sm" bold>{title}</Text><CaretRightIcon size={10} className="text-kumo-subtle"/></Link>:<Text as="h2" variant="secondary" size="sm" bold>{title}</Text>}
    <DropdownMenu>
      <DropdownMenu.Trigger render={<Button variant="ghost" shape="square" size="sm" aria-label={`${title}选项`} icon={<DotsThreeIcon />} />} />
      <DropdownMenu.Content>
        {href ? <DropdownMenu.LinkItem href={href}>查看全部</DropdownMenu.LinkItem> : <DropdownMenu.Item onClick={() => window.dispatchEvent(new Event("ddyidc:open-search"))}>搜索快捷入口</DropdownMenu.Item>}
      </DropdownMenu.Content>
    </DropdownMenu>
  </div>;
}

export function ConsoleHome() {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const certification = useQuery({ queryKey: ["console", "home-certification", user?.id], queryFn: certificationApi.info, enabled: !!user, gcTime: 0 });
  const devices = useQuery({ queryKey: ["console", "home-devices", user?.id], queryFn: getLoginDevices, enabled: !!user, gcTime: 0 });
  const certifiedName = certification.data?.status === 2 ? certification.data.record?.name.trim() : "";
  const displayName = certifiedName && !certifiedName.startsWith("*") ? Array.from(certifiedName)[0] : user?.account || user?.name || "用户";
  const loginIp = devices.data?.find(device => device.current)?.ip;
  const [days, setDays] = useState("7");
  const overview = useQuery({ queryKey: ["console", "overview", days], queryFn: () => getConsoleOverview(Number(days)), refetchInterval: 60_000 });
  const services = useQuery({ queryKey: ["console", "recent-services", 4], queryFn: () => consoleApi.userInstances({ page: 1, pageSize: 4 }) });
  const tickets = useQuery({ queryKey: ["console", "recent-tickets"], queryFn: () => userTicketApi.list({ page: 1, pageSize: 3 }) });
  const cdnStatus = useQuery({ queryKey: ["cdnsell", "home-status", user?.id], queryFn: () => probeCdnsell("public"), enabled: !!user, staleTime: 60_000 });
  const cdn = useQuery({ queryKey: ["cdnsell", "home-delivery", user?.id], queryFn: cdnsellApi.overview, enabled: !!user && cdnStatus.data?.enabled === true, retry: false });
  const traffic = (bytes: number) => `${(bytes / (bytes >= 1024 ** 4 ? 1024 ** 4 : 1024 ** 3)).toLocaleString("zh-CN", { maximumFractionDigits: 2 })} ${bytes >= 1024 ** 4 ? "TB" : "GB"}`;
  const cdnHint = cdnStatus.error || cdn.error ? "流量读取失败，请刷新重试" : cdnStatus.data?.enabled === false ? "CDN 服务尚未启用" : "正在读取流量…";
  const daily = (cdn.data?.dailyTrend ?? []).slice(-Number(days));
  const dailyValues: [number, number][] = daily.map(p => [new Date(p.time).getTime(), p.bytes / 1024 ** 3]);
  const metricValues = (key: "balance" | "active"): [number, number][] => (overview.data?.series[key] ?? []).map(p => [p.time, p.value]);
  const recentServices=services.data?.items??[];
  const recentTickets=tickets.data?.list??[];
  const metrics = [
    { key: "balance" as const, title: "余额", value: overview.data ? `¥${Number(overview.data.balance).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—", hint: "每日可用余额净变动（元）", href: "/console/finance", values: metricValues("balance"), valueFormat: undefined },
    { key: "active" as const, title: "激活产品数量", value: overview.data?.active ?? "—", hint: "当前运行中 · 图表为每日激活记录", href: "/console/instances", values: metricValues("active"), valueFormat: undefined },
    { key: "delivery" as const, title: "边缘节点分发总量", value: cdn.data?.distributedBytes !== undefined ? traffic(cdn.data.distributedBytes) : "—", hint: cdn.data ? "累计已确认分发流量（含超额用量）· 图表为每日分发流量（GB）" : cdnHint, href: "/console/cdnsell/statistics/traffic", values: dailyValues, valueFormat: (value: number) => traffic(value * 1024 ** 3) },
    { key: "traffic" as const, title: "流量情况", value: cdn.data ? traffic(cdn.data.todayBytes) : "—", hint: cdn.data ? `资源包剩余 ${traffic(cdn.data.remainingBytes)} · ${cdn.data.activeDomains} 个加速域名 · 每日流量（GB）` : cdnHint, href: "/console/cdnsell/usage", values: dailyValues, valueFormat: (value: number) => traffic(value * 1024 ** 3) },
  ];
  return <div className="mx-auto grid w-full max-w-[1000px] items-start gap-8">
      <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2 pt-6 md:pt-6 lg:col-start-1">
        {certification.data?.status === 2 && user ? <span className="text-base text-kumo-subtle">ID：{user.id}</span> : null}
        <Text as="h1" variant="heading" size="lg">{displayName}，欢迎您</Text>
        {certification.data && certification.data.status !== 2 ? <Button variant="outline" size="sm" onClick={() => navigate("/console/certification")}>去实名认证<CaretRightIcon aria-hidden size={12} /></Button> : null}
        <span className="text-base text-kumo-subtle">当前登录 IP：{loginIp || (devices.isPending ? "读取中…" : "暂无记录")}</span>
      </div>
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-2xl bg-kumo-elevated p-1.5 ring ring-kumo-hairline lg:col-start-1 lg:row-start-2">
       <Button variant="outline" className="h-10 w-full justify-start gap-3 rounded-xl bg-kumo-control px-3 shadow-md hover:bg-kumo-control" icon={<MagnifyingGlassIcon />} onClick={() => window.dispatchEvent(new Event("ddyidc:open-search"))}>
        <span className="flex-1 text-left font-normal text-kumo-subtle">搜索页面、产品和服务…</span>
        <span className="flex items-center gap-1" aria-hidden="true"><kbd className="border border-kumo-line bg-kumo-canvas px-1 text-xs font-normal text-kumo-subtle">Ctrl</kbd><kbd className="border border-kumo-line bg-kumo-canvas px-1 text-xs font-normal text-kumo-subtle">K</kbd></span>
       </Button>
      </div>
    <div className="mx-auto grid w-full min-w-0 max-w-5xl gap-10 pb-8 lg:col-start-1 lg:row-start-3">
    <section className="relative -mt-4 grid gap-8">
      <div className="grid grid-cols-1 gap-x-6 gap-y-2 md:h-[316px] md:grid-cols-3">
        <section aria-label="快捷入口" className="min-h-0 min-w-0">
          <RecentHeading title="快捷入口" />
          <RecentRow icon={<CubeIcon size={18} />} category="云服务" title="订购产品" href="/console/products" />
          <RecentRow icon={<WalletIcon size={18} />} category="账户" title="财务中心" href="/console/finance" />
          <RecentRow icon={<TicketIcon size={18} />} category="支持" title="创建工单" href="/console/tickets/create" />
        </section>
        <section aria-label="已有服务" className="min-h-0 min-w-0">
          <RecentHeading title="已有服务" href="/console/instances" />
          <PageState loading={services.isLoading} error={services.error ? getApiMessage(services.error) : null}>
            <div className="min-w-0">
              {recentServices.length ? recentServices.slice(0, 4).map(s => <RecentRow key={s.id} icon={<CubeIcon size={18} />} category="服务" title={s.name || s.productName} description={s.primaryIp || s.productName || `#${s.id}`} href={`/console/instances/${s.id}`} />) : <Link href="/console/products" variant="plain" className="mt-0.5 flex h-[50px] w-full items-center justify-center gap-1.5 rounded-xl bg-kumo-recessed text-sm font-medium text-kumo-subtle hover:bg-kumo-fill"><CubeIcon size={16}/>订购产品</Link>}
            </div>
          </PageState>
        </section>
        <section aria-label="最近工单" className="min-h-0 min-w-0">
          <RecentHeading title="最近工单" href="/console/tickets" />
          <PageState loading={tickets.isLoading} error={tickets.error ? getApiMessage(tickets.error) : null}>
            {recentTickets.length ? recentTickets.slice(0, 3).map(t => <RecentRow key={t.id} icon={<TicketIcon size={18} />} category={t.status.name} title={t.title} description={`${t.ticketNum} · ${t.status.name}`} href={`/console/tickets/${t.id}`} />) : <Link href="/console/tickets/create" variant="plain" className="mt-0.5 flex h-[50px] w-full items-center justify-center gap-1.5 rounded-xl bg-kumo-recessed text-sm font-medium text-kumo-subtle hover:bg-kumo-fill"><TicketIcon size={16}/>创建工单</Link>}
          </PageState>
        </section>
      </div>
    </section>
    <section aria-label="账户数据分析" className="mx-auto grid w-full max-w-[1000px] gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Text as="h2" variant="heading">账户数据分析</Text>
        <div className="flex items-center gap-2">
          <Select aria-label="趋势时间范围" value={days} items={[{ value: "7", label: "过去 7 天" }, { value: "30", label: "过去 30 天" }]} onValueChange={v => setDays(v ?? "7")} />
          <Button variant="ghost" shape="square" aria-label="刷新指标" icon={<ArrowClockwiseIcon />} loading={overview.isFetching || cdn.isFetching || cdnStatus.isFetching} onClick={() => { void overview.refetch(); void cdnStatus.refetch(); if (cdnStatus.data?.enabled) void cdn.refetch(); }} />
        </div>
      </div>
      <PageState loading={overview.isLoading} error={overview.error ? getApiMessage(overview.error) : null}>
        <div className="grid auto-rows-[241px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {metrics.map(m => <Fragment key={m.key}><LayerCard className={`${m.key === "balance" ? "sm:col-span-2 lg:col-span-3" : "lg:col-span-2"} group relative flex h-full min-h-0 min-w-0 flex-col gap-2 overflow-hidden bg-kumo-base px-4 pt-3 pb-2`}>
            <Link href={m.href} variant="plain" aria-label={`查看${m.title}`} className="absolute inset-0 z-10" />
            <div className="flex items-center justify-between gap-3"><Text variant="secondary" size="sm">{m.key === "balance" ? "账户余额" : m.title}</Text><CaretRightIcon aria-hidden size={16} className="text-kumo-subtle motion-safe:transition-transform motion-safe:group-hover:translate-x-1" /></div>
            {m.values.length>0?<Text as="p" variant="heading1">{m.value}</Text>:null}
            {m.key === "balance" ? <div className="relative z-20 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" onClick={() => navigate("/wallet/recharge")}>充值</Button>
              <Button variant="secondary" size="sm" onClick={() => navigate("/wallet/consume-records")}>明细</Button>
            </div> : null}
            {m.values.length>0?<Text variant="secondary" size="sm">{m.hint}</Text>:null}
            <div className="relative z-20 mt-auto min-h-0 min-w-0 flex-1 cursor-pointer" onClick={() => navigate(m.href)}>
              <MiniTrend height={80} title={m.key === "delivery" || m.key === "traffic" ? "每日分发流量（GB）" : m.hint} money={m.key === "balance"} values={m.values} valueFormat={m.valueFormat} />
            </div>
          </LayerCard>{m.key==="balance"?<HomeReferralPanel kind="earnings"/>:null}</Fragment>)}
        </div>
      </PageState>
    </section>
    </div>
  </div>;
}
