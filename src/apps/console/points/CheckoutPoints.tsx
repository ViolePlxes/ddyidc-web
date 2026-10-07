import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { pointsApi, probePoints } from "../../../shared/api/points";
import { getApiMessage } from "../../../shared/api/request";

export function CheckoutPoints({amountYuan,onRedeemed,onBusy}:{amountYuan:number;onRedeemed:(id:string)=>void;onBusy:(busy:boolean)=>void}){
 const [points,setPoints]=useState(0);const [message,setMessage]=useState("");const request=useRef<{id:string;points:number}|undefined>(undefined);const client=useQueryClient();
 const status=useQuery({queryKey:["points","availability","checkout"],queryFn:()=>probePoints("public")});
 const data=status.data;
 const enabled=Boolean(data && data.enabled && data.checkoutEnabled);
 const account=useQuery({queryKey:["points","account"],queryFn:pointsApi.account,enabled});
 const exchange=useMutation({onMutate:()=>onBusy(true),onSettled:()=>onBusy(false),mutationFn:()=>{if(!request.current||request.current.points!==points)request.current={id:crypto.randomUUID(),points};return pointsApi.checkoutCoupon(points,request.current.id)},onSuccess:async v=>{setMessage(`已兑换 ¥${v.amountYuan} 抵扣券并为本单选中`);onRedeemed(v.userCouponId);request.current=undefined;await Promise.all([client.invalidateQueries({queryKey:["coupons"]}),client.invalidateQueries({queryKey:["points","account"]})])}});
 if(!data||!data.enabled)return null;
 if(!data.checkoutEnabled)return <LayerCard className="shadow-none p-5"><strong>积分抵扣</strong><p className="text-sm text-kumo-subtle">暂未开放，可在积分商城兑换其他福利。</p></LayerCard>;
 const rate=data.checkoutPointsPerYuan;const max=Math.floor(Math.min(account.data?.balance??0,Math.floor(amountYuan)*rate)/rate)*rate;
 return <LayerCard className="shadow-none grid gap-3 p-5"><strong>积分抵扣</strong><p className="text-sm text-kumo-subtle">{rate} 积分抵扣1元。兑换后以专属抵扣券用于本单；未下单或取消订单时保留为账户优惠券，有效期 {data.checkoutCouponDays} 天，不与其他券叠加。</p><Input label={`使用积分（可用 ${account.data?.balance??0}）`} type="number" min={0} max={max} step={rate} value={points} onChange={e=>setPoints(Number(e.target.value))}/><Button className="justify-self-start" loading={exchange.isPending} disabled={!rate||points<rate||points>max||points%rate!==0||exchange.isSuccess} onClick={()=>exchange.mutate()}>兑换并抵扣 ¥{rate?(points/rate).toFixed(2):"0.00"}</Button>{message?<Banner title={message}/>:null}{account.error||exchange.error?<Banner variant="error" title="积分抵扣失败" description={getApiMessage(account.error??exchange.error)}/>:null}</LayerCard>;
}
