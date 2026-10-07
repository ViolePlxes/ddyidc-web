import { Dialog } from "../../../shared/components/Dialog";
import { Banner, Button, Input, LayerCard, Table } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminRequest, type ApiEnvelope, getApiMessage } from "../../../shared/api/request";
import { PageState } from "../../../shared/components/PageState";

interface ReceiptReview {
  paymentId: string; payNo: string; businessId: string; customerId: string;
  channel: string; amount: string; reason: string; status: string;
}
const reasons: Record<string, string> = {
  order_not_payable: "订单已关闭、已付款或金额已变化",
  recharge_not_payable: "充值单已关闭或已入账",
  marketplace_late_receipt: "交易市场迟到收款",
  stock_reservation_released: "库存预占已释放，收款待核对",
};

export function ReceiptReviews() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ReceiptReview>();
  const [reason, setReason] = useState("");
  const [payNo, setPayNo] = useState("");
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "receipt-reviews", page],
    queryFn: async () => (await adminRequest.get<ApiEnvelope<ReceiptReview[]>>("/payment/receipt-reviews", { params: { page } })).data.data,
  });
  const refund = useMutation({
    mutationFn: async () => {
      if (!selected || !reason.trim()) throw new Error("请填写退款原因");
      await adminRequest.post("/payment/refund", { paymentId: selected.paymentId, amount: selected.amount, reason: reason.trim() });
    },
    onSuccess: async () => { setSelected(undefined); await client.invalidateQueries({ queryKey: ["admin", "receipt-reviews"] }); },
  });
  const reconcile = useMutation({
    mutationFn: async (channel: "alipay" | "wechat") => {
      if (!payNo.trim()) throw new Error("请填写支付单号");
      return (await adminRequest.post<ApiEnvelope<{ status: string }>>(`/payment/${channel}/query`, { payNo: payNo.trim() })).data.data;
    },
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["admin", "receipt-reviews"] }); },
  });
  return <LayerCard >
    <LayerCard.Secondary><h2>待核对收款</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
    <p>已核实渠道收款但未用于履约的支付尝试。原路退款仅处理本笔收款，不改变其他已付款订单。</p>
    <div className="flex flex-wrap items-end gap-3">
      <Input label="渠道核对支付单号" value={payNo} maxLength={64} onChange={event => { setPayNo(event.target.value); reconcile.reset(); }} />
      <Button variant="secondary" disabled={!payNo.trim() || reconcile.isPending} onClick={() => reconcile.mutate("alipay")}>查询支付宝并核对</Button>
      <Button variant="secondary" disabled={!payNo.trim() || reconcile.isPending} onClick={() => reconcile.mutate("wechat")}>查询微信并核对</Button>
    </div>
    {reconcile.error ? <Banner variant="error" title="渠道核对失败" description={getApiMessage(reconcile.error)} /> : null}
    {reconcile.data ? <Banner title="渠道查询已完成" description={`返回状态：${reconcile.data.status}。仅验真的成功收款进入本地状态处理，不会再次扣款。`} /> : null}
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && !query.data?.length} emptyTitle="暂无待核对收款">
      <Table><Table.Header><Table.Row>{["支付单", "业务 / 客户", "渠道 / 金额", "原因", "状态", "操作"].map(label => <Table.Head key={label}>{label}</Table.Head>)}</Table.Row></Table.Header>
        <Table.Body>{query.data?.map(row => <Table.Row key={row.paymentId}>
          <Table.Cell>{row.payNo}</Table.Cell><Table.Cell>{row.businessId} / {row.customerId}</Table.Cell>
          <Table.Cell>{row.channel} · ¥{row.amount}</Table.Cell><Table.Cell>{reasons[row.reason] ?? row.reason}</Table.Cell>
          <Table.Cell>{row.status === "refunded" ? "已原路退款" : "待核对"}</Table.Cell>
          <Table.Cell><Button variant="secondary" disabled={row.status !== "pending"} onClick={() => { refund.reset(); setReason(""); setSelected(row); }}>原路退款</Button></Table.Cell>
        </Table.Row>)}</Table.Body>
      </Table>
    </PageState>
    <div className="flex justify-end gap-2"><Button variant="secondary" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}>上一页</Button><span>第 {page} 页</span><Button variant="secondary" disabled={query.isFetching || (query.data?.length ?? 0) < 20} onClick={() => setPage(page + 1)}>下一页</Button></div>
    <Dialog.Root open={Boolean(selected)} onOpenChange={open => { if (!open && !refund.isPending) setSelected(undefined); }}>
      <Dialog className="grid gap-4 p-6"><Dialog.Title>确认原路退款</Dialog.Title><Dialog.Description>支付单 {selected?.payNo}，向原付款渠道退回 ¥{selected?.amount}。请核对收款与订单后执行，操作将记录管理员及原因。</Dialog.Description>
        <Input label="退款原因" value={reason} maxLength={256} onChange={e => setReason(e.target.value)} />
        {refund.error ? <Banner variant="error" title="退款尚未确认" description={getApiMessage(refund.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" disabled={refund.isPending} onClick={() => setSelected(undefined)}>取消</Button><Button loading={refund.isPending} disabled={!reason.trim()} onClick={() => refund.mutate()}>确认退回 ¥{selected?.amount}</Button></div>
      </Dialog>
    </Dialog.Root>
  </LayerCard.Primary></LayerCard>;
}
