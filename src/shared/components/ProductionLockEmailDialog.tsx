import {useState} from 'react';
import {Banner,LayerDialog,Switch} from '@cloudflare/kumo';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import type {InstanceListItem} from '../api/console';
import {instanceManagementApi} from '../api/instanceManagement';
import {getApiMessage} from '../api/request';
import {instanceConfirmationActions} from './InstanceConfirmationActions';
import {EmailVerificationFields,useEmailVerification} from './EmailVerificationFields';

export function ProductionLockEmailDialog({instance,customerId}:{instance:InstanceListItem;customerId?:string}){
 const client=useQueryClient();const api=instanceManagementApi(instance.id,customerId);
 const [open,setOpen]=useState(false);
 const [step,setStep]=useState<'verify'|'confirm'>('verify');
 const enabled=!!instance.productionLocked;const title=`${enabled?'解除':'开启'}生产锁`;
 const status=useQuery({queryKey:['production-lock-email',customerId||'self',instance.id],queryFn:()=>api.productionLockEmail(),enabled:open,staleTime:0,retry:false});
 const verification=useEmailVerification({status:status.data,statusLoading:status.isLoading,statusError:status.error?getApiMessage(status.error):undefined,send:email=>api.sendProductionLockEmail(!enabled,email).then(()=>undefined)});
 const save=useMutation({mutationFn:()=>api.productionLock(!enabled,verification.needsBinding?verification.email.trim():undefined,verification.code.join('')),onSuccess:async()=>{
  await Promise.all([client.invalidateQueries({queryKey:['instances']}),client.invalidateQueries({queryKey:['instance-live-status']}),client.invalidateQueries({queryKey:['production-lock-email']}),client.invalidateQueries({queryKey:['auth']}),...(customerId?[client.invalidateQueries({queryKey:['admin','customer-instance',customerId,instance.id]})]:[])]);setOpen(false);
 },onError:()=>{setStep('verify');}});
 const close=(value:boolean)=>{if(save.isPending||verification.sending)return;setOpen(value);if(!value){verification.reset();setStep('verify');save.reset();}};
 return <LayerDialog.Root open={open} dismissDisabled={save.isPending||verification.sending} onOpenChange={close}>
  <Switch checked={enabled} label={enabled?'已开启':'未开启'} aria-label={`${title} ${instance.name}`} disabled={instance.readOnly||save.isPending} onCheckedChange={()=>{verification.reset();setStep('verify');save.reset();setOpen(true);}}/>
  <LayerDialog.Content>
   <LayerDialog.Title>{step==='confirm'?`确认${title}`:verification.needsBinding?'绑定邮箱并验证身份':`邮箱验证 · ${title}`}</LayerDialog.Title>
   <LayerDialog.Description>{step==='confirm'?(enabled?'解除后将恢复服务器写操作，请再次确认。':'开启后禁止开关机、重启、VNC、转让和重装等操作。手动续费与自动续费仍可正常使用。'):verification.needsBinding?'当前账号尚未绑定邮箱，请在此输入邮箱并获取验证码，确认操作时完成绑定。':'开启和解除生产锁均需验证绑定邮箱，请获取六位验证码。'}</LayerDialog.Description>
   <LayerDialog.Body><div className="grid gap-4">
    {step==='verify'?<EmailVerificationFields state={verification} idPrefix={`lock-email-${instance.id}`} autoFocus onCodeChange={()=>save.reset()}/>:<p className="text-kumo-subtle">{verification.needsBinding?'确认后将验证邮箱并完成绑定，再更新生产锁。':'确认后将校验验证码并更新生产锁。'}</p>}
    {save.error&&<Banner variant="error" title={getApiMessage(save.error)}/>}
   </div></LayerDialog.Body>
   {instanceConfirmationActions({destructive:step==='confirm'&&enabled,loading:save.isPending,disabled:verification.sending||status.isFetching||!status.data||(step==='verify'&&!verification.ready),onConfirm:()=>{if(step==='verify')setStep('confirm');else save.mutate();},children:step==='verify'?'继续':`确认${title}`})}
  </LayerDialog.Content>
 </LayerDialog.Root>;
}
