import { Banner, Button, Dialog, LayerCard, Switch, Table, Tabs } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { transfersApi, type Transfer } from "../api/transfers";
import { getApiMessage } from "../api/request";
import { useAuthStore } from "../stores/auth";
import { PageHeader } from "./PageHeader";
import { PageState } from "./PageState";

const labels: Record<string, string> = { pending: "待接收", completed: "已过户", rejected: "已拒绝", cancelled: "已取消", failed:"过户失败，原路退款" };
export function TransfersPage({ admin = false }: { admin?: boolean }) {
 const client = useQueryClient();
 const user = useAuthStore(state => state.user);
 const [page, setPage] = useState(1);
 const [tab, setTab] = useState("all");
 const [confirm, setConfirm] = useState<{ row: Transfer; action: "accept" | "reject" | "cancel" }>();
 const [message, setMessage] = useState("");
 const query = useQuery({ queryKey: ["transfers", admin ? "admin" : "customer", page], queryFn: () => transfersApi.list(admin, page), refetchInterval: 5_000 });
 const settings = useQuery({ queryKey: ["transfers", "settings", admin], queryFn: () => admin ? transfersApi.settings() : transfersApi.status(), refetchInterval: 5_000 });
 const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ["transfers"] }), client.invalidateQueries({ queryKey: ["instances"] })]); };
 const save = useMutation({ mutationFn: transfersApi.save, onSuccess: refresh });
 const decide = useMutation({ mutationFn: () => { if (!confirm) throw new Error("请选择转让记录"); return transfersApi.decide(confirm.row.id, confirm.action); }, onSuccess: async () => { setMessage(confirm?.action === "accept" ? "过户成功。请进入实例详情重置密码；如暂不支持自助重置，请登录实例更新访问凭证。" : "转让状态已更新"); setConfirm(undefined); await refresh(); } });
 const rows = (query.data?.list ?? []).filter(row => tab !== "pending" || (row.status === "pending" && row.toCustomerId === String(user?.id)));
 return <div className="grid gap-5">
  <PageHeader title={admin ? "实例转让记录" : "实例接收中心"} description="直连转让免费；市场过户与交易号关联。原购买订单仍归付款人，过户记录保留原订单标记。" />
  {admin ? <LayerCard className="grid gap-3 p-5"><Switch label="启用 Push 转让" checked={settings.data?.enabled ?? false} disabled={settings.isLoading || save.isPending || Boolean(settings.error)} onCheckedChange={enabled => save.mutate(enabled)} /><p>关闭后禁止新发起，已存在的待接收请求仍可确认、拒绝或取消。</p><Link to="/admin/marketplace/settings">交易市场开关与佣金设置</Link></LayerCard> : <div className="flex flex-wrap gap-4"><Link to="/console/certification">实名认证</Link><Link to="/console/marketplace?tab=orders">已有市场订单</Link></div>}
  {!settings.data?.enabled && !settings.isLoading && <Banner title="新转让暂未开放" description="已有请求可继续处理，历史记录仍可查询。" />}
  {(save.error || settings.error) && <Banner variant="error" title={getApiMessage(save.error || settings.error)} />}
  {message && <Banner title={message} />}
  {!admin && <Tabs value={tab} onValueChange={setTab} tabs={[{ value: "all", label: "全部记录" }, { value: "pending", label: "本页待我接收" }]} />}
  <PageState loading={query.isLoading} skeleton="table" error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !rows.length} emptyTitle="暂无转让记录">
   <LayerCard className="overflow-x-auto"><Table><Table.Header><Table.Row>{["实例 / 转让编号", "发起人 → 接收人", "来源 / 关联交易", "状态", "时间", ...(admin ? ["审计 / 风控"] : ["操作"])].map(label => <Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{rows.map(row => <Table.Row key={row.id}>
    <Table.Cell><Link to={admin ? `/admin/customers/${row.toCustomerId}` : `/console/instances/${row.instanceId}`}>{row.instanceId}</Link><p className="text-sm text-kumo-subtle">{row.id}</p></Table.Cell>
    <Table.Cell>#{row.fromCustomerId} → #{row.toCustomerId}</Table.Cell><Table.Cell>{row.source === "direct" ? "直连转让" : row.source === "marketplace_refund" ? "市场退款返还" : "市场成交"}<p>{row.marketOrderId !== "0" ? row.marketOrderId : "—"}</p></Table.Cell><Table.Cell>{labels[row.status] ?? row.status}</Table.Cell><Table.Cell>{new Date(row.updatedAt).toLocaleString()}</Table.Cell>
    <Table.Cell>{admin ? <><p>{row.operatorIp} / {row.receiverIp || "—"}</p><p>{row.riskFlag ? "风险标记：短期再次转让或往返过户" : "无风险标记"}</p><p>原订单：{row.sourceOrderId}</p></> : row.status === "pending" ? <div className="flex gap-2">{row.toCustomerId === String(user?.id) ? <><Button onClick={() => setConfirm({ row, action: "accept" })}>接收</Button><Button variant="secondary" onClick={() => setConfirm({ row, action: "reject" })}>拒绝</Button></> : <Button variant="secondary" onClick={() => setConfirm({ row, action: "cancel" })}>取消转让</Button>}</div> : "—"}</Table.Cell>
   </Table.Row>)}</Table.Body></Table></LayerCard>
  </PageState>
  <div className="flex items-center justify-end gap-3"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button><span>第 {page} 页，共 {query.data?.total ?? 0} 条</span><Button variant="secondary" disabled={page * 30 >= (query.data?.total ?? 0)} onClick={() => setPage(page + 1)}>下一页</Button></div>
  <Dialog.Root open={Boolean(confirm)} onOpenChange={open => { if (!open && !decide.isPending) { setConfirm(undefined); decide.reset(); } }}><Dialog className="grid gap-4 p-6"><Dialog.Title>{confirm?.action === "accept" ? "确认接收实例" : "确认终止本次转让"}</Dialog.Title><Dialog.Description>请核对实例 {confirm?.row.instanceId} 与双方账号。确认接收后将立即更换实例所有权，关闭原账号远程会话。</Dialog.Description>{decide.error && <Banner variant="error" title={getApiMessage(decide.error)} />}<div className="flex justify-end gap-3"><Button variant="secondary" disabled={decide.isPending} onClick={() => setConfirm(undefined)}>返回</Button><Button loading={decide.isPending} onClick={() => decide.mutate()}>确认</Button></div></Dialog></Dialog.Root>
 </div>;
}
