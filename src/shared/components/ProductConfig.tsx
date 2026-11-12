import {ScopedTable as Table} from './ScopedTable';
import { Badge } from "./Badge";
import { useCertificationGate } from "./CertificationGate";
import { Banner, Button, Checkbox, LayerCard, Radio, Select, Tabs } from "@cloudflare/kumo";
import { MinusIcon, PlusIcon, ShoppingCartIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { consoleApi } from "../api/console";
import { getApiMessage } from "../api/request";
import { useEffect, useMemo, useState } from "react";
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
import { InstancePasswordInput } from "./InstancePasswordInput";
import { generatePassword } from "../utils/credentials";
import { instancePasswordIssues } from "../utils/instancePassword";
import { cycleLabels } from "../utils/format";
import { saveOrderDraft } from "../utils/orderDraft";
import { isUpstreamProduct } from "../utils/productCatalog";
import { choiceLabel, isQuantityOption, configurationVisible, configurationInitialValue, configurationArray, configurationDisplayValue, isAdjustableOption, optionIndex, optionValueAt, usesResourceSlider, isResourceOption, optionValueCount, withoutZeroPrice } from "../utils/productOptions";
import { Slider } from "../vendor/kumo-slider/Slider";
import { ProductCustomFields, customFieldsIncomplete } from "./ProductCustomFields";
import { ProductSteps } from "./ProductSteps";

const cycleMonths: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  semiannually: 6,
  annually: 12,
};

const fieldOrder = ["cpu", "memory", "traffic","storage_mode", "system_disk", "data_disk", "ip_num", "network", "bandwidth", "defense"];

const regionFields = ["data_center", "region", "area", "区域"];
function isRegionOption(option: ConfigOption) {
  return regionFields.includes(option.field.trim().toLowerCase());
}

function locationKey(value: string): string | undefined {
  const name = value.trim().toLowerCase();
  if (/香港|hong\s*kong/.test(name)) return "hk";
  if (/美国|洛杉矶|los\s*angeles|united\s*states|\busa\b/.test(name)) return "us";
  if (/日本|东京|tokyo|japan/.test(name)) return "jp";
  if (/韩国|首尔|seoul|korea/.test(name)) return "kr";
  if (/台湾|台北|taipei|taiwan/.test(name)) return "tw";
  if (/新加坡|singapore/.test(name)) return "sg";
  if (/马来西亚|吉隆坡|malaysia|kuala\s*lumpur/.test(name)) return "my";
  if (/泰国|曼谷|thailand|bangkok/.test(name)) return "th";
  if (/越南|河内|vietnam|hanoi/.test(name)) return "vn";
  if (/菲律宾|马尼拉|philippines|manila/.test(name)) return "ph";
  if (/印度|孟买|india|mumbai/.test(name)) return "in";
  if (/德国|法兰克福|germany|frankfurt/.test(name)) return "de";
  if (/英国|伦敦|united\s*kingdom|london/.test(name)) return "uk";
  if (/法国|巴黎|france|paris/.test(name)) return "fr";
  if (/荷兰|阿姆斯特丹|netherlands|amsterdam/.test(name)) return "nl";
  if (/澳大利亚|悉尼|australia|sydney/.test(name)) return "au";
  if (/加拿大|多伦多|canada|toronto/.test(name)) return "ca";
  return undefined;
}

function isLocationIPGroup(option: ConfigOption, region?: ConfigOption) {
  if (!region || option.field !== "ip_num" || !option.options.length) return false;
  if (!/分组|地区|地域|位置|location|region/i.test(option.name)) return false;
  const regionKeys = new Set(region.options.map((choice) => locationKey(choice.name)).filter(Boolean));
  return regionKeys.size > 0 && option.options.every((choice) => regionKeys.has(locationKey(choice.name)));
}

function matchingIPChoice(region: ConfigOption, regionValue: string, ipGroup: ConfigOption) {
  const regionName = region.options.find((choice) => choice.id === regionValue)?.name ?? "";
  const key = locationKey(regionName);
  return key ? ipGroup.options.find((choice) => locationKey(choice.name) === key) : undefined;
}

const initialValue = configurationInitialValue;

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

