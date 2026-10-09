export { PortalHome } from "./Home";
import { IdentityForm } from "./IdentityForm";
import { LayerCard } from "@cloudflare/kumo";


import { ConsoleProducts } from "../../console/views/Products";
import { ConsoleProductDetail } from "../../console/views/ProductDetail";
import { PageHeader } from "../../../shared/components/PageHeader";

export function PublicProducts() {
  return <ConsoleProducts publicPath />;
}
export function PublicProductDetail() {
  return <ConsoleProductDetail publicView />;
}
export function About() {
  return (
    <>
      <PageHeader
        title="关于 DDYIDC"
        description="专注于稳定、透明、易管理的云基础设施服务。"
      />
      <LayerCard className="shadow-none grid gap-4 p-6">
        <h2 className="text-xl font-semibold text-kumo-strong">服务理念</h2>
        <p className="max-w-3xl text-base leading-7 text-kumo-subtle">
          我们把云资源、计费周期和交付状态整理成清晰一致的控制台体验，让团队能够更快选择、部署并管理云资源。
        </p>
      </LayerCard>
    </>
  );
}
export function ResetPassword() { return <IdentityForm mode="reset" />; }
export function BindMobile() { return <IdentityForm mode="bind" />; }
