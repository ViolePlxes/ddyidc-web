import { Button, Input, LayerCard, Link, Pagination, Table, Tabs } from "@cloudflare/kumo";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { consoleApi, type InstanceListItem } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
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

export function InstanceList() {
  const navigate = useNavigate();
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
  const filteredInstances = useMemo(() => {
    if (!localFilter) return query.data?.items ?? [];
    const keyword = search.trim().toLocaleLowerCase();
    return (query.data?.items ?? []).filter((instance) => {
      if (category && !category.matches(instance.productName)) return false;
      if (!matchesFilter(instance, status)) return false;
      if (!keyword) return true;
      return [instance.name, instance.productName, instance.primaryIp, instance.remark]
        .some((value) => value?.toLocaleLowerCase().includes(keyword));
    });
  }, [category, localFilter, query.data?.items, search, status]);
  const instances = localFilter
    ? filteredInstances.slice((page - 1) * instancePageSize, page * instancePageSize)
    : filteredInstances;
  const title = category?.label ?? "产品列表";

  return (
    <>
      <PageHeader title={title} description={category ? `查看当前账号名下的${category.label}实例。` : "查看当前账号名下的全部实例产品，并进入独立控制台。"} />
      <LayerCard>
        <LayerCard.Secondary>{title}</LayerCard.Secondary>
        <LayerCard.Primary>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Input size="sm" aria-label="搜索实例" placeholder="按实例名或 IP 搜索" className="min-w-0 w-full sm:w-auto sm:flex-1" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
            <div className="max-w-full overflow-x-auto">
              <Tabs variant="segmented" size="sm" aria-label="产品状态分类" value={status} onValueChange={(value) => { setStatus(value as InstanceFilter); setPage(1); }} tabs={[
                { value: "all", label: "全部" }, { value: "active", label: "已激活" }, { value: "pending", label: "待开通" }, { value: "suspended", label: "已暂停" },
              ]} />
            </div>
          </div>
      <PageState embedded
        loading={query.isLoading || query.isPlaceholderData} keepContent
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.isPlaceholderData && !query.error && instances.length === 0}
        emptyTitle={category ? `暂无${category.label}实例` : "暂无产品实例"}
        emptyDescription={category ? "该分类下暂无已购实例。" : "当前账号在所选条件下没有实例产品。"}
      >
        <div className="min-w-0 overflow-x-auto">
          <Table>
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head>实例 ID / 名称</Table.Head>
                <Table.Head>关联商品</Table.Head>
                <Table.Head>备注</Table.Head>
                <Table.Head>主 IP</Table.Head>
                <Table.Head>状态</Table.Head>
                <Table.Head>创建时间</Table.Head>
                <Table.Head>计费 / 到期</Table.Head>
                <Table.Head>操作</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body data-animate-list>
              {instances.map((instance) => (
                <Table.Row key={instance.id}>
                  <Table.Cell>
                    <Link href={`/user/instance/${instance.id}.htm`} variant="plain" className="grid text-left">
                      <span className="font-medium text-kumo-strong">{instance.name}</span>
                      <span className="text-xs text-kumo-subtle">{instance.id}</span>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{instance.productName || "—"}</Table.Cell>
                  <Table.Cell className="max-w-xs whitespace-pre-wrap break-words">{instance.remark || "—"}</Table.Cell>
                  <Table.Cell>{instance.primaryIp || "—"}</Table.Cell>
                  <Table.Cell><StatusBadge status={instanceStatus(instance)} /></Table.Cell>
                  <Table.Cell>{instance.createdAt}</Table.Cell>
                  <Table.Cell>
                    <span className="grid">
                      <span>{cycleLabels[instance.billingCycle ?? ""] || instance.billingCycle || "—"}</span>
                      <span className="text-xs text-kumo-subtle">{instance.expiresAt || "未设置到期时间"}</span>
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/user/instance/${instance.id}.htm`, { viewTransition: true })}>进入控制台</Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {(localFilter ? filteredInstances.length : (query.data?.total ?? 0)) > instancePageSize ? (
            <div className="p-4">
              <Pagination
                page={page}
                setPage={setPage}
                perPage={instancePageSize}
                totalCount={localFilter ? filteredInstances.length : (query.data?.total ?? 0)}
              />
            </div>
          ) : null}
        </div>
      </PageState>
        </LayerCard.Primary>
      </LayerCard>
    </>
  );
}
