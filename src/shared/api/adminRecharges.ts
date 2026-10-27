import { adminRequest, type ApiEnvelope } from './request';
export interface AdminRecharge {
 id: string; rechargeNo: string; customerId: string; username: string; amount: string; bonus: string; channel: string; status: number;
 paidAt: string | null; createdAt: string; updatedAt: string; paymentNo: string; paymentStatus: string; creditCount: number; creditedAmount: string; creditedAt: string | null;
}
export interface RechargePayment { id: string; paymentNo: string; channel: string; outTradeNo: string; transactionId: string; amount: string; status: string; paidAt: string | null; createdAt: string }
export interface RechargeCredit { id: string; txNo: string; amount: string; createdAt: string }
async function unwrap<T>(request: Promise<{data:ApiEnvelope<T>}>) { const {data}=await request; if(data.code!==0 && data.code!==200) throw new Error(data.message || '读取充值订单失败'); return data.data; }
export const adminRechargeApi = {
 list: (params: {page: number; pageSize: number; status?: string; channel?: string; keyword?: string}) => unwrap(adminRequest.get<ApiEnvelope<{items: AdminRecharge[]; total:number}>>('/recharge-orders',{params})),
 detail: (id: string) => unwrap(adminRequest.get<ApiEnvelope<{order:AdminRecharge;payments:RechargePayment[];credits:RechargeCredit[]}>>(`/recharge-orders/${encodeURIComponent(id)}`)),
};
