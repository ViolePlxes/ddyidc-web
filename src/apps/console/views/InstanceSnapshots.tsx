import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banner, Button, Input, LayerCard, LayerDialog, Table } from "@cloudflare/kumo";
import { consoleApi } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";

export function InstanceSnapshots({ instanceId, disabled }: { instanceId: string; disabled?: boolean }) {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["instances", instanceId, "snapshots"], queryFn: () => consoleApi.instanceSnapshots(instanceId) });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const refresh = () => cache.invalidateQueries({ queryKey: ["instances", instanceId, "snapshots"] });
  const create = useMutation({
    mutationFn: () => consoleApi.createInstanceSnapshot(instanceId, name.trim()),
    onSuccess: () => { setOpen(false); setName(""); setError(""); return refresh(); },
    onError: (cause) => setError(getApiMessage(cause)),
  });
  const restore = useMutation({
    mutationFn: (snapshotId: string) => consoleApi.restoreInstanceSnapshot(instanceId, snapshotId),
    onSuccess: () => { setError(""); return refresh(); },
    onError: (cause) => setError(getApiMessage(cause)),
  });
  const remove = useMutation({
    mutationFn: (snapshotId: string) => consoleApi.deleteInstanceSnapshot(instanceId, snapshotId),
    onSuccess: () => { setError(""); return refresh(); },
    onError: (cause) => setError(getApiMessage(cause)),
  });
  const snapshots = (query.data ?? []).filter((item) => item.type === "snapshot");
  return <LayerCard className="grid gap-4 px-5 py-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-kumo-strong">快照</h2><p className="text-base text-kumo-subtle">创建系统盘快照，可在系统异常时恢复到创建时的状态。</p></div>
      <Button disabled={disabled} onClick={() => { setError(""); setOpen(true); }}>创建快照</Button>
    </div>
    {error ? <Banner variant="error" title={error} /> : null}
    {query.error ? <Banner variant="error" title={getApiMessage(query.error)} /> : null}
    <div className="overflow-x-auto">
      <Table>
        <Table.Header><Table.Row><Table.Head>磁盘</Table.Head><Table.Head>备注</Table.Head><Table.Head>创建时间</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header>
        <Table.Body>
          {snapshots.map((item) => <Table.Row key={item.id}>
            <Table.Cell>{item.diskName}</Table.Cell>
            <Table.Cell>{item.remarks || "—"}</Table.Cell>
            <Table.Cell>{item.createTime || "—"}</Table.Cell>
            <Table.Cell><div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={disabled || restore.isPending} onClick={() => { if (window.confirm(`确认恢复到快照「${item.remarks || item.id}」？当前磁盘数据会被覆盖。`)) restore.mutate(item.id); }}>恢复</Button>
              <Button variant="destructive" size="sm" disabled={disabled || remove.isPending} onClick={() => { if (window.confirm(`确认删除快照「${item.remarks || item.id}」？`)) remove.mutate(item.id); }}>删除</Button>
            </div></Table.Cell>
          </Table.Row>)}
          {!query.isLoading && !query.error && !snapshots.length ? <Table.Row><Table.Cell colSpan={4}>暂无快照</Table.Cell></Table.Row> : null}
        </Table.Body>
      </Table>
    </div>
    <LayerDialog.Root open={open} onOpenChange={(value) => { if (!create.isPending) setOpen(value); }}>
      <LayerDialog.Content size="sm" closeLabel="关闭">
        <LayerDialog.Title>创建快照</LayerDialog.Title>
        <LayerDialog.Description>快照会占用磁盘空间，创建期间请勿对实例执行重装等操作。</LayerDialog.Description>
        <LayerDialog.Body><div className="grid gap-3">
          <Input label="备注名" value={name} onChange={(event) => setName(event.target.value)} maxLength={255} />
          {error ? <Banner variant="error" title={error} /> : null}
        </div></LayerDialog.Body>
        <LayerDialog.Actions dismissLabel="取消"><LayerDialog.Action loading={create.isPending} disabled={!name.trim()} onClick={() => create.mutate()}>创建</LayerDialog.Action></LayerDialog.Actions>
      </LayerDialog.Content>
    </LayerDialog.Root>
  </LayerCard>;
}
