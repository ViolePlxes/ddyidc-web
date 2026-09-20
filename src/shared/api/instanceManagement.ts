import { adminRequest, userRequest, type ApiEnvelope } from './request';
export interface RenewalOption {cycle:string;label:string;amount:string;duration:number}
export interface RenewalOrder {id:string;orderId:string;orderNo:string;amount:string;state:string}
export function instanceManagementApi(id:string,customerId?:string){
 const client=customerId?adminRequest:userRequest;
 const path=customerId?`/customers/${customerId}/instances/${id}`:`/instance/${id}`;
 async function unwrap<T>(p:Promise<{data:ApiEnvelope<T>}>){const {data}=await p;if(data.code!==0)throw new Error(data.message||'请求失败');return data.data}
 return {
  remark:(remark:string)=>unwrap(client.put(`${path}/remark`,{remark})),
  edit:(data:{upstreamInstanceId?:string;createdAt?:string;activatedAt?:string})=>unwrap(client.patch(path,data,{timeout:65000})),
  credentials:()=>unwrap<{username:string;password:string;port:string;portIsDefault?:boolean}>(client.post(`${path}/credentials`,{}, {timeout:65000})),
  options:()=>unwrap<{items:RenewalOption[]}>(client.get(`${path}/renewal-options`,{timeout:65000})),
  renew:(cycle:string)=>unwrap<RenewalOrder>(client.post(`${path}/renewals`,{cycle},{timeout:65000})),
  pay:(orderId:string)=>unwrap(client.post(`${path}/renewals/pay`,{orderId},{timeout:120000})),
  auto:(enabled:boolean)=>unwrap(client.put(`${path}/auto-renew`,{enabled},{timeout:65000})),
 };
}
