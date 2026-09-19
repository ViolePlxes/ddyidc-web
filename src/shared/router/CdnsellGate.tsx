import { Banner, LayerCard } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { probeCdnsell } from "../api/cdnsell";
import { PageState } from "../components/PageState";

export function useCdnsellAvailability(scope:"public"|"admin"){
  return useQuery({queryKey:[scope,"cdnsell","available"],queryFn:()=>probeCdnsell(scope),staleTime:60_000,retry:false});
}
export function CdnsellGate({scope,children}:{scope:"public"|"admin";children:ReactNode}){
  const query=useCdnsellAvailability(scope);
  if(query.isLoading)return <PageState loading skeleton="detail"><span /></PageState>;
  if(!query.data?.enabled)return <LayerCard className="shadow-none grid gap-2 p-8"><strong className="text-xl text-kumo-strong">404</strong><p className="text-kumo-subtle">页面不存在或 CDN 流量服务当前未启用。</p></LayerCard>;
  return <>{query.data.ready === false ? <Banner title="配置后可用" description={scope === "admin" ? "请配置并启用 CDN 服务账号，相关入口保持开放。" : "服务正在配置，您可以继续查看各功能页面。"} /> : null}{children}</>;
}
