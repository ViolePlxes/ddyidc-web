import { adminRequest, userRequest, type ApiEnvelope } from "./request";
export interface CreditRow {
  id: string;
  type: string;
  amount: string;
  amount_before: string;
  amount_after: string;
  frozen_before: string;
  frozen_after: string;
  notes: string;
  client_notes: string;
  create_time: string;
  admin_name: string;
  ref_type: string;
  ref_id: string;
  biz_trace: string;
  is_unfrozen?: boolean;
}
export interface CreditPage {
  list: CreditRow[];
  count: number;
  page_total_amount: string;
  total_amount: string;
}
async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>) {
  const r = (await p).data;
  if (r.code !== 0) throw new Error(r.message);
  return r.data;
}
export const customerFinanceApi = {
  detail: (id: string) =>
    unwrap(
      adminRequest.get<
        ApiEnvelope<{ balance: string; frozen_balance: string }>
      >(`/clients/${id}`),
    ),
  list: (id: string, page: number, type: string, frozen = false) =>
    unwrap(
      adminRequest.get<ApiEnvelope<CreditPage>>(
        `/clients/${id}/credit${frozen ? "/freeze" : ""}`,
        { params: { page, limit: 10, type } },
      ),
    ),
  change: (id: string, action: string, input: Record<string, unknown>) =>
    unwrap(
      action === "adjust"
        ? adminRequest.put(`/clients/${id}/credit`, input)
        : adminRequest.post(`/clients/${id}/${action}`, input),
    ),
  login: async (id: string) => {
    const result = await unwrap(
      adminRequest.post<ApiEnvelope<{ jwt: string; redirect: string }>>(
        `/clients/${id}/login`,
      ),
    );
    await unwrap(
      userRequest.get("/auth/me", {
        headers: { Authorization: `Bearer ${result.jwt}` },
      }),
    );
    return result;
  },
};
