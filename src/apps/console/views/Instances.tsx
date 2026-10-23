import { Pagination } from "../../../shared/components/Pagination";
import { Button, ClipboardText, Input, LayerCard, Link, Popover, Tabs, Table, Surface, useKumoToastManager } from "@cloudflare/kumo";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { consoleApi, type InstanceListItem } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PencilSimpleIcon, WindowsLogoIcon, LinuxLogoIcon, DesktopIcon, QuestionIcon } from "@phosphor-icons/react";
import { instanceManagementApi } from "../../../shared/api/instanceManagement";
import { PageState } from "../../../shared/components/PageState";
import { StatusBadge, type StatusCode } from "../../../shared/components/StatusBadge";
import { cycleLabels } from "../../../shared/utils/format";
import { instanceAddress } from "../../../shared/utils/instanceAddress";
import { InstanceActions, InstanceSetting } from "../../../shared/components/InstanceProductControls";

const instancePageSize = 10;
function ProductSettingLabel({ kind }: { kind: 'lock' | 'auto' }) {
  const label = kind === 'lock' ? '生产锁' : '自动续费';
  return <span className="inline-flex items-center gap-1 whitespace-nowrap">{label}
    <Popover.Root>
      <Popover.Trigger render={<Button type="button" variant="ghost" shape="square" size="sm" className="h-4 w-4 p-0 text-kumo-subtle" aria-label={`${label}使用说明`}><QuestionIcon size={14} aria-hidden /></Button>} />
      <Popover.Portal><Popover.Positioner side="bottom" align="center" sideOffset={8}>
        <Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] text-left text-sm font-normal">
          <Popover.Arrow />
          <Popover.Title>{label}</Popover.Title>
          <Popover.Description>{kind === 'lock' ? '保护重要服务器，防止误操作。' : '到期前自动续费，减少忘记续费导致的停机。'}</Popover.Description>
          <div className="mt-3 grid gap-3">
            {kind === 'lock' ? <>
              <p>开启后，开关机、重启、VNC、转让、重装等写操作会被禁止，需手动解除后恢复。</p>
              <p><span className="font-medium">如何操作：</span>点击开关，按弹窗提示完成邮箱验证并确认。未绑定邮箱时，可在同一弹窗内绑定。解除时也需要验证和确认。</p>
              <p className="text-kumo-subtle">生产锁不影响续费，手动续费和自动续费均可正常使用。</p>
            </> : <>
              <p><span className="font-medium">如何开启：</span>点击开关，选择续费周期，核对金额与扣费规则后确认。周期默认使用原购买时长。</p>
              <p>系统在到期前1天检查余额，并按核验后的当前价格发起续费。余额不足不扣费、不续费，会通知你充值；价格变化需重新确认。</p>
              <p><span className="font-medium">如何关闭：</span>再次点击开关并确认。关闭后到期将停机，请提前手动续费；生产锁开启时，自动续费仍可正常执行。</p>
            </>}
            <Popover.Close render={<Button variant="secondary" size="sm" className="justify-self-end" />}>知道了</Popover.Close>
          </div>
        </Popover.Popup>
      </Popover.Positioner></Popover.Portal>
    </Popover.Root>
  </span>;
}
const instanceStaleTime = 5 * 60 * 1000;
const instanceCacheTime = 30 * 60 * 1000;

const productCategories = {
  cloud: {
    label: "云服务器",
    matches: (name: string) => /云|ECS|VDS|挂机宝/i.test(name) && !/高性能|政企/i.test(name),
  },
  enterprise: {
    label: "高性能云(政企)",
    matches: (name: string) => /高性能|政企/i.test(name),
  },
  hosting: {
    label: "虚拟主机",
    matches: (name: string) => /虚拟主机|网站空间|主机空间/i.test(name),
  },
  physical: {
    label: "物理服务器",
    matches: (name: string) => /物理服务器|裸金属|独立服务器/i.test(name),
  },
  game: {
    label: "游戏服务器",
    matches: (name: string) => /游戏/i.test(name),
  },
} as const;

type ProductCategory = keyof typeof productCategories;

async function loadInstances() {
  const pageSize = 100;
  const first = await consoleApi.userInstances({ page: 1, pageSize });
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    const next = await consoleApi.userInstances({ page, pageSize });
    if (!next.items.length) break;
    items.push(...next.items);
  }
  return { ...first, items, total: items.length, page: 1, pageSize };
}

