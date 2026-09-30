import { Banner, Button, Dialog, Input, LayerCard, LinkButton, Pagination, Select, Table, Tabs, Textarea } from "@cloudflare/kumo";
import { ArrowLeftIcon, ArrowRightIcon, ArrowsLeftRightIcon, CheckCircleIcon, HandPalmIcon, PencilSimpleIcon, PlusIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { adminTicketApi, type TicketAttachment, type TicketDetail, type TicketListResult, type TicketReply, type TicketStatus } from "../../../shared/api/tickets";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { AttachmentPicker } from "../../../shared/components/tickets/AttachmentPicker";
import { ReplyComposer, TicketConversation } from "../../../shared/components/tickets/TicketConversation";
import { TicketStatusBadge } from "../../../shared/components/tickets/TicketStatusBadge";
import { useVisibilityPolling } from "../../../shared/hooks/useVisibilityPolling";

const userRepliedStatus: TicketStatus = { id: "2", name: "用户已回复", color: "#ff6600", final: false, isDefault: false };
const adminRepliedStatus: TicketStatus = { id: "3", name: "已回复", color: "#000000", final: true, isDefault: false };

function mergeList(current: TicketListResult, incoming: TicketListResult): TicketListResult {
  const changes = new Map(incoming.list.map((ticket) => [ticket.id, ticket]));
  const rows = current.list.map((ticket) => changes.get(ticket.id) ?? ticket);
  const ids = new Set(rows.map((ticket) => ticket.id));
  [...incoming.list].reverse().forEach((ticket) => { if (!ids.has(ticket.id)) rows.unshift(ticket); });
  return { ...current, list: rows.slice(0, current.pageSize), unreadCount: incoming.unreadCount, serverTime: incoming.serverTime };
}

export function AdminTicketList() {
  const [status, setStatus] = useState("all");
  const [typeId, setTypeId] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const queryKey = ["tickets", "admin", { status, typeId, keyword, page }] as const;
  const query = useQuery({ queryKey, queryFn: () => adminTicketApi.list({ status: status === "all" ? undefined : status, typeId: typeId === "all" ? undefined : typeId, keyword: keyword || undefined, page, pageSize: 20 }), placeholderData: keepPreviousData });
  const types = useQuery({ queryKey: ["tickets", "admin", "types"], queryFn: adminTicketApi.types, staleTime: 5 * 60_000 });
  const statuses = useQuery({ queryKey: ["tickets", "admin", "statuses"], queryFn: adminTicketApi.statuses, staleTime: 5 * 60_000 });
  const cursor = useRef("");
  useEffect(() => { if (query.data?.serverTime) cursor.current = query.data.serverTime; }, [query.data?.serverTime]);
  useVisibilityPolling(async () => {
    if (!cursor.current) return;
    const current = queryClient.getQueryData<TicketListResult>(queryKey);
    const delta = await adminTicketApi.list({ status: status === "all" ? undefined : status, typeId: typeId === "all" ? undefined : typeId, keyword: keyword || undefined, page, pageSize: 20, since: cursor.current });
    cursor.current = delta.serverTime;
    if (!current) return;
    const gained = Math.max(0, delta.unreadCount - current.unreadCount);
    if (gained) setNotice(`有 ${gained} 条客户新消息，已局部更新。`);
    if (delta.list.length || delta.unreadCount !== current.unreadCount) queryClient.setQueryData(queryKey, mergeList(current, delta));
  }, (query.data?.pollIntervalSeconds ?? 30) * 1000, query.isSuccess);
  const receive = useMutation({ mutationFn: adminTicketApi.receive, onSuccess: () => void query.refetch(), onError: (reason) => setNotice(getApiMessage(reason)) });

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[700px] gap-5">
      <PageHeader title="工单管理" description={`待接单优先展示${query.data ? ` · ${query.data.unreadCount} 条未读` : ""}`} />
      {notice ? <Banner variant="default" title="工单提醒" description={notice} /> : null}
      <LayerCard className="shadow-none grid gap-5 p-5 sm:grid-cols-3">
        <Select value={status} renderValue={(value) => value === "all" ? "全部状态" : statuses.data?.find((item) => item.id === value)?.name ?? value} onValueChange={(value) => { setStatus(value ?? "all"); setPage(1); }} label="状态" hideLabel={false}>
          <Select.Option value="all">全部状态</Select.Option>
          {(statuses.data ?? []).map((item) => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)}
        </Select>
        <Select value={typeId} renderValue={(value) => value === "all" ? "全部类型" : types.data?.find((item) => item.id === value)?.name ?? value} onValueChange={(value) => { setTypeId(value ?? "all"); setPage(1); }} label="工单类型" hideLabel={false}>
          <Select.Option value="all">全部类型</Select.Option>
          {(types.data ?? []).map((item) => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)}
        </Select>
        <Input label="关键词" value={keyword} placeholder="工单号或标题" onChange={(event) => { setKeyword(event.target.value); setPage(1); }} />
      </LayerCard>
      <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !query.data?.list.length} emptyTitle="暂无匹配工单">
        <div className="grid gap-3">
          <LayerCard className="shadow-none overflow-x-auto p-0">
            <Table>
              <Table.Header variant="compact"><Table.Row><Table.Head>工单</Table.Head><Table.Head>客户 / 类型</Table.Head><Table.Head>状态</Table.Head><Table.Head>负责人</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header>
              <Table.Body data-animate-list>
                {(query.data?.list ?? []).map((ticket) => (
                  <Table.Row key={ticket.id}>
                    <Table.Cell><div className="grid gap-0.5"><strong className="font-medium text-kumo-strong">{ticket.title}</strong><span className="text-sm text-kumo-subtle">{ticket.ticketNum}{ticket.unreadCount ? ` · ${ticket.unreadCount} 条未读` : ""}</span></div></Table.Cell>
                    <Table.Cell><div className="grid gap-0.5"><span>{ticket.clientName || ticket.clientId}</span><span className="text-sm text-kumo-subtle">{ticket.typeName}</span></div></Table.Cell>
                    <Table.Cell><TicketStatusBadge status={ticket.status} /></Table.Cell>
                    <Table.Cell>{ticket.adminName || "未接单"}</Table.Cell>
                    <Table.Cell><div className="flex gap-1">{ticket.status.id === "1" ? <Button size="sm" variant="secondary" icon={<HandPalmIcon />} loading={receive.isPending} onClick={() => receive.mutate(ticket.id)}>接单</Button> : null}<LinkButton href={`/admin/tickets/${ticket.id}`} variant="ghost" shape="square" size="sm" icon={<ArrowRightIcon />} aria-label={`查看 ${ticket.ticketNum}`} /></div></Table.Cell>
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

function ForwardDialog({ ticketId, onDone, onError }: { ticketId: string; onDone: () => void; onError: (message: string) => void }) {
  const [adminId, setAdminId] = useState("none");
  const [typeId, setTypeId] = useState("none");
  const [notes, setNotes] = useState("");
  const admins = useQuery({ queryKey: ["tickets", "admin", "admins"], queryFn: adminTicketApi.admins });
  const types = useQuery({ queryKey: ["tickets", "admin", "types"], queryFn: adminTicketApi.types });
  const mutation = useMutation({ mutationFn: () => adminTicketApi.forward(ticketId, { forwardAdminId: adminId === "none" ? undefined : adminId, ticketTypeId: typeId === "none" ? undefined : typeId, notes }), onSuccess: onDone, onError: (reason) => onError(getApiMessage(reason)) });
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="secondary" icon={<ArrowsLeftRightIcon />}>转交</Button>} />
      <Dialog className="grid gap-5 p-6">
        <div className="flex justify-between"><div><Dialog.Title className="text-xl font-semibold">转交工单</Dialog.Title><Dialog.Description className="text-kumo-subtle">可转给指定管理员，或调整所属工单类型。</Dialog.Description></div><Dialog.Close render={<Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" />} /></div>
        <Select value={adminId} renderValue={(value) => value === "none" ? "不指定管理员" : admins.data?.find((item) => item.id === value)?.name ?? value} onValueChange={(value) => setAdminId(value ?? "none")} label="目标管理员" hideLabel={false}><Select.Option value="none">不指定管理员</Select.Option>{(admins.data ?? []).map((item) => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)}</Select>
        <Select value={typeId} renderValue={(value) => value === "none" ? "保持当前类型" : types.data?.find((item) => item.id === value)?.name ?? value} onValueChange={(value) => setTypeId(value ?? "none")} label="目标类型" hideLabel={false}><Select.Option value="none">保持当前类型</Select.Option>{(types.data ?? []).map((item) => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)}</Select>
        <Input label="转交说明" value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="flex justify-end gap-2"><Dialog.Close render={<Button variant="secondary">取消</Button>} /><Button loading={mutation.isPending} disabled={adminId === "none" && typeId === "none"} onClick={() => mutation.mutate()}>确认转交</Button></div>
      </Dialog>
    </Dialog.Root>
  );
}

function NoteEditDialog({ ticketId, noteId, initialContent, onDone, onError }: { ticketId: string; noteId: string; initialContent: string; onDone: () => void; onError: (message: string) => void }) {
  const [content, setContent] = useState(initialContent);
  const mutation = useMutation({ mutationFn: () => adminTicketApi.updateNote(ticketId, noteId, content), onSuccess: onDone, onError: (reason) => onError(getApiMessage(reason)) });
  return (
    <Dialog.Root>
      <Dialog.Trigger render={<Button variant="ghost" shape="square" icon={<PencilSimpleIcon />} title="编辑备注" aria-label="编辑备注" />} />
      <Dialog className="grid gap-5 p-6">
        <div className="flex justify-between"><div><Dialog.Title className="text-xl font-semibold">编辑内部备注</Dialog.Title><Dialog.Description className="text-kumo-subtle">备注仅管理员可见。</Dialog.Description></div><Dialog.Close render={<Button variant="ghost" shape="square" icon={<XIcon />} title="关闭" aria-label="关闭" />} /></div>
        <Textarea label="备注内容" rows={6} value={content} onChange={(event) => setContent(event.target.value)} />
        <div className="flex justify-end gap-2"><Dialog.Close render={<Button variant="secondary">取消</Button>} /><Button loading={mutation.isPending} disabled={!content.trim()} onClick={() => mutation.mutate()}>保存</Button></div>
      </Dialog>
    </Dialog.Root>
  );
}

export function AdminTicketDetail() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const queryKey = ["tickets", "admin", id] as const;
  const query = useQuery({ queryKey, queryFn: () => adminTicketApi.detail(id), enabled: Boolean(id) });
  const prereplies = useQuery({ queryKey: ["tickets", "admin", "prereplies"], queryFn: adminTicketApi.prereplies });
  const [tab, setTab] = useState("conversation");
  const [content, setContent] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [quote, setQuote] = useState<TicketReply>();
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useVisibilityPolling(async () => {
    const current = queryClient.getQueryData<TicketDetail>(queryKey);
    if (!current) return;
    const rows = await adminTicketApi.replies(id, current.ticket.lastReplyId);
    if (!rows.length) return;
    queryClient.setQueryData<TicketDetail>(queryKey, (value) => {
      if (!value) return value;
      const known = new Set(value.replies.map((reply) => reply.id));
      const additions = rows.filter((reply) => !known.has(reply.id));
      if (!additions.length) return value;
      const latest = additions.at(-1)!;
      return { ...value, ticket: { ...value.ticket, status: latest.type === "Client" ? userRepliedStatus : adminRepliedStatus, lastReplyId: latest.id, lastReplyTime: latest.createdAt, unreadCount: 0 }, replies: [...value.replies, ...additions] };
    });
    setNotice(`收到 ${rows.length} 条客户新消息，已追加到对话。`);
  }, (query.data?.pollIntervalSeconds ?? 30) * 1000, query.isSuccess);

  const refresh = () => { void query.refetch(); void queryClient.invalidateQueries({ queryKey: ["tickets", "admin"] }); };
  const reply = useMutation({ mutationFn: () => adminTicketApi.reply(id, { content: content.trim(), attachments, quoteReplyId: quote?.id, note: internalNote.trim() || undefined }), onSuccess: (created) => { queryClient.setQueryData<TicketDetail>(queryKey, (current) => current ? { ...current, ticket: { ...current.ticket, status: adminRepliedStatus, lastReplyId: created.id, lastReplyTime: created.createdAt }, replies: [...current.replies, created] } : current); setContent(""); setInternalNote(""); setAttachments([]); setQuote(undefined); refresh(); }, onError: (reason) => setNotice(getApiMessage(reason)) });
  const action = useMutation({ mutationFn: async (kind: "receive" | "resolve" | "close") => { if (kind === "receive") await adminTicketApi.receive(id); else if (kind === "resolve") await adminTicketApi.resolve(id); else await adminTicketApi.close(id); }, onSuccess: refresh, onError: (reason) => setNotice(getApiMessage(reason)) });
  const addNote = useMutation({ mutationFn: () => adminTicketApi.addNote(id, noteContent), onSuccess: () => { setNoteContent(""); refresh(); }, onError: (reason) => setNotice(getApiMessage(reason)) });
  const deleteNote = useMutation({ mutationFn: (noteId: string) => adminTicketApi.deleteNote(id, noteId), onSuccess: refresh, onError: (reason) => setNotice(getApiMessage(reason)) });
  const upload = async (files: File[]) => { setUploading(true); try { const uploaded = await adminTicketApi.upload(files); setAttachments((value) => [...value, ...uploaded].slice(0, 5)); } catch (reason) { setNotice(getApiMessage(reason)); } finally { setUploading(false); } };

  return (
    <div className="mx-auto w-full min-w-0 max-w-[700px]">
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null}>
      {query.data ? (
        <div className="grid min-w-0 gap-5">
          <PageHeader title={query.data.ticket.title} description={`${query.data.ticket.ticketNum} · ${query.data.ticket.clientName || query.data.ticket.clientId}`} actions={<><TicketStatusBadge status={query.data.ticket.status} /><LinkButton href="/admin/tickets" variant="secondary" icon={<ArrowLeftIcon />}>返回列表</LinkButton></>} />
          {notice ? <Banner variant="default" title="工单更新" description={notice} /> : null}
          <div className="flex flex-wrap gap-2"><Button variant="secondary" icon={<HandPalmIcon />} disabled={query.data.ticket.status.id === "4"} loading={action.isPending} onClick={() => action.mutate("receive")}>接单</Button><Button variant="secondary" icon={<CheckCircleIcon />} disabled={query.data.ticket.status.id === "4"} loading={action.isPending} onClick={() => action.mutate("resolve")}>已解决</Button><ForwardDialog ticketId={id} onDone={refresh} onError={setNotice} /><Button variant="secondary-destructive" disabled={query.data.ticket.status.id === "4"} loading={action.isPending} onClick={() => action.mutate("close")}>关闭</Button></div>
          <LayerCard className="shadow-none p-5 sm:p-6"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-sm text-kumo-subtle">工单类型</dt><dd>{query.data.ticket.typeName}</dd></div><div><dt className="text-sm text-kumo-subtle">关联产品</dt><dd>{query.data.ticket.hostName || "未关联"}</dd></div><div><dt className="text-sm text-kumo-subtle">负责人</dt><dd>{query.data.ticket.adminName || "未接单"}</dd></div><div><dt className="text-sm text-kumo-subtle">最后回复</dt><dd>{new Date(query.data.ticket.lastReplyTime).toLocaleString("zh-CN")}</dd></div></dl></LayerCard>
          <Tabs variant="underline" tabs={[{ value: "conversation", label: "对话" }, { value: "notes", label: `内部备注 (${query.data.notes?.length ?? 0})` }, { value: "logs", label: `操作日志 (${query.data.logs?.length ?? 0})` }]} value={tab} onValueChange={setTab} />
          {tab === "conversation" ? <><TicketConversation replies={query.data.replies} perspective="Admin" onQuote={setQuote} /><ReplyComposer content={content} quote={quote} submitting={reply.isPending} disabled={!query.data.canReply} onContentChange={setContent} onClearQuote={() => setQuote(undefined)} onSubmit={() => reply.mutate()}><Select value="none" renderValue={() => "选择预设回复"} onValueChange={(value) => { const selected = prereplies.data?.find((item) => item.id === value); if (selected) setContent(selected.content); }} label="预设回复" hideLabel={false}><Select.Option value="none">选择预设回复</Select.Option>{(prereplies.data ?? []).map((item) => <Select.Option key={item.id} value={item.id}>{item.content.slice(0, 30)}</Select.Option>)}</Select><Textarea label="随回复添加内部备注（可选）" rows={3} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} /><AttachmentPicker value={attachments} loading={uploading} onUpload={upload} onChange={setAttachments} /></ReplyComposer></> : null}
          {tab === "notes" ? <LayerCard className="shadow-none grid gap-5 p-5 sm:p-6"><Textarea label="新增内部备注" rows={4} value={noteContent} onChange={(event) => setNoteContent(event.target.value)} /><div><Button icon={<PlusIcon />} loading={addNote.isPending} disabled={!noteContent.trim()} onClick={() => addNote.mutate()}>添加备注</Button></div><ul className="divide-y divide-kumo-line">{(query.data.notes ?? []).map((note) => <li key={note.id} className="flex items-start gap-3 py-3"><div className="min-w-0 flex-1"><p className="whitespace-pre-wrap text-kumo-default">{note.content}</p><span className="text-xs text-kumo-subtle">管理员 {note.adminId} · {new Date(note.createdAt).toLocaleString("zh-CN")}</span></div><div className="flex gap-1"><NoteEditDialog ticketId={id} noteId={note.id} initialContent={note.content} onDone={refresh} onError={setNotice} /><Button variant="ghost" shape="square" size="sm" icon={<TrashIcon />} title="删除备注" aria-label="删除备注" loading={deleteNote.isPending} onClick={() => deleteNote.mutate(note.id)} /></div></li>)}</ul></LayerCard> : null}
          {tab === "logs" ? <LayerCard className="shadow-none overflow-x-auto p-0"><Table><Table.Header variant="compact"><Table.Row><Table.Head>时间</Table.Head><Table.Head>操作</Table.Head><Table.Head>说明</Table.Head><Table.Head>操作者</Table.Head></Table.Row></Table.Header><Table.Body>{(query.data.logs ?? []).map((log) => <Table.Row key={log.id}><Table.Cell>{new Date(log.createdAt).toLocaleString("zh-CN")}</Table.Cell><Table.Cell>{log.action}</Table.Cell><Table.Cell>{log.detail}</Table.Cell><Table.Cell>{log.actorType} {log.actorId}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard> : null}
        </div>
      ) : null}
    </PageState>
    </div>
  );
}
