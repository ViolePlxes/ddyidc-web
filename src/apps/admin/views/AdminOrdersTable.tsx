import { AdminTableCopyText } from "../../../shared/components/AdminTableCopyText";
import { ConfigurableTable } from "../../../shared/components/ConfigurableTable";
import {Badge,Link} from '@cloudflare/kumo';
import type {ReactNode} from 'react';
import type {AdminOrderRow} from '../../../shared/api/adminOverview';
import {StatusBadge} from '../../../shared/components/StatusBadge';
import {formatDate,formatMoney,orderStatusCode} from '../../../shared/utils/format';
import {Link as RouterLink} from 'react-router-dom';
import {adminBase} from '../../../shared/utils/adminEntry';
import type {TableColumn} from '../../../shared/utils/tableLayout';
function OrderLink({href,children}:{href:string;children:ReactNode}){return <Link className="min-w-0 truncate" variant="current" href={href} render={<RouterLink to={href}/>}>{children}</Link>}
const columns:readonly TableColumn[]=[
 {key:'orderNo',label:'订单号',width:270,min:180,required:true},{key:'customer',label:'用户(公司)',width:180,min:120},
 {key:'product',label:'商品名称',width:240,min:140},{key:'amount',type:'N',label:'订单金额',width:130,min:100},
 {key:'payment',label:'支付方式',width:130,min:100},{key:'created',label:'下单时间',width:180,min:140},
 {key:'status',label:'订单状态',width:120,min:100},{key:'actions',label:'操作',width:100,min:80,required:true}
];
export function AdminOrdersTable({rows,adminId,loading=false}:{rows:AdminOrderRow[];adminId:string;loading?:boolean}){
 function cell(order:AdminOrderRow,key:string):ReactNode{switch(key){
  case 'orderNo':return <AdminTableCopyText value={order.orderNo} label="订单号"><OrderLink href={`${adminBase}/orders/${encodeURIComponent(order.id)}`}>{order.orderNo}</OrderLink></AdminTableCopyText>;
  case 'customer':return order.customerId&&order.customerId!=='0'?<AdminTableCopyText value={order.customerId} label="用户 ID"><OrderLink href={`${adminBase}/customers/${encodeURIComponent(order.customerId)}/profile`}>{order.customerDisplayName||order.customerId}</OrderLink></AdminTableCopyText>:order.customerDisplayName||'—';
  case 'product':return order.instances?.length?<div className="grid min-w-0 gap-1">{order.instances.map(instance=><OrderLink key={instance.id} href={`${adminBase}/customers/${encodeURIComponent(instance.customerId)}/instances/${encodeURIComponent(instance.id)}`}>{instance.name||order.productName||'未命名商品'}{order.instances!.length>1?` · #${instance.id}`:''}</OrderLink>)}</div>:<span className="block truncate" title="尚无当前客户名下的机器关联">{order.productName||'未命名商品'}</span>;
  case 'amount':return formatMoney(order.payAmount);
  case 'payment':return order.payType===1?<Badge variant="blue">支付宝</Badge>:order.payType===2?<Badge variant="green">微信</Badge>:order.payType===3?<Badge variant="warning">余额支付</Badge>:order.payType?<Badge variant="neutral">其他支付方式</Badge>:'—';
  case 'created':return formatDate(order.createdAt);
  case 'status':return <StatusBadge status={orderStatusCode(order.status)}/>;
  case 'actions':return <OrderLink href={`${adminBase}/orders/${encodeURIComponent(order.id)}`}>详情</OrderLink>;
 }}
 return <ConfigurableTable key={adminId} rows={rows} columns={columns} storageKey={`ddyidc-admin-order-columns:v3:business:${adminId}`} legacyStorageKeys={{shares:`ddyidc-admin-order-column-shares:v2:${adminId}`,pixels:`ddyidc-admin-order-column-widths:v1:${adminId}`}} loading={loading} label="订单列表" renderCell={cell} rowKey={row=>row.id}/>;
}
