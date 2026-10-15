import { Banner, Button, Input, LayerCard, Loader, Switch, Textarea } from "@cloudflare/kumo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getPaymentSettings, savePaymentSettings, type PaymentSettings as Settings } from "../../../shared/api/paymentSettings";
import { getApiMessage } from "../../../shared/api/request";
export function PaymentSettings() {
 const query = useQuery({ queryKey: ["admin-payment-settings"], queryFn: getPaymentSettings, retry: false, refetchOnWindowFocus: false });
 const [form,setForm]=useState<Settings | null>(null);const [reason,setReason]=useState("");const [saved,setSaved]=useState(false);
 useEffect(()=>{if(query.data)setForm(query.data)},[query.data]);
 const save=useMutation({retry:false,mutationFn:()=>{if(!form)throw new Error("配置尚未加载");return savePaymentSettings({...form,reason:reason.trim()})},onSuccess:async data=>{setForm(data);setReason("");setSaved(true);await query.refetch()}});
 if(query.isLoading)return <Loader />;
 if(query.error)return <Banner variant="error" title="支付配置读取失败" description={getApiMessage(query.error)} />;
 if(!form)return null;
 const cfg=form.config,a=cfg.Alipay,w=cfg.Wechat;
 const alipay=(key:keyof typeof a,value:string|boolean)=>setForm({...form,config:{...cfg,Alipay:{...a,[key]:value}}});
 const wechat=(key:keyof typeof w,value:string|boolean)=>setForm({...form,config:{...cfg,Wechat:{...w,[key]:value}}});
 const disabled=save.isPending;
 return <div className="grid gap-4">
 <Banner title={form.restartRequired ? "配置已保存，等待后端重启生效" : "运行中配置"} description={`运行中：支付宝${form.runningAlipayEnabled?"开启":"关闭"}，微信${form.runningWechatEnabled?"开启":"关闭"}。保存不会自动重启服务。关闭渠道不影响已有支付回调核对。`} />
 <LayerCard><LayerCard.Secondary><h2>支付宝支付</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
 <Switch label="启用支付宝" checked={a.Enabled} onCheckedChange={v=>alipay("Enabled",v)} disabled={disabled} />
 <div className="grid gap-4 md:grid-cols-2">
 <Input label="应用 AppID" value={a.AppID} onChange={e=>alipay("AppID",e.target.value.trim())} disabled={disabled} />
 <Input label="商户 SellerID" value={a.SellerID} onChange={e=>alipay("SellerID",e.target.value.trim())} disabled={disabled} />
 <Input label="官方网关" value={a.Gateway} onChange={e=>alipay("Gateway",e.target.value.trim())} disabled={disabled} />
 <Input label="异步通知地址" value={a.NotifyURL} onChange={e=>alipay("NotifyURL",e.target.value.trim())} disabled={disabled} />
 <Input label="支付返回地址" value={a.ReturnURL} onChange={e=>alipay("ReturnURL",e.target.value.trim())} disabled={disabled} />
 <Input label="手机支付退出地址" value={a.QuitURL} onChange={e=>alipay("QuitURL",e.target.value.trim())} disabled={disabled} />
 </div>
 <Textarea label={`应用私钥（${form.alipayPrivateConfigured?"已配置，留空保留":"未配置"}）`} value={a.AppPrivateKey} onChange={e=>alipay("AppPrivateKey",e.target.value)} disabled={disabled} />
 <Textarea label={`支付宝公钥（${form.alipayPublicConfigured?"已配置，留空保留":"未配置"}）`} value={a.AlipayPublicKey} onChange={e=>alipay("AlipayPublicKey",e.target.value)} disabled={disabled} />
 </LayerCard.Primary></LayerCard>
 <LayerCard><LayerCard.Secondary><h2>微信支付</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
 <Switch label="启用微信支付" checked={w.Enabled} onCheckedChange={v=>wechat("Enabled",v)} disabled={disabled} />
 <div className="grid gap-4 md:grid-cols-2">
 <Input label="应用 AppID" value={w.AppID} onChange={e=>wechat("AppID",e.target.value.trim())} disabled={disabled} />
 <Input label="商户号" value={w.MchID} onChange={e=>wechat("MchID",e.target.value.trim())} disabled={disabled} />
 <Input label="商户证书序列号" value={w.CertSerial} onChange={e=>wechat("CertSerial",e.target.value.trim())} disabled={disabled} />
 <Input label="回调公开基地址" value={w.BaseURL} onChange={e=>wechat("BaseURL",e.target.value.trim())} disabled={disabled} />
 <Input label="微信平台公钥ID（公钥模式）" value={w.PublicKeyID} onChange={e=>wechat("PublicKeyID",e.target.value.trim())} disabled={disabled} />
 <Input type="password" autoComplete="new-password" label={`API v3密钥（${form.wechatApiKeyConfigured?"已配置，留空保留":"未配置"}）`} value={w.APIV3Key} onChange={e=>wechat("APIV3Key",e.target.value)} disabled={disabled} />
 </div>
 <Textarea label={`商户私钥（${form.wechatPrivateConfigured?"已配置，留空保留":"未配置"}）`} value={w.PrivateKey} onChange={e=>wechat("PrivateKey",e.target.value)} disabled={disabled} />
 <Textarea label={`微信平台公钥（${form.wechatPublicConfigured?"已配置，留空保留":"未配置；证书模式可留空"}）`} value={w.PublicKey} onChange={e=>wechat("PublicKey",e.target.value)} disabled={disabled} />
 </LayerCard.Primary></LayerCard>
 <LayerCard><LayerCard.Primary className="grid gap-4">
 <Input type="number" min={1} max={1440} label="支付有效期（分钟）" value={String(cfg.ExpireMinutes)} onChange={e=>setForm({...form,config:{...cfg,ExpireMinutes:Number(e.target.value)}})} disabled={disabled} />
 <Textarea label="修改原因（必填）" maxLength={255} value={reason} onChange={e=>setReason(e.target.value)} disabled={disabled} />
 <p className="text-base text-kumo-subtle">凭据加密保存，不返回原文。更换商户或凭据前须先关闭支付渠道并重启生效，核对所有未完成支付。配置先校验再保存，保存失败不会更改原配置。</p>
 <div><Button loading={disabled} disabled={disabled||reason.trim().length<2} onClick={()=>save.mutate()}>校验并保存</Button></div>
 </LayerCard.Primary></LayerCard>
 {saved ? <Banner title="支付配置已保存" description="请安排后端重启使配置生效，运行中的支付配置未切换。" /> : null}
 {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
 </div>
}