type InstanceFilter = "all" | "active" | "pending" | "suspended";

function matchesFilter(instance: InstanceListItem, filter: InstanceFilter) {
  const power = instance.powerStatus?.toLowerCase();
  if (filter === "active") return [3, 4].includes(instance.status) && !["suspended", "deleted", "expired", "fault"].includes(power ?? "");
  if (filter === "pending") return [1, 2].includes(instance.status);
  if (filter === "suspended") return instance.status !== 6 && power === "suspended";
  return true;
}

function instanceStatus(instance: InstanceListItem): StatusCode {
  const { status } = instance;
  if (status !== 6 && instance.powerStatus?.toLowerCase() === "suspended") return "suspended";
  if (status === 3) return "running";
  if (status === 1 || status === 2) return "provisioning";
  if (status === 4) return "stopped";
  if (status === 6) return "destroyed";
  return "expired";
}

const productColumns = "align-top";
function expiryLabel(value?: string) {
  if (!value) return "未设置到期时间";
  const time = new Date(value.replace(" ", "T")).getTime();
  if (!Number.isFinite(time)) return "";
  const delta = time - Date.now();
  if (delta <= 0) return "已到期";
  return `${Math.ceil(delta / 86400000)}天后到期`;
}
function HostnameCopy({value}:{value:string}) {
  const toast=useKumoToastManager();
  return <Button variant="ghost" size="sm" className="h-auto justify-start break-all text-left" aria-label={`复制主机名 ${value}`} onClick={()=>{void navigator.clipboard.writeText(value).then(()=>toast.add({title:"已复制主机名",timeout:2500})).catch(()=>toast.add({title:"复制失败，请重试",timeout:2500}));}}>{value}</Button>;
}
function ProductRow({ instance, card = false }: { instance: InstanceListItem; card?: boolean }) {
  const client = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [remark, setRemark] = useState(instance.remark ?? "");
  const [savedRemark, setSavedRemark] = useState(instance.remark ?? "");
  const savingRemark = useRef(false);
  useEffect(() => setSavedRemark(instance.remark ?? ""), [instance.remark]);
  const save = useMutation({ onMutate: () => { savingRemark.current = true; }, onSettled: () => { savingRemark.current = false; }, mutationFn: () => instanceManagementApi(instance.id).remark(remark), onSuccess: () => {
    setSavedRemark(remark.trim()); setEditing(false);
    void client.invalidateQueries({ queryKey: ["instances", "product-list"] });
    void client.invalidateQueries({ queryKey: ["instances", "filter-list"] });
    void client.invalidateQueries({ queryKey: ["instances", instance.id], exact: true, refetchType: "none" });
  }});
  const data = instance;
  const address = instanceAddress(instance.primaryIp, data.port, data.operatingSystem);
  const system = data.operatingSystem;
  const SystemIcon = /windows/i.test(system ?? "") ? WindowsLogoIcon : /linux|ubuntu|debian|centos|alma|rocky|fedora|arch|suse/i.test(system ?? "") ? LinuxLogoIcon : DesktopIcon;
  const missing = "未同步";
  const cells = [
<div key="0" className="min-w-0"><div className="grid min-w-0 gap-1"><Link href={`/console/instances/${instance.id}`} variant="plain" className="font-medium">{instance.productName || "未命名产品"}</Link><HostnameCopy value={data.hostname || instance.name} /></div></div>,
<div key="1" className="min-w-0"><StatusBadge status={instanceStatus(instance)} /></div>,
<div key="2" className="min-w-0">{address ? <ClipboardText text={address} size="sm" labels={{ copyAction: `复制连接地址 ${address}` }} className="w-fit max-w-full border-0 ring-0 shadow-none [&>span:first-child]:grow-0 [&>span:first-child]:ps-0 [&>span:first-child]:pe-1 [&>button]:border-l-0! [&>button]:px-1" /> : "未获取"}</div>,
<div key="3" className="min-w-0"><div className="grid gap-1"><span>{instance.expiresAt?.slice(0,10) || "—"}</span><span className="text-sm text-kumo-subtle">{expiryLabel(instance.expiresAt)}</span></div></div>,
<div key="4" className="min-w-0"><div className="grid gap-1"><span>{data?.renewalAmount ? `¥${data.renewalAmount}` : missing}</span><span className="text-sm text-kumo-subtle">{cycleLabels[instance.billingCycle ?? ""] || instance.billingCycle || "—"}</span></div></div>,
<div key="5" className="min-w-0"><div className="grid gap-1"><span className="flex min-w-0 items-center gap-1 whitespace-nowrap"><SystemIcon size={18} aria-hidden className="shrink-0 text-kumo-subtle" /><span className="truncate" title={system || missing}>{system || missing}</span></span></div></div>,
<div key="6" className="min-w-0">{editing ? <div className="grid gap-1"><Input autoFocus size="sm" aria-label={`备注 ${instance.name}`} maxLength={1000} value={remark} disabled={save.isPending} onChange={e=>setRemark(e.target.value)} onBlur={()=>{ if(savingRemark.current || save.isPending)return; if(remark.trim()===savedRemark){setEditing(false);return;} save.mutate(); }} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)e.currentTarget.blur(); if(e.key==="Escape"&&!save.isPending)setEditing(false);}} />{save.isPending && <span role="status" className="text-sm text-kumo-subtle">正在保存…</span>}{save.error && <span role="alert" className="text-sm text-kumo-danger">{getApiMessage(save.error)}</span>}</div> : <Button variant="ghost" size="sm" className="h-auto max-w-full whitespace-normal text-left" disabled={data?.readOnly || data.productionLocked} aria-label={`编辑备注 ${instance.name}`} onClick={()=>{setRemark(savedRemark);save.reset();setEditing(true);}}><span className="break-all">{savedRemark || "添加备注"}</span><PencilSimpleIcon size={14} className="shrink-0" /></Button>}</div>,
<div key="7" className="min-w-0"><InstanceSetting instance={instance} kind="lock" /></div>,
<div key="8" className="min-w-0"><InstanceSetting instance={instance} kind="auto" /></div>,
<div key="9" className="min-w-0"><InstanceActions instance={instance} /></div>
  ];
  if (card) return <Surface className="relative p-6 motion-safe:transition-transform motion-safe:duration-150 motion-safe:hover:-translate-y-1 hover:ring-kumo-ring focus-within:ring-kumo-ring">
    <Link href={`/console/instances/${instance.id}`} variant="plain" aria-label={`进入产品详情 ${instance.name}`} className="absolute inset-0 z-0" />
    <div className="pointer-events-none relative [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_input]:pointer-events-auto">
    <div className="mb-4 flex items-start justify-between gap-3">{cells[0]}{cells[1]}</div>
    <dl className="grid gap-3 text-sm">
      {[["IP", 2], ["到期时间", 3], ["费用", 4], ["系统", 5], ["备注", 6], ["生产锁",7], ["自动续费",8]].map(([label, index]) => <div key={label} className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-3"><dt className="text-kumo-subtle">{label === '生产锁' ? <ProductSettingLabel kind="lock" /> : label === '自动续费' ? <ProductSettingLabel kind="auto" /> : label}</dt><dd className="min-w-0 break-words">{cells[Number(index)]}</dd></div>)}
    </dl>
    <div className="mt-4 flex justify-end">{cells[9]}</div>
    </div>
  </Surface>;
  return <Table.Row role="row" className={`${productColumns} border-b border-kumo-hairline last:border-b-0`}>{cells.map((cell, index) => <Table.Cell key={index} role="cell" className="text-center align-middle"><div className="flex justify-center [&>div>div]:justify-items-center">{cell}</div></Table.Cell>)}</Table.Row>;

}

export function InstanceList() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const category = requestedCategory && requestedCategory in productCategories
    ? productCategories[requestedCategory as ProductCategory]
    : undefined;
  const [view, setView] = useState<"table" | "cards">(() => window.matchMedia("(min-width: 768px)").matches ? "table" : "cards");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InstanceFilter>("active");
  const localFilter = Boolean(category) || status !== "all";
  const queryKey = localFilter
    ? (["instances", "filter-list"] as const)
    : (["instances", "product-list", page, search, "all"] as const);
  const query = useQuery({
    queryKey,
    queryFn: () => localFilter
      ? loadInstances()
      : consoleApi.userInstances({ page, pageSize: instancePageSize, search: search.trim() || undefined }),
    retry: false,
    placeholderData: keepPreviousData,
    initialData: () => queryClient.getQueryData<Awaited<ReturnType<typeof consoleApi.userInstances>>>(queryKey),
    initialDataUpdatedAt: () => queryClient.getQueryState(queryKey)?.dataUpdatedAt,
    staleTime: instanceStaleTime,
    gcTime: instanceCacheTime,
  });
  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [requestedCategory]);
  const listData = query.data;
  const filteredInstances = useMemo(() => {
    if (!localFilter) return listData?.items ?? [];
    const keyword = search.trim().toLocaleLowerCase();
    return (listData?.items ?? []).filter((instance) => {
      if (category && !category.matches(instance.productName)) return false;
      if (!matchesFilter(instance, status)) return false;
      if (!keyword) return true;
      return [instance.name, instance.productName, instance.primaryIp, instance.remark]
        .some((value) => value?.toLocaleLowerCase().includes(keyword));
    });
  }, [category, localFilter, listData?.items, search, status]);
  const instances = localFilter
    ? filteredInstances.slice((page - 1) * instancePageSize, page * instancePageSize)
    : filteredInstances;
  const title = category?.label ?? "产品列表";

  return (
    <>
      <LayerCard>
        <LayerCard.Secondary>产品列表{category && <span className="text-sm">· {title}</span>}</LayerCard.Secondary>
        <LayerCard.Primary className={view === "cards" ? "bg-transparent! ring-0! shadow-none!" : undefined}>
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-3">
            <Input size="sm" aria-label="搜索实例" placeholder="按实例名或 IP 搜索" className="min-w-0 w-full sm:w-auto sm:flex-1" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            <div className="max-w-full overflow-x-auto">
              <Tabs variant="segmented" size="sm" aria-label="产品状态分类" value={status} onValueChange={(value) => { setStatus(value as InstanceFilter); setPage(1); }} tabs={[
                { value: "all", label: "全部" }, { value: "active", label: "已激活" }, { value: "pending", label: "待开通" }, { value: "suspended", label: "已暂停" },
              ]} />
            </div>
            <Tabs variant="segmented" size="sm" aria-label="产品展示形式" value={view} onValueChange={value => setView(value as "table" | "cards")} tabs={[{ value: "table", label: "表格" }, { value: "cards", label: "卡片" }]} />
          </div>
          {view === "table" ? <div className="-mx-1 min-w-0 overflow-x-auto text-sm"  aria-label="产品列表">
            <PageState loading={query.isLoading || query.isPlaceholderData} keepContent error={query.error ? getApiMessage(query.error) : null}>
            <Table className="min-w-[900px] [&_tbody_tr]:bg-transparent! [&_th]:bg-transparent! [&_th]:text-xs [&_td]:px-1 [&_td]:py-2.5 [&_th]:px-1 [&_th]:pb-2">
              <Table.Header>
              <Table.Row role="row" className={`${productColumns} border-b border-kumo-fill px-1 pb-2 text-sm font-medium text-kumo-subtle`}>
                {["产品/主机名", "状态", "IP", "到期时间", "费用", "系统", "备注", "生产锁", "自动续费", "操作"].map(label=><Table.Head role="columnheader" key={label} className="text-center">{label === '生产锁' ? <ProductSettingLabel kind="lock" /> : label === '自动续费' ? <ProductSettingLabel kind="auto" /> : label}</Table.Head>)}
              </Table.Row>
              </Table.Header>
                <Table.Body role="rowgroup">{instances.map(instance=><ProductRow key={instance.id} instance={instance} />)}</Table.Body>
            </Table>
            </PageState>
          </div> : <div className="mt-4 min-w-0" aria-label="产品资源列表">
            <PageState loading={query.isLoading || query.isPlaceholderData} keepContent error={query.error ? getApiMessage(query.error) : null}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{instances.map(instance => <ProductRow key={instance.id} instance={instance} card />)}</div>
            </PageState>
          </div>}
          {!query.isLoading && !query.isPlaceholderData && !query.error && instances.length === 0 && <p className="py-6 text-center text-sm text-kumo-subtle">当前条件下暂无产品</p>}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3 text-sm text-kumo-subtle">
            <span>{query.isLoading || query.isPlaceholderData ? "正在加载产品…" : `显示 ${instances.length ? (page-1)*instancePageSize+1 : 0}–${(page-1)*instancePageSize+instances.length} 条，共 ${localFilter ? filteredInstances.length : listData?.total ?? 0} 条`}</span>
            {(localFilter ? filteredInstances.length : listData?.total ?? 0) > instancePageSize && <Pagination page={page} setPage={setPage} perPage={instancePageSize} totalCount={localFilter ? filteredInstances.length : listData?.total ?? 0} />}
          </div>
        </LayerCard.Primary>
      </LayerCard>
    </>
  );
}
