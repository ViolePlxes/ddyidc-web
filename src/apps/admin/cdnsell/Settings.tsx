import { Banner, Button, Input, LayerCard, Switch } from "@cloudflare/kumo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { cdnsellAdminApi } from "../../../shared/api/cdnsell";
import { getApiMessage } from "../../../shared/api/request";
export function CdnSettings(){
 const client=useQueryClient();const q=useQuery({queryKey:["admin","cdnsell","settings"],queryFn:cdnsellAdminApi.settings});
 const [suspend,setSuspend]=useState(false);const [restore,setRestore]=useState(false);const [price,setPrice]=useState("0.00");
 const [enabled,setEnabled]=useState(false);const [writes,setWrites]=useState(false);const [notes,setNotes]=useState("");
 useEffect(()=>{if(q.data){setSuspend(Boolean(q.data.autoSuspendEnabled));setRestore(Boolean(q.data.autoRestoreEnabled));setPrice(String(q.data.overagePrice??"0.00"));setEnabled(q.data.enabled);setWrites(Boolean(q.data.cloudWritesEnabled))}},[q.data]);
 const save=useMutation({mutationFn:()=>cdnsellAdminApi.saveSettings({enabled,cloudWritesEnabled:writes,autoSuspendEnabled:suspend,autoRestoreEnabled:restore,overagePrice:price,notes}),onSuccess:async()=>{setNotes("");await client.invalidateQueries({queryKey:["admin","cdnsell"]})}});
 return <LayerCard><LayerCard.Secondary>服务设置</LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
 {q.error?<Banner variant="error" title={getApiMessage(q.error)}/>:null}
 {q.data?.setupMessage?<Banner title={q.data.setupMessage}/>:null}
 <div className="flex flex-wrap gap-4"><Switch label="开放CDN服务" checked={enabled} onCheckedChange={setEnabled}/><Switch label="允许域名及配置操作" checked={writes} onCheckedChange={setWrites}/></div>
 <div className="flex flex-wrap gap-4"><Switch label="流量耗尽自动暂停" checked={suspend} onCheckedChange={setSuspend}/><Switch label="补充流量自动恢复" checked={restore} onCheckedChange={setRestore}/></div>
 <Input label="超额流量单价（元/GiB）" type="number" min={0} step="0.01" value={price} onChange={e=>setPrice(e.target.value)}/>
 <p className="text-sm text-kumo-subtle">自动恢复仅针对流量策略暂停的域名；人工暂停保留。超额单价为0时不产生费用。</p>
 <Input label="操作说明" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="请说明本次设置变更原因"/>
 {save.error?<Banner variant="error" title={getApiMessage(save.error)}/>:null}
 {save.isSuccess?<Banner title="设置已保存"/>:null}
 <div><Button loading={save.isPending} disabled={q.isLoading||Boolean(q.error)||notes.trim().length<2} onClick={()=>save.mutate()}>保存设置</Button></div>
 </LayerCard.Primary></LayerCard>
}
