import { Badge } from "../../../shared/components/Badge";
import { DateRangeField } from "../../../shared/components/DateField";
import { Banner, Button, Input, LayerCard, LinkButton, Select, Switch, Table, Tabs, Textarea } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { cdnsellP2Api, type CdnDomain, type DomainConfig, type DomainInput, type RefreshType } from "../../../shared/api/cdnsellP2";
import { getApiMessage } from "../../../shared/api/request";
import { CdnStatus, formatTraffic } from "../../../shared/components/Cdnsell";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

const businessLabels = { web: "网页加速", video: "视频加速", download: "下载加速" } as const;
const regionLabels = { mainland: "中国大陆", overseas: "海外", global: "全球" } as const;
const emptyDomain: DomainInput = { domain: "", businessType: "web", accelerateRegion: "mainland", originType: "domain", originHost: "", originProtocol: "follow" };
const statusLabels: Record<string, string> = { not_created: "待接入", creating: "接入中", active: "运行中", failed: "失败", removing: "移除中", unverified: "未验证", verified: "已验证", pending: "待处理", running: "处理中", success: "成功", deployed: "已部署", undepolyed: "未部署" };

function label(value: string) { return statusLabels[value] ?? value; }
function Feedback({ message }: { message: string }) { return message ? <Banner title={message} /> : null; }

export function CdnDomains() {
  const client = useQueryClient();
  const [form, setForm] = useState<DomainInput>();
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["cdnsell", "domains"], queryFn: cdnsellP2Api.domains });
  const refresh = () => client.invalidateQueries({ queryKey: ["cdnsell", "domains"] });
  const create = useMutation({ mutationFn: () => cdnsellP2Api.createDomain(form!), onSuccess: () => { setForm(undefined); setMessage("域名已保存，请完成所有权验证后启用加速。 "); void refresh(); }, onError: (error) => setMessage(getApiMessage(error)) });
  const remove = useMutation({ mutationFn: cdnsellP2Api.deleteDomain, onSuccess: () => { setMessage("域名移除任务已创建"); void refresh(); }, onError: (error) => setMessage(getApiMessage(error)) });
  const toggle = useMutation({ mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => cdnsellP2Api.setDomainEnabled(id, enabled), onSuccess: () => { setMessage("域名启停任务已创建"); void refresh(); }, onError: (error) => setMessage(getApiMessage(error)) });
  return <>
    <PageHeader title="我的域名" description="完成所有权验证后，系统才会创建域名接入任务。" actions={<Button onClick={() => setForm({ ...emptyDomain })}>添加域名</Button>} />
    <Feedback message={message} />
    {form ? <LayerCard >
      <LayerCard.Secondary><h2 className="text-lg font-semibold text-kumo-strong">添加加速域名</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Input label="加速域名" placeholder="cdn.example.com" value={form.domain} onChange={(event) => setForm({ ...form, domain: event.target.value })} />
        <Select label="业务类型" value={form.businessType} onValueChange={(value) => setForm({ ...form, businessType: (value ?? "web") as DomainInput["businessType"] })} items={businessLabels} />
        <Select label="加速区域" value={form.accelerateRegion} onValueChange={(value) => setForm({ ...form, accelerateRegion: (value ?? "mainland") as DomainInput["accelerateRegion"] })} items={regionLabels} />
        <Select label="源站类型" value={form.originType} onValueChange={(value) => setForm({ ...form, originType: (value ?? "domain") as DomainInput["originType"] })} items={{ domain: "源站域名", ip: "源站 IP" }} />
        <Input label={form.originType === "domain" ? "源站域名" : "源站 IP"} value={form.originHost} onChange={(event) => setForm({ ...form, originHost: event.target.value })} />
        <Select label="回源协议" value={form.originProtocol} onValueChange={(value) => setForm({ ...form, originProtocol: (value ?? "follow") as DomainInput["originProtocol"] })} items={{ http: "HTTP", follow: "协议跟随", https: "HTTPS" }} />
      </div>
      <Banner variant="alert" title="接入前置条件" description="中国大陆加速域名须完成备案；源站域名不能与加速域名相同。" />
      <div className="flex gap-2"><Button variant="secondary" onClick={() => setForm(undefined)}>取消</Button><Button loading={create.isPending} onClick={() => create.mutate()}>保存并开始验证</Button></div>
    </LayerCard.Primary></LayerCard> : null}
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.data?.length} emptyTitle="暂无加速域名">
      <LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>域名</Table.Head><Table.Head>业务类型</Table.Head><Table.Head>所有权</Table.Head><Table.Head>服务状态</Table.Head><Table.Head>CNAME</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>
        {query.data?.map((domain) => <Table.Row key={domain.id}><Table.Cell><strong className="text-kumo-strong">{domain.domain}</strong><p className="text-xs text-kumo-subtle">{domain.serviceNo || "尚未生成服务编号"}</p></Table.Cell><Table.Cell>{businessLabels[domain.businessType]}</Table.Cell><Table.Cell><CdnStatus value={domain.ownershipStatus} /></Table.Cell><Table.Cell><CdnStatus value={domain.upstreamStatus} /></Table.Cell><Table.Cell>{domain.cname || "—"}</Table.Cell><Table.Cell><div className="flex flex-wrap gap-2"><LinkButton href={`/console/cdnsell/domains/${domain.id}`} variant="ghost">管理</LinkButton>{domain.upstreamStatus === "active" ? <Button variant="ghost" onClick={() => toggle.mutate({ id: domain.id, enabled: !domain.enabled })}>{domain.enabled ? "停用" : "启用"}</Button> : null}<Button variant="destructive" onClick={() => { if (window.confirm(`确认移除 ${domain.domain}？`)) remove.mutate(domain.id); }}>删除</Button></div></Table.Cell></Table.Row>)}
      </Table.Body></Table></LayerCard>
    </PageState>
  </>;
}

