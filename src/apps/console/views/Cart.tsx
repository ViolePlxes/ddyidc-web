import { useCertificationGate } from "../../../shared/components/CertificationGate";
import { Button, LayerCard, Table } from "@cloudflare/kumo";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { useCartStore } from "../../../shared/stores/cart";
import { saveOrderDraft } from "../../../shared/utils/orderDraft";

export function Cart() {
  const certification = useCertificationGate();
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);
  const total = items.reduce((sum, item) => sum + item.totalYuan, 0);
  return (
    <>
      <PageHeader title="购物车" description="购物车仅保存于当前设备；订单提交仍使用真实后端接口。" actions={items.length ? <Button variant="secondary" onClick={clear}>清空</Button> : undefined} />
      {certification.feedback}<PageState empty={items.length === 0} emptyTitle="购物车为空">
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <LayerCard className=" overflow-x-auto p-0">
            <Table>
              <Table.Header><Table.Row><Table.Head>商品</Table.Head><Table.Head>配置</Table.Head><Table.Head>数量</Table.Head><Table.Head className="text-right">小计</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header>
              <Table.Body data-animate-list>
                {items.map((item) => (
                  <Table.Row key={item.cartId}>
                    <Table.Cell><strong className="font-medium">{item.productName}</strong><div className="text-base text-kumo-subtle">{item.cycleLabel}</div></Table.Cell>
                    <Table.Cell className="text-kumo-subtle">{item.configOptions.length ? item.configOptions.map((option) => `${option.displayName}：${option.displayValue}`).join(" / ") : "固定配置"}</Table.Cell>
                    <Table.Cell>{item.quantity}</Table.Cell>
                    <Table.Cell className="text-right">¥{item.totalYuan.toFixed(2)}</Table.Cell>
                    <Table.Cell><div className="flex gap-2"><Button size="sm" disabled={certification.busy} onClick={() => void certification.run(() => { saveOrderDraft(item); navigate("/order/confirm", { viewTransition: true }); })}>结算</Button><Button size="sm" variant="ghost" onClick={() => remove(item.cartId)}>移除</Button></div></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </LayerCard>
          <LayerCard className=" grid gap-4 px-5 py-4">
            <div className="flex justify-between"><span>商品合计</span><span>¥{total.toFixed(2)}</span></div>
            <p className="border-t border-kumo-line pt-4 text-base text-kumo-subtle">当前订单接口一次仅接受一个商品，请在列表中逐项结算。</p>
          </LayerCard>
        </div>
      </PageState>
    </>
  );
}
