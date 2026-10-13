import { Input, Select } from "@cloudflare/kumo";
export type RefundAmountMode = "daily" | "full" | "custom";
export function selectedRefundAmount(mode: RefundAmountMode, custom: string, daily?: string, paid?: string) {
 if (mode === "daily") return daily;
 if (mode === "full") return paid;
 if (!/^\d+(?:\.\d{1,2})?$/.test(custom) || Number(custom) <= 0 || Number(custom) > Number(paid)) return undefined;
 return Number(custom).toFixed(2);
}
export function RefundAmountChoice({mode,custom,paid,onMode,onCustom,disabled}: {mode:RefundAmountMode;custom:string;paid?:string;onMode:(value:RefundAmountMode)=>void;onCustom:(value:string)=>void;disabled?:boolean}) {
 return <div className="grid gap-3"><Select label="退款金额方式" value={mode} items={{daily:"按时间退款",full:"全退（原实付金额）",custom:"指定退款金额"}} disabled={disabled} onValueChange={value=>onMode(value as RefundAmountMode)}/>{mode==="custom"?<Input label={`指定退款金额（元，最高 ${paid ?? "—"}）`} value={custom} inputMode="decimal" disabled={disabled} onChange={event=>onCustom(event.target.value)}/>:null}</div>;
}
