import { Dialog } from "./Dialog";
import { VideoCameraIcon } from '@phosphor-icons/react';
import { Banner, Button, Input, LayerCard, Select, Switch, Table, Tabs, Textarea } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { videoApi, type VideoBinding, type VideoConfig, type VideoPlatform } from '../api/video';
import { pointsApi } from '../api/points';
import { getApiMessage } from '../api/request';
import { PageHeader } from './PageHeader';
import { PageState } from './PageState';
import { ConfirmAction } from './ConfirmAction';
const platformNames:Record<string,string>={douyin:'抖音',kuaishou:'快手',bilibili:'B站',xiaohongshu:'小红书'};
const states:Record<string,string>={unknown:'等待关注确认',followed:'已关注',unfollowed:'已取关'};
export function VideoBindings({admin=false}:{admin?:boolean}) {
 const client=useQueryClient();const [message,setMessage]=useState('');const [tab,setTab]=useState('platforms');const [page,setPage]=useState(1);
 const [edit,setEdit]=useState<VideoPlatform>();const [form,setForm]=useState<VideoConfig>();
 const [binding,setBinding]=useState<VideoPlatform>();const [identity,setIdentity]=useState('');const [nickname,setNickname]=useState('');
 const [review,setReview]=useState<VideoBinding>();const [notes,setNotes]=useState('');
 const platforms=useQuery({queryKey:['video',admin,'platforms'],queryFn:()=>videoApi.platforms(admin),refetchInterval:5000});
 const rows=useQuery({queryKey:['video',admin,'bindings',page],queryFn:()=>videoApi.bindings(admin,page),refetchInterval:admin?false:5000});
 const rules=useQuery({queryKey:['points','rules'],queryFn:pointsApi.rules,enabled:!admin});
 const previous=useRef<Record<string,boolean>>({});useEffect(()=>{for(const row of rows.data?.list??[]){if(!admin&&previous.current[row.id]===false&&row.awarded){setMessage(`关注已确认，本次规则奖励 ${row.awardedPoints} 积分；对应任务请前往任务中心领取。`);void client.invalidateQueries({queryKey:['points']})}previous.current[row.id]=row.awarded}},[rows.data,client,admin]);
 const refresh=()=>client.invalidateQueries({queryKey:['video']});
 const action=useMutation({mutationFn:async(fn:()=>Promise<unknown>)=>fn(),onSuccess:()=>{setMessage('操作成功');setEdit(undefined);setForm(undefined);setBinding(undefined);setReview(undefined);setIdentity('');setNotes('');void refresh()},onError:e=>setMessage(getApiMessage(e))});
 const authorize=useMutation({mutationFn:videoApi.authorize,onSuccess:({url})=>{const target=new URL(url);if(target.origin==='https://open.douyin.com')window.location.assign(url);else setMessage('授权地址无效')},onError:e=>setMessage(getApiMessage(e))});
 const beginEdit=(p:VideoPlatform)=>{setEdit(p);setForm({enabled:p.enabled,mode:p.mode,appId:'',secret:'',officialId:p.officialId??'',scope:p.scope??'user_info',callbackUrl:p.callbackUrl.startsWith('https://')?p.callbackUrl:'',officialUrl:p.officialUrl,notes:p.notes})};
 const result=new URLSearchParams(window.location.search).get('result');
 return <div className="grid gap-5">
  <PageHeader title={admin?'视频平台管理':'绑定视频平台'} description="绑定账号并关注官方账号可获得规则积分。解绑不扣回积分；同一平台账号不重复领奖。" />
  {message&&<Banner title={message} variant="default"/>}
  {!admin&&result&&<Banner title={result==='bound'?'授权绑定成功，请关注官方账号等待确认':'授权未完成，请重新尝试或联系管理员核对应用权限'} variant={result==='bound'?'default':'error'}/>}
  {!admin&&<div className="flex gap-4"><Link to="/console/points">积分明细</Link><Link to="/console/points/tasks">任务中心</Link></div>}
  {admin&&<Tabs value={tab} onValueChange={setTab} tabs={[{value:'platforms',label:'平台配置'},{value:'bindings',label:'绑定记录'}]}/>}
  <PageState loading={platforms.isLoading||rows.isLoading} error={platforms.error?getApiMessage(platforms.error):rows.error?getApiMessage(rows.error):null}>
  {(!admin||tab==='platforms')&&<div className="grid gap-4 lg:grid-cols-2">{platforms.data?.map(p=>{const bound=rows.data?.list.find(b=>b.platform===p.code);const rewards=rules.data?.filter(r=>r.enabled&&r.event===p.event)??[];return <LayerCard key={p.code} className="grid gap-4 px-5 py-4">
   <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2"><VideoCameraIcon aria-hidden="true" size={20}/>{p.name}</h2><span>{p.enabled?(p.ready?'已开启':'已开启 · 配置后可用'):'未开放'}</span></div>
   <p>{p.capability}</p>
   {p.officialUrl&&<a href={p.officialUrl} target="_blank" rel="noopener noreferrer">查看官方账号</a>}
   {admin?<><p>AppID：{p.appConfigured?'已加密配置':'未配置'} · Secret：{p.secretConfigured?'已加密配置，不回显':'未配置'}</p><p className="break-all">{p.callbackUrl}</p><div className="flex gap-2"><Button variant="secondary" onClick={()=>void navigator.clipboard.writeText(p.callbackUrl).then(()=>setMessage('回调地址已复制'),()=>setMessage('复制失败，请手动复制地址'))}>复制回调地址</Button><Button onClick={()=>beginEdit(p)}>编辑</Button></div></>:<>
    <p>{rewards.length?rewards.map(r=>`${r.name}：${r.type==='fixed'?r.pointsFixed+' 积分':'按规则计算'}`).join('；'):'当前未配置规则奖励，可查看任务中心是否有对应任务。'}</p>
    {bound&&!bound.unboundAt?<><p>{bound.nickname||bound.identity} · {states[bound.status]}</p><p>绑定于 {new Date(bound.boundAt).toLocaleString()}</p><p>{bound.awarded?`关注事件已处理，规则奖励 ${bound.awardedPoints} 积分`:'尚未发放关注奖励'}</p><div className="flex gap-2">{p.mode==='api_check'&&<Button onClick={()=>action.mutate(()=>videoApi.check(bound.id))}>检查关注状态</Button>}<ConfirmAction title="解绑视频账号" description="解绑不扣回已发积分；重新绑定原账号不重复发分。" loading={action.isPending} onConfirm={()=>action.mutate(()=>videoApi.unbind(bound.id))}>解绑</ConfirmAction></div></>:<Button disabled={!p.enabled||!p.ready} loading={authorize.isPending} onClick={()=>{if(p.mode==='webhook'){authorize.mutate(p.code)}else{setBinding(p);setIdentity(bound?.identity??'');setNickname(bound?.nickname??'')}}}>{p.mode==='webhook'?'前往抖音授权':'提交账号等待核验'}</Button>}
   </>}
  </LayerCard>})}</div>}
  {admin&&tab==='bindings'&&<><LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row>{['平台 / 客户','账号 / 昵称','关注状态','绑定 / 解绑时间','积分 / 审核依据','操作'].map(x=><Table.Head key={x}>{x}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{rows.data?.list.map(b=><Table.Row key={b.id}><Table.Cell>{platformNames[b.platform]} / #{b.userId}</Table.Cell><Table.Cell>{b.identity}<p>{b.nickname}</p></Table.Cell><Table.Cell>{b.unboundAt?'已解绑':states[b.status]}</Table.Cell><Table.Cell>{new Date(b.boundAt).toLocaleString()}<p>{b.unboundAt?new Date(b.unboundAt).toLocaleString():'—'}</p></Table.Cell><Table.Cell>{b.awarded?`${b.awardedPoints} 积分`:'未发放'}<p>{b.reviewNotes}</p></Table.Cell><Table.Cell><div className="flex gap-2">{!b.unboundAt&&<><Button disabled={(b.awarded&&b.status==="followed")||platforms.data?.find(p=>p.code===b.platform)?.mode!=='manual'} onClick={()=>{setReview(b);setNotes('')}}>人工审核通过</Button><ConfirmAction title="解绑账号" description="保留领奖历史与积分流水，不扣回积分。" onConfirm={()=>action.mutate(()=>videoApi.unbind(b.id,true))}>解绑</ConfirmAction></>}</div></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard><div className="flex gap-3"><Button disabled={page===1} onClick={()=>setPage(page-1)}>上一页</Button><span>第 {page} 页，共 {rows.data?.total??0} 条</span><Button disabled={page*30>=(rows.data?.total??0)} onClick={()=>setPage(page+1)}>下一页</Button></div></>}
  </PageState>
  <Dialog.Root open={Boolean(edit)} onOpenChange={v=>{if(!v){setEdit(undefined);setForm(undefined)}}}><Dialog className="grid max-h-[85vh] gap-4 overflow-y-auto p-8"><Dialog.Title>编辑{edit?.name}</Dialog.Title>{action.isError&&<Banner variant="error" title={message}/>}{form&&<><Switch label="启用平台" checked={form.enabled} onCheckedChange={enabled=>setForm({...form,enabled})}/><Select label="校验方式" value={form.mode} onValueChange={v=>setForm({...form,mode:v??'manual'})} items={edit?.code==='douyin'?{webhook:'抖音签名回调',manual:'人工审核'}:edit?.code==='xiaohongshu'?{manual:'人工审核'}:{manual:'人工审核',api_check:'API 校验（能力受限，暂不发分）'}}/><Input label="AppID / ClientKey（留空保留）" value={form.appId} onChange={e=>setForm({...form,appId:e.target.value})}/><Input type="password" autoComplete="new-password" label="AppSecret / ClientSecret（留空保留）" value={form.secret} onChange={e=>setForm({...form,secret:e.target.value})}/><Input label="官方账号 open_id（抖音关注目标）" value={form.officialId} onChange={e=>setForm({...form,officialId:e.target.value})}/><Input label="OAuth scope（需平台已批准）" value={form.scope} onChange={e=>setForm({...form,scope:e.target.value})}/><Input label="公网 HTTPS 回调地址（手动模式可留空）" value={form.callbackUrl} onChange={e=>setForm({...form,callbackUrl:e.target.value})}/><Input label="官方账号主页 HTTPS 链接" value={form.officialUrl} onChange={e=>setForm({...form,officialUrl:e.target.value})}/><Textarea label="备注" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><p>凭据 AES-GCM 加密，不回显。抖音 OAuth 回调将自动使用 /api/v1/video/oauth/callback/douyin。</p><Button loading={action.isPending} onClick={()=>action.mutate(()=>videoApi.save(edit!.code,form))}>保存</Button></>}</Dialog></Dialog.Root>
  <Dialog.Root open={Boolean(binding)} onOpenChange={v=>{if(!v)setBinding(undefined)}}><Dialog className="grid gap-4 p-8"><Dialog.Title>绑定{binding?.name}账号</Dialog.Title>{action.isError&&<Banner variant="error" title={message}/>}<Dialog.Description>填写平台 UID / 账号标识，仅提交核验申请，不会立即发放积分。需核验账号归属及关注状态。同平台绑定历史保留，仅可重绑原账号。</Dialog.Description><Input label="平台 UID / 账号标识" value={identity} onChange={e=>setIdentity(e.target.value)}/><Input label="昵称（可选）" value={nickname} onChange={e=>setNickname(e.target.value)}/><Button disabled={!identity.trim()} loading={action.isPending} onClick={()=>action.mutate(()=>videoApi.bind(binding!.code,identity,nickname))}>提交核验申请</Button></Dialog></Dialog.Root>
  <Dialog.Root open={Boolean(review)} onOpenChange={v=>{if(!v)setReview(undefined)}}><Dialog className="grid gap-4 p-8"><Dialog.Title>人工审核关注</Dialog.Title><Dialog.Description>请核对账号归属和关注官方账号的证据，再发放积分。重复审核不会重复发分。</Dialog.Description><Textarea label="核验依据（必填）" value={notes} onChange={e=>setNotes(e.target.value)}/><Button disabled={!notes.trim()} loading={action.isPending} onClick={()=>action.mutate(()=>videoApi.approve(review!.id,notes))}>审核通过并发放</Button></Dialog></Dialog.Root>
 </div>
}
