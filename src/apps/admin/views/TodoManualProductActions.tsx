import { Banner, Button, Checkbox, Input, LayerCard, Text } from "@cloudflare/kumo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "../../../shared/components/Dialog";
import { processManualProduct, type TodoEntry } from "../../../shared/api/adminTodos";
import { getApiMessage } from "../../../shared/api/request";

const key = (row: TodoEntry) => `${row.source}:${row.id}:${row.revision}`;
const powerNames: Record<string,string> = {running:"运行中",stopped:"已关机",suspended:"已暂停",deleted:"已删除",cancelled:"已取消",operating:"操作中",fault:"异常"};
export function useManualProductActions(rows: TodoEntry[], enabled: boolean, scope: string) {
  const cache=useQueryClient();
  const [selected,setSelected]=useState<string[]>([]);
  const [confirm,setConfirm]=useState<TodoEntry[]>([]);
  const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState("");
  const [results,setResults]=useState<{key:string;number:string;ok:boolean;message:string}[]>([]);
  const mounted=useRef(true);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{setSelected([]);setConfirm([]);setResults([]);},[scope]);
  const selectable=rows.filter(row=>row.revision && (row.source==="instance"||row.source==="order"));
  const chosen=selectable.filter(row=>selected.includes(key(row)));
  const execute=async (targets:TodoEntry[],action:"mark_processed"|"refresh")=>{
    if(busy||!targets.length)return;
    setBusy(true);setResults([]);
    const output:{key:string;number:string;ok:boolean;message:string}[]=[];
    try {
      for(const [index,row] of targets.entries()) {
        if(!mounted.current)break;
        setProgress(`${index+1} / ${targets.length}`);
        try {
          const result=await processManualProduct(row,action,action==="refresh"?"重新获取上游信息（仅查询）":reason.trim(),crypto.randomUUID());
          const facts=result.facts;
          const summary=facts?`上游状态：${powerNames[facts.PowerStatus]??"状态未知"}；到期时间：${facts.ExpiresAt?new Date(facts.ExpiresAt).toLocaleString("zh-CN",{timeZone:"Asia/Shanghai"}):"未返回"}。`:"";
          output.push({key:key(row),number:row.number,ok:result.outcome!=="unavailable",message:summary+result.message});
        } catch(error) {output.push({key:key(row),number:row.number,ok:false,message:getApiMessage(error)});}
        if(mounted.current)setResults([...output]);
      }
    } finally {
      await Promise.all([cache.invalidateQueries({queryKey:["admin-todos"]}),cache.invalidateQueries({queryKey:["admin-todo-items","manual-products"]})]);
      if(mounted.current){setBusy(false);setProgress("");setConfirm([]);setSelected([]);}
    }
  };
  const open=(targets:TodoEntry[])=>{setReason("");setConfirm(targets);};
  return {
    header:enabled?<Checkbox aria-label="选择本页前20项" disabled={busy} checked={selectable.length>0&&selectable.slice(0,20).every(row=>selected.includes(key(row)))} onCheckedChange={checked=>setSelected(checked?selectable.slice(0,20).map(key):[])}/>:null,
    checkbox:(row:TodoEntry)=>enabled?<Checkbox aria-label={`选择事项 ${row.number}`} disabled={busy||!row.revision||(!selected.includes(key(row))&&chosen.length>=20)} checked={selected.includes(key(row))} onCheckedChange={checked=>setSelected(current=>checked?[...current,key(row)]:current.filter(value=>value!==key(row)))}/>:null,
    actions:(row:TodoEntry)=>enabled?<div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={busy||!row.revision} onClick={()=>open([row])}>标记已处理</Button><Button size="sm" variant="ghost" disabled={busy||!row.revision} onClick={()=>void execute([row],"refresh")}>重新获取</Button></div>:<Text variant="secondary">历史记录</Text>,
    toolbar:<>{enabled?<LayerCard className="flex flex-wrap items-center gap-3 p-4"><Text>已选择 {chosen.length} 项（最多20项）</Text><Button variant="secondary" disabled={busy||!chosen.length} onClick={()=>open(chosen)}>批量处理</Button><Button variant="secondary" disabled={busy||!chosen.length} onClick={()=>void execute(chosen,"refresh")}>批量重新获取</Button>{busy?<Text>处理中 {progress}</Text>:null}</LayerCard>:null}{results.length?<LayerCard className="grid gap-3 p-4"><Text variant="heading">处理结果</Text>{results.map(result=><Banner key={result.key} variant={result.ok?"default":"error"} title={result.number} description={result.message}/>)}</LayerCard>:null}</>,
    dialog:<Dialog.Root open={confirm.length>0} onOpenChange={value=>{if(!value&&!busy)setConfirm([]);}}><Dialog className="grid gap-4 p-6"><Dialog.Title>标记已处理</Dialog.Title><Dialog.Description>确认这 {confirm.length} 项事项已人工处理完成后，将从待处理列表移除，原始异常和操作记录保留。</Dialog.Description><Input label="处理说明" value={reason} maxLength={256} onChange={event=>setReason(event.target.value)} disabled={busy}/><div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={()=>setConfirm([])}>取消</Button><Button loading={busy} disabled={!reason.trim()||busy} onClick={()=>void execute(confirm,"mark_processed")}>确认标记已处理</Button></div></Dialog></Dialog.Root>
  };
}
