import { Banner, Button, Input } from "@cloudflare/kumo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminRequest, getApiMessage } from "../../../shared/api/request";
import type { TodoEntry } from "../../../shared/api/adminTodos";
export function TodoInviteReview({row,onDone}:{row:TodoEntry;onDone:()=>void}){
 const cache=useQueryClient();const [reason,setReason]=useState("");const [requestId]=useState(()=>crypto.randomUUID());
 const review=useMutation({mutationFn:async(action:string)=>{await adminRequest.post(`/todos/recommendations/${row.id}/review`,{action,reason,requestId,expectedUpdatedAt:row.updatedAt});},onSuccess:async()=>{await Promise.all([cache.invalidateQueries({queryKey:["admin-todos"]}),cache.invalidateQueries({queryKey:["admin-todo-items"]}),cache.invalidateQueries({queryKey:["admin","marketing","invites"]})]);onDone();}});
 return <div className="grid gap-3"><Banner variant="default" title="注册优惠码审核" description="沿用现有积分、优惠码注册体系。审核仅决定优惠码是否启用，积分按现有规则发放。"/><Input label="审核说明" value={reason} maxLength={500} onChange={e=>setReason(e.target.value)} />{review.error?<Banner variant="error" title={getApiMessage(review.error)}/>:null}<div className="flex gap-3"><Button disabled={!reason.trim()} loading={review.isPending} onClick={()=>review.mutate("approve")}>通过审核</Button><Button variant="secondary" disabled={review.isPending||!reason.trim()} onClick={()=>review.mutate("reject")}>驳回申请</Button></div></div>;
}
