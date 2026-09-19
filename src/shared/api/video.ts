import { adminRequest, userRequest, type ApiEnvelope } from './request';
export interface VideoPlatform {code:string;name:string;enabled:boolean;ready:boolean;setupMessage?:string;mode:string;callbackUrl:string;officialUrl:string;notes:string;appConfigured:boolean;secretConfigured:boolean;officialId?:string;scope?:string;capability:string;event:string}
export interface VideoBinding {id:string;userId:string;platform:string;identity:string;nickname:string;status:string;verified:boolean;awarded:boolean;awardedPoints:number;boundAt:string;unboundAt?:string;reviewNotes:string}
export interface VideoConfig {enabled:boolean;mode:string;appId:string;secret:string;officialId:string;scope:string;callbackUrl:string;officialUrl:string;notes:string}
async function data<T>(p:Promise<{data:ApiEnvelope<T>}>){return (await p).data.data}
export const videoApi={
 platforms:(admin=false)=>data((admin?adminRequest:userRequest).get<ApiEnvelope<VideoPlatform[]>>('/video/platforms')),
 bindings:(admin=false,page=1)=>data((admin?adminRequest:userRequest).get<ApiEnvelope<{list:VideoBinding[];total:number}>>('/video/bindings',{params:{page}})),
 save:(code:string,input:VideoConfig)=>data(adminRequest.put(`/video/platforms/${code}`,input)),
 bind:(code:string,identity:string,nickname:string)=>data(userRequest.post(`/video/bind/${code}`,{identity,nickname})),
 authorize:(code:string)=>data(userRequest.post<ApiEnvelope<{url:string}>>(`/video/authorize/${code}`)),
 unbind:(id:string,admin=false)=>data((admin?adminRequest:userRequest).post(`/video/bindings/${id}/unbind`)),
 approve:(id:string,notes:string)=>data(adminRequest.post<ApiEnvelope<{points:number}>>(`/video/bindings/${id}/approve`,{notes})),
 check:(id:string)=>data(userRequest.post(`/video/bindings/${id}/check`)),
};
