import {
  Banner,
  Button,
  Collapsible,
  Input,
  LayerCard,
  Switch,
  Tabs,
} from "@cloudflare/kumo";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminPromoCouponsApi as api,
  type PromoCouponConfig,
  type PromoCouponBatch,
  type PromoCouponTemplate,
  type PromoCouponPermission,
} from "../../../shared/api/promoCoupons";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { Badge } from "../../../shared/components/Badge";
import { getApiMessage } from "../../../shared/api/request";
import {
  promoCouponStatus,
  promoCouponEvent,
} from "../../../shared/api/promoCoupons";
function PermissionForm() {
  const rows = useQuery({
    queryKey: ["admin", "promo-coupons", "permissions"],
    queryFn: api.permissions,
  });
  const client = useQueryClient();
  const [form, setForm] = useState<PromoCouponPermission>({
    adminId: "",
    canView: true,
    canReview: false,
    canClose: false,
    canRetry: false,
    canConfig: false,
  });
  const [notes, setNotes] = useState("");
  const save = useMutation({
    mutationFn: () => api.savePermission(form, notes),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: ["admin", "promo-coupons", "permissions"],
      }),
  });
  const fields: [keyof Omit<PromoCouponPermission, "adminId">, string][] = [
    ["canView", "查看"],
    ["canReview", "审核"],
    ["canClose", "回收"],
    ["canRetry", "重试任务"],
    ["canConfig", "修改配置"],
  ];
  return (
    <div className="grid gap-4">
      <p className="text-base text-kumo-subtle">
        仅超级管理员可以授权。未授权的管理员默认无法访问本模块。
      </p>
      {rows.data?.map((p) => (
        <div key={p.adminId} className="flex justify-between gap-3">
          <span>管理员ID {p.adminId}</span>
          <Button size="sm" variant="secondary" onClick={() => setForm(p)}>
            编辑权限
          </Button>
        </div>
      ))}
      <Input
        label="管理员ID"
        value={form.adminId}
        onChange={(e) => setForm({ ...form, adminId: e.target.value })}
      />
      <div className="flex flex-wrap gap-4">
        {fields.map(([key, label]) => (
          <Switch
            key={key}
            label={label}
            checked={form[key]}
            onCheckedChange={(v) => setForm({ ...form, [key]: v })}
          />
        ))}
      </div>
      <Input
        label="授权原因"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button
        className="justify-self-start"
        disabled={!/^[1-9][0-9]*$/.test(form.adminId) || !notes.trim()}
        loading={save.isPending}
        onClick={() => save.mutate()}
      >
        保存权限
      </Button>
      {rows.error || save.error ? (
        <Banner
          variant="error"
          title="权限操作失败"
          description={getApiMessage(rows.error ?? save.error)}
        />
      ) : null}
      {save.isSuccess ? <Banner title="权限已保存" /> : null}
    </div>
  );
}
function ConfigForm() {
  const query = useQuery({
    queryKey: ["admin", "promo-coupons", "config"],
    queryFn: api.config,
  });
  const [form, setForm] = useState<PromoCouponConfig>();
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState("");
  const client = useQueryClient();
  useEffect(() => {
    if (query.data) {
      setForm(query.data);
      setProducts(query.data.productIds.join(","));
    }
  }, [query.data]);
  const save = useMutation({
    mutationFn: () =>
      api.saveConfig(
        { ...form!, productIds: products.split(/[\s,，]+/).filter(Boolean) },
        notes,
      ),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin", "promo-coupons"] }),
  });
  if (!form)
    return (
      <PageState
        loading={query.isLoading}
        error={query.error ? getApiMessage(query.error) : null}
      >
        {null}
      </PageState>
    );
  const boolKeys: [keyof PromoCouponConfig, string][] = [
    ["enabled", "启用推广发券"],
    ["directEnabled", "指定客户赠券"],
    ["offerEnabled", "专属领券活动"],
    ["pointsEnabled", "积分出资"],
    ["balanceEnabled", "余额出资"],
    ["renewalEnabled", "允许续费使用"],
    ["reviewRequired", "发布前人工审核"],
  ];
  const numKeys: [keyof PromoCouponConfig, string][] = [
    ["pointsPerYuan", "每元券面额积分成本"],
    ["batchMax", "单批最多数量"],
    ["dailyCount", "每人每日最多数量"],
    ["validDaysMax", "最长有效天数"],
    ["maintenanceSeconds", "任务扫描间隔（秒）"],
  ];
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        {boolKeys.map(([key, label]) => (
          <Switch
            key={key}
            label={label}
            checked={Boolean(form[key])}
            onCheckedChange={(v) => setForm({ ...form, [key]: v })}
          />
        ))}
        {numKeys.map(([key, label]) => (
          <Input
            key={key}
            label={label}
            type="number"
            value={String(form[key])}
            onChange={(e) =>
              setForm({ ...form, [key]: Number(e.target.value) })
            }
          />
        ))}
        <Input
          label="单券面额上限（元）"
          value={form.faceMax}
          onChange={(e) => setForm({ ...form, faceMax: e.target.value })}
        />
        <Input
          label="每日面额预算（元）"
          value={form.dailyBudget}
          onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })}
        />
        <Input
          label="适用商品ID（逗号分隔）"
          value={products}
          onChange={(e) => setProducts(e.target.value)}
        />
        <Input
          label="修改原因（审计）"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button
        className="justify-self-start"
        disabled={!notes.trim()}
        loading={save.isPending}
        onClick={() => save.mutate()}
      >
        保存配置
      </Button>
      {save.error ? (
        <Banner
          variant="error"
          title="保存失败"
          description={getApiMessage(save.error)}
        />
      ) : null}
      {save.isSuccess ? (
        <Banner title="已保存" description="在途批次保留原规则快照。" />
      ) : null}
    </div>
  );
}
function TemplateForm() {
  const rows = useQuery({
    queryKey: ["admin", "promo-coupons", "templates"],
    queryFn: api.templates,
  });
  const client = useQueryClient();
  const [form, setForm] = useState<PromoCouponTemplate>({
    id: "0",
    name: "",
    face: "1.00",
    minimum: "10.00",
    validDays: 30,
    enabled: true,
  });
  const [notes, setNotes] = useState("");
  const save = useMutation({
    mutationFn: () => api.saveTemplate(form, notes),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin", "promo-coupons"] }),
  });
  return (
    <div className="grid gap-4">
      {rows.data?.map((t) => (
        <div className="flex flex-wrap justify-between gap-3" key={t.id}>
          <span>
            {t.name} · 满¥{t.minimum}减¥{t.face} · {t.validDays}天
          </span>
          <Button size="sm" variant="secondary" onClick={() => setForm(t)}>
            编辑
          </Button>
        </div>
      ))}
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          label="模板名称"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          label="面额（元）"
          value={form.face}
          onChange={(e) => setForm({ ...form, face: e.target.value })}
        />
        <Input
          label="使用门槛（元）"
          value={form.minimum}
          onChange={(e) => setForm({ ...form, minimum: e.target.value })}
        />
        <Input
          type="number"
          label="有效天数"
          value={String(form.validDays)}
          onChange={(e) =>
            setForm({ ...form, validDays: Number(e.target.value) })
          }
        />
        <Switch
          label="启用模板"
          checked={form.enabled}
          onCheckedChange={(v) => setForm({ ...form, enabled: v })}
        />
        <Input
          label="修改原因"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!notes.trim() || !form.name}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          保存模板
        </Button>
        <Button
          variant="secondary"
          onClick={() => setForm({ ...form, id: "0", name: "" })}
        >
          新建模板
        </Button>
      </div>
      {save.error ? (
        <Banner
          variant="error"
          title="保存失败"
          description={getApiMessage(save.error)}
        />
      ) : null}
    </div>
  );
}
function AdminBatch({ batch }: { batch: PromoCouponBatch }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [confirm, setConfirm] = useState("");
  const client = useQueryClient();
  const detail = useQuery({
    queryKey: ["admin", "promo-coupons", "detail", batch.id],
    queryFn: () => api.detail(batch.id),
    enabled: open,
  });
  const action = useMutation({
    mutationFn: () =>
      confirm === "close"
        ? api.close(batch.id, notes)
        : api.review(batch.id, confirm === "approve", notes),
    onSuccess: async () => {
      setConfirm("");
      await client.invalidateQueries({ queryKey: ["admin", "promo-coupons"] });
    },
  });
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className="border-b border-kumo-hairline py-3"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          {batch.name} · 客户ID {batch.ownerId}
          <p className="text-base text-kumo-subtle">
            {batch.id} · {batch.quantity}张 ·{" "}
            {batch.source === "points"
              ? `${batch.pointCost}积分`
              : `¥${batch.balanceCost}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={batch.status === "active" ? "success" : "neutral"}>
            {promoCouponStatus[batch.status] ?? batch.status}
          </Badge>
          <Collapsible.Trigger render={<Button size="sm" variant="ghost" />}>
            {open ? "收起" : "展开"}
          </Collapsible.Trigger>
        </div>
      </div>
      <Collapsible.Panel keepMounted inert={!open} className="grid gap-3 pt-3">
        <PageState
          loading={detail.isLoading}
          error={detail.error ? getApiMessage(detail.error) : null}
        >
          <div className="grid gap-2 text-base">
            {detail.data?.units.map((u) => (
              <p key={u.id}>
                客户ID {u.recipientId} ·{" "}
                {promoCouponStatus[u.status] ?? u.status} · 原出资{" "}
                {u.ownerPoints}积分 / ¥{u.ownerBalance}
              </p>
            ))}
            {detail.data?.events.map((e) => (
              <p className="text-base text-kumo-subtle" key={e.id}>
                {new Date(e.createdAt).toLocaleString("zh-CN")} ·{" "}
                {promoCouponEvent[e.event] ?? "处理记录"} · 操作人{e.actorId} ·{" "}
                {e.notes}
              </p>
            ))}
          </div>
        </PageState>
        <div className="flex flex-wrap gap-2">
          {batch.status === "pending_review" ? (
            <>
              <Button size="sm" onClick={() => setConfirm("approve")}>
                审核通过
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirm("reject")}
              >
                拒绝
              </Button>
            </>
          ) : null}
          {["active", "awaiting_payment", "pending_review"].includes(
            batch.status,
          ) ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setConfirm("close")}
            >
              停止 / 回收
            </Button>
          ) : null}
        </div>
        {confirm ? (
          <div className="grid gap-3">
            <Banner
              variant="alert"
              title="确认操作"
              description={
                confirm === "approve"
                  ? "通过审核不扣款，需要发券客户本人确认出资。"
                  : confirm === "reject"
                    ? "拒绝当前申请，不扣款。"
                    : "回收未使用券，资金分别退回原余额或积分来源；已占用券等待订单终态。"
              }
            />
            <Input
              label="处理原因"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setConfirm("")}
              >
                返回
              </Button>
              <Button
                size="sm"
                disabled={!notes.trim()}
                loading={action.isPending}
                onClick={() => action.mutate()}
              >
                确认执行
              </Button>
            </div>
          </div>
        ) : null}
        {action.error ? (
          <Banner
            variant="error"
            title="操作失败"
            description={getApiMessage(action.error)}
          />
        ) : null}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
export function AdminPromoCoupons() {
  const [tab, setTab] = useState("batches");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState("");
  const client = useQueryClient();
  const batches = useQuery({
    queryKey: ["admin", "promo-coupons", "batches", page],
    queryFn: () => api.batches(page),
    enabled: tab === "batches",
  });
  const tasks = useQuery({
    queryKey: ["admin", "promo-coupons", "tasks", page],
    queryFn: () => api.tasks(page),
    enabled: tab === "tasks",
    refetchInterval: tab === "tasks" ? 30000 : false,
  });
  const audit = useQuery({
    queryKey: ["admin", "promo-coupons", "audit", page],
    queryFn: () => api.audit(page),
    enabled: tab === "audit",
  });
  const reconcile = useQuery({
    queryKey: ["admin", "promo-coupons", "reconciliation"],
    queryFn: api.reconciliation,
    enabled: tab === "reconcile",
  });
  const retry = useMutation({
    mutationFn: (id: string) => api.retry(id, notes),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["admin", "promo-coupons"] }),
  });
  return (
    <>
      <PageHeader
        title="推广客户优惠券"
        description="出资规则、人工审核、原资产退还与任务对账。"
      />
      <LayerCard>
        <LayerCard.Secondary>模块管理</LayerCard.Secondary>
        <LayerCard.Primary>
          <div className="overflow-x-auto">
            <Tabs
              size="sm"
              variant="segmented"
              tabs={[
                { value: "batches", label: "批次审核" },
                { value: "config", label: "配置" },
                { value: "templates", label: "模板" },
                { value: "tasks", label: "待处理任务" },
                { value: "audit", label: "审计" },
                { value: "reconcile", label: "对账" },
                { value: "permissions", label: "权限" },
              ]}
              value={tab}
              onValueChange={(v) => {
                setTab(v);
                setPage(1);
              }}
            />
          </div>
          <div className="mt-4 grid gap-3">
            {tab === "permissions" ? (
              <PermissionForm />
            ) : tab === "config" ? (
              <ConfigForm />
            ) : tab === "templates" ? (
              <TemplateForm />
            ) : tab === "batches" ? (
              <PageState
                loading={batches.isLoading}
                error={batches.error ? getApiMessage(batches.error) : null}
                empty={!batches.isLoading && !batches.data?.list.length}
                emptyTitle="暂无批次"
              >
                {batches.data?.list.map((b) => (
                  <AdminBatch key={b.id} batch={b} />
                ))}
              </PageState>
            ) : tab === "tasks" ? (
              <>
                <Input
                  label="重试原因"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                {tasks.data?.list.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-3 text-base"
                  >
                    <span>
                      批次{t.batchId} ·{" "}
                      {t.kind === "close" ? "回收" : "权益同步"} ·{" "}
                      {t.status === "failed"
                        ? "待人工处理"
                        : t.status === "pending"
                          ? "待处理"
                          : "已完成"}{" "}
                      · 已尝试{t.attempts}次 · 下次
                      {new Date(t.nextAt).toLocaleString("zh-CN")} {t.lastError}
                    </span>
                    {t.status === "failed" ? (
                      <Button
                        size="sm"
                        disabled={!notes.trim()}
                        loading={retry.isPending}
                        onClick={() => retry.mutate(t.id)}
                      >
                        重试
                      </Button>
                    ) : null}
                  </div>
                ))}
              </>
            ) : tab === "audit" ? (
              <>
                {audit.data?.list.map((e) => (
                  <p key={e.id} className="text-base">
                    {new Date(e.createdAt).toLocaleString("zh-CN")} · 操作人
                    {e.actorId} · {promoCouponEvent[e.event] ?? "处理记录"} ·{" "}
                    {e.amount}元 / {e.points}积分 · {e.notes}
                  </p>
                ))}
              </>
            ) : (
              <>
                {reconcile.data?.map((r) => (
                  <p key={r.id} className="text-base">
                    {String(r.day)} · 批次{r.batch_id} ·{" "}
                    <Badge variant={r.healthy ? "success" : "error"}>
                      {r.healthy ? "正常" : "差额待核对"}
                    </Badge>
                  </p>
                ))}
              </>
            )}
            {["batches", "audit", "tasks"].includes(tab) ? (
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
                  disabled={
                    page * 20 >=
                    (tab === "batches"
                      ? (batches.data?.total ?? 0)
                      : tab === "tasks"
                        ? (tasks.data?.total ?? 0)
                        : (audit.data?.total ?? 0))
                  }
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            ) : null}
            {tasks.error || audit.error || reconcile.error || retry.error ? (
              <Banner
                variant="error"
                title="读取或操作失败"
                description={getApiMessage(
                  tasks.error ?? audit.error ?? reconcile.error ?? retry.error,
                )}
              />
            ) : null}
          </div>
        </LayerCard.Primary>
      </LayerCard>
    </>
  );
}
