import {Badge,Banner,Button,LayerCard,Link,Text} from '@cloudflare/kumo';
import {ArrowRightIcon,GlobeIcon} from '@phosphor-icons/react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {useLocation} from 'react-router-dom';
import {PageHeader} from '../../../shared/components/PageHeader';
import {PageState} from '../../../shared/components/PageState';
import {getApiMessage} from '../../../shared/api/request';
import {domainsApi,type DomainOperation} from '../../../shared/api/domains';
import {useAuthStore} from '../../../shared/stores/auth';
import {domainBase,domainHref,domainSections,type DomainPage,type DomainSection} from '../../../shared/domains/catalog';
import {DomainOperationDialog,DomainResult,domainStatus} from './DomainOperationDialog';
import {DomainSearchHero} from './DomainSearchHero';
import {DomainTemplatePage} from './DomainTemplatePage';

const emptyOperation:DomainOperation={key:'',write:false,paid:false,scope:'public',fields:[]};
function PageLink({section,page}:{section:DomainSection;page?:DomainPage}){return <LayerCard className="grid content-start gap-3 px-5 py-4"><div className="flex items-center justify-between gap-3"><Text as="h2" variant="heading">{page?.title??section.title}</Text><GlobeIcon aria-hidden size={20}/></div><Text variant="secondary">{page?.description??section.description}</Text><Link href={domainHref(section,page)} className="inline-flex items-center gap-1 justify-self-start">进入管理<ArrowRightIcon aria-hidden size={14}/></Link></LayerCard>}
export function Domains(){
 const user=useAuthStore(state=>state.user);const cache=useQueryClient();const path=useLocation().pathname.replace(/\/$/,'');
 const section=domainSections.find(v=>path===domainHref(v)||path.startsWith(`${domainHref(v)}/`));const sectionLanding=!!section&&path===domainHref(section);
 const page=section?.pages.find(v=>path===domainHref(section,v))??(sectionLanding&&section?.pages.length===1?section.pages[0]:undefined);const overview=path===domainBase;
 const [dialogOpen,setDialogOpen]=useState(false);const [selected,setSelected]=useState<{operation:DomainOperation;title:string}>();const [registerOpen,setRegisterOpen]=useState(false);const [registerParams,setRegisterParams]=useState<Record<string,string>>();const options={enabled:!!user?.id,retry:false,staleTime:30_000};
 const contracts=useQuery({queryKey:['domains',user?.id,'contracts'],queryFn:domainsApi.contracts,...options});
 const assets=useQuery({queryKey:['domains',user?.id,'assets'],queryFn:domainsApi.assets,...options});
 const templates=useQuery({queryKey:['domains',user?.id,'templates'],queryFn:domainsApi.templates,...options});
 const records=useQuery({queryKey:['domains',user?.id,'records'],queryFn:domainsApi.records,...options});
 const orders=useQuery({queryKey:['domains',user?.id,'orders'],queryFn:domainsApi.orders,...options});
 const refresh=()=>cache.invalidateQueries({queryKey:['domains',user?.id]});const reconcile=useMutation({mutationFn:domainsApi.reconcile,onSettled:refresh});
 if(section?.key==='contacts')return <><DomainTemplatePage templates={templates.data??[]} onChanged={()=>void cache.invalidateQueries({queryKey:['domains']})} domain={new URLSearchParams(location.search).get('domain')??undefined}/></>;
 if(overview)return <><DomainSearchHero operation={contracts.data?.find(op=>op.key==='3.1')} onRegister={params=>{setRegisterParams(params);setRegisterOpen(true)}}/><DomainOperationDialog open={registerOpen} operation={contracts.data?.find(op=>op.key==='4.6')??emptyOperation} title="注册域名" assets={assets.data??[]} templates={templates.data??[]} initial={registerParams} onClose={()=>setRegisterOpen(false)}/></>;
 if(!overview&&!sectionLanding&&!page)return <><PageHeader title="页面不存在"/><Link href={domainBase}>返回域名服务</Link></>;
 const error=contracts.error??assets.error??templates.error;const recordRows=records.data?.map(row=>({时间:new Date(row.createdAt).toLocaleString('zh-CN'),域名:row.domain||'信息模板',状态:domainStatus[row.status]??row.status,记录编号:row.id}));
 return <div className="grid gap-6 text-sm">
  <nav aria-label="域名服务位置" className="flex flex-wrap items-center gap-2"><Link href={domainBase}>域名服务</Link>{section?<><span aria-hidden>/</span><Link href={domainHref(section)}>{section.title}</Link></>:null}{page?<><span aria-hidden>/</span><span aria-current="page">{page.title}</span></>:null}</nav>
  <PageHeader title={page?.title??section?.title??'域名服务'} description={page?.description??section?.description??'注册、交易、转入、续费与日常管理。'} actions={<Button variant="secondary" onClick={()=>void refresh()}>刷新</Button>}/>
  {error?<Banner variant="error" title={getApiMessage(error)}/>:null}

  {section&&sectionLanding&&!page?<div className="grid gap-4 md:grid-cols-2">{section.pages.map(v=><PageLink key={v.key} section={section} page={v}/>)}</div>:null}
  {page?<>
   <div className="grid gap-4 md:grid-cols-2">{page.capabilities.map(cap=>{const refs=cap.refs.filter(ref=>ref!=='4.9'&&contracts.data?.some(op=>op.key===ref));return <LayerCard key={cap.title} className="grid content-start gap-3 px-5 py-4"><div className="flex flex-wrap items-center gap-2"><Text as="h2" variant="heading">{cap.title}</Text>{cap.paid?<Badge>订单支付</Badge>:null}</div>{cap.note?<Text variant="secondary">{cap.note}</Text>:null}<div className="flex flex-wrap gap-2">{refs.map(ref=><Button key={ref} variant="secondary" onClick={()=>{const operation=contracts.data?.find(op=>op.key===ref);if(operation){setSelected({operation,title:cap.title});setDialogOpen(true)}}}>{refs.length>1?(ref==='4.4'?'查看列表':'查看详情'):cap.paid?'获取报价':cap.title}</Button>)}{cap.refs.includes('4.9')?<Text variant="secondary">提交实名材料时，系统会在服务端获取上传凭证。</Text>:null}{cap.refs.some(ref=>['market.full','market.new','market.removed'].includes(ref))?<Text variant="secondary">批量交易清单由管理员维护。输入域名可查询实时售价并购买。</Text>:null}</div></LayerCard>})}</div>
   {section?.key==='list'?<PageState loading={assets.isLoading} error={assets.error?getApiMessage(assets.error):undefined} empty={assets.isSuccess&&!assets.data.length} emptyTitle="暂无域名"><DomainResult value={assets.data?.map(v=>({域名:v.domain,状态:domainStatus[v.status]??v.status,到期时间:v.expiresAt?new Date(v.expiresAt).toLocaleString('zh-CN'):'待确认'}))}/></PageState>:null}
   {section?.key==='contacts'?<PageState loading={templates.isLoading} error={templates.error?getApiMessage(templates.error):undefined} empty={templates.isSuccess&&!templates.data.length} emptyTitle="暂无信息模板"><DomainResult value={templates.data?.map(v=>({模板:v.label,编号:v.id,状态:domainStatus[v.status]??v.status}))}/></PageState>:null}
   {section?.key==='tasks'?<><LayerCard className="grid gap-4 px-5 py-4"><Text as="h2" variant="heading">域名订单</Text><PageState loading={orders.isLoading} error={orders.error?getApiMessage(orders.error):undefined} empty={orders.isSuccess&&!orders.data.length} emptyTitle="暂无域名订单"><div className="grid gap-3">{orders.data?.map(order=><div key={order.id} className="flex flex-wrap items-center justify-between gap-3"><Text>{order.domain} · ¥{order.amount} · {domainStatus[order.status]??order.status}</Text><div className="flex flex-wrap gap-3"><Link href={`/console/orders/${order.id}`}>查看订单</Link>{order.status==='submitted'?<Button variant="secondary" size="sm" loading={reconcile.isPending} onClick={()=>reconcile.mutate(order.id)}>核对处理结果</Button>:null}</div></div>)}</div></PageState>{reconcile.error?<Banner variant="error" title={getApiMessage(reconcile.error)}/>:null}</LayerCard><LayerCard className="grid gap-4 px-5 py-4"><Text as="h2" variant="heading">操作记录</Text><PageState loading={records.isLoading} error={records.error?getApiMessage(records.error):undefined} empty={records.isSuccess&&!records.data.length} emptyTitle="暂无操作记录"><DomainResult value={recordRows}/></PageState></LayerCard></>:null}
  </>:null}
  <DomainOperationDialog open={dialogOpen} operation={selected?.operation??emptyOperation} title={selected?.title??'域名操作'} assets={assets.data??[]} templates={templates.data??[]} onClose={()=>setDialogOpen(false)}/>
 </div>
}
