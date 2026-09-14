import type { ConfigOption, ConfigOptionValue } from "../api/console";

export function usesResourceSlider(option: ConfigOption) {
  return /^(ip|ip_num|ip_count|bandwidth|upstream_bandwidth|downstream_bandwidth|disk|disk_size|hard_disk|data_disk|system_disk)$/.test(option.field.toLowerCase())
    || /^(公网\s*IP|IP\s*(数量|个数)|带宽|流入带宽|流出带宽|数据盘|硬盘|系统盘)(容量|大小|数量|上限)?$/i.test(option.name.trim());
}

// A qty's options are price tiers, not selectable values. A single tier can
// still price an adjustable range; only choice options use the option count.
export function isAdjustableOption(option: ConfigOption) {
  return option.optionType === "qty" ? option.max > option.min : option.options.length > 1;
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
  const name = choice.name.replace(/\s*[（(]?\s*\+?\s*[¥￥]\s*\d+(?:\.\d+)?\s*元?\s*[）)]?/g, "").trim();
  return `${name}${choice.price ? `（+¥${choice.price.toFixed(2)}）` : ""}`;
}

export function withoutZeroPrice(value: string) {
  return value.replace(/\s*[（(]?\s*\+?\s*[¥￥]\s*0(?:\.0+)?(?![\d.])\s*元?\s*[）)]?/g, "").trim();
}
