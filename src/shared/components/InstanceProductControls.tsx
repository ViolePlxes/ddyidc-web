import { Banner, Button, ButtonGroup, DropdownMenu, LayerDialog, Select } from '@cloudflare/kumo';
import { CaretDownIcon } from '@phosphor-icons/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consoleApi, type InstanceListItem, type InstanceActionInput } from '../api/console';
import { instanceManagementApi } from '../api/instanceManagement';
import { getApiMessage } from '../api/request';
import { transfersApi } from '../api/transfers';

export function InstanceSetting({ instance, kind, customerId }: { instance: InstanceListItem; kind: 'lock' | 'auto'; customerId?: string }) {
 const [open,setOpen]=useState(false);
 const client=useQueryClient();
 const api=instanceManagementApi(instance.id,customerId);
 const enabled=kind==='lock' ? !!instance.productionLocked : !!instance.autoRenew;
 const options=useQuery({queryKey:['renewal-options',customerId||'self',instance.id],queryFn:api.options,enabled:open&&kind==='auto'&&!enabled,retry:false});
 const [cycle,setCycle]=useState('');
 const selected=options.data?.items.find(q=>q.cycle===(cycle||options.data.currentCycle));
 const save=useMutation({mutationFn:()=>kind==='lock'?api.productionLock(!enabled):api.auto(!enabled,selected?.quoteRevision,selected?.cycle),onSuccess:async()=>{
  await Promise.all([client.invalidateQueries({queryKey:['instances']}),client.invalidateQueries({queryKey:['instance-live-status']}),...(customerId?[client.invalidateQueries({queryKey:['admin','customer-instance',customerId,instance.id]})]:[])]);setOpen(false);
 }});
 const title=kind==='lock'?`${enabled?'解除':'开启'}生产锁`:`${enabled?'关闭':'开启'}自动续费`;
 return <LayerDialog.Root open={open} onOpenChange={v=>{if(!save.isPending){setOpen(v);save.reset();setCycle('');}}}>
  <Button variant="secondary" size="sm" aria-label={`${kind==='lock'?'生产锁':'自动续费'} ${instance.name} ${enabled?'已开启':'未开启'}`} disabled={instance.readOnly||(kind==='auto'&&(instance.productionLocked||instance.status===6))} onClick={()=>setOpen(true)}>{enabled?'已开启':'未开启'}</Button>
  <LayerDialog.Content><LayerDialog.Title>{title}</LayerDialog.Title>
   <LayerDialog.Description>{kind==='lock'?(enabled?'解除后将恢复服务器操作，请确认由你本人操作。':'开启后禁止开关机、重启、VNC、转让、重装、续费等全部写操作，须手动解除后恢复。'):enabled?'关闭后将不再自动续费，到期将停机，请及时手动续费。':'到期前1天按所选周期创建续费订单，经报价和余额校验后扣费。余额不足不扣费、不续费，并通知充值，到期前每15分钟重试；价格变化须重新确认。'}</LayerDialog.Description>
   <LayerDialog.Body><div className="grid gap-3">
    {kind==='auto'&&!enabled&&<><Select label="自动续费周期" value={cycle||options.data?.currentCycle||''} items={Object.fromEntries((options.data?.items??[]).map(q=>[q.cycle,`${q.label||q.cycle} · ¥${q.amount}`]))} onValueChange={v=>setCycle(v||'')} /><p>默认使用原购买时长。确认扣费金额：{selected?`¥${selected.amount}`:'正在读取核验报价…'}</p></>}
    {(save.error||options.error)&&<Banner variant="error" title={getApiMessage(save.error||options.error)} />}
   </div></LayerDialog.Body>
   <LayerDialog.Actions><Button variant="secondary" disabled={save.isPending} onClick={()=>setOpen(false)}>取消</Button><Button loading={save.isPending} disabled={kind==='auto'&&!enabled&&(!selected||options.isFetching||options.isError)} onClick={()=>save.mutate()}>确认{title}</Button></LayerDialog.Actions>
  </LayerDialog.Content>
 </LayerDialog.Root>;
}

