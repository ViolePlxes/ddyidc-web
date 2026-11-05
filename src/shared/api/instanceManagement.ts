import axios from "axios";
import type { LiveInstanceStatus } from '../components/InstanceLiveStatus';
import { adminRequest, userRequest, type ApiEnvelope } from './request';
export interface RenewalOption {cycle:string;label:string;amount:string;listAmount?:string;discount?:string;overrideId?:string;duration:number;quoteRevision:string}
export interface RenewalOrder {id:string;orderId:string;orderNo:string;amount:string;state:string}
export function instanceManagementApi(id:string,customerId?:string){
 const client=customerId?adminRequest:userRequest;
 const path=customerId?`/customers/${customerId}/instances/${id}`:`/instance/${id}`;
 async function unwrap<T>(p:Promise<{data:ApiEnvelope<T>}>){const {data}=await p;if(data.code!==0)throw new Error(data.message||'请求失败');return data.data}
 return {
  productionLockEmail:()=>unwrap<{hasEmail:boolean;emailHint:string}>(client.get(`${path}/production-lock/email`)),
  sendProductionLockEmail:(enabled:boolean,email?:string)=>unwrap<{expiresIn:number}>(client.post(`${path}/production-lock/email/send`,{enabled,email},{timeout:30000})),
  productionLock:(enabled:boolean,email:string|undefined,code:string)=>unwrap(client.put(`${path}/production-lock`,{enabled,confirmed:true,email,code})),
  status:(signal?:AbortSignal)=>unwrap<LiveInstanceStatus>(client.get(`${path}/status`,{timeout:30000,signal})),
  remark:(remark:string)=>unwrap(client.put(`${path}/remark`,{remark})),
  edit:(data:{upstreamInstanceId?:string;createdAt?:string;activatedAt?:string;productOnly?:boolean})=>unwrap(client.patch(path,data,{timeout:65000})),
  credentials:()=>unwrap<{username:string;password:string;port:string;portIsDefault?:boolean}>(client.post(`${path}/credentials`,{}, {timeout:65000})),
  options:()=>unwrap<{items:RenewalOption[];currentCycle?:string}>(client.get(`${path}/renewal-options`,{timeout:65000})),
  renew:(cycle:string,quoteRevision:string,replaceOrderId?:string)=>unwrap<RenewalOrder>(client.post(`${path}/renewals`,{cycle,quoteRevision,replaceOrderId},{timeout:65000})),
  pay:(orderId:string)=>unwrap(client.post(`${path}/renewals/pay`,{orderId},{timeout:120000})),
  auto:(enabled:boolean,quoteRevision?:string,cycle?:string)=>unwrap(client.put(`${path}/auto-renew`,{enabled,quoteRevision,cycle},{timeout:65000})),
 };
}

export interface RenewalGateError {code:string;oldOrderId?:string;oldAmount?:string;newAmount?:string}
export function renewalGateError(error:unknown):RenewalGateError|undefined {
 if(!axios.isAxiosError<ApiEnvelope<RenewalGateError>>(error))return;
 const gate=error.response?.data.data;
 if(gate && typeof gate.code==='string' && gate.code.startsWith('RENEWAL_'))return gate;
}

export interface RenewalQuoteAuditItem {orderId:string;supplier:string;cycle:string;grossAmount:string;payableAmount:string;state:string;finding:string;hasEvidence:boolean;createdAt:string;evidenceSource?:string;evidenceVerifiedAt?:string;evidenceExpiresAt?:string;snapshotAmount?:string;snapshotVerifiedAt?:string}
export async function renewalQuoteAudit(page:number,signal?:AbortSignal){
 const {data}=await adminRequest.get<ApiEnvelope<{items:RenewalQuoteAuditItem[];total:number;page:number;pageSize:number;readOnly:boolean;liveQuote:boolean}>>('/instances/renewal-quote-audit',{params:{page},signal});
 if(data.code!==0)throw new Error(data.message||'核查记录读取失败');return data.data;
}
