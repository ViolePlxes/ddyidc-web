import { Empty, LayerCard, LinkButton, Text } from "@cloudflare/kumo";
import { ArrowLeftIcon, ArrowRightIcon, BookOpenIcon, BellIcon, PackageIcon, FlagIcon, TrayIcon, SparkleIcon, TicketIcon, UsersIcon } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { PageHeader } from "../../../shared/components/PageHeader";

const entries = [
  { title: "我的工单", description: "查看和管理待处理和已解决的支持工单", href: "/console/tickets", icon: TrayIcon },
  { title: "提交工单", description: "为您的问题创建新的支持工单", href: "/console/tickets/create", icon: TicketIcon },
  { title: "询问 AI", description: "从 AI 助手获取问题解答", href: "/console/help?topic=ai", icon: SparkleIcon, topic: "ai", empty: "AI 助手暂未开放，您可以提交工单获取帮助。" },
  { title: "举报滥用", description: "反馈滥用行为与安全问题", href: "/console/help?topic=abuse", icon: FlagIcon, topic: "abuse", empty: "专用举报入口暂未开放，请通过工单反馈相关问题。" },
  { title: "询问社区", description: "与其他用户交流问题和经验", href: "/console/help?topic=community", icon: UsersIcon, topic: "community", empty: "社区暂未开放，您可以提交工单获取帮助。" },
];

const topics = [
  { title: "入门指南", links: [{ label: "选购云产品", href: "/console/products" }, { label: "管理已有产品", href: "/console/instances" }, { label: "账户资料与实名认证", href: "/console/profile" }] },
  { title: "产品与服务", links: [{ label: "产品列表与管理", href: "/console/instances" }, { label: "查看购买订单", href: "/console/orders" }, { label: "获取产品使用帮助", href: "/console/tickets/create" }] },
  { title: "账单与支付", links: [{ label: "财务中心", href: "/console/finance" }, { label: "我的订单", href: "/console/orders" }, { label: "优惠券", href: "/console/coupons" }] },
  { title: "账户与安全", links: [{ label: "个人资料", href: "/console/profile" }, { label: "账户安全设置", href: "/console/security" }, { label: "账户消息", href: "/console/messages" }] },
  { title: "CDN 与网络", links: [{ label: "CDN 服务总览", href: "/console/cdnsell" }, { label: "域名管理", href: "/console/cdnsell/domains" }, { label: "证书管理", href: "/console/cdnsell/certs" }] },
  { title: "服务与支持", links: [{ label: "查看我的工单", href: "/console/tickets" }, { label: "提交支持请求", href: "/console/tickets/create" }, { label: "举报滥用", href: "/console/help?topic=abuse" }] },
];

const communityUrl = "https://qm.qq.com/q/ceT0HXDqJq";
const communityQr = QRCode.create(communityUrl, { errorCorrectionLevel: "M" }).modules;
const communityQrPath = Array.from({ length: communityQr.size }, (_, row) =>
  Array.from({ length: communityQr.size }, (_, col) => communityQr.get(row, col) ? `M${col + 4} ${row + 4}h1v1h-1z` : "").join("")
).join("");

