import { Badge } from "../../../shared/components/Badge";
import { Dialog } from "../../../shared/components/Dialog";
import { Banner, Button, Input, LayerCard, Loader, Pagination, Select, Switch, Table } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { backupAdmin, type BackupInput, type BackupJob } from "../../../shared/api/backupAdmin";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";

const initial: BackupInput = { enabled: false, endpoint: "https://oss-cn-hangzhou.aliyuncs.com", bucket: "", prefix: "ddyidc/", retentionDays: 30, accessKeyId: "", accessKeySecret: "" };
const statuses = { queued: "等待执行", running: "执行中", success: "成功", failed: "失败", interrupted: "已中断", awaiting_review: "已导入，待运维核对放行", released: "运维已核对放行" };
const kinds = { manual: "手动备份", scheduled: "定时备份", restore: "恢复" };
const regions = { "https://oss-cn-hangzhou.aliyuncs.com": "华东 1 · 杭州", "https://oss-cn-shenzhen.aliyuncs.com": "华南 1 · 深圳", "https://oss-cn-beijing.aliyuncs.com": "华北 2 · 北京", "https://oss-cn-qingdao.aliyuncs.com": "华北 1 · 青岛", "https://oss-cn-chengdu.aliyuncs.com": "西南 1 · 成都", custom: "其他地域" };
function bytes(value: number) { return value ? `${(value / 1024 / 1024).toFixed(2)} MB` : "—"; }
function timestamp(value?: string) { return value ? new Date(value).toLocaleString("zh-CN") : "—"; }

