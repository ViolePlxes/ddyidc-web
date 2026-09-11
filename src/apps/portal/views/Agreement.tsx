import { Button, LayerCard } from "@cloudflare/kumo";
import { Link, useParams } from "react-router-dom";

export function AgreementPlaceholder() {
  const { kind } = useParams();
  const title = kind === "privacy" ? "隐私协议" : "服务协议";
  return (
    <main className="grid min-h-svh place-items-center bg-kumo-recessed p-4">
      <LayerCard className="grid w-full max-w-2xl gap-5 p-6 md:p-8">
        <h1 className="text-2xl font-semibold text-kumo-strong">{title}</h1>
        <p className="text-base text-kumo-subtle">协议内容待补充</p>
        <Link to="/login" className="justify-self-start"><Button variant="secondary">返回登录</Button></Link>
      </LayerCard>
    </main>
  );
}