const operations=[['transfer','转让实例'],['start','开机'],['stop','关机'],['reboot','重启'],['hard_stop','硬关机'],['hard_reboot','硬重启'],['remote','VNC'],['reinstall','重装系统'],['renew','续费']] as const;
export function InstanceActions({instance}:{instance:InstanceListItem}) {
 const navigate=useNavigate();const client=useQueryClient();
 const [menu,setMenu]=useState(false);const [pending,setPending]=useState<InstanceActionInput['action']>();
 const [notice,setNotice]=useState('');
 const remoteWindow=useRef<Window|null>(null);
 const detail=useQuery({queryKey:['instances',instance.id],queryFn:()=>consoleApi.instance(instance.id),enabled:menu,retry:false,staleTime:0});
 const transfer=useQuery({queryKey:['transfers','status',instance.id],queryFn:()=>transfersApi.status(instance.id),enabled:menu,retry:false});
 const data=detail.data;
 const locked=instance.productionLocked||data?.productionLocked;
 const cap=data?.capabilities;
 const power=data?.powerStatus?.toLowerCase()||instance.powerStatus?.toLowerCase();
 const busy=['starting','stopping','rebooting','reinstalling','operating','provisioning','migrating'].includes(power||'');
 const disabled=(key:string)=>{
  if(locked||instance.readOnly||detail.isFetching||!data||busy||data.status===6)return true;
  if(key==='transfer')return !transfer.data?.enabled||transfer.isFetching||!!transfer.data.trading||!!transfer.data.transferring;
  if(key==='start')return !cap?.start||['running','on'].includes(power||'')||data.status===3;
  if(key==='stop'||key==='hard_stop')return !(key==='stop'?cap?.stop:cap?.hardStop)||['stopped','off'].includes(power||'')||data.status===4;
  if(key==='reboot'||key==='hard_reboot')return !(key==='reboot'?cap?.reboot:cap?.hardReboot)||data.status===4;
  if(key==='remote')return !cap?.remote;
  if(key==='reinstall')return !cap?.reinstall;
  return false;
 };
 const action=useMutation({mutationFn:(input:InstanceActionInput)=>consoleApi.instanceAction(instance.id,input),onSuccess:async(result)=>{
  if(result.remote){const url=new URL(result.remote.url,window.location.origin);if(!result.remote.url.startsWith('/')||result.remote.url.startsWith('//')||url.origin!==window.location.origin||url.pathname!==`/console/instance/${encodeURIComponent(instance.id)}/vnc`){remoteWindow.current?.close();setNotice('远程会话地址无效');return;}remoteWindow.current?.location.replace(`${url.pathname}${url.search}`);}
  setNotice(result.message||'操作已提交');setPending(undefined);await client.invalidateQueries({queryKey:['instances']});
 },onError:()=>remoteWindow.current?.close(),onSettled:()=>{remoteWindow.current=null;}});
 return <div className="grid gap-1"><ButtonGroup aria-label={`管理 ${instance.name}`}>
  <Button variant="secondary" size="sm" onClick={()=>navigate(`/console/instances/${instance.id}`)}>控制台</Button>
  <DropdownMenu onOpenChange={setMenu}><DropdownMenu.Trigger render={<Button variant="secondary" size="sm" shape="square" disabled={action.isPending} aria-label={`更多操作 ${instance.name}`}><CaretDownIcon /></Button>} /><DropdownMenu.Content>
   {operations.map(([key,label])=><DropdownMenu.Item key={key} disabled={disabled(key)} onClick={()=>{
    if(key==='remote'){const target=window.open('about:blank','_blank');if(!target){setNotice('请允许弹出窗口后重试');return;}target.opener=null;remoteWindow.current=target;action.mutate({action:'remote'});return;}
    if(['transfer','reinstall','renew'].includes(key)){navigate(`/console/instances/${instance.id}?action=${key}`);return;}
    action.reset();setPending(key as InstanceActionInput['action']);
   }}>{label}</DropdownMenu.Item>)}
  </DropdownMenu.Content></DropdownMenu>
 </ButtonGroup>{notice&&<span role="status" className="text-sm text-kumo-subtle">{notice}</span>}{detail.error&&<span role="alert">{getApiMessage(detail.error)}</span>}
 <LayerDialog.Root open={!!pending} onOpenChange={v=>{if(!v&&!action.isPending)setPending(undefined)}}><LayerDialog.Content><LayerDialog.Title>确认{operations.find(([key])=>key===pending)?.[1]}</LayerDialog.Title><LayerDialog.Description>{pending?.startsWith('hard_')?'将强制断电，可能丢失数据或损坏文件系统。请确认可以中断业务。':'请确认可以中断当前业务，然后执行服务器操作。'}</LayerDialog.Description><LayerDialog.Body>{action.error&&<Banner variant="error" title={getApiMessage(action.error)} />}</LayerDialog.Body><LayerDialog.Actions><Button variant="secondary" disabled={action.isPending} onClick={()=>setPending(undefined)}>取消</Button><Button disabled={!!locked||!pending} loading={action.isPending} onClick={()=>{if(pending)action.mutate({action:pending})}}>确认执行</Button></LayerDialog.Actions></LayerDialog.Content></LayerDialog.Root>
 </div>;
}