type FieldKind = "text" | "number" | "boolean" | "password" | "multiline" | "select";
export interface ConfigField { key: string; label: string; kind: FieldKind; items?: Record<string, string>; placeholder?: string }
export interface ModuleSpec { key: string; title: string; description: string; fields: ConfigField[] }
export const moduleSpecs: ModuleSpec[] = [
  { key: "basic_origin", title: "基础与回源配置", description: "加速区域、源站与回源协议。项目组由后台统一配置。", fields: [{ key: "accelerateRegion", label: "加速区域", kind: "select", items: regionLabels }, { key: "originType", label: "源站类型", kind: "select", items: { domain: "域名源站", ip: "IP 源站" } }, { key: "originHost", label: "源站地址", kind: "text" }, { key: "originProtocol", label: "回源协议", kind: "select", items: { http: "HTTP", follow: "协议跟随", https: "HTTPS" } }] },
  { key: "origin_host", title: "回源 Host", description: "控制 CDN 回源请求携带的 Host。", fields: [{ key: "followRequestDomain", label: "跟随请求域名", kind: "boolean" }, { key: "host", label: "固定回源 Host", kind: "text" }] },
  { key: "advanced_origin", title: "高级回源", description: "配置主备源及节点回源策略。", fields: [{ key: "enabled", label: "启用高级回源", kind: "boolean" }, { key: "originType", label: "主源类型", kind: "select", items: { domain: "域名", ipaddr: "IP" } }, { key: "origin", label: "主源地址", kind: "text" }, { key: "backupOriginType", label: "备源类型", kind: "select", items: { domain: "域名", ipaddr: "IP" } }, { key: "backupOrigin", label: "备源地址", kind: "text" }, { key: "policy", label: "回源策略", kind: "text" }, { key: "bestCount", label: "优选节点数", kind: "number" }] },
  { key: "cache_rules", title: "缓存规则", description: "每行：类型 | 匹配值 | 缓存秒数 | 是否尊重源站。", fields: [{ key: "rulesText", label: "缓存规则", kind: "multiline", placeholder: "suffix | jpg,png | 86400 | true" }] },
  { key: "status_code_cache", title: "状态码缓存", description: "按 HTTP 状态码设置缓存时间。", fields: [{ key: "rulesText", label: "状态码规则", kind: "multiline" }] },
  { key: "error_page", title: "自定义错误页面", description: "每行：状态码 | HTTPS 页面地址。", fields: [{ key: "pagesText", label: "错误页面", kind: "multiline", placeholder: "404 | https://example.com/404.html" }] },
  { key: "query_params", title: "查询参数策略", description: "控制缓存键是否忽略查询参数。", fields: [{ key: "enabled", label: "启用参数过滤", kind: "boolean" }, { key: "type", label: "过滤方式", kind: "text" }, { key: "hashKeyArgs", label: "保留参数", kind: "text" }] },
  { key: "referer", title: "Referer 防盗链", description: "白名单或黑名单，每行一个域名。", fields: [{ key: "enabled", label: "启用 Referer 防盗链", kind: "boolean" }, { key: "type", label: "名单类型", kind: "select", items: { whitelist: "白名单", blacklist: "黑名单" } }, { key: "valuesText", label: "Referer 列表", kind: "multiline" }, { key: "allowEmpty", label: "允许空 Referer", kind: "boolean" }] },
  { key: "ip_acl", title: "IP 黑白名单", description: "每行一个 IP 或 CIDR。", fields: [{ key: "enabled", label: "启用 IP 访问控制", kind: "boolean" }, { key: "type", label: "名单类型", kind: "select", items: { whitelist: "白名单", blacklist: "黑名单" } }, { key: "valuesText", label: "IP 列表", kind: "multiline" }] },
  { key: "ua_acl", title: "UA 黑白名单", description: "控制指定 User-Agent 的访问。", fields: [{ key: "enabled", label: "启用 UA 访问控制", kind: "boolean" }, { key: "valuesText", label: "UA 列表", kind: "multiline" }] },
  { key: "request_auth", title: "时间戳与共享密钥防盗链", description: "密钥只加密写入任务，保存后不回显。", fields: [{ key: "enabled", label: "启用时间戳鉴权", kind: "boolean" }, { key: "authType", label: "鉴权类型", kind: "select", items: { "1": "类型 1（查询参数）", "2": "类型 2（路径签名）" } }, { key: "primaryKey", label: "主密钥（6–128 位）", kind: "password" }, { key: "backupKey", label: "备用密钥", kind: "password" }, { key: "expireSeconds", label: "过期秒数", kind: "number" }] },
  { key: "url_block", title: "URL 屏蔽", description: "每行一个本人加速域名 URL。", fields: [{ key: "action", label: "操作", kind: "select", items: { block: "屏蔽", unblock: "解除屏蔽" } }, { key: "urlsText", label: "URL 列表", kind: "multiline" }, { key: "refreshOnUnblock", label: "解除后刷新", kind: "boolean" }] },
  { key: "force_redirect", title: "HTTPS 强制跳转", description: "稳定站点建议使用 301，临时切换使用 302。", fields: [{ key: "type", label: "跳转方式", kind: "select", items: { off: "关闭", http_to_https: "HTTP → HTTPS" } }, { key: "code", label: "状态码", kind: "select", items: { "301": "301", "302": "302" } }] },
  { key: "tls_version", title: "TLS 版本", description: "至少保留一个版本，建议启用 TLS 1.2 和 1.3。", fields: [{ key: "versionsText", label: "TLS 版本（每行一个）", kind: "multiline", placeholder: "TLSv1.2\nTLSv1.3" }] },
  { key: "http2", title: "HTTP/2", description: "部署有效证书后启用。", fields: [{ key: "enabled", label: "启用 HTTP/2", kind: "boolean" }] },
  { key: "http_headers", title: "HTTP 规则", description: "设置一个响应 HTTP 头。", fields: [{ key: "name", label: "HTTP 头名称", kind: "text" }, { key: "value", label: "HTTP 头值", kind: "text" }] },
  { key: "performance", title: "性能优化", description: "配置 Gzip、Br 与压缩文件类型。", fields: [{ key: "gzip", label: "启用 Gzip", kind: "boolean" }, { key: "br", label: "启用 Br", kind: "boolean" }, { key: "fileTypes", label: "Content-Type", kind: "text" }, { key: "minSize", label: "最小文件大小", kind: "number" }] },
  { key: "content_logs", title: "内容操作与日志", description: "开启或关闭域名日志服务。", fields: [{ key: "action", label: "日志服务", kind: "select", items: { start: "开启", stop: "关闭" } }, { key: "granularity", label: "日志粒度", kind: "select", items: { "5": "5 分钟", "60": "1 小时" } }] },
];

