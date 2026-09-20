import { Badge, Button } from '@cloudflare/kumo';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { instanceManagementApi } from '../api/instanceManagement';
import { getApiMessage } from '../api/request';
export interface LiveInstanceStatus {status:number;powerStatus:string;rawStatus?:string;syncedAt?:string;warning?:string}
const labels:Record<string,string>={running:'运行中',on:'运行中',stopped:'已关机',off:'已关机',starting:'开机中',stopping:'关机中',rebooting:'重启中',reinstalling:'重装中',operating:'操作中',provisioning:'开通中',migrating:'迁移中',fault:'故障',suspended:'已暂停',expired:'已到期',deleted:'已删除',unknown:'状态未知'};
const busyStates=new Set(['starting','stopping','rebooting','reinstalling','operating','provisioning','migrating']);
export function useInstanceStatus(instanceId:string,customerId:string|undefined,enabled:boolean,refreshDetail:()=>unknown){
 const client=useQueryClient();const key=['instance-live-status',customerId||'self',instanceId];
 const callback=useRef(refreshDetail);callback.current=refreshDetail;
 const previous=useRef<string|undefined>(undefined);
 const query=useQuery({queryKey:key,queryFn:()=>instanceManagementApi(instanceId,customerId).status(),enabled,retry:false,refetchInterval:q=>q.state.data?.warning||q.state.error?30000:busyStates.has(q.state.data?.powerStatus||'')?5000:30000,refetchIntervalInBackground:false,refetchOnWindowFocus:false});
 useEffect(()=>{previous.current=undefined},[instanceId,customerId]);
 useEffect(()=>{const power=query.data?.powerStatus;if(!power||query.data?.warning)return;if(previous.current&&previous.current!==power&&!busyStates.has(power))void callback.current();previous.current=power},[query.data]);
 const afterAction=(action:string)=>{const power=({start:'starting',stop:'stopping',reboot:'rebooting',reinstall:'reinstalling'} as Record<string,string>)[action];if(power){client.setQueryData<LiveInstanceStatus>(key,{status:2,powerStatus:power});void client.invalidateQueries({queryKey:key,exact:true,refetchType:'none'})}else void query.refetch()};
 return {...query,afterAction,busy:busyStates.has(query.data?.powerStatus||''),message:query.error?getApiMessage(query.error):query.data?.warning};
}
export function InstanceStatusControl({live,fallback}:{live:ReturnType<typeof useInstanceStatus>;fallback?:string}){
 const power=live.data?.powerStatus||fallback||'unknown';
 return <div className="grid gap-2"><div className="flex flex-wrap items-center gap-2"><Badge variant={power==='running'?'success':power==='fault'?'error':'secondary'}>{labels[power]||'状态未知'}</Badge><Button size="sm" variant="secondary" aria-label="刷新实例状态" loading={live.isFetching} disabled={live.isFetching} onClick={()=>void live.refetch()}>刷新</Button></div>{live.message&&<span role="status" className="text-xs text-kumo-subtle">{live.message}</span>}</div>;
}
