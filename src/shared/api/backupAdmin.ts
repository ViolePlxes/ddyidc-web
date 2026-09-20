import { adminRequest, type ApiEnvelope } from "./request";

export interface BackupConfig {
  enabled: boolean;
  endpoint: string;
  bucket: string;
  prefix: string;
  retentionDays: number;
  accessKeyMasked: string;
  secretConfigured: boolean;
}
export type BackupInput = Omit<BackupConfig, "accessKeyMasked" | "secretConfigured"> & { accessKeyId: string; accessKeySecret: string };
export interface BackupJob {
  id: string;
  kind: "manual" | "scheduled" | "restore";
  status: "queued" | "running" | "success" | "failed" | "interrupted";
  sourceId: string;
  localBytes: number;
  ossBytes: number;
  objectKey: string;
  bucket: string;
  sha256: string;
  uploaded: boolean;
  expired: boolean;
  durationMs: number;
  error: string;
  warning: string;
  createdAt: string;
  finishedAt?: string;
}
export interface BackupHistory { items: BackupJob[]; total: number; activeId: string; nextScheduledAt: string }
export const backupAdmin = {
  config: async () => (await adminRequest.get<ApiEnvelope<BackupConfig>>("/backup/config")).data.data,
  save: async (value: BackupInput) => (await adminRequest.put<ApiEnvelope<BackupConfig>>("/backup/config", value)).data.data,
  test: async () => (await adminRequest.post("/backup/test", undefined, { timeout: 30_000 })).data,
  run: async () => (await adminRequest.post<ApiEnvelope<BackupJob>>("/backup/run")).data.data,
  restore: async (id: string, confirmation: string) => (await adminRequest.post<ApiEnvelope<BackupJob>>("/backup/restore", { id, confirmation })).data.data,
  history: async (page: number) => (await adminRequest.get<ApiEnvelope<BackupHistory>>("/backup/history", { params: { page } })).data.data,
};