const panelModules: Record<string, string[]> = { origin: ["basic_origin", "origin_host", "advanced_origin"], cache: ["cache_rules", "status_code_cache", "error_page", "query_params"], access: ["referer", "ip_acl", "ua_acl", "request_auth", "url_block"], https: ["force_redirect", "tls_version", "http2"], http: ["http_headers"], performance: ["performance"], content: ["content_logs"] };
const panels = [{ value: "overview", label: "概览" }, { value: "origin", label: "回源配置" }, { value: "cache", label: "缓存策略" }, { value: "access", label: "访问控制" }, { value: "https", label: "HTTPS 与协议" }, { value: "http", label: "HTTP 规则" }, { value: "performance", label: "性能优化" }, { value: "content", label: "内容操作与日志" }];

function lines(value: unknown) { return Array.isArray(value) ? value.map(String).join("\n") : ""; }
export function initialForm(config: DomainConfig | undefined, module: string) {
  const value = { ...(config?.localConfig ?? {}) };
  if (module === "cache_rules" && Array.isArray(value.rules)) value.rulesText = value.rules.map((row) => { const item = row as Record<string, unknown>; return `${item.type ?? ""} | ${item.value ?? ""} | ${item.seconds ?? ""} | ${item.respectOrigin ?? false}`; }).join("\n");
  if (module === "error_page" && Array.isArray(value.pages)) value.pagesText = value.pages.map((row) => { const item = row as Record<string, unknown>; return `${item.code ?? ""} | ${item.url ?? ""}`; }).join("\n");
  if ("values" in value) value.valuesText = lines(value.values);
  if ("urls" in value) value.urlsText = lines(value.urls);
  if ("versions" in value) value.versionsText = lines(value.versions);
  return value;
}
export function serializeForm(module: string, form: Record<string, unknown>) {
  const value = { ...form };
  if (typeof value.valuesText === "string") value.values = value.valuesText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (typeof value.urlsText === "string") value.urls = value.urlsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (typeof value.versionsText === "string") value.versions = value.versionsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (module === "cache_rules" && typeof value.rulesText === "string") value.rules = value.rulesText.split(/\r?\n/).map((line) => line.split("|").map((item) => item.trim())).filter((parts) => parts[0]).map(([type, match, seconds, respect]) => ({ type, value: match, seconds: Number(seconds), enabled: true, respectOrigin: respect === "true" }));
  if (module === "error_page" && typeof value.pagesText === "string") value.pages = value.pagesText.split(/\r?\n/).map((line) => line.split("|").map((item) => item.trim())).filter((parts) => parts[0] && parts[1]).map(([code, url]) => ({ code, url }));
  for (const key of ["valuesText", "urlsText", "versionsText", "rulesText", "pagesText"]) delete value[key];
  return value;
}

