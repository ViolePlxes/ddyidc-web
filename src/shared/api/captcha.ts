import { adminRequest, salesRequest, userRequest, type ApiEnvelope } from "./request";
export type CaptchaScene = "user_login" | "admin_login" | "sales_login";
export interface CaptchaState { enabled: boolean; required: boolean; configured: boolean; provider: string; siteId?: string; challenge?: string; expiresIn?: number }
export interface CaptchaConfig { enabled: boolean; provider: string; siteId: string; secretConfigured: boolean; version: number }
function endpoint(scene: CaptchaScene) {
 return scene === "user_login" ? { client: userRequest, path: "/auth/captcha" } : scene === "admin_login" ? { client: adminRequest, path: "/auth/captcha" } : { client: salesRequest, path: "/sales/auth/captcha" };
}
export const captchaApi = {
 status: async (scene: CaptchaScene) => { const {client,path}=endpoint(scene); return (await client.get<ApiEnvelope<CaptchaState>>(path)).data.data; },
 begin: async (scene: CaptchaScene) => { const {client,path}=endpoint(scene); return (await client.post<ApiEnvelope<CaptchaState>>(path+"/challenge",{})).data.data; },
 verify: async (scene: CaptchaScene, challenge: string, proof: Record<string,string>) => { const {client,path}=endpoint(scene); return (await client.post<ApiEnvelope<{grant:string;expiresIn:number}>>(path+"/verify",{challenge,proof})).data.data; },
 config: async () => (await adminRequest.get<ApiEnvelope<CaptchaConfig>>("/security/captcha")).data.data,
 save: async (config: CaptchaConfig,secret:string,clearSecret:boolean,password:string,code:string) => (await adminRequest.put<ApiEnvelope<null>>("/security/captcha",{enabled:config.enabled,provider:config.provider,siteId:config.siteId,version:config.version,secret,clearSecret,password,code})).data.data,
};
