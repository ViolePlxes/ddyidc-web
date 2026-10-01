import { adminRequest, userRequest, type ApiEnvelope } from "./request";

export interface BankTransferConfig {
  enabled: boolean;
  companyName: string;
  bankName: string;
  bankAccount: string;
  bankCode: string;
  instructions: string;
}
export const emptyBankTransfer: BankTransferConfig = { enabled: false, companyName: "", bankName: "", bankAccount: "", bankCode: "", instructions: "" };
export async function getBankTransfer() {
  return (await userRequest.get<ApiEnvelope<BankTransferConfig>>("/wallet/bank-transfer")).data.data;
}
export async function getAdminBankTransfer() {
  return (await adminRequest.get<ApiEnvelope<BankTransferConfig>>("/system/bank-transfer")).data.data;
}
export async function saveBankTransfer(config: BankTransferConfig) {
  return (await adminRequest.put<ApiEnvelope<BankTransferConfig>>("/system/bank-transfer", config)).data.data;
}
