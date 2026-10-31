import { SMSReceiptQuery } from "./SMSReceiptQuery";
import { Pagination } from "../../../shared/components/Pagination";
import { adminPath } from "../../../shared/utils/adminEntry";
import { Badge } from "../../../shared/components/Badge";
import { Banner, Button, Input, LayerCard, LayerDialog, Loader,  Select, Table } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { digestAdmin, type DigestTask } from '../../../shared/api/notifyAdmin';
import { getApiMessage } from '../../../shared/api/request';
import { DateRangeField } from '../../../shared/components/DateField';
import { NotificationContent } from '../../../shared/components/NotificationContent';
import { Dialog } from '../../../shared/components/Dialog';
import { PageHeader } from '../../../shared/components/PageHeader';

const statuses: Record<string,string> = {pending:'等待发送', sending:'发送中', submitted:'服务商已接收', delivered:'已送达', failed:'失败', unknown:'结果待核对', skipped:'已跳过', canceled:'已取消', not_submitted:'确认未提交', retry_approved:'重试已批准', collected:'已合并', settings_changed:'配置变更', sms_template_apply:'短信模板申请'};
const timestamp = (value?: string) => value ? new Date(value).toLocaleString('zh-CN', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}) : '未记录';

export function NotificationTasks() {
 const cache = useQueryClient();
 const [filters,setFilters] = useState({customerId:'',instanceId:'',channel:'',status:'',from:'',to:''});
 const [page,setPage] = useState(1);const [selected,setSelected] = useState<DigestTask>();
 const [previewTask,setPreviewTask] = useState<DigestTask>();
 const [action,setAction] = useState<'enable'|'disable'|'apply'|'resolve'|'retry'>();const [reason,setReason] = useState('');const [result,setResult] = useState('submitted');const [requestId,setRequestId] = useState('');
 const summary=useQuery({queryKey:['notification-summary'],queryFn:digestAdmin.summary,refetchInterval:15000,refetchIntervalInBackground:false});
 const tasks=useQuery({queryKey:['notification-tasks',filters,page],queryFn:()=>digestAdmin.tasks({...filters,page}),refetchInterval:15000,refetchIntervalInBackground:false});
 const detail=useQuery({queryKey:['notification-detail',selected?.id],queryFn:()=>digestAdmin.detail(selected!.id),enabled:!!selected,refetchInterval:15000,refetchIntervalInBackground:false});
 const refresh=async()=>{await Promise.all([cache.invalidateQueries({queryKey:['notification-summary']}),cache.invalidateQueries({queryKey:['notification-tasks']}),cache.invalidateQueries({queryKey:['notification-detail']})]);};
 const operation=useMutation({mutationFn:async()=>{if(action==='retry'&&detail.data)await digestAdmin.retry(detail.data.task,reason);else if(action==='apply')await digestAdmin.applySMS(reason);else if(action==='enable'||action==='disable')await digestAdmin.settings(true,action==='enable',reason);else if(action==='resolve'&&detail.data)await digestAdmin.resolve(detail.data.task,result,reason,requestId);},onSuccess:async()=>{setAction(undefined);setReason('');await refresh();}});
 const diagnostics=useMutation({mutationFn:digestAdmin.diagnostics});
 const check=useMutation({mutationFn:digestAdmin.checkSMS,onSuccess:refresh});
 const error=summary.error??tasks.error??detail.error??operation.error??check.error??diagnostics.error;
 let application: {status?:string;code?:string;content?:string;error?:string}={};try{application=JSON.parse(summary.data?.smsApplication||'{}') as typeof application;}catch{/* Invalid server metadata is left unrendered. */}
 const updateFilter=(key:keyof typeof filters,value:string)=>{setFilters({...filters,[key]:value});setPage(1);};
 const openAction=(next:typeof action)=>{operation.reset();setReason('');setAction(next);};
 return <>
  <PageHeader title="通知任务" description="同一用户每天一行，邮件与短信合并展示；各渠道分别记录结果和计划发送时间。" actions={<Button variant="secondary" onClick={()=>void refresh()}>刷新</Button>} />
  {error&&<Banner variant="error" title="操作未完成" description={getApiMessage(error)} />}
  {diagnostics.data&&<Banner title="邮件连接正常" description={`DNS、TLS 和 SMTP 认证已通过；未发送邮件。检查时间：${timestamp(diagnostics.data.checkedAt)}`} />}
  <LayerCard >
   <LayerCard.Secondary><div className="flex flex-wrap items-center gap-3"><h2 className="font-semibold">到期汇总通知</h2><Badge>{summary.data?.settings.dispatchEnabled?'自动发送已开启':'自动发送未开启'}</Badge><Link to={adminPath('/admin/system')}>通知配置</Link></div></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
   <p className="text-base text-kumo-subtle">未来 72 小时到期；每天 09:00（上海时间）汇总，同一用户每种通道每天最多一次。页面可见时每 15 秒刷新。</p>
   <p>当前范围：{summary.data?.settings.allCustomers?'所有用户':`测试用户 18631428991（${summary.data?.settings.customerId??'读取中'}）`}</p>
   <div className="grid gap-3 md:grid-cols-3"><span>邮件：{summary.data?.emailReady?'已配置，需核对投递':'配置后可用'}</span><span>到期短信：{summary.data?.smsReady?'已配置':'模板审核或配置后可用'}</span><span>审核状态：{({pending:'审核中',approved:'已通过',rejected:'未通过',unknown:'申请结果待核对',applying:'申请中'} as Record<string,string>)[application.status??'']??'未申请'}</span></div>
   {application.code&&<p>短信模板：{application.code}</p>}{application.content&&<p className="break-words text-base">模板正文：{application.content}</p>}{application.error&&<Banner title="短信模板状态" description={application.error} />}
   <div className="flex flex-wrap gap-3"><Button variant="secondary" loading={diagnostics.isPending} onClick={()=>diagnostics.mutate()}>检查 SMTP 连接</Button><Button variant="secondary" disabled={summary.isPending} onClick={()=>openAction(summary.data?.settings.dispatchEnabled?'disable':'enable')}>{summary.data?.settings.dispatchEnabled?'暂停自动发送':'开启当前范围自动发送'}</Button><Button variant="secondary" disabled={!!application.status} onClick={()=>openAction('apply')}>提交阿里云模板审核</Button><Button variant="secondary" loading={check.isPending} disabled={!application.code&&!summary.data?.smsTemplateCode} onClick={()=>check.mutate()}>查询审核结果</Button></div>
  </LayerCard.Primary></LayerCard>
  {diagnostics.data&&<Banner title="邮件连接正常" description={`DNS、TLS 和 SMTP 认证已通过；未发送邮件。检查时间：${timestamp(diagnostics.data.checkedAt)}`} />}
  <LayerCard ><LayerCard.Secondary><h2 className="font-semibold">运行状态</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4"><div className="grid gap-3 md:grid-cols-3"><span>最近扫描：{timestamp(summary.data?.scan.finishedAt)}</span><span>下次扫描：{timestamp(summary.data?.scan.nextScanAt)}</span><span>扫描间隔：5 分钟 · 发送检查：30 秒</span><span>扫描实例：{summary.data?.scan.scanned??0}</span><span>新增渠道明细：{summary.data?.scan.generated??0}</span><span>扫描结果：{summary.data?.scan.error||'暂无错误记录'}</span></div><div className="flex flex-wrap gap-3">{summary.data?.counts?.map(row=><Badge key={row.status}>{statuses[row.status]??row.status}：{row.count}</Badge>)}</div></LayerCard.Primary></LayerCard>
  {diagnostics.data&&<Banner title="邮件连接正常" description={`DNS、TLS 和 SMTP 认证已通过；未发送邮件。检查时间：${timestamp(diagnostics.data.checkedAt)}`} />}
  <LayerCard className="grid gap-4 px-4 py-3"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Input label="客户编号" value={filters.customerId} onChange={e=>updateFilter('customerId',e.target.value)} /><Input label="实例编号" value={filters.instanceId} onChange={e=>updateFilter('instanceId',e.target.value)} /><Select label="通道" value={filters.channel} items={{'':'全部',email:'邮件',sms:'短信'}} onValueChange={value=>updateFilter('channel',value??'')} /><Select label="状态" value={filters.status} items={{'':'全部',...statuses}} onValueChange={value=>updateFilter('status',value??'')} /><DateRangeField label="通知日期范围" from={filters.from} to={filters.to} onValueChange={(from,to)=>{setFilters(current=>({...current,from,to}));setPage(1);}} /></div></LayerCard>
  <LayerCard className="overflow-x-auto"><Table><Table.Header><Table.Row>{['客户 ID / 真实姓名','通知日期','邮件','短信'].map(label=><Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{tasks.data?.items?.map(group=><Table.Row key={`${group.customerId}:${group.notifyDate}`}><Table.Cell><div className="flex flex-wrap gap-2"><span>{group.customerId}</span><span>{group.realName||'未实名'}</span></div></Table.Cell><Table.Cell>{group.notifyDate}</Table.Cell>{['email','sms'].map(channel=>{const task=group.channels.find(item=>item.channel===channel);return <Table.Cell key={channel}>{task?<div className="grid gap-2"><div><button type="button" className="cursor-pointer rounded-sm underline decoration-dotted underline-offset-4 hover:text-kumo-strong" title={`查看${channel==='email'?'邮件':'短信'}内容`} onClick={()=>setPreviewTask(task)}><Badge>{statuses[task.status]??task.status}</Badge></button> · {task.count} 台</div><p className="text-base whitespace-nowrap">{['pending','sending'].includes(task.status)?'准备发送':'计划发送'}：{timestamp(task.scheduledAt)}（上海时间）</p><p className="text-base">最早到期：{timestamp(task.earliestExpiry)}</p><p className="max-w-xs break-words text-base">{task.error||task.target||'发送前核对收件信息'}</p><Button variant="ghost" size="sm" onClick={()=>setSelected(task)}>查看{channel==='email'?'邮件':'短信'}明细</Button></div>:<span className="text-kumo-subtle">无任务</span>}</Table.Cell>;})}</Table.Row>)}</Table.Body></Table>{tasks.isPending?<div className="p-5"><Loader /></div>:!tasks.data?.items.length?<p className="p-5">暂无汇总任务。历史发送记录仍可在系统配置中查看。</p>:null}</LayerCard>
  <Pagination page={page} totalCount={tasks.data?.total??0} perPage={20} setPage={setPage} />
  <Dialog.Root open={!!selected} onOpenChange={open=>{if(!open)setSelected(undefined);}}><Dialog className="w-full max-w-4xl"><Dialog.Title>通知批次明细</Dialog.Title><Dialog.Description>“服务商已接收”代表提交成功；实际送达需要服务商回执确认。</Dialog.Description>{detail.isPending?<Loader />:detail.data&&<div className="grid gap-4"><div className="flex flex-wrap gap-3">{detail.data.channels.map(task=><Button key={task.id} variant="secondary" onClick={()=>setSelected(task)}>{task.channel==='email'?'邮件':'短信'} · {statuses[task.status]??task.status}</Button>)}</div><p>每天发送名额：{detail.data.quotaReserved?'已占用':'未占用'} · 尝试：{detail.data.task.attempts} 次</p><p className="break-words">服务商编号：{detail.data.task.requestId||'未记录'} · {detail.data.task.error}</p><div className="overflow-x-auto"><Table><Table.Header><Table.Row>{['实例 / 产品','IP','到期时间','明细状态'].map(label=><Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{detail.data.items.map(item=><Table.Row key={item.id}><Table.Cell>{item.instanceNo}<div>{item.productName}</div></Table.Cell><Table.Cell>{item.primaryIp||'未记录'}</Table.Cell><Table.Cell>{timestamp(item.expiresAt)}</Table.Cell><Table.Cell>{statuses[item.status]??item.status}<p className="text-base">{item.reason}</p></Table.Cell></Table.Row>)}</Table.Body></Table></div>{detail.data.task.channel==='sms'&&detail.data.task.requestId&&['submitted','success'].includes(detail.data.task.status)?<SMSReceiptQuery id={detail.data.task.id} source="tasks"/>:null}<h3 className="font-medium">发送与操作记录</h3>{detail.data.attempts.length?detail.data.attempts.map(attempt=><p key={attempt.id} className="break-words text-base">{timestamp(attempt.createdAt)} · {statuses[attempt.status]??attempt.status} · {attempt.notes||attempt.error||attempt.requestId||'已记录'}</p>):<p>未记录</p>}{['unknown','failed'].includes(detail.data.task.status)&&<Button variant="secondary" onClick={()=>openAction('resolve')}>登记人工核对结果</Button>}{detail.data.task.status==='failed'&&detail.data.task.attempts<3&&<Button variant="secondary" onClick={()=>openAction('retry')}>重试已确认未提交任务</Button>}</div>}<Dialog.Close render={<Button variant="secondary" />}>关闭</Dialog.Close></Dialog></Dialog.Root>
  <Dialog.Root open={!!action} onOpenChange={open=>{if(!open&&!operation.isPending)setAction(undefined);}}><Dialog className="w-full max-w-lg"><Dialog.Title>{action==='apply'?'提交短信模板审核':action==='resolve'?'登记服务商核对结果':'变更自动发送状态'}</Dialog.Title><Dialog.Description>{action==='apply'?'使用已保存的阿里云账户和签名提交汇总到期模板。审核通过前不会自动发送到期短信。':action==='resolve'?'请先核对服务商发送记录。登记结果不会再次发送消息。':'变更只作用于页面显示的用户范围。每用户每天每通道最多一次。'}</Dialog.Description><div className="grid gap-4">{action==='resolve'&&<><Select label="已核对结果" value={result} items={{submitted:'服务商已接收',not_submitted:'确认未提交',canceled:'取消任务'}} onValueChange={value=>setResult(value??'submitted')} /><Input label="服务商请求编号" value={requestId} onChange={e=>setRequestId(e.target.value)} /></>}<Input label="操作原因 / 核对依据" value={reason} onChange={e=>setReason(e.target.value)} />{operation.error&&<Banner variant="error" title="操作失败" description={getApiMessage(operation.error)} />}<div className="flex flex-wrap justify-end gap-3"><Button variant="secondary" disabled={operation.isPending} onClick={()=>setAction(undefined)}>取消</Button><Button loading={operation.isPending} disabled={!reason.trim()} onClick={()=>operation.mutate()}>确认操作</Button></div></div></Dialog></Dialog.Root>
  <LayerDialog.Root open={!!previewTask} onOpenChange={open=>{if(!open)setPreviewTask(undefined);}}>
   <LayerDialog.Content size="lg" closeLabel="关闭">
    <LayerDialog.Title>{previewTask?.channel==='email'?'邮件':'短信'}通知内容</LayerDialog.Title>
    <LayerDialog.Description>该批次的接收目标、发送状态与内容快照，仅后台可见。</LayerDialog.Description>
    <LayerDialog.Body>
     {previewTask?<>
      <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm">
       <dt className="text-kumo-subtle">渠道</dt><dd>{previewTask.channel==='email'?'邮件':'短信'}</dd>
       <dt className="text-kumo-subtle">结果</dt><dd>{statuses[previewTask.status]??previewTask.status}</dd>
       <dt className="text-kumo-subtle">接收目标</dt><dd className="break-all">{previewTask.target||'未记录'}</dd>
       <dt className="text-kumo-subtle">机器数量</dt><dd>{previewTask.count} 台</dd>
       <dt className="text-kumo-subtle">计划发送</dt><dd>{timestamp(previewTask.scheduledAt)}（上海时间）</dd>
       <dt className="text-kumo-subtle">最早到期</dt><dd>{timestamp(previewTask.earliestExpiry)}</dd>
       <dt className="text-kumo-subtle">批次编号</dt><dd className="break-all">{previewTask.id}</dd>
       {previewTask.error?<><dt className="text-kumo-subtle">错误</dt><dd className="break-all">{previewTask.error}</dd></>:null}
      </dl>
      <div className="mt-4 grid gap-2"><p className="text-sm font-medium">内容</p><div className="max-h-80 overflow-auto"><NotificationContent html={previewTask.contentSnapshot} /></div></div>
     </>:null}
    </LayerDialog.Body>
   </LayerDialog.Content>
  </LayerDialog.Root>
 </>;
}
