import {Banner,Input,LayerDialog,Select,Table,Text} from '@cloudflare/kumo';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {domainsApi,type DomainActionResult,type DomainAsset,type DomainField,type DomainOperation,type DomainQuote,type DomainTemplate} from '../../../shared/api/domains';
import {getApiMessage} from '../../../shared/api/request';
import {DateField} from '../../../shared/components/DateField';

const labels:Record<string,string>={c_date_begin:'模板开始日期',c_date_end:'模板结束日期',g_date_begin:'过户开始日期',g_date_end:'过户结束日期',startime:'开始时间',overtime:'结束时间',limit:'每页条数',page:'页码',pageno:'页码',pagesize:'每页条数',c_status:'初审状态',r_status:'实名状态',g_status:'过户状态',dns_host1:'首选DNS',dns_host2:'备用DNS'};
const values:Record<string,Record<string,string>>={type:{A:'A',AAAA:'AAAA',CNAME:'CNAME',MX:'MX',TXT:'TXT',SRV:'SRV'},line:{'':'默认线路',LTEL:'电信',LCNC:'联通',LMOB:'移动',LEDU:'教育网',LSEO:'搜索引擎'},setdns:{'0':'保留原DNS','1':'使用默认DNS'},c_regtype:{I:'个人',E:'企业'},c_ph_type:{'0':'手机','1':'座机'}};
export const domainStatus:Record<string,string>={pending:'待付款',executing:'处理中',submitted:'已受理',succeeded:'已完成',active:'正常',failed:'处理失败',unknown:'结果待核对',review:'待人工核对',cancelled:'已取消',deleted:'已删除'};
export function DomainResult({value}:{value:unknown}) {
 if(value===undefined||value===null)return null;
 if(typeof value!=='object')return <Text>{String(value)}</Text>;
 const rows=Array.isArray(value)?value:('items' in value&&Array.isArray(value.items)?value.items:null);
 const show=(item:unknown):string=>typeof item==='object'&&item!==null?JSON.stringify(item):String(item??'—');
 const fieldLabels:Record<string,string>={domain:'域名',name:'域名',avail:'可注册状态',amount:'当前价格（元）',renewAmount:'续费价格（元）',status:'状态',rexpiredate:'到期时间',regdate:'注册时间',id:'编号',host:'主机记录',type:'类型',value:'值',ttl:'TTL',domainpwd:'域名管理密码',createdAt:'创建时间',label:'模板名称',operationId:'操作编号'};
 if(rows){if(!rows.length)return <Text variant="secondary">暂无记录</Text>;const columns=Array.from(new Set(rows.flatMap(item=>typeof item==='object'&&item!==null?Object.keys(item):['内容']))).slice(0,8);return <div className="overflow-x-auto"><Table><Table.Header><Table.Row>{columns.map(key=><Table.Head key={key}>{fieldLabels[key]??key}</Table.Head>)}</Table.Row></Table.Header><Table.Body>{rows.map((item,index)=><Table.Row key={index}>{columns.map(key=><Table.Cell key={key}>{show(typeof item==='object'&&item!==null?(item as Record<string,unknown>)[key]:item)}</Table.Cell>)}</Table.Row>)}</Table.Body></Table></div>}
 return <div className="overflow-x-auto"><Table><Table.Body>{Object.entries(value).map(([key,item])=><Table.Row key={key}><Table.Head>{fieldLabels[key]??key}</Table.Head><Table.Cell><span className="break-all">{show(item)}</span></Table.Cell></Table.Row>)}</Table.Body></Table></div>;
}
function FieldControl({field,operation,value,onChange,assets,templates}:{field:DomainField;operation:DomainOperation;value:string;onChange:(value:string)=>void;assets:DomainAsset[];templates:DomainTemplate[]}) {
 const label=(labels[field.key]??field.label)+(field.required?' *':'');
 if(field.key==='file_org')return <Input label={label} type="file" accept="image/png,image/jpeg" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>4*1024*1024){onChange('');event.target.value='';return}const reader=new FileReader();reader.onload=()=>onChange(String(reader.result).split(',')[1]??'');reader.readAsDataURL(file)}}/>;
 if(['c_sysid','templateid','templetid'].includes(field.key))return <Select label={label} value={value} onValueChange={v=>onChange(v??'')} items={Object.fromEntries(templates.map(t=>[t.id,`${t.label} · ${t.id}`]))} placeholder="选择本人的信息模板"/>;
 if(field.key==='domain'&&operation.scope==='owned')return <Select label={label} value={value} onValueChange={v=>onChange(v??'')} items={Object.fromEntries(assets.map(a=>[a.domain,a.domain]))} placeholder="选择本人的域名"/>;
 if(/date_(begin|end)$|^(startime|overtime)$/.test(field.key))return <DateField label={label} value={value.replace(' ','T')} withTime onValueChange={v=>onChange(v.replace('T',' '))}/>;
 const choices=operation.key==='3.12'&&field.key==='val'?{'1':'开启','0':'关闭'}:operation.key==='3.12'&&field.key==='status'?{update:'禁止更新锁',transfer:'禁止转移锁'}:operation.key==='3.38'&&field.key==='val'?{on:'开启',off:'关闭'}:values[field.key];
 if(choices)return <Select label={label} value={value} onValueChange={v=>onChange(v??'')} items={choices} placeholder="请选择"/>;
 return <Input label={label} type={field.secret?'password':field.numeric?'number':'text'} value={value} onChange={event=>onChange(event.target.value)} required={field.required} autoComplete="off"/>;
}
export function DomainOperationDialog({operation,title,assets,templates,onClose}:{operation:DomainOperation;title:string;assets:DomainAsset[];templates:DomainTemplate[];onClose:()=>void}) {
 const cache=useQueryClient();const navigate=useNavigate();const [params,setParams]=useState<Record<string,string>>({});const [requestId,setRequestId]=useState(()=>crypto.randomUUID());const [quote,setQuote]=useState<DomainQuote>();const [result,setResult]=useState<DomainActionResult>();
 const fields=operation.fields.filter(field=>!field.hidden);const [fileError,setFileError]=useState('');
 const action=useMutation({mutationFn:async()=>{const input={action:operation.key,params,requestId,confirmed:true};if(operation.paid){setQuote(await domainsApi.quote(input));return}setResult(await domainsApi.execute(input))},onSettled:()=>cache.invalidateQueries({queryKey:['domains']})});
 const purchase=useMutation({mutationFn:()=>{if(!quote)throw Error('请先获取报价');return domainsApi.createOrder(quote.id)},onSuccess:async value=>{await cache.invalidateQueries({queryKey:['domains']});onClose();navigate(`/console/orders/${value.orderId}`)}});
 const pending=action.isPending||purchase.isPending;const missing=fields.some(field=>field.required&&!params[field.key]?.trim());const destructive=/删除|撤销|关闭/.test(title);
 return <LayerDialog.Root open dismissDisabled={pending} onOpenChange={open=>{if(!open&&!pending)onClose()}}><LayerDialog.Content>
  <LayerDialog.Title>{title}</LayerDialog.Title><LayerDialog.Description>{operation.paid?'核对域名、年限和当前报价后创建平台订单，再选择支付方式。':'请核对本次操作的域名和填写内容，提交后可查看处理记录。'}</LayerDialog.Description>
  <LayerDialog.Body><div className="grid max-h-[60vh] gap-4 overflow-y-auto text-sm">
   <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">{fields.map(field=><FieldControl key={field.key} field={field} operation={operation} assets={assets} templates={templates} value={params[field.key]??''} onChange={value=>{if(pending)return;setParams(previous=>({...previous,[field.key]:value}));setQuote(undefined);setResult(undefined);setRequestId(crypto.randomUUID());action.reset();purchase.reset();if(field.key==='file_org')setFileError(value?'':'请选择4MB以内的JPEG或PNG图片')}}/>)}</fieldset>
   {fileError?<Banner variant="error" title={fileError}/>:null}
   {action.error||purchase.error?<Banner variant="error" title={getApiMessage(action.error??purchase.error)}/>:null}
   {quote?<Banner title={`当前报价 ¥${quote.amount}`} description={`域名：${quote.domain}。报价有效期至 ${new Date(quote.expiresAt).toLocaleString('zh-CN')}；创建订单后仍需确认支付。`}/>:null}
   {result?<><Banner title={domainStatus[result.status]??'请求已处理'} description={result.status==='submitted'?'命令已受理，最终处理结果请查看操作记录。':undefined}/><DomainResult value={result.data}/></>:null}
  </div></LayerDialog.Body>
  <LayerDialog.Actions dismissLabel="关闭"><LayerDialog.Action variant={destructive?'destructive':'primary'} loading={pending} disabled={missing||pending||!!fileError} onClick={()=>{if(quote)purchase.mutate();else action.mutate()}}>{operation.paid?(quote?'确认创建订单':'获取当前报价'):operation.write?'确认提交':'查询'}</LayerDialog.Action></LayerDialog.Actions>
 </LayerDialog.Content></LayerDialog.Root>;
}
