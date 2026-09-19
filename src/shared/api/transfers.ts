import { adminRequest, userRequest, type ApiEnvelope } from "./request";
export interface Transfer {
 id: string; instanceId: string; fromCustomerId: string; toCustomerId: string;
 sourceOrderId: string; marketOrderId: string; source: string; status: string;
 riskFlag: string; operatorIp: string; receiverIp: string; createdAt: string; updatedAt: string;
}
export interface TransferStatus { enabled: boolean; trading?: boolean; transferring?: boolean }
export const transfersApi = {
 async status(instanceId?: string) { return (await userRequest.get<ApiEnvelope<TransferStatus>>("/transfers/status", { params: { instanceId } })).data.data; },
 async list(admin: boolean, page: number) { return (await (admin ? adminRequest : userRequest).get<ApiEnvelope<{ list: Transfer[]; total: number }>>("/transfers", { params: { page } })).data.data; },
 async create(instanceId: string, account: string, password: string) { return (await userRequest.post<ApiEnvelope<Transfer>>("/transfers", { instanceId, account, password })).data.data; },
 async decide(id: string, action: "accept" | "reject" | "cancel") { return (await userRequest.post(`/transfers/${id}/${action}`)).data; },
 async settings() { return (await adminRequest.get<ApiEnvelope<TransferStatus>>("/transfers/settings")).data.data; },
 async save(enabled: boolean) { return adminRequest.put("/transfers/settings", { enabled }); },
};
