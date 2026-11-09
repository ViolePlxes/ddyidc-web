import { adminRequest, userRequest, type ApiEnvelope } from "./request";

export type VisitRangeKey = "today" | "7d" | "30d";
export type VisitIdentity = "all" | "customer" | "admin" | "guest";
export type VisitClientKind = "all" | "browser" | "bot" | "api";
export type VisitDimension = "source" | "client" | "page" | "identity";

export interface VisitWindow {
  from: string;
  to: string;
}

export interface VisitTrendPoint {
  time: string;
  requests: number;
  visitors: number;
  errors: number;
}

export interface VisitCollectionState {
  enabled: boolean;
  accepted: number;
  written: number;
  dropped: number;
  sampledOut: number;
  writeFailures: number;
  queueDepth: number;
  queueCapacity: number;
  geo: { loaded: boolean; path: string; format: string };
  retentionDays: number;
  apiSamplePct: number;
  pageSamplePct: number;
}

export interface VisitOverview {
  requests: number;
  visitors: number;
  errors: number;
  trend: VisitTrendPoint[];
  from: string;
  to: string;
  days: number;
  collection?: VisitCollectionState;
}

export interface VisitFlowRow {
  source: string;
  client: string;
  page: string;
  identity: string;
  clientKind: string;
  requests: number;
  visitors: number;
}

export interface VisitGeographyRow {
  country: string;
  region: string;
  city: string;
  requests: number;
}

export interface VisitClientRow {
  browser: string;
  os: string;
  device: string;
  isBot: boolean;
  requests: number;
  visitors: number;
}

export interface VisitStatusRow {
  status: string;
  requests: number;
  ratio: number;
}

export interface VisitTrafficRow {
  label: string;
  requests: number;
  ratio: number;
  visitors: number;
}

/** Local calendar dates: the API compares plain YYYY-MM-DD days. */
export function formatLocalDay(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function visitRangeDates(key: VisitRangeKey, now = new Date()): VisitWindow {
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = key === "today" ? 1 : key === "7d" ? 7 : 30;
  const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - (days - 1));
  return { from: formatLocalDay(from), to: formatLocalDay(to) };
}

function unwrap<T>(envelope: ApiEnvelope<T>, fallback: string): T {
  if (envelope.code !== 0) throw new Error(envelope.message || fallback);
  return envelope.data;
}

export const visitAnalyticsApi = {
  overview: async (window: VisitWindow, identity: VisitIdentity, client: VisitClientKind, signal?: AbortSignal): Promise<VisitOverview> => {
    const { data } = await adminRequest.get<ApiEnvelope<VisitOverview>>("/visit-analytics/overview", {
      params: { from: window.from, to: window.to, identity, client },
      signal,
    });
    return unwrap(data, "访问统计读取失败");
  },
  flow: async (window: VisitWindow, signal?: AbortSignal): Promise<VisitFlowRow[]> => {
    const { data } = await adminRequest.get<ApiEnvelope<{ rows: VisitFlowRow[] }>>("/visit-analytics/flow", {
      params: { from: window.from, to: window.to },
      signal,
    });
    return unwrap(data, "访问流向读取失败").rows;
  },
  geography: async (window: VisitWindow, signal?: AbortSignal): Promise<VisitGeographyRow[]> => {
    const { data } = await adminRequest.get<ApiEnvelope<{ regions: VisitGeographyRow[] }>>("/visit-analytics/geography", {
      params: { from: window.from, to: window.to },
      signal,
    });
    return unwrap(data, "访问地域读取失败").regions;
  },
  clients: async (window: VisitWindow, signal?: AbortSignal): Promise<VisitClientRow[]> => {
    const { data } = await adminRequest.get<ApiEnvelope<{ rows: VisitClientRow[] }>>("/visit-analytics/clients", {
      params: { from: window.from, to: window.to },
      signal,
    });
    return unwrap(data, "客户端排行读取失败").rows;
  },
  status: async (window: VisitWindow, signal?: AbortSignal): Promise<VisitStatusRow[]> => {
    const { data } = await adminRequest.get<ApiEnvelope<{ rows: VisitStatusRow[] }>>("/visit-analytics/status", {
      params: { from: window.from, to: window.to },
      signal,
    });
    return unwrap(data, "状态码排行读取失败").rows;
  },
};

export interface VisitBeaconPayload {
  path: string;
  referrer?: string;
  title?: string;
  utm?: string;
}

/**
 * Report a client-side page view. The SPA shell is served by the web server, so
 * only the browser can describe a page visit. Failures stay silent: analytics
 * must never disturb navigation.
 */
export function sendVisitBeacon(payload: VisitBeaconPayload): void {
  void userRequest.post("/visit/collect", payload, { timeout: 5_000 }).catch(() => undefined);
}
