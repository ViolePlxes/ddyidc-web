import { adminRequest, type ApiEnvelope } from "./request";

export interface AdminTodo {
  key: string;
  name: string;
  count: number | null;
  state: "ready" | "config_required" | "unavailable";
  description: string;
  oldestAt?: string;
}
export interface AdminTodos { items: AdminTodo[]; total: number; complete: boolean; sampledAt: string }
export interface TodoEntry { id: string; source: string; customerId: string; customerName: string; title: string; number: string; status: string; amount: string; orderId: string; instanceId: string; createdAt: string; updatedAt: string; href: string; lastAdminId?: string; actions?: string[] }
export interface TodoPage { items: TodoEntry[]; total: number; page: number; pageSize: number; sampledAt: string; predicateVersion: string; cutoffAt?: string }
export async function getTodoItems(kind: string, params: Record<string, string | number>) { return (await adminRequest.get<ApiEnvelope<TodoPage>>(`/todos/${encodeURIComponent(kind)}/items`, { params })).data.data; }
export async function getTodoEntry(kind: string, id: string, source: string, view = "pending") { return (await adminRequest.get<ApiEnvelope<TodoEntry>>(`/todos/${encodeURIComponent(kind)}/items/${encodeURIComponent(id)}`, { params: { source, view } })).data.data; }
export async function getAdminTodos() {
  return (await adminRequest.get<ApiEnvelope<AdminTodos>>("/todos")).data.data;
}
