import { Dialog } from "../../../shared/components/Dialog";
import { useSearchParams } from "react-router-dom";
import { Banner, Button, Input, LayerCard, Select, Switch, Table } from "@cloudflare/kumo";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { adminMarketingApi, type SalesCreateInput, type SalesUser, type SalesVisibility } from "../../../shared/api/adminMarketing";
import { getApiMessage } from "../../../shared/api/request";
import { DataTable } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { formatDate, formatMoney } from "../../../shared/utils/format";

const inviteStatuses = { all: "全部状态", "0": "待审核", "1": "已启用", "2": "已禁用", "3": "已驳回" };
const rewardStatuses = { all: "全部状态", "0": "待结算", "1": "已结算", "2": "已冻结", "3": "已回收" };

export function AdminInvites() {
  const [params] = useSearchParams();
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [draftKeyword, setDraftKeyword] = useState(() => params.get("keyword") ?? "");
  const [keyword, setKeyword] = useState(() => params.get("keyword") ?? "");
  const [message, setMessage] = useState("");
  const pageSize = 10;
  const query = useQuery({
    queryKey: ["admin", "marketing", "invites", page, status, keyword],
    queryFn: () => adminMarketingApi.invites({ page, pageSize, keyword: keyword || undefined, status: status === "all" ? undefined : status }),
  });
  const change = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "disable" | "enable" }) => {
      if (action === "approve") await adminMarketingApi.reviewInvite(id, true);
      else await adminMarketingApi.setInviteStatus(id, action === "enable" ? 1 : 2);
    },
    onSuccess: async () => {
      setMessage("优惠码状态已更新");
      await client.invalidateQueries({ queryKey: ["admin", "marketing", "invites"] });
    },
  });
  const rows = (query.data?.list ?? []).map((row) => ({
    id: row.id,
    primary: row.code,
    secondary: row.username || row.userId,
    meta: `使用 ${row.inviteCount} 次 · ${formatDate(row.createdAt)} · ${inviteStatuses[String(row.status) as keyof typeof inviteStatuses] ?? "未知状态"}`,
    status: row.status === 1 ? "running" as const : row.status === 0 ? "pending" as const : "suspended" as const,
  }));

  return (
    <>
      <PageHeader title="优惠码管理" description="申请记录、使用次数和审核状态均来自营销服务。" />
      {message ? <Banner variant="default" title={message} /> : null}
      {change.error ? <Banner variant="error" title="状态更新失败" description={getApiMessage(change.error)} /> : null}
      <LayerCard className="grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
        <Input aria-label="优惠码关键词" placeholder="优惠码或用户账号…" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
        <Select aria-label="优惠码状态" value={status} onValueChange={(value) => { setStatus(value ?? "all"); setPage(1); }} items={inviteStatuses} />
        <Button variant="secondary" onClick={() => { setKeyword(draftKeyword.trim()); setPage(1); }}>筛选</Button>
      </LayerCard>
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无优惠码记录">
        <DataTable rows={rows} primaryLabel="优惠码" secondaryLabel="所属用户" amountLabel="操作" withPagination page={page} onPageChange={setPage} perPage={pageSize} totalCount={query.data?.total ?? 0} showActions={false} />
        <LayerCard className="mt-3 grid gap-2 p-4">
          {(query.data?.list ?? []).map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-kumo-line py-2"><span className="text-sm text-kumo-subtle">{row.code} · {row.username || row.userId}</span><div className="flex gap-2">{row.status === 0 ? <Button size="sm" loading={change.isPending && change.variables?.id === row.id} onClick={() => change.mutate({ id: row.id, action: "approve" })}>通过审核</Button> : null}{row.status === 1 ? <Button size="sm" variant="secondary" onClick={() => change.mutate({ id: row.id, action: "disable" })}>停用</Button> : null}{row.status === 2 ? <Button size="sm" variant="secondary" onClick={() => change.mutate({ id: row.id, action: "enable" })}>启用</Button> : null}</div></div>)}
        </LayerCard>
      </PageState>
    </>
  );
}

