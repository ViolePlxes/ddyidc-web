import { Banner, Button, ClipboardText, Input, LayerCard } from "@cloudflare/kumo";
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
  const queryClient = useQueryClient();
  const config = useQuery({ queryKey: ["marketing", "public-config"], queryFn: consoleApi.marketingConfig });
  const invite = useQuery({ queryKey: ["promo", "invite"], queryFn: consoleApi.invite });
  const overview = useQuery({ queryKey: ["promo", "overview"], queryFn: consoleApi.promoOverview });
  const earnings = useQuery({ queryKey: ["promo", "earnings"], queryFn: consoleApi.earnings });
  const records = useQuery({ queryKey: ["promo", "records"], queryFn: () => consoleApi.rewardRecords() });
  const create = useMutation({
    mutationFn: () => consoleApi.createInvite(customCode.trim()),
    onSuccess: async () => { setCustomCode(""); await queryClient.invalidateQueries({ queryKey: ["promo"] }); },
  });
  const data = overview.data;
  const summary = earnings.data;
  const inviteCode = invite.data?.invite?.code || data?.inviteCode;
  const link = data?.promoLinkPath ? `${window.location.origin}${data.promoLinkPath}` : "";
  const metrics = [
    { label: "已邀请客户", value: String(data?.registrations ?? 0), hint: `一级 ${invite.data?.stats.level1 ?? 0} · 二级 ${invite.data?.stats.level2 ?? 0} · 三级 ${invite.data?.stats.level3 ?? 0}` },
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
      <PageHeader title="我的推广" description="邀请码、推广数据与收益均来自实时营销接口。" />
      <PageState loading={loading} skeleton="dashboard" error={error ? getApiMessage(error) : null}>
        <div className="grid gap-5">
          {inviteCode ? (
            <LayerCard className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="grid gap-1"><span className="text-sm text-kumo-subtle">专属邀请码</span><ClipboardText text={inviteCode} /></div>
              <Button variant="secondary" icon={<CopyIcon />} disabled={!link} onClick={() => { void navigator.clipboard.writeText(link); setCopied(true); }}>{copied ? "已复制" : "复制邀请链接"}</Button>
            </LayerCard>
          ) : (
            <LayerCard className="grid gap-4 p-5">
              <Input label="自定义邀请码（可选）" value={customCode} onChange={(event) => setCustomCode(event.target.value)} disabled={!config.data?.inviteEnabled} />
              <Button className="justify-self-start" loading={create.isPending} disabled={!config.data?.inviteEnabled} onClick={() => create.mutate()}>生成邀请码</Button>
              {!config.data?.inviteEnabled ? <Banner variant="alert" title="邀请码申请已关闭" description="营销公共配置当前未开放邀请码申请。" /> : null}
            </LayerCard>
          )}
          {create.error ? <Banner variant="error" title="邀请码生成失败" description={getApiMessage(create.error)} /> : null}
          <MetricGrid metrics={metrics} />
          <PageState empty={!records.isLoading && !records.error && rows.length === 0} emptyTitle="暂无收益记录">
            <DataTable rows={rows} primaryLabel="收益来源" secondaryLabel="关联单号" />
          </PageState>
        </div>
      </PageState>
    </>
  );
}
