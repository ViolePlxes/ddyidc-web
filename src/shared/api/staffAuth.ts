import type { AuthPayload } from "../types/auth";
import { adminRequest, salesRequest, type ApiEnvelope } from "./request";

async function loginWith(
  endpoint: string,
  account: string,
  password: string,
  sales = false,
  captchaGrant = "",
): Promise<AuthPayload> {
  const client = sales ? salesRequest : adminRequest;
  const response = await client.post<ApiEnvelope<AuthPayload>>(endpoint, {
    account,
    password,
    captchaGrant,
  });
  return response.data.data;
}

export const adminAuthApi = {
  login: (account: string, password: string, captchaGrant = "") =>
    loginWith("/auth/login", account, password, false, captchaGrant),
  getSession: async () =>
    (await adminRequest.get<ApiEnvelope<AuthPayload>>("/auth/me")).data.data,
  logout: async () => {
    await adminRequest.post("/auth/logout");
  },
};

export const salesAuthApi = {
  login: (account: string, password: string, captchaGrant = "") =>
    loginWith("/sales/auth/login", account, password, true, captchaGrant),
  getSession: async () =>
    (await salesRequest.get<ApiEnvelope<AuthPayload>>("/sales/auth/me")).data
      .data,
  logout: async () => {
    await salesRequest.post("/sales/auth/logout");
  },
};
