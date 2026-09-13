import { ArrowsClockwiseIcon, GitBranchIcon } from "@phosphor-icons/react";
import { Badge, Banner, Button, Dialog, LayerCard, Loader, Meter, Table } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  checkUpdates,
  getUpdateStatus,
  getUpdateTasks,
  startUpdate,
  type UpdateTarget,
  type VersionInfo,
} from "../../../shared/api/updateAdmin";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";

const targetLabels: Record<UpdateTarget, string> = { backend: "后端服务", frontend: "前端站点" };

function shortCommit(value: string) {
  return value ? value.slice(0, 8) : "—";
}

function localTime(value?: string) {
  return value ? new Date(value).toLocaleString("zh-CN") : "—";
}

export function AdminUpdates() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState("");
  const status = useQuery({
    queryKey: ["admin", "updates", "status"],
    queryFn: getUpdateStatus,
    refetchInterval: (query) => query.state.data?.runningTask ? 1_000 : 5_000,
  });
  const history = useQuery({
    queryKey: ["admin", "updates", "history"],
    queryFn: getUpdateTasks,
    refetchInterval: status.data?.runningTask ? 1_000 : 5_000,
  });
  const check = useMutation({
    mutationFn: checkUpdates,
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "updates", "status"], data);
      setNotice(data.backend.hasUpdate || data.frontend.hasUpdate ? "已读取远端版本，可更新内容如下。" : "后端与前端均已是最新版本。");
    },
  });
  const update = useMutation({
    mutationFn: startUpdate,
    onSuccess: async (_, target) => {
      setNotice(`${targetLabels[target]}更新任务已启动，请勿关闭服务窗口。`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "updates", "status"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "updates", "history"] }),
      ]);
    },
  });

  if (status.isLoading) return <Loader />;
  if (status.error || !status.data) {
    return (
      <>
        <PageHeader
          title="更新中心"
          description="当前无法读取远端版本，可重新同步 Git 远端引用后恢复。"
          actions={<Button variant="secondary" icon={<ArrowsClockwiseIcon />} loading={check.isPending} onClick={() => check.mutate()}>重新同步远端版本</Button>}
        />
        <Banner variant="error" title="更新状态读取失败" description={getApiMessage(check.error ?? status.error)} />
      </>
    );
  }
  const running = status.data.runningTask;
  const operationError = check.error ?? update.error ?? history.error;

  return (
    <>
      <PageHeader
        title="更新中心"
        description="检查 GitHub 私有仓库版本，并安全更新后端服务或前端站点。"
        actions={<Button variant="secondary" icon={<ArrowsClockwiseIcon />} loading={check.isPending} disabled={Boolean(running)} onClick={() => check.mutate()}>检查更新</Button>}
      />
      {notice ? <Banner title="更新中心" description={notice} /> : null}
      {operationError ? <Banner variant="error" title="操作失败" description={getApiMessage(operationError)} /> : null}
      {running ? (
        <LayerCard className="grid gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-medium text-kumo-strong">正在更新{targetLabels[running.target]}</h2><p className="text-sm text-kumo-subtle">任务 {running.id} · {running.branch}</p></div>
            <Badge variant="warning">执行中</Badge>
          </div>
          <Meter label="任务进度" value={running.progress} customValue={`${running.progress}%`} />
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-4 text-xs text-kumo-default">{running.log || "等待执行日志…"}</pre>
        </LayerCard>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <VersionCard info={status.data.backend} busy={Boolean(running) || update.isPending} onUpdate={() => update.mutate("backend")} />
        <VersionCard info={status.data.frontend} busy={Boolean(running) || update.isPending} onUpdate={() => update.mutate("frontend")} />
      </div>
      <LayerCard className="p-0">
        <div className="p-5"><h2 className="font-medium text-kumo-strong">更新历史</h2><p className="text-sm text-kumo-subtle">记录触发时间、功能提交、分支、版本结果与回滚状态。</p></div>
        <Table>
          <Table.Header variant="compact"><Table.Row><Table.Head>时间</Table.Head><Table.Head>目标 / 状态</Table.Head><Table.Head>功能 / 分支</Table.Head><Table.Head>版本 / 提交变化</Table.Head><Table.Head>日志摘要 / 回滚</Table.Head></Table.Row></Table.Header>
          <Table.Body>
            {(history.data ?? []).map((task) => (
              <Table.Row key={task.id}>
                <Table.Cell>{localTime(task.createdAt)}</Table.Cell>
                <Table.Cell><div className="grid gap-1"><span>{targetLabels[task.target]}</span><Badge variant={task.status === "success" ? "success" : task.status === "failed" ? "error" : "warning"}>{task.status === "success" ? "成功" : task.status === "failed" ? "失败" : "执行中"}</Badge></div></Table.Cell>
                <Table.Cell><div className="grid"><span>{task.feature || "无新提交"}</span><span className="text-xs text-kumo-subtle">{task.branch}</span></div></Table.Cell>
                <Table.Cell><div className="grid"><span className="text-sm">{task.beforeVersion || "—"} → {task.targetVersion || "—"}</span><span className="text-xs text-kumo-subtle">{shortCommit(task.beforeCommit)} → {shortCommit(task.targetCommit)}</span></div></Table.Cell>
                <Table.Cell><div className="grid"><span className="text-sm">{task.error || task.log.split("\n").at(-1) || "—"}</span><span className="text-xs text-kumo-subtle">回滚：{task.rollbackStatus || "—"}</span></div></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        {!history.isLoading && (history.data?.length ?? 0) === 0 ? <div className="p-5 text-sm text-kumo-subtle">暂无更新记录。</div> : null}
      </LayerCard>
    </>
  );
}

function VersionCard({ info, busy, onUpdate }: { info: VersionInfo; busy: boolean; onUpdate: () => void }) {
  return (
    <LayerCard className="grid gap-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-medium text-kumo-strong">{targetLabels[info.target]}</h2><p className="flex items-center gap-1 text-sm text-kumo-subtle"><GitBranchIcon /> {info.branch}</p></div>
        <Badge variant={info.hasUpdate ? "warning" : "success"}>{info.hasUpdate ? `落后 ${info.behind} 个提交` : "已是最新"}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-kumo-subtle">当前版本</dt><dd className="font-medium text-kumo-strong">{info.currentVersion || shortCommit(info.currentCommit)}</dd></div>
        <div><dt className="text-kumo-subtle">远端版本</dt><dd className="font-medium text-kumo-strong">{info.remoteVersion || shortCommit(info.remoteCommit)}</dd></div>
        <div><dt className="text-kumo-subtle">当前提交</dt><dd>{shortCommit(info.currentCommit)}</dd></div>
        <div><dt className="text-kumo-subtle">更新时间</dt><dd>{localTime(info.updatedAt)}</dd></div>
      </dl>
      {info.changes.length > 0 ? <div className="grid gap-2"><p className="text-sm font-medium text-kumo-strong">待更新功能</p>{info.changes.map((change) => <div key={change.commit} className="text-sm"><span>{change.feature}</span><span className="ml-2 text-xs text-kumo-subtle">{shortCommit(change.commit)}</span></div>)}</div> : null}
      <div>
        <Dialog.Root>
          <Dialog.Trigger render={<Button disabled={!info.hasUpdate || busy} loading={busy}>一键更新{targetLabels[info.target]}</Button>} />
          <Dialog className="grid gap-5 p-6">
            <div><Dialog.Title className="text-xl font-semibold">确认更新{targetLabels[info.target]}</Dialog.Title><Dialog.Description className="text-kumo-subtle">系统将从 {info.branch} 拉取 {info.behind} 个提交并自动构建、备份和部署。任务期间请勿手动修改工作区或停止依赖服务。</Dialog.Description></div>
            <div className="flex justify-end gap-2"><Dialog.Close render={<Button variant="secondary">取消</Button>} /><Dialog.Close render={<Button onClick={onUpdate}>确认更新</Button>} /></div>
          </Dialog>
        </Dialog.Root>
      </div>
    </LayerCard>
  );
}
