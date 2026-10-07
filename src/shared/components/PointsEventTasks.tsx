import { Banner, Button, Input, Table } from "@cloudflare/kumo";
import { useQuery,useMutation,useQueryClient } from "@tanstack/react-query";
import { useState,useRef } from "react";
import { pointsAdminApi } from "../api/points";
import { getApiMessage } from "../api/request";
import { Badge } from "./Badge";
import { PageHeader } from "./PageHeader";
import { PageState } from "./PageState";
import { ConfirmAction } from "./ConfirmAction";

export function PointsEventTasks(){
 const client=useQueryClient();const [notes,setNotes]=useState("");const [message,setMessage]=useState("");
 const request=useRef({fingerprint:"",id:crypto.randomUUID()});
 const tasks=useQuery({queryKey:["admin","points","event-tasks"],queryFn:pointsAdminApi.eventTasks,refetchInterval:30000});
 const retry=useMutation({mutationFn:(key:string)=>{const fingerprint=JSON.stringify([key,notes]);if(request.current.fingerprint!==fingerprint)request.current={fingerprint,id:crypto.randomUUID()};return pointsAdminApi.retryEventTask(key,notes,request.current.id);},onSuccess:()=>{setMessage("积分任务已重新排队");void client.invalidateQueries({queryKey:["admin","points","event-tasks"]});},onError:e=>setMessage(getApiMessage(e))});
 const labels:Record<string,string>={pending:"等待处理",retry:"待重试",done:"已完成"};
 return <div className="grid min-w-0 gap-4"><PageHeader title="积分发放任务" description="展示最近100条任务，每30秒刷新；定时处理每分钟运行。重试只处理积分，不重复下单、付款或退款。" actions={<Button variant="secondary" onClick={()=>void tasks.refetch()}>刷新</Button>}/>{message&&<Banner title={message}/>}<Input label="重试原因（留审计记录）" value={notes} maxLength={500} onChange={e=>setNotes(e.target.value)}/><PageState loading={tasks.isLoading} error={tasks.error?getApiMessage(tasks.error):null} empty={!tasks.isLoading&&!tasks.error&&!tasks.data?.length} emptyTitle="暂无积分任务"><div className="overflow-x-auto"><Table><Table.Header><Table.Row>{["任务编号 / 客户","事件","状态","处理次数","下次处理时间","结果","操作"].map(s=><Table.Head key={s}>{s}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{tasks.data?.map(t=><Table.Row key={t.key}><Table.Cell><p className="max-w-64 break-all">{t.key}</p><p className="text-xs text-kumo-subtle">客户 {t.userId}</p></Table.Cell><Table.Cell>{t.event}</Table.Cell><Table.Cell><Badge variant={t.status==="done"?"success":t.status==="retry"?"error":"warning"}>{labels[t.status]}</Badge></Table.Cell><Table.Cell>{t.attempts}</Table.Cell><Table.Cell>{t.status==="done"?"—":t.availableAt}</Table.Cell><Table.Cell>{t.error||"—"}</Table.Cell><Table.Cell>{t.status==="retry"&&<ConfirmAction title="重新排队积分任务" description="仅重试本条积分发放或回收任务，原业务操作不会再次执行。" disabled={!notes.trim()} loading={retry.isPending} onConfirm={()=>retry.mutate(t.key)}>重试</ConfirmAction>}</Table.Cell></Table.Row>)}</Table.Body></Table></div></PageState></div>;
}
