import { Badge, Banner, Button, LayerCard, LinkButton, Switch, Table, Tabs } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { groupBuyApi, type GroupBuyActivity, type GroupBuyRecord, type GroupType } from "../../../shared/api/groupbuy";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";

const groupOptions: Array<{ value: GroupType; label: string; size: number }> = [
  { value: "two", label: "2 人团", size: 2 }, { value: "three", label: "3 人团", size: 3 }, { value: "five", label: "5 人团", size: 5 },
];
const statusLabels = { 1: "拼团中", 2: "成功", 3: "已退款" } as const;
const statusVariants = { 1: "warning", 2: "success", 3: "secondary" } as const;

function groupPrice(a: GroupBuyActivity, kind: GroupType, leader = false) {
  const prefix = `${kind}${leader ? "Leader" : ""}` as const;
  const direct = a[`${prefix}Price` as "twoPrice"];
  const discount = a[`${prefix}Discount` as "twoDiscount"];
  if (leader && direct === undefined && discount === undefined) return groupPrice(a, kind, false);
  return a.priceMode === 1 ? direct ?? 0 : Math.floor(a.originalPrice * (100 - (discount ?? 0)) / 100);
}

export function GroupBuyActivities() {
  const query = useQuery({ queryKey: ["groupbuy", "activities"], queryFn: () => groupBuyApi.activities({ pageSize: 100 }) });
  return <><PageHeader title="拼团" description="发起新团，或加入公开团享受团购价。" actions={<LinkButton href="/console/groupbuy/my" variant="secondary">我的拼团</LinkButton>} />
    <PageState loading={query.isLoading} skeleton="products" error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.data?.list.length} emptyTitle="暂无拼团活动">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{query.data?.list.map((a) => <LayerCard key={a.id} className="flex min-h-72 flex-col gap-4 p-5"><div className="flex justify-between"><span className="grid size-10 place-items-center bg-kumo-control text-kumo-brand"><UsersThreeIcon /></span><Badge variant="success">进行中</Badge></div><div><h2 className="text-lg font-semibold text-kumo-strong">{a.productName}</h2><p className="text-kumo-subtle">{a.slogan || a.configDescription}</p></div><div className="flex flex-wrap gap-2">{groupOptions.map((g) => <Badge key={g.value} variant="outline">{g.label} ¥{(groupPrice(a, g.value) / 100).toFixed(2)}</Badge>)}</div><div className="mt-auto flex items-center justify-between border-t border-kumo-line pt-4"><span className="text-sm text-kumo-subtle">{a.activeGroups} 个团进行中</span><LinkButton href={`/console/groupbuy/activities/${a.id}`}>查看活动</LinkButton></div></LayerCard>)}</div>
    </PageState></>;
}

