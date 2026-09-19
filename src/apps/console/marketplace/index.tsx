import { marketplaceFlowLabel } from "../../../shared/components/MarketplaceStatusBadge";
import { ConfirmAction } from "../../../shared/components/ConfirmAction";
import { PaymentDialog } from "../../../shared/components/PaymentDialog";
import { useAuthStore } from "../../../shared/stores/auth";
import { useMarketplaceAvailability } from "../../../shared/router/MarketplaceGate";
import {
  Badge,
  Banner,
  Button,
  Input,
  LayerCard,
  Switch,
  Table,
  Tabs,
  Textarea,
} from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  marketplaceApi,
  type ListingProduct,
} from "../../../shared/api/marketplace";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { MarketplaceStatusBadge, marketplaceFee } from "../../../shared/components/MarketplaceStatusBadge";

const money = (v: string) => `¥${Number(v || 0).toFixed(2)}`;
const tabs = [
  { value: "market", label: "逛市场" },
  { value: "sell", label: "我要出售" },
  { value: "mine", label: "我的挂牌" },
  { value: "orders", label: "交易订单" },
  { value: "wallet", label: "资金账户" },
  { value: "wants", label: "求购管理" },
];

function Notice({ message }: { message: string }) {
  return message ? <Banner variant="default" title={message} /> : null;
}

function MarketTab() {
  const [keyword, setKeyword] = useState("");
  const query = useQuery({
    queryKey: ["marketplace", "console", "listings", keyword],
    queryFn: () => marketplaceApi.listings({ keyword, pageSize: 50 }),
  });
  return (
    <>
      <LayerCard className="shadow-none p-5">
        <Input
          label="搜索在售产品"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </LayerCard>
      <PageState
        loading={query.isLoading}
        skeleton="products"
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.data?.list.length}
        emptyTitle="暂无在售产品"
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {query.data?.list.map((r) => (
            <LayerCard key={r.id} className="shadow-none grid gap-4 p-5">
              <div className="flex justify-between">
                <div>
                  <strong className="text-kumo-strong">{r.productName}</strong>
                  <p className="text-sm text-kumo-subtle">
                    {r.region || "区域未提供"} · 剩余 {r.remainingDays} 天
 <br />{r.sellerLabel} · {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={r.isRecommended ? "success" : "outline"}>
                  {r.isRecommended ? "推荐" : "在售"}
                </Badge>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs text-kumo-subtle">转让价</span>
                  <p className="text-xl font-semibold">{money(r.price)}</p>
                </div>
                  <Link reloadDocument to={`/marketplace/listing/${r.id}`}>
                  <Button>查看并购买</Button>
                </Link>
              </div>
            </LayerCard>
          ))}
        </div>
      </PageState>
    </>
  );
}

