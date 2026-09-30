import { Badge, Button, Empty, LayerCard, Text } from "@cloudflare/kumo";
import { ListChecksIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getAdminTodos } from "../../../shared/api/adminTodos";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

export function AdminTodos() {
  const { kind } = useParams();
  const query = useQuery({ queryKey: ["admin-todos"], queryFn: getAdminTodos, refetchInterval: 30_000, retry: false });
  const item = query.data?.items.find(row => row.key === kind);
  return <>
    <PageHeader title={item?.name ?? "待办事项"} description="汇总当前待处理数量，每30秒自动更新。" actions={<Button variant="secondary" loading={query.isFetching} onClick={() => void query.refetch()}>刷新</Button>} />
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null}>
      {item ? <LayerCard className="grid gap-5 p-5 shadow-none">
        <div className="flex items-center gap-3"><Text variant="heading">{item.name}</Text><Badge variant="error">{item.count ?? "—"}</Badge></div>
        <Text variant="secondary">{item.description}</Text>
        <Empty icon={<ListChecksIcon />} title={item.state === "unavailable" ? "统计暂不可用" : item.count ? "待办明细待开放" : "暂无数据"} description={item.state === "unavailable" ? "暂时无法读取该业务统计，请稍后刷新。" : item.count ? "当前已接入真实数量，本页明细列表后续补齐，请从对应业务菜单处理。" : item.state === "placeholder" ? "功能开发完成后接入业务数据。" : "当前没有该类待处理事项。"} />
      </LayerCard> : <Empty icon={<ListChecksIcon />} title="请选择待办分类" description="从左侧待办事项菜单选择分类。" />}
    </PageState>
  </>;
}
