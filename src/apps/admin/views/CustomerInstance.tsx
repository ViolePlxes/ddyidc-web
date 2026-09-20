import { InstanceCredentials, InstanceRemark, InstanceEdit, InstanceRenewal, InstanceOrder } from '../../../shared/components/InstanceManagement';
import { Badge, Banner, Breadcrumbs, Button, Input, LayerCard, Select, Table, Tabs } from '@cloudflare/kumo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { adminInstanceApi } from '../../../shared/api/adminInstance';
import { customerDetailApi } from '../../../shared/api/customerDetail';
import type { InstanceActionInput } from '../../../shared/api/console';
import { getApiMessage } from '../../../shared/api/request';
import { PageState } from '../../../shared/components/PageState';
import { formatDate, cycleLabels } from '../../../shared/utils/format';
import { ActionDialog, ReinstallDialog } from '../../console/views/InstanceConsole';
import { CopyValue, InfoGroup, InstanceMonitoring, configValue } from '../../console/views/instanceDetails';
import { VncConsole } from '../../console/components/VncConsole';

const statuses:Record<number,string>={1:'待开通',2:'开通中',3:'运行中',4:'已停机',5:'已过期',6:'已删除'};
const actions:Record<string,string>={remark:'修改备注',edit:'修改实例',credentials:'查看登录信息',auto_renew:'自动续费设置',renew:'实例续费',import:'导入实例',start:'开机',stop:'关机',reboot:'重启',reset_password:'重置密码',reinstall:'重装系统',remote:'VNC'};
export function CustomerInstanceVnc(){
 const {customerId='',instanceId=''}=useParams();const [search]=useSearchParams();
 const token=search.get('token')||'';
 return token?<VncConsole customerId={customerId} instanceId={instanceId} token={token}/>:<Banner variant="error" title="远程会话无效，请返回产品详情重新发起连接"/>;
}
export function CustomerInstance(){
 const {customerId='',instanceId=''}=useParams();const navigate=useNavigate();const client=useQueryClient();
 const api=useMemo(()=>adminInstanceApi(customerId,instanceId),[customerId,instanceId]);
 const key=['admin','customer-instance',customerId,instanceId];
 const query=useQuery({queryKey:key,queryFn:api.detail,retry:false});
 const profile=useQuery({queryKey:['admin','customers',customerId,'profile'],queryFn:()=>customerDetailApi.profile(customerId)});
 const products=useQuery({queryKey:['admin','customer-instance-options',customerId],queryFn:async()=>{
   const first=await customerDetailApi.records(customerId,'products',1,false);const rows=[...(first.items??[])];
   for(let page=2;rows.length<first.total;page++){const next=await customerDetailApi.records(customerId,'products',page,false);if(!next.items?.length)break;rows.push(...next.items)}return rows;
 }});
 const monitor=useQuery({queryKey:[...key,'monitor'],queryFn:api.monitor,enabled:!!query.data?.capabilities.traffic,retry:false});
 const [tab,setTab]=useState('overview');const [password,setPassword]=useState('');const [notice,setNotice]=useState('');
 const busy=useRef(false);const remoteWindow=useRef<Window|null>(null);
 const action=useMutation({mutationFn:api.action,onSuccess:async(result)=>{
   if(result.remote){const target=new URL(result.remote.url,window.location.origin);const expected=`/admin/customers/${customerId}/instances/${instanceId}/vnc`;
     if(target.origin!==window.location.origin||target.pathname!==expected){remoteWindow.current?.close();throw new Error('远程会话地址无效')}
     if(remoteWindow.current&&!remoteWindow.current.closed)remoteWindow.current.location.replace(target.pathname+target.search);
   }else remoteWindow.current?.close();
   setPassword('');setNotice(result.message||'操作已提交');
   await Promise.all([client.invalidateQueries({queryKey:key}),client.invalidateQueries({queryKey:['admin','customer-records',customerId,'products']})]);
 },onError:()=>remoteWindow.current?.close(),onSettled:()=>{busy.current=false;remoteWindow.current=null}});
 function submit(input:InstanceActionInput){
   if(busy.current)return;
   if(input.action==='remote'){const target=window.open('about:blank','_blank');if(!target){setNotice('请允许弹出窗口后重试');return}target.opener=null;remoteWindow.current=target}
   busy.current=true;setNotice('');action.mutate(input);
 }
 const item=query.data;const caps=item?.capabilities;
 const reset=<ActionDialog label="重置密码" title="重置实例密码" description="密码至少 12 位，包含大小写字母和数字。此操作会改变实例登录凭据。" disabled={!caps?.resetPassword} loading={action.isPending} onConfirm={()=>submit({action:'reset_password',password})}><Input label="新密码" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></ActionDialog>;
 const reinstall=<ReinstallDialog key={instanceId} instanceId={instanceId} currentPort={query.data?.port} scope={`admin-${customerId}`} loadImages={api.images} disabled={!caps?.reinstall} loading={action.isPending} onConfirm={submit}/>;
 const config=(fields:string[],names:string[]=[])=>item?configValue(item,fields,names):'—';
 const listPath=`/admin/customers/${customerId}/products`;
 return <div className="grid gap-5">
  <Breadcrumbs><Breadcrumbs.Link href="/admin/customers">客户管理</Breadcrumbs.Link><Breadcrumbs.Separator/><Breadcrumbs.Link href={`/admin/customers/${customerId}`}>{profile.data?.name||`客户 #${customerId}`}</Breadcrumbs.Link><Breadcrumbs.Separator/><Breadcrumbs.Link href={listPath}>产品信息</Breadcrumbs.Link><Breadcrumbs.Separator/><Breadcrumbs.Current>产品管理</Breadcrumbs.Current></Breadcrumbs>
  <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">{item?.productName||'产品管理'}</h1><p className="text-sm text-kumo-subtle">{item?.name||instanceId}</p></div><div className="flex flex-wrap gap-2"><Select label="切换产品" value={instanceId} items={Object.fromEntries((products.data??[]).map(p=>[p.id,`#${p.number} · ${p.name}`]))} onValueChange={id=>{if(id){setTab('overview');setNotice('');setPassword('');action.reset();navigate(`/admin/customers/${customerId}/instances/${id}`)}}} disabled={action.isPending}/><Button variant="secondary" loading={query.isFetching} disabled={action.isPending} onClick={()=>void query.refetch()}>刷新状态</Button><Link className="text-kumo-link hover:underline self-center" to={listPath}>返回产品列表</Link></div></div>
  <Tabs value={tab} onValueChange={setTab} variant="underline" tabs={[{value:'overview',label:'产品概览'},{value:'config',label:'产品配置'},{value:'monitor',label:'监控'},{value:'logs',label:'操作日志'}]}/>
  <PageState loading={query.isLoading} error={query.error?getApiMessage(query.error):null} skeleton="detail">
   {item&&<>
    {item.warning&&<Banner variant="alert" title="实时信息提示" description={item.warning}/>}
    {notice&&<Banner title="操作结果" description={notice}/>}
    {action.error&&<Banner variant="error" title="操作失败" description={getApiMessage(action.error)}/>}
    {tab==='overview'&&<div className="grid items-start gap-5 xl:grid-cols-2">
     <div className="grid gap-5"><InfoGroup title="基础信息" action={<InstanceEdit key={item.id} instance={item} customerId={customerId}/>} rows={[
      {label:'所属客户',value:<Link className="text-kumo-link hover:underline" to={`/admin/customers/${customerId}`}>{profile.data?.name||`#${customerId}`}</Link>},
      {label:'产品名称',value:item.productName},{label:'实例编号',value:item.name},{label:'状态',value:<Badge variant={item.status===3?'success':'secondary'}>{statuses[item.status]||item.status}</Badge>},
      {label:'电源状态',value:({on:'运行中',off:'已关机',operating:'操作中',pending:'待开通',fault:'异常',running:'运行中',stopped:'已关机',starting:'启动中',stopping:'关机中',unknown:'未知'} as Record<string,string>)[item.powerStatus||'']||item.powerStatus||'—'},{label:'模块类型',value:item.moduleType||'—'},{label:'上游实例 ID',value:item.upstreamInstanceId||'—'},
      {label:'备注信息',value:<InstanceRemark key={instanceId} instance={item} customerId={customerId}/>},{label:'数据中心',value:config(['data_center','region'],['数据中心','区域'])},{label:'创建时间',value:formatDate(item.createdAt)},{label:'开通时间',value:item.activatedAt?formatDate(item.activatedAt):'—'},
     ]}/><InfoGroup title="财务信息" rows={[
      {label:'计费周期',value:cycleLabels[item.billingCycle||'']||item.billingCycle||'—'},{label:'到期时间',value:item.expiresAt?formatDate(item.expiresAt):'—'},
      {label:'关联订单',value:<InstanceOrder instance={item} customerId={customerId}/>},
     ]}/><LayerCard className="grid gap-4 p-5"><h2 className="text-lg font-semibold">续费管理</h2><InstanceRenewal key={item.id} instance={item} customerId={customerId}/></LayerCard></div>
     <div className="grid gap-5"><LayerCard className="grid gap-4 p-5"><h2 className="text-lg font-semibold">实例操作</h2><p className="text-sm text-kumo-subtle">支持的操作由实例能力决定，执行结果与操作人员记录到实例日志。</p><div className="flex flex-wrap gap-2">
      {(['start','stop','reboot'] as const).map(op=><ActionDialog key={op} label={actions[op]??op} title={`确认${actions[op]}`} description={op==='start'?'将启动该实例。':'操作可能中断客户业务，请确认后继续。'} disabled={!caps?.[op]} loading={action.isPending} onConfirm={()=>submit({action:op})}/>)}
      {reset}{reinstall}<Button variant="secondary" disabled={!caps?.remote||action.isPending} onClick={()=>submit({action:'remote'})}>VNC</Button>
     </div>{!Object.values(caps??{}).some(Boolean)&&<p className="text-sm text-kumo-subtle">配置后可用：当前实例没有已就绪的操作通道。</p>}</LayerCard>
     <InfoGroup title="登录与系统" rows={[{label:'公网 IP',value:<CopyValue value={item.primaryIp} label="公网 IP"/>},{label:'主机名',value:item.hostname||'—'},{label:'系统',value:item.currentImageName||item.operatingSystem||'—'},{label:'密码',value:<InstanceCredentials key={instanceId} instance={item} customerId={customerId}/>},{label:item.portIsDefault?'端口（默认）':'端口',value:item.port?<CopyValue value={item.port} label="端口"/>:'服务未提供有效端口'},{label:'用户名',value:item.username?<CopyValue value={item.username} label="用户名"/>:'服务未提供'}]}/>
     <InfoGroup title="资源规格" columns={3} rows={[{label:'CPU',value:config(['cpu'],['CPU','vCPU'])},{label:'内存',value:config(['memory'],['内存'])},{label:'系统盘',value:config(['system_disk'],['系统盘'])},{label:'数据盘',value:config(['data_disk'],['数据盘'])},{label:'带宽',value:config(['bandwidth'],['带宽'])},{label:'网络类型',value:config(['network'],['网络类型'])}]}/></div>
    </div>}
    {tab==='config'&&<LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>配置项</Table.Head><Table.Head>配置值</Table.Head></Table.Row></Table.Header><Table.Body>{item.config.length?item.config.map(c=><Table.Row key={c.id}><Table.Cell>{c.displayName}</Table.Cell><Table.Cell>{c.displayValue}</Table.Cell></Table.Row>):<Table.Row><Table.Cell colSpan={2}>此产品没有额外选配项</Table.Cell></Table.Row>}</Table.Body></Table></LayerCard>}
    {tab==='monitor'&&<InstanceMonitoring monitor={monitor.data} loading={monitor.isLoading} error={monitor.error?getApiMessage(monitor.error):undefined}/>}
    {tab==='logs'&&<LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>时间</Table.Head><Table.Head>操作</Table.Head><Table.Head>状态</Table.Head><Table.Head>说明</Table.Head></Table.Row></Table.Header><Table.Body>{item.events.length?item.events.map(e=><Table.Row key={e.id}><Table.Cell>{formatDate(e.createdAt)}</Table.Cell><Table.Cell>{actions[e.type]||e.type}</Table.Cell><Table.Cell>{e.status===1?'处理中':e.status===2?'成功':'失败'}</Table.Cell><Table.Cell>{e.type==='import'?'已拉取真实实例信息并完成绑定':e.message||'—'}</Table.Cell></Table.Row>):<Table.Row><Table.Cell colSpan={4}>暂无操作记录</Table.Cell></Table.Row>}</Table.Body></Table></LayerCard>}
   </>}
  </PageState>
 </div>;
}
