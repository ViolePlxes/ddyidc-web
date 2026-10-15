import { Banner, Button, Collapsible, Input, Select } from "@cloudflare/kumo";
import { Badge } from "../../../shared/components/Badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  promoCouponsApi,
  type PromoCouponInput,
  type PromoCouponBatch,
  promoCouponStatus,
  promoCouponEvent,
} from "../../../shared/api/promoCoupons";
import { paymentApi } from "../../../shared/api/payment";
import { getApiMessage } from "../../../shared/api/request";
import { PageState } from "../../../shared/components/PageState";
import { useAuthStore } from "../../../shared/stores/auth";

export function PromoCouponForm({
  open,
  customerId,
}: {
  open: boolean;
  customerId: string;
}) {
  const user = useAuthStore((s) => s.user?.id);
  const client = useQueryClient();
  const defaults = (): PromoCouponInput => ({
    templateId: "1",
    mode: "direct",
    source: "points",
    quantity: 1,
    recipientIds: [customerId],
    claimPoints: 0,
    requestId: crypto.randomUUID(),
  });
  const [form, setForm] = useState<PromoCouponInput>(defaults);
  const [notice, setNotice] = useState("");
  const [created, setCreated] = useState(false);
  const options = useQuery({
    queryKey: ["promo-coupons", "options", user],
    queryFn: promoCouponsApi.options,
    enabled: open,
  });
  const quote = useMutation({ mutationFn: () => promoCouponsApi.quote(form) });
  const reset = () => {
    setForm(defaults());
    quote.reset();
    create.reset();
    setCreated(false);
    setNotice("");
  };
  useEffect(() => {
    setForm(defaults());
    setNotice("");
    setCreated(false);
    quote.reset();
  }, [user, customerId]);
  const change = (patch: Partial<PromoCouponInput>) => {
    setForm((f) => ({ ...f, ...patch }));
    quote.reset();
  };
  const create = useMutation({
    mutationFn: async () => {
      if (!quote.data) throw new Error("请先预览费用");
      const b = await promoCouponsApi.create({
        ...form,
        quote: quote.data.token,
      });
      if (b.status === "awaiting_payment") {
        if (b.source === "balance") await paymentApi.payBalance(b.orderId);
        else await promoCouponsApi.fund(b.id);
      }
      return b;
    },
    onSuccess: async (b) => {
      setCreated(true);
      setNotice(
        b.status === "pending_review"
          ? "已提交审核，本次尚未扣款。审核通过后请在记录中确认出资。"
          : "出资与发券已完成，可在“我发出的券”查看。",
      );
      await client.invalidateQueries({ queryKey: ["promo-coupons"] });
    },
  });
  const q = quote.data;
  const config = options.data?.config;
  const busy = create.isPending || quote.isPending;
  return (
    <Collapsible.Panel keepMounted className="px-1" inert={!open}>
      <div
        className="grid gap-4 pb-4 pt-2"
        aria-label={`给客户 ${customerId} 送优惠券`}
      >
        <p className="text-base text-kumo-subtle">
          给客户ID {customerId}{" "}
          送优惠券，使用自己的积分或余额。收起后保留该客户的草稿。
        </p>
        {!config?.enabled && !options.isLoading ? (
          <Banner
            variant="alert"
            title="配置后可用"
            description="平台尚未开放推广发券，当前可以查看规则。"
          />
        ) : null}
        <fieldset
          disabled={busy || created}
          className="grid gap-4 md:grid-cols-2"
        >
          <Select
            label="优惠券模板"
            value={form.templateId}
            items={(options.data?.templates ?? []).map((t) => ({
              value: t.id,
              label: `${t.name} · 有效${t.validDays}天`,
            }))}
            onValueChange={(v) => change({ templateId: v ?? "" })}
          />
          <Select
            label="出资资产"
            value={form.source}
            items={{ points: "可用积分", balance: "账户余额" }}
            onValueChange={(v) =>
              change({
                source: v === "balance" ? "balance" : "points",
                claimPoints: 0,
              })
            }
          />
          <p className="self-center text-base text-kumo-subtle">
            可用积分 {options.data?.points ?? "—"} · 可用余额 ¥
            {options.data?.balance ?? "—"}
          </p>
        </fieldset>
        {q ? (
          <Banner
            title="费用确认"
            description={`${q.quantity}张${q.name}，满¥${q.minimum}减¥${q.face}；本次${form.source === "points" ? `支出${q.pointCost}积分` : `支出¥${q.balanceCost}`}。${q.reviewRequired ? "先审核，不扣款；通过后再次确认出资。" : "确认后扣除资产并发券。"}未使用券回收后退还原资产，积分保留原有效期。`}
          />
        ) : null}
        {notice ? <Banner title="操作完成" description={notice} /> : null}
        {options.error || quote.error || create.error ? (
          <Banner
            variant="error"
            title="操作未完成"
            description={getApiMessage(
              options.error ?? quote.error ?? create.error,
            )}
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!config?.enabled || busy || created}
            loading={quote.isPending}
            onClick={() => quote.mutate()}
          >
            预览费用
          </Button>
          <Button
            disabled={
              !q || busy || created || Date.parse(q.expiresAt) <= Date.now()
            }
            loading={create.isPending}
            onClick={() => create.mutate()}
          >
            {q?.reviewRequired ? "提交审核" : "确认出资并发券"}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={reset}>
            {created ? "新建批次" : "清空草稿"}
          </Button>
        </div>
      </div>
    </Collapsible.Panel>
  );
}

function BatchRow({ batch }: { batch: PromoCouponBatch }) {
  const user = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [notes, setNotes] = useState("");
  const client = useQueryClient();
  const detail = useQuery({
    queryKey: ["promo-coupons", "detail", user, batch.id],
    queryFn: () => promoCouponsApi.detail(batch.id),
    enabled: open,
    refetchInterval: open && batch.status === "closing" ? 10000 : false,
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["promo-coupons"] });
  const close = useMutation({
    mutationFn: () => promoCouponsApi.close(batch.id, notes.trim()),
    onSuccess: async () => {
      setConfirm(false);
      await refresh();
    },
  });
  const fund = useMutation({
    mutationFn: async () => {
      if (batch.source === "balance")
        await paymentApi.payBalance(batch.orderId);
      else await promoCouponsApi.fund(batch.id);
    },
    onSuccess: refresh,
  });
  const rows = detail.data?.units ?? [];
  const reclaim = rows.filter((u) => ["stock", "claimed"].includes(u.status));
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="border-b border-kumo-hairline py-3 last:border-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <strong className="text-base font-medium">
            {batch.name} · ¥{batch.face}
          </strong>
          <p className="text-base text-kumo-subtle">
            {batch.mode === "direct" ? "指定客户赠券" : "专属领券活动"} ·{" "}
            {batch.quantity}张 · 到期{" "}
            {new Date(batch.expiresAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              batch.status === "active"
                ? "success"
                : batch.status === "pending_review"
                  ? "warning"
                  : "neutral"
            }
          >
            {promoCouponStatus[batch.status] ?? batch.status}
          </Badge>
          <Collapsible.Trigger render={<Button size="sm" variant="ghost" />}>
            {open ? "收起" : "展开"}
          </Collapsible.Trigger>
        </div>
      </div>
      <Collapsible.Panel keepMounted inert={!open} className="pt-3">
        <PageState
          loading={detail.isLoading}
          error={detail.error ? getApiMessage(detail.error) : null}
        >
          <div className="grid gap-3 text-base">
            <p>
              批次 {batch.id} ·{" "}
              {batch.source === "points"
                ? `支出${batch.pointCost}积分 / 已退${batch.refundedPoints}积分`
                : `支出¥${batch.balanceCost} / 已退¥${batch.refundedBalance}`}
            </p>
            {rows.map((u) => (
              <div key={u.id} className="flex flex-wrap justify-between gap-2">
                <span>
                  {u.recipientId !== "0"
                    ? `客户ID ${u.recipientId}`
                    : "待领取库存"}
                </span>
                <Badge variant={u.status === "claimed" ? "success" : "neutral"}>
                  {promoCouponStatus[u.status] ?? u.status}
                </Badge>
              </div>
            ))}
            {batch.status === "awaiting_payment" ? (
              <Banner
                title="确认出资"
                description={`${batch.source === "points" ? `${batch.pointCost}积分` : `¥${batch.balanceCost}`}，确认后按已审核规则发券。`}
              >
                <Button
                  size="sm"
                  loading={fund.isPending}
                  onClick={() => fund.mutate()}
                >
                  确认出资
                </Button>
              </Banner>
            ) : null}
            {["active", "pending_review", "awaiting_payment"].includes(
              batch.status,
            ) && !confirm ? (
              <Button
                className="justify-self-start"
                size="sm"
                variant="secondary"
                onClick={() => setConfirm(true)}
              >
                停止领取 / 回收未使用券
              </Button>
            ) : null}
            {confirm ? (
              <div className="grid gap-3">
                <Banner
                  variant="alert"
                  title="回收确认"
                  description={`当前可回收${reclaim.length}张；原出资人将退还${batch.source === "points" ? `${reclaim.reduce((n, u) => n + u.ownerPoints, 0)}积分` : `¥${reclaim.reduce((n, u) => n + Number(u.ownerBalance), 0).toFixed(2)}`}。领取人自己支付的积分分别退回领取人。已使用券不回收，订单占用券待订单结果再处理，最终金额以后台核算为准。`}
                />
                <Input
                  label="回收原因"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setConfirm(false)}
                  >
                    返回
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!notes.trim()}
                    loading={close.isPending}
                    onClick={() => close.mutate()}
                  >
                    确认回收
                  </Button>
                </div>
              </div>
            ) : null}
            {fund.error || close.error ? (
              <Banner
                variant="error"
                title="操作未完成"
                description={getApiMessage(fund.error ?? close.error)}
              />
            ) : null}
            <p className="text-base text-kumo-subtle">
              处理记录：
              {detail.data?.events
                .map(
                  (e) =>
                    `${new Date(e.createdAt).toLocaleString("zh-CN")} ${promoCouponEvent[e.event] ?? "处理记录"}`,
                )
                .join("；") || "—"}
            </p>
          </div>
        </PageState>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
export function PromoCouponBatches({ search }: { search: string }) {
  const user = useAuthStore((s) => s.user?.id);
  const [page, setPage] = useState(1);
  const rows = useQuery({
    queryKey: ["promo-coupons", "batches", user, page],
    queryFn: () => promoCouponsApi.batches(page),
    refetchInterval: (q) =>
      q.state.data?.list.some((b) =>
        ["closing", "pending_review"].includes(b.status),
      )
        ? 10000
        : false,
  });
  const list =
    rows.data?.list.filter(
      (b) => b.name.includes(search) || b.id.includes(search),
    ) ?? [];
  return (
    <>
      <PageState
        loading={rows.isLoading}
        error={rows.error ? getApiMessage(rows.error) : null}
        empty={!rows.isLoading && !list.length}
        emptyTitle="暂无发券记录"
      >
        {list.map((b) => (
          <BatchRow key={b.id} batch={b} />
        ))}
      </PageState>
      <div className="mt-3 flex justify-between gap-2 text-base text-kumo-subtle">
        <span>共{rows.data?.total ?? 0}个批次</span>
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
            disabled={page * 20 >= (rows.data?.total ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </>
  );
}
