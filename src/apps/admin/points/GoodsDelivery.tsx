import { Input, Select } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { adminRequest, type ApiEnvelope } from "../../../shared/api/request";

export function GoodsDelivery({type,config,onChange}:{type:string;config:string;onChange:(v:string)=>void}){
 let value:Record<string,unknown>={};try{value=JSON.parse(config) as Record<string,unknown>}catch{/* The advanced editor can be incomplete. */}
 const coupons=useQuery({queryKey:["admin","coupons","goods-picker"],queryFn:async()=> (await adminRequest.get<ApiEnvelope<{list:Array<{id:string;name:string}>}>>("/marketing/coupons",{params:{status:1,pageSize:100}})).data.data,enabled:type==="coupon"});
 if(type==="balance")return <Input label="兑换余额（元）" type="number" min={0.01} step={0.01} value={value.amountCents===undefined?"":Number(value.amountCents)/100} onChange={e=>onChange(JSON.stringify({...value,amountCents:Math.round(Number(e.target.value)*100)},null,2))}/>;
 if(type==="coupon")return <Select label="优惠券模板" value={String(value.couponId??"")} onValueChange={v=>onChange(JSON.stringify({...value,couponId:v},null,2))} items={{"":"请选择优惠券",...Object.fromEntries((coupons.data?.list??[]).map(c=>[c.id,c.name]))}}/>;
 return null;
}
