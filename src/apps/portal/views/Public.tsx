import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
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
        <LayerCard className="shadow-none grid gap-5 p-6">
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
      <LayerCard className="shadow-none grid gap-4 p-6">
        <h2 className="text-xl font-semibold text-kumo-strong">服务理念</h2>
        <p className="max-w-3xl text-base leading-7 text-kumo-subtle">
          我们把复杂的上游资源、计费周期和交付状态整理成清晰一致的控制台体验，让团队能够更快选择、部署并管理云资源。
        </p>
      </LayerCard>
    </>
  );
}
export function ResetPassword() {
  return (
    <div className="mx-auto grid w-full max-w-lg gap-6 py-10">
      <PageHeader title="找回密码" description="验证账户后设置新密码。" />
      <LayerCard className="shadow-none grid gap-4 p-6">
        <Input label="账号" placeholder="账号、邮箱或手机号" />
        <Banner variant="alert" title="找回密码暂不可用" description="后端尚未提供密码重置提交接口。" />
        <Button disabled>继续</Button>
      </LayerCard>
    </div>
  );
}
export function BindMobile() {
  return (
    <div className="mx-auto grid w-full max-w-lg gap-6 py-10">
      <PageHeader
        title="绑定手机号"
        description="完成绑定后可使用财务与结算功能。"
      />
      <LayerCard className="shadow-none grid gap-4 p-6">
        <Banner variant="alert" title="手机号绑定暂不可用" description="短信验证码真实通道已经就绪，但后端尚未提供将验证码消费结果写入客户手机号的绑定接口。" />
        <Input label="手机号" placeholder="请输入手机号" disabled />
        <Input label="验证码" placeholder="6 位验证码" inputMode="numeric" disabled />
        <Button disabled>完成绑定</Button>
      </LayerCard>
    </div>
  );
}
