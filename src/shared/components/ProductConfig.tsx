import { useCertificationGate } from "./CertificationGate";
import {
  Badge,
  Banner,
  Button,
  SensitiveInput,
  LayerCard,
  Radio,
  Table,
  Tabs,
} from "@cloudflare/kumo";
import { ArrowsClockwiseIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from "@phosphor-icons/react";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type {
  ConfigOption,
  OrderDraft,
  OrderPage,
  ProductDetail,
  ProductSpec,
} from "../api/console";
import { useCartStore } from "../stores/cart";
import { generatePassword } from "../utils/credentials";
import { cycleLabels } from "../utils/format";
import { saveOrderDraft } from "../utils/orderDraft";
import { isUpstreamProduct } from "../utils/productCatalog";
import { choiceLabel, isAdjustableOption, optionIndex, optionValueAt, usesResourceSlider, withoutZeroPrice } from "../utils/productOptions";
import { ProductSteps } from "./ProductSteps";

const cycleMonths: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  semiannually: 6,
  annually: 12,
};

const fieldOrder = ["storage_mode", "system_disk", "data_disk", "ip_num", "network", "bandwidth", "defense"];

function initialValue(option: ConfigOption) {
  return option.default || option.options[0]?.id || String(option.min ?? "");
}

function quantityOptionPrice(option: ConfigOption, selectedValue: string): number {
  const value = Number(selectedValue);
  if (!Number.isFinite(value)) return 0;
  return option.options.reduce((sum, tier) => {
    const minimum = tier.min ?? 0;
    if (!tier.price || value < minimum) return sum;
    const maximum = tier.max && tier.max > 0 ? tier.max : value;
    const upper = Math.min(value, maximum);
    const step = tier.step && tier.step > 0 ? tier.step : 1;
    const units = minimum === 0 ? upper / step : (upper - minimum + step) / step;
    return sum + Math.max(0, units) * tier.price;
  }, 0);
}

