import { adminRequest, userRequest, type ApiEnvelope } from "./request";
export interface CertificationSettings {
  enabled: boolean;
  requirePurchase: boolean;
  companyEnabled: boolean;
  companyRequiresPerson: boolean;
}
export interface CertificationInput {
  name: string;
  phone: string;
  documentType: number;
  documentNumber: string;
  front: string;
  back: string;
  companyName: string;
  companyCode: string;
  license: string;
  legalType: number;
  authorization: string;
}
export interface CertificationRecord extends CertificationInput {
  id: string;
  customerId: string;
  type: number;
  status: number;
  rejectReason: string;
  auditorId: string | null;
  auditedAt: string | null;
  createdAt: string;
}
export interface CertificationInfo {
  settings: CertificationSettings;
  status: number;
  record: CertificationRecord | null;
}
export interface CertificationAudit {
  id: string;
  operatorId: string;
  action: string;
  detail: unknown;
  createdAt: string;
}
async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>) {
  const { data } = await promise;
  if (data.code !== 0) throw new Error(data.message);
  return data.data;
}
export const certificationApi = {
  info: () =>
    unwrap(
      userRequest.get<ApiEnvelope<CertificationInfo>>("/certification/info"),
    ),
  submit: (type: "person" | "company", input: CertificationInput) =>
    unwrap(
      userRequest.post<ApiEnvelope<CertificationRecord>>(
        `/certification/${type}`,
        input,
      ),
    ),
  upload: (file: File) => {
    const data = new FormData();
    data.append("file", file);
    return unwrap(
      userRequest.post<ApiEnvelope<{ id: string; url: string }>>(
        "/certification/uploads",
        data,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },
};
export const certificationAdminApi = {
  list: (input: {
    page: number;
    pageSize: number;
    statuses: number[];
    keyword: string;
    customerId: string;
    sort: string;
  }) =>
    unwrap(
      adminRequest.post<
        ApiEnvelope<{
          items: { record: CertificationRecord; username: string }[];
          total: number;
        }>
      >("/certifications/search", input),
    ),
  detail: (id: string) =>
    unwrap(
      adminRequest.get<
        ApiEnvelope<{
          record: CertificationRecord;
          audits: CertificationAudit[];
        }>
      >(`/certifications/${id}`),
    ),
  review: (id: string, action: "pass" | "reject" | "unlock", reason: string) =>
    unwrap(adminRequest.post(`/certifications/${id}/${action}`, { reason })),
  settings: () =>
    unwrap(
      adminRequest.get<ApiEnvelope<CertificationSettings>>(
        "/certifications/settings",
      ),
    ),
  saveSettings: (input: CertificationSettings) =>
    unwrap(
      adminRequest.put<ApiEnvelope<CertificationSettings>>(
        "/certifications/settings",
        input,
      ),
    ),
};
export const certificationStatuses = ["未认证", "待审核", "已通过", "已拒绝"];
export const documentTypes = [
  "身份证",
  "港澳通行证",
  "台湾通行证",
  "港澳居住证",
  "台湾居住证",
  "海外护照",
  "中国以外驾照",
  "其他",
];
