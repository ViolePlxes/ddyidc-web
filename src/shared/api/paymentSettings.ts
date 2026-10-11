import { adminRequest, type ApiEnvelope } from "./request";
export interface PaymentConfig {
  Alipay: { Enabled: boolean; AppID: string; SellerID: string; Gateway: string; NotifyURL: string; ReturnURL: string; QuitURL: string; AppPrivateKey: string; AlipayPublicKey: string };
  Wechat: { Enabled: boolean; AppID: string; MchID: string; APIV3Key: string; PrivateKey: string; CertSerial: string; BaseURL: string; NotifyURL: string; PublicKeyID: string; PublicKey: string };
  ExpireMinutes: number; MockEnabled: boolean; EnforceSwitches: boolean;
}
export interface PaymentSettings { config: PaymentConfig; revision: string; alipayPrivateConfigured: boolean; alipayPublicConfigured: boolean; wechatPrivateConfigured: boolean; wechatApiKeyConfigured: boolean; wechatPublicConfigured: boolean; restartRequired: boolean; runningAlipayEnabled: boolean; runningWechatEnabled: boolean; reason?: string }
export const getPaymentSettings = async () => (await adminRequest.get<ApiEnvelope<PaymentSettings>>("/payment/settings")).data.data;
export const savePaymentSettings = async (input: PaymentSettings) => (await adminRequest.put<ApiEnvelope<PaymentSettings>>("/payment/settings", input)).data.data;
