import { Input, Select } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { adminRequest, type ApiEnvelope } from "../../../shared/api/request";

export function GoodsDelivery({type,config,onChange}:{type:string;config:string;onChange:(v:string)=>void}){
 let value:Record<string,unknown>={};try{const parsed:unknown=JSON.parse(config);if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))value=parsed as Record<string,unknown>}catch{/* The advanced editor can be incomplete. */}
 const coupons=useQuery({queryKey:["admin","coupons","goods-picker"],queryFn:async()=> (await adminRequest.get<ApiEnvelope<{list:Array<{id:string;name:string}>}>>("/marketing/coupons",{params:{status:1,pageSize:100}})).data.data,enabled:type==="coupon"});
 const update=(key:string,item:unknown)=>onChange(JSON.stringify({...value,[key]:item},null,2));
 return <div className="grid gap-3 md:grid-cols-2"><Input label="每日限兑数量（0 不限）" type="number" min={0} max={100} value={Number(value.dailyLimit??0)} onChange={e=>{const next={...value};const count=Number(e.target.value);if(count===0)delete next.dailyLimit;else next.dailyLimit=count;onChange(JSON.stringify(next,null,2));}}/>{type==="physical"&&<Input label="发货后自动收货天数（0 停用）" type="number" min={0} max={60} value={Number(value.autoConfirmDays??14)} onChange={e=>update("autoConfirmDays",Number(e.target.value))}/>}{type==="balance"?<Input label="兑换余额（元）" type="number" min={0.01} step={0.01} value={value.amountYuan===undefined?(value.amountCents===undefined?"":Number(value.amountCents)/100):String(value.amountYuan)} onChange={e=>update("amountYuan",e.target.value)}/>:type==="coupon"?<Select label="优惠券模板" value={String(value.couponId??"")} onValueChange={v=>update("couponId",v)} items={{"":"请选择优惠券",...Object.fromEntries((coupons.data?.list??[]).map(c=>[c.id,c.name]))}}/>:null}</div>;
}
