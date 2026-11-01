import {ScopedTable as Table} from '../../../shared/components/ScopedTable';
import { Banner} from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { adminRequest,type ApiEnvelope,getApiMessage } from "../../../shared/api/request";
interface Audit {action:string;adminId:string;notes:string;createdAt:string}
const actions:Record<string,string>={record_review:"记录核对",resolve:"按实际结果关闭",confirm_manual_refund:"确认已实际退款",register_account:"登记已核实收款账户",reminder_request:"申请发送到期提醒",reminder_started:"开始发送到期提醒",reminder_sent:"到期提醒已发送",reminder_unknown:"到期提醒结果待核查",configure:"配置变更",approve:"审核通过",reject:"审核拒绝",remit:"确认实际汇款",view_account:"查看收款账户",view_evidence:"查看原始凭证"};
export function TodoAuditHistory({kind,source,id}:{kind:string;source:string;id:string}){
 const query=useQuery({queryKey:["todo-audits",kind,source,id],queryFn:async()=>(await adminRequest.get<ApiEnvelope<Audit[]>>(`/todos/${kind}/items/${id}/audits`,{params:{source}})).data.data});
 return <div className="grid gap-2"><h3>最近处理审计（最多100条）</h3>{query.error?<Banner variant="error" title={getApiMessage(query.error)}/>:null}{query.data?.length?<Table tableId="apps/admin/views/TodoAuditHistory.tsx:1"><Table.Header><Table.Row><Table.Head>处理</Table.Head><Table.Head>操作者</Table.Head><Table.Head>说明 / 时间</Table.Head></Table.Row></Table.Header><Table.Body>{query.data.map((a,i)=><Table.Row key={i}><Table.Cell>{actions[a.action]??a.action}</Table.Cell><Table.Cell>{a.adminId==="0"?"系统":a.adminId}</Table.Cell><Table.Cell>{a.notes}<p>{new Date(a.createdAt).toLocaleString("zh-CN")}</p></Table.Cell></Table.Row>)}</Table.Body></Table>:<p>{query.isLoading?"正在加载审计…":"暂无本待办入口的审计，既有业务记录请查阅业务详情。"}</p>}</div>;
}
