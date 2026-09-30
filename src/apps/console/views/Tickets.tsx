import { Banner, Button, Input, LayerCard, LinkButton, Pagination, Select, Table, Textarea } from "@cloudflare/kumo";
import { ArrowLeftIcon, ArrowRightIcon, BellRingingIcon, PlusIcon } from "@phosphor-icons/react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import {
  userTicketApi,
  type TicketAttachment,
  type TicketDetail,
  type TicketListResult,
  type TicketReply,
  type TicketStatus,
} from "../../../shared/api/tickets";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { AttachmentPicker } from "../../../shared/components/tickets/AttachmentPicker";
import { ReplyComposer, TicketConversation } from "../../../shared/components/tickets/TicketConversation";
import { TicketStatusBadge } from "../../../shared/components/tickets/TicketStatusBadge";
import { useVisibilityPolling } from "../../../shared/hooks/useVisibilityPolling";

const userRepliedStatus: TicketStatus = { id: "2", name: "用户已回复", color: "#ff6600", final: false, isDefault: false };
const adminRepliedStatus: TicketStatus = { id: "3", name: "已回复", color: "#000000", final: true, isDefault: false };

function mergeTicketList(current: TicketListResult, incoming: TicketListResult): TicketListResult {
  const changed = new Map(incoming.list.map((ticket) => [ticket.id, ticket]));
  const merged = current.list.map((ticket) => changed.get(ticket.id) ?? ticket);
  const existing = new Set(merged.map((ticket) => ticket.id));
  [...incoming.list].reverse().forEach((ticket) => {
    if (!existing.has(ticket.id)) merged.unshift(ticket);
  });
  return { ...current, list: merged.slice(0, current.pageSize), unreadCount: incoming.unreadCount, serverTime: incoming.serverTime };
}

