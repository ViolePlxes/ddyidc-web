import { Button, ClipboardText, Input, LayerCard, Link, Pagination, Tabs } from "@cloudflare/kumo";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { consoleApi, type InstanceListItem } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PencilSimpleIcon, WindowsLogoIcon, LinuxLogoIcon, DesktopIcon } from "@phosphor-icons/react";
import { instanceManagementApi } from "../../../shared/api/instanceManagement";
import { PageState } from "../../../shared/components/PageState";
import { StatusBadge, type StatusCode } from "../../../shared/components/StatusBadge";
import { cycleLabels } from "../../../shared/utils/format";

const instancePageSize = 10;
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

const productColumns = "grid grid-cols-[1.7fr_.8fr_1.4fr_1.1fr_.8fr_1.5fr_1.1fr_.6fr] items-center gap-x-2";
let detailRequests = 0;
const detailWaiters: Array<() => void> = [];
async function loadRowDetail(id: string) {
  if (detailRequests >= 2) await new Promise<void>((resolve) => detailWaiters.push(resolve));
  else detailRequests += 1;
  try {
    await instanceManagementApi(id).status();
    const detail = await consoleApi.instance(id);
    if (detail.infoSource !== "upstream") throw new Error(detail.warning || "最新信息暂时不可用");
    return detail;
  }
  finally { const next = detailWaiters.shift(); if (next) next(); else detailRequests -= 1; }
}
function expiryLabel(value?: string) {
  if (!value) return "未设置到期时间";
  const time = new Date(value.replace(" ", "T")).getTime();
  if (!Number.isFinite(time)) return "";
  const delta = time - Date.now();
  if (delta <= 0) return "已到期";
  return `${Math.ceil(delta / 86400000)}天后到期`;
}
function ProductRow({ instance }: { instance: InstanceListItem }) {
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
  const port = data?.port?.trim();
  const address = instance.primaryIp ? (port ? `${instance.primaryIp.includes(":") ? `[${instance.primaryIp}]` : instance.primaryIp}:${port}` : instance.primaryIp) : undefined;
  const system = data.operatingSystem;
  const SystemIcon = /windows/i.test(system ?? "") ? WindowsLogoIcon : /linux|ubuntu|debian|centos|alma|rocky|fedora|arch|suse/i.test(system ?? "") ? LinuxLogoIcon : DesktopIcon;
  const missing = "未同步";
  return <div role="row" className={`${productColumns} border-b border-kumo-hairline px-1 py-2.5 last:border-b-0`}>
    <div role="cell" className="grid min-w-0 gap-1"><Link href={`/user/instance/${instance.id}.htm`} variant="plain" className="font-medium">{instance.productName || "未命名产品"}</Link><span className="break-all text-xs text-kumo-subtle">{data?.hostname || instance.name}</span></div>
    <div role="cell"><StatusBadge status={instanceStatus(instance)} /></div>
    <div role="cell">{address ? <ClipboardText text={address} size="sm" labels={{ copyAction: `复制连接地址 ${address}` }} className="w-fit max-w-full border-0 ring-0 shadow-none [&>span:first-child]:grow-0 [&>span:first-child]:ps-0 [&>span:first-child]:pe-1 [&>button]:border-l-0! [&>button]:px-1" /> : "未获取"}</div>
    <div role="cell" className="grid gap-1"><span>{instance.expiresAt?.slice(0,10) || "—"}</span><span className="text-xs text-kumo-subtle">{expiryLabel(instance.expiresAt)}</span></div>
    <div role="cell" className="grid gap-1"><span>{data?.renewalAmount ? `¥${data.renewalAmount}` : missing}</span><span className="text-xs text-kumo-subtle">{cycleLabels[instance.billingCycle ?? ""] || instance.billingCycle || "—"}</span></div>
    <div role="cell" className="grid gap-1"><span className="flex min-w-0 items-center gap-1 whitespace-nowrap"><SystemIcon size={18} aria-hidden className="shrink-0 text-kumo-subtle" /><span className="truncate" title={system || missing}>{system || missing}</span></span></div>
    <div role="cell">{editing ? <div className="grid gap-1"><Input autoFocus size="sm" aria-label={`备注 ${instance.name}`} maxLength={1000} value={remark} disabled={save.isPending} onChange={e=>setRemark(e.target.value)} onBlur={()=>{ if(savingRemark.current || save.isPending)return; if(remark.trim()===savedRemark){setEditing(false);return;} save.mutate(); }} onKeyDown={e=>{if(e.key==="Enter"&&!e.nativeEvent.isComposing)e.currentTarget.blur(); if(e.key==="Escape"&&!save.isPending)setEditing(false);}} />{save.isPending && <span role="status" className="text-xs text-kumo-subtle">正在保存…</span>}{save.error && <span role="alert" className="text-xs text-kumo-danger">{getApiMessage(save.error)}</span>}</div> : <Button variant="ghost" size="sm" className="h-auto max-w-full whitespace-normal text-left" disabled={data?.readOnly} aria-label={`编辑备注 ${instance.name}`} onClick={()=>{setRemark(savedRemark);save.reset();setEditing(true);}}><span className="break-all">{savedRemark || "添加备注"}</span><PencilSimpleIcon size={14} className="shrink-0" /></Button>}</div>
    <div role="cell"><Link href={`/user/instance/${instance.id}.htm`} variant="plain">管理</Link></div>
  </div>;
}