export function GroupBuyActivityDetail() {
  const { id = "" } = useParams(); const navigate = useNavigate(); const [kind, setKind] = useState<GroupType>("two"); const [isPublic, setIsPublic] = useState(true); const [error, setError] = useState("");
  const activity = useQuery({ queryKey: ["groupbuy", "activity", id], queryFn: () => groupBuyApi.activity(id), enabled: Boolean(id) });
  const groups = useQuery({ queryKey: ["groupbuy", "public-groups", id], queryFn: () => groupBuyApi.publicGroups(id), enabled: Boolean(id) });
  const start = useMutation({ mutationFn: () => groupBuyApi.start({ activityId: id, groupType: kind, isPublic }), onSuccess: (data) => navigate(`/console/groupbuy/groups/${data.groupId}`), onError: (reason) => setError(getApiMessage(reason)) });
  const join = useMutation({ mutationFn: (leaderId: string) => groupBuyApi.join(leaderId), onSuccess: (row) => navigate(`/console/groupbuy/groups/${row.leaderId}`), onError: (reason) => setError(getApiMessage(reason)) });
  const a = activity.data;
  return <PageState loading={activity.isLoading} skeleton="product" error={activity.error ? getApiMessage(activity.error) : null}>{a ? <><PageHeader title={a.productName} description={a.slogan || a.configDescription} actions={<LinkButton href="/console/groupbuy" variant="secondary">返回活动</LinkButton>} />{error ? <Banner variant="error" title="操作失败" description={error} /> : null}<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]"><div className="grid gap-5"><LayerCard className="grid gap-5 p-5"><h2 className="text-lg font-semibold text-kumo-strong">选择团型</h2><Tabs variant="segmented" tabs={groupOptions.map((g) => ({ value: g.value, label: g.label }))} value={kind} onValueChange={(value) => setKind(value as GroupType)} /><div className="grid gap-3 sm:grid-cols-3">{groupOptions.map((g) => <div key={g.value} className="bg-kumo-control p-4"><span className="text-sm text-kumo-subtle">{g.label}</span><strong className="block text-lg text-kumo-strong">团长 ¥{(groupPrice(a,g.value,true)/100).toFixed(2)}</strong><span className="text-sm text-kumo-subtle">团员 ¥{(groupPrice(a,g.value)/100).toFixed(2)}</span></div>)}</div><Switch label="公开到拼团广场，允许其他用户捡漏" checked={isPublic} onCheckedChange={setIsPublic} disabled={!a.isPublicGroupEnabled || a.forcePublic} /></LayerCard><LayerCard className="grid gap-3 p-5"><h2 className="font-semibold text-kumo-strong">可加入的公开团</h2>{groups.data?.list.length ? groups.data.list.map((r) => <div key={r.id} className="flex items-center justify-between gap-3 border-b border-kumo-line py-3"><div><strong className="text-kumo-strong">{r.currentNum}/{r.needNum} 人</strong><p className="text-sm text-kumo-subtle">{new Date(r.timeoutTime).toLocaleString("zh-CN")} 截止</p></div><Button variant="secondary" loading={join.isPending} onClick={() => join.mutate(r.id)}>加入</Button></div>) : <p className="text-kumo-subtle">暂无公开团，可以发起一个新团。</p>}</LayerCard></div><LayerCard className="grid content-start gap-4 p-5"><span className="text-sm text-kumo-subtle">团长支付</span><strong className="text-2xl text-kumo-strong">¥{(groupPrice(a,kind,true)/100).toFixed(2)}</strong><p className="text-sm text-kumo-subtle">原价 ¥{(a.originalPrice/100).toFixed(2)} · 余额支付</p><Button loading={start.isPending} onClick={() => start.mutate()}>发起 {groupOptions.find((g) => g.value===kind)?.label}</Button></LayerCard></div></> : null}</PageState>;
}

