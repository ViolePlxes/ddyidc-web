import { Banner, Button, Input, LayerCard, Pagination, Radio, Table, Tabs } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import "./walletRecharge.css";
import { consoleApi, type Recharge } from "../../../shared/api/console";
import { getConsoleOverview } from "../../../shared/api/consoleHome";
import { paymentApi, type AlipayCheckoutMode, type PaymentChannel, type PaymentCheckout } from "../../../shared/api/payment";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { useOrders, useRecharges } from "../../../shared/hooks/useConsoleData";
import { formatMoney, rechargeStatusLabel } from "../../../shared/utils/format";
import { amountInCents, checkoutCode, walletCheckoutMode } from "./walletPayment";
import { getBankTransfer } from "../../../shared/api/bankTransfer";

type Channels = Record<PaymentChannel, boolean>;
type Attempt = { checkout: PaymentCheckout; qr: string; payUrl?: string; amountCents: number; channel: PaymentChannel; deadline: number };
const methods = [{ value: "alipay", label: "支付宝" }, { value: "wechat", label: "微信支付" }] as const;
const amounts = [10, 20, 50, 100, 300, 500] as const;
const terminalStates = new Set(["closed", "failed", "refunded", "received_review"]);

async function loadChannels(): Promise<Channels> {
  const response = await fetch("/wallet-payment-channels.json", { credentials: "omit", cache: "no-store" });
  if (!response.ok) throw new Error("支付方式配置暂不可用，请稍后重试");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("wechat" in data) || !("alipay" in data) ||
    typeof data.wechat !== "boolean" || typeof data.alipay !== "boolean") {
    throw new Error("支付方式配置无效，请联系在线客服");
  }
  return { wechat: data.wechat, alipay: data.alipay };
}

