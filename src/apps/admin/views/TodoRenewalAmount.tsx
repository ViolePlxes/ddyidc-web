import { Text } from "@cloudflare/kumo";
import type { TodoEntry } from "../../../shared/api/adminTodos";

// The list response includes verified local prices; never request a quote per row.
export function TodoRenewalAmount({row}:{row:TodoEntry}){
 const cycle=row.billingCycle??"";
 const label=({monthly:"月付",quarterly:"季付",semiannually:"半年付",annually:"年付",biennially:"两年付",triennially:"三年付"} as Record<string,string>)[cycle]??cycle;
 const amount=row.amount;
 return <div className="flex flex-col items-start" title={row.renewalSyncedAt?`报价同步于 ${new Date(row.renewalSyncedAt*1000).toLocaleString("zh-CN")}`:undefined}><span>{amount&&/^\d+(?:\.\d{1,2})?$/.test(amount)?`¥${Number(amount).toFixed(2)}`:"待同步续费报价"}</span>{label?<Text variant="secondary">{label}{row.renewalStale?" · 上次有效报价":""}</Text>:null}</div>;
}
