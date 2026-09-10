import type { AuthPayload } from "../types/auth";
import { adminRequest, salesRequest, type ApiEnvelope } from "./request";

async function loginWith(
  endpoint: string,
  account: string,
  password: string,
  sales = false,
): Promise<AuthPayload> {
  const client = sales ? salesRequest : adminRequest;
  const response = await client.post<ApiEnvelope<AuthPayload>>(endpoint, {
    account,
    password,
  });
  return response.data.data;
}

export const adminAuthApi = {
  login: (account: string, password: string) =>
    loginWith("/auth/login", account, password),
  getSession: async () =>
    (await adminRequest.get<ApiEnvelope<AuthPayload>>("/auth/me")).data.data,
  logout: async () => {
    await adminRequest.post("/auth/logout");
  },
};

export const salesAuthApi = {
  login: (account: string, password: string) =>
    loginWith("/sales/auth/login", account, password, true),
  getSession: async () =>
    (await salesRequest.get<ApiEnvelope<AuthPayload>>("/sales/auth/me")).data
      .data,
  logout: async () => {
    await salesRequest.post("/sales/auth/logout");
  },
};
