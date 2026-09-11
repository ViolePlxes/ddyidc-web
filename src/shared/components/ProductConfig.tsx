import {
  Badge,
  Banner,
  Button,
  Input,
  LayerCard,
  Radio,
  Select,
  Table,
  Tabs,
} from "@cloudflare/kumo";
import { ArrowsClockwiseIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type {
  ConfigOption,
  ConfigOptionValue,
  OrderDraft,
  OrderPage,
  ProductDetail,
  ProductSpec,
} from "../api/console";
import { useCartStore } from "../stores/cart";
import { generateHostname, generatePassword } from "../utils/credentials";
import { cycleLabels } from "../utils/format";
import { saveOrderDraft } from "../utils/orderDraft";

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

function choiceLabel(choice: ConfigOptionValue) {
  return `${choice.name}${choice.price ? `（+¥${choice.price.toFixed(2)}）` : ""}`;
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
    bandwidth: "带宽上限",
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
  if (option.optionType === "qty") {
    const current = Number(value);
    const step = option.step || 1;
    const immutable = disabled || option.min === option.max;
    const change = (next: number) => onChange(String(Math.min(option.max, Math.max(option.min, next))));
    return (
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" shape="square" icon={<MinusIcon />} aria-label={`减少${option.name}`} disabled={immutable || current <= option.min} onClick={() => change(current - step)} />
          <strong className="min-w-24 text-center text-kumo-strong">{value} {option.unit}</strong>
          <Button variant="secondary" shape="square" icon={<PlusIcon />} aria-label={`增加${option.name}`} disabled={immutable || current >= option.max} onClick={() => change(current + step)} />
        </div>
        <input
          aria-label={option.name}
          className="w-full accent-kumo-brand disabled:cursor-not-allowed disabled:opacity-50"
          type="range"
          min={option.min}
          max={option.max}
          step={step}
          value={value}
          disabled={immutable}
          onChange={(event) => onChange(event.target.value)}
        />
        <div className="flex justify-between text-xs text-kumo-subtle">
          <span>{option.min} {option.unit}</span>
          <span>{option.max} {option.unit}</span>
        </div>
        {disabled ? <span className="text-sm text-kumo-subtle">固定套餐采用上游固定值，此项不可调整。</span> : null}
      </div>
    );
  }
  if (option.options.length === 1) {
    return <strong className="text-kumo-strong">{choiceLabel(option.options[0]!)}</strong>;
  }
  return (
    <Radio.Group legend={option.name} value={value} onValueChange={onChange} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {option.options.map((choice) => (
        <Radio.Item key={choice.id} value={choice.id} label={choice.name} description={choice.price ? `增加 ¥${choice.price.toFixed(2)}` : undefined} />
      ))}
    </Radio.Group>
  );
}

function SpecTable({ specs, selectedId, onSelect }: { specs: ProductSpec[]; selectedId: string; onSelect: (spec: ProductSpec) => void }) {
  return (
    <LayerCard className="overflow-hidden p-0">
      <div className="grid gap-1 p-5">
        <h2 className="text-lg font-semibold text-kumo-strong">计算规格</h2>
        <p className="text-sm text-kumo-subtle">规格由运营人工维护，价格不会从上游配置项推导。</p>
      </div>
      {specs.length ? (
        <Radio.Group legend="选择计算规格" value={selectedId} onValueChange={(value) => { const spec = specs.find((item) => item.id === value); if (spec) onSelect(spec); }} className="overflow-x-auto">
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
}: {
  product: ProductDetail;
  orderPage?: OrderPage;
  billTarget?: HTMLElement | null;
  billLoading?: boolean;
}) {
  const navigate = useNavigate();
  const options = useMemo(() => orderPage?.configOptions ?? product.configOptions ?? [], [orderPage, product.configOptions]);
  const cycles = useMemo(() => orderPage?.cycles?.length
    ? orderPage.cycles
    : [{ billingcycle: product.cycle || "monthly", label: cycleLabels[product.cycle] ?? product.cycle ?? "月付", price: product.price, setupFee: 0 }], [orderPage, product.cycle, product.price]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [selectedSpecId, setSelectedSpecId] = useState(product.specs[0]?.id ?? "");
  const [cycle, setCycle] = useState(cycles[0]?.billingcycle ?? "monthly");
  const [quantity, setQuantity] = useState(1);
  const [hostname, setHostname] = useState(generateHostname);
  const [password, setPassword] = useState(generatePassword);
  const [imageGroup, setImageGroup] = useState("");
  const addCart = useCartStore((state) => state.add);

  useEffect(() => {
    setSelected(Object.fromEntries(options.map((option) => [option.field, initialValue(option)])));
    setSelectedSpecId(product.specs[0]?.id ?? "");
  }, [product.id, options, product.specs]);

  useEffect(() => setCycle(cycles[0]?.billingcycle ?? "monthly"), [product.id, cycles]);

  const selectedSpec = product.specs.find((spec) => spec.id === selectedSpecId) ?? product.specs[0] ?? null;
  const dataCenterOption = options.find((option) => option.field === "data_center");
  const imageOption = options.find((option) => option.field === "image");
  const displayedOptions = options
    .filter((option) => !["data_center", "cpu", "memory", "image"].includes(option.field))
    .sort((a, b) => {
      const ai = fieldOrder.indexOf(a.field); const bi = fieldOrder.indexOf(b.field);
      return (ai < 0 ? fieldOrder.length : ai) - (bi < 0 ? fieldOrder.length : bi);
    });
  const imageGroups = useMemo(() => orderPage?.imageGroups?.length
    ? orderPage.imageGroups
    : imageOption?.options.length ? [{ name: "全部镜像", child: imageOption.options }] : [], [imageOption, orderPage]);

  useEffect(() => {
    if (!imageGroups.length) return;
    const selectedImage = selected.image;
    const group = imageGroups.find((item) => item.child.some((choice) => choice.id === selectedImage)) ?? imageGroups[0];
    setImageGroup(group?.name ?? "");
  }, [imageGroups, selected.image]);

  const selectSpec = (spec: ProductSpec) => {
    setSelectedSpecId(spec.id);
    setSelected((current) => {
      const next = { ...current };
      const cpu = options.find((option) => option.field === "cpu");
      const memory = options.find((option) => option.field === "memory");
      const memoryValue = numericPart(spec.memory);
      const cpuMatch = cpu ? matchSpecChoice(cpu, spec.vcpu) : undefined;
      const memoryMatch = memory && memoryValue !== null ? matchSpecChoice(memory, memoryValue) : undefined;
      if (cpuMatch) next.cpu = cpuMatch;
      if (memoryMatch) next.memory = memoryMatch;
      return next;
    });
  };

  const selectedCycle = cycles.find((item) => item.billingcycle === cycle) ?? cycles[0];
  const durationMonth = cycleMonths[selectedCycle?.billingcycle ?? cycle] ?? 1;
  const selectedOptions = useMemo(() => options.map((option, index) => {
    const value = selected[option.field] ?? initialValue(option);
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
    const value = selected[option.field] ?? initialValue(option);
    if (selectedSpec?.priceMode === "fixed" && (option.field === "cpu" || option.field === "memory")) return sum;
    return sum + (option.optionType === "qty" ? quantityOptionPrice(option, value) : (option.options.find((item) => item.id === value)?.price ?? 0));
  }, 0);
  const monthlyReference = cycles.find((item) => item.billingcycle === "monthly")?.price ?? product.price;
  const cycleDiscount = selectedCycle && monthlyReference > 0 ? selectedCycle.price / (monthlyReference * durationMonth) : 1;
  const monthlySpecPrice = selectedSpec?.price ?? product.price;
  const periodBase = selectedSpec?.priceMode === "upstream" && selectedCycle ? selectedCycle.price : monthlySpecPrice * durationMonth * cycleDiscount;
  const unitPrice = periodBase + optionPrice * durationMonth + (selectedCycle?.setupFee ?? 0);
  const total = unitPrice * quantity;
  const nextRenewal = (periodBase + optionPrice * durationMonth) * quantity;
  const monthlyEquivalent = durationMonth > 0 ? nextRenewal / durationMonth : nextRenewal;
  const selectedRegion = dataCenterOption?.options.find((item) => item.id === selected.data_center)?.name ?? "默认地域";
  const outOfStock = selectedSpec?.stock !== null && selectedSpec?.stock !== undefined ? selectedSpec.stock <= 0 : product.stock !== null && product.stock <= 0;
  const specsUnavailable = product.specs.length === 0;

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
    hostname: options.length ? hostname : "",
    password: options.length ? password : "",
  });

  const externalBill = billTarget !== undefined;
  const bill = (
    <LayerCard
      aria-busy={billLoading}
      className={`${externalBill ? "grid gap-5 p-5" : "sticky top-20 grid gap-5 p-5"}${billLoading ? " pointer-events-none" : ""}`}
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
        {selectedSpec ? <span>实例规格：{selectedSpec.name}</span> : <span>实例规格：规格待配置</span>}
        {selectedOptions.map((item) => <span key={`${item.id}-${item.field}`}>{item.displayName}：{item.displayValue}</span>)}
        <span>购买周期：{selectedCycle?.label || cycleLabels[cycle] || cycle}</span>
        <span>购买数量：{quantity} 台</span>
        <span>折合月费：¥{monthlyEquivalent.toFixed(2)} / 月</span>
        <span>下次续费：¥{nextRenewal.toFixed(2)}</span>
      </div>
      <Button variant="secondary" icon={<ShoppingCartIcon />} disabled={outOfStock || specsUnavailable} onClick={() => addCart(draft())}>加入购物车</Button>
      <Button disabled={outOfStock || specsUnavailable} onClick={() => { saveOrderDraft(draft()); if (window.location.pathname.startsWith("/console")) navigate("/order/confirm", { viewTransition: true }); else window.location.assign("/order/confirm"); }}>立即购买</Button>
    </LayerCard>
  );
  return (
    <>
      <div
        aria-busy={billLoading}
        className={`${externalBill ? "grid items-start gap-6" : "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"}${billLoading ? " pointer-events-none" : ""}`}
      >
        <div className="grid gap-5">
        {dataCenterOption ? (
          <LayerCard className="grid gap-4 p-5">
            <div><h2 className="text-lg font-semibold text-kumo-strong">地域选择</h2><p className="text-sm text-kumo-subtle">建议选择距离业务更近的地域，以降低网络延时。</p></div>
            <Radio.Group legend="地域与线路节点" value={selected.data_center ?? initialValue(dataCenterOption)} onValueChange={(value) => setSelected((current) => ({ ...current, data_center: value }))} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dataCenterOption.options.map((choice) => <Radio.Item key={choice.id} value={choice.id} label={choice.name} />)}
            </Radio.Group>
          </LayerCard>
        ) : null}

        <SpecTable specs={product.specs} selectedId={selectedSpecId} onSelect={selectSpec} />
        {selectedSpec ? (
          <LayerCard className="p-5 text-sm"><span className="text-kumo-subtle">当前所选：</span><strong className="text-kumo-strong">{selectedRegion} · {selectedSpec.name}｜{selectedSpec.vcpu} vCPU｜{selectedSpec.memory} 内存</strong></LayerCard>
        ) : null}

        {displayedOptions.map((option) => {
          const value = selected[option.field] ?? initialValue(option);
          const isSlider = option.optionType === "qty";
          return (
            <LayerCard key={`${option.id}-${option.field}`} className="grid gap-4 p-5">
              <div><h2 className="text-lg font-semibold text-kumo-strong">{optionTitle(option.field, option.name || option.field)}</h2>{isSlider && product.configMode === "fixed" ? <p className="text-sm text-kumo-subtle">当前商品采用固定资源值。</p> : null}</div>
              <ProductOptionControl option={option} value={value} disabled={isSlider && product.configMode === "fixed"} onChange={(next) => setSelected((current) => ({ ...current, [option.field]: next }))} />
            </LayerCard>
          );
        })}

        {imageOption && imageGroups.length ? (
          <LayerCard className="grid gap-4 p-5">
            <div><h2 className="text-lg font-semibold text-kumo-strong">操作系统</h2><p className="text-sm text-kumo-subtle">镜像分组和版本来自上游实时订单页。</p></div>
            <Tabs variant="segmented" tabs={imageGroups.map((group) => ({ value: group.name, label: group.name }))} value={imageGroup || imageGroups[0]!.name} onValueChange={(value) => { setImageGroup(value); const first = imageGroups.find((group) => group.name === value)?.child[0]; if (first) setSelected((current) => ({ ...current, image: first.id })); }} />
            {imageGroups.filter((group) => group.name === (imageGroup || imageGroups[0]!.name)).map((group) => (
              <Select key={group.name} label="镜像版本" value={selected.image ?? initialValue(imageOption)} onValueChange={(value) => value && setSelected((current) => ({ ...current, image: value }))} items={Object.fromEntries(group.child.map((choice) => [choice.id, choiceLabel(choice)]))} />
            ))}
          </LayerCard>
        ) : null}

        <LayerCard className="grid gap-5 p-5">
          <h2 className="text-lg font-semibold text-kumo-strong">购买信息</h2>
          <Radio.Group legend="购买时长" value={cycle} onValueChange={setCycle} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cycles.map((item) => <Radio.Item key={item.billingcycle} value={item.billingcycle} label={item.label || cycleLabels[item.billingcycle] || item.billingcycle} description={`¥${item.price.toFixed(2)}`} />)}
          </Radio.Group>
          <div className="grid gap-2"><span className="text-sm font-medium text-kumo-strong">购买数量</span><div className="flex items-center gap-3"><Button variant="secondary" shape="square" icon={<MinusIcon />} aria-label="减少购买数量" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} /><strong className="min-w-20 text-center text-kumo-strong">{quantity} 台</strong><Button variant="secondary" shape="square" icon={<PlusIcon />} aria-label="增加购买数量" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))} /></div></div>
          {options.length ? <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid grid-cols-[1fr_auto] items-end gap-2"><Input label="自动生成主机名" value={hostname} readOnly /><Button variant="secondary" shape="square" icon={<ArrowsClockwiseIcon />} aria-label="重新生成主机名" onClick={() => setHostname(generateHostname())} /></div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-2"><Input label="自动生成密码" value={password} readOnly type="password" /><Button variant="secondary" shape="square" icon={<ArrowsClockwiseIcon />} aria-label="重新生成密码" onClick={() => setPassword(generatePassword())} /></div>
          </div> : null}
        </LayerCard>

        <Banner variant="error" title="合规警告" description="国内云产品须完成实名认证。严禁搭建色情、赌博、诈骗、挖矿、外挂、扫描、发包、加速、博彩、VOIP 等违法违规业务；严禁对外提供 VPN 服务、DDoS 攻击及其他危害网络安全的用途。" />
        <LayerCard className="grid gap-2 p-5"><h2 className="text-lg font-semibold text-kumo-strong">退订规则</h2><p className="text-sm text-kumo-subtle">如需退订，请在订单支付前核对配置。已开通资源按供应商实际退订规则处理，部分特殊商品不支持退订。</p></LayerCard>
        </div>

        {externalBill ? null : bill}
      </div>
      {billTarget ? createPortal(bill, billTarget) : null}
    </>
  );
}
