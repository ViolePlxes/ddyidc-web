import { adminPath, adminNavigationResponse } from "../utils/adminEntry";
import { neutralCustomerResponse, neutralCustomerText } from "../utils/customerCopy";
import axios, { AxiosError } from "axios";
import { adminBase } from "../utils/adminEntry";
import { renewUserSession, refreshSessionAvailable } from "./refreshSession";

export interface ApiEnvelope<T> {
  code: number;
  data: T;
  message?: string;
}

function createRequest(baseURL: string, unauthorizedEvent: string, customerFacing = false, csrfKind: "user" | "admin" | "sales" = "user") {
  const client = axios.create({
    baseURL,
    timeout: 15_000,
    withCredentials: true,
    xsrfCookieName: `ddyidc_csrf_${csrfKind}`,
    xsrfHeaderName: "X-CSRF-Token",
    headers: { "Content-Type": "application/json" },
  });
  if(csrfKind === "admin") client.interceptors.request.use(config => { config.headers.set("X-Admin-Entry", adminBase); return config; });
  client.interceptors.response.use(
    (response) => { if (customerFacing) response.data = neutralCustomerResponse(response.data); if(csrfKind === "admin") response.data=adminNavigationResponse(response.data); return response; },
    async (error: AxiosError<ApiEnvelope<unknown>>) => {
      if (customerFacing && error.response) error.response.data = neutralCustomerResponse(error.response.data);
      if (
        error.response?.status === 401 &&
        !error.config?.url?.includes("/auth/login")
      ) {
        const config = error.config as (typeof error.config & { sessionRetried?: boolean });
        if (csrfKind === "user" && config && !config.sessionRetried && !config.url?.includes("/auth/register") && !config.url?.includes("/auth/reset-password") && refreshSessionAvailable()) {
          config.sessionRetried = true;
          try {
            await renewUserSession();
            // Axios must re-read the newly signed CSRF cookie on replay.
            config.headers.delete("X-CSRF-Token");
          } catch (refreshError) {
            if (!axios.isAxiosError(refreshError) || refreshError.response?.status === 401) {
              window.dispatchEvent(new CustomEvent(unauthorizedEvent));
            }
            return Promise.reject(refreshError);
          }
          return client.request(config);
        }
        window.dispatchEvent(new CustomEvent(unauthorizedEvent));
      }
      return Promise.reject(error);
    },
  );
  return client;
}

export const userRequest = createRequest(
  "/api/v1",
  "ddyidc:user-unauthorized",
  true,
);
export const adminRequest = createRequest(
  "/admin/v1",
  "ddyidc:admin-unauthorized",
  false,
  "admin",
);
export const salesRequest = createRequest(
  "/admin/v1",
  "ddyidc:sales-unauthorized",
  true,
  "sales",
);

export function getApiMessage(error: unknown): string {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.message ?? error.message;
    return window.location.pathname.startsWith(adminPath('/admin')) ? message : neutralCustomerText(message);
  }
  const message = error instanceof Error ? error.message : "请求失败，请稍后重试";
  return window.location.pathname.startsWith(adminPath('/admin')) ? message : neutralCustomerText(message);
}
