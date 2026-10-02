import { userRequest, adminRequest, type ApiEnvelope } from "./request";
import type { AuthPayload } from "../types/auth";
import { saveRefreshSession, type RefreshPayload } from "./refreshSession";
export type SocialProvider = "github" | "qq";
export interface SocialConfig { provider: SocialProvider; appId: string; callbackUrl: string; enabled: boolean; hasSecret: boolean; revision: number }
export interface SocialBinding { provider: SocialProvider; nickname: string; avatar: string; createdAt: string }
export async function startSocialLogin(provider: SocialProvider, rememberMe = false, mode: "login" | "bind" = "login", password = "") {
  const response = await userRequest.post<ApiEnvelope<{ url: string }>>(`/auth/social/${provider}/start`, { mode, rememberMe, password }, { headers: { "X-Social-Request": "1" } });
  window.location.assign(response.data.data.url);
}
export type SocialCompletion = AuthPayload | { accountChoiceRequired: true };
export async function completeSocialLogin(): Promise<SocialCompletion> {
  const response = await userRequest.post<ApiEnvelope<SocialCompletion>>("/auth/social/complete", {}, { headers: { "X-Social-Request": "1" } });
  const payload = response.data.data;
  if (!("accountChoiceRequired" in payload)) saveRefreshSession(payload as AuthPayload & RefreshPayload, payload.rememberMe === true);
  return payload;
}
export async function chooseSocialAccount(input: { mode: "bind" | "register"; countryCode: string; mobile: string; password: string; smsCode?: string; agreedToTerms?: boolean }): Promise<AuthPayload> {
  const response = await userRequest.post<ApiEnvelope<AuthPayload>>("/auth/social/resolve", input, { headers: { "X-Social-Request": "1" } });
  const payload = response.data.data;
  saveRefreshSession(payload as AuthPayload & RefreshPayload, payload.rememberMe === true);
  return payload;
}
export const socialAuthApi = {
  configs: async () => (await adminRequest.get<ApiEnvelope<SocialConfig[]>>("/social-login")).data.data,
  saveConfig: async (provider: SocialProvider, input: Omit<SocialConfig, "provider" | "hasSecret"> & { secret: string; clearSecret: boolean }) => (await adminRequest.put<ApiEnvelope<SocialConfig>>(`/social-login/${provider}`, input)).data.data,
  bindings: async () => (await userRequest.get<ApiEnvelope<SocialBinding[]>>("/auth/social/bindings")).data.data,
  unbind: async (provider: SocialProvider, password: string) => { await userRequest.delete(`/auth/social/${provider}/binding`, { data: { password } }); },
  profile: async () => (await userRequest.get<ApiEnvelope<{ initialPasswordRequired: boolean }>>("/auth/social/profile")).data.data,
};