function ConfigModuleCard({ spec, config, domainId }: { spec: ModuleSpec; config?: DomainConfig; domainId: string }) {
  const client = useQueryClient();
  const [form, setForm] = useState<Record<string, unknown>>(() => initialForm(config, spec.key));
  const [message, setMessage] = useState("");
  useEffect(() => setForm(initialForm(config, spec.key)), [config, spec.key]);
  const save = useMutation({ mutationFn: () => cdnsellP2Api.saveConfig(domainId, spec.key, serializeForm(spec.key, form)), onSuccess: (task) => { setMessage(`已创建配置任务 ${task.taskNo}`); void client.invalidateQueries({ queryKey: ["cdnsell", "domain", domainId] }); }, onError: (error) => setMessage(getApiMessage(error)) });
  return <LayerCard >
    <LayerCard.Secondary><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-kumo-strong">{spec.title}</h2><p className="text-sm text-kumo-subtle">{spec.description}</p></div><div className="flex gap-2"><Badge variant={config?.available === false ? "outline" : "success"}>{config?.available === false ? "未开放" : `本地 v${config?.localVersion ?? 0}`}</Badge><Badge variant={(config?.diffCount ?? 0) > 0 ? "warning" : "outline"}>待核对 {config?.diffCount ?? 0}</Badge></div></div></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
    {config?.available === false ? <Banner variant="alert" title="当前接口未开放" description={config.note} /> : null}
    <div className="grid gap-3 md:grid-cols-2">{spec.fields.map((field) => {
      const value = form[field.key];
      if (field.kind === "boolean") return <Switch key={field.key} label={field.label} checked={Boolean(value)} onCheckedChange={(checked) => setForm((current) => ({ ...current, [field.key]: checked }))} />;
      if (field.kind === "select") return <Select key={field.key} label={field.label} value={String(value ?? "")} onValueChange={(next) => setForm((current) => ({ ...current, [field.key]: next ?? "" }))} items={field.items ?? {}} />;
      if (field.kind === "multiline") return <Textarea key={field.key} label={field.label} placeholder={field.placeholder} rows={5} value={String(value ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />;
      return <Input key={field.key} label={field.label} type={field.kind === "password" ? "password" : field.kind === "number" ? "number" : "text"} placeholder={field.placeholder} value={String(value ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.key]: field.kind === "number" ? Number(event.target.value) : event.target.value }))} />;
    })}</div>
    {message ? <Banner title={message} /> : null}
    <div className="flex justify-end"><Button disabled={config?.available === false} loading={save.isPending} onClick={() => save.mutate()}>保存并下发</Button></div>
    {config?.diffFields?.length ? <div className="border-t border-kumo-line pt-3 text-sm text-kumo-subtle">差异字段：{config.diffFields.join("、")}</div> : null}
  </LayerCard.Primary></LayerCard>;
}

