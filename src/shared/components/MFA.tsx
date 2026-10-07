import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import type { MFAEnrollment } from "../api/mfa";

// Identity-independent display components; admins and customers can share these.
export function MFAEnrollmentView({ enrollment }: { enrollment: MFAEnrollment }) {
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { let active = true; setImage(""); void QRCode.toDataURL(enrollment.uri, { width: 240, margin: 2 }).then(value => { if (active) setImage(value); }, () => { if (active) setError("二维码生成失败，请手动输入密钥"); }); return () => { active = false; }; }, [enrollment.uri]);
  return <div className="grid gap-3"><p className="text-sm text-kumo-subtle">使用腾讯身份验证器、Google Authenticator 等应用扫码，然后输入生成的 6 位验证码。请开启手机自动校时。</p>{image && <img src={image} alt="身份验证器绑定二维码" className="mx-auto max-w-full" width={240} height={240} />}{error && <Banner variant="error" title={error} />}<Input label="手动输入密钥" value={enrollment.secret} readOnly /><p className="text-xs text-kumo-subtle">绑定步骤 5 分钟内有效。密钥只用于绑定，请勿分享。</p></div>;
}
export function MFARecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  return <LayerCard ><LayerCard.Secondary><h2 className="text-lg font-semibold">保存备用恢复码</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4"><Banner title="恢复码仅显示一次" description="手机丢失时可代替动态验证码。每个恢复码只能使用一次，请离线保存；重新生成会作废旧恢复码。" /><div className="grid gap-2 break-all text-sm">{codes.map(code => <code key={code}>{code}</code>)}</div><Button variant="secondary" onClick={() => { const blob = new Blob([codes.join("\n")], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "DDYIDC-MFA-recovery-codes.txt"; link.click(); URL.revokeObjectURL(url); setSaved(true); }}>下载恢复码</Button><Button variant="secondary" onClick={() => setSaved(true)}>我已另行保存</Button><Button disabled={!saved} onClick={onDone}>保存完成，继续</Button></LayerCard.Primary></LayerCard>;
}