export function AdminBackups() {
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<BackupInput>(initial);
  const [notice, setNotice] = useState("");
  const [restoreJob, setRestoreJob] = useState<BackupJob | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const config = useQuery({ queryKey: ["admin", "backup", "config"], queryFn: backupAdmin.config });
  const history = useQuery({ queryKey: ["admin", "backup", "history", page], queryFn: () => backupAdmin.history(page), refetchInterval: (query) => query.state.data?.activeId ? 2_000 : false });
  useEffect(() => { if (config.data) { const { enabled, endpoint, bucket, prefix, retentionDays } = config.data; setForm({ enabled, endpoint, bucket, prefix, retentionDays, accessKeyId: "", accessKeySecret: "" }); } }, [config.data]);
  const refresh = () => cache.invalidateQueries({ queryKey: ["admin", "backup"] });
  const save = useMutation({ mutationFn: backupAdmin.save, onSuccess: (value) => { cache.setQueryData(["admin", "backup", "config"], value); setNotice("配置已加密保存，密钥不会回显。"); } });
  const test = useMutation({ mutationFn: backupAdmin.test, onSuccess: () => setNotice("连接成功：已确认私有 Bucket，完成备份前缀查询和探针写入、删除。") });
  const run = useMutation({ mutationFn: backupAdmin.run, onSuccess: async () => { setNotice("备份任务已提交，完成后可在历史记录下载。"); await refresh(); } });
  const restore = useMutation({ mutationFn: () => backupAdmin.restore(restoreJob!.id, confirmation), onSuccess: async () => { setRestoreJob(null); setNotice("恢复已提交。校验后业务将进入维护状态；导入完成不会自动恢复服务，须由运维核对外部交易并放行，请勿重复操作。"); await refresh(); } });
  const busy = Boolean(history.data?.activeId) || run.isPending || restore.isPending;
  const error = save.error ?? test.error ?? run.error ?? restore.error ?? config.error ?? history.error;
  if (config.isLoading) return <Loader />;
  return <>
    <PageHeader title="数据库备份" description="将 MySQL 全库逻辑备份和用户附件保存至私有 OSS，作为异地备份仓库。" actions={<Button variant="secondary" onClick={() => void refresh()}>刷新记录</Button>} />
    {notice ? <Banner title="备份管理" description={notice} /> : null}
    {error ? <Banner variant="error" title="操作未完成" description={getApiMessage(error)} /> : null}
    <Banner title="备份范围" description="仅包含 MySQL 逻辑导出和 storage 用户附件；不上传 config.yaml、secrets、Redis 或 binlog。恢复加密业务数据需要原 AES 密钥，请单独保管。" />
    <LayerCard className="grid gap-5 p-5">
      <h2 className="text-lg font-semibold">OSS 配置</h2>
      <Switch label="上传备份至 OSS" checked={form.enabled} onCheckedChange={(enabled) => setForm({ ...form, enabled })} disabled={busy} />
      <p className="text-sm text-kumo-subtle">关闭上传时，定时任务仍保留本地业务备份。Bucket 必须为私有，建议在阿里云开启版本控制。未配置时可先使用本地备份。</p>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); save.mutate(form); }}>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="AccessKey ID" value={form.accessKeyId} autoComplete="off" placeholder={config.data?.accessKeyMasked || "请输入 AccessKey ID"} description="已设置时留空保留原值" onChange={(event) => setForm({ ...form, accessKeyId: event.target.value })} />
          <Input label="AccessKey Secret" type="password" autoComplete="new-password" value={form.accessKeySecret} placeholder={config.data?.secretConfigured ? "已设置，留空保留" : "请输入 AccessKey Secret"} onChange={(event) => setForm({ ...form, accessKeySecret: event.target.value })} />
          <Input label="Bucket" value={form.bucket} placeholder="私有备份 Bucket 名称" onChange={(event) => setForm({ ...form, bucket: event.target.value })} />
          <Select label="地域" items={regions} value={form.endpoint in regions ? form.endpoint : "custom"} onValueChange={(value) => setForm({ ...form, endpoint: value === "custom" ? "https://oss-" : value || initial.endpoint })} />
          <Input label="Endpoint" value={form.endpoint} description="阿里云 OSS 地域 HTTPS 地址，不使用 CDN 域名" onChange={(event) => setForm({ ...form, endpoint: event.target.value })} />
          <Input label="上传路径前缀" value={form.prefix} onChange={(event) => setForm({ ...form, prefix: event.target.value })} />
          <Input label="OSS 保留天数" type="number" min={1} max={3650} value={form.retentionDays} onChange={(event) => setForm({ ...form, retentionDays: Number(event.target.value) })} />
        </div>
        <div className="flex flex-wrap gap-3"><Button type="submit" loading={save.isPending} disabled={busy}>保存配置</Button><Button type="button" variant="secondary" loading={test.isPending} disabled={busy || save.isPending} onClick={() => test.mutate()}>测试已保存配置</Button></div>
      </form>
    </LayerCard>
    <LayerCard className="grid gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">备份任务</h2><Button loading={run.isPending} disabled={busy} onClick={() => run.mutate()}>{config.data?.enabled ? "立即备份并上传" : "立即备份到本地"}</Button></div>
      {history.data?.activeId ? <Banner title="任务进行中" description="备份和恢复共用执行锁。恢复会暂停业务；导入完成后仍须运维核对交易、显式放行并启动服务。" /> : null}
      <div className="grid gap-3 text-sm md:grid-cols-3"><div>最近任务：{timestamp(history.data?.items?.[0]?.createdAt)}</div><div>结果：{history.data?.items?.[0] ? statuses[history.data.items[0].status] : "暂无记录"}</div><div>下次定时：{history.data?.nextScheduledAt || "由 systemd timer 管理"}</div></div>
    </LayerCard>
    <LayerCard className="overflow-x-auto p-0">
      <div className="p-5"><h2 className="text-lg font-semibold">备份历史</h2><p className="text-sm text-kumo-subtle">显示最近 100 条任务。本地保留每日 7 天、每周 28 天、每月 370 天；OSS 按配置仅清理本系统记录的对象。</p></div>
      <Table><Table.Header><Table.Row>{["时间 / 类型", "状态", "本地大小", "OSS 大小", "OSS 对象", "耗时", "结果说明", "操作"].map((label) => <Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header>
        <Table.Body>{(history.data?.items ?? []).map((job) => <Table.Row key={job.id}>
          <Table.Cell><div>{timestamp(job.createdAt)}</div><div className="text-sm text-kumo-subtle">{kinds[job.kind]}</div></Table.Cell>
          <Table.Cell><Badge variant={job.status === "success" ? "success" : job.status === "failed" || job.status === "interrupted" ? "error" : "warning"}>{statuses[job.status]}</Badge></Table.Cell>
          <Table.Cell>{bytes(job.localBytes)}</Table.Cell><Table.Cell>{bytes(job.ossBytes)}</Table.Cell>
          <Table.Cell><span className="break-all text-sm">{job.objectKey || (job.kind === "restore" ? "恢复任务" : "仅本地 / 未上传")}</span>{job.expired ? <Badge variant="secondary">OSS 已过期</Badge> : null}</Table.Cell>
          <Table.Cell>{job.finishedAt ? `${(job.durationMs / 1000).toFixed(1)} 秒` : "—"}</Table.Cell>
          <Table.Cell><span className="text-sm">{job.error || job.warning || "—"}</span></Table.Cell>
          <Table.Cell>{job.kind !== "restore" && job.sha256 ? <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => window.open(`/admin/v1/backup/${job.id}/download`, "_blank", "noopener,noreferrer")}>下载</Button><Button variant="secondary" size="sm" disabled={busy} onClick={() => { setRestoreJob(job); setConfirmation(""); }}>恢复</Button></div> : "—"}</Table.Cell>
        </Table.Row>)}</Table.Body></Table>
      {!history.isLoading && !history.data?.items?.length ? <p className="p-5 text-sm text-kumo-subtle">暂无备份记录</p> : null}
      {(history.data?.total ?? 0) > 20 ? <div className="p-5"><Pagination page={page} setPage={setPage} perPage={20} totalCount={history.data?.total ?? 0} /></div> : null}
    </LayerCard>
    <Dialog.Root open={restoreJob !== null} onOpenChange={(open) => { if (!open && !restore.isPending) setRestoreJob(null); }}>
      <Dialog className="grid gap-4 p-6"><Dialog.Title>恢复业务数据</Dialog.Title><Dialog.Description>将覆盖当前 MySQL 数据和用户附件。系统校验后等待已受理工作退出，隔离应用数据库账号并保存回滚副本。导入完成后保持维护状态，须由运维核对支付、退款、采购和续费事实后显式放行。外部写入程序也须纳入停机安排。</Dialog.Description>
        <Banner variant="alert" title="配置和密钥不会从 OSS 恢复" description="必须保留匹配的原 AES 密钥、独立备份签名密钥及应用版本；恢复前副本仅保留本地，不上传 OSS。" />
        <p className="break-all text-sm">所选备份：{restoreJob?.id}</p>
        <Input label={`请输入：恢复 ${restoreJob?.id ?? ""}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        {restore.error ? <Banner variant="error" title="恢复未启动" description={getApiMessage(restore.error)} /> : null}
        <div className="flex justify-end gap-3"><Button variant="secondary" disabled={restore.isPending} onClick={() => setRestoreJob(null)}>取消</Button><Button variant="destructive" loading={restore.isPending} disabled={confirmation !== `恢复 ${restoreJob?.id}`} onClick={() => restore.mutate()}>确认覆盖并恢复</Button></div>
      </Dialog>
    </Dialog.Root>
  </>;
}
