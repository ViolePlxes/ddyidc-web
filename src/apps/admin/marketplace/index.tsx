import {
  Badge,
  Banner,
  Button,
  Input,
  LayerCard,
  Select,
  Switch,
  Table,
  Textarea,
} from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  marketplaceAdminApi,
  marketplaceApi,
  type MarketplaceSettings,
} from "../../../shared/api/marketplace";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

const money = (v: string) => `¥${Number(v || 0).toFixed(2)}`;
const statusLabel: Record<string, string> = {
  pending: "待处理",
  pending_pay: "待支付",
  on_sale: "在售",
  locked: "锁定",
  sold: "已售",
  paid: "已成交",
  settled: "已结算",
  refunded: "已退款",
  rejected: "已拒绝",
  off_shelf: "已下架",
  cancelled: "已取消",
  approved: "已通过",
  processed: "已处理",
};
const useRefresh = (key: string[]) => {
  const c = useQueryClient();
  return () => c.invalidateQueries({ queryKey: key });
};
function Result({ message }: { message: string }) {
  return message ? <Banner variant="default" title={message} /> : null;
}

export function MarketplaceAdminDashboard() {
  const q = useQuery({
    queryKey: ["admin", "marketplace", "dashboard"],
    queryFn: marketplaceAdminApi.dashboard,
  });
  const cards = q.data
    ? [
        ["在售挂牌", q.data.onSale],
        ["已售商品", q.data.sold],
        ["开放求购", q.data.wants],
        ["待审挂牌", q.data.pendingListings],
        ["待审提现", q.data.pendingWithdrawals],
        ["待处理举报", q.data.pendingReports],
        ["累计手续费", money(q.data.feeIncome)],
      ]
    : [];
  return (
    <>
      <PageHeader
        title="交易市场概览"
        description="查看供需、审核与资金待办。"
      />
      <PageState
        loading={q.isLoading}
        skeleton="dashboard"
        error={q.error ? getApiMessage(q.error) : null}
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value]) => (
            <LayerCard key={String(label)} className="shadow-none grid gap-1 p-5">
              <span className="text-sm text-kumo-subtle">{label}</span>
              <strong className="text-2xl text-kumo-strong">{value}</strong>
            </LayerCard>
          ))}
        </div>
      </PageState>
    </>
  );
}

