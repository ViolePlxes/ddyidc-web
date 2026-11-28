import { useCertificationGate } from "../../../shared/components/CertificationGate";
import { Banner, Button, LayerCard, LinkButton, Select } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CheckoutPoints } from "../points/CheckoutPoints";
import { useNavigate } from "react-router-dom";
import { consoleApi, type Order } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";
import { DefinitionList } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { PaymentDialog } from "../../../shared/components/PaymentDialog";
import { paymentApi } from "../../../shared/api/payment";
import { clearOrderDraft, loadOrderDraft, saveOrderDraft } from "../../../shared/utils/orderDraft";
import { ProductCustomFields } from "../../../shared/components/ProductCustomFields";
import { InstancePasswordInput } from "../../../shared/components/InstancePasswordInput";
import { instancePasswordIssues } from "../../../shared/utils/instancePassword";

export function OrderConfirm() {
  const certification = useCertificationGate();
  const [draft, setDraft] = useState(loadOrderDraft);
  const passwordIssues = draft?.configOptions.length ? instancePasswordIssues(draft.password) : [];
  const [couponId, setCouponId] = useState(() => (loadOrderDraft()?.quantity ?? 1) > 1 ? "none" : "auto");
  const [pointsBusy, setPointsBusy] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order>();
  const [batchPaying, setBatchPaying] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const coupons = useQuery({
    queryKey: ["coupons", "usable", Math.round((draft?.totalYuan ?? 0) * 100)],
    queryFn: () => consoleApi.usableCoupons(Math.round((draft?.totalYuan ?? 0) * 100)),
    enabled: Boolean(draft),
  });
  const quoteInput=draft?{localProductId:draft.productId,cycle:draft.billingCycle,quantity:draft.quantity,customFields:draft.customFields??{},configOptions:Object.fromEntries(draft.configOptions.map(o=>[o.id,o.value]))}:null;
  const quoteQuery=useQuery({queryKey:["confirm-product-quote",quoteInput],queryFn:({signal})=>consoleApi.productQuote(quoteInput!,signal),enabled:Boolean(draft?.requiresQuote)&&!createdOrder,retry:false,refetchOnWindowFocus:false,refetchOnReconnect:false});
  const [quoteExpired,setQuoteExpired]=useState(false);
  useEffect(()=>{setQuoteExpired(false);if(!quoteQuery.data)return;const timer=window.setTimeout(()=>setQuoteExpired(true),Math.max(0,quoteQuery.data.expiresAt*1000-Date.now()));return ()=>window.clearTimeout(timer);},[quoteQuery.data]);
  const needsQuote=Boolean(draft?.requiresQuote);
  const quoteChanged=needsQuote&&quoteQuery.data&&Number(quoteQuery.data.total)!==draft?.totalYuan;
  const quoteBlocked=needsQuote&&(quoteExpired||!quoteQuery.data||quoteQuery.isFetching||Boolean(quoteQuery.error)||Boolean(quoteChanged));
  const create = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("订单配置已失效，请重新选择商品");
      if (passwordIssues.length) throw new Error(passwordIssues.join("；"));
      if (quoteBlocked) throw new Error("请先确认当前商品报价");
      const requestId = draft.requestId ?? crypto.randomUUID();
      if (!draft.requestId) { const next = {...draft, requestId}; saveOrderDraft(next); setDraft(next); }
      return consoleApi.createOrder({
        requestId,
        quoteToken: quoteQuery.data?.token ?? draft.quoteToken,
        customFields:draft.customFields,
        productId: draft.productId,
        specId: draft.selectedSpec?.id,
        durationMonth: draft.durationMonth,
        quantity: draft.quantity,
        userCouponId: couponId === "auto" ? [...(coupons.data ?? [])].sort((a,b)=>(b.previewDiscount??0)-(a.previewDiscount??0))[0]?.id : couponId === "none" ? undefined : couponId,
        configOptions: Object.fromEntries(
          draft.configOptions.map(({ id, ...option }) => [id, option]),
        ),
        hostname: draft.hostname,
        password: draft.password,
        billingCycle: draft.billingCycle,
      });
    },
    onSuccess: async (order) => {
      window.dispatchEvent(new Event("ddyidc:order-created"));
      clearOrderDraft();
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCreatedOrder(order);
    },
  });
  const couponItems = useMemo(
    () => ({
      auto: "自动匹配最优惠的可用券",
      none: "不使用优惠券",
      ...Object.fromEntries((coupons.data ?? []).map((coupon) => [coupon.id, `${coupon.name}（预计优惠 ¥${((coupon.previewDiscount ?? 0) / 100).toFixed(2)}）`])),
    }),
    [coupons.data],
  );

  if (createdOrder) {
    const batch = [createdOrder, ...(createdOrder.siblings ?? [])];
    const batchTotal = batch.reduce((sum, order) => sum + order.payAmount, 0);
    const payAllFromBalance = async () => {
      setBatchError(null);
      setBatchPaying(true);
      try {
        for (const order of batch) {
          if (order.status === 0) await paymentApi.payBalance(order.id);
        }
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
        navigate(`/console/orders/${createdOrder.id}`, { replace: true, viewTransition: true });
      } catch (error) {
        setBatchError(getApiMessage(error));
      } finally {
        setBatchPaying(false);
      }
    };
    return (
      <>
        <PageHeader title="订单已创建" description={batch.length > 1 ? `本次购买共 ${batch.length} 张订单（每台一张），合计 ¥${(batchTotal / 100).toFixed(2)}。` : `订单 ${createdOrder.orderNo} 正在等待支付。`} />
        <LayerCard className=" grid gap-5 px-5 py-4">
          <Banner title="请选择支付方式" description="可使用账户余额、支付宝或微信支付。支付成功后系统会处理开通，并跳转至订单详情。" />
          {batchError ? <Banner variant="error" title="支付未完成" description={batchError} /> : null}
          {batch.length > 1 ? (
            <div className="grid gap-2">
              {batch.map((order) => (
                <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-kumo-elevated px-3 py-2">
                  <span className="font-medium">{order.orderNo}</span>
                  <span className="text-kumo-subtle">¥{(order.payAmount / 100).toFixed(2)}</span>
                  <span className="text-kumo-subtle">{order.status === 0 ? "待支付" : "已支付"}</span>
                  <LinkButton href={`/console/orders/${order.id}`} variant="secondary" size="sm">订单详情</LinkButton>
                </div>
              ))}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <LinkButton href={`/console/orders/${createdOrder.id}`} variant="secondary">查看订单详情</LinkButton>
            {batch.length > 1 ? (
              <>
                <Button variant="secondary" loading={batchPaying} onClick={() => void payAllFromBalance()}>余额支付全部</Button>
                <PaymentDialog
                  businessType="order"
                  businessId={createdOrder.id}
                  amountCents={createdOrder.payAmount}
                  onPaid={async () => {
                    await queryClient.invalidateQueries({ queryKey: ["orders"] });
                    navigate(`/console/orders/${createdOrder.id}`, { replace: true, viewTransition: true });
                  }}
                />
              </>
            ) : (
              <PaymentDialog
                businessType="order"
                businessId={createdOrder.id}
                amountCents={createdOrder.payAmount}
                defaultOpen
                onPaid={async () => {
                  await queryClient.invalidateQueries({ queryKey: ["orders"] });
                  navigate(`/console/orders/${createdOrder.id}`, { replace: true, viewTransition: true });
                }}
              />
            )}
          </div>
        </LayerCard>
      </>
    );
  }

  if (!draft) {
    return (
      <>
        {certification.feedback}<PageHeader title="确认订单" description="订单配置仅在当前浏览器会话中保留。" />
        <PageState empty emptyTitle="没有待确认的订单" emptyDescription="请返回商品页选择配置。">
          <span />
        </PageState>
        <LinkButton href="/console/products" variant="secondary">浏览商品</LinkButton>
      </>
    );
  }

  return (
    <>
      {certification.feedback}<PageHeader title="确认订单" description="提交前请核对真实商品配置与计费周期。" />
      {draft.customFieldSchema?.length ? <LayerCard className="px-5 py-4"><ProductCustomFields fields={draft.customFieldSchema} values={draft.customFields??{}} onChange={values=>{const next={...draft,customFields:values};setDraft(next);saveOrderDraft(next);}}/></LayerCard>:null}
      {needsQuote && quoteQuery.error ? <Banner variant="error" title="无法确认商品报价" description={getApiMessage(quoteQuery.error)} /> : null}
      {quoteChanged ? <LayerCard className="grid gap-3 px-5 py-4"><Banner title="商品报价已变化" description={`当前总价 ¥${quoteQuery.data!.total}，请确认后继续。`}/><Button onClick={()=>{const next={...draft,totalYuan:Number(quoteQuery.data!.total),unitPriceYuan:Number(quoteQuery.data!.unit),quoteToken:quoteQuery.data!.token};setDraft(next);saveOrderDraft(next);}}>接受当前报价</Button></LayerCard>:null}
      {needsQuote && quoteExpired ? <Banner title="报价已过期" description="请更新报价后重新确认。"/>:null}
      {needsQuote ? <Button variant="secondary" loading={quoteQuery.isFetching} onClick={()=>void quoteQuery.refetch()}>更新报价</Button>:null}
      <PageState loading={coupons.isLoading} error={coupons.error ? getApiMessage(coupons.error) : null}>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <LayerCard className=" px-5 py-4">
          <DefinitionList
            rows={[
              { label: "商品", value: draft.productName },
              ...(draft.selectedSpec ? [{ label: "实例规格", value: `${draft.selectedSpec.name}｜${draft.selectedSpec.vcpu} vCPU｜${draft.selectedSpec.memory} 内存` }] : []),
              ...draft.configOptions.map((item) => ({ label: item.displayName, value: item.displayValue })),
              ...(draft.hostname ? [{ label: "主机名", value: draft.hostname }] : []),
              ...(draft.password
                ? [{ label: "实例密码", value: "已设置，将加密写入订单快照" }]
                : []),
              { label: "购买周期", value: draft.cycleLabel },
              { label: "数量", value: `${draft.quantity} 台` },
            ]}
          />
          {draft.configOptions.length ? <div className="mt-4 grid gap-2"><InstancePasswordInput label="本次实例密码" value={draft.password} onChange={(value) => { const next = { ...draft, password: value }; setDraft(next); saveOrderDraft(next); }} /><p className="text-base text-kumo-subtle">密码只在页面内存中保留；刷新后会替换为随机密码，请重新检查并确认。</p></div> : null}
        </LayerCard>
        <LayerCard className=" grid gap-5 px-5 py-4">
          <CheckoutPoints amountYuan={draft.totalYuan} onRedeemed={setCouponId} onBusy={setPointsBusy}/>
          <Select
            label="优惠券"
            value={couponId}
            onValueChange={(value) => value && setCouponId(value)}
            items={couponItems}
            disabled={coupons.isLoading || Boolean(coupons.error)}
          />
          <div className="border-t border-kumo-line pt-4">
            <div className="flex justify-between">
              <span>预计应付金额</span>
              <strong className="text-base text-kumo-strong font-medium">¥{Math.max(0,draft.totalYuan-((couponId==="auto"?Math.max(0,...(coupons.data??[]).map(c=>c.previewDiscount??0)):(coupons.data??[]).find(c=>c.id===couponId)?.previewDiscount??0)/100)).toFixed(2)}</strong>
            </div>
          </div>
          {create.error ? <Banner variant="error" title="创建订单失败" description={getApiMessage(create.error)} /> : null}
          <Button
            disabled={quoteBlocked || passwordIssues.length > 0 || pointsBusy || coupons.isLoading || coupons.isFetching || Boolean(coupons.error)}
            loading={create.isPending || certification.busy}
            onClick={() => void certification.run(() => create.mutate())}
          >
            提交订单并去支付
          </Button>
        </LayerCard>
      </div>
      </PageState>
    </>
  );
}
