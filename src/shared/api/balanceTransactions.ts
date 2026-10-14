import axios from "axios";
import { userRequest, type ApiEnvelope } from "./request";
export interface BalanceTransaction { id:string;type:string;typeLabel:string;amount:string;balanceBefore:string;balanceAfter:string;frozenBefore:string;frozenAfter:string;accountVersion:number;createdAt:string;description:string;relatedId?:string;relatedType?:string;href?:string; }
export interface BalanceStatement { items:BalanceTransaction[];total:number;page:number;pageSize:number;snapshotVersion:number;asOf:string;account:{exists:boolean;balance:string;frozenBalance:string;version:number};integrity:"consistent"|"needs_review";increase:string;decrease:string;net:string;pageNet:string; }
export interface BalanceFilters { type:string;direction:string;keyword:string;startAt:string;endAt:string; }
export async function getBalanceStatement(params:BalanceFilters & {page:number;pageSize:number;snapshotVersion?:number}, signal?:AbortSignal) {
 const response=await userRequest.get<ApiEnvelope<BalanceStatement>>("/console/balance/transactions",{params,signal});
 if(response.data.code!==0) throw new Error(response.data.message||"余额流水查询失败");
 return response.data.data;
}
export async function exportBalanceStatement(params:BalanceFilters & {snapshotVersion?:number}) {
 let response;
 try { response=await userRequest.get<Blob>("/console/balance/transactions",{params:{...params,format:"csv"},responseType:"blob"}); } catch(error) { if(axios.isAxiosError(error)&&error.response?.data instanceof Blob){try{const body=JSON.parse(await error.response.data.text());throw new Error(body.message||"余额流水导出失败")}catch(parsed){if(parsed instanceof Error&&!(parsed instanceof SyntaxError))throw parsed}} throw error }
 if(!String(response.headers["content-type"]??"").includes("text/csv")){const text=await response.data.text();let message="余额流水导出失败";try{message=JSON.parse(text).message??message}catch{/* retain safe fallback */}throw new Error(message)}
 return response.data;
}
