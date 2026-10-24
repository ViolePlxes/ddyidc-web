import { Banner, Button, ClipboardText, Collapsible, Empty, LayerCard, Link, Text } from "@cloudflare/kumo";
import { ArrowUpRightIcon, LinkIcon } from "@phosphor-icons/react";
import { formatMoney } from "../../../shared/utils/format";
import { promoInviteState } from "../../../shared/utils/promoInvite";
import { getApiMessage } from "../../../shared/api/request";
import { usePromoQueries } from "./usePromoQueries";
import { PromoInviteDialog } from "./PromoInviteDialog";

export function HomeReferralPanel() {
  const { config, invite, overview, earnings } = usePromoQueries();
  const current = invite.data?.invite;
  const state = promoInviteState(current, config.data?.inviteEnabled === true, overview.data?.promoLinkPath, window.location.origin);
  const inviteError = config.error ?? invite.error ?? overview.error;
  const loadingInvite = config.isPending || invite.isPending || overview.isPending;
  const money = (value: number | undefined) => value === undefined ? "—" : formatMoney(value);
  const summary = earnings.error ? undefined : earnings.data;
  const title = loadingInvite ? "正在读取邀请信息" : inviteError ? "邀请信息读取失败" : state.link ? "分享专属邀请链接" : !config.data?.inviteEnabled ? "邀请功能暂未开放" : !current ? "设置你的邀请码" : `邀请码${state.status}`;
  const description = state.link ? "复制链接分享给好友，开始积累推广收益。" : current?.rejectReason ? `审核说明：${current.rejectReason}` : current?.status === 0 ? "审核通过并启用后，即可分享专属邀请链接。" : current?.status === 2 ? "当前邀请码已停用，可重新申请。" : "先设置邀请码，即可获取专属邀请链接。";
  return <aside aria-label="推广收益" className="grid min-w-0 content-start gap-4 lg:col-start-2 lg:row-start-3">
    <LayerCard className="grid gap-5 px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <Text as="h2" variant="heading">每日收益</Text>
        <Link href="/console/promo" className="inline-flex items-center gap-1">我的推广<ArrowUpRightIcon aria-hidden size={14} /></Link>
      </div>
      <div className="grid gap-1">
        <Text variant="secondary">今日已结算收益（元）</Text>
        <Text as="p" variant="heading" size="lg">{money(summary?.todaySettled)}</Text>
        <Text variant="secondary">按北京时间统计 · {summary?.day ?? "每日更新"}</Text>
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <div className="grid gap-1"><dt className="text-sm text-kumo-subtle">昨日已结算（元）</dt><dd className="text-sm font-medium tabular-nums">{money(summary?.yesterdaySettled)}</dd></div>
        <div className="grid gap-1"><dt className="text-sm text-kumo-subtle">累计已结算（元）</dt><dd className="text-sm font-medium tabular-nums">{money(summary?.settled)}</dd></div>
      </dl>
      {earnings.error ? <div className="grid gap-2"><Banner variant="error" title="收益读取失败" description={getApiMessage(earnings.error)} /><Button variant="secondary" size="sm" onClick={() => void earnings.refetch()}>重试</Button></div> : null}
      <Collapsible.Root>
        <Collapsible.DefaultTrigger>如何获得推广收益？</Collapsible.DefaultTrigger>
        <Collapsible.DefaultPanel>
          <div className="grid gap-3 py-2 text-sm text-kumo-subtle">
            <p>在“我的推广”设置邀请码，将专属邀请链接分享给好友。</p>
            <p>好友通过链接注册并完成符合规则的订单后，可获得推广奖励。每日收益按北京时间的实际结算时间统计，仅包含当前仍为已结算状态的奖励，不含待结算、冻结或已回收奖励。</p>
            <p>金额与“我的推广”共用数据，具体奖励、结算状态及明细以推广规则和记录为准。</p>
            <Link href="/console/promo">查看推广规则与明细</Link>
          </div>
        </Collapsible.DefaultPanel>
      </Collapsible.Root>
    </LayerCard>
    <div className="min-w-0">
      <Empty size="sm" icon={<LinkIcon size={32} />} title={title}
        description={loadingInvite ? "请稍候…" : inviteError ? getApiMessage(inviteError) : description}
        contents={<div className="grid w-full min-w-0 gap-4">
          {!loadingInvite && !inviteError && state.link ? <ClipboardText text={state.link} className="w-full min-w-0" /> : null}
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/console/promo"><Button variant={state.link ? "secondary" : "primary"}>{!current && !loadingInvite && !inviteError ? "去设置邀请码" : "查看我的推广"}</Button></Link>
            {!loadingInvite && !inviteError ? <PromoInviteDialog invite={current} enabled={config.data?.inviteEnabled === true} review={config.data?.inviteReview === true} /> : null}
            {inviteError ? <Button variant="secondary" onClick={() => { void config.refetch(); void invite.refetch(); void overview.refetch(); }}>重试</Button> : null}
          </div>
        </div>} />
    </div>
  </aside>;
}
