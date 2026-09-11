import { LayerCard } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { probeMarketplace } from "../api/marketplace";
import { PageState } from "../components/PageState";

export function useMarketplaceAvailability(scope: "public" | "admin") {
  return useQuery({
    queryKey: [scope, "marketplace", "available"],
    queryFn: () => probeMarketplace(scope),
    staleTime: 60_000,
    retry: false,
  });
}

export function MarketplaceGate({
  scope,
  children,
}: {
  scope: "public" | "admin";
  children: ReactNode;
}) {
  const query = useMarketplaceAvailability(scope);
  if (query.isLoading)
    return (
      <PageState loading skeleton="detail">
        <span />
      </PageState>
    );
  if (!query.data)
    return (
      <LayerCard className="grid gap-2 p-8">
        <strong className="text-xl text-kumo-strong">404</strong>
        <p className="text-kumo-subtle">页面不存在或交易市场当前未启用。</p>
      </LayerCard>
    );
  return children;
}
