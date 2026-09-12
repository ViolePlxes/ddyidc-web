import { Badge, Banner, Button, Input, LayerCard, LinkButton, Select, Switch, Table, Textarea } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { cdnsellP2AdminApi, type DomainConfig } from "../../../shared/api/cdnsellP2";
import { getApiMessage } from "../../../shared/api/request";
import { CdnStatus } from "../../../shared/components/Cdnsell";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { initialForm, moduleSpecs, serializeForm, type ModuleSpec } from "../../../shared/cdnsell/configModules";

function Feedback({ message }: { message: string }) { return message ? <Banner title={message} /> : null; }

export function AdminCdnDomains() {
  const client = useQueryClient();
  const [input, setInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["admin", "cdnsell", "domains", keyword], queryFn: () => cdnsellP2AdminApi.domains(keyword) });
  const sync = useMutation({ mutationFn: cdnsellP2AdminApi.syncDomain, onSuccess: (task) => { setMessage(`同步任务 ${task.taskNo ?? ""} 已创建`); void client.invalidateQueries({ queryKey: ["admin", "cdnsell", "domains"] }); }, onError: (error) => setMessage(getApiMessage(error)) });
  return <>
    <PageHeader title="CDN 域名" description="全客户视角，按域名、客户账号或服务编号检索。" actions={<LinkButton href="/admin/cdnsell/config-center">进入配置中心</LinkButton>} />
    <Feedback message={message} />
    <LayerCard className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_auto]"><Input label="搜索域名 / 客户 / 服务编号" value={input} onChange={(event) => setInput(event.target.value)} /><div className="flex items-end"><Button onClick={() => setKeyword(input.trim())}>查询</Button></div></LayerCard>
    <PageState loading={query.isLoading} skeleton="table" error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.data?.length} emptyTitle="暂无 CDN 域名">
      <LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>域名 / 客户</Table.Head><Table.Head>服务编号</Table.Head><Table.Head>所有权</Table.Head><Table.Head>云端状态</Table.Head><Table.Head>版本 / 同步</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{query.data?.map((domain) => <Table.Row key={domain.id}><Table.Cell><strong className="text-kumo-strong">{domain.domain}</strong><p className="text-xs text-kumo-subtle">{domain.username || domain.userId}</p></Table.Cell><Table.Cell>{domain.serviceNo || "—"}<p className="text-xs text-kumo-subtle">{domain.cname || "尚无 CNAME"}</p></Table.Cell><Table.Cell><CdnStatus value={domain.ownershipStatus} /></Table.Cell><Table.Cell><CdnStatus value={domain.upstreamStatus} /></Table.Cell><Table.Cell>v{domain.syncVersion}<p className="text-xs text-kumo-subtle">{domain.syncTime ? new Date(domain.syncTime).toLocaleString("zh-CN") : "尚未同步"}</p></Table.Cell><Table.Cell><div className="flex gap-2"><LinkButton href={`/admin/cdnsell/config-center?domain=${domain.id}`} variant="ghost">配置</LinkButton><Button variant="secondary" disabled={!domain.serviceNo} loading={sync.isPending} onClick={() => sync.mutate(domain.id)}>同步</Button></div></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
    </PageState>
  </>;
}

function ConfigEditor({ domainId, spec, config, onMessage }: { domainId: string; spec: ModuleSpec; config?: DomainConfig; onMessage: (value: string) => void }) {
  const client = useQueryClient();
  const [form, setForm] = useState<Record<string, unknown>>(() => initialForm(config, spec.key));
  useEffect(() => setForm(initialForm(config, spec.key)), [config, spec.key]);
  const save = useMutation({ mutationFn: () => cdnsellP2AdminApi.saveConfig(domainId, spec.key, serializeForm(spec.key, form)), onSuccess: (task) => { onMessage(`后台配置任务 ${task.taskNo} 已创建`); void client.invalidateQueries({ queryKey: ["admin", "cdnsell", "config", domainId] }); void client.invalidateQueries({ queryKey: ["admin", "cdnsell", "config-tasks", domainId] }); }, onError: (error) => onMessage(getApiMessage(error)) });
  return <div className="grid gap-5">
    <LayerCard className="grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-kumo-strong">{spec.title}</h2><p className="text-sm text-kumo-subtle">{spec.description}</p></div><Badge variant={config?.available === false ? "outline" : "success"}>{config?.available === false ? "未开放" : "异步安全下发"}</Badge></div>
      {config?.available === false ? <Banner variant="alert" title="当前接口未开放" description={config.note} /> : null}
      <div className="grid gap-3 md:grid-cols-2">{spec.fields.map((field) => { const value = form[field.key]; if (field.kind === "boolean") return <Switch key={field.key} label={field.label} checked={Boolean(value)} onCheckedChange={(checked) => setForm((current) => ({ ...current, [field.key]: checked }))} />; if (field.kind === "select") return <Select key={field.key} label={field.label} value={String(value ?? "")} onValueChange={(next) => setForm((current) => ({ ...current, [field.key]: next ?? "" }))} items={field.items ?? {}} />; if (field.kind === "multiline") return <Textarea key={field.key} label={field.label} placeholder={field.placeholder} rows={6} value={String(value ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} />; return <Input key={field.key} label={field.label} type={field.kind === "password" ? "password" : field.kind === "number" ? "number" : "text"} value={String(value ?? "")} onChange={(event) => setForm((current) => ({ ...current, [field.key]: field.kind === "number" ? Number(event.target.value) : event.target.value }))} />; })}</div>
      <div className="flex justify-end"><Button disabled={config?.available === false} loading={save.isPending} onClick={() => save.mutate()}>保存并下发</Button></div>
    </LayerCard>
    <LayerCard className="overflow-x-auto p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>配置项</Table.Head><Table.Head>本地预期</Table.Head><Table.Head>云端回读</Table.Head><Table.Head>结果</Table.Head></Table.Row></Table.Header><Table.Body>{Object.entries(config?.localConfig ?? {}).filter(([key]) => !key.toLowerCase().includes("key") && !key.toLowerCase().includes("secret")).map(([key, local]) => { const cloud = config?.cloudConfig[key]; const missing = cloud === undefined || cloud === null || cloud === ""; const same = missing || JSON.stringify(local) === JSON.stringify(cloud); return <Table.Row key={key}><Table.Cell>{key}</Table.Cell><Table.Cell><span className="break-all text-xs">{JSON.stringify(local)}</span></Table.Cell><Table.Cell><span className="break-all text-xs">{missing ? "—" : JSON.stringify(cloud)}</span></Table.Cell><Table.Cell><Badge variant={same ? "success" : "warning"}>{missing ? "未返回" : same ? "一致" : "差异"}</Badge></Table.Cell></Table.Row>; })}</Table.Body></Table></LayerCard>
  </div>;
}

export function AdminCdnConfigCenter() {
  const queryString = new URLSearchParams(window.location.search);
  const [domainId, setDomainId] = useState(queryString.get("domain") ?? "");
  const [module, setModule] = useState("basic_origin");
  const [message, setMessage] = useState("");
  const domains = useQuery({ queryKey: ["admin", "cdnsell", "domains", "config-center"], queryFn: () => cdnsellP2AdminApi.domains() });
  useEffect(() => { if (!domainId && domains.data?.[0]) setDomainId(domains.data[0].id); }, [domainId, domains.data]);
  const configs = useQuery({ queryKey: ["admin", "cdnsell", "config", domainId], queryFn: () => cdnsellP2AdminApi.config(domainId), enabled: Boolean(domainId), refetchInterval: 10000 });
  const tasks = useQuery({ queryKey: ["admin", "cdnsell", "config-tasks", domainId], queryFn: () => cdnsellP2AdminApi.configTasks(domainId), enabled: Boolean(domainId), refetchInterval: 5000 });
  const configMap = useMemo(() => new Map(configs.data?.map((item) => [item.module, item])), [configs.data]);
  const selected = domains.data?.find((domain) => domain.id === domainId);
  const selectedConfig = configMap.get(module);
  const spec = moduleSpecs.find((item) => item.key === module) ?? moduleSpecs[0]!;
  const localVersion = Math.max(0, ...(configs.data?.map((item) => item.localVersion) ?? [0]));
  const cloudVersion = Math.max(0, ...(configs.data?.map((item) => item.cloudVersion) ?? [0]));
  const diffCount = configs.data?.reduce((sum, item) => sum + item.diffCount, 0) ?? 0;
  return <>
    <PageHeader title="域名配置中心" description="18 个配置模块结构化维护，跟踪本地预期、云端回读和异步任务。" actions={<LinkButton href="/admin/cdnsell/domains" variant="secondary">返回域名列表</LinkButton>} />
    <Feedback message={message} />
    {!selected ? <Banner variant="alert" title="暂无可配置域名" description="客户完成域名添加和所有权验证后，可在此统一配置。" /> : <>
      <LayerCard className="grid gap-4 p-5"><Select label="选择域名" value={domainId} onValueChange={(value) => setDomainId(value ?? "")} items={Object.fromEntries((domains.data ?? []).map((domain) => [domain.id, `${domain.domain} · ${domain.username || domain.userId}`]))} /><div><h2 className="text-xl font-semibold text-kumo-strong">{selected.domain}</h2><p className="text-sm text-kumo-subtle">CNAME：{selected.cname || "等待接入"} · 服务：{selected.serviceNo || "—"}</p></div></LayerCard>
      <div className="grid gap-4 md:grid-cols-4"><LayerCard className="p-5"><span className="text-sm text-kumo-subtle">本地预期版本</span><strong className="block text-2xl text-kumo-strong">v{localVersion}</strong></LayerCard><LayerCard className="p-5"><span className="text-sm text-kumo-subtle">云端同步版本</span><strong className="block text-2xl text-kumo-strong">v{cloudVersion}</strong></LayerCard><LayerCard className="p-5"><span className="text-sm text-kumo-subtle">待核对字段</span><strong className="block text-2xl text-kumo-strong">{diffCount}</strong></LayerCard><LayerCard className="p-5"><span className="text-sm text-kumo-subtle">最近同步</span><strong className="block text-base text-kumo-strong">{selected.syncTime ? new Date(selected.syncTime).toLocaleString("zh-CN") : "尚未同步"}</strong></LayerCard></div>
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]"><LayerCard className="grid content-start gap-1 p-3">{moduleSpecs.map((item) => <Button key={item.key} variant={module === item.key ? "secondary" : "ghost"} onClick={() => setModule(item.key)}>{item.title}</Button>)}</LayerCard><PageState loading={configs.isLoading} skeleton="form" error={configs.error ? getApiMessage(configs.error) : null}><ConfigEditor domainId={domainId} spec={spec} config={selectedConfig} onMessage={setMessage} /></PageState></div>
      <LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>配置项</Table.Head><Table.Head>版本</Table.Head><Table.Head>操作者</Table.Head><Table.Head>结果</Table.Head><Table.Head>请求 / 错误</Table.Head><Table.Head>时间</Table.Head></Table.Row></Table.Header><Table.Body>{tasks.data?.slice(0, 20).map((task) => <Table.Row key={task.id}><Table.Cell>{moduleSpecs.find((item) => item.key === task.module)?.title ?? task.module}</Table.Cell><Table.Cell>v{task.version}</Table.Cell><Table.Cell>{task.operatorType === "admin" ? "管理员" : "会员"}</Table.Cell><Table.Cell><CdnStatus value={task.status} /></Table.Cell><Table.Cell><span className="text-xs text-kumo-subtle">{task.error || task.requestId || task.taskNo}</span></Table.Cell><Table.Cell>{new Date(task.createdAt).toLocaleString("zh-CN")}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
    </>}
  </>;
}