function DomainOverview({ domain, onMessage }: { domain: CdnDomain & { checklist: CdnDomain["enabled"] extends boolean ? { ownership: boolean; upstream: boolean; certificate: boolean; configuration: boolean } : never }; onMessage: (value: string) => void }) {
  const client = useQueryClient();
  const [challenge, setChallenge] = useState<{ method: "dns" | "file"; dnsName?: string; fileUrl?: string; token?: string; lastError?: string }>();
  const start = useMutation({ mutationFn: (method: "dns" | "file") => cdnsellP2Api.ownershipStart(domain.id, method), onSuccess: setChallenge, onError: (error) => onMessage(getApiMessage(error)) });
  const verify = useMutation({ mutationFn: () => cdnsellP2Api.ownershipStatus(domain.id), onSuccess: (value) => { setChallenge(value); onMessage(value.status === "verified" ? "所有权验证通过，接入任务已创建" : value.lastError ?? "验证记录尚未生效"); void client.invalidateQueries({ queryKey: ["cdnsell", "domain", domain.id] }); }, onError: (error) => onMessage(getApiMessage(error)) });
  const sync = useMutation({ mutationFn: () => cdnsellP2Api.syncDomain(domain.id), onSuccess: () => onMessage("同步任务已创建"), onError: (error) => onMessage(getApiMessage(error)) });
  const checks = [{ key: "ownership", label: "所有权验证" }, { key: "upstream", label: "接入返回 CNAME" }, { key: "certificate", label: "HTTPS 证书" }, { key: "configuration", label: "配置下发" }] as const;
  return <div className="grid gap-5">
    <MetricGrid metrics={[{ label: "域名状态", value: label(domain.upstreamStatus), hint: domain.nodeStatus || "等待云端同步" }, { label: "所有权", value: label(domain.ownershipStatus), hint: domain.ownershipMethod.toUpperCase() }, { label: "配置版本", value: `v${domain.syncVersion}`, hint: domain.syncTime ? new Date(domain.syncTime).toLocaleString("zh-CN") : "尚未同步" }, { label: "服务编号", value: domain.serviceNo || "—", hint: domain.enabled ? "服务已启用" : "服务已停用" }]} />
    <LayerCard ><LayerCard.Secondary><h2 className="font-semibold text-kumo-strong">接入检查</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4"><div className="grid gap-3 md:grid-cols-4">{checks.map((check) => <div key={check.key} className="bg-kumo-control p-4"><Badge variant={domain.checklist[check.key] ? "success" : "outline"}>{domain.checklist[check.key] ? "已完成" : "待完成"}</Badge><strong className="mt-2 block text-kumo-strong">{check.label}</strong></div>)}</div></LayerCard.Primary></LayerCard>
    <LayerCard ><LayerCard.Secondary><div><h2 className="font-semibold text-kumo-strong">基础信息</h2><p className="text-sm text-kumo-subtle">{businessLabels[domain.businessType]} · {regionLabels[domain.accelerateRegion]} · {domain.originType === "domain" ? "域名源站" : "IP 源站"} · {domain.originProtocol.toUpperCase()}</p></div></LayerCard.Secondary><LayerCard.Primary className="grid gap-4"><div className="grid gap-3 md:grid-cols-2"><div><span className="text-sm text-kumo-subtle">源站</span><strong className="block text-kumo-strong">{domain.originHost}</strong></div><div><span className="text-sm text-kumo-subtle">CNAME</span><strong className="block break-all text-kumo-strong">{domain.cname || "接入完成后显示"}</strong></div></div><div className="flex flex-wrap gap-2">{domain.cname ? <Button variant="secondary" onClick={() => navigator.clipboard.writeText(domain.cname)}>复制 CNAME</Button> : null}<Button variant="secondary" loading={sync.isPending} disabled={!domain.serviceNo} onClick={() => sync.mutate()}>同步状态</Button><LinkButton href="/console/cdnsell/certs" variant="ghost">证书管理</LinkButton><LinkButton href="/console/cdnsell/refresh" variant="ghost">刷新与日志</LinkButton></div></LayerCard.Primary></LayerCard>
    {domain.ownershipStatus !== "verified" ? <LayerCard ><LayerCard.Secondary><div><h2 className="font-semibold text-kumo-strong">所有权验证</h2><p className="text-sm text-kumo-subtle">选择 DNS TXT 或 HTTPS 文件验证。验证通过后才能添加加速域名。</p></div></LayerCard.Secondary><LayerCard.Primary className="grid gap-4"><div className="flex gap-2"><Button loading={start.isPending} onClick={() => start.mutate("dns")}>生成 DNS 验证</Button><Button variant="secondary" loading={start.isPending} onClick={() => start.mutate("file")}>生成文件验证</Button></div>{challenge ? <div className="bg-kumo-control p-4 text-sm"><p><strong>验证位置：</strong>{challenge.method === "dns" ? challenge.dnsName : challenge.fileUrl}</p><p className="mt-2 break-all"><strong>验证值：</strong>{challenge.token || "已提交，不再回显"}</p>{challenge.lastError ? <p className="mt-2 text-kumo-danger">{challenge.lastError}</p> : null}</div> : null}<Button variant="secondary" loading={verify.isPending} onClick={() => verify.mutate()}>检查验证状态</Button></LayerCard.Primary></LayerCard> : null}
  </div>;
}

