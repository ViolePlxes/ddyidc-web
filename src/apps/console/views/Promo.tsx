import { Banner, Button, ClipboardText, Input, LayerCard, Table } from "@cloudflare/kumo";
import { pointsApi } from "../../../shared/api/points";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { consoleApi } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { DataTable, type DataRow } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { formatMoney } from "../../../shared/utils/format";

export function Promo() {
  const [customCode, setCustomCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [referralPage, setReferralPage] = useState(1);
  const queryClient = useQueryClient();
  const config = useQuery({ queryKey: ["marketing", "public-config"], queryFn: consoleApi.marketingConfig });
  const invite = useQuery({ queryKey: ["promo", "invite"], queryFn: consoleApi.invite });
  const overview = useQuery({ queryKey: ["promo", "overview"], queryFn: consoleApi.promoOverview });
  const earnings = useQuery({ queryKey: ["promo", "earnings"], queryFn: consoleApi.earnings });
  const records = useQuery({ queryKey: ["promo", "records"], queryFn: () => consoleApi.rewardRecords() });
  const children = useQuery({ queryKey: ["points", "referrals", referralPage], queryFn: () => pointsApi.referrals(referralPage) });
  const rules = useQuery({ queryKey: ["points", "public-rules"], queryFn: pointsApi.rules });
  const create = useMutation({
    mutationFn: () => consoleApi.createInvite(customCode.trim()),
    onSuccess: async () => { setCustomCode(""); await queryClient.invalidateQueries({ queryKey: ["promo"] }); },
  });
  const data = overview.data;
  const summary = earnings.data;
  const currentInvite = invite.data?.invite;
  const inviteCode = currentInvite?.code || data?.inviteCode;
  const canApply = !currentInvite || currentInvite.status === 2 || currentInvite.status === 3;
  const inviteStatus = currentInvite ? ({ 0: "待审核", 1: "已通过", 2: "已停用", 3: "已驳回" }[currentInvite.status] ?? "状态未知") : "状态读取中";
  const link = data?.promoLinkPath ? `${window.location.origin}${data.promoLinkPath}` : "";
  const metrics = [
    { label: "已推广客户", value: String(data?.registrations ?? 0), hint: `一级 ${invite.data?.stats.level1 ?? 0} · 二级 ${invite.data?.stats.level2 ?? 0} · 三级 ${invite.data?.stats.level3 ?? 0}` },
    { label: "待结算收益", value: formatMoney(summary?.pending ?? 0), hint: "来自真实奖励记录" },
    { label: "累计收益", value: formatMoney(summary?.total ?? 0), hint: `已结算 ${formatMoney(summary?.settled ?? 0)}` },
    { label: "推广消费", value: formatMoney(data?.spendTotal ?? 0), hint: `推广充值 ${formatMoney(data?.rechargeTotal ?? 0)}` },
  ];
  const rows: DataRow[] = (records.data?.list ?? []).map((record) => ({
    id: record.id,
    primary: record.bizType === 2 ? `充值奖励 · ${record.username}` : `订单奖励 · ${record.username}`,
    secondary: record.orderNo,
    meta: `${record.createdAt} · ${record.level} 级`,
    amount: formatMoney(record.amount),
    status: record.status === 1 ? "paid" : "pending",
  }));
  const loading = invite.isLoading || overview.isLoading || earnings.isLoading || records.isLoading;
  const error = invite.error ?? overview.error ?? earnings.error ?? records.error;

  return (
    <>
      <PageHeader title="我的推广" description="优惠码、推广数据与收益均来自实时营销接口。" />
      <PageState loading={loading} error={error ? getApiMessage(error) : null}>
        <div className="grid gap-5">
          {inviteCode ? (
            <LayerCard className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="grid gap-1"><span className="text-sm text-kumo-subtle">专属优惠码 · {inviteStatus}</span><ClipboardText text={inviteCode} />{currentInvite?.rejectReason ? <p className="text-sm text-kumo-subtle">审核说明：{currentInvite.rejectReason}</p> : null}</div>
              <Button variant="secondary" icon={<CopyIcon />} disabled={!link || currentInvite?.status !== 1} onClick={() => { void navigator.clipboard.writeText(link); setCopied(true); }}>{copied ? "已复制" : "复制分享链接"}</Button>
            </LayerCard>
          ) : null}
          {canApply ? (
            <LayerCard className="grid gap-4 p-4">
              <Input label="自定义优惠码（可选）" value={customCode} onChange={(event) => setCustomCode(event.target.value)} disabled={!config.data?.inviteEnabled} />
              <Button className="justify-self-start" loading={create.isPending} disabled={!config.data?.inviteEnabled} onClick={() => create.mutate()}>{currentInvite ? "重新申请优惠码" : "生成优惠码"}</Button>
              {!config.data?.inviteEnabled ? <Banner variant="alert" title="优惠码申请已关闭" description="营销公共配置当前未开放优惠码申请。" /> : null}
            </LayerCard>
          ) : null}
          {create.error ? <Banner variant="error" title="优惠码生成失败" description={getApiMessage(create.error)} /> : null}
          <MetricGrid metrics={metrics} />
          <LayerCard >
            <LayerCard.Secondary><h2 className="font-semibold text-kumo-strong">积分推广奖励</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-3">
            <p className="text-sm text-kumo-subtle">邀请注册、好友首充和消费奖励自动计入积分账户，可在积分商城兑换余额。当前规则由后台配置。</p>
            {rules.data?.filter(r=>["invite","invite_first_recharge","invite_order"].includes(r.event)).map(r=><p key={r.id}>{r.name}：{r.type==="ratio"?`每消费1元返 ${r.ratio/100} 积分`:`${r.pointsFixed} 积分`}</p>)}
            {rules.error?<Banner variant="error" title="奖励规则读取失败" description={getApiMessage(rules.error)}/>:null}
          </LayerCard.Primary></LayerCard>
          <PageState loading={children.isLoading} error={children.error?getApiMessage(children.error):null} empty={!children.isLoading&&!children.data?.list.length} emptyTitle="暂无邀请的用户">
            <LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>下级用户</Table.Head><Table.Head>注册时间</Table.Head><Table.Head>消费金额</Table.Head><Table.Head>充值金额</Table.Head></Table.Row></Table.Header><Table.Body>{children.data?.list.map(c=><Table.Row key={c.userId}><Table.Cell>用户 {c.userId}</Table.Cell><Table.Cell>{new Date(c.registeredAt).toLocaleString("zh-CN")}</Table.Cell><Table.Cell>¥ {c.spendYuan}</Table.Cell><Table.Cell>¥ {c.rechargeYuan}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
          </PageState>
          <div className="flex justify-between"><Button variant="secondary" disabled={referralPage===1} onClick={()=>setReferralPage(referralPage-1)}>上一页</Button><span>共 {children.data?.total??0} 位下级用户</span><Button variant="secondary" disabled={referralPage*20>=(children.data?.total??0)} onClick={()=>setReferralPage(referralPage+1)}>下一页</Button></div>
          <PageState empty={!records.isLoading && !records.error && rows.length === 0} emptyTitle="暂无收益记录">
            <DataTable rows={rows} primaryLabel="收益来源" secondaryLabel="关联单号" />
          </PageState>
        </div>
      </PageState>
    </>
  );
}