function SellTab() {
  const client = useQueryClient();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<ListingProduct>();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    region: "",
    price: "",
    originalRenewalPrice: "",
    sellerNote: "",
    backupConfirmed: false,
  });
  const products = useQuery({
    queryKey: ["marketplace", "listing-products"],
    queryFn: () => marketplaceApi.listingProducts(),
  });
  const status = useQuery({ queryKey: ["marketplace", "status"], queryFn: marketplaceApi.status });
  const estimatedFee = marketplaceFee(form.price, status.data?.feeType ?? "ratio", status.data?.feeRate ?? "0", status.data?.feeFixed ?? "0");
  const estimatedIncome = Math.max(0, Number(form.price || 0) - (status.data?.feeBearer === "seller" ? estimatedFee : 0));
  const create = useMutation({
    mutationFn: () =>
      marketplaceApi.createListing({ productId: selected?.id, ...form }),
    onSuccess: (row) => {
      setMessage(row.status === "on_sale" ? "挂牌已发布。" : "挂牌已提交，等待平台审核。");
      setStep(1);
      setSelected(undefined);
      void client.invalidateQueries({
        queryKey: ["marketplace", "listing-products"],
      });
    },
    onError: (e) => setMessage(getApiMessage(e)),
  });
  const choose = (p: ListingProduct) => {
    setSelected(p);
    setForm((v) => ({ ...v, title: p.productName }));
    setStep(2);
  };
  return (
    <>
      <Notice message={message} />
      <LayerCard className="shadow-none grid gap-5 p-5">
        {status.data && <p className="text-sm text-kumo-subtle">成交后平台收取 {status.data.feeRate}% 佣金，按元保留两位小数四舍五入；其余金额结算至账户余额。</p>}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((n) => (
            <Badge key={n} variant={step === n ? "success" : "outline"}>
              第 {n} 步：
              {n === 1 ? "选择产品" : n === 2 ? "填写信息" : "确认发布"}
            </Badge>
          ))}
        </div>
        {step === 1 ? (
          <PageState
            loading={products.isLoading}
            skeleton="table"
            error={products.error ? getApiMessage(products.error) : null}
            empty={!products.isLoading && !products.data?.length}
            emptyTitle="暂无可出售的云产品"
          >
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>产品</Table.Head>
                  <Table.Head>IP</Table.Head>
                  <Table.Head>剩余时间</Table.Head>
                  <Table.Head>操作</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {products.data?.map((p) => (
                  <Table.Row key={p.id}>
                    <Table.Cell>{p.productName}</Table.Cell>
                    <Table.Cell>{p.primaryIp || "—"}</Table.Cell>
                    <Table.Cell>{p.remainingDays} 天</Table.Cell>
                    <Table.Cell>
                      <Button onClick={() => choose(p)}>选择</Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </PageState>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="挂牌标题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <Input
                label="区域"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              />
              <Input
                label="转让价格（元）"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <Input
                label="原续费价格（元）"
                type="number"
                min="0"
                step="0.01"
                value={form.originalRenewalPrice}
                onChange={(e) =>
                  setForm({ ...form, originalRenewalPrice: e.target.value })
                }
              />
            </div>
            <Textarea
              label="卖家说明"
              rows={4}
              value={form.sellerNote}
              onChange={(e) => setForm({ ...form, sellerNote: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button
                disabled={!form.title.trim() || Number(form.price) <= 0}
                onClick={() => setStep(3)}
              >
                下一步
              </Button>
            </div>
          </div>
        ) : null}
        {step === 3 && selected ? (
          <div className="grid gap-4">
            <div className="grid gap-3 bg-kumo-control p-4">
              <strong>{form.title}</strong>
              <span>
                产品：{selected.productName}（剩余 {selected.remainingDays} 天）
              </span>
              <span>转让价格：{money(form.price)}</span>
              <span>原续费价：{money(form.originalRenewalPrice)}</span>
              <span>预估手续费：{money(String(estimatedFee))} · 卖家预计实收：{money(String(estimatedIncome))}</span>
            </div>
            <Switch
              label="我已完成数据备份，并了解成交后产品归属会立即变更"
              checked={form.backupConfirmed}
              onCheckedChange={(v) => setForm({ ...form, backupConfirmed: v })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep(2)}>
                上一步
              </Button>
              <Button
                loading={create.isPending}
                disabled={!form.backupConfirmed}
                onClick={() => create.mutate()}
              >
                确认发布
              </Button>
            </div>
          </div>
        ) : null}
      </LayerCard>
    </>
  );
}

function MyListingsTab() {
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const query = useQuery({
    queryKey: ["marketplace", "my-listings"],
    queryFn: () => marketplaceApi.myListings({ pageSize: 100 }),
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["marketplace", "my-listings"] });
  const off = useMutation({
    mutationFn: marketplaceApi.offListing,
    onSuccess: () => refresh(),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  const reprice = useMutation({
    mutationFn: (id: string) => marketplaceApi.reprice(id, prices[id] ?? ""),
    onSuccess: () => refresh(),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  return (
    <>
      <Notice message={message} />
      <PageState
        loading={query.isLoading}
        skeleton="table"
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.data?.list.length}
        emptyTitle="暂无挂牌记录"
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>挂牌</Table.Head>
                <Table.Head>价格</Table.Head>
                <Table.Head>状态</Table.Head>
                <Table.Head>操作</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {query.data?.list.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    <strong>{r.productName}</strong>
                    <p className="text-xs text-kumo-subtle">{r.listingNo}</p>
                  </Table.Cell>
                  <Table.Cell>{money(r.price)}</Table.Cell>
                  <Table.Cell>
                    <MarketplaceStatusBadge status={r.status} />

                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap items-end gap-2">
                      {r.status === "on_sale" ? (
                        <>
                          <Input
                            aria-label="新价格"
                            label="新价格"
                            className="w-28"
                            value={prices[r.id] ?? ""}
                            onChange={(e) =>
                              setPrices({ ...prices, [r.id]: e.target.value })
                            }
                          />
                          <Button
                            variant="secondary"
                            disabled={!prices[r.id]}
                            loading={reprice.isPending}
                            onClick={() => reprice.mutate(r.id)}
                          >
                            调价
                          </Button>
                          <Button
                            variant="destructive"
                            loading={off.isPending}
                            onClick={() => window.confirm("确认下架该挂牌？") && off.mutate(r.id)}
                          >
                            下架
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </>
  );
}

function OrdersTab() {
 const user=useAuthStore(state=>state.user);
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const query = useQuery({
    queryKey: ["marketplace", "orders"],
    queryFn: () => marketplaceApi.orders({ pageSize: 100 }),
 refetchInterval:5_000,
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["marketplace", "orders"] });
  const pay = useMutation({
    mutationFn: ({ id, method }: { id: string; method: "balance" | "alipay" }) => marketplaceApi.pay(id, method, method === "alipay" ? "page" : "qr"),
    onSuccess: (data) => {
      const checkout = data as { alipay?: { payUrl?: string } };
      if (checkout.alipay?.payUrl) { window.location.assign(checkout.alipay.payUrl); return; }
      setMessage("支付成功，产品归属已完成变更。");
      void refresh();
    },
    onError: (e) => setMessage(getApiMessage(e)),
  });
  const receipt=useMutation({mutationFn:marketplaceApi.confirm,onSuccess:()=>{setMessage("确认收货成功，卖家收入已结算到账户余额。");void refresh();},onError:(e)=>setMessage(getApiMessage(e))});
 const refund = useMutation({
    mutationFn: marketplaceApi.refund,
    onSuccess: () => refresh(),
    onError: (e) => setMessage(getApiMessage(e)),
  });
  return (
    <>
      <Notice message={message} />
      <PageState
        loading={query.isLoading}
        skeleton="table"
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.data?.list.length}
        emptyTitle="暂无交易订单"
      >
        <LayerCard className="shadow-none overflow-x-auto p-0">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>订单</Table.Head>
                <Table.Head>应付</Table.Head>
                <Table.Head>手续费</Table.Head>
                <Table.Head>状态</Table.Head>
                <Table.Head>操作</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {query.data?.list.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>
                    {r.orderNo}
                    <p className="text-xs text-kumo-subtle">
                      挂牌 {r.listingId}
                    </p>
                  </Table.Cell>
                  <Table.Cell>{money(r.payAmount)}</Table.Cell>
                  <Table.Cell>{money(r.fee)}</Table.Cell>
                  <Table.Cell>
                    <MarketplaceStatusBadge status={r.status} />
{r.status==="paid"&&r.settleAt&&<p className="text-xs text-kumo-subtle">自动收货：{new Date(r.settleAt).toLocaleString()}</p>}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      {r.status === "pending_pay" && r.buyerId===String(user?.id) ? (
                        <>
                          <Button loading={pay.isPending} onClick={() => pay.mutate({ id: r.id, method: "balance" })}>余额支付</Button>
                          <PaymentDialog businessType="marketplace" businessId={r.id} amountCents={Math.round(Number(r.payAmount)*100)} onPaid={async()=>{await refresh();}} />
                        </>
                      ) : null}
                      {r.status === "paid" && r.buyerId===String(user?.id) ? (
 <>
 <ConfirmAction title="确认收货" description="确认已接收实例后，平台将结算卖家收入。" loading={receipt.isPending} onConfirm={() => receipt.mutate(r.id)}>确认收货</ConfirmAction>
                        <Button
                          variant="destructive"
                          loading={refund.isPending}
                        onClick={() => window.confirm("确认申请退款？成功后产品归属和资金将一并回滚。") && refund.mutate(r.id)}
                        >
                          申请退款
                        </Button>
 </>
                      ) : null}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </LayerCard>
      </PageState>
    </>
  );
}

function WalletTab() {
  const client = useQueryClient();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const wallet = useQuery({
    queryKey: ["marketplace", "wallet"],
    queryFn: marketplaceApi.wallet,
  });
  const flows = useQuery({
    queryKey: ["marketplace", "flows"],
    queryFn: () => marketplaceApi.flows({ pageSize: 100 }),
  });
  const withdrawals = useQuery({
    queryKey: ["marketplace", "withdrawals"],
    queryFn: () => marketplaceApi.withdrawals({ pageSize: 20 }),
  });
  const withdraw = useMutation({
    mutationFn: () => marketplaceApi.withdraw(amount),
    onSuccess: () => {
      setMessage("提现申请已提交。");
      setAmount("");
      void client.invalidateQueries({ queryKey: ["marketplace", "wallet"] });
      void client.invalidateQueries({
        queryKey: ["marketplace", "withdrawals"],
      });
    },
    onError: (e) => setMessage(getApiMessage(e)),
  });
  return (
    <>
      <Notice message={message} />
<Banner title="新交易收入结算至账户余额" description="买家确认收货或超时后，扣除佣金的收入自动进入主账户。下方可提现金额仅为原市场钱包存量。" /><Link to="/console/finance">查看账户余额与流水</Link>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["可提现", wallet.data?.balance],
          ["冻结中", wallet.data?.frozenBalance],
          ["累计收入", wallet.data?.totalIncome],
          ["累计提现", wallet.data?.totalWithdrawn],
        ].map(([label, value]) => (
          <LayerCard key={label} className="shadow-none grid gap-1 p-5">
            <span className="text-sm text-kumo-subtle">{label}</span>
            <strong className="text-2xl text-kumo-strong">
              {money(value ?? "0")}
            </strong>
          </LayerCard>
        ))}
      </div>
      <LayerCard className="shadow-none grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <Input
          label="提现金额（元）"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          loading={withdraw.isPending}
          disabled={Number(amount) <= 0}
          onClick={() => window.confirm(`确认申请提现 ${money(amount)}？`) && withdraw.mutate()}
        >
          申请提现
        </Button>
      </LayerCard>
      <LayerCard className="shadow-none overflow-x-auto p-0">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>流水号</Table.Head>
              <Table.Head>类型</Table.Head>
              <Table.Head>方向</Table.Head>
              <Table.Head>金额</Table.Head>
              <Table.Head>时间</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {flows.data?.list.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell>{r.flowNo}</Table.Cell>
                <Table.Cell>{marketplaceFlowLabel(r.type)}</Table.Cell>
                <Table.Cell>
                  {r.direction === "in" ? "入账" : "出账"}
                </Table.Cell>
                <Table.Cell>{money(r.amount)}</Table.Cell>
                <Table.Cell>
                  {new Date(r.createdAt).toLocaleString("zh-CN")}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </LayerCard>
      {withdrawals.data?.list.length ? (
        <p className="text-sm text-kumo-subtle">
          最近提现：
          {withdrawals.data.list
            .map((r) => `${r.withdrawNo} ${money(r.amount)}（${r.status}）`)
            .join("；")}
        </p>
      ) : null}
    </>
  );
}

function WantsTab() {
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const [offer, setOffer] = useState({ wantId: "", listingId: "", price: "", message: "" });
  const [form, setForm] = useState({
    title: "",
    budgetMin: "",
    budgetMax: "",
    region: "",
    description: "",
    tags: [] as string[],
    status: "open",
  });
  const query = useQuery({
    queryKey: ["marketplace", "my-wants"],
    queryFn: marketplaceApi.myWants,
  });
  const publicWants = useQuery({ queryKey: ["marketplace", "wants", "matching"], queryFn: () => marketplaceApi.wants({ pageSize: 20 }) });
  const create = useMutation({
    mutationFn: () => marketplaceApi.createWant(form),
    onSuccess: () => {
      setMessage("求购信息已发布。");
      setForm({
        title: "",
        budgetMin: "",
        budgetMax: "",
        region: "",
        description: "",
        tags: [],
        status: "open",
      });
      void client.invalidateQueries({ queryKey: ["marketplace", "my-wants"] });
    },
    onError: (e) => setMessage(getApiMessage(e)),
  });
  const submitOffer = useMutation({ mutationFn: () => marketplaceApi.offer(offer.wantId, { listingId: offer.listingId || undefined, price: offer.price, message: offer.message }), onSuccess: () => { setMessage("报价已提交给求购方。"); setOffer({ wantId: "", listingId: "", price: "", message: "" }); }, onError: (e) => setMessage(getApiMessage(e)) });
  return (
    <>
      <Notice message={message} />
      <LayerCard className="shadow-none grid gap-4 p-5">
        <h2 className="font-semibold text-kumo-strong">发布求购</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="求购标题"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="区域"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          />
          <Input
            label="最低预算（元）"
            type="number"
            value={form.budgetMin}
            onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
          />
          <Input
            label="最高预算（元）"
            type="number"
            value={form.budgetMax}
            onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
          />
        </div>
        <Textarea
          label="配置与需求说明"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div>
          <Button
            loading={create.isPending}
            disabled={!form.title.trim() || Number(form.budgetMax) <= 0}
            onClick={() => create.mutate()}
          >
            发布求购
          </Button>
        </div>
      </LayerCard>
      <PageState
        loading={query.isLoading}
        skeleton="table"
        empty={!query.isLoading && !query.data?.list.length}
        emptyTitle="暂无我的求购"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {query.data?.list.map((r) => (
            <LayerCard key={r.id} className="shadow-none grid gap-2 p-5">
              <div className="flex justify-between">
                <strong>{r.title}</strong>
                <MarketplaceStatusBadge status={r.status} />
              </div>
              <span>
                {money(r.budgetMin)} – {money(r.budgetMax)}
              </span>
              <p className="text-sm text-kumo-subtle">{r.description}</p>
            </LayerCard>
          ))}
        </div>
      </PageState>
      <section className="grid gap-4"><div><h2 className="text-lg font-semibold text-kumo-strong">匹配公开求购</h2><p className="text-sm text-kumo-subtle">选择一条需求并提交报价，可选填关联挂牌编号。</p></div><div className="grid gap-4 lg:grid-cols-2">{publicWants.data?.list.map((want) => <LayerCard key={want.id} className="shadow-none grid gap-3 p-5"><div className="flex justify-between"><strong>{want.title}</strong><span>{money(want.budgetMin)} – {money(want.budgetMax)}</span></div><p className="text-sm text-kumo-subtle">{want.region || "区域不限"} · {want.description}</p>{offer.wantId === want.id ? <div className="grid gap-3"><Input label="报价（元）" type="number" value={offer.price} onChange={(e) => setOffer({ ...offer, price: e.target.value })} /><Input label="关联挂牌 ID（可选）" value={offer.listingId} onChange={(e) => setOffer({ ...offer, listingId: e.target.value })} /><Textarea label="报价说明" rows={3} value={offer.message} onChange={(e) => setOffer({ ...offer, message: e.target.value })} /><div className="flex gap-2"><Button loading={submitOffer.isPending} disabled={Number(offer.price) <= 0} onClick={() => submitOffer.mutate()}>提交报价</Button><Button variant="secondary" onClick={() => setOffer({ wantId: "", listingId: "", price: "", message: "" })}>取消</Button></div></div> : <Button variant="secondary" onClick={() => setOffer({ wantId: want.id, listingId: "", price: "", message: "" })}>我要报价</Button>}</LayerCard>)}</div></section>
    </>
  );
}

export function MarketplaceConsole() {
  const [params, setParams] = useSearchParams();
  const availability=useMarketplaceAvailability("public");
 const requestedTab=params.get("tab")??"market";
 const allowedTabs=availability.data?tabs:tabs.filter(item=>["mine","orders","wallet"].includes(item.value));
 const tab=allowedTabs.some(item=>item.value===requestedTab)?requestedTab:"orders";
  useEffect(() => {
    if (!tabs.some((x) => x.value === tab))
      setParams({ tab: "market" }, { replace: true });
  }, [tab, setParams]);
  return (
    <>
      <PageHeader
        title="交易市场"
        description="挂牌、购买、求购和资金记录统一管理。"
        actions={
          availability.data ? <Link reloadDocument to="/marketplace">
            <Button variant="secondary">公开市场</Button>
          </Link> : <span>市场暂未开放，已有交易继续处理</span>
        }
      />
      <Tabs
        variant="segmented"
        tabs={allowedTabs}
        value={tab}
        onValueChange={(value) => setParams({ tab: value })}
      />
      {tab === "market" ? (
        <MarketTab />
      ) : tab === "sell" ? (
        <SellTab />
      ) : tab === "mine" ? (
        <MyListingsTab />
      ) : tab === "orders" ? (
        <OrdersTab />
      ) : tab === "wallet" ? (
        <WalletTab />
      ) : (
        <WantsTab />
      )}
    </>
  );
}
