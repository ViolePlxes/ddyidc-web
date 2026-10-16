import { Banner, Button } from "@cloudflare/kumo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRequest, getApiMessage, type ApiEnvelope } from "../../../shared/api/request";
interface Receipt {status:string;code?:string;receivedAt?:string;checkedAt:string}
const labels:Record<string,string>={delivered:"已送达",delivery_failed:"投递失败",receipt_pending:"等待回执",receipt_unknown:"送达待核查"};
export function SMSReceiptQuery({id,source="logs"}:{id:string;source?:"logs"|"tasks"}){
 const cache=useQueryClient();
 const query=useMutation({mutationFn:async()=>(await adminRequest.post<ApiEnvelope<Receipt>>(`/system/notify/${source}/${encodeURIComponent(id)}/receipt`,{})).data.data,onSuccess:async()=>{await Promise.all([cache.invalidateQueries({queryKey:["admin","notify","logs"]}),cache.invalidateQueries({queryKey:["admin-todo-items","expiring"]}),cache.invalidateQueries({queryKey:["notification-detail"]})]);}});
 return <div className="grid gap-2"><Button variant="secondary" size="sm" loading={query.isPending} onClick={()=>query.mutate()}>查询送达回执</Button>{query.data?<Banner variant={query.data.status==="delivery_failed"?"error":"default"} title={labels[query.data.status]??"送达待核查"} description={`${query.data.code??""}${query.data.receivedAt?` · 送达时间 ${new Date(query.data.receivedAt).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"})}`:""} · 核验于 ${new Date(query.data.checkedAt).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"})}`}/>:null}{query.error?<Banner variant="error" title={getApiMessage(query.error)}/>:null}</div>;
}
