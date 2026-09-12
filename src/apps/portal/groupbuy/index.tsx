import { Badge, LayerCard, LinkButton } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { ClockIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useParams } from "react-router-dom";
import { groupBuyApi, type GroupBuyActivity } from "../../../shared/api/groupbuy";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { useAuthStore } from "../../../shared/stores/auth";

const groupLabels = { two: "2 人团", three: "3 人团", five: "5 人团" } as const;

function price(activity: GroupBuyActivity, kind: keyof typeof groupLabels) {
  const direct = activity[`${kind}Price` as "twoPrice"];
  const discount = activity[`${kind}Discount` as "twoDiscount"];
  return activity.priceMode === 1 ? direct ?? 0 : Math.floor(activity.originalPrice * (100 - (discount ?? 0)) / 100);
}

function actionHref(user: unknown, target: string) {
  return user ? target : `/login?redirect=${encodeURIComponent(target)}`;
}

function ActivityCard({ activity }: { activity: GroupBuyActivity }) {
  const user = useAuthStore((state) => state.user);
  return (
    <LayerCard className="flex min-h-80 flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-10 place-items-center bg-kumo-control text-kumo-brand"><UsersThreeIcon /></div>
        <Badge variant="success">进行中</Badge>
      </div>
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold text-kumo-strong">{activity.productName}</h2>
        <p className="text-kumo-subtle">{activity.slogan || activity.configDescription || "分享给好友一起购买，人数达到后自动开通。"}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {(Object.keys(groupLabels) as Array<keyof typeof groupLabels>).map((kind) => (
          <div key={kind} className="bg-kumo-control p-3">
            <span className="text-xs text-kumo-subtle">{groupLabels[kind]}</span>
            <strong className="block text-kumo-strong">¥{(price(activity, kind) / 100).toFixed(2)}</strong>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-kumo-subtle"><ClockIcon /> 截止 {new Date(activity.endTime).toLocaleString("zh-CN")}</div>
      <div className="mt-auto flex items-end justify-between gap-4 border-t border-kumo-line pt-4">
        <div><span className="text-sm text-kumo-subtle line-through">¥{(activity.originalPrice / 100).toFixed(2)}</span><p className="text-sm text-kumo-subtle">{activity.joinedMembers} 人已参与</p></div>
        <LinkButton href={actionHref(user, `/console/groupbuy/activities/${activity.id}`)}>去开团 / 参团</LinkButton>
      </div>
    </LayerCard>
  );
}

export function GroupBuyMarketplace() {
  const query = useQuery({ queryKey: ["groupbuy", "public", "activities"], queryFn: () => groupBuyApi.publicActivities({ pageSize: 100 }) });
  return (
    <>
      <PageHeader title="拼团活动" description="2、3、5 人团可选，满员后自动生成订单并开通。" />
      <PageState loading={query.isLoading} skeleton="products" error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && (query.data?.list.length ?? 0) === 0} emptyTitle="暂无进行中的拼团活动">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{query.data?.list.map((activity) => <ActivityCard key={activity.id} activity={activity} />)}</div>
      </PageState>
    </>
  );
}

export function GroupBuyPublicShare() {
  const { inviteCode = "" } = useParams();
  const user = useAuthStore((state) => state.user);
  const query = useQuery({ queryKey: ["groupbuy", "share", inviteCode], queryFn: () => groupBuyApi.publicShare(inviteCode), enabled: Boolean(inviteCode) });
  const data = query.data;
  return (
    <PageState loading={query.isLoading} skeleton="detail" error={query.error ? getApiMessage(query.error) : null}>
      {data ? <div className="mx-auto grid max-w-3xl gap-6">
        <PageHeader title={`${data.activity.productName} 拼团分享`} description={data.activity.slogan || "好友正在等你参团。"} />
        <LayerCard className="grid gap-5 p-6">
          <div className="flex flex-wrap items-center gap-2"><Badge variant="success">还差 {Math.max(data.leader.needNum - data.members.length, 0)} 人</Badge><Badge variant="outline">{groupLabels[data.leader.groupType]}</Badge></div>
          <div><span className="text-sm text-kumo-subtle">团长</span><strong className="block text-lg text-kumo-strong">{data.members.find((item) => item.isLeader)?.memberName || "拼团用户"}</strong></div>
          <p className="text-kumo-subtle">拼团将于 {new Date(data.leader.timeoutTime).toLocaleString("zh-CN")} 截止，满员后自动开通。</p>
          <LinkButton href={actionHref(user, `/console/groupbuy/share/${inviteCode}`)} className="w-full">立即参团</LinkButton>
        </LayerCard>
      </div> : null}
    </PageState>
  );
}
