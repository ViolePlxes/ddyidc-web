import { useHumanVerification } from "../../../shared/components/captcha/HumanVerification";
import { useState, type FormEvent } from "react";
import { Button, Input, LayerCard, Banner } from "@cloudflare/kumo";
import { adminSecurityApi, type MFAChallenge } from "../../../shared/api/mfa";
import { getApiMessage } from "../../../shared/api/request";
import { MFAEnrollmentView, MFARecoveryCodes } from "../../../shared/components/MFA";
import { adminBase } from "../../../shared/utils/adminEntry";
import type { AuthUser } from "../../../shared/types/auth";
import { ExternalRedirect } from "../../../shared/router/EntryGuards";
export function AdminSecureLogin({ user }: { user: AuthUser | null }) {
 const human=useHumanVerification("admin_login");
 const [account,setAccount]=useState("");const [password,setPassword]=useState("");const [code,setCode]=useState("");const [challenge,setChallenge]=useState<MFAChallenge>();const [codes,setCodes]=useState<string[]>([]);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const redirect=new URLSearchParams(window.location.search).get("redirect");const destination=redirect&&(redirect===adminBase||redirect.startsWith(adminBase+"/"))&&!redirect.includes("\\")?redirect:adminBase;
 if(user?.role==="admin"&&!codes.length)return <ExternalRedirect to={destination}/>;
 async function submit(event:FormEvent){event.preventDefault();setBusy(true);setError("");try{if(challenge){const result=await adminSecurityApi.verifyLogin(challenge.challenge,code.trim());setPassword("");if(result.recoveryCodes?.length)setCodes(result.recoveryCodes);else window.location.replace(destination);}else{const result=await adminSecurityApi.login(account.trim(),password,await human.prepare());setPassword("");if("mfaRequired" in result)setChallenge(result);else window.location.replace(destination);}}catch(e){setError(getApiMessage(e));setCode("");if(!challenge)await human.reset();}finally{setBusy(false)}}
 return <main className="grid min-h-svh place-items-center bg-kumo-recessed p-4"><div className="grid w-full max-w-sm gap-4"><p className="text-base font-semibold text-kumo-strong">多多云 管理控制台</p>{codes.length?<MFARecoveryCodes codes={codes} onDone={()=>window.location.replace(destination)}/>:<LayerCard ><LayerCard.Secondary><h1 className="text-xl font-semibold">{challenge?(challenge.enrollmentRequired?"绑定二步验证":"二步验证"):"管理员登录"}</h1></LayerCard.Secondary><LayerCard.Primary className="grid gap-5">{error&&<Banner variant="error" title={error}/>}<form className="grid gap-4" onSubmit={e=>void submit(e)}>{challenge?<>{challenge.enrollment&&<MFAEnrollmentView enrollment={challenge.enrollment}/>}<Input label={challenge.enrollmentRequired?"6 位动态验证码":"动态验证码或备用恢复码"} value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" autoFocus required /></>:<><Input label="账号" value={account} onChange={e=>setAccount(e.target.value)} autoComplete="username" autoFocus required/><Input label="密码" type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/></>}{!challenge&&human.element}<Button type="submit" loading={busy||human.busy}>{challenge?"验证并登录":"下一步"}</Button>{challenge&&<Button variant="secondary" onClick={()=>{setChallenge(undefined);setCode("");setError("");}}>返回账号密码登录</Button>}</form></LayerCard.Primary></LayerCard>}</div></main>
}
