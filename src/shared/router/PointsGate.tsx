import { LayerCard } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { probePoints } from "../api/points";
import { PageState } from "../components/PageState";

export function usePointsAvailability(scope:"public"|"admin"){
  return useQuery({queryKey:[scope,"points","available"],queryFn:()=>probePoints(scope),staleTime:60_000,retry:false});
}
export function PointsGate({scope,feature,children}:{scope:"public"|"admin";feature?:"mall"|"signin"|"tasks";children:ReactNode}){
  const query=usePointsAvailability(scope);
  if(query.isLoading)return <PageState loading skeleton="detail"><span /></PageState>;
  const data=query.data;
  const visible=Boolean(data&&data.enabled&&(!feature||(feature==="mall"?data.showMall:feature==="signin"?data.showSignin:data.showTasks)));
  if(!visible)return <LayerCard className="shadow-none grid gap-2 p-8"><strong className="text-xl text-kumo-strong">404</strong><p className="text-kumo-subtle">页面不存在或积分中心当前未启用。</p></LayerCard>;
  return children;
}