function numericPart(value: string): number | null {
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function matchSpecChoice(option: ConfigOption, target: number): string | undefined {
  return option.options.find((choice) => numericPart(choice.name) === target)?.id;
}

function optionTitle(field: string, fallback: string) {
  const labels: Record<string, string> = {
    storage_mode: "存储模式",
    system_disk: "系统盘",
    data_disk: "数据盘",
    ip_num: "公网 IP",
    network: "计费方式 / 网络类型",
    bandwidth: "带宽",
    defense: "防御峰值",
  };
  return labels[field] ?? fallback;
}

function ProductOptionControl({
  option,
  value,
  disabled,
  onChange,
}: {
  option: ConfigOption;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const stopsId = useId();
  const pageSize = 25;
  const [quantityPage, setQuantityPage] = useState(() => Math.max(0, Math.floor((Number(value) - option.min) / (option.step || 1) / pageSize)));
  if (!usesResourceSlider(option)) {
    const quantityCount = Math.floor((option.max - option.min) / (option.step || 1)) + 1;
    const page = Math.min(quantityPage, Math.max(0, Math.ceil(quantityCount / pageSize) - 1));
    const tabs = option.optionType === "qty"
      ? Array.from({ length: Math.min(pageSize, quantityCount - page * pageSize) }, (_, index) => {
        const quantity = Number((option.min + (page * pageSize + index) * (option.step || 1)).toFixed(8));
        return { value: String(quantity), label: `${quantity} ${option.unit || ""}`.trim(), disabled };
      })
      : option.options.map((choice) => ({ value: choice.id, label: choiceLabel(choice), disabled }));
    return <div className="grid min-w-0 gap-2">
      <Tabs aria-label={option.name} variant="segmented" value={value} onValueChange={onChange} tabs={tabs} />
      {option.optionType === "qty" && quantityCount > pageSize ? <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" disabled={disabled || page === 0} onClick={() => setQuantityPage(page - 1)}>上一组</Button>
        <span className="text-sm text-kumo-subtle">当前选择：{value} {option.unit} · 第 {page + 1} / {Math.ceil(quantityCount / pageSize)} 组</span>
        <Button variant="secondary" size="sm" disabled={disabled || (page + 1) * pageSize >= quantityCount} onClick={() => setQuantityPage(page + 1)}>下一组</Button>
      </div> : null}
    </div>;
  }
  if (option.optionType === "qty") {
    const current = Number(value);
    const step = option.step || 1;
    const immutable = disabled || option.min === option.max;
    const change = (next: number) => onChange(String(Math.min(option.max, Math.max(option.min, next))));
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden shrink-0 text-xs text-kumo-subtle lg:inline">{option.min}</span>
        <input
          aria-label={option.name}
          aria-valuetext={`${value} ${option.unit || ""}`.trim()}
          className="min-w-0 flex-1 accent-kumo-brand disabled:cursor-not-allowed disabled:opacity-50"
          type="range"
          min={option.min}
          max={option.max}
          step={step}
          value={value}
          disabled={immutable}
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="hidden shrink-0 text-xs text-kumo-subtle lg:inline">{option.max}</span>
        <Button variant="secondary" shape="square" icon={<MinusIcon />} aria-label={`减少${option.name}`} disabled={immutable || current <= option.min} onClick={() => change(current - step)} />
        <strong className="min-w-12 shrink-0 whitespace-nowrap text-center text-kumo-strong">{value} {option.unit}</strong>
        <Button variant="secondary" shape="square" icon={<PlusIcon />} aria-label={`增加${option.name}`} disabled={immutable || current >= option.max} onClick={() => change(current + step)} />
      </div>
    );
  }
  const index = optionIndex(option, value);
  const selectIndex = (next: number) => {
    const id = optionValueAt(option, next);
    if (id !== undefined) onChange(id);
  };
  return (
    <div className="grid min-w-0 gap-3">
      <input type="range" aria-label={option.name} aria-valuetext={option.options[index] ? choiceLabel(option.options[index]) : ""}
        className="min-w-0 w-full accent-kumo-brand disabled:cursor-not-allowed disabled:opacity-50"
        min={0} max={option.options.length - 1} step={1} value={index} list={stopsId} disabled={disabled}
        onChange={(event) => selectIndex(Number(event.target.value))} />
      <datalist id={stopsId}>{option.options.map((choice, stop) => <option key={choice.id} value={stop} label={choiceLabel(choice)} />)}</datalist>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`${option.name}档位`}>
        {option.options.map((choice, stop) => <Button key={choice.id} variant={index === stop ? "secondary" : "ghost"}
          size="sm" aria-pressed={index === stop} disabled={disabled} onClick={() => selectIndex(stop)}>{choiceLabel(choice)}</Button>)}
      </div>
    </div>
  );
}

