import { Banner, Button, Dialog, Input, LayerCard, Select, Switch, Table } from "@cloudflare/kumo";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { consoleApi, type InstanceActionInput, type MonitorPoint } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { DefinitionList } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { StatusBadge, type StatusCode } from "../../../shared/components/StatusBadge";
import { TrendChart } from "../../../shared/components/TrendChart";
import { cycleLabels } from "../../../shared/utils/format";

const eventLabels: Record<string, string> = {
  start: "开机", stop: "关机", reboot: "重启", reinstall: "重装系统",
  reset_password: "重置密码", remote: "远程连接", destroy: "销毁实例",
};

function statusBadge(status: number): StatusCode {
  if (status === 3) return "running";
  if (status === 4) return "stopped";
  if (status === 6) return "destroyed";
  if (status === 1 || status === 2) return "provisioning";
  return "expired";
}

function chartPoints(points: MonitorPoint[]): [number, number][] {
  return points.map((point) => [point.timestamp * (point.timestamp < 10_000_000_000 ? 1000 : 1), point.value]);
}

function ActionDialog({
  label,
  title,
  description,
  disabled,
  loading,
  children,
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  disabled?: boolean;
  loading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="secondary" disabled={disabled || loading}>{label}</Button>} />
      <Dialog className="grid gap-5 p-6">
        <div className="grid gap-2">
          <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
          <Dialog.Description className="text-kumo-subtle">{description}</Dialog.Description>
        </div>
        {children}
        <div className="flex justify-end gap-3">
          <Dialog.Close render={<Button variant="secondary">取消</Button>} />
          <Dialog.Close render={<Button loading={loading} onClick={onConfirm}>确认操作</Button>} />
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

function ReinstallDialog({
  instanceId,
  disabled,
  loading,
  onConfirm,
}: {
  instanceId: string;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: (input: InstanceActionInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [imageId, setImageId] = useState("");
  const [port, setPort] = useState("22");
  const [formatDataDisk, setFormatDataDisk] = useState(false);
  const images = useQuery({
    queryKey: ["instances", instanceId, "images"],
    queryFn: () => consoleApi.instanceImages(instanceId),
    enabled: open && Boolean(instanceId),
    retry: false,
    placeholderData: keepPreviousData,
    staleTime: 10 * 60 * 1000,
  });
  const groups = images.data?.groups ?? [];
  const selectedGroup = groups.find((group) => group.name === groupName) ?? groups[0];
  const selectedImage = selectedGroup?.child.find((image) => image.id === imageId);
  const groupItems = useMemo(
    () => Object.fromEntries(groups.map((group) => [group.name, `${group.name}（${group.child.length} 个镜像）`])),
    [groups],
  );
  const imageItems = useMemo(
    () => Object.fromEntries((selectedGroup?.child ?? []).map((image) => [image.id, `${image.version}${image.pricing ? `（¥${image.pricing.toFixed(2)}）` : ""}`])),
    [selectedGroup],
  );

  useEffect(() => {
    if (!images.data || groupName) return;
    const initialGroup = images.data.groups.find((group) => group.name === images.data.currentImageGroup)
      ?? images.data.groups.find((group) => group.child.some((image) => image.id === images.data?.currentImageId))
      ?? images.data.groups[0];
    if (!initialGroup) return;
    setGroupName(initialGroup.name);
    const initialImage = initialGroup.child.find((image) => image.id === images.data?.currentImageId) ?? initialGroup.child[0];
    setImageId(initialImage?.id ?? "");
  }, [groupName, images.data]);

  const changeGroup = (next: string | null) => {
    if (!next) return;
    setGroupName(next);
    setImageId(groups.find((group) => group.name === next)?.child[0]?.id ?? "");
    setReview(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setReview(false); }}>
      <Dialog.Trigger render={<Button variant="secondary" disabled={disabled || loading}>重装系统</Button>} />
      <Dialog className="grid gap-5 p-6">
        <div className="grid gap-2">
          <Dialog.Title className="text-xl font-semibold">{review ? "二次确认重装" : "选择重装系统"}</Dialog.Title>
          <Dialog.Description className="text-kumo-subtle">
            {review ? "请再次核对镜像与端口。确认后将向上游发送真实重装指令。" : "镜像来自该商品订购配置；重装会覆盖系统盘数据。"}
          </Dialog.Description>
        </div>
        {images.isLoading ? <PageState loading skeleton="form"><></></PageState> : null}
        {images.error ? <Banner variant="error" title="镜像列表加载失败" description={getApiMessage(images.error)} /> : null}
        {!images.isLoading && !images.error && groups.length === 0 ? (
          <LayerCard className="shadow-none p-5 text-sm text-kumo-subtle">该商品暂无可用重装镜像。</LayerCard>
        ) : null}
        {!images.isLoading && !images.error && groups.length > 0 && !review ? (
          <div className="grid gap-4">
            <Select label="系统分组" value={selectedGroup?.name ?? ""} onValueChange={changeGroup} items={groupItems} />
            <Select label="系统镜像" value={imageId} onValueChange={(next) => { if (next) setImageId(next); }} items={imageItems} />
            <Input label="SSH / RDP 端口" type="number" min={1} max={65535} value={port} onChange={(event) => setPort(event.target.value)} />
            <Switch label="格式化数据盘（数据将不可恢复）" checked={formatDataDisk} onCheckedChange={setFormatDataDisk} />
            {images.data?.currentImageName ? <Banner title="当前系统" description={`${images.data.currentImageGroup ? `${images.data.currentImageGroup} · ` : ""}${images.data.currentImageName}`} /> : null}
          </div>
        ) : null}
        {review ? (
          <Banner
            variant="alert"
            title="即将执行高危操作"
            description={`${selectedGroup?.name ?? "未分组"} · ${selectedImage?.version ?? imageId}；端口 ${port}；${formatDataDisk ? "格式化数据盘" : "保留数据盘"}。系统盘数据将被覆盖。`}
          />
        ) : null}
        <div className="flex justify-end gap-3">
          {review ? <Button variant="secondary" onClick={() => setReview(false)}>返回修改</Button> : <Dialog.Close render={<Button variant="secondary">取消</Button>} />}
          {!review ? (
            <Button disabled={!imageId || !port || images.isLoading || Boolean(images.error)} onClick={() => setReview(true)}>下一步确认</Button>
          ) : (
            <Dialog.Close render={<Button variant="destructive" loading={loading} onClick={() => onConfirm({ action: "reinstall", imageId, port, formatDataDisk })}>确认重装</Button>} />
          )}
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

export function InstanceConsole() {
  const { instanceId = "" } = useParams();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const detail = useQuery({
    queryKey: ["instances", instanceId],
    queryFn: () => consoleApi.instance(instanceId),
    enabled: Boolean(instanceId),
    retry: false,
    placeholderData: keepPreviousData,
  });
  const monitor = useQuery({
    queryKey: ["instances", instanceId, "monitor"],
    queryFn: () => consoleApi.instanceMonitor(instanceId),
    enabled: Boolean(instanceId) && Boolean(detail.data?.capabilities.traffic),
    retry: false,
  });
  const action = useMutation({
    mutationFn: (input: InstanceActionInput) => consoleApi.instanceAction(instanceId, input),
    onSuccess: async (result) => {
      if (result.remote) {
        const expectedPath = `/console/instance/${encodeURIComponent(instanceId)}/vnc`;
        const target = new URL(result.remote.url, window.location.origin);
        if (result.remote.url.startsWith("/") && !result.remote.url.startsWith("//") && target.origin === window.location.origin && target.pathname === expectedPath) {
          window.open(`${target.pathname}${target.search}`, "_blank", "noopener,noreferrer");
        } else {
          setNotice("服务器返回了非本站远程会话地址，系统已阻止打开。");
          return;
        }
      }
      setNotice(result.message || "操作已提交至上游");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["instances", instanceId] }),
        queryClient.invalidateQueries({ queryKey: ["instances", "product-list"] }),
      ]);
    },
  });
  const instance = detail.data;
  const capabilities = instance?.capabilities;
  const submit = (input: InstanceActionInput) => { setNotice(""); action.mutate(input); };

  return (
    <>
      <PageHeader
        title={instance?.name || "产品控制台"}
        description={instance ? `${instance.productName} · 实例 ${instance.id}` : "读取实例详情与真实上游能力"}
        actions={instance ? <StatusBadge status={statusBadge(instance.status)} /> : undefined}
      />
      <PageState
        loading={detail.isLoading}
        skeleton="detail"
        error={detail.error ? getApiMessage(detail.error) : null}
        empty={!detail.isLoading && !detail.error && !instance}
        emptyTitle="实例不存在"
      >
        {instance ? (
          <div className="grid gap-6">
            {instance.warning ? <Banner variant="alert" title="上游信息提示" description={instance.warning} /> : null}
            {notice ? <Banner title="操作结果" description={notice} /> : null}
            {action.error ? <Banner variant="error" title="实例操作失败" description={getApiMessage(action.error)} /> : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <LayerCard className="shadow-none grid gap-4 p-5">
                <h2 className="text-lg font-semibold text-kumo-strong">基础开通信息</h2>
                <DefinitionList rows={[
                  { label: "实例名称", value: instance.name },
                  { label: "实例唯一 ID", value: instance.id },
                  { label: "上游实例 ID", value: instance.upstreamInstanceId || "—" },
                  { label: "主机名", value: instance.hostname || "—" },
                  { label: "主 IP 地址", value: instance.primaryIp || "—" },
                  { label: "子网掩码", value: instance.subnetMask || "—" },
                  { label: "网关", value: instance.gateway || "—" },
                  { label: "操作系统", value: instance.operatingSystem || "—" },
                ]} />
              </LayerCard>
              <LayerCard className="shadow-none grid gap-4 p-5">
                <h2 className="text-lg font-semibold text-kumo-strong">计费与关联</h2>
                <DefinitionList rows={[
                  { label: "关联商品", value: instance.productName },
                  { label: "计费周期", value: cycleLabels[instance.billingCycle ?? ""] || instance.billingCycle || "—" },
                  { label: "开通时间", value: instance.activatedAt || "—" },
                  { label: "到期时间", value: instance.expiresAt || "—" },
                  { label: "登录密码", value: instance.passwordMasked || "未保存" },
                  { label: "关联订单", value: instance.orderNo ? <Link className="text-kumo-link" to={`/console/orders/${instance.orderId}`} viewTransition>{instance.orderNo}</Link> : instance.orderId },
                ]} />
              </LayerCard>
            </div>

            <LayerCard className="shadow-none grid gap-4 p-5">
              <div>
                <h2 className="text-lg font-semibold text-kumo-strong">实例操作</h2>
                <p className="text-sm text-kumo-subtle">仅展示供应商适配器已确认支持的真实操作，提交结果以上游响应为准。</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ActionDialog label="开机" title="确认开机" description="将向上游提交真实开机指令。" disabled={!capabilities?.start || instance.status === 3} loading={action.isPending} onConfirm={() => submit({ action: "start" })} />
                <ActionDialog label="关机" title="确认关机" description="关机将中断实例上的业务，请确认服务已安全停止。" disabled={!capabilities?.stop || instance.status === 4} loading={action.isPending} onConfirm={() => submit({ action: "stop" })} />
                <ActionDialog label="重启" title="确认重启" description="重启期间实例将短暂不可用。" disabled={!capabilities?.reboot || instance.status !== 3} loading={action.isPending} onConfirm={() => submit({ action: "reboot" })} />
                <ActionDialog label="重置密码" title="重置实例密码" description="请输入至少 12 位、包含大小写字母与数字的新密码。" disabled={!capabilities?.resetPassword} loading={action.isPending} onConfirm={() => submit({ action: "reset_password", password })}>
                  <Input label="新密码" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
                </ActionDialog>
                <ReinstallDialog instanceId={instanceId} disabled={!capabilities?.reinstall} loading={action.isPending} onConfirm={submit} />
                <Button variant="secondary" disabled={!capabilities?.remote || action.isPending} onClick={() => submit({ action: "remote" })}>远程连接</Button>
                <Button variant="secondary" disabled>销毁实例（暂不支持）</Button>
              </div>
              {!capabilities?.destroy ? <Banner variant="alert" title="销毁操作未开放" description="当前上游没有已验证的客户侧销毁协议，因此不会展示可提交的销毁按钮。" /> : null}
            </LayerCard>

            <section className="grid gap-4">
              <div>
                <h2 className="text-lg font-semibold text-kumo-strong">资源统计</h2>
                <p className="text-sm text-kumo-subtle">最近 24 小时上游监控数据。</p>
              </div>
              {monitor.isLoading ? <PageState loading skeleton="chart"><></></PageState> : null}
              {!monitor.isLoading && (!monitor.data?.available || monitor.error) ? (
                <LayerCard className="shadow-none p-5 text-sm text-kumo-subtle">{monitor.data?.message || (monitor.error ? getApiMessage(monitor.error) : "当前实例暂无监控数据。")}</LayerCard>
              ) : null}
              {monitor.data?.available ? (
                <div className="grid gap-5 xl:grid-cols-2">
                  <TrendChart title="CPU 使用率" values={chartPoints(monitor.data.cpu)} yAxisName="使用率（%）" valuePrefix="" valueSuffix="%" />
                  <TrendChart title="内存使用率" values={chartPoints(monitor.data.memory)} yAxisName="使用率（%）" valuePrefix="" valueSuffix="%" />
                  <TrendChart title="磁盘读取" values={chartPoints(monitor.data.diskRead)} yAxisName="读取速度（KB/s）" valuePrefix="" />
                  <TrendChart title="磁盘写入" values={chartPoints(monitor.data.diskWrite)} yAxisName="写入速度（KB/s）" valuePrefix="" />
                  <TrendChart title="网络流入" values={chartPoints(monitor.data.networkIn)} yAxisName="流量（bps）" valuePrefix="" />
                  <TrendChart title="网络流出" values={chartPoints(monitor.data.networkOut)} yAxisName="流量（bps）" valuePrefix="" />
                </div>
              ) : null}
            </section>

            <LayerCard className="shadow-none overflow-x-auto p-0">
              <div className="p-5">
                <h2 className="text-lg font-semibold text-kumo-strong">购买配置</h2>
              </div>
              <Table>
                <Table.Header variant="compact"><Table.Row><Table.Head>配置项</Table.Head><Table.Head>所选值</Table.Head></Table.Row></Table.Header>
                <Table.Body data-animate-list>
                  {instance.config.length ? instance.config.map((item) => <Table.Row key={item.id}><Table.Cell>{item.displayName}</Table.Cell><Table.Cell>{item.displayValue}</Table.Cell></Table.Row>) : <Table.Row><Table.Cell colSpan={2}>固定套餐无额外选配项</Table.Cell></Table.Row>}
                </Table.Body>
              </Table>
            </LayerCard>

            <LayerCard className="shadow-none overflow-x-auto p-0">
              <div className="p-5"><h2 className="text-lg font-semibold text-kumo-strong">操作日志</h2></div>
              <Table>
                <Table.Header variant="compact"><Table.Row><Table.Head>时间</Table.Head><Table.Head>操作</Table.Head><Table.Head>结果</Table.Head><Table.Head>说明</Table.Head></Table.Row></Table.Header>
                <Table.Body data-animate-list>
                  {instance.events.length ? instance.events.map((event) => (
                    <Table.Row key={event.id}><Table.Cell>{event.createdAt}</Table.Cell><Table.Cell>{eventLabels[event.type] || event.type}</Table.Cell><Table.Cell>{event.status === 1 ? "处理中" : event.status === 2 ? "成功" : "失败"}</Table.Cell><Table.Cell>{event.message || "—"}</Table.Cell></Table.Row>
                  )) : <Table.Row><Table.Cell colSpan={4}>暂无操作记录</Table.Cell></Table.Row>}
                </Table.Body>
              </Table>
            </LayerCard>
          </div>
        ) : null}
      </PageState>
    </>
  );
}
