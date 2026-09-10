import { adminRequest } from "./request";
import type { ApiEnvelope } from "./request";

export type UpdateTarget = "backend" | "frontend";
export type UpdateTaskStatus = "running" | "success" | "failed";

export interface UpdateChange {
  commit: string;
  feature: string;
  time: string;
}

export interface VersionInfo {
  target: UpdateTarget;
  currentVersion: string;
  remoteVersion: string;
  currentCommit: string;
  remoteCommit: string;
  branch: string;
  updatedAt: string;
  hasUpdate: boolean;
  ahead: number;
  behind: number;
  changes: UpdateChange[];
}

export interface UpdateTask {
  id: string;
  target: UpdateTarget;
  status: UpdateTaskStatus;
  progress: number;
  branch: string;
  feature: string;
  beforeCommit: string;
  targetCommit: string;
  beforeVersion: string;
  targetVersion: string;
  log: string;
  error?: string;
  rollbackStatus?: string;
  createdAt: string;
  startedAt: string;
  finishedAt?: string;
}

export interface UpdateStatus {
  backend: VersionInfo;
  frontend: VersionInfo;
  runningTask?: UpdateTask;
}

export async function getUpdateStatus(): Promise<UpdateStatus> {
  const response = await adminRequest.get<ApiEnvelope<UpdateStatus>>("/update/status");
  return response.data.data;
}

export async function checkUpdates(): Promise<UpdateStatus> {
  const response = await adminRequest.post<ApiEnvelope<UpdateStatus>>("/update/check");
  return response.data.data;
}

export async function startUpdate(target: UpdateTarget): Promise<string> {
  const response = await adminRequest.post<ApiEnvelope<{ taskId: string }>>(`/update/${target}`);
  return response.data.data.taskId;
}

export async function getUpdateTasks(): Promise<UpdateTask[]> {
  const response = await adminRequest.get<ApiEnvelope<{ items: UpdateTask[] }>>("/update/tasks", { params: { page: 1, pageSize: 50 } });
  return response.data.data.items;
}
