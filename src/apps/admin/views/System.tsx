import {
  Badge,
  Banner,
  Button,
  Input,
  LayerCard,
  Loader,
  Select,
  Switch,
  Table,
  Tabs,
  Textarea,
} from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  getNotificationTemplates,
  getNotifyConfig,
  getNotifyLogs,
  saveNotifyConfig,
  sendTestNotification,
  updateNotificationTemplate,
  type NotificationTemplate,
  type NotifyConfig,
  type NotifyChannel,
} from "../../../shared/api/notifyAdmin";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";

const sceneLabels: Record<string, string> = {
  register: "注册验证码",
  login: "登录验证码",
  reset: "找回密码",
  bindMobile: "绑定手机",
  bindEmail: "绑定邮箱",
  order: "下单成功",
  activation: "开通成功",
  expiry: "到期提醒",
  recharge: "充值到账",
  ticket_reply: "工单回复",
  ticket_new: "新工单提醒",
};

const testParams: Record<string, string> = {
  code: "123456",
  minutes: "5",
  order_no: "DDY-TEST",
  product_name: "测试云主机",
  amount: "¥10.00",
  instance_no: "INS-TEST",
  expires_at: "2026-12-31 23:59",
  recharge_no: "RC-TEST",
  ticket_no: "YHGD-TEST",
  title: "测试工单",
};

export function AdminSystem() {
  const [tab, setTab] = useState("base");
  const [notice, setNotice] = useState("");
  return (
    <>
      <PageHeader title="系统设置" description="配置站点基础信息、真实通知通道、模板与发送记录。" />
      <Tabs
        variant="underline"
        tabs={[
          { value: "base", label: "基础设置" },
          { value: "notify", label: "通知设置" },
          { value: "templates", label: "通知模板" },
          { value: "logs", label: "发送记录" },
        ]}
        value={tab}
        onValueChange={(value) => { setTab(value); setNotice(""); }}
      />
      {notice ? <Banner title="操作完成" description={notice} /> : null}
      {tab === "base" ? <BaseSettings /> : null}
      {tab === "notify" ? <NotifySettings onSaved={setNotice} /> : null}
      {tab === "templates" ? <TemplateSettings onSaved={setNotice} /> : null}
      {tab === "logs" ? <NotifyLogs /> : null}
    </>
  );
}

function BaseSettings() {
  return (
    <LayerCard className="shadow-none grid gap-3 p-5">
      <h2 className="font-medium text-kumo-strong">基础设置</h2>
      <Banner variant="alert" title="尚无基础设置接口" description="当前后端未提供站点名称、客服邮箱与注册开关的读取或保存接口，因此本页不展示推测值，也不会提交无效配置。" />
      <div className="grid gap-1"><span className="text-sm text-kumo-subtle">当前访问地址</span><strong className="text-kumo-strong">{window.location.origin}</strong></div>
    </LayerCard>
  );
}

