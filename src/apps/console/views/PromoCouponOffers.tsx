import { Banner, Button, Collapsible, LayerCard } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  promoCouponsApi,
  type PromoCouponBatch,
} from "../../../shared/api/promoCoupons";
import { getApiMessage } from "../../../shared/api/request";
function Offer({ batch }: { batch: PromoCouponBatch }) {
  const [open, setOpen] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  const client = useQueryClient();
  const claim = useMutation({
    mutationFn: () => promoCouponsApi.claim(batch.id, requestId),
    onSuccess: () => client.invalidateQueries({ queryKey: ["coupons"] }),
  });
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="border-b border-kumo-hairline py-3 last:border-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <strong className="font-medium">{batch.name}</strong>
          <p className="text-base text-kumo-subtle">
            满¥{batch.minimum}减¥{batch.face} · 有效期至
            {new Date(batch.expiresAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
        <Collapsible.Trigger render={<Button size="sm" variant="secondary" />}>
          {open ? "收起" : "领取"}
        </Collapsible.Trigger>
      </div>
      <Collapsible.Panel keepMounted inert={!open} className="grid gap-3 pt-3">
        <p className="text-base">
          {batch.claimPoints
            ? `领取将支出${batch.claimPoints}积分，券回收时按原积分有效期退还。`
            : "本券免费领取，每位直接邀请客户限领一次。"}
        </p>
        <Button
          className="justify-self-start"
          size="sm"
          disabled={claim.isSuccess}
          loading={claim.isPending}
          onClick={() => claim.mutate()}
        >
          {claim.isSuccess ? "已领取" : "确认领取"}
        </Button>
        {claim.error ? (
          <Banner
            variant="error"
            title="领取失败"
            description={getApiMessage(claim.error)}
          />
        ) : null}
        {claim.isSuccess ? (
          <Banner title="已领取" description="优惠券已加入您的券包。" />
        ) : null}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
export function PromoCouponOffers() {
  const [page, setPage] = useState(1);
  const offers = useQuery({
    queryKey: ["promo-coupons", "offers", page],
    queryFn: () => promoCouponsApi.offers(page),
  });
  if (offers.error)
    return (
      <Banner
        variant="error"
        title="专属优惠券读取失败"
        description={getApiMessage(offers.error)}
      />
    );
  if (!offers.data?.list.length) return null;
  return (
    <LayerCard>
      <LayerCard.Secondary>专属优惠券</LayerCard.Secondary>
      <LayerCard.Primary>
        {offers.data.list.map((b) => (
          <Offer key={b.id} batch={b} />
        ))}
        <div className="mt-3 flex gap-2">
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
            disabled={page * 20 >= offers.data.total}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      </LayerCard.Primary>
    </LayerCard>
  );
}

export function PromoCouponNotices() {
  const [open, setOpen] = useState(false);
  const rows = useQuery({
    queryKey: ["promo-coupons", "notices"],
    queryFn: promoCouponsApi.notices,
  });
  if (!rows.data?.length) return null;
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger render={<Button size="sm" variant="ghost" />}>
        优惠券消息 · {rows.data.length}
      </Collapsible.Trigger>
      <Collapsible.Panel keepMounted inert={!open} className="grid gap-3 pt-3">
        {rows.data.map((n) => (
          <Banner
            key={n.id}
            title={n.title}
            description={`${n.content} · ${new Date(n.createdAt).toLocaleString("zh-CN")}`}
          />
        ))}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
