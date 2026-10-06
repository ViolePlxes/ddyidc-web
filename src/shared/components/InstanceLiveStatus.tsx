import { Button } from '@cloudflare/kumo';
import { MachineStatusBadge } from './MachineStatusBadge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { instanceManagementApi } from '../api/instanceManagement';
import { pollInstanceOperation } from '../utils/instancePolling';
import { getApiMessage } from '../api/request';
export interface LiveInstanceStatus {status:number;powerStatus:string;rawStatus?:string;syncedAt?:string;warning?:string}
const labels:Record<string,string>={running:'运行中',on:'运行中',stopped:'已关机',off:'已关机',starting:'开机中',stopping:'关机中',rebooting:'重启中',reinstalling:'重装中',operating:'操作中',provisioning:'开通中',migrating:'迁移中',fault:'故障',suspended:'已暂停',expired:'已到期',deleted:'已删除',unknown:'状态未知'};
const busyStates=new Set(['starting','stopping','rebooting','reinstalling','operating','provisioning','migrating']);
export function useInstanceStatus(instanceId:string,customerId:string|undefined,enabled:boolean,refreshDetail:()=>unknown){
 const client=useQueryClient();const key=['instance-live-status',customerId||'self',instanceId];
 const callback=useRef(refreshDetail);callback.current=refreshDetail;
 const run=useRef<AbortController|null>(null);
 const [timeoutMessage,setTimeoutMessage]=useState('');
 const query=useQuery({queryKey:key,queryFn:({signal})=>instanceManagementApi(instanceId,customerId).status(signal),enabled,retry:false,refetchInterval:false,refetchOnWindowFocus:false,refetchOnReconnect:false});
 useEffect(()=>{setTimeoutMessage('');return()=>{run.current?.abort();run.current=null}},[instanceId,customerId]);
 const afterAction=(action:string)=>{
  const power=({start:'starting',stop:'stopping',reboot:'rebooting',reinstall:'reinstalling'} as Record<string,string>)[action];
  if(!power)return;
  run.current?.abort();
  const controller=new AbortController();run.current=controller;
  setTimeoutMessage('');
  void client.cancelQueries({queryKey:key,exact:true});
  client.setQueryData<LiveInstanceStatus>(key,{status:2,powerStatus:power});
  void pollInstanceOperation(action,controller,{
   read:()=>instanceManagementApi(instanceId,customerId).status(controller.signal),
   update:status=>client.setQueryData(key,status),
   complete:()=>{void callback.current()},
   timeout:()=>setTimeoutMessage('状态获取超时，请手动刷新'),
  }).finally(()=>{if(run.current===controller)run.current=null});
 };
 const refetch=async()=>{run.current?.abort();run.current=null;setTimeoutMessage('');return query.refetch()};
 return {...query,refetch,afterAction,busy:busyStates.has(query.data?.powerStatus||''),message:timeoutMessage||(query.error?getApiMessage(query.error):query.data?.warning)};
}
export function InstanceStatusControl({live,fallback}:{live:ReturnType<typeof useInstanceStatus>;fallback?:string}){
 const power=live.data?.powerStatus||fallback||'unknown';
 return <div className="grid gap-2"><div className="flex flex-wrap items-center gap-2"><MachineStatusBadge status={power} label={labels[power]||'状态未知'}/><Button size="sm" variant="secondary" aria-label="刷新实例状态" loading={live.isFetching} disabled={live.isFetching} onClick={()=>void live.refetch()}>刷新</Button></div>{live.message&&<span role="status" className="text-xs text-kumo-subtle">{live.message}</span>}</div>;
}
