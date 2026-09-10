import { adminRequest } from "./request";

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
  status: "success" | "failed";
  error?: string;
  requestId?: string;
  businessId?: string;
  createdAt: string;
}

interface ApiEnvelope<T> { code: number; data: T; message?: string }

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