export function MarketplaceAdminListings() {
  const key = ["admin", "marketplace", "listings"];
  const refresh = useRefresh(key);
  const [status, setStatus] = useState("");
  const [auditStatus, setAuditStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");
  const q = useQuery({
    queryKey: [...key, status, auditStatus, keyword],
    queryFn: () =>
      marketplaceAdminApi.listings({
        status: status || undefined,
        auditStatus: auditStatus || undefined,
        keyword: keyword || undefined,
        pageSize: 100,
      }),
  });
  const action = useMutation({
    mutationFn: ({
      type,
      id,
      on,
    }: {
      type: string;
      id: string;
      on?: boolean;
    }) =>
      type === "pass"
        ? marketplaceAdminApi.audit(id, true)
        : type === "reject"
          ? marketplaceAdminApi.audit(id, false, "平台审核未通过")
          : type === "recommend"
            ? marketplaceAdminApi.recommend(id, Boolean(on))
            : marketplaceAdminApi.off(id),
    onSuccess: () => refresh(),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  return (
    <>
      <PageHeader title="挂牌管理" description="审核、推荐和下架市场商品。" />
      <Result message={message} />
      <LayerCard className="shadow-none grid gap-4 p-5 md:grid-cols-3">
        <Input
          label="搜索编号、产品、配置"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          label="状态筛选"
          value={status || "all"}
          onValueChange={(v) => setStatus(v === "all" ? "" : (v ?? ""))}
          items={{
            all: "全部",
            pending: "待审核",
            on_sale: "在售",
            locked: "交易中",
            sold: "已售",
            off_shelf: "已下架",
          }}
        />
        <Select
          label="审核筛选"
          value={auditStatus || "all"}
          onValueChange={(v) => setAuditStatus(v === "all" ? "" : (v ?? ""))}
          items={{
            all: "全部",
            pending: "待审核",
            passed: "已通过",
            rejected: "已拒绝",
          }}
        />
      </LayerCard>
      <PageState
        loading={q.isLoading}
        skeleton="table"
        error={q.error ? getApiMessage(q.error) : null}
        empty={!q.isLoading && !q.data?.list.length}
        emptyTitle="暂无挂牌"
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>挂牌</Table.Head>
                <Table.Head>卖家</Table.Head>
                <Table.Head>价格</Table.Head>
                <Table.Head>状态</Table.Head>
                <Table.Head>操作</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {q.data?.list.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <strong>{r.productName}</strong>
                    <p className="text-xs text-kumo-subtle">{r.listingNo}</p>
                  </Table.Cell>
                  <Table.Cell>{r.sellerId}</Table.Cell>
                  <Table.Cell>{money(r.price)}</Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline">
                      {statusLabel[
                        r.auditStatus === "pending" ? "pending" : r.status
                      ] ?? r.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-2">
                      {r.auditStatus === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            loading={action.isPending}
                            onClick={() =>
                              action.mutate({ type: "pass", id: r.id })
                            }
                          >
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              action.mutate({ type: "reject", id: r.id })
                            }
                          >
                            拒绝
                          </Button>
                        </>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          action.mutate({
                            type: "recommend",
                            id: r.id,
                            on: !r.isRecommended,
                          })
                        }
                      >
                        {r.isRecommended ? "取消推荐" : "推荐"}
                      </Button>
                      {["on_sale", "pending"].includes(r.status) ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            action.mutate({ type: "off", id: r.id })
                          }
                        >
                          下架
                        </Button>
                      ) : null}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </>
  );
}

export function MarketplaceAdminOrders() {
  const key = ["admin", "marketplace", "orders"];
  const refresh = useRefresh(key);
  const [message, setMessage] = useState("");
  const q = useQuery({
    queryKey: key,
    queryFn: () => marketplaceAdminApi.orders({ pageSize: 100 }),
  });
  const refund = useMutation({
    mutationFn: marketplaceAdminApi.refund,
    onSuccess: () => refresh(),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  return (
    <>
      <PageHeader
        title="交易订单"
        description="核对买卖双方、费用和成交状态。"
      />
      <Result message={message} />
      <PageState
        loading={q.isLoading}
        skeleton="table"
        error={q.error ? getApiMessage(q.error) : null}
        empty={!q.isLoading && !q.data?.list.length}
        emptyTitle="暂无交易订单"
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>订单</Table.Head>
                <Table.Head>买家 / 卖家</Table.Head>
                <Table.Head>成交 / 手续费</Table.Head>
                <Table.Head>状态</Table.Head>
                <Table.Head>操作</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {q.data?.list.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>{r.orderNo}</Table.Cell>
                  <Table.Cell>
                    {r.buyerId} / {r.sellerId}
                  </Table.Cell>
                  <Table.Cell>
                    {money(r.amount)} / {money(r.fee)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline">
                      {statusLabel[r.status] ?? r.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {r.status === "paid" ? (
                      <Button
                        variant="destructive"
                        loading={refund.isPending}
                        onClick={() => refund.mutate(r.id)}
                      >
                        人工退款
                      </Button>
                    ) : (
                      "—"
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </>
  );
}

export function MarketplaceAdminFlows() {
  const [type, setType] = useState("");
  const [direction, setDirection] = useState("");
  const [userId, setUserId] = useState("");
  const q = useQuery({
    queryKey: ["admin", "marketplace", "flows", type, direction, userId],
    queryFn: () =>
      marketplaceAdminApi.flows({
        type: type || undefined,
        direction: direction || undefined,
        userId: userId || undefined,
        pageSize: 100,
      }),
  });
  return (
    <>
      <PageHeader
        title="资金流水"
        description="审计成交、冻结、结算、退款和提现流水。"
      />
      <LayerCard className="shadow-none grid gap-4 p-5 md:grid-cols-3">
        <Input
          label="客户 ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <Select
          label="流水类型"
          value={type || "all"}
          onValueChange={(v) => setType(v === "all" ? "" : (v ?? ""))}
          items={{
            all: "全部",
            buyer_paid: "买家付款",
            seller_pending: "卖家待结算",
            settled: "解冻结算",
            refund_reversed: "退款回滚",
            withdraw: "提现",
            withdraw_reject: "提现拒绝退回",
            withdraw_hold: "申请提现冻结",
          }}
        />
        <Select
          label="资金方向"
          value={direction || "all"}
          onValueChange={(v) => setDirection(v === "all" ? "" : (v ?? ""))}
          items={{ all: "全部", in: "入账", out: "出账" }}
        />
      </LayerCard>
      <PageState
        loading={q.isLoading}
        skeleton="table"
        error={q.error ? getApiMessage(q.error) : null}
        empty={!q.isLoading && !q.data?.list.length}
        emptyTitle="暂无流水"
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>流水号</Table.Head>
                <Table.Head>用户</Table.Head>
                <Table.Head>类型</Table.Head>
                <Table.Head>方向 / 金额</Table.Head>
                <Table.Head>关联</Table.Head>
                <Table.Head>时间</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {q.data?.list.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>{r.flowNo}</Table.Cell>
                  <Table.Cell>{r.userId}</Table.Cell>
                  <Table.Cell>{r.type}</Table.Cell>
                  <Table.Cell>
                    {r.direction === "in" ? "入" : "出"} {money(r.amount)}
                  </Table.Cell>
                  <Table.Cell>{r.refId}</Table.Cell>
                  <Table.Cell>
                    {new Date(r.createdAt).toLocaleString("zh-CN")}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </>
  );
}

export function MarketplaceAdminWithdrawals() {
  const key = ["admin", "marketplace", "withdrawals"];
  const refresh = useRefresh(key);
  const [message, setMessage] = useState("");
  const q = useQuery({
    queryKey: key,
    queryFn: () => marketplaceAdminApi.withdrawals({ pageSize: 100 }),
  });
  const audit = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      marketplaceAdminApi.auditWithdrawal(
        id,
        approved,
        approved ? "审核通过" : "审核拒绝",
      ),
    onSuccess: () => refresh(),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  return (
    <>
      <PageHeader
        title="提现审核"
        description="审核卖家提现申请，拒绝时自动退回可用余额。"
      />
      <Result message={message} />
      <PageState
        loading={q.isLoading}
        skeleton="table"
        error={q.error ? getApiMessage(q.error) : null}
        empty={!q.isLoading && !q.data?.list.length}
        emptyTitle="暂无提现申请"
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>提现单</Table.Head>
                <Table.Head>用户</Table.Head>
                <Table.Head>金额 / 到账</Table.Head>
                <Table.Head>状态</Table.Head>
                <Table.Head>操作</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {q.data?.list.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>{r.withdrawNo}</Table.Cell>
                  <Table.Cell>{r.userId}</Table.Cell>
                  <Table.Cell>
                    {money(r.amount)} / {money(r.actualAmount)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="outline">
                      {statusLabel[r.status] ?? r.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {r.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          loading={audit.isPending}
                          onClick={() =>
                            audit.mutate({ id: r.id, approved: true })
                          }
                        >
                          通过
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() =>
                            audit.mutate({ id: r.id, approved: false })
                          }
                        >
                          拒绝
                        </Button>
                      </div>
                    ) : (
                      "—"
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </>
  );
}

export function MarketplaceAdminReports() {
  const key = ["admin", "marketplace", "reports"];
  const refresh = useRefresh(key);
  const q = useQuery({
    queryKey: key,
    queryFn: () => marketplaceAdminApi.reports({ pageSize: 100 }),
  });
  const handle = useMutation({
    mutationFn: (id: string) =>
      marketplaceAdminApi.handleReport(id, "processed"),
    onSuccess: () => refresh(),
  });
  return (
    <>
      <PageHeader
        title="举报处理"
        description="复核市场商品举报并保留审计记录。"
      />
      <PageState
        loading={q.isLoading}
        skeleton="table"
        error={q.error ? getApiMessage(q.error) : null}
        empty={!q.isLoading && !q.data?.list.length}
        emptyTitle="暂无举报"
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>挂牌</Table.Head>
                <Table.Head>举报人</Table.Head>
                <Table.Head>原因</Table.Head>
                <Table.Head>详情</Table.Head>
                <Table.Head>状态</Table.Head>
                <Table.Head>操作</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {q.data?.list.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>{r.listingId}</Table.Cell>
                  <Table.Cell>{r.reporterId}</Table.Cell>
                  <Table.Cell>{r.reason}</Table.Cell>
                  <Table.Cell>{r.detail}</Table.Cell>
                  <Table.Cell>{statusLabel[r.status] ?? r.status}</Table.Cell>
                  <Table.Cell>
                    {r.status === "pending" ? (
                      <Button
                        loading={handle.isPending}
                        onClick={() => handle.mutate(r.id)}
                      >
                        标记已处理
                      </Button>
                    ) : (
                      "—"
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </>
  );
}

const defaults: MarketplaceSettings = {
  id: "1",
  enabled: true,
  maintenance: false,
  auditEnabled: true,
  requireBackupConfirm: true,
  requireRealnameListing: false,
  requireRealnamePurchase: false,
  refundEnabled: true,
  forceSettleAfterWindow: true,
  withdrawalAuditEnabled: true,
  announcement: "",
  agreement: "",
  maintenanceTip: "",
  feeType: "ratio",
  feeBearer: "seller",
  feeRate: "2.00",
  feeFixed: "0.00",
  withdrawFeeType: "free",
  withdrawFeeRate: "0.00",
  withdrawFeeFixed: "0.00",
  maxListingsPerUser: 10,
  newUserLimitDays: 0,
  listingValidMinutes: 43200,
  orderLockMinutes: 15,
  settleFreezeDays: 7,
  refundWindowDays: 3,
  allowGroups: [],
};

export function MarketplaceAdminSettings() {
  const [form, setForm] = useState(defaults);
  const [message, setMessage] = useState("");
  const q = useQuery({
    queryKey: ["admin", "marketplace", "settings"],
    queryFn: marketplaceAdminApi.settings,
  });
  const groups = useQuery({
    queryKey: ["marketplace", "groups", "settings"],
    queryFn: marketplaceApi.groups,
  });
  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);
  const save = useMutation({
    mutationFn: () => marketplaceAdminApi.saveSettings(form),
    onSuccess: (v) => {
      setForm(v);
      setMessage("交易市场设置已保存。部分总开关变更将在服务重启后完整生效。");
    },
    onError: (e) => setMessage(getApiMessage(e)),
  });
  const update = <K extends keyof MarketplaceSettings>(
    k: K,
    v: MarketplaceSettings[K],
  ) => setForm((x) => ({ ...x, [k]: v }));
  const toggleGroup = (id: string, on: boolean) =>
    update(
      "allowGroups",
      on
        ? [...(form.allowGroups ?? []), id]
        : (form.allowGroups ?? []).filter((x) => x !== id),
    );
  return (
    <>
      <PageHeader
        title="交易市场设置"
        description="统一配置开关、审核、手续费、风控、结算和交易范围。"
        actions={
          <Button loading={save.isPending} onClick={() => save.mutate()}>
            保存设置
          </Button>
        }
      />
      <Result message={message} />
      <PageState
        loading={q.isLoading}
        skeleton="form"
        error={q.error ? getApiMessage(q.error) : null}
      >
        <div className="grid gap-5">
          <LayerCard className="shadow-none grid gap-4 p-5">
            <h2 className="font-semibold text-kumo-strong">运行状态</h2>
            <div className="flex flex-wrap gap-6">
              <Switch
                label="启用交易市场"
                checked={form.enabled}
                onCheckedChange={(v) => update("enabled", v)}
              />
              <Switch
                label="维护模式"
                checked={form.maintenance}
                onCheckedChange={(v) => update("maintenance", v)}
              />
              <Switch
                label="挂牌人工审核"
                checked={form.auditEnabled}
                onCheckedChange={(v) => update("auditEnabled", v)}
              />
            </div>
            <Textarea
              label="市场公告"
              rows={3}
              value={form.announcement}
              onChange={(e) => update("announcement", e.target.value)}
            />
            <Textarea
              label="维护提示"
              rows={2}
              value={form.maintenanceTip}
              onChange={(e) => update("maintenanceTip", e.target.value)}
            />
          </LayerCard>
          <LayerCard className="shadow-none grid gap-4 p-5">
            <h2 className="font-semibold text-kumo-strong">交易费用</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                label="手续费模式"
                value={form.feeType}
                onValueChange={(v) => update("feeType", v ?? "ratio")}
                items={{ ratio: "按比例", fixed: "固定金额" }}
              />
              <Select
                label="手续费承担方"
                value={form.feeBearer}
                onValueChange={(v) => update("feeBearer", v ?? "seller")}
                items={{ seller: "卖家", buyer: "买家", platform: "平台" }}
              />
              <Input
                label="成交手续费率（%）"
                type="number"
                value={form.feeRate}
                onChange={(e) => update("feeRate", e.target.value)}
              />
              <Input
                label="成交固定手续费（元）"
                type="number"
                value={form.feeFixed}
                onChange={(e) => update("feeFixed", e.target.value)}
              />
              <Select
                label="提现费模式"
                value={form.withdrawFeeType}
                onValueChange={(v) => update("withdrawFeeType", v ?? "free")}
                items={{ free: "免手续费", ratio: "按比例", fixed: "固定金额" }}
              />
              <Input
                label="提现费率（%）"
                type="number"
                value={form.withdrawFeeRate}
                onChange={(e) => update("withdrawFeeRate", e.target.value)}
              />
              <Input
                label="提现固定费用（元）"
                type="number"
                value={form.withdrawFeeFixed}
                onChange={(e) => update("withdrawFeeFixed", e.target.value)}
              />
            </div>
          </LayerCard>
          <LayerCard className="shadow-none grid gap-4 p-5">
            <h2 className="font-semibold text-kumo-strong">风控与时限</h2>
            <div className="flex flex-wrap gap-6">
              <Switch
                label="挂牌须确认备份"
                checked={form.requireBackupConfirm}
                onCheckedChange={(v) => update("requireBackupConfirm", v)}
              />
              <Switch
                label="挂牌须实名"
                checked={form.requireRealnameListing}
                onCheckedChange={(v) => update("requireRealnameListing", v)}
              />
              <Switch
                label="购买须实名"
                checked={form.requireRealnamePurchase}
                onCheckedChange={(v) => update("requireRealnamePurchase", v)}
              />
              <Switch
                label="允许退款"
                checked={form.refundEnabled}
                onCheckedChange={(v) => update("refundEnabled", v)}
              />
              <Switch
                label="冻结期满自动结算"
                checked={form.forceSettleAfterWindow}
                onCheckedChange={(v) => update("forceSettleAfterWindow", v)}
              />
              <Switch
                label="提现人工审核"
                checked={form.withdrawalAuditEnabled}
                onCheckedChange={(v) => update("withdrawalAuditEnabled", v)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="单用户最大挂牌数"
                type="number"
                value={form.maxListingsPerUser}
                onChange={(e) =>
                  update("maxListingsPerUser", Number(e.target.value))
                }
              />
              <Input
                label="新用户限制天数"
                type="number"
                value={form.newUserLimitDays}
                onChange={(e) =>
                  update("newUserLimitDays", Number(e.target.value))
                }
              />
              <Input
                label="挂牌有效分钟"
                type="number"
                value={form.listingValidMinutes}
                onChange={(e) =>
                  update("listingValidMinutes", Number(e.target.value))
                }
              />
              <Input
                label="订单锁定分钟"
                type="number"
                value={form.orderLockMinutes}
                onChange={(e) =>
                  update("orderLockMinutes", Number(e.target.value))
                }
              />
              <Input
                label="结算冻结天数"
                type="number"
                value={form.settleFreezeDays}
                onChange={(e) =>
                  update("settleFreezeDays", Number(e.target.value))
                }
              />
              <Input
                label="退款窗口天数"
                type="number"
                value={form.refundWindowDays}
                onChange={(e) =>
                  update("refundWindowDays", Number(e.target.value))
                }
              />
            </div>
          </LayerCard>
          <LayerCard className="shadow-none grid gap-4 p-5">
            <h2 className="font-semibold text-kumo-strong">
              允许交易的商品分组
            </h2>
            <p className="text-sm text-kumo-subtle">
              不选择时允许全部分组；选择后仅允许勾选分组。
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {groups.data?.map((g) => (
                <Switch
                  key={g.id}
                  label={g.name}
                  checked={(form.allowGroups ?? []).includes(g.id)}
                  onCheckedChange={(v) => toggleGroup(g.id, v)}
                />
              ))}
            </div>
          </LayerCard>
          <LayerCard className="shadow-none grid gap-4 p-5">
            <h2 className="font-semibold text-kumo-strong">交易协议</h2>
            <Textarea
              label="用户交易协议"
              rows={10}
              value={form.agreement}
              onChange={(e) => update("agreement", e.target.value)}
            />
          </LayerCard>
        </div>
      </PageState>
    </>
  );
}
