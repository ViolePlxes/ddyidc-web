import { userRequest, type ApiEnvelope } from "./request";
import type { AuthPayload } from "../types/auth";

export async function checkAccount(account: string): Promise<boolean> {
  const response = await userRequest.get<ApiEnvelope<{ available: boolean }>>(
    "/auth/check-account",
    {
      params: { account },
    },
  );
  return !response.data.data.available;
}

export async function login(
  account: string,
  password: string,
): Promise<AuthPayload> {
  const response = await userRequest.post<ApiEnvelope<AuthPayload>>("/auth/login", {
    account,
    password,
  });
  return response.data.data;
}
export async function getSession(): Promise<AuthPayload> {
  const response = await userRequest.get<ApiEnvelope<AuthPayload>>("/auth/me");
  return response.data.data;
}

export async function register(input: {
  account: string;
  password: string;
  email?: string;
  countryCode: string;
  mobile: string;
  smsCode: string;
  agreedToTerms: boolean;
  inviteCode?: string;
  salesCode?: string;
}): Promise<AuthPayload> {
  const response = await userRequest.post<ApiEnvelope<AuthPayload>>("/auth/register", input);
  if (response.data.code !== 0) throw new Error(response.data.message || "注册失败");
  return response.data.data;
}

export async function sendRegistrationSMS(input: {
  countryCode: string;
  mobile: string;
}): Promise<{ expiresIn: number }> {
  const response = await userRequest.post<
    ApiEnvelope<{ expiresIn: number; mock?: boolean }>
  >("/auth/sms/send", { ...input, scene: "register" });
  if (response.data.code !== 0) {
    throw new Error(response.data.message || "验证码发送失败");
  }
  return response.data.data;
}

export async function logout(): Promise<void> {
  await userRequest.post("/auth/logout");
}
