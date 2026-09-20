import {
  Banner,
  Button,
  Dialog,
  Input,
  Pagination,
  Select,
  Table,
  Textarea,
} from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { customerFinanceApi } from "../../../shared/api/customerFinance";
import { getApiMessage } from "../../../shared/api/request";
import { formatDate } from "../../../shared/utils/format";

const labels: Record<string, string> = {
  recharge: "充值",
  manual_credit: "人工调增",
  manual_debit: "人工调减",
  freeze: "冻结",
  unfreeze: "解冻",
  order_pay: "消费",
  instance_renewal_pay: "实例续费",
  refund: "退款",
  withdraw: "提现",
  overpayment: "多付入账",
  underpayment: "补扣",
  points_credit: "积分兑换",
  commission: "佣金",
};
export function CreditHistory({
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
        <Table className="whitespace-nowrap">
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
              : { type, amount, confirm_large: confirmLarge }),
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
        className="grid max-h-[85vh] gap-4 overflow-y-auto p-6"
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
