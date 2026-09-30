import { Badge, Button, LayerCard, Table } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { groupBuyAdminApi } from "../../../shared/api/groupbuy";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

function statusLabel(status: number) {
  if (status === 1) return "拼团中";
  if (status === 4) return "交付中";
  if (status === 2) return "拼团成功";
  return "已退款";
}

export function GroupBuyAdminLeaders() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const leaders = useQuery({
    queryKey: ["admin", "groupbuy", "leaders"],
    queryFn: () => groupBuyAdminApi.leaders({ pageSize: 100 }),
  });
  const detail = useQuery({
    queryKey: ["admin", "groupbuy", "leader", selectedId],
    queryFn: () => groupBuyAdminApi.leader(selectedId!),
    enabled: Boolean(selectedId),
  });
  const refund = useMutation({
    mutationFn: groupBuyAdminApi.refund,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "groupbuy", "leaders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "groupbuy", "leader", selectedId] }),
      ]);
    },
  });
  const close = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      groupBuyAdminApi.forcePublic(id, value),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "groupbuy", "leaders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "groupbuy", "leader", selectedId] }),
      ]);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="拼团成员" description="查看团长进度、成员明细、退款状态和公开设置。" />
      <PageState
        loading={leaders.isLoading}
        error={leaders.error ? getApiMessage(leaders.error) : null}
        empty={!leaders.isLoading && !leaders.data?.list.length}
        emptyTitle="暂无拼团记录"
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <Table>
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head>团长</Table.Head>
                <Table.Head>优惠码</Table.Head>
                <Table.Head>进度</Table.Head>
                <Table.Head>实付（分）</Table.Head>
                <Table.Head>状态</Table.Head>
                <Table.Head>操作</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {leaders.data?.list.map((record) => (
                <Table.Row key={record.id}>
                  <Table.Cell>{record.memberName || record.clientId}</Table.Cell>
                  <Table.Cell>{record.inviteCode}</Table.Cell>
                  <Table.Cell>{record.currentNum}/{record.needNum}</Table.Cell>
                  <Table.Cell>{record.payAmount}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={record.status === 1 ? "warning" : record.status === 2 ? "success" : "secondary"}>
                      {statusLabel(record.status)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => setSelectedId(record.id)}>成员明细</Button>
                      <Button
                        variant="secondary"
                        disabled={record.status !== 1}
                        onClick={() => close.mutate({ id: record.id, value: !record.forceClosePublic })}
                      >
                        {record.forceClosePublic ? "恢复公开" : "关闭公开"}
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={record.status !== 1}
                        loading={refund.isPending}
                        onClick={() => refund.mutate(record.id)}
                      >
                        整团退款
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>

      {selectedId ? (
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <div className="flex items-center justify-between gap-3 p-4">
            <div>
              <h2 className="text-lg font-semibold">成员明细</h2>
              <p className="text-sm text-kumo-subdued">团号 #{selectedId}；团长退款会处理整个拼团。</p>
            </div>
            <Button variant="secondary" onClick={() => setSelectedId(undefined)}>关闭</Button>
          </div>
          <PageState
            loading={detail.isLoading}
            error={detail.error ? getApiMessage(detail.error) : null}
            empty={!detail.isLoading && !detail.data?.members.length}
            emptyTitle="暂无成员"
          >
            <Table>
              <Table.Header variant="compact">
                <Table.Row>
                  <Table.Head>成员</Table.Head>
                  <Table.Head>角色</Table.Head>
                  <Table.Head>实付（分）</Table.Head>
                  <Table.Head>状态</Table.Head>
                  <Table.Head>订单 / 主机</Table.Head>
                  <Table.Head>操作</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {detail.data?.members.map((member) => (
                  <Table.Row key={member.id}>
                    <Table.Cell>{member.memberName || member.clientId}</Table.Cell>
                    <Table.Cell>{member.isLeader ? "团长" : "成员"}</Table.Cell>
                    <Table.Cell>{member.payAmount}</Table.Cell>
                    <Table.Cell>{statusLabel(member.status)}</Table.Cell>
                    <Table.Cell>{member.orderId ? `订单 #${member.orderId}` : member.hostId ? `主机 #${member.hostId}` : "—"}</Table.Cell>
                    <Table.Cell>
                      <Button
                        variant="destructive"
                        disabled={detail.data?.leader.status !== 1 || member.status !== 1}
                        loading={refund.isPending}
                        onClick={() => refund.mutate(member.id)}
                      >
                        {member.isLeader ? "整团退款" : "成员退款"}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </PageState>
        </LayerCard>
      ) : null}
    </div>
  );
}
