import { adminRequest, type ApiEnvelope } from "./request";
import type { AuthPayload } from "../types/auth";
export interface MFAEnrollment { secret: string; uri: string; expiresAt: string }
export interface MFAChallenge { mfaRequired: true; challenge: string; enrollmentRequired: boolean; enrollment?: MFAEnrollment; expiresIn: number }
export interface MFAResult { recoveryCodes?: string[]; loginRequired?: boolean }
export interface SecurityConfig { adminPath: string; mfaEnabled: boolean; issuer: string; version: number }
export const adminSecurityApi = {
  login: async (account: string, password: string, captchaGrant = "") => (await adminRequest.post<ApiEnvelope<AuthPayload | MFAChallenge>>("/auth/login", { account, password, captchaGrant })).data.data,
  verifyLogin: async (challenge: string, code: string) => (await adminRequest.post<ApiEnvelope<AuthPayload & MFAResult>>("/auth/login/mfa", { challenge, code })).data.data,
  config: async () => (await adminRequest.get<ApiEnvelope<SecurityConfig>>("/security/config")).data.data,
  saveConfig: async (config: SecurityConfig, code: string, password: string) => (await adminRequest.put<ApiEnvelope<{ adminPath: string }>>("/security/config", { ...config, code, password })).data.data,
  status: async () => (await adminRequest.get<ApiEnvelope<{ enabled: boolean; recoveryRemaining: number }>>("/auth/mfa")).data.data,
  setup: async (password: string) => (await adminRequest.post<ApiEnvelope<MFAEnrollment>>("/auth/mfa/setup", { password })).data.data,
  manage: async (action: "confirm" | "recovery" | "disable", password: string, code: string) => (await adminRequest.post<ApiEnvelope<MFAResult>>(`/auth/mfa/${action}`, { password, code })).data.data,
};
