import { adminRequest, type ApiEnvelope } from "./request";

export interface AdminTodo {
  key: string;
  name: string;
  count: number | null;
  state: "ready" | "placeholder" | "unavailable";
  description: string;
}
export interface AdminTodos { items: AdminTodo[]; total: number; complete: boolean; sampledAt: string }
export async function getAdminTodos() {
  return (await adminRequest.get<ApiEnvelope<AdminTodos>>("/todos")).data.data;
}