export function SupportCenter() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [backdropWidth, setBackdropWidth] = useState<number>();
  const [params] = useSearchParams();
  const selected = entries.find((entry) => entry.topic && entry.topic === params.get("topic"));
  useEffect(() => {
    const main = contentRef.current?.closest("main");
    if (!main) return;
    const update = () => setBackdropWidth(main.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(main);
    return () => observer.disconnect();
  }, [selected?.topic]);
  if (selected) return (
    <div className="mx-auto grid w-full min-w-0 max-w-[700px] gap-5">
      <PageHeader title={selected.title} actions={<LinkButton href="/console/help" variant="secondary" icon={<ArrowLeftIcon />}>返回支持中心</LinkButton>} />
      <LayerCard className=" px-5 py-4 sm:px-6 py-5">
        <Empty icon={<selected.icon />} title="暂未开放" description={selected.empty} />
        <div className="mt-5 flex justify-center"><LinkButton href="/console/tickets/create">提交工单</LinkButton></div>
      </LayerCard>
    </div>
  );
  return (
    <div ref={contentRef} className="mx-auto grid w-full min-w-0 max-w-6xl gap-16 py-8 sm:py-16">
      <section aria-labelledby="support-title" className="grid gap-10">
      <h1 id="support-title" className="text-center text-2xl font-medium text-kumo-default sm:text-3xl">我们可以为您提供什么帮助？</h1>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
        {entries.map((entry, index) => (
          <Link key={entry.title} to={entry.href} className={`group min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kumo-ring ${index < 2 ? "lg:col-span-3" : "lg:col-span-2"}`}>
            <LayerCard className="flex h-full flex-col items-start gap-3 px-5 py-4 sm:px-6 py-5">
              <entry.icon size={24} aria-hidden className="text-kumo-default opacity-40 transition-opacity group-hover:opacity-100" />
              <div className="mt-2 flex w-full items-start justify-between gap-2">
                <div className="grid min-w-0 gap-1.5"><Text as="h2" variant="heading">{entry.title}</Text><Text variant="secondary">{entry.description}</Text></div>
                <ArrowRightIcon size={16} aria-hidden className="mt-1 shrink-0 text-kumo-subtle transition-transform group-hover:translate-x-1" />
              </div>
            </LayerCard>
          </Link>
        ))}
      </div>
      </section>
      <section aria-labelledby="support-updates" className="relative isolate grid gap-8 py-10 md:grid-cols-3 md:items-center sm:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 -translate-x-1/2 border-y border-kumo-line" style={{ width: backdropWidth ?? "100%" }} />
        <svg aria-hidden focusable="false" className="pointer-events-none absolute top-0 left-1/2 -z-10 h-full max-w-none -translate-x-1/2 text-kumo-line opacity-30" style={{ width: backdropWidth ?? "100%" }} width="100%" height="100%">
          <defs><pattern id="support-updates-hatching" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-2 2L2-2M0 8L8 0M6 10L10 6" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#support-updates-hatching)" />
        </svg>
        <div className="grid gap-6">
        <div className="grid gap-2"><h2 id="support-updates" className="text-2xl font-medium text-kumo-default sm:text-3xl">加入最新社区QQ群</h2><Text variant="secondary">扫码加入交流群，与大家交流产品使用经验。</Text></div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={communityUrl} variant="secondary" icon={<UsersIcon />}>加入群聊</LinkButton>
          <LinkButton href="/console/messages" variant="secondary" icon={<BellIcon />}>账户消息</LinkButton>
          <LinkButton href="/console/products" variant="secondary" icon={<PackageIcon />}>云产品</LinkButton>
        </div>
        </div>
        <a href={communityUrl} aria-label="加入最新社区QQ群" className="flex items-center justify-center focus-visible:outline-2 focus-visible:outline-kumo-ring">
          <svg role="img" aria-label="QQ 群进群二维码" className="h-36 w-36 text-kumo-default" viewBox={`0 0 ${communityQr.size + 8} ${communityQr.size + 8}`} shapeRendering="crispEdges">
            <title>扫描二维码加入 QQ 群</title>
            <path d={communityQrPath} fill="currentColor" />
          </svg>
        </a>
        <div aria-hidden className="hidden items-center justify-center gap-4 text-kumo-subtle md:flex"><BookOpenIcon size={40} weight="light" /><PackageIcon size={40} weight="light" /><SparkleIcon size={40} weight="light" /></div>
      </section>
      <section aria-labelledby="support-topics">
        <LayerCard className="overflow-hidden ">
        <div className="grid gap-3 p-6 sm:p-8"><Text variant="secondary">帮助与指引</Text><h2 id="support-topics" className="text-2xl font-medium text-kumo-default">按主题浏览</h2><Text variant="secondary">从常用功能入口开始，未找到答案时可提交工单。</Text></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, index) => <div key={topic.title} className={`grid content-start gap-5 border-t border-kumo-line p-6 sm:p-8 ${index % 2 ? "sm:border-l" : "sm:border-l-0"} ${index % 3 ? "lg:border-l" : "lg:border-l-0"}`}>
            <Text as="h3" variant="heading">{topic.title}</Text>
            <ul className="grid gap-2">{topic.links.map((link) => <li key={link.label}><Link to={link.href} className="text-base text-kumo-default hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kumo-ring">{link.label}</Link></li>)}</ul>
          </div>)}
        </div>
        </LayerCard>
      </section>
    </div>
  );
}
