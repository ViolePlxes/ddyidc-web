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
export interface TodoEntry { id: string; source: string; customerId: string; customerName: string; customerRealName?: string; machines?: { id: string; ipAddress: string }[]; title: string; number: string; status: string; amount: string; orderId: string; instanceId: string; createdAt: string; updatedAt: string; href: string; lastAdminId?: string; actions?: string[]; revision?: string; ipAddress?: string; expiresAt?: string | null; billingCycle?: string; upstreamOrderId?: string; upstreamBillingUrl?: string }
export interface ManualProductResult { processed: boolean; outcome: string; message: string; status: "normal" | "review"; facts?: { Status: number; PowerStatus: string; ExpiresAt: string | null; QueriedAt: string; PrimaryIP: string } }
export async function processManualProduct(row: TodoEntry, action: "mark_processed" | "refresh", requestId: string) {
  return (await adminRequest.post<ApiEnvelope<ManualProductResult>>(`/todos/manual-products/items/${encodeURIComponent(row.id)}/process`, {source:row.source, revision:row.revision, action, requestId}, {timeout:40_000})).data.data;
}
export interface TodoPage { items: TodoEntry[]; total: number; page: number; pageSize: number; sampledAt: string; predicateVersion: string; cutoffAt?: string }
export async function getTodoItems(kind: string, params: Record<string, string | number>) { return (await adminRequest.get<ApiEnvelope<TodoPage>>(`/todos/${encodeURIComponent(kind)}/items`, { params })).data.data; }
export async function getTodoEntry(kind: string, id: string, source: string, view = "pending") { return (await adminRequest.get<ApiEnvelope<TodoEntry>>(`/todos/${encodeURIComponent(kind)}/items/${encodeURIComponent(id)}`, { params: { source, view } })).data.data; }
export async function getAdminTodos() {
  return (await adminRequest.get<ApiEnvelope<AdminTodos>>("/todos")).data.data;
}
