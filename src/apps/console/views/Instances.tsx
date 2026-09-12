import { Button, Input, LayerCard, Link, Pagination, Select, Table } from "@cloudflare/kumo";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { consoleApi } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { StatusBadge, type StatusCode } from "../../../shared/components/StatusBadge";
import { cycleLabels } from "../../../shared/utils/format";

const instancePageSize = 10;
const instanceStaleTime = 5 * 60 * 1000;
const instanceCacheTime = 30 * 60 * 1000;

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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const queryKey = ["instances", "product-list", page, search, status] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => consoleApi.userInstances({
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
  const instances = query.data?.items ?? [];

  return (
    <>
      <PageHeader title="产品列表" description="查看当前账号名下的全部实例产品，并进入独立控制台。" />
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
        skeleton="table"
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.error && instances.length === 0}
        emptyTitle="暂无产品实例"
        emptyDescription="当前账号在所选条件下没有实例产品。"
      >
        <LayerCard className="overflow-x-auto p-0">
          <Table>
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head>实例 ID / 名称</Table.Head>
                <Table.Head>关联商品</Table.Head>
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
          {(query.data?.total ?? 0) > instancePageSize ? (
            <div className="p-4">
              <Pagination page={page} setPage={setPage} perPage={instancePageSize} totalCount={query.data?.total ?? 0} />
            </div>
          ) : null}
        </LayerCard>
      </PageState>
    </>
  );
}
