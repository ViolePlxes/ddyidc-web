import { neutralCustomerResponse, neutralCustomerText } from "../utils/customerCopy";
import axios, { AxiosError } from "axios";

export interface ApiEnvelope<T> {
  code: number;
  data: T;
  message?: string;
}

function createRequest(baseURL: string, unauthorizedEvent: string, customerFacing = false) {
  const client = axios.create({
    baseURL,
    timeout: 15_000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
  client.interceptors.response.use(
    (response) => { if (customerFacing) response.data = neutralCustomerResponse(response.data); return response; },
    (error: AxiosError<ApiEnvelope<unknown>>) => {
      if (customerFacing && error.response) error.response.data = neutralCustomerResponse(error.response.data);
      if (
        error.response?.status === 401 &&
        !error.config?.url?.includes("/auth/login")
      ) {
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
);
export const salesRequest = createRequest(
  "/admin/v1",
  "ddyidc:sales-unauthorized",
  true,
);

export function getApiMessage(error: unknown): string {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    const message = error.response?.data?.message ?? error.message;
    return window.location.pathname.startsWith("/admin") ? message : neutralCustomerText(message);
  }
  const message = error instanceof Error ? error.message : "请求失败，请稍后重试";
  return window.location.pathname.startsWith("/admin") ? message : neutralCustomerText(message);
}
