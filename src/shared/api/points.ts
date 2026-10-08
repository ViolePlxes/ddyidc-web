import axios, { type AxiosInstance } from "axios";
import { adminRequest, userRequest, type ApiEnvelope } from "./request";

export interface PageData<T> { list: T[]; total: number; page: number; pageSize: number }
export interface PointsStatus { enabled: boolean; showMall: boolean; showSignin: boolean; showTasks: boolean; checkoutEnabled:boolean; checkoutPointsPerYuan:number; checkoutCouponDays:number }
export interface PointsAccount { userId: string; username?: string; balance: number; frozen: number; totalEarned: number; totalUsed: number; status: boolean; riskTag?: RiskTag }
export interface PointsRecord { id: string; type: "gain"|"deduct"; source: string; event: string; change: number; balanceAfter: number; remark: string; createdAt: string }
export interface Milestone { days: number; points: number }
export interface ReferralChild { userId: string; registeredAt: string; spendYuan: string; rechargeYuan: string }
export interface PointsSettings extends PointsStatus { dailyRewardLimit: number; inviteMonthlyLimit: number; checkoutDailyLimit: number; id: string; pointsExpireDays: number; refundMode: "none"|"full"|"ratio"; refundInsufficient: "cut_to_zero"|"none"; rechargeRefundDeduct: boolean; signinMode: "normal"|"choose"; signinProgressive: boolean; signinStablePoints: number; signinLuckyMin: number; signinLuckyMax: number; streakRewardEnabled: boolean; streakResetOnBreak: boolean; streakMaxMode: "keep"|"reset"; streakMilestones: Milestone[] }
export interface Signin { id: string; signinDate: string; mode: string; points: number; streak: number; createdAt: string }
export interface SigninCalendar { account: PointsAccount; currentStreak: number; monthCount: number; totalCount: number; signedDates: string[]; entries: Signin[]; settings: PointsSettings; nextMilestone?: Milestone }
export interface PointsTask { id: string; name: string; code: string; description: string; targetEvent: string; taskType: "once"|"daily"|"weekly"|"monthly"; category: "newbie"|"daily"|"growth"; points: number; targetValue: number; enabled: boolean; sort: number; progress: number; claimStatus: "progress"|"claimable"|"claimed" }
export type GoodsType = "virtual"|"physical"|"coupon"|"balance"|"system"|"card";
export interface PointsGoods { id: string; categoryId: string; name: string; type: GoodsType; image: string; description: string; pointsCost: number; stock: number; sold: number; status: boolean; config: Record<string, unknown>; isHot: boolean; sort: number }
export interface PointsCategory { id: string; parentId: string; name: string; sort: number }
export interface PointsOrder { id: string; orderNo: string; userId: string; goodsId: string; goodsName: string; goodsType: GoodsType; pointsCost: number; quantity: number; status: "pending"|"processing"|"completed"|"cancelled"; recipient: Record<string,string>; tracking: Record<string,string>; configSnapshot: Record<string,unknown>; deliveryContent?: string; createdAt: string }
export interface PointsRule { id?: string; name: string; code: string; event: string; type: "fixed"|"random"|"ratio"|"ladder"; pointsFixed: number; pointsMin: number; pointsMax: number; ratio: number; ladderConfig: unknown[]; limitType: "none"|"once"|"day"|"week"|"month"; limitValue: number; enabled: boolean }
export interface RiskTag { id?: string; name: string; level: number; color: string; description: string; isLockedDefault: boolean }
export interface RiskRule { id?: string; name: string; tagId: string; conditions: unknown[]; enabled: boolean }
export interface RiskLog { id: string; userId: string; tagIdBefore?: string; tagIdAfter?: string; source: string; operatorId?: string; remark: string; createdAt: string }
export interface PointsStats { totalEarned: number; totalUsed: number; balance: number; accounts: number; sources: Array<{source:string;points:number}> | null }

async function unwrap<T>(request: Promise<{data:ApiEnvelope<T>}>):Promise<T>{ return (await request).data.data }
const page=<T>(client:AxiosInstance,path:string,params?:Record<string,unknown>)=>unwrap(client.get<ApiEnvelope<PageData<T>>>(path,{params}));
export async function probePoints(scope:"public"|"admin"):Promise<PointsStatus|false>{try{return await unwrap((scope==="admin"?adminRequest:userRequest).get<ApiEnvelope<PointsStatus>>(scope==="admin"?"/points/settings":"/points/status"))}catch(error){if(axios.isAxiosError(error)&&error.response?.status===404)return false;throw error}}

