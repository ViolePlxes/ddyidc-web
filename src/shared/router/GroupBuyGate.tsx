import { LayerCard } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { probeGroupBuy } from "../api/groupbuy";
import { PageState } from "../components/PageState";

export function useGroupBuyAvailability(scope: "public" | "admin") {
  return useQuery({
    queryKey: [scope, "groupbuy", "available"],
    queryFn: () => probeGroupBuy(scope),
    staleTime: 60_000,
    retry: false,
  });
}

export function GroupBuyGate({ scope, children }: { scope: "public" | "admin"; children: ReactNode }) {
  const query = useGroupBuyAvailability(scope);
  if (query.isLoading) return <PageState loading skeleton="detail"><span /></PageState>;
  if (!query.data) return <LayerCard className="grid gap-2 p-8"><strong className="text-xl text-kumo-strong">404</strong><p className="text-kumo-subtle">页面不存在或拼团模块当前未启用。</p></LayerCard>;
  return children;
}
