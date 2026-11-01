import {ScopedTable as Table} from './ScopedTable';
import { useState } from "react";
import { Banner, Button, LayerCard} from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getReclamation, retryReclamation, previewReclamation, getReclamationHistory } from "../api/updateAdmin";
import { getApiMessage } from "../api/request";

const categories: Record<string,string>={build_job:"构建任务",staging:"候选程序",previous_backend:"历史后端",previous_frontend:"历史前端",archived_result:"历史更新结果",legacy_program:"历史程序副本",legacy_cache:"历史缓存",registered_copy:"已登记发布副本"};
const reasons:Record<string,string>={"database recovery data protected":"数据库恢复数据受保护","build unit active":"构建尚未结束","resource in use":"文件仍被占用"};
const resourceStates:Record<string,string>={pending:"等待回收",blocked:"占用保护",failed:"回收失败",removed:"已回收"};
const errorText=(error:string)=>({"update recovery pending":"更新恢复尚未完成","update transaction active":"存在进行中的更新","resource reclamation incomplete":"部分资源被占用或回收失败","worker interrupted":"执行中断后等待恢复","reclamation database operation failed":"回收记录写入失败","build unit state unavailable":"构建服务状态不可用","process reference scan denied":"进程引用核验权限不足","production MySQL socket mismatch":"数据库本机连接校验失败"} as Record<string,string>)[error]??"回收校验失败，请检查服务日志";
const labels: Record<string,string>={pending:"等待回收",preview_ready:"预览完成",preview_pending:"等待预览",running:"正在回收",success:"自动回收正常",failed:"自动回收待处理"};
const space=(bytes:number|undefined)=>bytes===undefined?"—":`${(bytes/1024**3).toFixed(2)} GiB`;
export function ProductionReclamation(){
 const client=useQueryClient();
 const query=useQuery({queryKey:["admin","reclamation"],queryFn:getReclamation,refetchInterval:30_000,retry:false});
 const retry=useMutation({mutationFn:retryReclamation,onSuccess:()=>client.invalidateQueries({queryKey:["admin","reclamation"]})});
 const preview=useMutation({mutationFn:previewReclamation,onSuccess:()=>client.invalidateQueries({queryKey:["admin","reclamation"]})});
 const data=query.data;
 return <LayerCard><LayerCard.Primary><div className="grid gap-3 p-4 text-sm">
 <h2 className="font-semibold">生产资源自动回收</h2>
 <p>系统长期自动回收构建缓存和历史发布产物，历史版本保留 0。仅作用于已绑定的生产服务器；当前运行资源及数据库受保护。</p>
 {query.error?<Banner variant="error" title="自动回收状态不可用" description={getApiMessage(query.error)}/>:!data?<p>正在读取状态…</p>:<>
 {!data.configured||!data.infrastructureReady?<Banner variant="alert" title="自动回收尚未就绪" description="需完成生产服务器绑定、增量迁移及回收服务安装。开发环境不启用。"/>:null}
 {data.alert?<Banner variant="error" title="自动回收需要处理" description="回收服务心跳过期或连续失败，请检查服务及资源占用，不要手动删除运行文件。"/>:null}
 <p>最近巡检磁盘可用：{data.state.summary?.diskFreeBytes===undefined?"—":`${(data.state.summary.diskFreeBytes/1024**3).toFixed(2)} GiB`}；发现资源：{data.state.summary?.discoveredBytes===undefined?"—":`${(data.state.summary.discoveredBytes/1024**3).toFixed(2)} GiB`}</p>
 <p>磁盘总量：{space(data.state.summary?.diskTotalBytes)}；已用：{space(data.state.summary?.diskUsedBytes)}；inode：{data.state.summary?.inodeUsed??"—"} / {data.state.summary?.inodeTotal??"—"}</p>
 <p>受保护资源：{space(data.state.summary?.protectedBytes)}；已回收 {data.state.summary?.removed??0} 项；占用保护 {data.state.summary?.blocked??0} 项；失败 {data.state.summary?.failed??0} 项。</p>
 <p>下次重试或巡检：{data.state.nextAttemptAt?new Date(data.state.nextAttemptAt).toLocaleString("zh-CN"):"等待调度"}</p>
 <dl className="grid gap-2 sm:grid-cols-2"><div><dt>状态</dt><dd>{labels[data.state.status]??data.state.status}</dd></div><div><dt>最近完成</dt><dd>{data.state.finishedAt?new Date(data.state.finishedAt).toLocaleString("zh-CN"):"尚未运行"}</dd></div><div><dt>最近磁盘空闲变化</dt><dd>{data.state.summary?.freeBytesDelta===undefined?"—":`${(data.state.summary.freeBytesDelta/1024**3).toFixed(2)} GiB`}</dd></div><div><dt>重试次数</dt><dd>{data.state.attempts}</dd></div></dl>
 {data.resources?.length?<ul className="grid gap-1">{data.resources.slice(0,10).map(resource=><li key={resource.resourceKey}>{resource.taskId?`任务 ${resource.taskId} · `:""}{categories[resource.category]??"系统资源"} · {resourceStates[resource.status]??"待核实"}{resource.lastError?`（${reasons[resource.lastError]??"请检查占用或权限"}）`:""}</li>)}</ul>:null}
 {data.state.lastError?<p>回收结果：{errorText(data.state.lastError)}</p>:null}
 <Button variant="secondary" className="w-fit" loading={preview.isPending} disabled={!data.configured||!data.infrastructureReady||data.state.status==="running"} onClick={()=>preview.mutate()}>预览回收范围</Button>
 {data.state.preview?<p>最近预览：发现 {data.state.preview.discovered??0} 项；占用保护 {data.state.preview.blocked??0} 项，不删除文件。</p>:null}
 <Button variant="secondary" className="w-fit" loading={retry.isPending} disabled={!data.configured||!data.infrastructureReady||data.state.status==="running"} onClick={()=>retry.mutate()}>重试自动回收</Button>
 </>}
 {preview.error?<Banner variant="error" title="预览调度失败" description={getApiMessage(preview.error)}/>:null}
 {retry.error?<Banner variant="error" title="调度失败" description={getApiMessage(retry.error)}/>:null}
 {data?<ReclamationHistory />:null}
 </div></LayerCard.Primary></LayerCard>;
}

