import { Badge } from "../../../shared/components/Badge";
import {
  Banner,
  Button,
  ClipboardText,
  Input,
  LayerCard,
  Tabs,

  Collapsible,
} from "@cloudflare/kumo";
import { PromoCouponForm, PromoCouponBatches } from "./PromoCouponPanel";
import { pointsApi } from "../../../shared/api/points";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "../../../shared/stores/auth";
import { consoleApi } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { formatMoney } from "../../../shared/utils/format";
import { usePromoQueries } from "./usePromoQueries";
import { PromoInviteDialog } from "./PromoInviteDialog";
import { promoInviteState } from "../../../shared/utils/promoInvite";

function CustomerCouponRow({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [visited, setVisited] = useState(false);
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (value) setVisited(true);
      }}
    >
      <div
        className="border-b border-kumo-hairline last:border-0"
        data-coupon-customer={customerId}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-1 py-2.5">
          <span className="truncate font-medium text-kumo-default">
            {customerId}
          </span>
          <Collapsible.Trigger render={<Button size="sm" variant="ghost" />}>
            {open ? "收起" : "送优惠券"}
          </Collapsible.Trigger>
        </div>
        {visited ? (
          <PromoCouponForm open={open} customerId={customerId} />
        ) : null}
      </div>
    </Collapsible.Root>
  );
}