function NotifySettings({ onSaved }: { onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const configQuery = useQuery({ queryKey: ["admin", "notify", "config"], queryFn: getNotifyConfig });
  const templatesQuery = useQuery({ queryKey: ["admin", "notify", "templates"], queryFn: getNotificationTemplates });
  const [config, setConfig] = useState<NotifyConfig | null>(null);
  const [testScene, setTestScene] = useState("register");
  const [testTarget, setTestTarget] = useState("");

  useEffect(() => { if (configQuery.data) setConfig(configQuery.data); }, [configQuery.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!config) throw new Error("通知配置尚未载入");
      return saveNotifyConfig({ mail: config.mail, sms: config.sms, expiry: config.expiry });
    },
    onSuccess: (next) => {
      setConfig(next);
      queryClient.setQueryData(["admin", "notify", "config"], next);
      onSaved("通知通道配置已保存，通道状态已按凭据完整性自动更新。");
    },
  });
  const test = useMutation({
    mutationFn: () => sendTestNotification(testScene, testTarget, testParams),
    onSuccess: () => onSaved("测试通知已通过真实通道提交。"),
  });

  if (configQuery.isLoading || !config) return <Loader />;
  if (configQuery.error) return <Banner variant="error" title="读取失败" description={getApiMessage(configQuery.error)} />;

  const updateMail = <K extends keyof NotifyConfig["mail"]>(key: K, value: NotifyConfig["mail"][K]) => setConfig((current) => current ? { ...current, mail: { ...current.mail, [key]: value } } : current);
  const updateSMS = <K extends keyof NotifyConfig["sms"]>(key: K, value: NotifyConfig["sms"][K]) => setConfig((current) => current ? { ...current, sms: { ...current.sms, [key]: value } } : current);

  return (
    <div className="grid gap-5">
      <LayerCard className="shadow-none grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-medium text-kumo-strong">邮件 SMTP</h2><p className="text-sm text-kumo-subtle">465 使用 SMTPS，其他端口（常用 587）自动协商 STARTTLS。</p></div>
          <Badge variant={config.mail.mock ? "warning" : "success"}>{config.mail.mock ? "待配置" : "真实通道"}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="SMTP 主机" value={config.mail.host} onChange={(event) => updateMail("host", event.target.value)} />
          <Input label="端口" type="number" value={String(config.mail.port)} onChange={(event) => updateMail("port", Number(event.target.value))} />
          <Input label="用户名 / 发件地址" value={config.mail.username} onChange={(event) => updateMail("username", event.target.value)} />
          <Input label="密码 / 授权码" type="password" value={config.mail.password} onChange={(event) => updateMail("password", event.target.value)} />
          <Input label="发件人名称" value={config.mail.fromName} onChange={(event) => updateMail("fromName", event.target.value)} />
        </div>
      </LayerCard>

      <LayerCard className="shadow-none grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="font-medium text-kumo-strong">阿里云短信</h2><p className="text-sm text-kumo-subtle">SendSms 2017-05-25；TemplateCode 须在阿里云控制台审核通过。</p></div>
          <Badge variant={config.sms.mock ? "warning" : "success"}>{config.sms.mock ? "待配置" : "真实通道"}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="AccessKey ID" value={config.sms.accessKey} onChange={(event) => updateSMS("accessKey", event.target.value)} />
          <Input label="AccessKey Secret" type="password" value={config.sms.accessSecret} onChange={(event) => updateSMS("accessSecret", event.target.value)} />
          <Input label="短信签名 SignName" value={config.sms.signName} onChange={(event) => updateSMS("signName", event.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(templatesQuery.data ?? []).map((template) => (
            <Input
              key={template.scene}
              label={`${sceneLabels[template.scene] ?? template.scene} TemplateCode`}
              placeholder="SMS_123456789"
              value={config.sms.templates[template.scene] ?? ""}
              onChange={(event) => updateSMS("templates", { ...config.sms.templates, [template.scene]: event.target.value })}
            />
          ))}
        </div>
      </LayerCard>

      <LayerCard className="shadow-none grid gap-4 p-5">
        <h2 className="font-medium text-kumo-strong">到期提醒与通道测试</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Switch label="启用实例到期提醒" checked={config.expiry.enabled} onCheckedChange={(enabled) => setConfig({ ...config, expiry: { ...config.expiry, enabled } })} />
          <Input label="提前提醒天数" type="number" min={1} max={30} value={String(config.expiry.daysBefore)} onChange={(event) => setConfig({ ...config, expiry: { ...config.expiry, daysBefore: Number(event.target.value) } })} />
          <Select label="测试场景" value={testScene} onValueChange={(value) => value && setTestScene(value)} items={Object.fromEntries(Object.entries(sceneLabels).map(([key, label]) => [key, label]))} />
          <Input label="测试手机号或邮箱" placeholder="仅成功接收一次即可停止测试" value={testTarget} onChange={(event) => setTestTarget(event.target.value)} />
        </div>
        {save.error || test.error ? <Banner variant="error" title="操作失败" description={getApiMessage(save.error ?? test.error)} /> : null}
        <div className="flex flex-wrap gap-2">
          <Button loading={save.isPending} onClick={() => save.mutate()}>保存通知配置</Button>
          <Button variant="secondary" loading={test.isPending} disabled={!testTarget.trim()} onClick={() => test.mutate()}>发送真实测试通知</Button>
        </div>
      </LayerCard>
    </div>
  );
}