function ReclamationHistory(){
 const [page,setPage]=useState(1);
 const query=useQuery({queryKey:["admin","reclamation","history",page],queryFn:()=>getReclamationHistory(page),refetchInterval:30_000,retry:false});
 return <div className="grid gap-2"><h3 className="font-semibold">回收历史</h3>
 {query.error?<Banner variant="error" title="回收历史读取失败" description={getApiMessage(query.error)}/>:null}
 <div className="overflow-x-auto"><Table tableId="shared/components/ProductionReclamation.tsx:1"><Table.Header><Table.Row><Table.Head>时间</Table.Head><Table.Head>类型</Table.Head><Table.Head>状态</Table.Head><Table.Head>关联更新任务</Table.Head><Table.Head>磁盘空闲变化</Table.Head></Table.Row></Table.Header><Table.Body>
 {(query.data?.items??[]).map(run=><Table.Row key={run.id}><Table.Cell>{new Date(run.startedAt).toLocaleString("zh-CN")}</Table.Cell><Table.Cell>{run.dryRun?"只读预览":"系统回收"}</Table.Cell><Table.Cell>{({success:"已完成",failed:"失败",running:"执行中",interrupted:"中断后恢复"} as Record<string,string>)[run.status]??"待核实"}{run.lastError?`（${errorText(run.lastError)}）`:""}</Table.Cell><Table.Cell>{[...new Set(run.summary?.resources?.map(item=>item.taskId).filter(id=>id!=="0")??[])].join("、")||"系统资源"}</Table.Cell><Table.Cell>{run.summary?.freeBytesDelta===undefined?"—":`${(run.summary.freeBytesDelta/1024**3).toFixed(2)} GiB`}</Table.Cell></Table.Row>)}
 </Table.Body></Table></div>
 {!query.isLoading&&!query.data?.items.length?<p>暂无回收记录</p>:null}
 <div className="flex items-center justify-between gap-3"><p>第 {page} 页，共 {query.data?.total??0} 条</p><div className="flex gap-2"><Button variant="secondary" disabled={page<=1||query.isFetching} onClick={()=>setPage(value=>value-1)}>上一页</Button><Button variant="secondary" disabled={!query.data||page*20>=query.data.total||query.isFetching} onClick={()=>setPage(value=>value+1)}>下一页</Button></div></div>
 </div>;
}