export function Promo() {
  const userId = useAuthStore((s) => s.user?.id);
  const [expandedCustomer, setExpandedCustomer] = useState<string>();
  const [view, setView] = useState("customers");
  const [search, setSearch] = useState("");
  const [rewardPage, setRewardPage] = useState(1);
  const [referralPage, setReferralPage] = useState(1);
  const { config, invite, overview, earnings } = usePromoQueries();
  const records = useQuery({
    queryKey: ["promo", userId, "records", rewardPage],
    queryFn: () => consoleApi.rewardRecords(rewardPage, 20),
  });
  const children = useQuery({
    queryKey: ["points", "referrals", referralPage],
    queryFn: () => pointsApi.referrals(referralPage),
  });
  const rules = useQuery({
    queryKey: ["points", "public-rules"],
    queryFn: pointsApi.rules,
  });
  const data = overview.data;
  const summary = earnings.data;
  const currentInvite = invite.data?.invite;
  const inviteCode = currentInvite?.code || data?.inviteCode;
  const inviteState = promoInviteState(currentInvite, config.data?.inviteEnabled === true, data?.promoLinkPath, window.location.origin);
  const canApply = inviteState.canApply;
  const inviteStatus = currentInvite
    ? ({ 0: "待审核", 1: "已通过", 2: "已停用", 3: "已驳回" }[
        currentInvite.status
      ] ?? "状态未知")
    : "状态读取中";
  const link = inviteState.link;
  const metrics = [
    { label: "今日已结算收益", value: summary?.todaySettled === undefined ? "—" : formatMoney(summary.todaySettled), hint: "按北京时间的实际结算时间统计" },
    { label: "昨日已结算收益", value: summary?.yesterdaySettled === undefined ? "—" : formatMoney(summary.yesterdaySettled), hint: "不含待结算、冻结及已回收奖励" },
    { label: "已推广客户", value: String(data?.registrations ?? 0), hint: "" },
    {
      label: "已结算收益",
      value: formatMoney(summary?.settled ?? 0),
      hint: "仅统计成功结算的奖励",
    },
    {
      label: "推广消费",
      value: formatMoney(data?.spendTotal ?? 0),
      hint: `推广充值 ${formatMoney(data?.rechargeTotal ?? 0)}`,
    },
  ];
  const visibleCustomers = (children.data?.list ?? []).filter((c) =>
    c.userId.includes(search.trim()),
  );
  const visibleRewards = (records.data?.list ?? []).filter(
    (r) => r.status === 1 && r.userId.includes(search.trim()),
  );
  const page = view === "customers" ? referralPage : rewardPage;
  const total =
    view === "customers"
      ? (children.data?.total ?? 0)
      : (records.data?.total ?? 0);
  const setPage = view === "customers" ? setReferralPage : setRewardPage;
  const loading =
    config.isLoading || invite.isLoading ||
    overview.isLoading ||
    earnings.isLoading ||
    records.isLoading;
  const error =
    config.error ?? invite.error ?? overview.error ?? earnings.error ?? records.error;

  return (
    <>
      <PageHeader
        title="我的推广"
        description="优惠码、推广数据与收益均来自实时营销接口。"
      />
      <PageState loading={loading} error={error ? getApiMessage(error) : null}>
        <div className="grid gap-5">
          {inviteCode ? (
            <LayerCard className=" grid min-w-0 gap-4 px-5 py-4 md:grid-cols-[auto_minmax(0,1fr)]">
              <div className="grid gap-1">
                <span className="text-base text-kumo-subtle">
                  专属优惠码 · {inviteStatus}
                </span>
                <ClipboardText text={inviteCode} />
                {currentInvite?.rejectReason ? (
                  <p className="text-base text-kumo-subtle">
                    审核说明：{currentInvite.rejectReason}
                  </p>
                ) : null}
              </div>
              <div className="grid min-w-0 content-start gap-1">
                <span className="text-base text-kumo-subtle">分享链接</span>
                {link && currentInvite?.status === 1 ? (
                  <ClipboardText text={link} className="w-full min-w-0" />
                ) : (
                  <span className="text-base text-kumo-subtle">
                    优惠码通过审核并启用后可分享
                  </span>
                )}
              </div>
            </LayerCard>
          ) : null}
          {currentInvite?.pendingCode ? <Banner title={`自定义优惠码 ${currentInvite.pendingCode} 正在审核`} description="审核期间当前优惠码与优惠链接仍可使用。" /> : null}
          {canApply ? (
            <LayerCard className=" grid gap-4 px-5 py-4">
              <div className="justify-self-start"><PromoInviteDialog invite={currentInvite} enabled={config.data?.inviteEnabled === true} review={config.data?.inviteReview === true} triggerLabel="自定义优惠码" /></div>
              {!config.data?.inviteEnabled ? (
                <Banner
                  variant="alert"
                  title="优惠码申请已关闭"
                  description="营销公共配置当前未开放优惠码申请。"
                />
              ) : null}
            </LayerCard>
          ) : null}
          <MetricGrid metrics={metrics} />
          <LayerCard className=" grid gap-3 px-5 py-4">
            <h2 className="font-semibold text-kumo-strong">积分推广奖励</h2>
            <p className="text-base text-kumo-subtle">
              邀请注册、好友首充和消费奖励自动计入积分账户，可在积分商城兑换余额。当前规则由后台配置。
            </p>
            {rules.data
              ?.filter((r) =>
                ["invite", "invite_first_recharge", "invite_order"].includes(
                  r.event,
                ),
              )
              .map((r) => (
                <p key={r.id}>
                  {r.name}：
                  {r.type === "ratio"
                    ? `每消费1元返 ${r.ratio / 100} 积分`
                    : `${r.pointsFixed} 积分`}
                </p>
              ))}
            {rules.error ? (
              <Banner
                variant="error"
                title="奖励规则读取失败"
                description={getApiMessage(rules.error)}
              />
            ) : null}
          </LayerCard>
          <LayerCard>
            <LayerCard.Secondary className="flex items-center justify-between gap-3">
              推广客户与收益
            </LayerCard.Secondary>
            <LayerCard.Primary>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <Input
                  size="sm"
                  aria-label="筛选用户ID"
                  placeholder="筛选本页用户 ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 w-full flex-none lg:w-auto lg:flex-1"
                />
                <Tabs
                  variant="segmented"
                  size="sm"
                  tabs={[
                    { value: "customers", label: "邀请客户" },
                    { value: "rewards", label: "已结算收益" },
                    { value: "coupons", label: "我发出的券" },
                  ]}
                  value={view}
                  onValueChange={(v) => {
                    setView(v);
                    setSearch("");
                  }}
                />
              </div>
              {view === "coupons" ? (
                <PromoCouponBatches search={search} />
              ) : null}
              <div hidden={view === "coupons"} inert={view === "coupons"}>
                {view === "customers" && !visibleCustomers.length ? (
                  <PageState
                    children={null}
                    loading={children.isLoading}
                    error={
                      children.error ? getApiMessage(children.error) : null
                    }
                    empty={!children.isLoading && !children.error}
                    emptyTitle="暂无匹配的邀请客户"
                  />
                ) : null}
                {view === "rewards" && !visibleRewards.length ? (
                  <PageState
                    children={null}
                    loading={records.isLoading}
                    error={records.error ? getApiMessage(records.error) : null}
                    empty={!records.isLoading && !records.error}
                    emptyTitle="暂无已结算收益"
                  />
                ) : null}
                <div className="min-w-0 text-base">
                  <div
                    className={`grid gap-x-4 border-b border-kumo-fill px-1 pb-2 text-base font-medium text-kumo-subtle ${view === "customers" ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(12rem,1fr)_auto_auto]"}`}
                  >
                    <span>用户 ID</span>
                    {view === "customers" ? (
                      <span className="text-right">操作</span>
                    ) : (
                      <>
                        <span className="w-28 text-right">收益金额</span>
                        <span className="hidden w-40 text-right sm:block">
                          结算时间
                        </span>
                      </>
                    )}
                  </div>
                  <div
                    hidden={view !== "customers"}
                    inert={view !== "customers"}
                  >
                    {visibleCustomers.map((c) => (
                      <CustomerCouponRow
                        key={`${userId}:${c.userId}`}
                        customerId={c.userId}
                        open={expandedCustomer === `${userId}:${c.userId}`}
                        onOpenChange={(open) =>
                          setExpandedCustomer(
                            open ? `${userId}:${c.userId}` : undefined,
                          )
                        }
                      />
                    ))}
                  </div>
                  <div hidden={view !== "rewards"} inert={view !== "rewards"}>
                    {visibleRewards.map((r) => (
                      <div
                        key={r.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-kumo-hairline px-1 py-2.5 last:border-0 sm:grid-cols-[minmax(12rem,1fr)_auto_auto]"
                      >
                        <span className="min-w-0 font-medium text-kumo-default">
                          <span className="block truncate">{r.userId}</span>
                          <span className="block text-base text-kumo-subtle sm:hidden">
                            {r.settledAt
                              ? new Date(r.settledAt).toLocaleString("zh-CN")
                              : "—"}
                          </span>
                        </span>
                        <span className="flex w-28 justify-end">
                          <Badge variant="success">
                            {formatMoney(r.amount)}
                          </Badge>
                        </span>
                        <span className="hidden w-40 text-right text-kumo-subtle sm:block">
                          {r.settledAt
                            ? new Date(r.settledAt).toLocaleString("zh-CN")
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-base text-kumo-subtle">
                  <span>
                    共 {total} 条 · 本页显示{" "}
                    {view === "customers"
                      ? visibleCustomers.length
                      : visibleRewards.length}{" "}
                    条
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page * 20 >= total}
                      onClick={() => setPage(page + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              </div>
            </LayerCard.Primary>
          </LayerCard>
        </div>
      </PageState>
    </>
  );
}