export function AdminRewards() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [levels, setLevels] = useState("1");
  const [level1, setLevel1] = useState("0");
  const [level2, setLevel2] = useState("0");
  const config = useQuery({ queryKey: ["admin", "marketing", "config"], queryFn: adminMarketingApi.config });
  const rewards = useQuery({ queryKey: ["admin", "marketing", "rewards", page, status], queryFn: () => adminMarketingApi.rewards({ page, pageSize: 10, status: status === "all" ? undefined : status }) });
  useEffect(() => {
    const values = Object.fromEntries((config.data?.items ?? []).map((item) => [item.key, item.value]));
    if (values["marketing.reward.levels"]) setLevels(values["marketing.reward.levels"]);
    if (values["marketing.reward.level1_percent"]) setLevel1(String(Number(values["marketing.reward.level1_percent"]) * 100));
    if (values["marketing.reward.level2_percent"]) setLevel2(String(Number(values["marketing.reward.level2_percent"]) * 100));
  }, [config.data]);
  const save = useMutation({
    mutationFn: () => adminMarketingApi.saveConfig({
      "marketing.reward.levels": levels,
      "marketing.reward.level1_percent": String(Number(level1) / 100),
      "marketing.reward.level2_percent": String(Number(level2) / 100),
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "marketing", "config"] }),
  });
  const settle = useMutation({
    mutationFn: adminMarketingApi.settleReward,
    onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "marketing", "rewards"] }),
  });
  const rows = (rewards.data?.list ?? []).map((row) => ({
    id: row.id,
    primary: `${row.level} 级奖励 · ${row.rewardUserName || "未知收款用户"}`,
    secondary: row.orderNo,
    meta: `${row.username || "未知下单用户"} · ${rewardStatuses[String(row.status) as keyof typeof rewardStatuses] ?? "未知状态"} · ${formatDate(row.createdAt)}`,
    amount: formatMoney(row.amount),
    status: row.status === 1 ? "paid" as const : row.status === 0 ? "pending" as const : "suspended" as const,
  }));
  return (
    <>
      <PageHeader title="分销管理" description="奖励比例与结算记录均由营销配置和真实订单奖励提供。" actions={<Button loading={save.isPending} disabled={config.isLoading} onClick={() => save.mutate()}>保存配置</Button>} />
      {save.error ? <Banner variant="error" title="配置保存失败" description={getApiMessage(save.error)} /> : null}
      <PageState loading={config.isLoading} error={config.error ? getApiMessage(config.error) : null}>
        <LayerCard className="grid gap-4 p-4 sm:grid-cols-3"><Input label="分销层级" type="number" min={1} max={3} value={levels} onChange={(event) => setLevels(event.target.value)} /><Input label="一级奖励比例（%）" type="number" min={0} value={level1} onChange={(event) => setLevel1(event.target.value)} /><Input label="二级奖励比例（%）" type="number" min={0} value={level2} disabled={Number(levels) < 2} onChange={(event) => setLevel2(event.target.value)} /></LayerCard>
      </PageState>
      {settle.error ? <Banner variant="error" title="奖励结算失败" description={getApiMessage(settle.error)} /> : null}
      <LayerCard className="p-4"><Select label="奖励状态" value={status} onValueChange={(value) => { setStatus(value ?? "all"); setPage(1); }} items={rewardStatuses} /></LayerCard>
      <PageState loading={rewards.isLoading} error={rewards.error ? getApiMessage(rewards.error) : null} empty={!rewards.isLoading && !rewards.error && rows.length === 0} emptyTitle="暂无奖励记录">
        <DataTable rows={rows} primaryLabel="奖励" secondaryLabel="来源订单" withPagination page={page} onPageChange={setPage} perPage={10} totalCount={rewards.data?.total ?? 0} showActions={false} />
        {(rewards.data?.list ?? []).some((row) => row.status === 0) ? <LayerCard className="mt-3 grid gap-2 p-4">{rewards.data?.list.filter((row) => row.status === 0).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 border-b border-kumo-line py-2"><span>{row.orderNo} · {formatMoney(row.amount)}</span><Button size="sm" loading={settle.isPending && settle.variables === row.id} onClick={() => settle.mutate(row.id)}>结算</Button></div>)}</LayerCard> : null}
      </PageState>
    </>
  );
}

const emptySales: SalesCreateInput = { staffNo: "", username: "", password: "", name: "", phone: "", email: "" };

function SalesDialog({ onClose }: { onClose: () => void }) {
  const client = useQueryClient();
  const [form, setForm] = useState(emptySales);
  const create = useMutation({
    mutationFn: () => adminMarketingApi.createSales(form),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["admin", "marketing", "sales"] });
      onClose();
    },
  });
  const update = <K extends keyof SalesCreateInput>(key: K, value: SalesCreateInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog size="lg" className="grid gap-5 p-6"><div className="flex justify-between gap-4"><div><Dialog.Title className="text-xl font-semibold">新增销售账号</Dialog.Title><Dialog.Description className="text-kumo-subtle">账号创建后使用独立销售端会话登录。</Dialog.Description></div><Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" onClick={onClose} /></div><div className="grid gap-4 sm:grid-cols-2"><Input label="销售工号（留空自动生成）" value={form.staffNo} onChange={(event) => update("staffNo", event.target.value)} /><Input label="姓名" required value={form.name} onChange={(event) => update("name", event.target.value)} /><Input label="登录账号" required value={form.username} onChange={(event) => update("username", event.target.value)} /><Input label="初始密码" required type="password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} /><Input label="手机号（可选）" value={form.phone} onChange={(event) => update("phone", event.target.value)} /><Input label="邮箱（可选）" value={form.email} onChange={(event) => update("email", event.target.value)} /></div>{create.error ? <Banner variant="error" title="创建失败" description={getApiMessage(create.error)} /> : null}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>取消</Button><Button loading={create.isPending} disabled={!form.name.trim() || !form.username.trim() || form.password.length < 6} onClick={() => create.mutate()}>创建账号</Button></div></Dialog></Dialog.Root>;
}

