import { adminRequest, type ApiEnvelope } from "./request";

export interface ServerMonitorSnapshot {
  sampledAt: string;
  cpu: { usedPercent: number; cores: { name: string; usedPercent: number }[]; sampleSeconds: number; load: number[] } | null;
  memory: { total: number; used: number; available: number; usedPercent: number } | null;
  disk: { total: number; used: number; available: number; usedPercent: number; partitions: { mount: string; device: string; filesystem: string; total: number; used: number; available: number; usedPercent: number }[] } | null;
  warnings: string[];
}
export async function fetchServerMonitor(signal?: AbortSignal): Promise<ServerMonitorSnapshot> {
  const { data } = await adminRequest.get<ApiEnvelope<ServerMonitorSnapshot>>("/server-monitor", { signal });
  if (data.code !== 0) throw new Error(data.message || "服务器采样失败");
  return data.data;
}
