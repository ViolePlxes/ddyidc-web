import { Badge, Banner, Button, Empty, LayerCard, Link, Text } from "@cloudflare/kumo";
import { ArrowRightIcon, GlobeIcon } from "@phosphor-icons/react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "../../../shared/components/PageHeader";
import { domainBase, domainHref, domainSections, type DomainPage, type DomainSection } from "../../../shared/domains/catalog";

function PageLink({ section, page }: { section: DomainSection; page?: DomainPage }) {
  return <LayerCard className="grid content-start gap-3 px-5 py-4">
    <div className="flex items-center justify-between gap-3"><Text as="h2" variant="heading">{page?.title ?? section.title}</Text><GlobeIcon aria-hidden size={20} /></div>
    <Text variant="secondary">{page?.description ?? section.description}</Text>
    <Link href={domainHref(section, page)} className="inline-flex items-center gap-1 justify-self-start">查看功能<ArrowRightIcon aria-hidden size={14} /></Link>
  </LayerCard>;
}

export function Domains() {
  const path = useLocation().pathname.replace(/\/$/, "");
  const section = domainSections.find(value => path === domainHref(value) || path.startsWith(`${domainHref(value)}/`));
  const page = section?.pages.find(value => path === domainHref(section, value));
  const overview = path === domainBase;
  const sectionLanding = !!section && path === domainHref(section);
  if (!overview && !sectionLanding && !page) return <>
    <PageHeader title="页面不存在" description="这个域名功能入口不存在，请返回域名服务。" />
    <Link href={domainBase}>返回域名服务</Link>
  </>;
  return <div className="grid gap-6">
    <nav aria-label="域名服务位置" className="flex flex-wrap items-center gap-2 text-sm">
      <Link href={domainBase}>域名服务</Link>
      {section ? <><span aria-hidden>/</span><Link href={domainHref(section)}>{section.title}</Link></> : null}
      {page ? <><span aria-hidden>/</span><span aria-current="page">{page.title}</span></> : null}
    </nav>
    <PageHeader title={page?.title ?? section?.title ?? "域名服务"} description={page?.description ?? section?.description ?? "注册、交易、转入、续费与日常管理，按使用场景集中安排。"} />
    <Banner title="配置后可用" description="域名服务正在配置，相关功能入口已保留。注册、购买、续费和资料修改暂不可提交。" />
    {overview ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{domainSections.map(value => <PageLink key={value.key} section={value} />)}</div> : null}
    {section && sectionLanding ? <div className="grid gap-4 md:grid-cols-2">{section.pages.map(value => <PageLink key={value.key} section={section} page={value} />)}</div> : null}
    {page ? <>
      <div className="grid gap-4 md:grid-cols-2">{page.capabilities.map(capability => <LayerCard key={capability.title} className="grid content-start gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2"><Text as="h2" variant="heading">{capability.title}</Text>{capability.paid ? <Badge>收费操作</Badge> : null}{capability.approval ? <Badge>需申请开通</Badge> : null}</div>
        {capability.note ? <Text variant="secondary">{capability.note}</Text> : null}
        <Button variant="secondary" disabled className="justify-self-start">配置后可用</Button>
      </LayerCard>)}</div>
      <Empty icon={<GlobeIcon size={32} />} title="域名数据暂不可用" description="服务就绪后，这里将展示当前账户有权管理的真实域名及处理结果。" />
    </> : null}
  </div>;
}