export function CdnDomainPage() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState("overview");
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["cdnsell", "domain", id], queryFn: () => cdnsellP2Api.domain(id), enabled: Boolean(id), refetchInterval: 10000 });
  const tasks = useQuery({ queryKey: ["cdnsell", "config-tasks", id], queryFn: () => cdnsellP2Api.configTasks(id), enabled: Boolean(id), refetchInterval: 5000 });
  const configs = useMemo(() => new Map(query.data?.configs.map((config) => [config.module, config])), [query.data?.configs]);
  return <>
    <PageHeader title={query.data?.domain ?? "域名管理"} description={query.data ? `CNAME：${query.data.cname || "等待接入"} · 最近同步：${query.data.syncTime ? new Date(query.data.syncTime).toLocaleString("zh-CN") : "尚未同步"}` : "查看域名接入和配置状态。"} actions={<LinkButton href="/console/cdnsell/domains" variant="secondary">返回域名列表</LinkButton>} />
    <Feedback message={message} />
    <Tabs variant="underline" tabs={panels} value={tab} onValueChange={setTab} />
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null}>
      {query.data ? tab === "overview" ? <DomainOverview domain={query.data} onMessage={setMessage} /> : <div className="grid gap-5">{panelModules[tab]?.map((key) => { const spec = moduleSpecs.find((item) => item.key === key)!; return <ConfigModuleCard key={key} spec={spec} config={configs.get(key)} domainId={id} />; })}</div> : null}
    </PageState>
    {tab !== "overview" ? <LayerCard className="mt-5 overflow-x-auto p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>配置项</Table.Head><Table.Head>版本</Table.Head><Table.Head>操作者</Table.Head><Table.Head>结果</Table.Head><Table.Head>时间</Table.Head></Table.Row></Table.Header><Table.Body>{tasks.data?.slice(0, 10).map((task) => <Table.Row key={task.id}><Table.Cell>{moduleSpecs.find((item) => item.key === task.module)?.title ?? task.module}<p className="text-xs text-kumo-subtle">{task.error || task.taskNo}</p></Table.Cell><Table.Cell>v{task.version}</Table.Cell><Table.Cell>{task.operatorType === "admin" ? "管理员" : "会员"}</Table.Cell><Table.Cell><CdnStatus value={task.status} /></Table.Cell><Table.Cell>{new Date(task.createdAt).toLocaleString("zh-CN")}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard> : null}
  </>;
}

function DomainSelect({ domains, value, onChange }: { domains: CdnDomain[]; value: string; onChange: (value: string) => void }) {
  return <Select label="加速域名" value={value} onValueChange={(next) => onChange(next ?? "")} items={Object.fromEntries(domains.map((domain) => [domain.id, domain.domain]))} />;
}