export interface PointsActivity {id?:string; name:string; description:string; startsAt:string; endsAt:string; budgetPoints:number; awardedPoints:number; rewards:Array<{points:number;weight:number}>; enabled:boolean; claimed:boolean; claimedPoints:number}
export const pointsApi={
 activities:()=>unwrap(userRequest.get<ApiEnvelope<PointsActivity[]>>("/points/activities")),
 claimActivity:(id:string)=>unwrap(userRequest.post<ApiEnvelope<{points:number}>>(`/points/activities/${id}/claim`)),
 confirmOrder:(id:string)=>unwrap(userRequest.post<ApiEnvelope<{updated:boolean}>>(`/points/orders/${id}/confirm`)),
  checkoutCoupon:(points:number,requestId:string)=>unwrap(userRequest.post<ApiEnvelope<{points:number;userCouponId:string;amountYuan:string}>>("/points/checkout-coupon",{points,requestId})),
  activity:()=>unwrap(userRequest.post<ApiEnvelope<{updated:boolean}>>("/points/activity")),
  referrals:(page=1)=>unwrap(userRequest.get<ApiEnvelope<PageData<ReferralChild>>>("/points/referrals",{params:{page,pageSize:20}})),
  status:()=>unwrap(userRequest.get<ApiEnvelope<PointsStatus>>("/points/status")),
  account:()=>unwrap(userRequest.get<ApiEnvelope<PointsAccount>>("/points/account")),
  records:(params?:Record<string,unknown>)=>page<PointsRecord>(userRequest,"/points/records",params),
  calendar:(month?:string)=>unwrap(userRequest.get<ApiEnvelope<SigninCalendar>>("/points/signin/calendar",{params:{month}})),
  signin:(mode:string)=>unwrap(userRequest.post<ApiEnvelope<Signin>>("/points/signin",{mode})),
  tasks:(category="all")=>unwrap(userRequest.get<ApiEnvelope<PointsTask[]>>("/points/tasks",{params:{category}})),
  claimTask:(id:string)=>unwrap(userRequest.post<ApiEnvelope<PointsAccount>>(`/points/tasks/${id}/claim`)),
  goods:(params?:Record<string,unknown>)=>page<PointsGoods>(userRequest,"/points/goods",params),
  categories:()=>unwrap(userRequest.get<ApiEnvelope<PointsCategory[]>>("/points/categories")),
  exchange:(id:string,input:{quantity:number;recipient?:Record<string,string>;requestId:string})=>unwrap(userRequest.post<ApiEnvelope<PointsOrder>>(`/points/goods/${id}/exchange`,input)),
  orders:(params?:Record<string,unknown>)=>page<PointsOrder>(userRequest,"/points/orders",params),
  rules:()=>unwrap(userRequest.get<ApiEnvelope<PointsRule[]>>("/points/rules")),
};

const resource=<T extends {id?:string}>(path:string)=>({
  list:()=>unwrap(adminRequest.get<ApiEnvelope<T[]>>(path)),
  save:(value:T)=>value.id?unwrap(adminRequest.put<ApiEnvelope<T>>(`${path}/${value.id}`,value)):unwrap(adminRequest.post<ApiEnvelope<T>>(path,value)),
  remove:(id:string)=>unwrap(adminRequest.delete<ApiEnvelope<{deleted:boolean}>>(`${path}/${id}`)),
});
export const pointsAdminApi={
 retryEventTask:(key:string,notes:string,requestId:string)=>unwrap(adminRequest.post<ApiEnvelope<{updated:boolean}>>("/points/event-tasks/retry",{key,notes,requestId})),
 activities:()=>unwrap(adminRequest.get<ApiEnvelope<PointsActivity[]>>("/points/activities")),
 saveActivity:(v:PointsActivity)=>unwrap(v.id?adminRequest.put<ApiEnvelope<PointsActivity>>(`/points/activities/${v.id}`,v):adminRequest.post<ApiEnvelope<PointsActivity>>("/points/activities",v)),
  eventTasks:()=>unwrap(adminRequest.get<ApiEnvelope<Array<{key:string;userId:string;event:string;status:'pending'|'done'|'retry';attempts:number;error:string;availableAt:string}>>>("/points/event-tasks")),
  settings:()=>unwrap(adminRequest.get<ApiEnvelope<PointsSettings>>("/points/settings")),
  saveSettings:(value:PointsSettings)=>unwrap(adminRequest.put<ApiEnvelope<PointsSettings>>("/points/settings",value)),
  stats:()=>unwrap(adminRequest.get<ApiEnvelope<PointsStats>>("/points/stats")),
  accounts:(params?:Record<string,unknown>)=>page<PointsAccount>(adminRequest,"/points/accounts",params),
  setAccountStatus:(id:string,status:boolean)=>unwrap(adminRequest.post<ApiEnvelope<{updated:boolean}>>(`/points/accounts/${id}/status`,{status})),
  grant:(userIds:string[],points:number,remark:string,requestId:string)=>unwrap(adminRequest.post<ApiEnvelope<{affected:number}>>("/points/grant",{userIds,points,remark,requestId})),
  trigger:(userIds:string[],event:string,amountCents:number,remark:string,requestId:string)=>unwrap(adminRequest.post<ApiEnvelope<{affected:number}>>("/points/trigger",{userIds,event,amountCents,remark,requestId})),
  rules:resource<PointsRule>("/points/rules"), tasks:resource<PointsTask>("/points/tasks"), goods:resource<PointsGoods>("/points/goods"), categories:resource<PointsCategory>("/points/categories"),
  orders:(params?:Record<string,unknown>)=>page<PointsOrder>(adminRequest,"/points/orders",params),
  deliver:(id:string,tracking:Record<string,string>)=>unwrap(adminRequest.post<ApiEnvelope<{updated:boolean}>>(`/points/orders/${id}/deliver`,tracking)),
  setOrderStatus:(id:string,status:string)=>unwrap(adminRequest.post<ApiEnvelope<{updated:boolean}>>(`/points/orders/${id}/status`,{status})),
  importCards:(goodsId:string,text:string)=>unwrap(adminRequest.post<ApiEnvelope<{id:string;total:number}>>("/points/cards",{goodsId,text})),
  riskTags:resource<RiskTag>("/points/risk-tags"), riskRules:resource<RiskRule>("/points/risk-rules"),
  riskLogs:(params?:Record<string,unknown>)=>page<RiskLog>(adminRequest,"/points/risk-logs",params),
};
