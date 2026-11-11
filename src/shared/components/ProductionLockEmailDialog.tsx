import {useEffect,useState} from 'react';
import {Banner,Button,Input,LayerDialog,Switch} from '@cloudflare/kumo';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import type {InstanceListItem} from '../api/console';
import {instanceManagementApi} from '../api/instanceManagement';
import {getApiMessage} from '../api/request';
import {instanceConfirmationActions} from './InstanceConfirmationActions';
import {EmailVerificationCode} from './EmailVerificationCode';

export function ProductionLockEmailDialog({instance,customerId}:{instance:InstanceListItem;customerId?:string}){
 const client=useQueryClient();const api=instanceManagementApi(instance.id,customerId);
 const [open,setOpen]=useState(false);const [email,setEmail]=useState('');
 const [step,setStep]=useState<'verify'|'confirm'>('verify');const [sent,setSent]=useState(false);
 const [seconds,setSeconds]=useState(0);const [code,setCode]=useState(Array<string>(6).fill(''));
 const enabled=!!instance.productionLocked;const title=`${enabled?'解除':'开启'}生产锁`;
 const status=useQuery({queryKey:['production-lock-email',customerId||'self',instance.id],queryFn:api.productionLockEmail,enabled:open,staleTime:0,retry:false});
 const needsBinding=status.data?.hasEmail===false;
 useEffect(()=>{if(!seconds)return;const t=setTimeout(()=>setSeconds(seconds-1),1000);return()=>clearTimeout(t);},[seconds]);
 const send=useMutation({mutationFn:()=>api.sendProductionLockEmail(!enabled,needsBinding?email.trim():undefined),onSuccess:()=>{setSent(true);setSeconds(60);setCode(Array<string>(6).fill(''));}});
 const save=useMutation({mutationFn:()=>api.productionLock(!enabled,needsBinding?email.trim():undefined,code.join('')),onSuccess:async()=>{
  await Promise.all([client.invalidateQueries({queryKey:['instances']}),client.invalidateQueries({queryKey:['instance-live-status']}),client.invalidateQueries({queryKey:['production-lock-email']}),client.invalidateQueries({queryKey:['auth']}),...(customerId?[client.invalidateQueries({queryKey:['admin','customer-instance',customerId,instance.id]})]:[])]);setOpen(false);
 },onError:()=>{setStep('verify');}});
 const close=(value:boolean)=>{if(save.isPending||send.isPending)return;setOpen(value);if(!value){setEmail('');setSent(false);setSeconds(0);setCode(Array<string>(6).fill(''));setStep('verify');send.reset();save.reset();}};
 const canSend=!!status.data&&!status.isFetching&&(!needsBinding||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
 return <LayerDialog.Root open={open} dismissDisabled={save.isPending||send.isPending} onOpenChange={close}>
  <Switch checked={enabled} label={enabled?'已开启':'未开启'} aria-label={`${title} ${instance.name}`} disabled={instance.readOnly||save.isPending} onCheckedChange={()=>{setEmail('');setSent(false);setSeconds(0);setCode(Array<string>(6).fill(''));setStep('verify');send.reset();save.reset();setOpen(true);}}/>
  <LayerDialog.Content>
   <LayerDialog.Title>{step==='confirm'?`确认${title}`:needsBinding?'绑定邮箱并验证身份':`邮箱验证 · ${title}`}</LayerDialog.Title>
   <LayerDialog.Description>{step==='confirm'?(enabled?'解除后将恢复服务器写操作，请再次确认。':'开启后禁止开关机、重启、VNC、转让和重装等操作。手动续费与自动续费仍可正常使用。'):needsBinding?'当前账号尚未绑定邮箱，请在此输入邮箱并获取验证码，确认操作时完成绑定。':'开启和解除生产锁均需验证绑定邮箱，请获取六位验证码。'}</LayerDialog.Description>
   <LayerDialog.Body><div className="grid gap-4">
    {status.isLoading&&<p role="status">正在读取邮箱状态…</p>}
    {step==='verify'&&status.data&&<>
     {needsBinding?<><label htmlFor={`lock-email-${instance.id}`} className="font-medium">邮箱地址</label><Input id={`lock-email-${instance.id}`} type="email" autoFocus value={email} disabled={sent||send.isPending} placeholder="请输入邮箱地址" onChange={e=>setEmail(e.target.value)}/></>:<p>验证邮箱：{status.data.emailHint}</p>}
     <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-kumo-subtle">{sent?'验证码10分钟内有效':'验证码仅用于本次操作'}</span><Button variant="secondary" disabled={!canSend||seconds>0} loading={send.isPending} onClick={()=>{save.reset();send.mutate();}}>{seconds>0?`${seconds} 秒后重新发送`:sent?'重新发送验证码':'发送验证码'}</Button></div>
     {sent&&<EmailVerificationCode value={code} onChange={value=>{setCode(value);save.reset();}}/>}
    </>}
    {step==='confirm'&&<p className="text-kumo-subtle">{needsBinding?'确认后将验证邮箱并完成绑定，再更新生产锁。':'确认后将校验验证码并更新生产锁。'}</p>}
    {(status.error||send.error||save.error)&&<Banner variant="error" title={getApiMessage(status.error||send.error||save.error)}/>}
   </div></LayerDialog.Body>
   {instanceConfirmationActions({destructive:step==='confirm'&&enabled,loading:save.isPending,disabled:send.isPending||status.isFetching||!status.data||(step==='verify'&&(!sent||code.some(d=>!d))),onConfirm:()=>{if(step==='verify')setStep('confirm');else save.mutate();},children:step==='verify'?'继续':`确认${title}`})}
  </LayerDialog.Content>
 </LayerDialog.Root>;
}