export function InstanceList() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const requestedCategory = searchParams.get("category");
  const category = requestedCategory && requestedCategory in productCategories
    ? productCategories[requestedCategory as ProductCategory]
    : undefined;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InstanceFilter>("all");
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
  const refresh = useMutation({
    mutationFn: async () => {
      const rows = instances.filter(instance => ![1, 2, 6].includes(instance.status));
      const results = await Promise.allSettled(rows.map(instance => loadRowDetail(instance.id)));
      if (results.some(result => result.status === "rejected")) throw new Error("部分产品获取失败，请稍后重试");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["instances", "product-list"] });
      void queryClient.invalidateQueries({ queryKey: ["instances", "filter-list"] });
    },
  });
  const title = category?.label ?? "产品列表";

  return (
    <>
      <LayerCard>
        <LayerCard.Secondary>产品列表{category && <span className="text-xs">· {title}</span>}</LayerCard.Secondary>
        <LayerCard.Primary>
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-3">
            <Input size="sm" aria-label="搜索实例" placeholder="按实例名或 IP 搜索" className="min-w-0 w-full sm:w-auto sm:flex-1" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            <Button size="sm" variant="secondary" disabled={refresh.isPending || !instances.length} onClick={() => refresh.mutate()}>{refresh.isPending ? "获取中…" : "获取最新信息"}</Button>
            <div className="max-w-full overflow-x-auto">
              <Tabs variant="segmented" size="sm" aria-label="产品状态分类" value={status} onValueChange={(value) => { setStatus(value as InstanceFilter); setPage(1); }} tabs={[
                { value: "all", label: "全部" }, { value: "active", label: "已激活" }, { value: "pending", label: "待开通" }, { value: "suspended", label: "已暂停" },
              ]} />
            </div>
          </div>
          {refresh.error && <p role="alert" className="mb-2 text-sm text-kumo-danger">{getApiMessage(refresh.error)}</p>}
          <div className="-mx-1 min-w-0 overflow-x-auto text-sm" role="table" aria-label="产品列表">
            <div className="min-w-[900px]">
              <div role="row" className={`${productColumns} border-b border-kumo-fill px-1 pb-2 text-xs font-medium text-kumo-subtle`}>
                {["产品/主机名", "状态", "IP", "到期时间", "费用", "系统", "备注", "操作"].map(label=><span role="columnheader" key={label}>{label}</span>)}
              </div>
              <PageState loading={query.isLoading || query.isPlaceholderData} keepContent error={query.error ? getApiMessage(query.error) : null}>
                <div role="rowgroup">{instances.map(instance=><ProductRow key={instance.id} instance={instance} />)}</div>
              </PageState>
            </div>
          </div>
          {!query.isLoading && !query.isPlaceholderData && !query.error && instances.length === 0 && <p className="py-6 text-center text-sm text-kumo-subtle">当前条件下暂无产品</p>}
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3 text-xs text-kumo-subtle">
            <span>{query.isLoading || query.isPlaceholderData ? "正在加载产品…" : `显示 ${instances.length ? (page-1)*instancePageSize+1 : 0}–${(page-1)*instancePageSize+instances.length} 条，共 ${localFilter ? filteredInstances.length : listData?.total ?? 0} 条`}</span>
            {(localFilter ? filteredInstances.length : listData?.total ?? 0) > instancePageSize && <Pagination page={page} setPage={setPage} perPage={instancePageSize} totalCount={localFilter ? filteredInstances.length : listData?.total ?? 0} />}
          </div>
        </LayerCard.Primary>
      </LayerCard>
    </>
  );
}
