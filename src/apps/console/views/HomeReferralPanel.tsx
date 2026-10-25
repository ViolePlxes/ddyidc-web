import { MiniTrend } from "../../../shared/components/TrendChart";
import { Banner, Button, ClipboardText, LayerCard, Link, Text } from "@cloudflare/kumo";
import { ArrowUpRightIcon, LinkIcon } from "@phosphor-icons/react";
import { formatMoney } from "../../../shared/utils/format";
import { promoInviteState } from "../../../shared/utils/promoInvite";
import { getApiMessage } from "../../../shared/api/request";
import { usePromoQueries } from "./usePromoQueries";
import { PromoInviteDialog } from "./PromoInviteDialog";

export function HomeReferralPanel({kind}:{kind:"earnings"|"link"}) {
  const { config, invite, overview, earnings } = usePromoQueries();
  const current = invite.data?.invite;
  const state = promoInviteState(current, config.data?.inviteEnabled === true, overview.data?.promoLinkPath, window.location.origin);
  const inviteError = config.error ?? invite.error ?? overview.error;
  const loadingInvite = config.isPending || invite.isPending || overview.isPending;
  const money = (value: number | undefined) => value === undefined ? "—" : formatMoney(value);
  const summary = earnings.error ? undefined : earnings.data;
  const title = loadingInvite ? "正在读取优惠码信息" : inviteError ? "优惠码信息读取失败" : state.link ? "分享专属优惠链接" : !config.data?.inviteEnabled ? "优惠码功能暂未开放" : !current ? "设置你的优惠码" : `优惠码${state.status}`;
  const description = state.link ? "复制链接分享给好友，开始积累推广收益。" : current?.rejectReason ? `审核说明：${current.rejectReason}` : current?.status === 0 ? "审核通过并启用后，即可分享专属优惠链接。" : current?.status === 2 ? "当前优惠码已停用，可重新申请。" : "先设置优惠码，即可获取专属优惠链接。";
  const today=summary?.day?Date.parse(`${summary.day}T00:00:00+08:00`):NaN;
  const daily:[number,number][]=Number.isFinite(today)&&summary?.todaySettled!==undefined&&summary?.yesterdaySettled!==undefined?[[today-86400000,summary.yesterdaySettled/100],[today,summary.todaySettled/100]]:[];
  if(kind==="earnings") return <LayerCard className="flex h-full min-h-0 min-w-0 flex-col gap-1 overflow-y-auto bg-kumo-base px-4 pt-3 pb-2 sm:col-span-2 lg:col-span-3">
      <div className="flex items-center justify-between gap-3">
        <Text as="h3" variant="secondary" size="sm">每日收益</Text>
        <Link href="/console/promo" className="inline-flex items-center gap-1 text-sm">我的推广<ArrowUpRightIcon aria-hidden size={14} /></Link>
      </div>
      {daily.length>0?<Text as="p" variant="heading1">{money(summary?.todaySettled)}</Text>:null}
      {daily.length>0?<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
       <Text variant="secondary" size="sm">今日已结算 · 北京时间</Text>
       <Text variant="secondary" size="sm">昨日 {money(summary?.yesterdaySettled)}</Text>
       <Text variant="secondary" size="sm">累计 {money(summary?.settled)}</Text>
      </div>:null}
      <div className="min-h-0 min-w-0 flex-1">
       {earnings.isPending?<Text variant="secondary" size="sm">正在读取收益趋势…</Text>:!earnings.error?<MiniTrend height={90} title="每日已结算收益（元）" values={daily} money/>:null}
      </div>
      {earnings.error ? <div className="grid gap-2"><Banner variant="error" title="收益读取失败" description={getApiMessage(earnings.error)} /><Button variant="secondary" size="sm" onClick={() => void earnings.refetch()}>重试</Button></div> : null}

    </LayerCard>;
  return <LayerCard className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-y-auto bg-kumo-base px-4 pt-3 pb-2">
    <div className="flex items-center gap-2"><LinkIcon size={16}/><Text as="h3" variant="secondary" size="sm">专属优惠链接</Text></div>
    <Text bold>{loadingInvite?"正在读取…":state.link?"分享优惠，获取收益":title}</Text>
    <Text variant="secondary" size="sm">{loadingInvite?"请稍候…":inviteError?getApiMessage(inviteError):description}</Text>
    {current?.pendingCode?<Text variant="secondary" size="sm">优惠码 {current.pendingCode} 正在审核</Text>:null}
    {!loadingInvite&&!inviteError&&state.link?<ClipboardText text={state.link} size="sm" className="w-full min-w-0"/>:null}
    <div className="mt-auto flex flex-wrap gap-2">
      <Link href="/console/promo"><Button variant={state.link?"secondary":"primary"} size="sm">{!current&&!loadingInvite&&!inviteError?"去设置优惠码":"我的推广"}</Button></Link>
      {!loadingInvite&&!inviteError?<PromoInviteDialog invite={current} enabled={config.data?.inviteEnabled===true} review={config.data?.inviteReview===true}/>:null}
      {inviteError?<Button variant="secondary" size="sm" onClick={()=>{void config.refetch();void invite.refetch();void overview.refetch()}}>重试</Button>:null}
    </div>
  </LayerCard>;
}
