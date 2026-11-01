import { Banner, Button } from "@cloudflare/kumo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRequest, getApiMessage, type ApiEnvelope } from "../../../shared/api/request";
interface Receipt {status:string;code?:string;sendAt?:string;receivedAt?:string;templateCode?:string;templateName?:string;content?:string;smsSize?:string;sendStatus?:number;checkedAt:string}
const labels:Record<string,string>={delivered:"已送达",delivery_failed:"投递失败",receipt_pending:"等待回执",receipt_unknown:"送达待核查"};
const sendStatusLabels:Record<number,string>={1:"等待回执",2:"发送失败",3:"发送成功"};
const time=(value?:string)=>value?new Date(value).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"}):"未记录";
export function SMSReceiptQuery({id,source="logs"}:{id:string;source?:"logs"|"tasks"}){
 const cache=useQueryClient();
 const query=useMutation({mutationFn:async()=>(await adminRequest.post<ApiEnvelope<Receipt>>(`/system/notify/${source}/${encodeURIComponent(id)}/receipt`,{})).data.data,onSuccess:async()=>{await Promise.all([cache.invalidateQueries({queryKey:["admin","notify","logs"]}),cache.invalidateQueries({queryKey:["admin-todo-items","expiring"]}),cache.invalidateQueries({queryKey:["notification-detail"]})]);}});
 const receipt=query.data;
 return <div className="grid gap-3"><Button variant="secondary" size="sm" loading={query.isPending} onClick={()=>query.mutate()}>查询送达回执</Button>
  {receipt?<>
   <Banner variant={receipt.status==="delivery_failed"?"error":"default"} title={labels[receipt.status]??"送达待核查"} description={`核验于 ${time(receipt.checkedAt)}`}/>
   <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm">
    <dt className="text-kumo-subtle">发送时间</dt><dd>{time(receipt.sendAt)}</dd>
    <dt className="text-kumo-subtle">接收时间</dt><dd>{time(receipt.receivedAt)}</dd>
    <dt className="text-kumo-subtle">模板名称</dt><dd>{receipt.templateName||"未记录"}</dd>
    <dt className="text-kumo-subtle">模板 CODE</dt><dd className="break-all">{receipt.templateCode||"未记录"}</dd>
    <dt className="text-kumo-subtle">发送状态</dt><dd>{receipt.sendStatus?sendStatusLabels[receipt.sendStatus]??String(receipt.sendStatus):labels[receipt.status]??"未记录"}</dd>
    <dt className="text-kumo-subtle">失败原因</dt><dd className="break-all">{receipt.status==="delivered"?"—":receipt.code||"未记录"}</dd>
    <dt className="text-kumo-subtle">字数</dt><dd>{receipt.smsSize||"未记录"}</dd>
   </dl>
   <div className="grid gap-2"><p className="text-sm font-medium">短信内容</p><pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-md border border-kumo-line bg-kumo-recessed p-3 text-sm">{receipt.content||"服务商未返回内容"}</pre></div>
  </>:null}
  {query.error?<Banner variant="error" title={getApiMessage(query.error)}/>:null}</div>;
}
