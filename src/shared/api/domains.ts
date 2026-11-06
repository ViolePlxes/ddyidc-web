import {adminRequest,userRequest,type ApiEnvelope} from './request';
export interface DomainField {key:string;label:string;required:boolean;secret?:boolean;numeric?:boolean;hidden?:boolean}
export interface DomainOperation {key:string;write:boolean;paid:boolean;scope:string;fields:DomainField[]}
export interface DomainAsset {id:string;domain:string;status:string;expiresAt?:string}
export interface DomainTemplate {id:string;label:string;status:string}
export interface DomainRecord {id:string;action:string;domain:string;status:string;errorCode?:string;createdAt:string}
export interface DomainOrder extends DomainRecord {amount:string}
export interface DomainActionResult {operationId?:string;status:string;data?:unknown}
export interface DomainQuote {id:string;domain:string;amount:string;expiresAt:string}
export interface DomainPurchase {orderId:string;orderNo:string;amount:string}
export interface DomainSettings {enabled:boolean;username:string;password?:string;passwordSet:boolean;markupBps:number;serviceFee:string;redemptionCost:string;revision:number;notes?:string}
interface ActionInput {action:string;params:Record<string,string>;requestId:string;confirmed:boolean}
const result=<T>(r:{data:ApiEnvelope<T>})=>r.data.data;
export const domainsApi={
 contracts:async()=>result(await userRequest.get<ApiEnvelope<DomainOperation[]>>('/domains/contracts')),
 assets:async()=>result(await userRequest.get<ApiEnvelope<DomainAsset[]>>('/domains/assets')),
 templates:async()=>result(await userRequest.get<ApiEnvelope<DomainTemplate[]>>('/domains/templates')),
 syncTemplates:async()=>result(await userRequest.post<ApiEnvelope<DomainTemplate[]>>('/domains/templates/sync',{})),
 records:async()=>result(await userRequest.get<ApiEnvelope<DomainRecord[]>>('/domains/operations')),
 orders:async()=>result(await userRequest.get<ApiEnvelope<DomainOrder[]>>('/domains/orders')),
 execute:async(input:ActionInput)=>result(await userRequest.post<ApiEnvelope<DomainActionResult>>('/domains/actions',input)),
 quote:async(input:ActionInput)=>result(await userRequest.post<ApiEnvelope<DomainQuote>>('/domains/quotes',input)),
 createOrder:async(quoteId:string)=>result(await userRequest.post<ApiEnvelope<DomainPurchase>>('/domains/orders',{quoteId,confirmed:true})),
 reconcile:async(orderId:string)=>result(await userRequest.post<ApiEnvelope<{updated:boolean}>>('/domains/reconcile',{orderId})),
};
export interface AdminDomainAsset extends DomainAsset {customerId:string;customerName:string;updatedAt:string}
export interface AdminDomainPage {items:AdminDomainAsset[];total:number;page:number;pageSize:number;summary:{total:number;active:number;pending:number;expired:number;expiring:number;reviewOrders:number}}
export interface AdminDomainDetail {asset:AdminDomainAsset;orders:DomainOrder[];operations:DomainRecord[]}
export const domainsAdminApi={
 assets:async(params:{keyword:string;status:string;expiry:string;page:number;pageSize:number})=>result(await adminRequest.get<ApiEnvelope<AdminDomainPage>>('/domains/assets',{params})),
 asset:async(id:string)=>result(await adminRequest.get<ApiEnvelope<AdminDomainDetail>>('/domains/asset',{params:{id}})),
 refreshAsset:async(id:string)=>result(await adminRequest.post<ApiEnvelope<{updated:boolean}>>('/domains/asset/refresh',{id,confirmed:true})),
 feed:async(action:string)=>result(await adminRequest.post<ApiEnvelope<{url:string}>>('/domains/feeds',{action})),
 settings:async()=>result(await adminRequest.get<ApiEnvelope<DomainSettings>>('/domains/settings')),
 saveSettings:async(value:DomainSettings)=>result(await adminRequest.put<ApiEnvelope<{saved:boolean}>>('/domains/settings',value)),
 orders:async()=>result(await adminRequest.get<ApiEnvelope<DomainOrder[]>>('/domains/operations')),
 importAsset:async(value:{customerId:string;domain:string;notes:string;confirmed:boolean})=>result(await adminRequest.post<ApiEnvelope<DomainAsset>>('/domains/import',value)),
};