export function GroupBuyGroupDetail() {
  const { id = "" } = useParams(); const client = useQueryClient(); const [message,setMessage]=useState("");
  const query=useQuery({queryKey:["groupbuy","group",id],queryFn:()=>groupBuyApi.myDetail(id),enabled:Boolean(id)});
  const refund=useMutation({mutationFn:()=>groupBuyApi.refund(id),onSuccess:()=>client.invalidateQueries({queryKey:["groupbuy","group",id]}),onError:(e)=>setMessage(getApiMessage(e))});
  const toggle=useMutation({mutationFn:(value:boolean)=>groupBuyApi.togglePublic(id,value),onSuccess:()=>client.invalidateQueries({queryKey:["groupbuy","group",id]}),onError:(e)=>setMessage(getApiMessage(e))});
  const data=query.data; const copy=async()=>{if(!data)return;await navigator.clipboard.writeText(`${window.location.origin}/groupbuy/share/${data.leader.inviteCode}`);setMessage("分享链接已复制")};
  return <PageState loading={query.isLoading} skeleton="detail" error={query.error?getApiMessage(query.error):null}>{data?<><PageHeader title={data.activity.productName} description={`拼团状态：${statusLabels[data.leader.status]}`} actions={<LinkButton href="/console/groupbuy/my" variant="secondary">我的拼团</LinkButton>} />{message?<Banner variant="default" title={message}/>:null}<div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"><LayerCard className="grid gap-4 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-kumo-strong">成员 {data.members.length}/{data.leader.needNum}</h2><Badge variant={statusVariants[data.leader.status]}>{statusLabels[data.leader.status]}</Badge></div>{data.members.map((m)=><div key={m.id} className="flex items-center justify-between border-b border-kumo-line py-3"><div><strong className="text-kumo-strong">{m.memberName||`用户 ${m.clientId}`}</strong><p className="text-sm text-kumo-subtle">{m.isLeader?"团长":"团员"}</p></div><span>¥{(m.payAmount/100).toFixed(2)}</span></div>)}</LayerCard><LayerCard className="grid content-start gap-4 p-5"><p className="text-sm text-kumo-subtle">截止 {new Date(data.leader.timeoutTime).toLocaleString("zh-CN")}</p>{data.leader.status===1?<><Button icon={<CopyIcon/>} onClick={()=>void copy()}>复制分享链接</Button>{data.leader.isLeader?<Switch label="公开拼团" checked={data.leader.isPublic} onCheckedChange={(value)=>toggle.mutate(value)} disabled={data.leader.forceClosePublic}/>:null}<Button variant="destructive" loading={refund.isPending} onClick={()=>refund.mutate()}>申请退款</Button></>:null}</LayerCard></div></>:null}</PageState>;
}

export function GroupBuyMine() {
  const [status,setStatus]=useState("1"); const query=useQuery({queryKey:["groupbuy","mine",status],queryFn:()=>groupBuyApi.mine(Number(status))});
  return <><PageHeader title="我的拼团" description="查看进行中、成功和已退款记录。" actions={<LinkButton href="/console/groupbuy">发现活动</LinkButton>} /><Tabs variant="segmented" tabs={[{value:"1",label:"拼团中"},{value:"2",label:"成功"},{value:"3",label:"已退款"}]} value={status} onValueChange={setStatus}/><PageState loading={query.isLoading} skeleton="table" error={query.error?getApiMessage(query.error):null} empty={!query.isLoading&&!query.data?.list.length} emptyTitle="此状态暂无拼团"><LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>活动</Table.Head><Table.Head>人数</Table.Head><Table.Head>实付</Table.Head><Table.Head>状态</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{query.data?.list.map((r)=><Table.Row key={r.id}><Table.Cell>{r.activity?.productName||r.activityId}</Table.Cell><Table.Cell>{r.isLeader?r.currentNum:"—"}/{r.needNum}</Table.Cell><Table.Cell>¥{(r.payAmount/100).toFixed(2)}</Table.Cell><Table.Cell><Badge variant={statusVariants[r.status]}>{statusLabels[r.status]}</Badge></Table.Cell><Table.Cell><LinkButton href={`/console/groupbuy/groups/${r.leaderId}`} variant="ghost">查看</LinkButton></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard></PageState></>;
}

export function GroupBuyShare() {
  const { inviteCode="" }=useParams(); const navigate=useNavigate(); const [error,setError]=useState(""); const query=useQuery({queryKey:["groupbuy","share",inviteCode],queryFn:()=>groupBuyApi.publicShare(inviteCode),enabled:Boolean(inviteCode)}); const join=useMutation({mutationFn:()=>groupBuyApi.join(query.data?.leader.id??""),onSuccess:(r)=>navigate(`/console/groupbuy/groups/${r.leaderId}`),onError:(e)=>setError(getApiMessage(e))});
  return <PageState loading={query.isLoading} skeleton="detail" error={query.error?getApiMessage(query.error):null}>{query.data?<><PageHeader title={`${query.data.activity.productName} 拼团分享`} description={`当前 ${query.data.members.length}/${query.data.leader.needNum} 人`} />{error?<Banner variant="error" title="参团失败" description={error}/>:null}<LayerCard className="mx-auto grid max-w-xl gap-4 p-6"><p className="text-kumo-subtle">实付金额将在服务端按当前团员价和等级折扣重新计算，并从余额扣除。</p><Button loading={join.isPending} onClick={()=>join.mutate()}>确认参团</Button></LayerCard></>:null}</PageState>;
}

export function groupBuyCountLabel(count?: number) { return count ? `拼团（${count}）` : "拼团"; }
export function groupRecordLabel(record: GroupBuyRecord) { return `${record.currentNum}/${record.needNum}`; }