export function ProductOptionControl({
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
  const pageSize = 25;
  const [quantityPage, setQuantityPage] = useState(() => Math.max(0, Math.floor((Number(value) - option.min) / (option.step || 1) / pageSize)));
  if (option.optionType==="unsupported") return <Banner variant="error" title="此配置暂不可用" description="该商品配置协议尚未完成验证，请联系管理员。"/>;
  if(option.optionType==="multi_select") {const values=configurationArray(value);return <div className="flex flex-wrap gap-4">{option.options.map(choice=><Checkbox key={choice.id} label={choiceLabel(choice)} disabled={disabled} checked={values.includes(choice.id)} onCheckedChange={checked=>onChange(JSON.stringify(checked?[...values,choice.id].sort():values.filter(id=>id!==choice.id)))}/>)}</div>;}
  if(option.optionType==="cascade") {const path=configurationArray(value);const levels: ConfigOption["options"][]=[];let choices=option.options;for(let i=0;i<32&&choices.length;i++){levels.push(choices);const choice=choices.find(c=>c.id===path[i]);choices=choice?.children??[];}return <div className="grid gap-3 sm:grid-cols-2">{levels.map((items,index)=><Select key={index} label={`${option.name} ${index+1}`} value={path[index]??""} items={Object.fromEntries(items.map(c=>[c.id,c.name]))} disabled={disabled} onValueChange={next=>{if(next)onChange(JSON.stringify([...path.slice(0,index),next]));}}/>)}</div>;}
  if (!usesResourceSlider(option)) {
    const quantityCount = optionValueCount(option);
    const page = Math.min(quantityPage, Math.max(0, Math.ceil(quantityCount / pageSize) - 1));
    const tabs = isQuantityOption(option)
      ? Array.from({ length: Math.min(pageSize, quantityCount - page * pageSize) }, (_, index) => {
        const quantity = Number((option.min + (page * pageSize + index) * (option.step || 1)).toFixed(8));
        return { value: String(quantity), label: `${quantity} ${option.unit || ""}`.trim(), disabled };
      })
      : option.options.map((choice) => ({ value: choice.id, label: choiceLabel(choice), disabled }));
    return <div className="grid min-w-0 gap-2">
      <div className={tabs.length <= 6 ? "min-w-0 overflow-x-auto p-1" : "min-w-0 overflow-x-auto"}>{tabs.length <= 6
        ? <Radio.Group appearance="segmented" aria-label={option.name} value={value} onValueChange={onChange} disabled={disabled}>{tabs.map(choice => <Radio.Item key={choice.value} value={choice.value} label={choice.label} disabled={choice.disabled} />)}</Radio.Group>
        : <Tabs aria-label={option.name} variant="segmented" value={value} onValueChange={onChange} tabs={tabs} />}</div>
      {isQuantityOption(option) && quantityCount > pageSize ? <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" disabled={disabled || page === 0} onClick={() => setQuantityPage(page - 1)}>上一组</Button>
        <span className="text-sm text-kumo-subtle">当前选择：{value} {option.unit} · 第 {page + 1} / {Math.ceil(quantityCount / pageSize)} 组</span>
        <Button variant="secondary" size="sm" disabled={disabled || (page + 1) * pageSize >= quantityCount} onClick={() => setQuantityPage(page + 1)}>下一组</Button>
      </div> : null}
    </div>;
  }
  if (isQuantityOption(option)) {
    const current = Number(value);
    const step = option.step || 1;
    const immutable = disabled || option.min === option.max;
    const change = (next: number) => onChange(String(Math.min(option.max, Math.max(option.min, next))));
    return (
      <div className="grid min-w-0 gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <Button variant="secondary" size="sm" shape="square" className="size-6 shrink-0" icon={<MinusIcon />} aria-label={`减少${option.name}`} disabled={immutable || current <= option.min} onClick={() => change(current - step)} />
          <Slider size="sm" getAriaLabel={() => `${option.name} ${option.unit}`.trim()} formatValue={(next) => `${next} ${option.unit}`.trim()} className="min-w-0 flex-1" min={option.min} max={option.max} step={step} value={current} disabled={immutable}
            onValueChange={(next) => change(typeof next === "number" ? next : next[0] ?? current)} />
          <Button variant="secondary" size="sm" shape="square" className="size-6 shrink-0" icon={<PlusIcon />} aria-label={`增加${option.name}`} disabled={immutable || current >= option.max} onClick={() => change(current + step)} />
        </div>
      </div>
    );
  }
  const index = optionIndex(option, value);
  const selectIndex = (next: number) => {
    const id = optionValueAt(option, next);
    if (id !== undefined) onChange(id);
  };
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Button variant="secondary" size="sm" shape="square" className="size-6 shrink-0" icon={<MinusIcon />} aria-label={`减少${option.name}`} disabled={disabled || index === 0} onClick={() => selectIndex(index - 1)} />
      <Slider size="sm" getAriaLabel={() => `${option.name}档位`} formatValue={(next) => option.options[next - 1] ? choiceLabel(option.options[next - 1]!).replace(/\s*（\+¥[^）]+）$/, "") : next} className="min-w-0 flex-1" min={1} max={Math.max(2, option.options.length)} step={1} value={index + 1} disabled={disabled || option.options.length < 2}
        onValueChange={(next) => selectIndex((typeof next === "number" ? next : next[0] ?? index + 1) - 1)} />
      <Button variant="secondary" size="sm" shape="square" className="size-6 shrink-0" icon={<PlusIcon />} aria-label={`增加${option.name}`} disabled={disabled || index >= option.options.length - 1} onClick={() => selectIndex(index + 1)} />
    </div>
  );
}

