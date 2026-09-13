import { adminRequest, type ApiEnvelope } from "./request";
import type { AdminPage } from "./adminOverview";
export interface CustomerProfile {
  name: string;
  company: string;
  address: string;
  operationPasswordSet: boolean;
  settings: { remark: string; receiveSms: boolean; receiveEmail: boolean };
  realname:
    | {
        name: string;
        companyName: string;
        type: number;
        status: number;
        rejectReason: string;
        createdAt: string;
      }[]
    | null;
}
export interface CustomerProfileInput {
  operationPassword: string;
  name: string;
  company: string;
  countryCode: string;
  mobile: string;
  email: string;
  country: string;
  address: string;
  language: string;
  password: string;
  remark: string;
  receiveSms: boolean;
  receiveEmail: boolean;
}
export interface CustomerRecord {
  id: string;
  number: string;
  name: string;
  status: number;
  ip: string;
  type: number;
  direction: number;
  amount: number;
  balance_before: number;
  balance_after: number;
  remark: string;
  created_at: string;
  expires_at: string | null;
}
async function data<T>(request: Promise<{ data: ApiEnvelope<T> }>) {
  const response = (await request).data;
  if (response.code !== 0) throw new Error(response.message || "请求失败");
  return response.data;
}
export const customerDetailApi = {
  remove: (id: string) => data(adminRequest.delete(`/customers/${id}`)),
  profile: (id: string) =>
    data(
      adminRequest.get<ApiEnvelope<CustomerProfile>>(
        `/customers/${id}/profile`,
      ),
    ),
  save: (id: string, input: CustomerProfileInput) =>
    data(adminRequest.put(`/customers/${id}/profile`, input)),
  status: (id: string, status: number) =>
    data(adminRequest.post(`/customers/${id}/status`, { status })),
  records: (id: string, kind: string, page: number, active: boolean) =>
    data(
      adminRequest.get<ApiEnvelope<AdminPage<CustomerRecord>>>(
        `/customers/${id}/records/${kind}`,
        { params: { page, pageSize: 10, active } },
      ),
    ),
};
