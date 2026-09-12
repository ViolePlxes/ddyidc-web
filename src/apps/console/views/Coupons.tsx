import { Badge, Banner, Button, Dialog, Input, LayerCard, Pagination, Tabs } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { consoleApi } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { useCoupons } from "../../../shared/hooks/useConsoleData";
import { formatMoney } from "../../../shared/utils/format";

const statusValues: Record<string, number> = { available: 0, used: 1, expired: 2 };

function couponValue(type: number, faceValue: number, discountRate: number) {
  return type === 1 ? formatMoney(faceValue) : `${discountRate} 折`;
}

export function Coupons() {
  const [tab, setTab] = useState("available");
  const [page, setPage] = useState(1);
  const [claimCode, setClaimCode] = useState("");
  const [notice, setNotice] = useState("");
  const queryClient = useQueryClient();
  const coupons = useCoupons(statusValues[tab] ?? 0, page);
  const config = useQuery({ queryKey: ["marketing", "public-config"], queryFn: consoleApi.marketingConfig });
  const center = useQuery({ queryKey: ["coupons", "claim-center"], queryFn: consoleApi.claimCenter });
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["coupons"] }),
      queryClient.invalidateQueries({ queryKey: ["marketing", "public-config"] }),
    ]);
  };
  const claim = useMutation({
    mutationFn: consoleApi.claimCoupon,
    onSuccess: async (coupon) => { setNotice(`已领取优惠券：${coupon.name}`); await refresh(); },
  });
  const redeem = useMutation({
    mutationFn: consoleApi.claimCode,
    onSuccess: async (coupon) => { setNotice(`兑换成功：${coupon.name}`); setClaimCode(""); await refresh(); },
  });
  const rows = coupons.data?.list ?? [];

  return (
    <>
      <PageHeader
        title="优惠券"
        description="优惠券状态、领券中心和兑换结果均来自营销接口。"
        actions={
          <Dialog.Root>
            <Dialog.Trigger render={<Button disabled={!config.data?.couponSelfClaim}>领券中心</Button>} />
            <Dialog className="grid max-h-[80vh] gap-5 overflow-y-auto p-6">
              <div className="flex justify-between"><div><Dialog.Title className="text-xl font-semibold">领券中心</Dialog.Title><Dialog.Description className="text-kumo-subtle">仅展示当前账号可领取的真实优惠券。</Dialog.Description></div><Dialog.Close render={<Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" />} /></div>
              <PageState loading={center.isLoading} skeleton="cards" error={center.error ? getApiMessage(center.error) : null} empty={!center.isLoading && !center.error && (center.data?.length ?? 0) === 0} emptyTitle="暂无可领优惠券">
                <div className="grid gap-3" data-animate-list>
                  {(center.data ?? []).map((coupon) => (
                    <LayerCard key={coupon.id} className="flex items-center justify-between gap-4 p-4">
                      <div><strong className="text-kumo-strong">{coupon.name}</strong><p className="text-sm text-kumo-subtle">满 {formatMoney(coupon.minAmount)} 可用 · 剩余 {coupon.remaining}</p></div>
                      <Button size="sm" loading={claim.isPending && claim.variables === coupon.id} disabled={coupon.userClaimed >= coupon.perUserLimit} onClick={() => claim.mutate(coupon.id)}>{coupon.userClaimed >= coupon.perUserLimit ? "已达上限" : "领取"}</Button>
                    </LayerCard>
                  ))}
                </div>
              </PageState>
            </Dialog>
          </Dialog.Root>
        }
      />
      {!config.isLoading && !config.data?.couponSelfClaim ? <Banner variant="alert" title="自主领券已关闭" description="营销公共配置当前禁止用户自主领券。" /> : null}
      {notice ? <Banner title="操作成功" description={notice} /> : null}
      {claim.error || redeem.error ? <Banner variant="error" title="优惠券操作失败" description={getApiMessage(claim.error ?? redeem.error)} /> : null}
      <LayerCard className="flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-64 flex-1"><Input label="优惠券兑换码" value={claimCode} onChange={(event) => setClaimCode(event.target.value)} placeholder="请输入兑换码" /></div>
        <Button variant="secondary" loading={redeem.isPending} disabled={!claimCode.trim()} onClick={() => redeem.mutate(claimCode.trim())}>兑换</Button>
      </LayerCard>
      <Tabs
        variant="underline"
        tabs={[{ value: "available", label: "可用" }, { value: "used", label: "已使用" }, { value: "expired", label: "已过期" }]}
        value={tab}
        onValueChange={(value) => { setTab(value); setPage(1); }}
      />
      <PageState loading={coupons.isLoading} skeleton="cards" error={coupons.error ? getApiMessage(coupons.error) : null} empty={!coupons.isLoading && !coupons.error && rows.length === 0} emptyTitle="暂无优惠券">
        <div className="grid gap-4">
          <section className="grid gap-4 md:grid-cols-2" data-animate-list>
            {rows.map((coupon) => (
              <LayerCard key={coupon.id} className="grid gap-4 p-5">
                <div className="flex justify-between gap-4"><div><h2 className="text-lg font-semibold text-kumo-strong">{coupon.name}</h2><p className="text-sm text-kumo-subtle">满 {formatMoney(coupon.minAmount)} 可用</p></div><strong className="text-3xl text-kumo-brand">{couponValue(coupon.type, coupon.faceValue, coupon.discountRate)}</strong></div>
                <div className="flex items-center justify-between border-t border-kumo-line pt-4"><span className="text-sm text-kumo-subtle">有效期至 {coupon.expireAt}</span><Badge variant={tab === "available" ? "success" : "secondary"}>{tab === "available" ? "可使用" : tab === "used" ? "已使用" : "已过期"}</Badge></div>
              </LayerCard>
            ))}
          </section>
          {(coupons.data?.total ?? 0) > 10 ? <Pagination page={page} setPage={setPage} perPage={10} totalCount={coupons.data?.total ?? 0} /> : null}
        </div>
      </PageState>
    </>
  );
}