function SpecTable({ specs, selectedId, onSelect, catalogSelection, referencePrice }: { specs: ProductSpec[]; selectedId: string; onSelect: (spec: ProductSpec) => void; catalogSelection: boolean; referencePrice?: number }) {
  return (
    <LayerCard className=" overflow-hidden p-0">
      <div className="grid gap-1 p-5">
        <h2 className="text-lg font-semibold text-kumo-strong">{catalogSelection ? "销售规格" : "计算规格"}</h2>
        <p className="text-sm text-kumo-subtle">规格与价格以当前商品展示为准。</p>
      </div>
      {specs.length ? (
        <Radio.Group aria-label="计算规格" value={selectedId} onValueChange={(value) => { const spec = specs.find((item) => item.id === value); if (spec) onSelect(spec); }} className="overflow-x-auto">
          <Table tableId="shared/components/ProductConfig.tsx:1">
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
                  <Table.Cell><strong className="text-kumo-strong font-medium">¥{(referencePrice ?? spec.price).toFixed(2)}/月</strong></Table.Cell>
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
  const customFieldSchema=orderPage?.customFields??[];
  const [customFields,setCustomFields]=useState<Record<string,string>>({});
  useEffect(()=>setCustomFields({}),[product.id]);
  const customFieldsMissing=customFieldsIncomplete(customFieldSchema,customFields);
  const options = useMemo(() => orderPage?.configOptions ?? product.configOptions ?? [], [orderPage, product.configOptions]);
  const regionOption = options.find(isRegionOption);
  const derivedIPGroup = options.find((option) => isLocationIPGroup(option, regionOption));
  const cycles = useMemo(() => !product.readOnly && orderPage?.cycles?.length
    ? orderPage.cycles
    : [{ billingcycle: product.cycle || "monthly", label: cycleLabels[product.cycle] ?? product.cycle ?? "月付", price: product.price, setupFee: 0 }], [orderPage, product.cycle, product.price, product.readOnly]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [selectedSpecId, setSelectedSpecId] = useState(product.specs[0]?.id ?? "");
  const [cycle, setCycle] = useState(cycles[0]?.billingcycle ?? "monthly");
  const [quantity, setQuantity] = useState(1);

  const [password, setPassword] = useState(generatePassword);
  const passwordIssues = options.length ? instancePasswordIssues(password) : [];
  const [imageGroup, setImageGroup] = useState("");
  const certification = useCertificationGate();
  const addCart = useCartStore((state) => state.add);

  useEffect(() => {
    const next = Object.fromEntries(options.map((option) => [option.id, initialValue(option)]));
    if (regionOption && derivedIPGroup) {
      const match = matchingIPChoice(regionOption, next[regionOption.id] ?? initialValue(regionOption), derivedIPGroup);
      if (match) next[derivedIPGroup.id] = match.id;
    }
    setSelected(next);
    setSelectedSpecId(product.specs[0]?.id ?? "");
  }, [product.id, options, product.specs, regionOption, derivedIPGroup]);

  const selectedRegionValue = regionOption ? selected[regionOption.id] ?? initialValue(regionOption) : "";
  useEffect(() => {
    if (!regionOption || !derivedIPGroup || !selectedRegionValue) return;
    const match = matchingIPChoice(regionOption, selectedRegionValue, derivedIPGroup);
    if (!match) return;
    setSelected((current) => current[derivedIPGroup.id] === match.id ? current : { ...current, [derivedIPGroup.id]: match.id });
  }, [derivedIPGroup, regionOption, selectedRegionValue]);

  useEffect(() => setCycle(cycles.find(c=>c.billingcycle in cycleMonths)?.billingcycle ?? cycles[0]?.billingcycle ?? "monthly"), [product.id, cycles]);

  const selectedSpec = product.specs.find((spec) => spec.id === selectedSpecId) ?? product.specs[0] ?? null;
  const imageOption = options.find((option) => option.field === "image");
  const effectiveSelection=Object.fromEntries(options.map(o=>[o.id,selected[o.id]??initialValue(o)]));
  const displayedOptions = (product.configMode === "fixed" ? [] : options)
    .filter(option=>configurationVisible(option,effectiveSelection))
    .filter(isAdjustableOption)
    .filter(option => option.field !== "cpu" || product.configMode === "elastic" || !product.specs.length)
    .filter((option) => !isRegionOption(option) && option !== derivedIPGroup && option.field !== "image")
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
  const selectedOptions = useMemo(() => options.filter(option=>configurationVisible(option,Object.fromEntries(options.map(o=>[o.id,selected[o.id]??initialValue(o)])))).map((option, index) => {
    const value = selected[option.id] ?? initialValue(option);
    return {
      id: option.id,
      field: option.field,
      value,
      displayName: option.name || option.field,
      displayValue: configurationDisplayValue(option,value),
      position: index,
    };
  }), [options, selected]);
  const optionPrice = options.reduce((sum, option) => {
	if (product.readOnly) return 0;
    const value = selected[option.id] ?? initialValue(option);
    if (!isUpstreamProduct(product) && selectedSpec?.priceMode === "fixed" && (option.field === "cpu" || option.field === "memory")) return sum;
    return sum + (isQuantityOption(option) ? quantityOptionPrice(option, value) : (option.options.find((item) => item.id === value)?.price ?? 0));
  }, 0);
  const monthlyReference = cycles.find((item) => item.billingcycle === "monthly")?.price ?? product.price;
  const cycleDiscount = selectedCycle && monthlyReference > 0 ? selectedCycle.price / (monthlyReference * durationMonth) : 1;
  const monthlySpecPrice = selectedSpec?.price ?? product.price;
  const periodBase = (isUpstreamProduct(product) || !selectedSpec || selectedSpec.priceMode === "upstream") && selectedCycle ? selectedCycle.price : monthlySpecPrice * durationMonth * cycleDiscount;
  const dynamicPricing = isUpstreamProduct(product) && (options.length > 0 || customFieldSchema.length > 0) && !product.readOnly;
  const quoteInput = {localProductId: product.id, cycle: selectedCycle?.billingcycle ?? cycle, quantity, customFields,configOptions: Object.fromEntries(selectedOptions.map(option=>[option.id,option.value]))};
  const quoteKey = JSON.stringify(quoteInput);
  const [settledQuoteKey,setSettledQuoteKey] = useState(quoteKey);
  const [quoteExpired,setQuoteExpired] = useState(false);
  useEffect(()=>{const timer=window.setTimeout(()=>setSettledQuoteKey(quoteKey),300);return ()=>window.clearTimeout(timer);},[quoteKey]);
  const quoteQuery=useQuery({queryKey:["product-quote",settledQuoteKey],queryFn:({signal})=>consoleApi.productQuote(JSON.parse(settledQuoteKey),signal),enabled:dynamicPricing&&!customFieldsMissing&&Boolean(orderPage)&&settledQuoteKey===quoteKey,retry:false,staleTime:0,refetchOnWindowFocus:false,refetchOnReconnect:false});
  useEffect(()=>{setQuoteExpired(false);if(!quoteQuery.data)return;const timer=window.setTimeout(()=>setQuoteExpired(true),Math.max(0,quoteQuery.data.expiresAt*1000-Date.now()));return ()=>window.clearTimeout(timer);},[quoteQuery.data]);
  const liveQuote=settledQuoteKey===quoteKey&&!quoteExpired&&!quoteQuery.isFetching&&!quoteQuery.error?quoteQuery.data:undefined;
  const invalidCycle=!((selectedCycle?.billingcycle??cycle) in cycleMonths);
  const quoteBlocked=dynamicPricing&&(!liveQuote||invalidCycle||customFieldsMissing);
  const unitPrice = dynamicPricing ? Number(liveQuote?.unit ?? 0) : periodBase + optionPrice * durationMonth + (selectedCycle?.setupFee ?? 0);
  const total = dynamicPricing ? Number(liveQuote?.total ?? 0) : unitPrice * quantity;
  const nextRenewal = dynamicPricing ? Number(liveQuote?.renewal ?? 0) : (periodBase + optionPrice * durationMonth) * quantity;
  const monthlyEquivalent = durationMonth > 0 ? nextRenewal / durationMonth : nextRenewal;
  const selectedRegion = regionOption?.options.find((item) => item.id === selectedRegionValue)?.name ?? regionOption?.options[0]?.name ?? "默认地域";
  const selectedIPGroup = regionOption && derivedIPGroup ? matchingIPChoice(regionOption, selectedRegionValue, derivedIPGroup) : undefined;
  const chooseOption = (option: ConfigOption, next: string) => {
    setSelected((current) => {
      const updated = { ...current, [option.id]: next };
      if (regionOption && derivedIPGroup && option.id === regionOption.id) {
        const match = matchingIPChoice(regionOption, next, derivedIPGroup);
        if (match) updated[derivedIPGroup.id] = match.id;
      }
      return updated;
    });
  };
  const outOfStock = selectedSpec?.stock !== null && selectedSpec?.stock !== undefined ? selectedSpec.stock <= 0 : product.stock !== null && product.stock <= 0;
  const specsUnavailable = isUpstreamProduct(product) ? !orderPage : product.specs.length === 0;

  const draft = (): OrderDraft => ({
    customFields,customFieldSchema,quoteToken:liveQuote?.token, quoteExpiresAt:liveQuote?.expiresAt,requiresQuote:dynamicPricing,
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
    password: options.length || customFieldSchema.length ? password : "",
  });

  const externalBill = billTarget !== undefined;
  const anchor = (name: string) => `product-${product.id}-${name}`;
  const steps = [
    ...(catalogSelection ? [{ id: "catalog-specifications", title: "计算规格" }] : []),
    ...(regionOption && configurationVisible(regionOption, effectiveSelection) ? [{ id: anchor(`option-${regionOption.id}`), title: optionTitle(regionOption.field, regionOption.name || "区域") }] : []),
    ...displayedOptions.map((option) => ({ id: anchor(`option-${option.id}`), title: optionTitle(option.field, option.name || option.field) })),
    ...(imageOption && imageGroups.length ? [{ id: anchor("images"), title: "操作系统" }] : []),
    { id: anchor("purchase"), title: "购买信息" },
  ];
  const bill = (
    <LayerCard
      aria-busy={billLoading}
      className={` ${externalBill ? "grid gap-5 px-5 py-4" : "sticky top-20 grid gap-5 px-5 py-4"}${billLoading ? " pointer-events-none" : ""}`}
    >
      <div className="grid gap-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-kumo-subtle">当前应付</span>
          {billLoading || (dynamicPricing && quoteQuery.isFetching) ? <Badge variant="secondary">正在更新</Badge> : null}
        </div>
        <strong className="text-sm font-semibold text-kumo-strong">{quoteBlocked ? "—" : `¥${total.toFixed(2)}`}</strong>
        <span className="text-sm text-kumo-subtle">{product.name} · 单台本周期 {quoteBlocked ? "—" : `¥${unitPrice.toFixed(2)}`}</span>
      </div>
      <div className="grid gap-2 border-t border-kumo-line pt-4 text-sm text-kumo-subtle">
        {selectedSpec ? <span>实例规格：{selectedSpec.name}</span> : <span>计算规格：{product.name}</span>}
        {selectedOptions.map((item) => <span key={`${item.id}-${item.field}`}>{item.displayName}：{withoutZeroPrice(item.displayValue)}</span>)}
        <span>购买周期：{selectedCycle?.label || cycleLabels[cycle] || cycle}</span>
        <span>购买数量：{quantity} 台</span>
        <span>折合月费：{quoteBlocked ? "—" : `¥${monthlyEquivalent.toFixed(2)}`} / 月</span>
        <span>下次续费：{quoteBlocked ? "—" : `¥${nextRenewal.toFixed(2)}`}</span>
      </div>
          <div className="grid gap-2"><span className="text-sm font-medium text-kumo-strong">购买数量</span><div className="flex items-center gap-3"><Button variant="secondary" shape="square" icon={<MinusIcon />} aria-label="减少购买数量" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))} /><strong className="min-w-20 text-center text-kumo-strong font-medium">{quantity} 台</strong><Button variant="secondary" shape="square" icon={<PlusIcon />} aria-label="增加购买数量" disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))} /></div></div>
      {dynamicPricing && invalidCycle ? <Banner variant="error" title="此计费模式暂不可用" description="请选择已支持的计费周期，或联系管理员。"/> : null}
      {dynamicPricing && quoteQuery.error ? <Banner variant="error" title="报价未完成" description={getApiMessage(quoteQuery.error)} /> : null}
      {dynamicPricing && (quoteQuery.error || quoteExpired) ? <Button variant="secondary" loading={quoteQuery.isFetching} onClick={()=>void quoteQuery.refetch()}>重新获取报价</Button> : null}
      {dynamicPricing && liveQuote ? <span className="text-sm text-kumo-subtle">安装费：¥{liveQuote.setup} · 报价以提交时校验结果为准</span> : null}
      <Button variant="secondary" icon={<ShoppingCartIcon />} disabled={product.readOnly || billLoading || quoteBlocked || outOfStock || specsUnavailable || certification.busy || passwordIssues.length > 0} onClick={() => void certification.run(() => addCart(draft()))}>加入购物车</Button>
      <Button disabled={product.readOnly || billLoading || quoteBlocked || outOfStock || specsUnavailable || certification.busy || passwordIssues.length > 0} onClick={() => void certification.run(() => { saveOrderDraft(draft()); if (window.location.pathname.startsWith("/console")) navigate("/order/confirm", { viewTransition: true }); else window.location.assign("/order/confirm"); })}>立即购买</Button>
    </LayerCard>
  );
  return (
    <>
      <div
        aria-busy={billLoading}
        className={`${externalBill ? "grid items-start gap-6" : "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"}${billLoading ? " pointer-events-none" : ""}`}
      >
        <div className="grid gap-5">
        {regionOption && configurationVisible(regionOption, effectiveSelection) ? (
          <LayerCard id={anchor(`option-${regionOption.id}`)} className="scroll-mt-4 grid min-w-0 gap-4 px-5 py-4">
            <div><h2 className="text-lg font-semibold text-kumo-strong">区域</h2><p className="text-sm text-kumo-subtle">请选择资源所在区域，不同区域可用库存与价格可能不同。</p></div>
            <ProductOptionControl option={regionOption} value={selectedRegionValue} disabled={Boolean(product.readOnly)} onChange={(next) => chooseOption(regionOption, next)} />
            {derivedIPGroup ? <p className="text-sm text-kumo-subtle">IP 分组：<strong className="font-medium text-kumo-strong">{selectedIPGroup ? choiceLabel(selectedIPGroup) : "随区域自动匹配"}</strong>（随区域自动选择，不可单独切换）</p> : null}
          </LayerCard>
        ) : null}
        {!catalogSelection && (product.specs.length || !isUpstreamProduct(product)) ? <SpecTable specs={product.specs} selectedId={selectedSpecId} onSelect={selectSpec} catalogSelection={catalogSelection} referencePrice={isUpstreamProduct(product) ? product.price : undefined} /> : null}
        {!catalogSelection && selectedSpec ? (
          <LayerCard className=" px-5 py-4 text-sm"><span className="text-kumo-subtle">当前所选：</span><strong className="text-kumo-strong font-medium">{selectedRegion} · {selectedSpec.name}｜{selectedSpec.vcpu} vCPU｜{selectedSpec.memory} 内存</strong></LayerCard>
        ) : null}

        {displayedOptions.map((option) => {
          const value = selected[option.id] ?? initialValue(option);
          const isFixedResource = isQuantityOption(option) && isResourceOption(option);
          return (
            <LayerCard id={anchor(`option-${option.id}`)} key={`${option.id}-${option.field}`} className="scroll-mt-4 grid min-w-0 gap-4 px-5 py-4">
              <div><h2 className="text-lg font-semibold text-kumo-strong">{optionTitle(option.field, option.name || option.field)}</h2></div>
              <ProductOptionControl option={option} value={value} disabled={isFixedResource && product.configMode === "fixed"} onChange={(next) => setSelected((current) => ({ ...current, [option.id]: next }))} />
            </LayerCard>
          );
        })}

        {imageOption && imageGroups.length ? (
          <LayerCard id={anchor("images")} className="scroll-mt-4 grid gap-4 px-5 py-4">
            <div><h2 className="text-lg font-semibold text-kumo-strong">操作系统</h2><p className="text-sm text-kumo-subtle">请选择需要安装的系统镜像与版本。</p></div>
            <div className="min-w-0 overflow-x-auto"><Tabs variant="segmented" tabs={imageGroups.map((group) => ({ value: group.name, label: group.name }))} value={imageGroup || imageGroups[0]!.name} onValueChange={(value) => { setImageGroup(value); const first = imageGroups.find((group) => group.name === value)?.child[0]; if (first) setSelected((current) => ({ ...current, [imageOption.id]: first.id })); }} /></div>
            {imageGroups.filter((group) => group.name === (imageGroup || imageGroups[0]!.name)).map((group) => (
              <div key={group.name} className="overflow-x-auto"><Tabs variant="segmented" aria-label="镜像版本" value={selected[imageOption.id] ?? initialValue(imageOption)} onValueChange={(value) => setSelected((current) => ({ ...current, [imageOption.id]: value }))} tabs={group.child.map((choice) => ({ value: choice.id, label: choiceLabel(choice) }))} /></div>
            ))}
          </LayerCard>
        ) : null}

        <LayerCard id={anchor("purchase")} className="scroll-mt-4 grid gap-5 px-5 py-4">
          <h2 className="text-lg font-semibold text-kumo-strong">购买信息</h2>
<div className="overflow-x-auto"><Tabs variant="segmented" aria-label="购买时长" value={cycle} onValueChange={setCycle} tabs={cycles.map((item) => ({ value: item.billingcycle, disabled:dynamicPricing&&!(item.billingcycle in cycleMonths), label: `${item.label || cycleLabels[item.billingcycle] || item.billingcycle}${!dynamicPricing && item.price ? ` ¥${item.price.toFixed(2)}` : ""}` }))} /></div>
          {customFieldSchema.length ? <ProductCustomFields fields={customFieldSchema} values={customFields} onChange={setCustomFields}/> : null}
          {options.length || customFieldSchema.length ? <InstancePasswordInput value={password} onChange={setPassword} /> : null}
        </LayerCard>

        {certification.feedback}<Banner variant="error" title="合规警告" description="国内云产品须完成实名认证。严禁搭建色情、赌博、诈骗、挖矿、外挂、扫描、发包、加速、博彩、VOIP 等违法违规业务；严禁对外提供 VPN 服务、DDoS 攻击及其他危害网络安全的用途。" />
        <LayerCard className=" grid gap-2 px-5 py-4"><h2 className="text-lg font-semibold text-kumo-strong">退订规则</h2><p className="text-sm text-kumo-subtle">如需退订，请在订单支付前核对配置。已开通资源按商品退订规则处理，部分特殊商品不支持退订。</p></LayerCard>
        </div>

        {externalBill ? null : bill}
      </div>
      {billTarget ? createPortal(bill, billTarget) : null}
      {stepsTarget ? createPortal(<ProductSteps steps={steps} />, stepsTarget) : null}
    </>
  );
}