function TemplateSettings({ onSaved }: { onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "notify", "templates"], queryFn: getNotificationTemplates });
  const [items, setItems] = useState<NotificationTemplate[]>([]);
  useEffect(() => { if (query.data) setItems(query.data.map((item) => ({ ...item }))); }, [query.data]);
  const save = useMutation({
    mutationFn: () => Promise.all(items.map(updateNotificationTemplate)),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "notify", "templates"] }); onSaved("场景开关、渠道和模板内容已保存。"); },
  });
  const update = (id: string, patch: Partial<NotificationTemplate>) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  if (query.isLoading) return <Loader />;
  if (query.error) return <Banner variant="error" title="读取失败" description={getApiMessage(query.error)} />;
  return (
    <div className="grid gap-4">
      <Banner title="模板变量" description="使用 {{变量名}} 占位；邮件变量会在渲染时自动进行 HTML 转义。短信正文以阿里云控制台模板为准，此处内容用于变量校验与发送记录快照。" />
      {items.map((template) => (
        <LayerCard key={template.id} className="shadow-none grid gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-medium text-kumo-strong">{sceneLabels[template.scene] ?? template.scene}</h2><p className="text-sm text-kumo-subtle">场景标识：{template.scene}</p></div>
            <Switch label="启用" checked={template.enabled} onCheckedChange={(enabled) => update(template.id, { enabled })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select label="发送渠道" value={template.channel} onValueChange={(value) => value && update(template.id, { channel: value as NotifyChannel })} items={{ email: "仅邮件", sms: "仅短信", both: "邮件 + 短信" }} />
            <Input label="邮件标题" value={template.title} onChange={(event) => update(template.id, { title: event.target.value })} />
          </div>
          <Textarea label="模板内容" rows={4} value={template.content} onChange={(event) => update(template.id, { content: event.target.value })} />
        </LayerCard>
      ))}
      {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
      <div><Button loading={save.isPending} onClick={() => save.mutate()}>保存全部模板</Button></div>
    </div>
  );
}

function NotifyLogs() {
  const query = useQuery({ queryKey: ["admin", "notify", "logs"], queryFn: getNotifyLogs });
  const rows = useMemo(() => query.data ?? [], [query.data]);
  if (query.isLoading) return <Loader />;
  if (query.error) return <Banner variant="error" title="读取失败" description={getApiMessage(query.error)} />;
  return (
    <LayerCard className="shadow-none p-0">
      <Table>
        <Table.Header variant="compact"><Table.Row><Table.Head>时间</Table.Head><Table.Head>场景 / 通道</Table.Head><Table.Head>目标</Table.Head><Table.Head>状态</Table.Head><Table.Head>回执 / 错误</Table.Head></Table.Row></Table.Header>
        <Table.Body>
          {rows.map((log) => (
            <Table.Row key={log.id}>
              <Table.Cell>{new Date(log.createdAt).toLocaleString("zh-CN")}</Table.Cell>
              <Table.Cell><div className="grid"><span>{sceneLabels[log.scene] ?? log.scene}</span><span className="text-xs text-kumo-subtle">{log.channel}</span></div></Table.Cell>
              <Table.Cell>{log.target}</Table.Cell>
              <Table.Cell><Badge variant={log.status === "success" ? "success" : "error"}>{log.status === "success" ? "成功" : "失败"}</Badge></Table.Cell>
              <Table.Cell><span className="text-sm text-kumo-subtle">{log.requestId || log.error || "—"}</span></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {rows.length === 0 ? <div className="p-5 text-sm text-kumo-subtle">暂无通知发送记录。</div> : null}
    </LayerCard>
  );
}