function SpecTable({ specs, selectedId, onSelect, catalogSelection }: { specs: ProductSpec[]; selectedId: string; onSelect: (spec: ProductSpec) => void; catalogSelection: boolean }) {
  return (
    <LayerCard className="shadow-none overflow-hidden p-0">
      <div className="grid gap-1 p-5">
        <h2 className="text-lg font-semibold text-kumo-strong">{catalogSelection ? "销售规格" : "计算规格"}</h2>
        <p className="text-sm text-kumo-subtle">规格与价格以当前商品展示为准。</p>
      </div>
      {specs.length ? (
        <Radio.Group aria-label="计算规格" value={selectedId} onValueChange={(value) => { const spec = specs.find((item) => item.id === value); if (spec) onSelect(spec); }} className="overflow-x-auto">
          <Table>
            <Table.Header variant="compact">
              <Table.Row>
                <Table.Head>实例规格</Table.Head><Table.Head>vCPU</Table.Head><Table.Head>内存</Table.Head>
                <Table.Head>处理器型号</Table.Head><Table.Head>主频/睿频</Table.Head><Table.Head>基础防御</Table.Head>
                <Table.Head>上行带宽</Table.Head><Table.Head>下行速率</Table.Head><Table.Head>库存数量</Table.Head><Table.Head>参考价格</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {specs.map((spec) => (
                <Table.Row key={spec.id} variant={spec.id === selectedId ? "selected" : "default"}>
                  <Table.Cell>
                    <Radio.Item value={spec.id} label={spec.name} />
                  </Table.Cell>
                  <Table.Cell>{spec.vcpu} vCPU</Table.Cell><Table.Cell>{spec.memory}</Table.Cell>
                  <Table.Cell>{spec.processorModel || "—"}</Table.Cell><Table.Cell>{spec.processorFrequency || "—"}</Table.Cell>
                  <Table.Cell>{spec.defense || "—"}</Table.Cell><Table.Cell>{spec.upstreamBandwidth || "—"}</Table.Cell>
                  <Table.Cell>{spec.downstreamRate || "—"}</Table.Cell><Table.Cell>{spec.stock === null ? "库存充足" : `${spec.stock} 台`}</Table.Cell>
                  <Table.Cell><strong className="text-kumo-strong">¥{spec.price.toFixed(2)}/月</strong></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Radio.Group>
      ) : (
        <div className="border-t border-kumo-line p-5 text-sm text-kumo-subtle">规格待配置。运营完成商品规格配置后即可购买。</div>
      )}
    </LayerCard>
  );
}

export function ProductConfig({
  product,
  orderPage,
  billTarget,
  billLoading = false,
  catalogSelection = false,
  stepsTarget,
}: {
  product: ProductDetail;
  orderPage?: OrderPage;
  billTarget?: HTMLElement | null;
  billLoading?: boolean;
  catalogSelection?: boolean;
  stepsTarget?: HTMLElement | null;
}) {
  const navigate = useNavigate();
  const options = useMemo(() => orderPage?.configOptions ?? product.configOptions ?? [], [orderPage, product.configOptions]);
  const cycles = useMemo(() => !product.readOnly && orderPage?.cycles?.some((item) => item.billingcycle in cycleMonths)
    ? orderPage.cycles.filter((item) => item.billingcycle in cycleMonths)
    : [{ billingcycle: product.cycle || "monthly", label: cycleLabels[product.cycle] ?? product.cycle ?? "月付", price: product.price, setupFee: 0 }], [orderPage, product.cycle, product.price, product.readOnly]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [selectedSpecId, setSelectedSpecId] = useState(product.specs[0]?.id ?? "");
  const [cycle, setCycle] = useState(cycles[0]?.billingcycle ?? "monthly");
  const [quantity, setQuantity] = useState(1);

  const [password, setPassword] = useState(generatePassword);
  const [imageGroup, setImageGroup] = useState("");
  const certification = useCertificationGate();
  const addCart = useCartStore((state) => state.add);

  useEffect(() => {
    setSelected(Object.fromEntries(options.map((option) => [option.id, initialValue(option)])));
    setSelectedSpecId(product.specs[0]?.id ?? "");
  }, [product.id, options, product.specs]);

  useEffect(() => setCycle(cycles[0]?.billingcycle ?? "monthly"), [product.id, cycles]);

  const selectedSpec = product.specs.find((spec) => spec.id === selectedSpecId) ?? product.specs[0] ?? null;
  const dataCenterOption = options.find((option) => option.field === "data_center");
  const imageOption = options.find((option) => option.field === "image");
  const displayedOptions = (product.configMode === "fixed" ? [] : options)
    .filter(isAdjustableOption)
    .filter((option) => !["data_center", "区域", "region", "area", "image", "cpu"].includes(option.field))
    .sort((a, b) => {
      const ai = fieldOrder.indexOf(a.field); const bi = fieldOrder.indexOf(b.field);
      return (ai < 0 ? fieldOrder.length : ai) - (bi < 0 ? fieldOrder.length : bi);
    });
  const imageGroups = useMemo(() => orderPage?.imageGroups?.length
    ? orderPage.imageGroups
    : imageOption?.options.length ? [{ name: "全部镜像", child: imageOption.options }] : [], [imageOption, orderPage]);

  useEffect(() => {
    if (!imageGroups.length) return;
    const selectedImage = imageOption ? selected[imageOption.id] : undefined;
    const group = imageGroups.find((item) => item.child.some((choice) => choice.id === selectedImage)) ?? imageGroups[0];
    setImageGroup(group?.name ?? "");
  }, [imageGroups, imageOption, selected]);

  const selectSpec = (spec: ProductSpec) => {
    setSelectedSpecId(spec.id);
    setSelected((current) => {
      const next = { ...current };
      const cpu = options.find((option) => option.field === "cpu");
      const memory = options.find((option) => option.field === "memory");
      const memoryValue = numericPart(spec.memory);
      const cpuMatch = cpu ? matchSpecChoice(cpu, spec.vcpu) : undefined;
      const memoryMatch = memory && memoryValue !== null ? matchSpecChoice(memory, memoryValue) : undefined;
      if (cpuMatch) next[cpu!.id] = cpuMatch;
      if (memoryMatch) next[memory!.id] = memoryMatch;
      return next;
    });
  };

  const selectedCycle = cycles.find((item) => item.billingcycle === cycle) ?? cycles[0];
  const durationMonth = cycleMonths[selectedCycle?.billingcycle ?? cycle] ?? 1;
  const selectedOptions = useMemo(() => options.map((option, index) => {
    const value = selected[option.id] ?? initialValue(option);
    const choice = option.options.find((item) => item.id === value);
    return {
      id: option.id,
      field: option.field,
      value,
      displayName: option.name || option.field,
      displayValue: choice?.name ?? `${value}${option.unit ? ` ${option.unit}` : ""}`,
      position: index,
    };
  }), [options, selected]);
  const optionPrice = options.reduce((sum, option) => {
	if (product.readOnly) return 0;
    const value = selected[option.id] ?? initialValue(option);
    if (selectedSpec?.priceMode === "fixed" && (option.field === "cpu" || option.field === "memory")) return sum;
    return sum + (option.optionType === "qty" ? quantityOptionPrice(option, value) : (option.options.find((item) => item.id === value)?.price ?? 0));
  }, 0);
  const monthlyReference = cycles.find((item) => item.billingcycle === "monthly")?.price ?? product.price;
  const cycleDiscount = selectedCycle && monthlyReference > 0 ? selectedCycle.price / (monthlyReference * durationMonth) : 1;
  const monthlySpecPrice = selectedSpec?.price ?? product.price;
  const periodBase = (!selectedSpec || selectedSpec.priceMode === "upstream") && selectedCycle ? selectedCycle.price : monthlySpecPrice * durationMonth * cycleDiscount;
  const unitPrice = periodBase + optionPrice * durationMonth + (selectedCycle?.setupFee ?? 0);
  const total = unitPrice * quantity;
  const nextRenewal = (periodBase + optionPrice * durationMonth) * quantity;
  const monthlyEquivalent = durationMonth > 0 ? nextRenewal / durationMonth : nextRenewal;
  const selectedRegion = dataCenterOption?.options.find((item) => item.id === selected[dataCenterOption!.id])?.name ?? "默认地域";
  const outOfStock = selectedSpec?.stock !== null && selectedSpec?.stock !== undefined ? selectedSpec.stock <= 0 : product.stock !== null && product.stock <= 0;
  const specsUnavailable = isUpstreamProduct(product) ? !orderPage : product.specs.length === 0;

  const draft = (): OrderDraft => ({
    productId: product.id,
    productName: product.name,
    configMode: product.configMode,
    selectedSpec,
    configOptions: selectedOptions,
    billingCycle: selectedCycle?.billingcycle ?? cycle,
    cycleLabel: selectedCycle?.label || cycleLabels[selectedCycle?.billingcycle ?? cycle] || cycle,
    durationMonth,
    quantity,
    unitPriceYuan: unitPrice,
    totalYuan: total,
    hostname: "",
    password: options.length ? password : "",
  });

  const externalBill = billTarget !== undefined;
  const anchor = (name: string) => `product-${product.id}-${name}`;
  const steps = [
    ...(catalogSelection ? [{ id: "catalog-specifications", title: "计算规格" }] : []),
    ...displayedOptions.map((option) => ({ id: anchor(`option-${option.id}`), title: optionTitle(option.field, option.name || option.field) })),
    ...(imageOption && imageGroups.length ? [{ id: anchor("images"), title: "操作系统" }] : []),
    { id: anchor("purchase"), title: "购买信息" },
  ];
  const bill = (
    <LayerCard
      aria-busy={billLoading}
      className={`shadow-none ${externalBill ? "grid gap-5 p-5" : "sticky top-20 grid gap-5 p-5"}${billLoading ? " pointer-events-none" : ""}`}
    >
      <div className="grid gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-kumo-subtle">当前应付</span>
          {billLoading ? <Badge variant="secondary">正在更新</Badge> : null}
        </div>
        <strong className="text-3xl font-semibold text-kumo-strong">¥{total.toFixed(2)}</strong>
        <span className="text-sm text-kumo-subtle">{product.name} · 单台本周期 ¥{unitPrice.toFixed(2)}</span>
      </div>
      <div className="grid gap-2 border-t border-kumo-line pt-4 text-sm text-kumo-subtle">
        {selectedSpec ? <span>实例规格：{selectedSpec.name}</span> : <span>计算规格：{product.name}</span>}
        {selectedOptions.map((item) => <span key={`${item.id}-${item.field}`}>{item.displayName}：{withoutZeroPrice(item.displayValue)}</span>)}
        <span>购买周期：{selectedCycle?.label || cycleLabels[cycle] || cycle}</span>
        <span>购买数量：{quantity} 台</span>
        <span>折合月费：¥{monthlyEquivalent.toFixed(2)} / 月</span>
        <span>下次续费：¥{nextRenewal.toFixed(2)}</span>
      </div>
          <div className="grid gap-2"><span className="text-sm font-medium text-kumo-strong">购买数量</span><div className="flex items-center gap-3"><Button variant="secondary" shape="square" icon={<MinusIcon />} aria-label="减少购买数量" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} /><strong className="min-w-20 text-center text-kumo-strong">{quantity} 台</strong><Button variant="secondary" shape="square" icon={<PlusIcon />} aria-label="增加购买数量" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))} /></div></div>
      <Button variant="secondary" icon={<ShoppingCartIcon />} disabled={product.readOnly || billLoading || outOfStock || specsUnavailable || certification.busy} onClick={() => void certification.run(() => addCart(draft()))}>加入购物车</Button>
      <Button disabled={product.readOnly || billLoading || outOfStock || specsUnavailable || certification.busy} onClick={() => void certification.run(() => { saveOrderDraft(draft()); if (window.location.pathname.startsWith("/console")) navigate("/order/confirm", { viewTransition: true }); else window.location.assign("/order/confirm"); })}>立即购买</Button>
    </LayerCard>
  );
  return (
    <>
      <div
        aria-busy={billLoading}
        className={`${externalBill ? "grid items-start gap-6" : "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"}${billLoading ? " pointer-events-none" : ""}`}
      >
        <div className="grid gap-5">
        {!catalogSelection && (product.specs.length || !isUpstreamProduct(product)) ? <SpecTable specs={product.specs} selectedId={selectedSpecId} onSelect={selectSpec} catalogSelection={catalogSelection} /> : null}
        {!catalogSelection && selectedSpec ? (
          <LayerCard className="shadow-none p-5 text-sm"><span className="text-kumo-subtle">当前所选：</span><strong className="text-kumo-strong">{selectedRegion} · {selectedSpec.name}｜{selectedSpec.vcpu} vCPU｜{selectedSpec.memory} 内存</strong></LayerCard>
        ) : null}

        {displayedOptions.map((option) => {
          const value = selected[option.id] ?? initialValue(option);
          const isSlider = option.optionType === "qty" && usesResourceSlider(option);
          return (
            <LayerCard id={anchor(`option-${option.id}`)} key={`${option.id}-${option.field}`} className={`scroll-mt-4 shadow-none grid gap-4 p-5 ${isSlider ? "md:grid-cols-[8rem_minmax(0,1fr)] md:items-center" : ""}`}>
              <div><h2 className="text-lg font-semibold text-kumo-strong">{optionTitle(option.field, option.name || option.field)}</h2></div>
              <ProductOptionControl option={option} value={value} disabled={isSlider && product.configMode === "fixed"} onChange={(next) => setSelected((current) => ({ ...current, [option.id]: next }))} />
            </LayerCard>
          );
        })}

        {imageOption && imageGroups.length ? (
          <LayerCard id={anchor("images")} className="scroll-mt-4 shadow-none grid gap-4 p-5">
            <div><h2 className="text-lg font-semibold text-kumo-strong">操作系统</h2><p className="text-sm text-kumo-subtle">请选择需要安装的系统镜像与版本。</p></div>
            <div className="min-w-0 overflow-x-auto"><Tabs variant="segmented" tabs={imageGroups.map((group) => ({ value: group.name, label: group.name }))} value={imageGroup || imageGroups[0]!.name} onValueChange={(value) => { setImageGroup(value); const first = imageGroups.find((group) => group.name === value)?.child[0]; if (first) setSelected((current) => ({ ...current, [imageOption.id]: first.id })); }} /></div>
            {imageGroups.filter((group) => group.name === (imageGroup || imageGroups[0]!.name)).map((group) => (
              <div key={group.name} className="overflow-x-auto"><Tabs variant="segmented" aria-label="镜像版本" value={selected[imageOption.id] ?? initialValue(imageOption)} onValueChange={(value) => setSelected((current) => ({ ...current, [imageOption.id]: value }))} tabs={group.child.map((choice) => ({ value: choice.id, label: choiceLabel(choice) }))} /></div>
            ))}
          </LayerCard>
        ) : null}

        <LayerCard id={anchor("purchase")} className="scroll-mt-4 shadow-none grid gap-5 p-5">
          <h2 className="text-lg font-semibold text-kumo-strong">购买信息</h2>
<div className="overflow-x-auto"><Tabs variant="segmented" aria-label="购买时长" value={cycle} onValueChange={setCycle} tabs={cycles.map((item) => ({ value: item.billingcycle, label: `${item.label || cycleLabels[item.billingcycle] || item.billingcycle}${item.price ? ` ¥${item.price.toFixed(2)}` : ""}` }))} /></div>
          {options.length ? <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2"><SensitiveInput label="自动生成密码" value={password} readOnly /><Button variant="secondary" shape="square" icon={<ArrowsClockwiseIcon />} aria-label="重新生成密码" onClick={() => setPassword(generatePassword())} /></div> : null}
        </LayerCard>

        {certification.feedback}<Banner variant="error" title="合规警告" description="国内云产品须完成实名认证。严禁搭建色情、赌博、诈骗、挖矿、外挂、扫描、发包、加速、博彩、VOIP 等违法违规业务；严禁对外提供 VPN 服务、DDoS 攻击及其他危害网络安全的用途。" />
        <LayerCard className="shadow-none grid gap-2 p-5"><h2 className="text-lg font-semibold text-kumo-strong">退订规则</h2><p className="text-sm text-kumo-subtle">如需退订，请在订单支付前核对配置。已开通资源按商品退订规则处理，部分特殊商品不支持退订。</p></LayerCard>
        </div>

        {externalBill ? null : bill}
      </div>
      {billTarget ? createPortal(bill, billTarget) : null}
      {stepsTarget ? createPortal(<ProductSteps steps={steps} />, stepsTarget) : null}
    </>
  );
}
