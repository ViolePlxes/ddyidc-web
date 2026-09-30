import { Button, Input, LayerCard, Link, Pagination, Select, Table } from "@cloudflare/kumo";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { consoleApi } from "../../../shared/api/console";
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

async function loadInstances(status?: number) {
  const pageSize = 100;
  const first = await consoleApi.userInstances({ page: 1, pageSize, status });
  const items = [...first.items];
  for (let page = 2; items.length < first.total; page += 1) {
    const next = await consoleApi.userInstances({ page, pageSize, status });
    if (!next.items.length) break;
    items.push(...next.items);
  }
  return { ...first, items, total: items.length, page: 1, pageSize };
}

function instanceStatus(status: number): StatusCode {
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
  const [status, setStatus] = useState("all");
  const queryKey = category
    ? (["instances", "product-categories", status] as const)
    : (["instances", "product-list", page, search, status] as const);
  const query = useQuery({
    queryKey,
    queryFn: () => category
      ? loadInstances(status === "all" ? undefined : Number(status))
      : consoleApi.userInstances({
          page,
          pageSize: instancePageSize,
          search: search.trim() || undefined,
          status: status === "all" ? undefined : Number(status),
        }),
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
    if (!category) return query.data?.items ?? [];
    const keyword = search.trim().toLocaleLowerCase();
    return (query.data?.items ?? []).filter((instance) => {
      if (!category.matches(instance.productName)) return false;
      if (!keyword) return true;
      return [instance.name, instance.productName, instance.primaryIp, instance.remark]
        .some((value) => value?.toLocaleLowerCase().includes(keyword));
    });
  }, [category, query.data?.items, search]);
  const instances = category
    ? filteredInstances.slice((page - 1) * instancePageSize, page * instancePageSize)
    : filteredInstances;
  const title = category?.label ?? "产品列表";

  return (
    <>
      <PageHeader title={title} description={category ? `查看当前账号名下的${category.label}实例。` : "查看当前账号名下的全部实例产品，并进入独立控制台。"} />
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          aria-label="搜索实例"
          placeholder="按实例名或 IP 搜索"
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
        />
        <Select
          aria-label="实例状态"
          value={status}
          onValueChange={(value) => { if (value) { setStatus(value); setPage(1); } }}
          items={{ all: "全部状态", "1": "待开通", "2": "开通中", "3": "运行中", "4": "已关机", "5": "已过期", "6": "已销毁" }}
        />
      </div>
      <PageState
        loading={query.isLoading}
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.error && instances.length === 0}
        emptyTitle={category ? `暂无${category.label}实例` : "暂无产品实例"}
        emptyDescription={category ? "该分类下暂无已购实例。" : "当前账号在所选条件下没有实例产品。"}
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
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
                  <Table.Cell><StatusBadge status={instanceStatus(instance.status)} /></Table.Cell>
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
          {(category ? filteredInstances.length : (query.data?.total ?? 0)) > instancePageSize ? (
            <div className="p-4">
              <Pagination
                page={page}
                setPage={setPage}
                perPage={instancePageSize}
                totalCount={category ? filteredInstances.length : (query.data?.total ?? 0)}
              />
            </div>
          ) : null}
        </LayerCard>
      </PageState>
    </>
  );
}