export function WalletRecharge() {
  const [tab, setTab] = useState("online");
  const bank = useQuery({ queryKey: ["wallet", "bank-transfer"], queryFn: getBankTransfer, enabled: tab === "bank", staleTime: 0 });
  const channels = useQuery({ queryKey: ["wallet", "payment-channels"], queryFn: loadChannels, staleTime: 0 });
  const balance = useQuery({ queryKey: ["console", "overview", "7"], queryFn: () => getConsoleOverview(7) });
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<PaymentChannel | null>(null);
  const channel = selected && channels.data?.[selected] ? selected : methods.find(method => channels.data?.[method.value])?.value;
  const [amountChoice, setAmountChoice] = useState("10");
  const [amount, setAmount] = useState("");
  const cents = amountInCents(amountChoice === "custom" ? amount : amountChoice);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [message, setMessage] = useState("");
  const [pollError, setPollError] = useState("");
  const [stopped, setStopped] = useState(false);
  const pendingRecharge = useRef<{ recharge: Recharge; channel: PaymentChannel } | null>(null);
  const submitLock = useRef(false);
  const create = useMutation({
    retry: false,
    mutationFn: async ({ amountCents, method, mode, popup }: { amountCents: number; method: PaymentChannel; mode: AlipayCheckoutMode; popup?: Window }) => {
      try {
      let pending = pendingRecharge.current;
      if (!pending || pending.recharge.amount !== amountCents || pending.channel !== method) {
        pending = { recharge: await consoleApi.createRecharge(amountCents, method), channel: method };
        pendingRecharge.current = pending;
      }
      const checkout = await paymentApi.create("recharge", pending.recharge.id, method, mode);
      const code = checkoutCode(checkout, method);
      const qr = method === "wechat" ? await QRCode.toDataURL(code, { width: 280, margin: 2, errorCorrectionLevel: "L" }) : "";
      if (method === "alipay") {
        if (mode === "wap") {
          window.location.assign(code);
        } else {
          if (!popup || popup.closed) throw new Error("支付宝支付窗口已关闭，请重新发起支付");
          popup.location.replace(code);
        }
      }
      return { checkout, qr, payUrl: method === "alipay" ? code : undefined, amountCents, channel: method, deadline: Date.now() + 120_000 };
      } catch (error) {
        popup?.close();
        throw error;
      }
    },
    onSuccess: (result) => { setMessage(""); setPollError(""); setStopped(false); setAttempt(result); },
    onSettled: () => { submitLock.current = false; void queryClient.invalidateQueries({ queryKey: ["finance", "recharges"] }); },
  });

  useEffect(() => {
    if (!attempt || stopped) return;
    let active = true;
    let pollTimer: number | undefined;
    const timeout = window.setTimeout(() => {
      if (!active) return;
      active = false;
      window.clearTimeout(pollTimer);
      setStopped(true);
      setMessage("支付超时，请重新发起");
    }, Math.max(0, attempt.deadline - Date.now()));
    const poll = async () => {
      try {
        const result = await paymentApi.statusByPayNo(attempt.checkout.payNo);
        if (!active) return;
        setPollError("");
        if (result.status === "paid") {
          active = false;
          window.clearTimeout(timeout);
          pendingRecharge.current = null;
          setAttempt(null);
          setMessage("支付成功");
          await queryClient.invalidateQueries({ queryKey: ["finance", "recharges"] });
          await queryClient.invalidateQueries({ queryKey: ["console", "overview"] });
          return;
        }
        if (terminalStates.has(result.status)) {
          active = false;
          window.clearTimeout(timeout);
          setStopped(true);
          setMessage(result.status === "received_review" ? "已收到付款，待核对，请联系在线客服，勿重复付款" : "支付单已关闭、失败或退款，请查看充值记录");
          return;
        }
      } catch (error) {
        if (!active) return;
        setPollError(getApiMessage(error));
      }
      if (active) pollTimer = window.setTimeout(() => void poll(), 2_000);
    };
    void poll();
    return () => { active = false; window.clearTimeout(timeout); window.clearTimeout(pollTimer); };
  }, [attempt, stopped, queryClient]);

  const locked = create.isPending || Boolean(attempt && !stopped);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!cents || !channel || locked || submitLock.current) return;
    const mode = channel === "alipay" ? walletCheckoutMode(navigator.userAgent, navigator.maxTouchPoints) : "page";
    const popup = channel === "alipay" && mode === "page" ? window.open("about:blank", "_blank") : undefined;
    if (channel === "alipay" && mode === "page" && !popup) {
      setMessage("浏览器阻止了支付宝支付窗口，请允许本站打开新窗口后重试");
      return;
    }
    if (popup) popup.opener = null;
    submitLock.current = true;
    setAttempt(null); setMessage(""); setPollError("");
    create.mutate({ amountCents: cents, method: channel, mode, popup: popup ?? undefined });
  };

  return <div className="wallet-recharge-page">
    <PageHeader title="账户充值" />
    <LayerCard className="wallet-recharge-balance grid gap-3 bg-transparent p-0 shadow-none ring-0 sm:flex sm:items-center sm:justify-between">
      <div className="grid gap-1"><span className="text-sm text-kumo-subtle">当前账户总余额</span><strong className="text-xl text-kumo-strong">{balance.data ? `¥${Number(balance.data.balance).toFixed(2)}` : "—"}</strong></div>
      <div className="flex gap-4 text-sm"><Link to="/wallet/recharge-records" className="text-kumo-link">充值记录</Link><Link to="/wallet/consume-records" className="text-kumo-link">消费记录</Link></div>
    </LayerCard>
    {balance.error ? <Banner variant="error" title="余额读取失败" description={getApiMessage(balance.error)} /> : null}
    <div className="wallet-recharge-tabs"><Tabs tabs={[{ value: "online", label: "在线充值" }, { value: "bank", label: "对公汇款" }]} value={tab} onValueChange={setTab} /></div>
    {tab === "bank" ? <section className="wallet-transfer" aria-label="对公汇款">
      <h2 className="text-sm font-semibold">收款方信息</h2>
      {bank.isLoading ? <p role="status">正在读取收款信息…</p> : null}
      {bank.error ? <Banner variant="error" title="收款信息读取失败" description={getApiMessage(bank.error)} /> : null}
      {bank.data?.enabled ? <><dl>
        <dt>开户名称</dt><dd>{bank.data.companyName}</dd>
        <dt>开户银行</dt><dd>{bank.data.bankName}</dd>
        <dt>银行账号</dt><dd>{bank.data.bankAccount}</dd>
        {bank.data.bankCode ? <><dt>联行号</dt><dd>{bank.data.bankCode}</dd></> : null}
      </dl><section className="wallet-recharge-notes"><h2>提示</h2>
        <ol className="list-decimal pl-5"><li>请核对收款方信息后汇款，并在备注中填写平台账号或用户编号。</li><li>汇款后请保留银行回单，联系在线客服核对到账。余额以平台实际入账记录为准，请勿重复付款。</li></ol>
        {bank.data.instructions ? <p className="mt-3 whitespace-pre-wrap">{bank.data.instructions}</p> : null}
      </section></> : !bank.isLoading && !bank.error ? <p className="text-sm text-kumo-subtle">配置后可用</p> : null}
    </section> : <>
    <LayerCard className={`wallet-recharge-main grid gap-6 bg-transparent p-0 shadow-none ring-0${attempt || message ? " lg:grid-cols-2" : ""}`}>
      <form className="wallet-recharge-form" onSubmit={submit}>
        <Radio.Group legend="支付方式" appearance="card" orientation="vertical" value={channel ?? ""} disabled={locked} onValueChange={value => { if (value === "alipay" || value === "wechat") setSelected(value); }} className="w-full">
          {methods.map(method => <Radio.Item key={method.value} value={method.value} className="wallet-payment-method" label={<img src={`/payment-logos/${method.value}.svg`} alt={method.label} />} disabled={!channels.data?.[method.value]} description={!channels.data?.[method.value] ? "暂未开放" : undefined} />)}
        </Radio.Group>
        {channels.isLoading ? <p role="status" className="text-sm text-kumo-subtle">正在读取支付方式…</p> : null}
        {channels.error ? <Banner variant="error" title="支付方式读取失败" description={getApiMessage(channels.error)} /> : null}
        <div className="grid gap-3">
          <span className="text-sm text-kumo-subtle">支付金额（元）</span>
          <div className="flex flex-wrap gap-2" aria-label="快捷充值金额">{amounts.map(value => <Button type="button" className="wallet-amount" size="sm" key={value} disabled={locked} aria-pressed={amountChoice === String(value)} variant={amountChoice === String(value) ? "primary" : "secondary"} onClick={() => setAmountChoice(String(value))}>¥{value}</Button>)}
            <Button type="button" className="wallet-amount" size="sm" disabled={locked} aria-pressed={amountChoice === "custom"} variant={amountChoice === "custom" ? "primary" : "secondary"} onClick={() => setAmountChoice("custom")}>自定义</Button>
          </div>
          {amountChoice === "custom" ? <Input className="wallet-custom-amount" label="自定义金额（元）" value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" disabled={locked} placeholder="请输入充值金额" /> : null}
          {amountChoice === "custom" && !cents ? <p role="alert" className="text-sm text-kumo-danger">请输入 1 至 1000000 元，最多两位小数。</p> : null}
        </div>
        <Button type="submit" className="wallet-pay-button w-full justify-center" variant="primary" loading={create.isPending} disabled={!cents || !channel || locked}>去支付{cents ? ` ${formatMoney(cents)}` : ""}</Button>
        {create.error ? <Banner variant="error" title="发起充值失败" description={getApiMessage(create.error)} /> : null}
      </form>
      {attempt || message || pollError ? <section className="grid content-center justify-items-center gap-4" aria-label="支付状态">
        {attempt && !stopped ? <><h2 className="text-lg font-semibold">{attempt.channel === "wechat" ? "请使用微信扫码支付" : "请在支付宝官方收银台完成支付"}</h2><strong>{formatMoney(attempt.amountCents)}</strong>
          {attempt.channel === "wechat" ? <img src={attempt.qr} width={280} height={280} alt="微信付款二维码" /> : <><p className="text-sm text-kumo-subtle">支付宝收银台已在新窗口打开。</p><a href={attempt.payUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-kumo-link">重新打开支付宝收银台</a></>}
          <p role="status" className="text-sm text-kumo-subtle">正在等待支付结果，请勿重复付款。</p></> : <><h2 className="text-lg font-semibold">支付状态</h2><p className="text-sm text-kumo-subtle">支付宝将打开官方收银台新窗口，微信将在本页显示付款二维码。</p></>}
        {message ? <Banner title={message} /> : null}
        {pollError && !stopped ? <Banner variant="alert" title="支付状态暂未获取" description={pollError} /> : null}
      </section> : null}
    </LayerCard>
    <section className="wallet-recharge-notes"><h2>温馨提示：</h2><ol className="list-decimal pl-5">
      <li>购买充值款及预存款均不支持提现，请理性购买充值。</li>
      <li>使用场景:你可以使用余额购买站内任何产品与服务。</li>
      <li>换算比例为1：1，即1元=1余额，选择对应付款方式充值，充值如遇问题请联系在线客服。</li>
    </ol></section></>}
  </div>;
}

export function WalletRechargeRecords() {
  const [page, setPage] = useState(1);
  const query = useRecharges(page);
  const rows = query.data?.list ?? [];
  return <><PageHeader title="充值记录" actions={<Link to="/wallet/recharge">返回账户充值</Link>} />
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无充值记录">
      <LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>充值单号</Table.Head><Table.Head>时间</Table.Head><Table.Head>金额</Table.Head><Table.Head>状态</Table.Head></Table.Row></Table.Header><Table.Body>{rows.map(row => <Table.Row key={row.id}><Table.Cell>{row.rechargeNo}</Table.Cell><Table.Cell>{row.createdAt}</Table.Cell><Table.Cell>{formatMoney(row.amount)}</Table.Cell><Table.Cell>{rechargeStatusLabel(row.status)}</Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
      <Pagination page={page} setPage={setPage} perPage={10} totalCount={query.data?.total ?? 0} />
    </PageState></>;
}

export function WalletConsumeRecords() {
  const [page, setPage] = useState(1);
  const query = useOrders(2, page);
  const rows = query.data?.list ?? [];
  return <><PageHeader title="消费记录" actions={<Link to="/wallet/recharge">返回账户充值</Link>} />
    <Banner title="已支付订单" description="此处展示已支付产品订单；支付方式和履约情况可在订单详情中查看。其他余额变动暂不在此列表展示。" />
    <PageState loading={query.isLoading} error={query.error ? getApiMessage(query.error) : null} empty={!query.isLoading && !query.error && rows.length === 0} emptyTitle="暂无已支付订单">
      <LayerCard className="overflow-x-auto p-0"><Table><Table.Header><Table.Row><Table.Head>订单号</Table.Head><Table.Head>支付时间</Table.Head><Table.Head>支付金额</Table.Head><Table.Head>详情</Table.Head></Table.Row></Table.Header><Table.Body>{rows.map(row => <Table.Row key={row.id}><Table.Cell>{row.orderNo}</Table.Cell><Table.Cell>{row.paidAt ?? "—"}</Table.Cell><Table.Cell>{formatMoney(row.payAmount)}</Table.Cell><Table.Cell><Link to={`/console/orders/${row.id}`}>查看订单</Link></Table.Cell></Table.Row>)}</Table.Body></Table></LayerCard>
      <Pagination page={page} setPage={setPage} perPage={10} totalCount={query.data?.total ?? 0} />
    </PageState></>;
}
