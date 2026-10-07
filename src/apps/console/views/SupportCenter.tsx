import { Empty, LayerCard, LinkButton, Text } from "@cloudflare/kumo";
import { ArrowLeftIcon, ArrowRightIcon, FlagIcon, TrayIcon, SparkleIcon, TicketIcon, UsersIcon } from "@phosphor-icons/react";
import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../../shared/components/PageHeader";

const entries = [
  { title: "我的工单", description: "查看和管理待处理和已解决的支持工单", href: "/console/tickets", icon: TrayIcon },
  { title: "提交工单", description: "为您的问题创建新的支持工单", href: "/console/tickets/create", icon: TicketIcon },
  { title: "询问 AI", description: "从 AI 助手获取问题解答", href: "/console/help?topic=ai", icon: SparkleIcon, topic: "ai", empty: "AI 助手暂未开放，您可以提交工单获取帮助。" },
  { title: "举报滥用", description: "反馈滥用行为与安全问题", href: "/console/help?topic=abuse", icon: FlagIcon, topic: "abuse", empty: "专用举报入口暂未开放，请通过工单反馈相关问题。" },
  { title: "询问社区", description: "与其他用户交流问题和经验", href: "/console/help?topic=community", icon: UsersIcon, topic: "community", empty: "社区暂未开放，您可以提交工单获取帮助。" },
];

export function SupportCenter() {
  const [params] = useSearchParams();
  const selected = entries.find((entry) => entry.topic && entry.topic === params.get("topic"));
  if (selected) return (
    <div className="mx-auto grid w-full min-w-0 max-w-[700px] gap-5">
      <PageHeader title={selected.title} actions={<LinkButton href="/console/help" variant="secondary" icon={<ArrowLeftIcon />}>返回支持中心</LinkButton>} />
      <LayerCard className="p-4 sm:p-4">
        <Empty icon={<selected.icon />} title="暂未开放" description={selected.empty} />
        <div className="mt-5 flex justify-center"><LinkButton href="/console/tickets/create">提交工单</LinkButton></div>
      </LayerCard>
    </div>
  );
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-8 py-5">
      <div className="text-center"><Text as="h1" variant="heading" size="lg">我们可以为您提供什么帮助？</Text></div>
      <div className="grid gap-3 sm:grid-cols-6">
        {entries.map((entry, index) => (
          <Link key={entry.title} to={entry.href} className={`group min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kumo-ring ${index < 2 ? "sm:col-span-3" : "sm:col-span-2"}`}>
            <LayerCard className="h-full">
              <LayerCard.Secondary className="justify-between">
                <div className="flex items-center gap-2"><entry.icon size={20} /><Text as="h2">{entry.title}</Text></div>
                <ArrowRightIcon className="shrink-0" />
              </LayerCard.Secondary>
              <LayerCard.Primary className="flex-1"><Text variant="secondary">{entry.description}</Text></LayerCard.Primary>
            </LayerCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
