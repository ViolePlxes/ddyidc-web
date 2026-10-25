import {adminRequest,type ApiEnvelope} from './request';
export interface CodePolicy {blockedTerms:string[];reservedCodes:string[];version:number}
export interface CodeCandidate {id:string;userId:string;code:string;pendingCode?:string;reason:string}
export interface CodeAudit {id:string;admin_id:string;action:string;user_id:string;old_code:string;new_code:string;notes:string;created_at:string}
export interface CodeGovernance {policy:CodePolicy;candidates:CodeCandidate[];audits:CodeAudit[]}
export const promoCodesApi={
 governance:async()=>(await adminRequest.get<ApiEnvelope<CodeGovernance>>('/marketing/code-governance')).data.data,
 savePolicy:async(policy:CodePolicy,reason:string)=>(await adminRequest.put<ApiEnvelope<{saved:boolean}>>('/marketing/code-governance',{policy,reason})).data.data,
 govern:async(id:string,action:string,expectedCode:string,reason:string)=>(await adminRequest.post<ApiEnvelope<{updated:boolean}>>(`/marketing/invites/${id}/govern`,{action,expectedCode,reason})).data.data,
};