export function TicketList() {
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const queryClient = useQueryClient();
  const queryKey = ["tickets", "user", { status, page }] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => userTicketApi.list({ status: status === "all" ? undefined : status, page, pageSize: 20 }),
    placeholderData: keepPreviousData,
  });
  const cursor = useRef("");
  useEffect(() => { if (query.data?.serverTime) cursor.current = query.data.serverTime; }, [query.data?.serverTime]);

  useVisibilityPolling(async () => {
    if (!cursor.current) return;
    const before = queryClient.getQueryData<TicketListResult>(queryKey);
    const delta = await userTicketApi.list({ status: status === "all" ? undefined : status, page, pageSize: 20, since: cursor.current });
    cursor.current = delta.serverTime;
    if (!before) return;
    const gained = Math.max(0, delta.unreadCount - before.unreadCount);
    if (gained) setNewMessageCount((value) => value + gained);
    if (delta.list.length || delta.unreadCount !== before.unreadCount) queryClient.setQueryData(queryKey, mergeTicketList(before, delta));
  }, (query.data?.pollIntervalSeconds ?? 30) * 1000, query.isSuccess);

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[700px] gap-5">
      <PageHeader
        title="工单中心"
        description={`查看处理进度与客服回复${query.data ? ` · ${query.data.unreadCount} 条未读` : ""}`}
        actions={<LinkButton href="/console/tickets/create" icon={<PlusIcon />}>创建工单</LinkButton>}
      />
      {newMessageCount ? (
        <Banner variant="default" icon={<BellRingingIcon />} title="收到新回复" description={`有 ${newMessageCount} 条新消息已局部更新到列表。`} />
      ) : null}
      <LayerCard className="shadow-none p-5">
        <Select value={status} renderValue={(value) => ({ all: "全部状态", "1": "待接单", "2": "用户已回复", "3": "已回复", "4": "已关闭", "5": "处理中" })[value] ?? value} onValueChange={(value) => { setStatus(value ?? "all"); setPage(1); }} label="状态筛选" hideLabel={false}>
          <Select.Option value="all">全部状态</Select.Option>
          <Select.Option value="1">待接单</Select.Option>
          <Select.Option value="2">用户已回复</Select.Option>
          <Select.Option value="3">已回复</Select.Option>
          <Select.Option value="4">已关闭</Select.Option>
          <Select.Option value="5">处理中</Select.Option>
        </Select>
      </LayerCard>
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !query.data?.list.length} emptyTitle="暂无工单" emptyDescription="遇到问题时可创建工单，我们会尽快处理。">
        <div className="grid gap-3">
          <LayerCard className="shadow-none overflow-x-auto p-0">
            <Table>
              <Table.Header variant="compact"><Table.Row><Table.Head>工单</Table.Head><Table.Head>类型</Table.Head><Table.Head>状态</Table.Head><Table.Head>最后回复</Table.Head><Table.Head className="w-16"><span className="sr-only">查看</span></Table.Head></Table.Row></Table.Header>
              <Table.Body data-animate-list>
                {(query.data?.list ?? []).map((ticket) => (
                  <Table.Row key={ticket.id}>
                    <Table.Cell><div className="grid gap-0.5"><strong className="font-medium text-kumo-strong">{ticket.title}</strong><span className="text-sm text-kumo-subtle">{ticket.ticketNum}{ticket.unreadCount ? ` · ${ticket.unreadCount} 条未读` : ""}</span></div></Table.Cell>
                    <Table.Cell>{ticket.typeName}</Table.Cell>
                    <Table.Cell><TicketStatusBadge status={ticket.status} /></Table.Cell>
                    <Table.Cell className="text-kumo-subtle">{new Date(ticket.lastReplyTime).toLocaleString("zh-CN")}</Table.Cell>
                    <Table.Cell><LinkButton href={`/console/tickets/${ticket.id}`} variant="ghost" shape="square" size="sm" icon={<ArrowRightIcon />} aria-label={`查看 ${ticket.ticketNum}`} /></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </LayerCard>
          {(query.data?.total ?? 0) > 20 ? <Pagination page={page} setPage={setPage} perPage={20} totalCount={query.data?.total ?? 0} /> : null}
        </div>
      </PageState>
    </div>
  );
}

export function TicketCreate() {
  const navigate = useNavigate();
  const types = useQuery({ queryKey: ["tickets", "types"], queryFn: userTicketApi.types });
  const products = useQuery({ queryKey: ["tickets", "products"], queryFn: userTicketApi.products });
  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState("");
  const [hostId, setHostId] = useState("none");
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = useMutation({ mutationFn: userTicketApi.create, onSuccess: (result) => navigate(`/console/tickets/${result.ticket.id}`), onError: (reason) => setError(getApiMessage(reason)) });

  const upload = async (files: File[]) => {
    setUploading(true); setError(null);
    try { const uploaded = await userTicketApi.upload(files); setAttachments((value) => [...value, ...uploaded].slice(0, 5)); }
    catch (reason) { setError(getApiMessage(reason)); }
    finally { setUploading(false); }
  };
  const submit = () => {
    setError(null);
    if (!typeId || !title.trim() || !content.trim()) { setError("请完整填写工单类型、标题和正文。"); return; }
    create.mutate({ title: title.trim(), ticketTypeId: typeId, content: content.trim(), attachments, hostId: hostId === "none" ? undefined : hostId });
  };

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[700px] gap-5">
      <PageHeader title="创建工单" description="请尽量完整描述问题，并可关联受影响的云主机。" actions={<LinkButton href="/console/tickets" variant="secondary" icon={<ArrowLeftIcon />}>返回列表</LinkButton>} />
      {error ? <Banner variant="error" title="提交失败" description={error} /> : null}
      <LayerCard className="shadow-none grid min-w-0 gap-5 p-5 sm:p-6">
        <Select className="w-full" placeholder={types.isError ? "工单类型加载失败" : types.isLoading ? "正在加载工单类型…" : types.data?.length ? "请选择工单类型" : "暂无可用工单类型"} value={typeId} renderValue={(value) => types.data?.find((item) => item.id === value)?.name ?? "请选择工单类型"} onValueChange={(value) => setTypeId(value ?? "")} label="工单类型" hideLabel={false}>
          {(types.data ?? []).map((item) => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)}
        </Select>
        <Input className="w-full" label="标题" value={title} maxLength={128} onChange={(event) => setTitle(event.target.value)} />
        <Select className="w-full" value={hostId} renderValue={(value) => value === "none" ? "不关联产品" : products.data?.find((item) => item.id === value)?.name ?? "选择关联产品"} onValueChange={(value) => setHostId(value ?? "none")} label="关联产品（可选）" hideLabel={false}>
          <Select.Option value="none">不关联产品</Select.Option>
          {(products.data ?? []).map((item) => <Select.Option key={item.id} value={item.id} disabled={!item.canReply}>{item.name}{item.canReply ? "" : "（已到期）"}</Select.Option>)}
        </Select>
        <Textarea className="h-[200px] w-full" label="问题描述" rows={9} value={content} maxLength={20000} onChange={(event) => setContent(event.target.value)} />
        <AttachmentPicker value={attachments} loading={uploading} onUpload={upload} onChange={setAttachments} />
        <div className="flex justify-end"><Button icon={<PlusIcon />} loading={create.isPending} disabled={uploading} onClick={submit}>提交工单</Button></div>
      </LayerCard>
    </div>
  );
}

