import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Banner, Button, Input, LayerCard, Loader, Select, Switch } from "@cloudflare/kumo";
import { captchaApi, type CaptchaConfig } from "../../api/captcha";
import { getApiMessage } from "../../api/request";
export function CaptchaSettings(){
 const query=useQuery({queryKey:["admin","captcha","config"],queryFn:captchaApi.config});const cache=useQueryClient();
 const [config,setConfig]=useState<CaptchaConfig>();const [secret,setSecret]=useState("");const [clear,setClear]=useState(false);const [password,setPassword]=useState("");const [code,setCode]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
 useEffect(()=>{if(query.data)setConfig(query.data)},[query.data]);
 async function save(){if(!config)return;setBusy(true);setError("");setNotice("");try{await captchaApi.save(config,secret,clear,password,code);setSecret("");setPassword("");setCode("");setClear(false);await cache.invalidateQueries({queryKey:["admin","captcha","config"]});setNotice("人机验证设置已保存");}catch(e){setError(getApiMessage(e));}finally{setBusy(false)}}
 if(query.isLoading)return <Loader/>;if(!config)return <Banner variant="error" title="人机验证设置加载失败"/>;
 return <LayerCard className="grid gap-4 p-6"><h2 className="text-lg font-semibold">人机验证</h2>{error&&<Banner variant="error" title={error}/>} {notice&&<Banner title={notice}/>}
 <Switch label="启用登录人机验证" checked={config.enabled} onCheckedChange={enabled=>setConfig({...config,enabled})}/>
 <Select label="验证服务商" value={config.provider} renderValue={value=>value==="geetest"?"极验 4.0":String(value)} onValueChange={value=>setConfig({...config,provider:String(value)})}><Select.Option value="geetest">极验 4.0</Select.Option></Select>
 <Input label="验证 ID（captcha_id）" value={config.siteId} onChange={e=>setConfig({...config,siteId:e.target.value})}/>
 <Input label={`验证密钥（${config.secretConfigured?"已配置，留空保留":"未配置"}）`} type="password" autoComplete="new-password" value={secret} onChange={e=>setSecret(e.target.value)}/>
 <Switch label="清除已保存的验证密钥" checked={clear} onCheckedChange={setClear}/>
 <p className="text-sm text-kumo-subtle">同一 IP 在同一登录入口输错一次密码后，15 分钟内再次登录需验证。验证通过不解除密码错误锁定，管理员仍需完成 MFA。更换验证 ID 时需要重新填写对应密钥。</p>
 <p className="text-sm text-kumo-subtle">极验控制台建议启用智能验证；免费额度、到期和超额规则以服务商账号套餐为准。服务异常时需要验证的登录会暂停，请稍后重试。</p>
 <Input label="当前管理员密码" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/>
 <Input label="动态验证码或恢复码（已绑定 MFA 时必填）" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)}/>
 <Button loading={busy} disabled={!password} onClick={()=>void save()}>保存人机验证设置</Button></LayerCard>;
}
