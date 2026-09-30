import { userRequest, type ApiEnvelope } from "./request";
import type { AuthPayload } from "../types/auth";
import { clearRefreshSession, saveRefreshSession, rememberRefreshProfile } from "./refreshSession";

export async function login(
  account: string,
  password: string,
  rememberMe = false,
): Promise<AuthPayload> {
  const response = await userRequest.post<ApiEnvelope<AuthPayload>>("/auth/login", {
    account,
    password,
    rememberMe,
  });
  const payload = response.data.data;
  if (payload.refresh_token) saveRefreshSession(payload as Required<AuthPayload>, rememberMe);
  return payload;
}
export async function getSession(): Promise<AuthPayload> {
  const response = await userRequest.get<ApiEnvelope<AuthPayload>>("/auth/me");
  if (response.data.data.refreshable === false) clearRefreshSession();
  if (response.data.data.refreshable === true) {
    try {
      const profile = await userRequest.get<ApiEnvelope<{ user: AuthPayload["user"]; initialPasswordRequired: boolean }>>("/auth/social/profile");
      response.data.data.user.avatar = profile.data.data.user.avatar;
      response.data.data.user.initialPasswordRequired = profile.data.data.initialPasswordRequired;
      rememberRefreshProfile(response.data.data.user);
    } catch { /* Optional avatar/profile data must not invalidate the session. */ }
  }
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
  if (response.data.data.refresh_token) saveRefreshSession(response.data.data as Required<AuthPayload>, false);
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
  clearRefreshSession();
}

export interface LoginDevice { id: string; browser: string; ip: string; loginAt: string; lastActiveAt: string; current: boolean }
export async function getLoginDevices(): Promise<LoginDevice[]> {
  return (await userRequest.get<ApiEnvelope<LoginDevice[]>>("/auth/devices")).data.data;
}
export async function revokeLoginDevice(id: string): Promise<void> {
  await userRequest.delete(`/auth/devices/${encodeURIComponent(id)}`);
}
