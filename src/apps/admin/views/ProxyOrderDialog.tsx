import { Banner, Button, Combobox, Input, LayerDialog, Select, Text, Toolbar } from "@cloudflare/kumo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiMessage } from "../../../shared/api/request";
import { proxyOrderApi, type ProxyCatalogProduct } from "../../../shared/api/adminProxyOrder";
import { adminBase } from "../../../shared/utils/adminEntry";
import { formatMoney } from "../../../shared/utils/format";

type Funds = "balance" | "credit_then_balance";
const fundsLabels: Record<Funds, string> = {
  balance: "直接扣客户余额",
  credit_then_balance: "先加款到客户余额，再扣款",
};
function requestId() {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  return `proxy-order-${random}`.slice(0, 64);
}

export function ProxyOrderDialog({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [specId, setSpecId] = useState("");
  const [cycle, setCycle] = useState("");
  const [duration, setDuration] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [funds, setFunds] = useState<Funds>("balance");
  const [notes, setNotes] = useState("");
  const submitting = useRef(false);
  const navigate = useNavigate();
  const catalog = useQuery({ queryKey: ["admin", "proxy-order-catalog"], queryFn: proxyOrderApi.catalog, enabled: open, retry: false });
  const detail = useQuery({
    queryKey: ["admin", "proxy-order-product", productId],
    queryFn: () => proxyOrderApi.productDetail(productId),
    enabled: open && Boolean(productId),
    retry: false,
  });
  const items = catalog.data ?? [];
  const labels = useMemo(() => items.map((item) => `${item.name}${item.price ? ` · ¥${item.price}` : ""}`), [items]);
  const pick = (label: string) => {
    const found = items.find((item) => `${item.name}${item.price ? ` · ¥${item.price}` : ""}` === label);
    setProductId(found?.id ?? "");
    setSpecId("");
    setCycle("");
  };
  const specs = detail.data?.specs ?? [];
  const cycles = detail.data?.cycle ? [detail.data.cycle] : [];
  const submit = useMutation({
    mutationFn: () => proxyOrderApi.submit(customerId, {
      productId,
      specId: specId || undefined,
      durationMonth: duration,
      quantity,
      billingCycle: cycle || detail.data?.cycle || "",
      mode: funds,
      notes,
      requestId: requestId(),
    }),
    onSettled: () => { submitting.current = false; },
  });
  const ready = Boolean(productId) && duration >= 1 && duration <= 36 && quantity >= 1 && quantity <= 10 && notes.trim().length >= 2 && !submit.isPending;
  const close = (value: boolean) => {
    if (submit.isPending) return;
    setOpen(value);
    if (!value) {
      setProductId(""); setSpecId(""); setCycle(""); setDuration(1); setQuantity(1); setFunds("balance"); setNotes("");
      submit.reset();
    }
  };
  return <>
    <Button variant="secondary" onClick={() => { submit.reset(); setOpen(true); }}>代客下单</Button>
    <LayerDialog.Root open={open} dismissDisabled={submit.isPending} onOpenChange={close}>
      <LayerDialog.Content>
        <LayerDialog.Title>代客下单并开通</LayerDialog.Title>
        <LayerDialog.Description>按客户身份创建订单并走现有支付、采购与开通流程：商品与价格来自前台目录，报价核验、余额流水、开通与绑定均复用客户下单同一条链路。</LayerDialog.Description>
        <LayerDialog.Body><div className="grid gap-4">
          <Select label="资金方式" value={funds} items={fundsLabels} onValueChange={(value) => setFunds((value as Funds) ?? "balance")} />
          <div className="grid gap-2">
            <Text as="span" variant="secondary">商品（前台在售目录）</Text>
            <Toolbar className="w-full">
              <Combobox items={labels} value={items.find((item) => item.id === productId) ? labels[items.findIndex((item) => item.id === productId)] ?? "" : ""} onValueChange={(value) => pick(value ?? "")}>
                <Combobox.TriggerInput className="flex-1" aria-label="商品" placeholder="搜索商品名称 / 价格" render={<Toolbar.Input />} />
                <Combobox.Content>
                  <Combobox.List>{(item: string) => <Combobox.Item key={item} value={item}>{item}</Combobox.Item>}</Combobox.List>
                  <Combobox.Empty>没有匹配的前台商品</Combobox.Empty>
                </Combobox.Content>
              </Combobox>
            </Toolbar>
            {catalog.error ? <Banner variant="error" title={getApiMessage(catalog.error)} /> : null}
          </div>
          {productId ? <div className="grid gap-3 sm:grid-cols-2">
            {specs.length ? <Select label="规格" value={specId || specs[0]?.id || ""} items={Object.fromEntries(specs.map((spec) => [spec.id, spec.price ? `${spec.name ?? spec.id} · ¥${spec.price}` : (spec.name ?? spec.id)]))} onValueChange={(value) => setSpecId(value ?? "")} /> : null}
            {cycles.length ? <Select label="计费周期" value={cycle || cycles[0] || ""} items={Object.fromEntries(cycles.map((value) => [value, value]))} onValueChange={(value) => setCycle(value ?? "")} /> : null}
            <Input label="购买时长（月）" type="number" min={1} max={36} value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
            <Input label="数量" type="number" min={1} max={10} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          </div> : null}
          {detail.data?.configurable ? <Banner variant="alert" title="该商品带配置项" description="配置项与报价核验在客户前台完成；此入口只提交商品、规格、周期与数量，配置类商品可能被拒绝，请改由客户前台购买。" /> : null}
          <Input label="代客原因（必填，写入审计）" maxLength={200} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="例如：客户电话委托下单，工单 #1234" />
          {submit.error ? <Banner variant="error" title="代客下单失败" description={getApiMessage(submit.error)} /> : null}
          {submit.data ? <Banner title={`订单 ${submit.data.orderNo} 已支付并提交开通`} description={`实付 ${formatMoney(submit.data.payAmount)}${submit.data.credited ? "（已先加款到客户余额）" : "（直接扣客户余额）"}；开通完成后可在客户实例列表看到产品。`} /> : null}
        </div></LayerDialog.Body>
        <LayerDialog.Actions dismissLabel="取消">
          {submit.data
            ? <LayerDialog.Action onClick={() => navigate(`${adminBase}/customers/${encodeURIComponent(customerId)}/instances`)}>查看客户实例</LayerDialog.Action>
            : <LayerDialog.Action disabled={!ready} loading={submit.isPending} onClick={() => { if (submitting.current) return; submitting.current = true; submit.mutate(); }}>确认下单并开通</LayerDialog.Action>}
        </LayerDialog.Actions>
      </LayerDialog.Content>
    </LayerDialog.Root>
  </>;
}

export type { ProxyCatalogProduct };
