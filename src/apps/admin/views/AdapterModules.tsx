import { Badge, Banner, Button, Input, LayerCard, Select } from "@cloudflare/kumo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adapterModulesApi, type AdapterModule } from "../../../shared/api/upstreamAdmin";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { Dialog } from "../../../shared/components/Dialog";

const states = {enabled:"已启用",sales_stopped:"停止新销售",disabled:"已停用"};
const capabilities: Record<string,string> = {catalog:"商品目录",configuration:"商品配置",quote:"权威报价",purchase:"采购",renewal:"续费",instance:"实例管理",remote:"远程控制台",webhook:"回调"};
const levels: Record<string,string> = {implemented:"已实现，按协议验证",provider_declared:"按接口声明提供",pending_verification:"待验证",unsupported:"暂不支持",configuration_required:"配置后可用"};
export function AdapterModules(){
 const client=useQueryClient();const query=useQuery({queryKey:["admin","adapter-modules"],queryFn:adapterModulesApi.list});
 const [target,setTarget]=useState<AdapterModule|null>(null);const [status,setStatus]=useState<AdapterModule["status"]>("enabled");const [notes,setNotes]=useState("");
 const mutation=useMutation({mutationFn:()=>{if(!target)throw new Error("请选择能力");return adapterModulesApi.update(target.id,status,target.revision,notes);},onSuccess:async()=>{setTarget(null);await client.invalidateQueries({queryKey:["admin","adapter-modules"]});}});
 return <><PageHeader title="对接能力" description="按系统管理适配模块，供应商账号作为独立实例。停止新销售保留现有产品的维护能力。" />
 {query.isPending?<PageState loading>{null}</PageState>:query.error?<Banner variant="error" title="读取失败" description={getApiMessage(query.error)}/>:<div className="grid gap-5">{query.data?.map(m=><LayerCard key={m.id} className="grid gap-4 px-5 py-4"><div className="flex flex-wrap items-start justify-between gap-4"><div className="grid gap-1"><h2 className="text-lg font-semibold">{m.name}</h2><p className="text-sm text-kumo-subtle">版本 {m.version} · 契约 {m.contractVersion} · {m.variants.join(" / ")}</p></div><div className="flex items-center gap-3"><Badge variant={m.status==="enabled"?"primary":"secondary"}>{states[m.status]}</Badge><Button variant="secondary" onClick={()=>{setTarget(m);setStatus(m.status);setNotes("");mutation.reset();}}>管理状态</Button></div></div><p className="text-sm text-kumo-subtle">{m.description}</p><div className="flex flex-wrap gap-5 text-sm"><span>供应商 {m.suppliers}</span><span>商品关联 {m.products}</span><span>机器关联 {m.hosts}</span><span>待完成采购 {m.pendingOrders}</span></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(m.capabilities).map(([k,v])=><div key={k} className="flex items-center justify-between gap-3 text-sm"><span>{capabilities[k]??k}</span><Badge variant="secondary">{levels[v]??v}</Badge></div>)}</div><p className="text-sm text-kumo-subtle">{m.uninstallable?"依赖已排空，可安排后续构建移除模块代码。":"模块拆卸前必须排空供应商及业务依赖，历史交易和关联不会删除。"}</p></LayerCard>)}</div>}
 {target?<Dialog.Root open onOpenChange={open=>{if(!open&&!mutation.isPending)setTarget(null);}}><Dialog size="lg" className="grid gap-4 p-8"><Dialog.Title className="text-xl font-semibold">管理{target.name}</Dialog.Title><Dialog.Description>停售只限制新购与新对接；仍有供应商、商品、机器或订单依赖时不能停用外部调用。</Dialog.Description><Select label="能力状态" value={status} onValueChange={value=>{if(value)setStatus(value as AdapterModule["status"]);}} items={states}/><Input label="操作原因" value={notes} maxLength={200} onChange={event=>setNotes(event.target.value)} required/>{mutation.error?<Banner variant="error" title="未能更新" description={getApiMessage(mutation.error)}/>:null}<div className="flex justify-end gap-2"><Button variant="secondary" disabled={mutation.isPending} onClick={()=>setTarget(null)}>取消</Button><Button loading={mutation.isPending} disabled={!notes.trim()||status===target.status} onClick={()=>mutation.mutate()}>确认修改</Button></div></Dialog></Dialog.Root>:null}
 </>;
}
