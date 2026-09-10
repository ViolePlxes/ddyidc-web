import { Button, Input, LayerCard, Pagination, Select, Table } from "@cloudflare/kumo";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { consoleApi } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { StatusBadge, type StatusCode } from "../../../shared/components/StatusBadge";
import { cycleLabels } from "../../../shared/utils/format";

function instanceStatus(status: number): StatusCode {
  if (status === 3) return "running";
  if (status === 1 || status === 2) return "provisioning";
  if (status === 4) return "stopped";
  if (status === 6) return "destroyed";
  return "expired";
}

export function InstanceList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const query = useQuery({
    queryKey: ["instances", "product-list", page, search, status],
    queryFn: () => consoleApi.userInstances({
      page,
      pageSize: 10,
      search: search.trim() || undefined,
      status: status === "all" ? undefined : Number(status),
    }),
    retry: false,
    placeholderData: keepPreviousData,
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
                    <button className="grid text-left" onClick={() => navigate(`/user/instance/${instance.id}.htm`, { viewTransition: true })}>
                      <span className="font-medium text-kumo-strong">{instance.name}</span>
                      <span className="text-xs text-kumo-subtle">{instance.id}</span>
                    </button>
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
          {(query.data?.total ?? 0) > 10 ? (
            <div className="p-4">
              <Pagination page={page} setPage={setPage} perPage={10} totalCount={query.data?.total ?? 0} />
            </div>
          ) : null}
        </LayerCard>
      </PageState>
    </>
  );
}
