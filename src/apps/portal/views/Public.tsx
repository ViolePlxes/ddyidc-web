import { IdentityForm } from "./IdentityForm";
import { Button, LayerCard } from "@cloudflare/kumo";
import {
  ArrowRightIcon,
  CloudCheckIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { ConsoleProducts } from "../../console/views/Products";
import { ConsoleProductDetail } from "../../console/views/ProductDetail";
import { PageHeader } from "../../../shared/components/PageHeader";

export function PortalHome() {
  return (
    <>
      <section className="grid items-center gap-8 py-10 lg:grid-cols-2">
        <div className="grid gap-5">
          <span className="text-sm font-medium text-kumo-brand">
            稳定、清晰、按需配置
          </span>
          <h1 className="text-4xl font-semibold text-kumo-strong md:text-5xl">
            一处管理您的全球云资源
          </h1>
          <p className="max-w-xl text-lg text-kumo-subtle">
            从选购、部署到续费与账单，DDYIDC 提供统一的云服务器管理体验。
          </p>
          <div className="flex gap-3">
            <Link to="/products" viewTransition>
              <Button icon={<ArrowRightIcon />}>查看云产品</Button>
            </Link>
            <Link to="/login" viewTransition>
              <Button variant="secondary">登录控制台</Button>
            </Link>
          </div>
        </div>
        <LayerCard className="grid gap-5 p-4">
          <div className="flex items-center gap-3">
            <CloudCheckIcon className="text-kumo-success" />
            <div>
              <strong className="text-kumo-strong">全球多区域资源</strong>
              <p className="text-sm text-kumo-subtle">
                香港、东京、新加坡与洛杉矶
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="text-kumo-info" />
            <div>
              <strong className="text-kumo-strong">安全会话保护</strong>
              <p className="text-sm text-kumo-subtle">
                Cookie 与服务端会话双重校验
              </p>
            </div>
          </div>
        </LayerCard>
      </section>
    </>
  );
}
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
      <LayerCard >
        <LayerCard.Secondary><h2 className="text-xl font-semibold text-kumo-strong">服务理念</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
        <p className="max-w-3xl text-base leading-7 text-kumo-subtle">
          我们把云资源、计费周期和交付状态整理成清晰一致的控制台体验，让团队能够更快选择、部署并管理云资源。
        </p>
      </LayerCard.Primary></LayerCard>
    </>
  );
}
export function ResetPassword() { return <IdentityForm mode="reset" />; }
export function BindMobile() { return <IdentityForm mode="bind" />; }
