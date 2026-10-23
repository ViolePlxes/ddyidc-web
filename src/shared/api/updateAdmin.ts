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
  const response = await adminRequest.post<ApiEnvelope<UpdateStatus>>("/update/check", undefined, { timeout: 120_000 });
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

export interface ReclamationStatus {
 resources?: {resourceKey:string;taskId:number;category:string;status:string;lastError:string}[];
 configured: boolean; infrastructureReady: boolean; historicalVersions: number; alert: boolean;
 state: {status: string; attempts: number; lastError: string; finishedAt?: string; nextAttemptAt?: string; preview?: {discovered?:number;blocked?:number}; summary?: {removed?: number; blocked?: number; failed?: number; freeBytesDelta?: number;diskTotalBytes?:number;diskUsedBytes?:number;diskFreeBytes?:number;discoveredBytes?:number;protectedBytes?:number;inodeUsed?:number;inodeTotal?:number;inodeUsed?:number;inodeTotal?:number}};
}
export async function getReclamation(): Promise<ReclamationStatus> {
 const response=await adminRequest.get<ApiEnvelope<ReclamationStatus>>("/update/reclamation");return response.data.data;
}
export async function retryReclamation(): Promise<void> {await adminRequest.post("/update/reclamation/retry");}

export async function previewReclamation(): Promise<void> {await adminRequest.post("/update/reclamation/preview");}

export interface ReclamationRun {id:string;status:string;dryRun:boolean;startedAt:string;finishedAt?:string;lastError:string;summary?:{freeBytesDelta?:number;resources?:{taskId:string}[]}}
export async function getReclamationHistory(page:number):Promise<{items:ReclamationRun[];total:number}> {
 const response=await adminRequest.get<ApiEnvelope<{items:ReclamationRun[];total:number}>>("/update/reclamation/history",{params:{page}});const data=response.data.data;return {...data,items:data.items??[]};
}
