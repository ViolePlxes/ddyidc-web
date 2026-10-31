import { adminRequest } from "./request";

export interface NoticeReview { id: string; customerId: string; status: string; attempts: number; nextAttempt: string }
export async function getNoticeReviews(): Promise<NoticeReview[]> {
  return (await adminRequest.get<ApiEnvelope<NoticeReview[]>>("/system/notify/reviews")).data.data;
}
export async function reviewNotice(row: NoticeReview, action: "retry" | "resolve", reason: string): Promise<void> {
  await adminRequest.post(`/system/notify/reviews/${row.id}`, { action, reason, status: row.status, attempts: row.attempts, acknowledge: action === "retry" });
}

export type NotifyChannel = "sms" | "email" | "both";

export interface NotifyConfig {
  mock: boolean;
  mail: {
    host: string;
    port: number;
    username: string;
    password: string;
    fromName: string;
    mock: boolean;
  };
  sms: {
    accessKey: string;
    accessSecret: string;
    signName: string;
    templates: Record<string, string>;
    mock: boolean;
  };
  expiry: { enabled: boolean; daysBefore: number };
}

export interface NotificationTemplate {
  id: string;
  scene: string;
  channel: NotifyChannel;
  title: string;
  content: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotifyLog {
  id: string;
  scene: string;
  channel: Exclude<NotifyChannel, "both">;
  target: string;
  templateId?: string;
  contentSnapshot: string;
  status: "success" | "failed" | "submitted" | "unknown" | "pending" | "delivered" | "delivery_failed" | "receipt_pending" | "receipt_unknown";
  error?: string;
  requestId?: string;
  businessId?: string;
  createdAt: string;
}

interface ApiEnvelope<T> { code: number; data: T; message?: string }

export interface DigestTask { id: string; customerId: string; notifyDate: string; channel: string; status: string; count: number; earliestExpiry?: string; scheduledAt: string; createdAt: string; updatedAt: string; attempts: number; target: string; error: string; requestId: string; contentSnapshot?: string; version: number }
export interface DigestTaskGroup { customerId: string; realName: string; notifyDate: string; channels: DigestTask[] }
export interface DigestSummary { settings: { enabled: boolean; dispatchEnabled: boolean; allCustomers: boolean; customerId: string }; counts: {status: string; count: number}[]; scan: {startedAt?: string; finishedAt?: string; nextScanAt?: string; scanned: number; generated: number; error: string}; emailReady: boolean; smsReady: boolean; smsTemplateCode: string; smsApplication: string }
export interface DigestDetail { task: DigestTask; channels: DigestTask[]; quotaReserved: boolean; items: {id: string; instanceId: string; instanceNo: string; productName: string; primaryIp: string; expiresAt: string; status: string; reason: string}[]; attempts: {id: string; status: string; requestId: string; error: string; notes: string; adminId: string; createdAt: string}[] }
export const digestAdmin = {
  diagnostics: async () => (await adminRequest.post<ApiEnvelope<{checkedAt: string}>>("/system/notify/diagnostics")).data.data,
  retry: async (task: DigestTask, reason: string) => { await adminRequest.post(`/system/notify/tasks/${task.id}/retry`, {version: task.version, reason}); },
  summary: async () => (await adminRequest.get<ApiEnvelope<DigestSummary>>("/system/notify/task-summary")).data.data,
  tasks: async (params: Record<string, string | number>) => (await adminRequest.get<ApiEnvelope<{items: DigestTaskGroup[]; total: number; pageSize: number}>>("/system/notify/tasks", {params: {...params, grouped: "true"}})).data.data,
  detail: async (id: string) => (await adminRequest.get<ApiEnvelope<DigestDetail>>(`/system/notify/tasks/${id}`)).data.data,
  settings: async (enabled: boolean, dispatchEnabled: boolean, reason: string) => { await adminRequest.put("/system/notify/digest-settings", {enabled, dispatchEnabled, reason}); },
  applySMS: async (reason: string) => { await adminRequest.post("/system/notify/sms-template/apply", {reason}); },
  checkSMS: async () => { await adminRequest.post("/system/notify/sms-template/check"); },
  resolve: async (task: DigestTask, result: string, reason: string, requestId: string) => { await adminRequest.post(`/system/notify/tasks/${task.id}/resolve`, {version: task.version, result, reason, requestId}); },
};

export async function getNotifyConfig(): Promise<NotifyConfig> {
  const response = await adminRequest.get<ApiEnvelope<NotifyConfig>>("/system/notify/config");
  return response.data.data;
}

export async function saveNotifyConfig(input: Omit<NotifyConfig, "mock">): Promise<NotifyConfig> {
  const response = await adminRequest.put<ApiEnvelope<NotifyConfig>>("/system/notify/config", input);
  return response.data.data;
}

export async function getNotificationTemplates(): Promise<NotificationTemplate[]> {
  const response = await adminRequest.get<ApiEnvelope<{ items: NotificationTemplate[] }>>("/system/notify/templates");
  return response.data.data.items;
}

export async function updateNotificationTemplate(template: NotificationTemplate): Promise<void> {
  await adminRequest.put(`/system/notify/templates/${template.id}`, {
    title: template.title,
    content: template.content,
    channel: template.channel,
    enabled: template.enabled,
  });
}

export async function getNotifyLogs(): Promise<NotifyLog[]> {
  const response = await adminRequest.get<ApiEnvelope<{ items: NotifyLog[] }>>("/system/notify/logs", { params: { page: 1, pageSize: 50 } });
  return response.data.data.items;
}

export async function sendTestNotification(scene: string, target: string, params: Record<string, string>): Promise<void> {
  await adminRequest.post("/system/notify/test", { scene, target, params });
}
