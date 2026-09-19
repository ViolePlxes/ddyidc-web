import { adminRequest, userRequest, type ApiEnvelope } from "./request";

export interface CdnsellStatus { enabled:boolean; phase:string; ready?:boolean; setupMessage?:string }
export interface CdnProduct { id:string; name:string; capacityBytes:number; validDays:number; price:number; tierPrices:Record<string,number>; minQty:number; maxQty:number; description:string; isHot:boolean; status:boolean; sort:number }
export interface CdnBatch { id:string; productId:string; orderId:string; originalBytes:number; consumedBytes:number; remainingBytes:number; effectiveTime:string; expireTime:string; status:string }
export interface MeterRecord { id:string; domainId:string; windowStart:string; windowEnd:string; confirmedBytes:number; revisedBytes:number; status:string; source:string }
export interface CdnOverview { remainingBytes:number; usedBytes:number; todayBytes:number; overageBytes:number; activeBatches:number; activeDomains:number; expiringAt?:string; trend:Array<{time:string;bytes:number}> }
export interface PurchaseResult { orderId:string; orderNo:string; amount:number }
export interface UpstreamAccount { id?:string; name:string; accessKey?:string; secretKey?:string; maskedAccessKey?:string; status:boolean; sort:number; lastTestTime?:string; lastTestResult?:{success:boolean;message:string} }
export interface UpstreamPackage { id?:string; accountId:string; name:string; capacityBytes:number; usedBytes:number; effectiveTime:string; expireTime:string; status:string; remark:string }
export interface Capability { id:string; apiName:string; capability:string; available:boolean|null; note:string; checkedAt?:string }
export interface AdminOverview { activeProducts:number; activeAccounts:number; customers:number; soldBytes:number; remainingBytes:number }
export interface CustomerSummary { userId:string; username:string; remainingBytes:number; usedBytes:number; activeBatches:number }
const data=<T>(r:{data:ApiEnvelope<T>})=>r.data.data;
export async function probeCdnsell(scope:"public"|"admin") { const r=await (scope==="admin"?adminRequest:userRequest).get<ApiEnvelope<CdnsellStatus>>("/cdnsell/status"); return data(r) }
export const cdnsellApi={
  overview:async()=>data(await userRequest.get<ApiEnvelope<CdnOverview>>("/cdnsell/overview")),
  products:async()=>data(await userRequest.get<ApiEnvelope<CdnProduct[]>>("/cdnsell/products")),
  purchase:async(id:string,quantity:number)=>data(await userRequest.post<ApiEnvelope<PurchaseResult>>(`/cdnsell/products/${id}/purchase`,{quantity})),
  batches:async()=>data(await userRequest.get<ApiEnvelope<CdnBatch[]>>("/cdnsell/batches")),
  usage:async()=>data(await userRequest.get<ApiEnvelope<MeterRecord[]>>("/cdnsell/usage")),
};
export const cdnsellAdminApi={
  overview:async()=>data(await adminRequest.get<ApiEnvelope<AdminOverview>>("/cdnsell/overview")),
  accounts:async()=>data(await adminRequest.get<ApiEnvelope<UpstreamAccount[]>>("/cdnsell/accounts")),
  saveAccount:async(v:UpstreamAccount)=>data(await (v.id?adminRequest.put:adminRequest.post)<ApiEnvelope<UpstreamAccount>>(v.id?`/cdnsell/accounts/${v.id}`:"/cdnsell/accounts",v)),
  deleteAccount:async(id:string)=>data(await adminRequest.delete<ApiEnvelope<{deleted:boolean}>>(`/cdnsell/accounts/${id}`)),
  testAccount:async(id:string)=>data(await adminRequest.post<ApiEnvelope<{success:boolean}>>(`/cdnsell/accounts/${id}/test`)),
  packages:async()=>data(await adminRequest.get<ApiEnvelope<UpstreamPackage[]>>("/cdnsell/packages")),
  savePackage:async(v:UpstreamPackage)=>data(await (v.id?adminRequest.put:adminRequest.post)<ApiEnvelope<UpstreamPackage>>(v.id?`/cdnsell/packages/${v.id}`:"/cdnsell/packages",v)),
  deletePackage:async(id:string)=>data(await adminRequest.delete<ApiEnvelope<{deleted:boolean}>>(`/cdnsell/packages/${id}`)),
  products:async()=>data(await adminRequest.get<ApiEnvelope<CdnProduct[]>>("/cdnsell/products")),
  saveProduct:async(v:CdnProduct)=>data(await (v.id?adminRequest.put:adminRequest.post)<ApiEnvelope<CdnProduct>>(v.id?`/cdnsell/products/${v.id}`:"/cdnsell/products",v)),
  deleteProduct:async(id:string)=>data(await adminRequest.delete<ApiEnvelope<{deleted:boolean}>>(`/cdnsell/products/${id}`)),
  capabilities:async()=>data(await adminRequest.get<ApiEnvelope<Capability[]>>("/cdnsell/capabilities")),
  customers:async()=>data(await adminRequest.get<ApiEnvelope<CustomerSummary[]>>("/cdnsell/customers")),
  adjustCustomer:async(id:string,bytes:number,validDays:number)=>data(await adminRequest.post<ApiEnvelope<{updated:boolean}>>(`/cdnsell/customers/${id}/adjust`,{bytes,validDays})),
  suspendCustomer:async(id:string)=>data(await adminRequest.post<ApiEnvelope<{updated:boolean}>>(`/cdnsell/customers/${id}/suspend`)),
  resumeCustomer:async(id:string)=>data(await adminRequest.post<ApiEnvelope<{updated:boolean}>>(`/cdnsell/customers/${id}/resume`)),
};
