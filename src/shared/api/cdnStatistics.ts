import { adminRequest, userRequest, type ApiEnvelope } from "./request";
export interface StatisticsRow { time:string; dimensions:Record<string,string>; values:Record<string,number> }
export interface StatisticsDataset { domainId:string; domain:string; action:string; requestId:string; rows:StatisticsRow[] }
export interface StatisticsResult { kind:string; start:string; end:string; interval:number; fetchedAt:string; datasets:StatisticsDataset[]; note:string }
export interface StatisticsInput { domainIds:string; kind:string; metric:string; view:string; source:string; start:string; end:string; interval:number; region:string; protocol:string; province:string; isp:string; streamUrl:string; priorStart?:string; priorEnd?:string }
export async function fetchStatistics(input:StatisticsInput,admin:boolean,signal?:AbortSignal){const response=await (admin?adminRequest:userRequest).get<ApiEnvelope<StatisticsResult>>("/cdnsell/statistics",{params:input,signal,timeout:50000});return response.data.data}
