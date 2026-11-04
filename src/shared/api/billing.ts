import {userRequest,type ApiEnvelope} from './request';
export interface Bill {id:string;kind:'order'|'recharge'|'marketplace'|'groupbuy';sourceId:string;sourceNo:string;revision:number;paidAmount:string;historical:boolean;items?:{description:string;amount:string}[];number:string;title:string;category:string;status:string;amount:string;createdAt:string;paidAt?:string}
export interface BillPage {list:Bill[];total:number;page:number;pageSize:number}
async function unwrap<T>(request:Promise<{data:ApiEnvelope<T>}>){const {data}=await request;if(data.code!==0)throw Error(data.message||'账单读取失败');return data.data}
export const billingApi={
 list:(params:{page:number;pageSize:number;kind:string;status:string;keyword:string})=>unwrap(userRequest.get<ApiEnvelope<BillPage>>('/billing/invoices',{params})),
 detail:(_kind:Bill['kind'],id:string)=>unwrap(userRequest.get<ApiEnvelope<Bill>>(`/billing/invoices/${encodeURIComponent(id)}`)),
};
