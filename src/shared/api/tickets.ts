import type { AxiosInstance, AxiosResponse } from "axios";
import { adminRequest, type ApiEnvelope, userRequest } from "./request";

export interface TicketAttachment {
  id: string;
  name: string;
  size: number;
  contentType: string;
  url: string;
}

export interface TicketStatus {
  id: string;
  name: string;
  color: string;
  final: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketType {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketReply {
  id: string;
  type: "Client" | "Admin";
  relId: string;
  content: string;
  attachments: TicketAttachment[];
  quoteReplyId?: string;
  quote?: { id: string; type: "Client" | "Admin"; content: string };
  createdAt: string;
}

export interface Ticket {
  id: string;
  ticketNum: string;
  clientId: string;
  clientName?: string;
  title: string;
  ticketTypeId: string;
  typeName: string;
  status: TicketStatus;
  content: string;
  attachments: TicketAttachment[];
  hostId?: string;
  hostName?: string;
  adminId?: string;
  adminName?: string;
  unreadCount: number;
  lastReplyId: string;
  lastReplyTime: string;
  postTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketNote {
  id: string;
  ticketId: string;
  content: string;
  adminId: string;
  createdAt: string;
}

export interface TicketLog {
  id: string;
  actorType: "Client" | "Admin";
  actorId: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface TicketDetail {
  ticket: Ticket;
  replies: TicketReply[];
  notes?: TicketNote[];
  logs?: TicketLog[];
  canReply: boolean;
  canUrge: boolean;
  canClose: boolean;
  pollIntervalSeconds: number;
}

export interface TicketListResult {
  list: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
  serverTime: string;
  pollIntervalSeconds: number;
}

export interface TicketProduct {
  id: string;
  name: string;
  status: number;
  expiresAt?: string;
  canReply: boolean;
}

export interface TicketPrereply {
  id: string;
  content: string;
  sort: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketAdmin {
  id: string;
  name: string;
}

export interface TicketCreateInput {
  title: string;
  ticketTypeId: string;
  content: string;
  attachments: TicketAttachment[];
  hostId?: string;
}

export interface TicketReplyInput {
  content: string;
  attachments: TicketAttachment[];
  quoteReplyId?: string;
  note?: string;
}

async function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>> | Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  const envelope = (await response).data;
  if (envelope.code !== 0) throw new Error(envelope.message || "业务请求失败");
  return envelope.data;
}

async function upload(client: AxiosInstance, files: File[]): Promise<TicketAttachment[]> {
  const body = new FormData();
  files.forEach((file) => body.append("attachments", file));
  const result = await unwrap(
    client.post<ApiEnvelope<{ list: TicketAttachment[] }>>("/tickets/attachments", body, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    }),
  );
  return result.list;
}

export const userTicketApi = {
  list: (params: { status?: string; page?: number; pageSize?: number; since?: string }) =>
    unwrap(userRequest.get<ApiEnvelope<TicketListResult>>("/tickets", { params })),
  types: async () => (await unwrap(userRequest.get<ApiEnvelope<{ list: TicketType[] }>>("/tickets/types"))).list,
  products: async () => (await unwrap(userRequest.get<ApiEnvelope<{ list: TicketProduct[] }>>("/tickets/mine/products"))).list,
  statistic: () => unwrap(userRequest.get<ApiEnvelope<Record<string, number>>>("/tickets/statistic")),
  detail: (id: string) => unwrap(userRequest.get<ApiEnvelope<TicketDetail>>(`/tickets/${id}`)),
  replies: async (id: string, since: string) =>
    (await unwrap(userRequest.get<ApiEnvelope<{ list: TicketReply[] }>>(`/tickets/${id}/replies`, { params: { since } }))).list,
  create: (input: TicketCreateInput) => unwrap(userRequest.post<ApiEnvelope<TicketDetail>>("/tickets", input)),
  reply: (id: string, input: TicketReplyInput) => unwrap(userRequest.post<ApiEnvelope<TicketReply>>(`/tickets/${id}/replies`, input)),
  urge: (id: string) => unwrap(userRequest.put<ApiEnvelope<{ urged: boolean }>>(`/tickets/${id}/urge`)),
  close: (id: string) => unwrap(userRequest.put<ApiEnvelope<{ closed: boolean }>>(`/tickets/${id}/close`)),
  upload: (files: File[]) => upload(userRequest, files),
};

export const adminTicketApi = {
  list: (params: { status?: string; typeId?: string; keyword?: string; page?: number; pageSize?: number; since?: string }) =>
    unwrap(adminRequest.get<ApiEnvelope<TicketListResult>>("/tickets", { params })),
  detail: (id: string) => unwrap(adminRequest.get<ApiEnvelope<TicketDetail>>(`/tickets/${id}`)),
  reply: (id: string, input: TicketReplyInput) => unwrap(adminRequest.post<ApiEnvelope<TicketReply>>(`/tickets/${id}/replies`, input)),
  receive: (id: string) => unwrap(adminRequest.put<ApiEnvelope<{ received: boolean }>>(`/tickets/${id}/receive`)),
  resolve: (id: string) => unwrap(adminRequest.put<ApiEnvelope<{ resolved: boolean }>>(`/tickets/${id}/resolved`)),
  close: (id: string) => unwrap(adminRequest.put<ApiEnvelope<{ closed: boolean }>>(`/tickets/${id}/close`)),
  forward: (id: string, input: { forwardAdminId?: string; ticketTypeId?: string; notes: string }) =>
    unwrap(adminRequest.post<ApiEnvelope<{ forwarded: boolean }>>(`/tickets/${id}/forward`, input)),
  logs: async (id: string) => (await unwrap(adminRequest.get<ApiEnvelope<{ list: TicketLog[] }>>(`/tickets/${id}/log`))).list,
  replies: async (id: string, since: string) =>
    (await unwrap(adminRequest.get<ApiEnvelope<{ list: TicketReply[] }>>(`/tickets/${id}/replies`, { params: { since } }))).list,
  upload: (files: File[]) => upload(adminRequest, files),
  types: async () => (await unwrap(adminRequest.get<ApiEnvelope<{ list: TicketType[] }>>("/tickets/types"))).list,
  statuses: async () => (await unwrap(adminRequest.get<ApiEnvelope<{ list: TicketStatus[] }>>("/tickets/statuses"))).list,
  prereplies: async () => (await unwrap(adminRequest.get<ApiEnvelope<{ list: TicketPrereply[] }>>("/tickets/prereplies"))).list,
  admins: async () => (await unwrap(adminRequest.get<ApiEnvelope<{ list: TicketAdmin[] }>>("/tickets/admins"))).list,
  saveType: (id: string | undefined, input: { name: string }) => id
    ? unwrap(adminRequest.put<ApiEnvelope<TicketType>>(`/tickets/types/${id}`, input))
    : unwrap(adminRequest.post<ApiEnvelope<TicketType>>("/tickets/types", input)),
  deleteType: (id: string) => unwrap(adminRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/tickets/types/${id}`)),
  saveStatus: (id: string | undefined, input: Omit<TicketStatus, "id">) => id
    ? unwrap(adminRequest.put<ApiEnvelope<TicketStatus>>(`/tickets/statuses/${id}`, input))
    : unwrap(adminRequest.post<ApiEnvelope<TicketStatus>>("/tickets/statuses", input)),
  deleteStatus: (id: string) => unwrap(adminRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/tickets/statuses/${id}`)),
  savePrereply: (id: string | undefined, input: { content: string; sort: number }) => id
    ? unwrap(adminRequest.put<ApiEnvelope<TicketPrereply>>(`/tickets/prereplies/${id}`, input))
    : unwrap(adminRequest.post<ApiEnvelope<TicketPrereply>>("/tickets/prereplies", input)),
  deletePrereply: (id: string) => unwrap(adminRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/tickets/prereplies/${id}`)),
  addNote: (ticketId: string, content: string) => unwrap(adminRequest.post<ApiEnvelope<TicketNote>>(`/tickets/${ticketId}/notes`, { content })),
  updateNote: (ticketId: string, noteId: string, content: string) => unwrap(adminRequest.put<ApiEnvelope<{ updated: boolean }>>(`/tickets/${ticketId}/notes/${noteId}`, { content })),
  deleteNote: (ticketId: string, noteId: string) => unwrap(adminRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/tickets/${ticketId}/notes/${noteId}`)),
};
