import { Banner, Button, Input, LayerCard, Switch } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminRequest, type ApiEnvelope, getApiMessage } from "../../../shared/api/request";
interface Settings { offlineEnabled: boolean; withdrawalEnabled: boolean; withdrawalFeePolicy: string; offlineInstructions: string; expiringDays: number }
export function TodoSettings() {
 const cache=useQueryClient();const [form,setForm]=useState<Settings>();
 const query=useQuery({queryKey:["todo-settings"],queryFn:async()=>(await adminRequest.get<ApiEnvelope<Settings>>("/todos/settings")).data.data});
 const value=form??query.data;
 const save=useMutation({mutationFn:async()=>{await adminRequest.put("/todos/settings",value);},onSuccess:async()=>{setForm(undefined);await Promise.all([cache.invalidateQueries({queryKey:["todo-settings"]}),cache.invalidateQueries({queryKey:["admin-todos"]}),cache.invalidateQueries({queryKey:["admin-todo-items"]})]);}});
 return <LayerCard className="grid gap-4 p-4"><h2>待办业务配置</h2>{value?<><Switch label="允许提交线下转账申请" checked={value.offlineEnabled} onCheckedChange={checked=>setForm({...value,offlineEnabled:checked})} /><Input label="平台收款账户与核验说明" value={value.offlineInstructions} maxLength={1000} onChange={e=>setForm({...value,offlineInstructions:e.target.value})} /><Switch label="允许余额提现申请（人工审核汇款）" checked={value.withdrawalEnabled} onCheckedChange={checked=>setForm({...value,withdrawalEnabled:checked})} /><Switch label="明确确认余额提现免手续费" checked={value.withdrawalFeePolicy==="free"} onCheckedChange={checked=>setForm({...value,withdrawalFeePolicy:checked?"free":""})}/><Input label="到期通知提前天数" type="number" min={1} max={90} value={String(value.expiringDays)} onChange={e=>setForm({...value,expiringDays:Number(e.target.value)})} /><Button loading={save.isPending} disabled={!form} onClick={()=>save.mutate()}>保存配置</Button></>:null}{query.error||save.error?<Banner variant="error" title={getApiMessage(query.error??save.error)} />:null}{save.isSuccess?<p role="status">配置已保存</p>:null}</LayerCard>;
}