export function TicketDetailPage() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const queryKey = ["tickets", "user", id] as const;
  const query = useQuery({ queryKey, queryFn: () => userTicketApi.detail(id), enabled: Boolean(id) });
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [quote, setQuote] = useState<TicketReply>();
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const lastReplyId = query.data?.ticket.lastReplyId ?? "0";

  useVisibilityPolling(async () => {
    const rows = await userTicketApi.replies(id, queryClient.getQueryData<TicketDetail>(queryKey)?.ticket.lastReplyId ?? "0");
    if (!rows.length) return;
    queryClient.setQueryData<TicketDetail>(queryKey, (current) => {
      if (!current) return current;
      const known = new Set(current.replies.map((reply) => reply.id));
      const additions = rows.filter((reply) => !known.has(reply.id));
      if (!additions.length) return current;
      const latest = additions.at(-1)!;
      return { ...current, ticket: { ...current.ticket, status: latest.type === "Admin" ? adminRepliedStatus : userRepliedStatus, lastReplyId: latest.id, lastReplyTime: latest.createdAt, unreadCount: 0 }, replies: [...current.replies, ...additions] };
    });
    setNotice(`收到 ${rows.length} 条新回复，已追加到对话。`);
  }, (query.data?.pollIntervalSeconds ?? 30) * 1000, query.isSuccess);

  const reply = useMutation({
    mutationFn: () => userTicketApi.reply(id, { content: content.trim(), attachments, quoteReplyId: quote?.id }),
    onSuccess: (created) => {
      queryClient.setQueryData<TicketDetail>(queryKey, (current) => current ? { ...current, ticket: { ...current.ticket, status: userRepliedStatus, lastReplyId: created.id, lastReplyTime: created.createdAt }, replies: [...current.replies, created] } : current);
      setContent(""); setAttachments([]); setQuote(undefined);
      void queryClient.invalidateQueries({ queryKey: ["tickets", "user"] });
    },
    onError: (reason) => setNotice(getApiMessage(reason)),
  });
  const action = useMutation({ mutationFn: async (kind: "urge" | "close") => { if (kind === "urge") await userTicketApi.urge(id); else await userTicketApi.close(id); }, onSuccess: () => void query.refetch(), onError: (reason) => setNotice(getApiMessage(reason)) });
  const upload = async (files: File[]) => { setUploading(true); try { const uploaded = await userTicketApi.upload(files); setAttachments((value) => [...value, ...uploaded].slice(0, 5)); } catch (reason) { setNotice(getApiMessage(reason)); } finally { setUploading(false); } };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[700px]">
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null}>
      {query.data ? (
        <div className="grid min-w-0 gap-5">
          <PageHeader title={query.data.ticket.title} description={`${query.data.ticket.ticketNum} · ${query.data.ticket.typeName}`} actions={<><TicketStatusBadge status={query.data.ticket.status} /><LinkButton href="/console/tickets" variant="secondary" icon={<ArrowLeftIcon />}>返回列表</LinkButton></>} />
          {notice ? <Banner variant="default" title="工单更新" description={notice} /> : null}
          <LayerCard className="shadow-none p-5 sm:p-6"><dl className="grid gap-3 sm:grid-cols-3"><div><dt className="text-sm text-kumo-subtle">关联产品</dt><dd className="text-kumo-strong">{query.data.ticket.hostName || "未关联"}</dd></div><div><dt className="text-sm text-kumo-subtle">负责人</dt><dd className="text-kumo-strong">{query.data.ticket.adminName || "等待接单"}</dd></div><div><dt className="text-sm text-kumo-subtle">最后回复</dt><dd className="text-kumo-strong">{new Date(query.data.ticket.lastReplyTime).toLocaleString("zh-CN")}</dd></div></dl></LayerCard>
          <TicketConversation replies={query.data.replies} perspective="Client" onQuote={setQuote} />
          <ReplyComposer content={content} quote={quote} submitting={reply.isPending} disabled={!query.data.canReply} onContentChange={setContent} onClearQuote={() => setQuote(undefined)} onSubmit={() => reply.mutate()}>
            <AttachmentPicker value={attachments} loading={uploading} onUpload={upload} onChange={setAttachments} />
          </ReplyComposer>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" icon={<BellRingingIcon />} disabled={!query.data.canUrge} loading={action.isPending} onClick={() => action.mutate("urge")}>催单</Button>
            <Button variant="secondary-destructive" disabled={!query.data.canClose} loading={action.isPending} onClick={() => action.mutate("close")}>关闭工单</Button>
          </div>
          <span className="sr-only">当前最后回复 ID：{lastReplyId}</span>
        </div>
      ) : null}
    </PageState>
    </div>
  );
}
