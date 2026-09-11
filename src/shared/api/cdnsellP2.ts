import { adminRequest, userRequest, type ApiEnvelope } from "./request";

export type BusinessType = "web" | "video" | "download";
export type AccelerateRegion = "mainland" | "overseas" | "global";
export type OriginType = "domain" | "ip";
export type OriginProtocol = "http" | "follow" | "https";
export type RefreshType = "url_refresh" | "dir_refresh" | "url_purge";

export interface DomainInput {
  domain: string;
  businessType: BusinessType;
  accelerateRegion: AccelerateRegion;
  originType: OriginType;
  originHost: string;
  originProtocol: OriginProtocol;
}

export interface CdnDomain extends DomainInput {
  id: string;
  userId: string;
  accountId: string;
  username?: string;
  ownershipStatus: "unverified" | "verified";
  ownershipMethod: "dns" | "file";
  upstreamStatus: "not_created" | "creating" | "active" | "failed" | "removing";
  cname: string;
  serviceNo: string;
  nodeStatus: string;
  syncVersion: number;
  syncTime?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DomainConfig {
  id?: string;
  domainId: string;
  module: string;
  localVersion: number;
  cloudVersion: number;
  localConfig: Record<string, unknown>;
  cloudConfig: Record<string, unknown>;
  diffFields: string[];
  diffCount: number;
  available: boolean | null;
  note: string;
  updatedAt?: string;
}

export interface CdnDomainDetail extends CdnDomain {
  checklist: { ownership: boolean; upstream: boolean; certificate: boolean; configuration: boolean };
  configs: DomainConfig[];
}

export interface OwnershipChallenge {
  id: string;
  domainId: string;
  method: "dns" | "file";
  dnsName?: string;
  fileUrl?: string;
  token?: string;
  status: "unverified" | "verified";
  lastError?: string;
  verifiedAt?: string;
}

export interface ConfigTask {
  id: string;
  taskNo: string;
  domainId: string;
  module: string;
  version: number;
  status: "pending" | "running" | "success" | "failed" | "terminated";
  error?: string;
  attempts: number;
  maxAttempts: number;
  requestId?: string;
  operatorType: "member" | "admin";
  operatorId: string;
  createdAt: string;
  finishedAt?: string;
}

export interface AsyncTask {
  id?: string;
  taskNo?: string;
  taskType: string;
  bizId: string;
  status: string;
  error?: string;
}

export interface CdnCertificate {
  id: string;
  domainId: string;
  domain?: string;
  name: string;
  fingerprint: string;
  notBefore: string;
  notAfter: string;
  deployStatus: "undepolyed" | "pending" | "deployed" | "failed";
  createdAt: string;
}

export interface RefreshTask {
  id: string;
  taskNo: string;
  domainId: string;
  domain?: string;
  type: RefreshType;
  urls: string[];
  status: "pending" | "running" | "success" | "failed";
  progress: { percent?: number; cloudStatus?: string };
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface LogDownload { domainId: string; start: string; end: string; name: string; url: string; size: number }
export interface IPCheckResult { ip: string; isCdn: boolean; cdnIp?: string; isp?: string; region?: string; province?: string; city?: string }

const data = <T>(response: { data: ApiEnvelope<T> }) => response.data.data;

export const cdnsellP2Api = {
  domains: async () => data(await userRequest.get<ApiEnvelope<CdnDomain[]>>("/cdnsell/domains")),
  domain: async (id: string) => data(await userRequest.get<ApiEnvelope<CdnDomainDetail>>(`/cdnsell/domains/${id}`)),
  createDomain: async (input: DomainInput) => data(await userRequest.post<ApiEnvelope<CdnDomain>>("/cdnsell/domains", input)),
  deleteDomain: async (id: string) => data(await userRequest.delete<ApiEnvelope<AsyncTask>>(`/cdnsell/domains/${id}`)),
  ownershipStart: async (id: string, method: "dns" | "file") => data(await userRequest.post<ApiEnvelope<OwnershipChallenge>>(`/cdnsell/domains/${id}/ownership-verify`, { method })),
  ownershipStatus: async (id: string) => data(await userRequest.get<ApiEnvelope<OwnershipChallenge>>(`/cdnsell/domains/${id}/ownership-status`)),
  setDomainEnabled: async (id: string, enabled: boolean) => data(await userRequest.post<ApiEnvelope<AsyncTask>>(`/cdnsell/domains/${id}/${enabled ? "enable" : "disable"}`)),
  syncDomain: async (id: string) => data(await userRequest.get<ApiEnvelope<AsyncTask>>(`/cdnsell/domains/${id}/sync`)),
  config: async (id: string, module?: string) => data(await userRequest.get<ApiEnvelope<DomainConfig[]>>(`/cdnsell/domains/${id}/config`, { params: module ? { module } : undefined })),
  saveConfig: async (id: string, module: string, config: Record<string, unknown>) => data(await userRequest.post<ApiEnvelope<ConfigTask>>(`/cdnsell/domains/${id}/config`, { module, config })),
  configTasks: async (id: string) => data(await userRequest.get<ApiEnvelope<ConfigTask[]>>(`/cdnsell/domains/${id}/config-tasks`)),
  certificates: async () => data(await userRequest.get<ApiEnvelope<CdnCertificate[]>>("/cdnsell/certs")),
  uploadCertificate: async (input: { domainId: string; name: string; cert: string; key: string }) => data(await userRequest.post<ApiEnvelope<CdnCertificate>>("/cdnsell/certs", input)),
  deployCertificate: async (id: string) => data(await userRequest.post<ApiEnvelope<AsyncTask>>(`/cdnsell/certs/${id}/deploy`)),
  deleteCertificate: async (id: string) => data(await userRequest.delete<ApiEnvelope<{ deleted: boolean }>>(`/cdnsell/certs/${id}`)),
  refresh: async (type: RefreshType, urls: string[]) => data(await userRequest.post<ApiEnvelope<RefreshTask>>("/cdnsell/refresh", { type, urls })),
  refreshTasks: async () => data(await userRequest.get<ApiEnvelope<RefreshTask[]>>("/cdnsell/refresh")),
  logs: async (domainId: string, start: string, end: string) => data(await userRequest.get<ApiEnvelope<LogDownload[]>>("/cdnsell/log-download", { params: { domainId, start, end } })),
  ipCheck: async (ip: string) => data(await userRequest.post<ApiEnvelope<IPCheckResult>>("/cdnsell/ip-check", { ip })),
};

export const cdnsellP2AdminApi = {
  domains: async (keyword = "") => data(await adminRequest.get<ApiEnvelope<CdnDomain[]>>("/cdnsell/domains", { params: keyword ? { keyword } : undefined })),
  syncDomain: async (id: string) => data(await adminRequest.post<ApiEnvelope<AsyncTask>>(`/cdnsell/domains/${id}/sync`)),
  config: async (id: string, module?: string) => data(await adminRequest.get<ApiEnvelope<DomainConfig[]>>(`/cdnsell/domains/${id}/config`, { params: module ? { module } : undefined })),
  saveConfig: async (id: string, module: string, config: Record<string, unknown>) => data(await adminRequest.post<ApiEnvelope<ConfigTask>>(`/cdnsell/domains/${id}/config`, { module, config })),
  configTasks: async (id: string) => data(await adminRequest.get<ApiEnvelope<ConfigTask[]>>(`/cdnsell/domains/${id}/config-tasks`)),
};
