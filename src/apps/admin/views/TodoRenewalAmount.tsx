import { Text } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { instanceManagementApi } from "../../../shared/api/instanceManagement";
import type { TodoEntry } from "../../../shared/api/adminTodos";

let active=0;
const waiting:Array<()=>void>=[];
async function quote(row:TodoEntry){
 await new Promise<void>(resolve=>{const start=()=>{active++;resolve()};if(active<3)start();else waiting.push(start)});
 try{return await instanceManagementApi(row.instanceId,row.customerId).options()}
 finally{active--;waiting.shift()?.()}
}
export function TodoRenewalAmount({row}:{row:TodoEntry}){
 const query=useQuery({queryKey:["admin","todo-renewal-quote",row.customerId,row.instanceId,row.billingCycle,row.updatedAt],queryFn:()=>quote(row),enabled:Boolean(row.instanceId&&row.customerId&&row.billingCycle),staleTime:5*60_000,retry:false});
 const option=query.data?.items?.find(item=>item.cycle===row.billingCycle);
 const amount=option?.amount;
 const label=option?.label??({monthly:"月付",quarterly:"季付",semiannually:"半年付",annually:"年付",biennially:"两年付",triennially:"三年付"} as Record<string,string>)[row.billingCycle??""];
 return <div className="flex flex-col items-start"><span>{query.isPending&&query.fetchStatus!=="idle"?"读取续费报价…":amount&&/^\d+(?:\.\d{1,2})?$/.test(amount)?`¥${Number(amount).toFixed(2)}`:"续费报价暂不可用"}</span>{label?<Text variant="secondary">{label}</Text>:null}</div>;
}
