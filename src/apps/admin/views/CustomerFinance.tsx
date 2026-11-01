import {ScopedTable as Table} from '../../../shared/components/ScopedTable';
import { Pagination } from "../../../shared/components/Pagination";
import { Dialog } from "../../../shared/components/Dialog";
import { Banner, Button, Input,  Select, Textarea, LayerCard, Tabs,  } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { customerFinanceApi } from "../../../shared/api/customerFinance";
import { getApiMessage } from "../../../shared/api/request";
import { usePrefetchedLedger, type LedgerDirection } from "../../../shared/components/usePrefetchedLedger";
import { DateRangeField } from "../../../shared/components/DateField";
import { formatDate } from "../../../shared/utils/format";

const labels: Record<string, string> = {
  recharge: "充值",
  manual_credit: "人工调增",
  manual_debit: "人工调减",
  freeze: "冻结",
  unfreeze: "解冻",
  order_pay: "消费",
  instance_renewal_pay: "实例续费",
  instance_upgrade_pay: "实例升降配",
  refund: "退款",
  withdraw: "提现",
  overpayment: "多付入账",
  underpayment: "补扣",
  points_credit: "积分兑换",
  commission: "佣金",
};
export function CreditHistory(props:{id:string;frozen?:boolean;onUnfreeze?:(id:string)=>void}) {
 return props.frozen?<FrozenCreditHistory {...props}/>:<CustomerLedger key={props.id} id={props.id}/>;
}
function CustomerLedger({id}:{id:string}) {
 const [page,setPage]=useState(1),[direction,setDirection]=useState<LedgerDirection>('all'),[keyword,setKeyword]=useState(''),[type,setType]=useState(''),[generation,setGeneration]=useState(0),[showFilters,setShowFilters]=useState(false),[start,setStart]=useState(''),[end,setEnd]=useState('');
 const q=usePrefetchedLedger({scope:['admin','credit',id,{keyword,type,start,end},generation],page,direction,load:(dir,nextPage,snapshotVersion,signal)=>customerFinanceApi.list(id,nextPage,type,false,{limit:20,direction:dir,keywords:keyword,snapshotVersion,start_time:start?`${start}+08:00`:'',end_time:end?`${end}+08:00`:''},signal),version:data=>data.snapshot_version});
 const rowClass='align-top';
 return <LayerCard className="min-w-0"><LayerCard.Secondary className="flex flex-wrap items-center justify-between gap-2"><h2>余额流水</h2><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" aria-expanded={showFilters} onClick={()=>setShowFilters(v=>!v)}>筛选</Button><Button size="sm" variant="ghost" onClick={()=>{setKeyword('');setType('');setDirection('all');setStart('');setEnd('');setPage(1)}}>清除筛选</Button><Button size="sm" variant="secondary" disabled={q.isFetching} onClick={()=>{setGeneration(v=>v+1);setPage(1)}}>刷新</Button></div></LayerCard.Secondary><LayerCard.Primary className="min-w-0">
 <div className="mb-2 flex items-center gap-3"><Input size="sm" className="min-w-0 flex-1" aria-label="搜索用户余额流水" placeholder="搜索流水编号或说明…" value={keyword} onChange={e=>{setKeyword(e.target.value);setPage(1)}}/><Tabs variant="segmented" size="sm" className="shrink-0" value={direction} tabs={[{value:'all',label:'全部'},{value:'increase',label:'增加'},{value:'decrease',label:'减少'}]} onValueChange={value=>{setDirection(value as LedgerDirection);setPage(1)}}/></div>
 {showFilters&&<div className="mb-3 grid gap-3"><Select label="流水类型" value={type} items={[{value:'',label:'全部类型'},...Object.entries(labels).map(([value,label])=>({value,label}))]} onValueChange={v=>{setType(v??'');setPage(1)}}/><DateRangeField label="记录时间范围（北京时间，含结束时刻）" from={start} to={end} withTime seconds onValueChange={(a,b)=>{setStart(a);setEnd(b);setPage(1)}}/></div>}
 {q.error&&<Banner variant="error" title={getApiMessage(q.error)}/>}{q.isLoading&&!q.data&&<p role="status">正在加载流水…</p>}
 <div className="-mx-1 overflow-x-auto text-base" aria-busy={q.isFetching}><Table tableId="apps/admin/views/CustomerFinance.tsx:1" role="table" aria-label="用户余额流水记录" className="min-w-[96rem]"><Table.Header><Table.Row role="row" className={`${rowClass} border-b border-kumo-fill pb-2 text-base font-medium text-kumo-subtle`}>{['时间','类型','金额（元）','可用余额前 → 后','冻结余额前 → 后','操作人','说明','流水编号','关联业务','交易号'].map(h=><Table.Head role="columnheader" key={h}>{h}</Table.Head>)}</Table.Row></Table.Header><Table.Body role="rowgroup">{q.data?.list.map((row,index)=><Table.Row role="row" key={row.id} className={`${rowClass} py-2.5 ${index<(q.data?.list.length??0)-1?'border-b border-kumo-hairline':''}`}><Table.Cell role="cell">{formatDate(row.create_time)}</Table.Cell><Table.Cell role="cell" className="font-medium">{labels[row.type]??row.type}</Table.Cell><Table.Cell role="cell" className="tabular-nums">{row.amount}</Table.Cell><Table.Cell role="cell" className="tabular-nums text-kumo-subtle">{row.amount_before} → {row.amount_after}</Table.Cell><Table.Cell role="cell" className="tabular-nums text-kumo-subtle">{row.frozen_before} → {row.frozen_after}</Table.Cell><Table.Cell role="cell">{row.admin_name||'系统'}</Table.Cell><Table.Cell role="cell" className="break-words">{row.notes}<p className="text-kumo-subtle">{row.client_notes}</p></Table.Cell><Table.Cell role="cell">#{row.id}</Table.Cell><Table.Cell role="cell">{row.ref_type} #{row.ref_id}</Table.Cell><Table.Cell role="cell">{row.biz_trace||'—'}</Table.Cell></Table.Row>)}</Table.Body></Table></div>
 {q.data?.count===0&&<p className="py-3 text-base text-kumo-subtle">暂无符合条件的余额流水</p>}{q.data&&<div className="-mx-1 flex flex-wrap items-center justify-between gap-3 border-t border-kumo-fill pt-2 text-base text-kumo-subtle"><p>共 {q.data.count} 条 · 本页合计 {q.data.page_total_amount} 元 · 筛选合计 {q.data.total_amount} 元</p><Pagination page={page} setPage={setPage} perPage={20} totalCount={q.data.count}/></div>}
 </LayerCard.Primary></LayerCard>;
}
function FrozenCreditHistory({
  id,
  frozen = false,
  onUnfreeze,
}: {
  id: string;
  frozen?: boolean;
  onUnfreeze?: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const q = useQuery({
    queryKey: ["admin", "credit", id, page, type, frozen],
    queryFn: () => customerFinanceApi.list(id, page, type, frozen),
  });
  return (
    <div className="grid gap-4">
      {!frozen ? (
        <Select
          label="流水类型"
          value={type}
          items={[
            { value: "", label: "全部" },
            ...Object.entries(labels).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
          onValueChange={(v) => {
            setType(v ?? "");
            setPage(1);
          }}
        />
      ) : null}
      {q.error ? (
        <Banner variant="error" title={getApiMessage(q.error)} />
      ) : null}
      <div className="overflow-x-auto">
        <Table tableId="apps/admin/views/CustomerFinance.tsx:2" className="whitespace-nowrap">
          <Table.Header>
            <Table.Row>
              {[
                "流水 ID",
                "类型",
                "金额（元）",
                "可用余额前 → 后",
                "冻结余额前 → 后",
                "操作人",
                "备注",
                "关联业务",
                "交易号",
                "时间",
                ...(frozen ? ["操作"] : []),
              ].map((v) => (
                <Table.Head key={v}>{v}</Table.Head>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {q.data?.list.map((row) => (
              <Table.Row key={row.id}>
                <Table.Cell>{row.id}</Table.Cell>
                <Table.Cell>{labels[row.type] ?? row.type}</Table.Cell>
                <Table.Cell>{row.amount}</Table.Cell>
                <Table.Cell>
                  {row.amount_before} → {row.amount_after}
                </Table.Cell>
                <Table.Cell>
                  {row.frozen_before} → {row.frozen_after}
                </Table.Cell>
                <Table.Cell>{row.admin_name || "系统"}</Table.Cell>
                <Table.Cell>
                  {row.notes}
                  <p>{row.client_notes}</p>
                </Table.Cell>
                <Table.Cell>
                  {row.ref_type} #{row.ref_id}
                </Table.Cell>
                <Table.Cell>{row.biz_trace || "—"}</Table.Cell>
                <Table.Cell>{formatDate(row.create_time)}</Table.Cell>
                {frozen ? (
                  <Table.Cell>
                    <Button
                      variant="secondary"
                      disabled={row.is_unfrozen}
                      onClick={() => onUnfreeze?.(row.id)}
                    >
                      {row.is_unfrozen ? "已解冻" : "解冻"}
                    </Button>
                  </Table.Cell>
                ) : null}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
      {q.isLoading ? (
        <p>加载中…</p>
      ) : q.data?.count === 0 ? (
        <p>暂无资金流水</p>
      ) : null}
      {q.data ? (
        <>
          <p>
            本页合计：{q.data.page_total_amount} 元 · 全部合计：
            {q.data.total_amount} 元
          </p>
          <Pagination
            page={page}
            setPage={setPage}
            perPage={10}
            totalCount={q.data.count}
          />
        </>
      ) : null}
    </div>
  );
}
export function CustomerFinanceDialog({
  id,
  action,
  close,
}: {
  id: string;
  action: string;
  close: () => void;
}) {
  const client = useQueryClient();
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [gateway, setGateway] = useState("bank_transfer");
  const [trace, setTrace] = useState("");
  const [type, setType] = useState("manual_credit");
  const [unfreeze, setUnfreeze] = useState("");
  const [confirmLarge, setConfirmLarge] = useState(false);
  const [requestID] = useState(() => crypto.randomUUID());
  const mutation = useMutation({
    mutationFn: async () => {
      const input = {
        request_id: requestID,
        notes,
        ...(unfreeze
          ? { credit_ids: [unfreeze] }
          : action === "充值"
            ? { amount, gateway, transaction_number: trace }
            : action === "余额冻结"
              ? { freeze_amount: amount, client_notes: clientNotes }
              : { type, amount, client_notes: clientNotes, confirm_large: confirmLarge }),
      };
      await customerFinanceApi.change(
        id,
        unfreeze
          ? "credit/unfreeze"
          : action === "充值"
            ? "recharge"
            : action === "余额冻结"
              ? "credit/freeze"
              : "adjust",
        input,
      );
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["admin"] });
      close();
    },
  });
  const large =
    action === "强制变更" &&
    /^\d+(\.\d{1,2})?$/.test(amount) &&
    Number(amount) > 50000;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) close();
      }}
    >
      <Dialog
        size="xl"
        className="grid max-h-[85vh] gap-4 overflow-y-auto p-8"
      >
        <Dialog.Title>{action}</Dialog.Title>
        <Dialog.Description>
          资金变动会保留完整流水与操作记录。
        </Dialog.Description>
        {action === "变更记录" ? (
          <CreditHistory id={id} />
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (large && !confirmLarge) {
                setConfirmLarge(true);
                return;
              }
              mutation.mutate();
            }}
          >

              <>
                {action === "强制变更" ? (
                  <Select
                    label="调整类型"
                    value={type}
                    items={[
                      { value: "manual_credit", label: "调增" },
                      { value: "manual_debit", label: "调减" },
                    ]}
                    onValueChange={(v) => {
                      setType(v ?? "manual_credit");
                      setConfirmLarge(false);
                    }}
                  />
                ) : null}
                {unfreeze ? (
                  <p>解冻记录：#{unfreeze}</p>
                ) : (
                  <Input
                    label="金额（元）"
                    required
                    inputMode="decimal"
                    pattern="[0-9]+(\.[0-9]{1,2})?"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setConfirmLarge(false);
                    }}
                  />
                )}
                {action === "强制变更" ? <Textarea label="客户可见原因" required maxLength={500} value={clientNotes} onChange={e=>setClientNotes(e.target.value)} /> : null}
                {action === "充值" ? (
                  <>
                    <Select
                      label="支付方式"
                      value={gateway}
                      items={[
                        { value: "bank_transfer", label: "银行转账" },
                        { value: "alipay", label: "支付宝" },
                        { value: "wechat", label: "微信" },
                      ]}
                      onValueChange={(v) => setGateway(v ?? "bank_transfer")}
                    />
                    <Input
                      label="交易流水号"
                      required
                      maxLength={128}
                      value={trace}
                      onChange={(e) => setTrace(e.target.value)}
                    />
                  </>
                ) : null}
                {action === "余额冻结" && !unfreeze ? (
                  <Textarea
                    label="前台备注"
                    maxLength={500}
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                  />
                ) : null}
                <Textarea
                  label="操作原因（必填）"
                  required
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </>
            {confirmLarge ? (
              <Banner
                variant="alert"
                title={`请再次确认：${type === "manual_credit" ? "调增" : "调减"} ${amount} 元。此操作需要大额调整权限。`}
              />
            ) : null}
            {mutation.error ? (
              <Banner variant="error" title={getApiMessage(mutation.error)} />
            ) : null}
            <Button type="submit" loading={mutation.isPending}>
              {confirmLarge ? "确认大额变更" : unfreeze ? "确认解冻" : "确认"}
            </Button>
          </form>
        )}
        {action === "余额冻结" ? (
          <CreditHistory id={id} frozen onUnfreeze={setUnfreeze} />
        ) : null}
        <Button
          variant="secondary"
          disabled={mutation.isPending}
          onClick={close}
        >
          关闭
        </Button>
      </Dialog>
    </Dialog.Root>
  );
}
