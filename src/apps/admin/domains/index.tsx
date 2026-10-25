import {Banner,Button,Input,LayerCard,LayerDialog,Link,Switch,Text} from '@cloudflare/kumo';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {domainsAdminApi,type DomainSettings} from '../../../shared/api/domains';
import {getApiMessage} from '../../../shared/api/request';
import {PageHeader} from '../../../shared/components/PageHeader';
import {PageState} from '../../../shared/components/PageState';
import {DomainResult} from '../../console/domains/DomainOperationDialog';

function ImportForm(){
 const cache=useQueryClient();
 const [value,setValue]=useState({customerId:'',domain:'',notes:''});
 const [confirm,setConfirm]=useState(false);
 const mutation=useMutation({mutationFn:()=>domainsAdminApi.importAsset({...value,confirmed:true}),onSuccess:async()=>{setConfirm(false);await cache.invalidateQueries({queryKey:['admin','domains']})}});
 const valid=/^[1-9]\d*$/.test(value.customerId)&&value.domain.trim().length>3&&value.notes.trim().length>=2;
 return <><form className="grid gap-4" onSubmit={e=>{e.preventDefault();if(valid)setConfirm(true)}}>
  <Text variant="secondary">仅导入注册商账户中已存在的域名。系统会核对域名信息并记录管理员审计，不会重新注册、过户或扣费。</Text>
  <div className="grid gap-4 md:grid-cols-3">{([['customerId','客户编号'],['domain','完整域名'],['notes','导入说明']] as const).map(([key,label])=><Input key={key} label={label} required value={value[key]} onChange={e=>{setValue(old=>({...old,[key]:e.target.value}));mutation.reset()}}/>)}</div>
  {mutation.isSuccess?<Banner title={`已导入 ${mutation.data.domain}`}/>:null}
  <Button type="submit" variant="secondary" disabled={!valid||mutation.isPending} className="justify-self-start">导入已有域名</Button>
 </form><LayerDialog.Root open={confirm} dismissDisabled={mutation.isPending} onOpenChange={setConfirm}><LayerDialog.Content>
  <LayerDialog.Title>确认域名归属</LayerDialog.Title><LayerDialog.Description>将 {value.domain} 绑定给客户 {value.customerId}，该客户将获得域名管理权限。请先核对归属。</LayerDialog.Description>
  <LayerDialog.Body>{mutation.error?<Banner variant="error" title={getApiMessage(mutation.error)}/>:<Text>说明：{value.notes}</Text>}</LayerDialog.Body>
  <LayerDialog.Actions dismissLabel="取消"><LayerDialog.Action loading={mutation.isPending} disabled={mutation.isPending} onClick={()=>mutation.mutate()}>确认导入</LayerDialog.Action></LayerDialog.Actions>
 </LayerDialog.Content></LayerDialog.Root></>;
}

function MarketFeeds(){
 const query=useMutation({mutationFn:domainsAdminApi.feed});
 return <div className="grid gap-4"><Text variant="secondary">交易清单由注册商每日更新。下载清单仅限管理员，包含采购信息；用户查询和购买始终重新获取实时销售报价。</Text><div className="flex flex-wrap gap-2">{([['market.full','全量清单'],['market.new','昨日新增'],['market.removed','昨日下架']] as const).map(([key,title])=><Button key={key} variant="secondary" disabled={query.isPending} onClick={()=>query.mutate(key)}>{title}</Button>)}</div>{query.error?<Banner variant="error" title={getApiMessage(query.error)}/>:null}{query.data?<Link href={query.data.url} target="_blank" rel="noreferrer noopener">下载交易清单</Link>:null}</div>
}

function SettingsForm({initial}:{initial:DomainSettings}){
 const cache=useQueryClient();const [value,setValue]=useState({...initial,password:'',notes:''});const change=<K extends keyof DomainSettings>(key:K,v:DomainSettings[K])=>setValue(old=>({...old,[key]:v}));
 const save=useMutation({mutationFn:()=>domainsAdminApi.saveSettings(value),onSuccess:()=>cache.invalidateQueries({queryKey:['admin','domains']})});
 return <form className="grid gap-4" onSubmit={event=>{event.preventDefault();save.mutate()}}><Switch label="启用域名服务" checked={value.enabled} onCheckedChange={checked=>change('enabled',checked)}/><div className="grid gap-4 md:grid-cols-2"><Input label="西部数码接口账号" value={value.username} onChange={e=>change('username',e.target.value)} autoComplete="off"/><Input label="API密码" type="password" value={value.password} onChange={e=>change('password',e.target.value)} placeholder={value.passwordSet?'已保存，留空保留原密码':'填写开通后的API密码'} autoComplete="new-password"/><Input label="加价比例（万分比，1000=10%）" type="number" min={0} max={100000} value={String(value.markupBps)} onChange={e=>change('markupBps',Number(e.target.value))}/><Input label="单次服务费（元）" value={value.serviceFee} onChange={e=>change('serviceFee',e.target.value)}/><Input label="核实后的赎回成本（元）" value={value.redemptionCost} onChange={e=>change('redemptionCost',e.target.value)}/><Input label="操作说明" required value={value.notes} onChange={e=>change('notes',e.target.value)}/></div><Text variant="secondary">API密码加密保存且不回显。注册、续费和交易读取实时成本后计算销售价格，报价及平台支付校验通过后才执行采购。</Text>{save.error?<Banner variant="error" title={getApiMessage(save.error)}/>:null}{save.isSuccess?<Banner title="配置已保存"/>:null}<Button type="submit" disabled={value.notes.trim().length<2||save.isPending} loading={save.isPending} className="justify-self-start">保存配置</Button></form>
}
export function AdminDomains(){const settings=useQuery({queryKey:['admin','domains','settings'],queryFn:domainsAdminApi.settings,retry:false});const orders=useQuery({queryKey:['admin','domains','orders'],queryFn:domainsAdminApi.orders,retry:false});return <div className="grid gap-6 text-sm"><PageHeader title="域名服务" description="接口凭据、销售定价及域名订单记录。"/><LayerCard className="grid gap-4 px-5 py-4"><Text as="h2" variant="heading">接口与定价</Text><PageState loading={settings.isLoading} error={settings.error?getApiMessage(settings.error):undefined}>{settings.data?<SettingsForm key={settings.data.revision} initial={settings.data}/>:null}</PageState></LayerCard><LayerCard className="grid gap-4 px-5 py-4"><Text as="h2" variant="heading">导入已有域名</Text><ImportForm/></LayerCard><LayerCard className="grid gap-4 px-5 py-4"><Text as="h2" variant="heading">一口价交易清单</Text><MarketFeeds/></LayerCard><LayerCard className="grid gap-4 px-5 py-4"><Text as="h2" variant="heading">域名订单</Text><PageState loading={orders.isLoading} error={orders.error?getApiMessage(orders.error):undefined} empty={orders.isSuccess&&!orders.data.length} emptyTitle="暂无域名订单"><DomainResult value={orders.data}/></PageState></LayerCard></div>}
