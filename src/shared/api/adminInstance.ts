import type { InstanceDetail, InstanceImages, InstanceMonitor, InstanceActionInput, InstanceActionResult } from './console';
import { adminRequest, type ApiEnvelope } from './request';
const unwrap = async <T>(request: Promise<{data: ApiEnvelope<T>}>) => {
  const {data}=await request;
  if(data.code!==0) throw new Error(data.message||'读取实例失败');
  return data.data;
};
export interface RenewalPriceView{baseAmount:string;amount:string;discount:string;cycle:string;mode?:string;value?:string;effectiveFrom?:string;effectiveTo?:string;reason?:string;active:boolean}
export function adminInstanceApi(customerId:string,instanceId:string) {
  const path=`/customers/${encodeURIComponent(customerId)}/instances/${encodeURIComponent(instanceId)}`;
  return {
    detail:()=>unwrap(adminRequest.get<ApiEnvelope<InstanceDetail>>(path,{timeout:30000})),
    images:()=>unwrap(adminRequest.get<ApiEnvelope<InstanceImages>>(`${path}/images`,{timeout:30000})),
    monitor:()=>unwrap(adminRequest.get<ApiEnvelope<InstanceMonitor>>(`${path}/monitor`,{timeout:30000})),
    action:(input:InstanceActionInput)=>unwrap(adminRequest.post<ApiEnvelope<InstanceActionResult>>(`${path}/action`,input,{timeout:65000})),
    remove:(input:{reason:string;confirm?:string;force?:boolean})=>unwrap(adminRequest.delete<ApiEnvelope<{deleted:boolean}>>(path,{data:input,timeout:30000})),
    renewalPrice:()=>unwrap(adminRequest.get<ApiEnvelope<RenewalPriceView>>(`${path}/renewal-price`,{timeout:30000})),
    setRenewalPrice:(input:{mode:'fixed'|'percent';value:string;reason:string;cycle?:string})=>unwrap(adminRequest.put<ApiEnvelope<RenewalPriceView>>(`${path}/renewal-price`,input,{timeout:30000})),
    clearRenewalPrice:()=>unwrap(adminRequest.delete<ApiEnvelope<{cleared:boolean}>>(`${path}/renewal-price`,{timeout:30000})),
  };
}
