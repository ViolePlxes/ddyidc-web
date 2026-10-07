import { Badge } from "./Badge";
import { Banner, Button, Input, LayerCard, Switch, Table } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { pointsApi, pointsAdminApi, type PointsActivity } from "../api/points";
import { getApiMessage } from "../api/request";
import { DateRangeField } from "./DateField";
import { PageState } from "./PageState";
import { PageHeader } from "./PageHeader";

export function PointsActivities({ admin = false }: { admin?: boolean }) {
 const client = useQueryClient();
 const [form,setForm] = useState<PointsActivity>();
 const [message,setMessage] = useState("");
 const query = useQuery({queryKey:[admin?"admin":"user","points","activities"],queryFn:admin?pointsAdminApi.activities:pointsApi.activities});
 const refresh = () => client.invalidateQueries({queryKey:[admin?"admin":"user","points","activities"]});
 const claim = useMutation({mutationFn:pointsApi.claimActivity,onSuccess:result=>{setMessage(`今日福利已到账：+${result.points} 积分`);void refresh();void client.invalidateQueries({queryKey:["points"]});}});
 const save = useMutation({mutationFn:()=>pointsAdminApi.saveActivity(form!),onSuccess:()=>{setForm(undefined);setMessage("活动已保存");void refresh();}});
 const begin = () => {const now=new Date();setForm({name:"每日免费福利",description:"每天免费参与一次，奖励自动到账。",startsAt:now.toISOString(),endsAt:new Date(now.getTime()+30*86400000).toISOString(),budgetPoints:100000,awardedPoints:0,rewards:[{points:2,weight:80},{points:5,weight:15},{points:10,weight:4},{points:20,weight:1}],enabled:false,claimed:false,claimedPoints:0});save.reset();};
 const localDate=(value:string)=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;};
 return <div className="grid min-w-0 gap-4">
 {admin?<PageHeader title="积分福利活动" description="管理免费活动时间、奖励权重和发放预算。" actions={<Button onClick={begin}>新建活动</Button>}/>:<h2 className="font-semibold text-kumo-strong">每日免费福利</h2>}
 {message&&<Banner title={message}/>}
 {(claim.error||save.error)&&<Banner variant="error" title={getApiMessage(claim.error??save.error)}/>}
 {admin&&form&&<LayerCard><LayerCard.Secondary>{form.id?"编辑活动":"新建活动"}</LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
 <div className="grid gap-3 md:grid-cols-2"><Input label="活动名称" maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Input label="活动说明" maxLength={1000} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><Input label="总预算（积分）" type="number" min={1} value={form.budgetPoints} onChange={e=>setForm({...form,budgetPoints:Number(e.target.value)})}/><Switch label="开放活动" checked={form.enabled} onCheckedChange={enabled=>setForm({...form,enabled})}/></div>
 <DateRangeField label="活动时间" withTime seconds allowPartial={false} clearable={false} from={localDate(form.startsAt)} to={localDate(form.endsAt)} onValueChange={(start,end)=>{if(start&&end)setForm({...form,startsAt:new Date(start).toISOString(),endsAt:new Date(end).toISOString()});}}/>
 <p className="text-sm text-kumo-subtle">权重按总权重比例计算；每天每个账号参与一次，不扣积分。预算不足以支付任一档奖励时停止参与。</p>
 <div className="grid gap-3">{form.rewards.map((reward,index)=><div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input label={`奖励${index+1}积分`} type="number" min={1} value={reward.points} onChange={e=>setForm({...form,rewards:form.rewards.map((v,i)=>i===index?{...v,points:Number(e.target.value)}:v)})}/><Input label={`奖励${index+1}权重`} type="number" min={1} value={reward.weight} onChange={e=>setForm({...form,rewards:form.rewards.map((v,i)=>i===index?{...v,weight:Number(e.target.value)}:v)})}/><Button variant="secondary" disabled={form.rewards.length<=1} onClick={()=>setForm({...form,rewards:form.rewards.filter((_,i)=>i!==index)})}>移除</Button></div>)}</div>
 <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={form.rewards.length>=20} onClick={()=>setForm({...form,rewards:[...form.rewards,{points:1,weight:1}]})}>增加奖励档</Button><Button variant="secondary" disabled={save.isPending} onClick={()=>setForm(undefined)}>取消</Button><Button loading={save.isPending} onClick={()=>save.mutate()}>保存活动</Button></div>
 </LayerCard.Primary></LayerCard>}
 <PageState loading={query.isLoading} error={query.error?getApiMessage(query.error):null} empty={!query.isLoading&&!query.error&&!query.data?.length} emptyTitle="暂无开放的福利活动">
 {admin?<div className="overflow-x-auto"><Table><Table.Header><Table.Row>{["活动","开放时间","预算 / 已发放","状态","操作"].map(v=><Table.Head key={v}>{v}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{query.data?.map(a=><Table.Row key={a.id}><Table.Cell>{a.name}</Table.Cell><Table.Cell>{new Date(a.startsAt).toLocaleString("zh-CN")} 至 {new Date(a.endsAt).toLocaleString("zh-CN")}</Table.Cell><Table.Cell>{a.budgetPoints} / {a.awardedPoints}</Table.Cell><Table.Cell><Badge variant={a.enabled?"success":"outline"}>{a.enabled?"已开启":"已关闭"}</Badge></Table.Cell><Table.Cell><Button variant="ghost" onClick={()=>{setForm(a);save.reset();}}>编辑</Button></Table.Cell></Table.Row>)}</Table.Body></Table></div>:<div className="grid gap-4 md:grid-cols-2">{query.data?.map(a=>{const largest=Math.max(...a.rewards.map(v=>v.points));const remaining=a.budgetPoints-a.awardedPoints;return <LayerCard key={a.id}><LayerCard.Secondary>{a.name}</LayerCard.Secondary><LayerCard.Primary className="grid gap-3"><p>{a.description}</p><p className="text-sm text-kumo-subtle">奖励 {a.rewards.map(v=>`${v.points}分（${(v.weight/a.rewards.reduce((sum,item)=>sum+item.weight,0)*100).toFixed(1)}%）`).join(" / ")} 积分；剩余预算 {remaining} 积分</p><p className="text-xs text-kumo-subtle">截至 {new Date(a.endsAt).toLocaleString("zh-CN")}</p><Button disabled={a.claimed||remaining<largest||claim.isPending} loading={claim.isPending&&claim.variables===a.id} onClick={()=>claim.mutate(a.id!)}>{a.claimed?`今日已领取 +${a.claimedPoints}`:remaining<largest?"额度不足":"免费领取今日福利"}</Button></LayerCard.Primary></LayerCard>;})}</div>}
 </PageState>
 </div>;
}
