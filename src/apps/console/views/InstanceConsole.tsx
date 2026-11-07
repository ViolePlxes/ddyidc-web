import { InstanceUpgrade } from '../../../shared/components/InstanceUpgrade';
import { instanceAddress } from '../../../shared/utils/instanceAddress';
import { InstanceSecurityGroups } from '../../../shared/components/InstanceSecurityGroups';
import { Dialog } from "../../../shared/components/Dialog";
import { InstanceStatusControl, useInstanceStatus } from '../../../shared/components/InstanceLiveStatus';
import { InstanceCredentials, InstanceRemark } from '../../../shared/components/InstanceManagement';
import { TransferDialog } from "../../../shared/components/TransferDialog";
import { BillingInfo, CopyValue, InfoGroup, InstanceMonitoring, configValue } from "./instanceDetails";
import { InstanceNAT } from "./InstanceNAT";
import { Banner, Button, Input, LayerCard, Select, Switch, Table, Tabs } from "@cloudflare/kumo";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { consoleApi, type InstanceActionInput, type InstanceImages } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageState } from "../../../shared/components/PageState";

const eventLabels: Record<string, string> = {
  remark: "修改备注",
 edit:"修改实例",credentials:"查看登录信息",auto_renew:"自动续费设置",renew:"实例续费",upgrade:"实例升降配",
  hard_stop: "硬关机", hard_reboot: "硬重启", rescue: "进入救援系统", exit_rescue: "退出救援系统",
  start: "开机", stop: "关机", reboot: "重启", reinstall: "重装系统",
  reset_password: "重置密码", remote: "远程连接", destroy: "销毁实例",
};