function VisibilityEditor({ sales }: { sales: SalesUser }) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "marketing", "sales", sales.id, "visibility"], queryFn: () => adminMarketingApi.visibility(sales.id) });
  const [form, setForm] = useState<SalesVisibility | null>(null);
  useEffect(() => { if (query.data) setForm(query.data); }, [query.data]);
  const save = useMutation({ mutationFn: () => adminMarketingApi.saveVisibility(sales.id, form!), onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "marketing", "sales", sales.id, "visibility"] }) });
  const toggle = (key: keyof Omit<SalesVisibility, "salesId">, value: boolean) => setForm((current) => current ? { ...current, [key]: value } : current);
  return <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null}>{form ? <LayerCard ><LayerCard.Secondary><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-kumo-strong">字段权限 · {sales.name}</h2><p className="text-sm text-kumo-subtle">权限值来自服务端并保存到销售可见性规则。</p></div><Button loading={save.isPending} onClick={() => save.mutate()}>保存权限</Button></div></LayerCard.Secondary><LayerCard.Primary className="grid gap-4"><div className="grid gap-3 sm:grid-cols-2"><Switch label="查看手机号" checked={form.canViewMobile} onCheckedChange={(value) => toggle("canViewMobile", value)} /><Switch label="查看邮箱" checked={form.canViewEmail} onCheckedChange={(value) => toggle("canViewEmail", value)} /><Switch label="查看订单" checked={form.canViewOrders} onCheckedChange={(value) => toggle("canViewOrders", value)} /><Switch label="查看消费金额" checked={form.canViewSpend} onCheckedChange={(value) => toggle("canViewSpend", value)} /><Switch label="查看账户余额" checked={form.canViewBalance} onCheckedChange={(value) => toggle("canViewBalance", value)} /><Switch label="查看实名认证字段" checked={form.canViewRealname} disabled onCheckedChange={(value) => toggle("canViewRealname", value)} /><Switch label="记录客户跟进" checked={form.canFollowup} onCheckedChange={(value) => toggle("canFollowup", value)} /></div>{save.error ? <Banner variant="error" title="权限保存失败" description={getApiMessage(save.error)} /> : null}</LayerCard.Primary></LayerCard> : null}</PageState>;
}

