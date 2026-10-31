import { LayerDialog } from "@cloudflare/kumo";
import { useState } from "react";
import { Badge } from "../../../shared/components/Badge";
import { adminRequest,type ApiEnvelope } from "../../../shared/api/request";
import { NotificationContent } from "../../../shared/components/NotificationContent";
import type { TodoEntry } from "../../../shared/api/adminTodos";
interface Reminder {Channel:string;Status:string;Error:string;BusinessID:string;Target?:string;Content?:string;CreatedAt:string}
const statuses: Record<string, {label: string; variant: "neutral" | "success" | "warning" | "error"}> = {
 delivered: {label: "已送达", variant: "success"},
 delivery_failed: {label: "投递失败", variant: "error"},
 receipt_pending: {label: "等待回执", variant: "warning"},
 receipt_unknown: {label: "送达待核查", variant: "warning"},
 not_sent: {label: "未发送", variant: "neutral"},
 success: {label: "已发送", variant: "success"},
 submitted: {label: "服务商已接收", variant: "warning"},
 pending: {label: "等待发送", variant: "neutral"},
 sending: {label: "发送中", variant: "warning"},
 failed: {label: "发送失败", variant: "error"},
 unknown: {label: "待核查", variant: "warning"},
 canceled: {label: "已取消", variant: "neutral"},
 skipped: {label: "已跳过", variant: "neutral"},
};
const reminderLabels: Record<string,string> = {delivered:"已送达",delivery_failed:"投递失败",receipt_pending:"等待回执",receipt_unknown:"送达待核查",success:"已提交",failed:"失败或结果待核查",submitted:"服务商已接收",unknown:"结果待核对",pending:"等待发送",canceled:"已取消",skipped:"已跳过"};
type Detail = {channel: string; label: string; record?: Reminder; error?: string; loading: boolean};
export function TodoExpiryNotificationStatus({row}: {row: TodoEntry}) {
 const [detail,setDetail]=useState<Detail>();
 const open=async(channel:string,label:string)=>{
  setDetail({channel,label,loading:true});
  try{
   const data=(await adminRequest.get<ApiEnvelope<Reminder[]>>(`/todos/products/${encodeURIComponent(row.instanceId||row.id)}/expiry-reminders`)).data.data;
   setDetail({channel,label,record:data.find(item=>item.Channel===channel),loading:false});
  }catch(e){
   setDetail({channel,label,loading:false,error:e instanceof Error?e.message:"提醒记录读取失败"});
  }
 };
 return <div className="grid gap-1.5">
  {([['sms','短信'],['email','邮件']] as const).map(([channel,label])=>{
   const status = channel==="sms"&&row.expiryNotifications?.sms==="success" ? {label:"已提交",variant:"warning" as const} : row.expiryNotifications ? statuses[row.expiryNotifications[channel]] ?? {label: "待核查",variant: "warning" as const} : {label: "未获取",variant: "neutral" as const};
   return <div key={channel} className="flex items-center gap-2"><span>{label}</span><button type="button" className="cursor-pointer rounded-sm underline decoration-dotted underline-offset-4 hover:text-kumo-strong" title={`查看${label}通知内容`} onClick={()=>{void open(channel,label);}}><Badge variant={status.variant}>{status.label}</Badge></button></div>;
  })}
  {detail?<LayerDialog.Root open onOpenChange={(open:boolean)=>{if(!open)setDetail(undefined);}}>
   <LayerDialog.Content size="lg" closeLabel="关闭">
    <LayerDialog.Title>{detail.label}通知详情</LayerDialog.Title>
    <LayerDialog.Description>最近一次{detail.label}提醒的接收目标与内容。</LayerDialog.Description>
    <LayerDialog.Body>
     {detail.loading?<p className="text-sm text-kumo-subtle">正在读取提醒记录…</p>:detail.error?<p className="text-sm break-words">{detail.error}</p>:detail.record?<>
      <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm">
       <dt className="text-kumo-subtle">渠道</dt><dd>{detail.label}</dd>
       <dt className="text-kumo-subtle">结果</dt><dd>{reminderLabels[detail.record.Status]??detail.record.Status}</dd>
       <dt className="text-kumo-subtle">接收目标</dt><dd className="break-all">{detail.record.Target||"未记录"}</dd>
       <dt className="text-kumo-subtle">时间</dt><dd>{new Date(detail.record.CreatedAt).toLocaleString("zh-CN")}</dd>
       <dt className="text-kumo-subtle">批次 / 日志</dt><dd className="break-all">{detail.record.BusinessID||"—"}</dd>
       {detail.record.Error?<><dt className="text-kumo-subtle">错误</dt><dd className="break-all">{detail.record.Error}</dd></>:null}
      </dl>
      <div className="mt-4 grid gap-2"><p className="text-sm font-medium">内容</p><div className="max-h-80 overflow-auto"><NotificationContent html={detail.record.Content} /></div></div>
     </>:<p className="text-sm text-kumo-subtle">暂无该渠道的提醒记录。</p>}
    </LayerDialog.Body>
   </LayerDialog.Content>
  </LayerDialog.Root>:null}
 </div>;
}
