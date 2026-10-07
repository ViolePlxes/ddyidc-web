import { Dialog } from './Dialog';
import { Banner, Button, Input, LayerCard, Select } from '@cloudflare/kumo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminRequest, userRequest, getApiMessage, type ApiEnvelope } from '../api/request';

interface SecurityRule { id: string; direction: string; protocol: string; port: string; ip: string }
interface SecurityGroup { id: string; name: string; description: string; applied: boolean; state: string; rules: SecurityRule[] }
interface SecurityCommand { action: string; groupId?: string; requestId?: string; name?: string; description?: string; rule?: SecurityRule }

export function InstanceSecurityGroups({instanceId, customerId}:{instanceId:string; customerId?:string}) {
  const client = customerId ? adminRequest : userRequest;
  const path = customerId ? `/customers/${customerId}/instances/${instanceId}/security-groups` : `/instance/${instanceId}/security-groups`;
  const key = ['instance-security-groups',customerId || 'user',instanceId];
  const cache=useQueryClient();
  const [name,setName]=useState(''); const [description,setDescription]=useState('');
  const [groupId,setGroupId]=useState('');
  const [direction,setDirection]=useState('in'); const [protocol,setProtocol]=useState('tcp');
  const [port,setPort]=useState('22'); const [ip,setIp]=useState('');
  const groups=useQuery({queryKey:key,queryFn:async()=>(await client.get<ApiEnvelope<{items:SecurityGroup[]}>>(path,{timeout:35000})).data.data,retry:false});
  const save=useMutation({mutationFn:async(input:SecurityCommand)=>client.post(path,{...input,requestId:input.requestId || crypto.randomUUID()},{timeout:35000}),retry:false,onSuccess:async()=>{await cache.invalidateQueries({queryKey:key});setName('');},onError:async()=>{await cache.invalidateQueries({queryKey:key});}});
  return <div className="grid gap-4">
    <LayerCard className="grid gap-4 p-6">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">安全组</h2><Button variant="secondary" loading={groups.isFetching} onClick={()=>void groups.refetch()}>刷新</Button></div>
      <p className="text-kumo-subtle">安全组需应用后生效。应用前请添加所需的 SSH、远程桌面和业务端口规则。</p>
      {groups.isPending ? <p role="status">正在加载安全组…</p> : null}
      {groups.error ? <Banner variant="error">{getApiMessage(groups.error)}</Banner> : null}
      {save.error ? <Banner variant="error">{getApiMessage(save.error)}</Banner> : null}
      <div className="grid gap-4 md:grid-cols-2"><Input label="安全组名称" value={name} maxLength={80} onChange={e=>setName(e.target.value)}/><Input label="描述" value={description} maxLength={255} onChange={e=>setDescription(e.target.value)}/></div>
      <div><Button disabled={!name.trim() || save.isPending || groups.isError || Boolean(groups.data?.items.some(group=>group.state==='unknown'))} loading={save.isPending} onClick={()=>save.mutate({action:'create',name,description,requestId:crypto.randomUUID()})}>创建安全组</Button></div>
      {groups.data?.items.length===0 ? <p className="text-kumo-subtle">此实例尚未创建安全组。</p> : null}
    </LayerCard>
    {groups.data?.items.map(group=><LayerCard key={group.id} className="grid gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{group.name}{group.applied ? ' · 已应用' : ''}</h3><p className="text-kumo-subtle">{group.description}</p></div><div className="flex flex-wrap gap-2">
        <Dialog.Root><Dialog.Trigger render={<Button variant="secondary" disabled={save.isPending || group.applied || group.state!=='active'}>应用</Button>}/><Dialog className="grid gap-4 p-6"><Dialog.Title>应用安全组</Dialog.Title><Dialog.Description>此操作会替换当前实例应用的安全组，请确认登录和业务端口已放行。</Dialog.Description><div className="flex justify-end gap-2"><Dialog.Close render={<Button variant="secondary">取消</Button>}/><Dialog.Close render={<Button onClick={()=>save.mutate({action:'apply',groupId:group.id})}>确认应用</Button>}/></div></Dialog></Dialog.Root>
        <Dialog.Root><Dialog.Trigger render={<Button variant="secondary" disabled={save.isPending || group.applied || group.state!=='active'}>删除</Button>}/><Dialog className="grid gap-4 p-6"><Dialog.Title>删除安全组</Dialog.Title><Dialog.Description>确认删除此安全组及其规则？</Dialog.Description><div className="flex justify-end gap-2"><Dialog.Close render={<Button variant="secondary">取消</Button>}/><Dialog.Close render={<Button onClick={()=>save.mutate({action:'delete',groupId:group.id})}>确认删除</Button>}/></div></Dialog></Dialog.Root>
      </div></div>
      {group.state!=='active' ? <Banner variant="error">操作结果待核对，请联系管理员。请勿重复提交。</Banner> : null}
      {(group.rules || []).map(rule=><div key={rule.id} className="flex flex-wrap items-center justify-between gap-2"><span>{rule.direction==='in'?'入站':'出站'} · {rule.protocol} · {rule.port} · {rule.ip}</span><Dialog.Root><Dialog.Trigger render={<Button variant="secondary" disabled={save.isPending || group.state!=='active'}>删除规则</Button>}/><Dialog className="grid gap-4 p-6"><Dialog.Title>删除安全组规则</Dialog.Title><Dialog.Description>删除后可能中断登录或业务访问，请确认该规则不再需要。</Dialog.Description><div className="flex flex-wrap justify-end gap-3"><Dialog.Close render={<Button variant="secondary">取消</Button>}/><Dialog.Close render={<Button onClick={()=>save.mutate({action:'delete_rule',groupId:group.id,rule})}>确认删除</Button>}/></div></Dialog></Dialog.Root></div>)}
      <Button variant="secondary" disabled={save.isPending || group.state!=='active'} onClick={()=>setGroupId(group.id)}>添加规则</Button>
      {groupId===group.id ? <div className="grid gap-4 md:grid-cols-2"><Select label="方向" value={direction} items={{in:'入站',out:'出站'}} onValueChange={v=>setDirection(v || 'in')}/><Select label="协议" value={protocol} items={{tcp:'TCP',udp:'UDP',icmp:'ICMP',gre:'GRE',all_tcp:'全部 TCP',all_udp:'全部 UDP',all:'全部'}} onValueChange={v=>{setProtocol(v || 'tcp');if(['icmp','gre','all_tcp','all_udp','all'].includes(v||''))setPort('1-65535')}}/><Input label="端口（如 22 或 80-443）" value={port} onChange={e=>setPort(e.target.value)}/><Input label="IP 或网段（CIDR）" value={ip} onChange={e=>setIp(e.target.value)}/><div className="flex flex-wrap gap-2"><Button loading={save.isPending} onClick={()=>save.mutate({action:'add_rule',groupId:group.id,rule:{id:'',direction,protocol,port,ip}})}>保存规则</Button><Button variant="secondary" onClick={()=>setGroupId('')}>取消</Button></div></div> : null}
    </LayerCard>)}
  </div>;
}
