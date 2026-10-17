import type { ConfigOption, ConfigOptionValue } from "../api/console";

export function usesResourceSlider(option: ConfigOption) {
  return /^(ip|ip_num|ip_count|bandwidth|upstream_bandwidth|downstream_bandwidth|cpu|memory|traffic|disk|disk_size|hard_disk|data_disk|system_disk)$/.test(option.field.toLowerCase())
    || /^(公网\s*IP|IP\s*(数量|个数)|带宽|流入带宽|流出带宽|数据盘|硬盘|系统盘)(容量|大小|数量|上限)?$/i.test(option.name.trim());
}

// A qty's options are price tiers, not selectable values. A single tier can
// still price an adjustable range; only choice options use the option count.
export function isAdjustableOption(option: ConfigOption) {
  return ["unsupported","multi_select","cascade"].includes(option.optionType) || (isQuantityOption(option) ? option.max > option.min : option.options.length > 1);
}

export function optionIndex(option: ConfigOption, value: string) {
  const index = option.options.findIndex((choice) => choice.id === value);
  return index < 0 ? 0 : index;
}

export function optionValueAt(option: ConfigOption, index: number) {
  return Number.isInteger(index) ? option.options[index]?.id : undefined;
}

export function choiceLabel(choice: ConfigOptionValue) {
  // Suppliers sometimes embed formatted prices in names. Use the numeric price
  // for presentation, without changing the original name or submitted choice ID.
  const name = withoutZeroPrice(choice.name).replace(/\s*[（(]?\s*\+?\s*[¥￥]\s*\d+(?:\.\d+)?\s*元?\s*[）)]?/g, "").trim();
  return `${name}${choice.priceKnown !== false && choice.price ? `（+¥${choice.price.toFixed(2)}）` : ""}`;
}

export function withoutZeroPrice(value: string) {
  return value.replace(/\s*[（(]?\s*\+?\s*(?:[¥￥]\s*0(?:\.0+)?(?![\d.])\s*元?|(?<![\d.])0(?:\.0+)?(?![\d.])\s*元)\s*[）)]?/g, "").trim();
}

export function isQuantityOption(option: ConfigOption) {return ["qty","quantity","quantity_range"].includes(option.optionType);}
export function configurationVisible(option: ConfigOption, values: Record<string,string>) {return (option.visibleWhen??[]).every(condition=>condition.values.includes(values[condition.optionId]??""));}
export function configurationInitialValue(option: ConfigOption): string {
 if (option.default !== undefined && option.default !== "") return option.default;
 if (isQuantityOption(option)) return String(option.min??0);
 if (option.optionType==="multi_select") return "[]";
 if (option.optionType==="cascade") {const path: string[]=[];let choices=option.options;while(choices.length&&path.length<32){const next=choices[0]!;path.push(next.id);choices=next.children??[];}return JSON.stringify(path);}
 return option.options[0]?.id??"";
}
export function configurationArray(value: string) {try {const values:unknown=JSON.parse(value);return Array.isArray(values)&&values.every(v=>typeof v==="string")?values as string[]:[];}catch{return [];}}

export function configurationDisplayValue(option: ConfigOption,value: string): string {
 if (option.optionType==="multi_select"||option.optionType==="cascade") {const labels: string[]=[];let choices=option.options;for(const id of configurationArray(value)){const choice=choices.find(c=>c.id===id);if(choice){labels.push(choice.name);if(option.optionType==="cascade")choices=choice.children??[];}}return labels.join(" / ");}
 return option.options.find(c=>c.id===value)?.name??`${value}${option.unit?` ${option.unit}`:""}`;
}
