import type { InstanceDetail, InstanceImages, InstanceMonitor, InstanceActionInput, InstanceActionResult } from './console';
import { adminRequest, type ApiEnvelope } from './request';
const unwrap = async <T>(request: Promise<{data: ApiEnvelope<T>}>) => {
  const {data}=await request;
  if(data.code!==0) throw new Error(data.message||'读取实例失败');
  return data.data;
};
export function adminInstanceApi(customerId:string,instanceId:string) {
  const path=`/customers/${encodeURIComponent(customerId)}/instances/${encodeURIComponent(instanceId)}`;
  return {
    detail:()=>unwrap(adminRequest.get<ApiEnvelope<InstanceDetail>>(path,{timeout:30000})),
    images:()=>unwrap(adminRequest.get<ApiEnvelope<InstanceImages>>(`${path}/images`,{timeout:30000})),
    monitor:()=>unwrap(adminRequest.get<ApiEnvelope<InstanceMonitor>>(`${path}/monitor`,{timeout:30000})),
    action:(input:InstanceActionInput)=>unwrap(adminRequest.post<ApiEnvelope<InstanceActionResult>>(`${path}/action`,input,{timeout:65000})),
  };
}