export function AdminSales() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<SalesUser | null>(null);
  const query = useQuery({ queryKey: ["admin", "marketing", "sales", page, keyword], queryFn: () => adminMarketingApi.sales({ page, pageSize: 10, keyword: keyword || undefined }) });
  const status = useMutation({ mutationFn: ({ id, value }: { id: string; value: 1 | 2 }) => adminMarketingApi.setSalesStatus(id, value), onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "marketing", "sales"] }) });
  return <><PageHeader title="销售客服" description="销售账号、状态和字段权限均来自真实营销服务。" actions={<Button icon={<PlusIcon />} onClick={() => setCreateOpen(true)}>新增销售账号</Button>} /><LayerCard className="flex flex-wrap items-end gap-3 p-4"><Input className="max-w-md flex-1" label="搜索销售" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} /><Button variant="secondary" onClick={() => { setKeyword(draftKeyword.trim()); setPage(1); }}>筛选</Button></LayerCard>{status.error ? <Banner variant="error" title="状态更新失败" description={getApiMessage(status.error)} /> : null}<PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !query.data?.list.length} emptyTitle="暂无销售账号"><LayerCard className="overflow-x-auto p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>销售</Table.Head><Table.Head>登录账号</Table.Head><Table.Head>联系方式</Table.Head><Table.Head>状态</Table.Head><Table.Head>权限</Table.Head></Table.Row></Table.Header><Table.Body>{query.data?.list.map((row) => <Table.Row key={row.id}><Table.Cell><strong>{row.name}</strong><p className="text-xs text-kumo-subtle">{row.staffNo}</p></Table.Cell><Table.Cell>{row.username}</Table.Cell><Table.Cell>{row.phone || row.email || "未填写"}</Table.Cell><Table.Cell><Switch label={`启用 ${row.name}`} checked={row.status === 1} disabled={status.isPending} onCheckedChange={(value) => status.mutate({ id: row.id, value: value ? 1 : 2 })} /></Table.Cell><Table.Cell><Button size="sm" variant="secondary" onClick={() => setSelected(row)}>配置权限</Button></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard><div className="mt-3 flex justify-between"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>上一页</Button><span className="text-sm text-kumo-subtle">共 {query.data?.total ?? 0} 个销售账号</span><Button variant="secondary" disabled={page * 10 >= (query.data?.total ?? 0)} onClick={() => setPage((value) => value + 1)}>下一页</Button></div></PageState>{selected ? <VisibilityEditor sales={selected} /> : null}{createOpen ? <SalesDialog onClose={() => setCreateOpen(false)} /> : null}</>;
}

const booleanKeys = new Set([
  "marketing.invite.enabled",
  "marketing.invite.review_enabled",
  "marketing.reward.enabled",
  "marketing.reward.recharge_enabled",
  "marketing.coupon.allow_self_claim",
  "marketing.promo.poster_enabled",
]);

export function AdminMarketingConfig() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "marketing", "config"], queryFn: adminMarketingApi.config });
  const [values, setValues] = useState<Record<string, string>>({});
  useEffect(() => { if (query.data) setValues(Object.fromEntries(query.data.items.map((item) => [item.key, item.value]))); }, [query.data]);
  const save = useMutation({ mutationFn: () => adminMarketingApi.saveConfig(values), onSuccess: () => client.invalidateQueries({ queryKey: ["admin", "marketing", "config"] }) });
  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  return <><PageHeader title="营销配置" description="完整展示并保存服务端 marketing.* 配置，不使用前端默认值。" actions={<Button loading={save.isPending} disabled={query.isLoading || !items.length} onClick={() => save.mutate()}>保存配置</Button>} />{save.error ? <Banner variant="error" title="配置保存失败" description={getApiMessage(save.error)} /> : null}{save.isSuccess ? <Banner variant="default" title="营销配置已保存" /> : null}<PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !items.length} emptyTitle="暂无营销配置"><LayerCard className="grid gap-5 p-4">{items.map((item) => booleanKeys.has(item.key) ? <Switch key={item.key} label={item.description} checked={["1", "true", "on"].includes(values[item.key] ?? "")} onCheckedChange={(checked) => setValues((current) => ({ ...current, [item.key]: checked ? "1" : "0" }))} /> : <Input key={item.key} label={item.description} description={item.key} value={values[item.key] ?? ""} onChange={(event) => setValues((current) => ({ ...current, [item.key]: event.target.value }))} />)}</LayerCard></PageState></>;
}