export function CdnCertificates() {
  const client = useQueryClient(); const [form, setForm] = useState({ domainId: "", name: "", cert: "", key: "" }); const [message, setMessage] = useState("");
  const domains = useQuery({ queryKey: ["cdnsell", "domains"], queryFn: cdnsellP2Api.domains }); const query = useQuery({ queryKey: ["cdnsell", "certificates"], queryFn: cdnsellP2Api.certificates }); const refresh = () => client.invalidateQueries({ queryKey: ["cdnsell", "certificates"] });
  const upload = useMutation({ mutationFn: () => cdnsellP2Api.uploadCertificate(form), onSuccess: () => { setForm({ domainId: "", name: "", cert: "", key: "" }); setMessage("证书已加密保存，私钥不会再次回显"); void refresh(); }, onError: (error) => setMessage(getApiMessage(error)) });
  const deploy = useMutation({ mutationFn: cdnsellP2Api.deployCertificate, onSuccess: () => { setMessage("证书部署任务已创建"); void refresh(); }, onError: (error) => setMessage(getApiMessage(error)) }); const remove = useMutation({ mutationFn: cdnsellP2Api.deleteCertificate, onSuccess: refresh, onError: (error) => setMessage(getApiMessage(error)) });
  return <><PageHeader title="证书管理" description="证书和私钥经 AES-GCM 加密；列表仅展示指纹、有效期和部署状态。" /><Feedback message={message} /><LayerCard className="grid gap-4 p-4"><div className="grid gap-3 md:grid-cols-2"><DomainSelect domains={domains.data ?? []} value={form.domainId} onChange={(domainId) => setForm({ ...form, domainId })} /><Input label="证书名称" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Textarea label="证书 PEM" rows={6} value={form.cert} onChange={(event) => setForm({ ...form, cert: event.target.value })} /><Textarea label="私钥 PEM（保存后不回显）" rows={6} value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} /></div><Button loading={upload.isPending} disabled={!form.domainId || !form.cert || !form.key} onClick={() => upload.mutate()}>加密上传证书</Button></LayerCard><PageState loading={query.isLoading} empty={!query.isLoading && !query.data?.length} emptyTitle="暂无证书"><LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>证书</Table.Head><Table.Head>域名</Table.Head><Table.Head>指纹</Table.Head><Table.Head>有效期</Table.Head><Table.Head>状态</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{query.data?.map((cert) => <Table.Row key={cert.id}><Table.Cell>{cert.name}</Table.Cell><Table.Cell>{cert.domain}</Table.Cell><Table.Cell><span className="break-all text-xs">{cert.fingerprint}</span></Table.Cell><Table.Cell>{new Date(cert.notAfter).toLocaleDateString("zh-CN")}</Table.Cell><Table.Cell><CdnStatus value={cert.deployStatus} /></Table.Cell><Table.Cell><div className="flex gap-2"><Button variant="ghost" loading={deploy.isPending} onClick={() => deploy.mutate(cert.id)}>部署</Button><Button variant="destructive" disabled={cert.deployStatus === "pending" || cert.deployStatus === "deployed"} onClick={() => remove.mutate(cert.id)}>删除</Button></div></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard></PageState></>;
}

export function CdnRefresh() {
  const client = useQueryClient(); const [type, setType] = useState<RefreshType>("url_refresh"); const [urlText, setURLText] = useState(""); const [message, setMessage] = useState(""); const query = useQuery({ queryKey: ["cdnsell", "refresh"], queryFn: cdnsellP2Api.refreshTasks, refetchInterval: 5000 }); const submit = useMutation({ mutationFn: () => cdnsellP2Api.refresh(type, urlText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)), onSuccess: () => { setURLText(""); setMessage("刷新或预热任务已创建"); void client.invalidateQueries({ queryKey: ["cdnsell", "refresh"] }); }, onError: (error) => setMessage(getApiMessage(error)) }); const rows = query.data ?? [];
  return <><PageHeader title="刷新与预热" description="服务端会二次校验 URL 主机名，只允许提交本人已接入的加速域名。" /><Feedback message={message} /><MetricGrid metrics={[{ label: "任务总数", value: String(rows.length), hint: "最近 100 条" }, { label: "处理中", value: String(rows.filter((row) => row.status === "pending" || row.status === "running").length), hint: "等待或执行中" }, { label: "已完成", value: String(rows.filter((row) => row.status === "success").length), hint: "云端完成" }, { label: "失败", value: String(rows.filter((row) => row.status === "failed").length), hint: "查看错误原因" }]} /><LayerCard className="grid gap-4 p-4"><Tabs variant="segmented" tabs={[{ value: "url_refresh", label: "URL 刷新" }, { value: "dir_refresh", label: "目录刷新" }, { value: "url_purge", label: "URL 预热" }]} value={type} onValueChange={(value) => setType(value as RefreshType)} /><Textarea label="资源地址（每行一个，最多 1000 条）" rows={8} value={urlText} onChange={(event) => setURLText(event.target.value)} /><Button loading={submit.isPending} disabled={!urlText.trim()} onClick={() => submit.mutate()}>提交任务</Button></LayerCard><PageState loading={query.isLoading} empty={!query.isLoading && !rows.length} emptyTitle="暂无刷新任务"><LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>任务</Table.Head><Table.Head>域名 / 类型</Table.Head><Table.Head>地址数</Table.Head><Table.Head>进度</Table.Head><Table.Head>状态</Table.Head><Table.Head>创建时间</Table.Head></Table.Row></Table.Header><Table.Body>{rows.map((task) => <Table.Row key={task.id}><Table.Cell>{task.taskNo}<p className="text-xs text-kumo-subtle">{task.error}</p></Table.Cell><Table.Cell>{task.domain}<p className="text-xs text-kumo-subtle">{task.type}</p></Table.Cell><Table.Cell>{task.urls.length}</Table.Cell><Table.Cell>{task.progress.percent ?? 0}%</Table.Cell><Table.Cell><CdnStatus value={task.status} /></Table.Cell><Table.Cell>{new Date(task.createdAt).toLocaleString("zh-CN")}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard></PageState></>;
}

function localInputDate(hoursAgo = 0) { const date = new Date(Date.now() - hoursAgo * 3600000); const offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
export function CdnLogs() {
  const domains = useQuery({ queryKey: ["cdnsell", "domains"], queryFn: cdnsellP2Api.domains }); const [domainId, setDomainId] = useState(""); const [start, setStart] = useState(localInputDate(1)); const [end, setEnd] = useState(localInputDate()); const [message, setMessage] = useState(""); const query = useMutation({ mutationFn: () => cdnsellP2Api.logs(domainId, new Date(start).toISOString(), new Date(end).toISOString()), onError: (error) => setMessage(getApiMessage(error)) });
  return <><PageHeader title="日志下载" description="查询并下载域名访问日志，仅支持 HTTPS 下载。" /><Feedback message={message} /><LayerCard className="grid gap-4 p-4"><div className="grid gap-3 md:grid-cols-3"><DomainSelect domains={domains.data ?? []} value={domainId} onChange={setDomainId} /><DateRangeField label="日志时间范围" withTime allowPartial={false} clearable={false} from={start} to={end} onValueChange={(from,to)=>{setStart(from);setEnd(to);}} /></div><Button loading={query.isPending} disabled={!domainId} onClick={() => query.mutate()}>查询日志</Button></LayerCard><PageState loading={query.isPending} empty={query.isSuccess && !query.data?.length} emptyTitle="当前时间范围没有日志"><LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>文件</Table.Head><Table.Head>时间范围</Table.Head><Table.Head>大小</Table.Head><Table.Head>下载</Table.Head></Table.Row></Table.Header><Table.Body>{query.data?.map((log) => <Table.Row key={`${log.name}-${log.start}`}><Table.Cell>{log.name}</Table.Cell><Table.Cell>{new Date(log.start).toLocaleString("zh-CN")} – {new Date(log.end).toLocaleString("zh-CN")}</Table.Cell><Table.Cell>{formatTraffic(log.size)}</Table.Cell><Table.Cell><a href={log.url} target="_blank" rel="noreferrer"><Button variant="secondary">HTTPS 下载</Button></a></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard></PageState></>;
}

export function CdnIPCheck() {
  const [ip, setIP] = useState(""); const [message, setMessage] = useState(""); const query = useMutation({ mutationFn: () => cdnsellP2Api.ipCheck(ip), onError: (error) => setMessage(getApiMessage(error)) });
  return <><PageHeader title="IP 检测" description="检测目标 IP 是否属于平台 CDN 节点，并显示节点地区与运营商。" /><Feedback message={message} /><LayerCard className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto]"><Input label="IP 地址" placeholder="203.0.113.10" value={ip} onChange={(event) => setIP(event.target.value)} /><div className="flex items-end"><Button loading={query.isPending} disabled={!ip.trim()} onClick={() => query.mutate()}>开始检测</Button></div></LayerCard>{query.data ? <LayerCard className="mt-5 grid gap-4 p-4"><div className="flex items-center gap-3"><Badge variant={query.data.isCdn ? "success" : "outline"}>{query.data.isCdn ? "CDN 节点" : "非 CDN 节点"}</Badge><strong className="text-xl text-kumo-strong">{query.data.ip}</strong></div><div className="grid gap-3 md:grid-cols-4"><div><span className="text-sm text-kumo-subtle">运营商</span><strong className="block">{query.data.isp || "—"}</strong></div><div><span className="text-sm text-kumo-subtle">区域</span><strong className="block">{query.data.region || "—"}</strong></div><div><span className="text-sm text-kumo-subtle">省份</span><strong className="block">{query.data.province || "—"}</strong></div><div><span className="text-sm text-kumo-subtle">城市</span><strong className="block">{query.data.city || "—"}</strong></div></div></LayerCard> : null}</>;
}
