import { adminRequest, userRequest, type ApiEnvelope } from './request';
export interface InboxMessage {id:string;type:string;scene:string;title:string;summary:string;content:string;businessType:string;businessId:string;createdAt:string;createdRevision:string;readAt:string|null}
export interface MessageSync {enabled:boolean;revision:string;nextCursor:string;unreadCount:number;items:InboxMessage[];changes:{revision:string;kind:string;messageId?:string}[];hasMore:boolean;resetRequired:boolean;snapshotToken:string;marketingToastEnabled:boolean}
export interface MessagePage {items:InboxMessage[];total:number;snapshotToken:string;unreadCount:number}
const data=<T>(v:{data:ApiEnvelope<T>})=>{if(v.data.code!==0)throw new Error(v.data.message||'操作失败');return v.data.data};
export const notificationsApi={
 readTicket:(ticketId:string,lastReplyId:string)=>userRequest.post('/notifications/read-ticket',{ticketId,lastReplyId}).then(data),
 sync:(signal?:AbortSignal)=>userRequest.get<ApiEnvelope<MessageSync>>('/notifications/sync',{signal}).then(data),
 list:(params:Record<string,string|number>,signal?:AbortSignal)=>userRequest.get<ApiEnvelope<MessagePage>>('/notifications',{params,signal}).then(data),
 detail:(id:string)=>userRequest.get<ApiEnvelope<InboxMessage>>(`/notifications/${encodeURIComponent(id)}`).then(data),
 read:(ids:string[])=>userRequest.post('/notifications/read',{ids}).then(data),
 readAll:(snapshotToken:string)=>userRequest.post('/notifications/read-all',{snapshotToken}).then(data),
 delete:(id:string)=>userRequest.delete(`/notifications/${encodeURIComponent(id)}`).then(data),
 preferences:(marketingToastEnabled:boolean)=>userRequest.put('/notifications/preferences',{marketingToastEnabled}).then(data),
};
export interface BroadcastInput {requestId:string;title:string;summary:string;content:string;all:boolean;recipients:number[];reason:string;previewToken:string;confirm:boolean}
export interface BroadcastJob {id:string;title:string;summary:string;content:string;status:string;total:number;succeeded:number;failed:number;skipped:number;createdAt:string}
export const broadcastApi={
 status:()=>adminRequest.get<ApiEnvelope<{inappEnabled:boolean;connections:number;pending:number;dead:number;pushPending:number}>>('/notifications/status').then(data),
 retryOutbox:(reason:string)=>adminRequest.post('/notifications/outbox/retry',{reason}).then(data),
 detail:(id:string)=>adminRequest.get<ApiEnvelope<BroadcastJob>>(`/notifications/broadcasts/${id}`).then(data),
 settings:()=>adminRequest.get<ApiEnvelope<{inappEnabled:boolean;broadcastEnabled:boolean}>>('/notifications/settings').then(data),
 saveSettings:(inappEnabled:boolean,broadcastEnabled:boolean,reason:string)=>adminRequest.put('/notifications/settings',{inappEnabled,broadcastEnabled,reason}).then(data),
 permissions:()=>adminRequest.get<ApiEnvelope<Record<string,boolean>>>('/notifications/permissions').then(data),
 list:(page=1)=>adminRequest.get<ApiEnvelope<{items:BroadcastJob[];total:number}>>('/notifications/broadcasts',{params:{page}}).then(data),
 preview:(input:BroadcastInput)=>adminRequest.post<ApiEnvelope<{total:number;previewToken:string}>>('/notifications/broadcasts/preview',input).then(data),
 create:(input:BroadcastInput)=>adminRequest.post<ApiEnvelope<BroadcastJob>>('/notifications/broadcasts',input).then(data),
 action:(id:string,action:'retry'|'cancel',reason:string)=>adminRequest.post(`/notifications/broadcasts/${id}/${action}`,{reason}).then(data),
};
export const messageTypes=[{value:'',label:'全部类型'},{value:'ticket',label:'工单回复'},{value:'expiry',label:'续费到期'},{value:'instance',label:'实例状态'},{value:'security',label:'安全告警'},{value:'billing',label:'订单与账单'},{value:'marketing',label:'优惠活动'}];
export function messageTarget(m:InboxMessage){if(!/^\d{1,20}$/.test(m.businessId))return '';switch(m.businessType){case 'ticket':return `/console/tickets/${m.businessId}`;case 'instance':return `/user/instance/${m.businessId}.htm`;case 'order':return `/console/orders/${m.businessId}`;case 'bill':return '/console/transactions';default:return ''}}
