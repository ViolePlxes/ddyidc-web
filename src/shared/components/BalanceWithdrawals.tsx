import { Banner, Button, Input, LayerCard, Table } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { userRequest, type ApiEnvelope, getApiMessage } from "../api/request";
interface Withdrawal { id: string; amount: string; status: string; reason: string; createdAt: string }
const labels:Record<string,string>={pending:"待审核",approved:"待汇款",paid:"已汇款",rejected:"已拒绝"};
export function BalanceWithdrawals(){
 const cache=useQueryClient();const [amount,setAmount]=useState("");const [account,setAccount]=useState("");const [requestId,setRequestId]=useState(()=>crypto.randomUUID());
 const settings=useQuery({queryKey:["payment-offline-config"],queryFn:async()=>(await userRequest.get<ApiEnvelope<{withdrawalEnabled:boolean;withdrawalFeePolicy:string}>>("/payment/offline-config")).data.data});
 const rows=useQuery({queryKey:["balance-withdrawals"],queryFn:async()=>(await userRequest.get<ApiEnvelope<Withdrawal[]>>("/finance/withdrawals")).data.data});
 const submit=useMutation({mutationFn:async()=>{await userRequest.post("/finance/withdrawals",{requestId,amount,account});},onSuccess:async()=>{setAmount("");setAccount("");setRequestId(crypto.randomUUID());await Promise.all([cache.invalidateQueries({queryKey:["balance-withdrawals"]}),cache.invalidateQueries({queryKey:["console","overview"]})]);}});
 return <LayerCard ><LayerCard.Secondary><h2>余额提现</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4"><p>申请时冻结金额，审核通过后等待人工汇款，拒绝申请将退回可用余额。</p>{settings.data?.withdrawalEnabled&&settings.data.withdrawalFeePolicy==="free"?<div className="flex flex-wrap items-end gap-3"><Input label="提现金额（元）" value={amount} onChange={e=>setAmount(e.target.value)} /><Input label="收款账户与户名" value={account} maxLength={256} autoComplete="off" onChange={e=>setAccount(e.target.value)} /><Button loading={submit.isPending} disabled={!amount||!account.trim()} onClick={()=>submit.mutate()}>申请提现</Button></div>:<p>配置后可用，请联系平台管理员。</p>}{submit.error||rows.error?<Banner variant="error" title={getApiMessage(submit.error??rows.error)} />:null}<Table><Table.Header><Table.Row><Table.Head>申请编号</Table.Head><Table.Head>金额</Table.Head><Table.Head>状态</Table.Head><Table.Head>处理说明</Table.Head></Table.Row></Table.Header><Table.Body>{rows.data?.map(row=><Table.Row key={row.id}><Table.Cell>{row.id}</Table.Cell><Table.Cell>¥{row.amount}</Table.Cell><Table.Cell>{labels[row.status]??row.status}</Table.Cell><Table.Cell>{row.reason||"—"}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard.Primary></LayerCard>;
}
