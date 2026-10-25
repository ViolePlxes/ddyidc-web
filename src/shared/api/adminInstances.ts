import { adminRequest, type ApiEnvelope } from './request';

export interface ManagedInstance {
 id:string;customerId:string;productId:string;supplierId:string;orderId:string;instanceNo:string;hostname:string;productName:string;username:string;realName:string;realNameRecordId:string;renewalSyncedAt:number;renewalStale:boolean;phone:string;email:string;supplierName:string;orderNo:string;remark:string;primaryIp:string;status:number;powerStatus:string;cycle:string;renewalAmount:string|null;autoRenew:boolean;upstreamInstanceId:string;ownershipVersion:string;operatingSystem:string;createdAt:string;activatedAt:string|null;expiresAt:string|null;lastSyncedAt:string|null;ips:string[];config:{field:string;value:string}[];errorCount:number;customerMissing:boolean;
}
export interface ManagedInstancesPage {items:ManagedInstance[];total:number;page:number;pageSize:number;counts:Record<string,number>;pageRenewalSum:string;totalRenewalSum:string;missingPriceCount:number;sampledAt:string;access:{export:boolean;sync:boolean;contact:boolean}}
export interface InstanceFilterOption {id:string;name:string}
export interface InstanceSyncSelection {id:string;customerId:string;ownershipVersion:string}
export interface InstanceSyncTask {id:string;state:string;items:(InstanceSyncSelection&{state:string;message:string})[];createdAt:string;updatedAt:string}
async function unwrap<T>(request:Promise<{data:ApiEnvelope<T>}>):Promise<T>{const {data}=await request;if(data.code!==0)throw new Error(data.message||'请求失败');return data.data}
export const adminInstancesApi={
 list:(params:Record<string,string>,signal?:AbortSignal)=>unwrap(adminRequest.get<ApiEnvelope<ManagedInstancesPage>>('/instances',{params,signal,timeout:20000})),
 options:()=>unwrap(adminRequest.get<ApiEnvelope<Record<string,InstanceFilterOption[]>>>('/instances/filter-options')),
 sync:(items:InstanceSyncSelection[],requestId:string)=>unwrap(adminRequest.post<ApiEnvelope<InstanceSyncTask>>('/instances/sync',{items,requestId})),
 task:(id:string)=>unwrap(adminRequest.get<ApiEnvelope<InstanceSyncTask>>(`/instances/sync/${encodeURIComponent(id)}`)),
 export:async(params:Record<string,string>)=>{
  const response=await adminRequest.get<Blob>('/instances/export',{params,responseType:'blob',timeout:35000});
  if(!String(response.headers['content-type']||'').includes('text/csv'))throw new Error('导出未成功，请刷新后重试');
  const url=URL.createObjectURL(response.data);const link=document.createElement('a');link.href=url;link.download=`产品列表-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(url);
 },
};