export function ActionDialog({
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
      <Dialog className="grid gap-4 p-8">
        <div className="grid gap-2">
          <Dialog.Title className="text-2xl font-semibold">{title}</Dialog.Title>
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

export function RescueDialog({ disabled, loading, onConfirm }: { disabled?: boolean; loading?: boolean; onConfirm: (input: InstanceActionInput) => void }) {
  const [open, setOpen] = useState(false);
  const [system, setSystem] = useState("2");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const valid = password.length >= 12 && password.length <= 128 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password);
  return <Dialog.Root open={open} onOpenChange={(value) => { setOpen(value); if (!value) { setPassword(""); setConfirmed(false); } }}>
    <Dialog.Trigger render={<Button variant="secondary" disabled={disabled || loading}>救援系统</Button>} />
    <Dialog className="grid gap-4 p-8">
      <Dialog.Title>进入救援系统</Dialog.Title>
      <Dialog.Description>将重启实例进入临时救援环境，中断当前业务。完成修复后，请退出救援系统恢复正常启动。</Dialog.Description>
      <Select label="救援系统" value={system} items={{ "2": "Linux", "1": "Windows" }} onValueChange={value => setSystem(String(value))} />
      <Input label="临时救援密码" type="password" value={password} autoComplete="new-password" onChange={event => setPassword(event.target.value)} />
      <p className="text-base text-kumo-subtle">至少 12 位，包含大小写字母和数字。临时密码仅用于本次救援，请妥善保存。</p>
      <Switch label="我确认可以重启并中断业务" checked={confirmed} onCheckedChange={setConfirmed} />
      <div className="flex flex-wrap justify-end gap-3"><Dialog.Close render={<Button variant="secondary">取消</Button>} /><Button disabled={!valid || !confirmed} loading={loading} onClick={() => { onConfirm({ action: "rescue", rescueSystem: system, password, force: true }); setOpen(false); setPassword(""); setConfirmed(false); }}>进入救援</Button></div>
    </Dialog>
  </Dialog.Root>;
}

export function ReinstallDialog({
  instanceId,
  currentPort,
  disabled,
  loading,
  onConfirm,
  loadImages,
  scope = "customer",
}: {
  instanceId: string;
  currentPort?: string;
  loadImages?: () => Promise<InstanceImages>;
  scope?: string;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: (input: InstanceActionInput) => void;
}) {
  const [open, setOpen] = useState(()=>!disabled&&new URLSearchParams(window.location.search).get('action')==='reinstall');
  const [review, setReview] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [imageId, setImageId] = useState("");
  const [port, setPort] = useState(currentPort||"");
  const validPort = /^\d+$/.test(port) && Number(port) >= 1 && Number(port) <= 65535;
  const [formatDataDisk, setFormatDataDisk] = useState(false);
  const images = useQuery({
    queryKey: [scope, "instances", instanceId, "images"],
    queryFn: loadImages ?? (() => consoleApi.instanceImages(instanceId)),
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
    if (!images.data || images.isFetching || groupName) return;
    const initialGroup = images.data.groups.find((group) => group.name === images.data.currentImageGroup)
      ?? images.data.groups.find((group) => group.child.some((image) => image.id === images.data?.currentImageId))
      ?? images.data.groups[0];
    if (!initialGroup) return;
    setGroupName(initialGroup.name);
    const initialImage = initialGroup.child.find((image) => image.id === images.data?.currentImageId) ?? initialGroup.child[0];
    setImageId(initialImage?.id ?? "");
  }, [groupName, images.data, images.isFetching]);

  const changeGroup = (next: string | null) => {
    if (!next) return;
    setGroupName(next);
    setImageId(groups.find((group) => group.name === next)?.child[0]?.id ?? "");
    setReview(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); setReview(false); if(next){setGroupName("");setImageId("")}; if (next) setPort(currentPort && /^\d+$/.test(currentPort) && Number(currentPort) > 0 && Number(currentPort) <= 65535 ? currentPort : ""); }}>
      <Dialog.Trigger render={<Button variant="secondary" disabled={disabled || loading}>重装系统</Button>} />
      <Dialog className="grid gap-4 p-8">
        <div className="grid gap-2">
          <Dialog.Title className="text-2xl font-semibold">{review ? "二次确认重装" : "选择重装系统"}</Dialog.Title>
          <Dialog.Description className="text-kumo-subtle">
            {review ? "数据将清空。请再次核对镜像与端口，确认后将开始重装系统。" : "镜像来自该商品订购配置；重装会覆盖系统盘数据。"}
          </Dialog.Description>
        </div>
        {images.isLoading ? <PageState loading><></></PageState> : null}
        {images.error ? <Banner variant="error" title="镜像列表加载失败" description={getApiMessage(images.error)} /> : null}
        {!images.isLoading && !images.error && groups.length === 0 ? (
          <LayerCard className=" px-5 py-4 text-base text-kumo-subtle">该商品暂无可用重装镜像。</LayerCard>
        ) : null}
        {!images.isLoading && !images.error && groups.length > 0 && !review ? (
          <div className="grid gap-4">
            <Select label="系统分组" value={selectedGroup?.name ?? ""} onValueChange={changeGroup} items={groupItems} />
            <Select label="系统镜像" value={imageId} onValueChange={(next) => { if (next) setImageId(next); }} items={imageItems} />
            <Input label="SSH / RDP 端口" type="number" min={1} max={65535} step={1} placeholder="请输入 1–65535 的整数" value={port} onChange={(event) => setPort(event.target.value)} />
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
            <Button disabled={!imageId || !validPort || images.isLoading || Boolean(images.error)} onClick={() => setReview(true)}>下一步确认</Button>
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
  const live = useInstanceStatus(instanceId,undefined,Boolean(detail.data),()=>detail.refetch());
  const monitor = useQuery({
    queryKey: ["instance-monitor", instanceId],
    queryFn: () => consoleApi.instanceMonitor(instanceId),
    staleTime: Infinity, refetchOnMount: "always", refetchOnWindowFocus: false, refetchOnReconnect: false, refetchInterval: false,
    enabled: Boolean(instanceId) && Boolean(detail.data?.capabilities.traffic),
    retry: false,
  });
  const remoteWindow = useRef<Window|null>(null);
  const actionBusy = useRef(false);
  const action = useMutation({
    mutationFn: (input: InstanceActionInput) => consoleApi.instanceAction(instanceId, input),
    onSuccess: async (result,input) => {
      if(input.action!=="remote")live.afterAction(input.action);
      if (result.remote) {
        const expectedPath = `/console/instance/${encodeURIComponent(instanceId)}/vnc`;
        const target = new URL(result.remote.url, window.location.origin);
        if (result.remote.url.startsWith("/") && !result.remote.url.startsWith("//") && target.origin === window.location.origin && target.pathname === expectedPath) {
          if(remoteWindow.current&&!remoteWindow.current.closed)remoteWindow.current.location.replace(`${target.pathname}${target.search}`);
        } else {
          remoteWindow.current?.close();
          setNotice("服务器返回了非本站远程会话地址，系统已阻止打开。");
          return;
        }
      }
      setNotice(result.message || "操作已提交");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["instances", instanceId], exact:true }),
        queryClient.invalidateQueries({ queryKey: ["instances", "product-list"] }),
      ]);
    },
    onError:()=>remoteWindow.current?.close(),
    onSettled:()=>{actionBusy.current=false;remoteWindow.current=null},
  });
  const instance = detail.data;
  const capabilities = instance?.capabilities;
  const submit = (input: InstanceActionInput) => {
    if(actionBusy.current)return;
    if(input.action==='remote'){const target=window.open('about:blank','_blank');if(!target){setNotice('请允许弹出窗口后重试');return}target.opener=null;remoteWindow.current=target}
    actionBusy.current=true;setNotice("");action.mutate(input);
  };

  const [activeTab, setActiveTab] = useState("overview");
  const config = (fields: string[], names: string[] = []) => instance ? configValue(instance, fields, names) : "—";
  const resetPassword = <ActionDialog label="重置密码" title="重置实例密码" description="请输入至少 12 位、包含大小写字母与数字的新密码。" disabled={!capabilities?.resetPassword} loading={action.isPending} onConfirm={() => submit({ action: "reset_password", password })}>
    <Input label="新密码" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
  </ActionDialog>;
  return (
    <PageState loading={detail.isLoading} error={detail.error ? getApiMessage(detail.error) : null}
      empty={!detail.isLoading && !detail.error && !instance} emptyTitle="实例不存在">
      {instance ? <div className="grid gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3"><h1 className="break-all text-2xl font-semibold">{instance.name}</h1><CopyValue value={instance.primaryIp} label="实例 IP" /></div>
          <div aria-label="实例操作" className="flex flex-wrap gap-2">
 <TransferDialog instanceId={instanceId} disabled={instance.productionLocked} />
            <ActionDialog label="开机" title="确认开机" description="确认后将启动此实例。" disabled={!capabilities?.start || (live.data?.status ?? instance.status) === 3} loading={action.isPending} onConfirm={() => submit({ action: "start" })} />
            <ActionDialog label="关机" title="确认关机" description="关机将中断实例上的业务，请确认服务已安全停止。" disabled={!capabilities?.stop || instance.status === 4} loading={action.isPending} onConfirm={() => submit({ action: "stop" })} />
            <ActionDialog label="重启" title="确认重启" description="重启期间实例将短暂不可用。" disabled={!capabilities?.reboot || instance.status !== 3} loading={action.isPending} onConfirm={() => submit({ action: "reboot" })} />
            <ActionDialog label="硬关机" title="确认硬关机" description="将强制切断实例电源，未保存的数据可能丢失。仅在正常关机无效时使用。" disabled={!capabilities?.hardStop || live.busy || (live.data?.status ?? instance.status) === 4} loading={action.isPending} onConfirm={() => submit({ action: "hard_stop" })} /><ActionDialog label="硬重启" title="确认硬重启" description="将强制断电并重新启动，可能导致未保存的数据丢失或文件系统损坏。请确认可以中断业务。" disabled={!capabilities?.hardReboot || live.busy} loading={action.isPending} onConfirm={() => submit({ action: "hard_reboot" })} /><RescueDialog disabled={!capabilities?.rescue || live.busy} loading={action.isPending} onConfirm={submit} /><ActionDialog label="退出救援系统" title="确认退出救援系统" description="将重启实例并恢复正常系统启动。请确认救援操作已完成。" disabled={!capabilities?.exitRescue || live.busy} loading={action.isPending} onConfirm={() => submit({ action: "exit_rescue" })} />
            <Button variant="secondary" disabled={!capabilities?.remote || action.isPending} onClick={() => submit({ action: "remote" })}>VNC</Button>
          </div>
        </header>
        <Tabs variant="underline" aria-label="实例详情导航" value={activeTab} onValueChange={setActiveTab} tabs={[
          { value: "overview", label: "概要" }, { value: "upgrade", label: "产品升级降级" }, { value: "security", label: "安全组" },...(capabilities?.nat ? [{ value: "nat", label: "NAT转发" }] : []),
          { value: "settings", label: "设置" }, { value: "logs", label: "日志" }, { value: "billing", label: "财务" },
        ]} />
        {instance.warning ? <Banner variant="alert" title="实例信息提示" description={instance.warning} /> : null}
		{instance.readOnly ? <Banner variant="secondary" title={instance.infoSource === "upstream" ? "已获取实时实例信息" : "当前显示已保存的实例信息"} description="当前仅开放信息查询，机器操作和自动任务尚未开启。" /> : null}
        {notice ? <Banner title="操作结果" description={notice} /> : null}
        {action.error ? <Banner variant="error" title="实例操作失败" description={getApiMessage(action.error)} /> : null}
        {activeTab === "overview" ? <div className="grid items-start gap-6 xl:grid-cols-[minmax(20rem,1fr)_minmax(0,2fr)]">
          <aside aria-label="实例信息面板" className="grid min-w-0 gap-4">
            <InfoGroup title="实例信息" rows={[
              { label: "数据中心", value: config(["data_center", "region", "area"], ["数据中心", "地域", "区域"]) },
              { label: "产品名称", value: instance.productName }, { label: "实例 ID", value: instance.id },
              { label: "资源编号", value: instance.upstreamInstanceId || "—" }, { label: "实例名称", value: instance.name },
              { label: "实例状态", value: <InstanceStatusControl live={live} fallback={instance.powerStatus}/> }, { label: "备注信息", value: <InstanceRemark key={instance.id} instance={instance}/> },
            ]} />
            <InfoGroup title="登录信息" action={resetPassword} rows={[
              { label: "实例 IP", value: <CopyValue value={instanceAddress(instance.primaryIp, instance.port, instance.operatingSystem) ?? instance.primaryIp} label="实例 IP" /> },
              { label: "用户名", value: instance.username?<CopyValue value={instance.username} label="用户名" />:"服务未提供" },
              { label: "密码", value: <InstanceCredentials key={instance.id} instance={instance}/> },
              { label: instance.portIsDefault ? "端口（默认）" : "端口", value: instance.port?<CopyValue value={instance.port} label="端口" />:"服务未提供有效端口" },
            ]} />
            <InfoGroup title="系统信息" columns={2} action={<ReinstallDialog instanceId={instanceId} currentPort={instance.port} disabled={!capabilities?.reinstall} loading={action.isPending} onConfirm={submit} />} rows={[
              { label: "系统名称", value: instance.currentImageGroup || instance.operatingSystem || "—" },
              { label: "系统版本", value: instance.currentImageName || instance.operatingSystem || "—" },
            ]} />
            <InfoGroup title="实例规格" columns={3} rows={[
              { label: "网络类型", value: config(["network"], ["网络类型"]) }, { label: "系统盘", value: config(["system_disk"], ["系统盘"]) },
              { label: "CPU", value: config(["cpu"], ["CPU", "vCPU", "处理器核心"]) }, { label: "内存", value: config(["memory"], ["内存"]) },
              { label: "带宽", value: config(["bandwidth"], ["带宽", "上行带宽", "下行带宽"]) }, { label: "数据盘", value: config(["data_disk"], ["数据盘"]) },
            ]} />
            <BillingInfo instance={instance} />
          </aside>
          <InstanceMonitoring monitor={monitor.data} loading={monitor.isLoading} error={monitor.error ? getApiMessage(monitor.error) : undefined} />
        </div> : null}
        {activeTab === "billing" ? <div className="max-w-2xl"><BillingInfo instance={instance} /></div> : null}
        {activeTab === "security" ? <InstanceSecurityGroups instanceId={instanceId} disabled={instance.productionLocked} /> : null}
        {activeTab === "nat" ? <InstanceNAT instanceId={instanceId} disabled={instance.productionLocked} /> : null}
        {activeTab === "upgrade" ? <InstanceUpgrade instance={instance} /> : null}
        {activeTab === "settings" ? <div className="grid gap-4">
          <LayerCard className="grid gap-3 px-5 py-4"><h2 className="text-lg font-semibold">实例设置</h2><div className="flex flex-wrap gap-2">{resetPassword}<ReinstallDialog instanceId={instanceId} currentPort={instance.port} disabled={!capabilities?.reinstall} loading={action.isPending} onConfirm={submit} /><Button variant="secondary" disabled>销毁实例（暂不支持）</Button></div><p className="text-base text-kumo-subtle">此实例暂不支持自助销毁，请联系客服。</p></LayerCard>
                      <LayerCard className=" overflow-x-auto p-0">
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
        </div> : null}
        {activeTab === "logs" ?             <LayerCard className=" overflow-x-auto p-0">
              <div className="p-5"><h2 className="text-lg font-semibold text-kumo-strong">操作日志</h2></div>
              <Table>
                <Table.Header variant="compact"><Table.Row><Table.Head>时间</Table.Head><Table.Head>操作</Table.Head><Table.Head>结果</Table.Head><Table.Head>说明</Table.Head></Table.Row></Table.Header>
                <Table.Body data-animate-list>
                  {instance.events.length ? instance.events.map((event) => (
                    <Table.Row key={event.id}><Table.Cell>{event.createdAt}</Table.Cell><Table.Cell>{eventLabels[event.type] || event.type}</Table.Cell><Table.Cell>{event.status === 1 ? "处理中" : event.status === 2 ? "成功" : "失败"}</Table.Cell><Table.Cell>{event.message || "—"}</Table.Cell></Table.Row>
                  )) : <Table.Row><Table.Cell colSpan={4}>暂无操作记录</Table.Cell></Table.Row>}
                </Table.Body>
              </Table>
            </LayerCard> : null}
      </div> : null}
    </PageState>
  );
}
