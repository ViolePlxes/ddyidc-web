import { getConsoleOverview } from "../../../shared/api/consoleHome";
import { Banner, Button, Dialog, Input, LayerCard, Pagination, Table } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { consoleApi, type Recharge } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { PaymentDialog } from "../../../shared/components/PaymentDialog";
import { useRecharges } from "../../../shared/hooks/useConsoleData";
import { formatMoney, rechargeStatusLabel } from "../../../shared/utils/format";

export function Finance() {
  const balance = useQuery({ queryKey: ["console", "overview", "7"], queryFn: () => getConsoleOverview(7) });
  const [page, setPage] = useState(1);
  const [amount, setAmount] = useState("");
  const [created, setCreated] = useState<Recharge | null>(null);
  const query = useRecharges(page);
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: () => consoleApi.createRecharge(Math.round(Number(amount) * 100), "alipay"),
    onSuccess: async (recharge) => {
      setCreated(recharge);
      setAmount("");
      await queryClient.invalidateQueries({ queryKey: ["finance", "recharges"] });
              await queryClient.invalidateQueries({ queryKey: ["console", "overview"] });
    },
  });
  const rows = query.data?.list ?? [];

  return (
    <>
      <PageHeader
        title="财务中心"
        description="查看账户余额与充值记录。"
        actions={
          <Dialog.Root>
            <Dialog.Trigger render={<Button icon={<PlusIcon />}>创建充值单</Button>} />
            <Dialog className="grid gap-5 p-6">
              <div className="flex justify-between">
                <div>
                  <Dialog.Title className="text-xl font-semibold">创建充值单</Dialog.Title>
                  <Dialog.Description className="text-kumo-subtle">创建待支付充值单后，使用支付宝完成在线充值。</Dialog.Description>
                </div>
                <Dialog.Close render={<Button variant="ghost" shape="square" icon={<XIcon />} aria-label="关闭" />} />
              </div>
              <Input label="充值金额（元）" type="number" min="1" max="1000000" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="请输入金额" />
              <Banner title="支付方式：支付宝" description="电脑端与移动端会自动选择对应的支付宝网站收银台。" />
              {create.error ? <Banner variant="error" title="创建失败" description={getApiMessage(create.error)} /> : null}
              <div className="flex justify-end gap-2">
                <Dialog.Close render={<Button variant="secondary">取消</Button>} />
                <Button loading={create.isPending} disabled={!Number(amount) || Number(amount) < 1} onClick={() => create.mutate()}>确认创建</Button>
              </div>
            </Dialog>
          </Dialog.Root>
        }
      />
      <Banner
        variant="alert"
        title="在线充值已接入真实支付回调"
        description="支付平台验签、金额校验和幂等入账全部在服务端完成；浏览器展示结果不会直接修改余额。"
      />
      {created ? (
        <LayerCard className="shadow-none grid gap-4 p-5">
          <Banner title="充值单已创建" description={`充值单 ${created.rechargeNo} 已进入待支付状态。`} />
          <div className="flex justify-end">
            <PaymentDialog businessType="recharge" businessId={created.id} amountCents={created.amount} defaultOpen onPaid={async () => {
              await queryClient.invalidateQueries({ queryKey: ["finance", "recharges"] });
              await queryClient.invalidateQueries({ queryKey: ["console", "overview"] });
            }} />
          </div>
        </LayerCard>
      ) : null}
      <section className="grid gap-4">
        <LayerCard className="shadow-none grid gap-2 p-5"><span className="text-sm text-kumo-subtle">账户余额</span><strong className="text-3xl text-kumo-strong">{balance.data ? `¥${Number(balance.data.balance).toFixed(2)}` : "—"}</strong><span className="text-sm text-kumo-subtle">{balance.error ? getApiMessage(balance.error) : "当前可用余额（元）"}</span></LayerCard>
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-kumo-strong">充值记录</h2>
        <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无充值记录">
          <div className="grid gap-3">
            <LayerCard className="shadow-none overflow-x-auto p-0">
              <Table>
                <Table.Header variant="compact"><Table.Row><Table.Head>充值单号</Table.Head><Table.Head>创建时间</Table.Head><Table.Head>状态</Table.Head><Table.Head className="text-right">金额</Table.Head><Table.Head className="text-right">操作</Table.Head></Table.Row></Table.Header>
                <Table.Body data-animate-list>{rows.map((row) => <Table.Row key={row.id}><Table.Cell>{row.rechargeNo}</Table.Cell><Table.Cell>{row.createdAt}</Table.Cell><Table.Cell>{rechargeStatusLabel(row.status)}</Table.Cell><Table.Cell className="text-right">{formatMoney(row.amount)}</Table.Cell><Table.Cell className="text-right">{row.status === 1 ? <PaymentDialog businessType="recharge" businessId={row.id} amountCents={row.amount} onPaid={async () => { await queryClient.invalidateQueries({ queryKey: ["finance", "recharges"] });
              await queryClient.invalidateQueries({ queryKey: ["console", "overview"] }); }} /> : "—"}</Table.Cell></Table.Row>)}</Table.Body>
              </Table>
            </LayerCard>
            {(query.data?.total ?? 0) > 10 ? <Pagination page={page} setPage={setPage} perPage={10} totalCount={query.data?.total ?? 0} /> : null}
          </div>
        </PageState>
      </section>
    </>
  );
}
