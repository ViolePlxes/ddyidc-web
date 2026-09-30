import { useInstanceDetailRoute } from '../hooks/useInstanceDetailRoute';
import { LayerCard } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { probeMarketplace } from "../api/marketplace";
import { PageState } from "../components/PageState";

export function useMarketplaceAvailability(scope: "public" | "admin") {
  const quiet=useInstanceDetailRoute();
  return useQuery({
    queryKey: [scope, "marketplace", "available"],
    queryFn: () => probeMarketplace(scope),
    staleTime: 5_000,
 refetchInterval:quiet?false:5_000,
    retry: false,
  });
}

export function MarketplaceGate({
  scope,
  children,
 allowExisting = false,
}: {
  scope: "public" | "admin";
  children: ReactNode;
 allowExisting?: boolean;
}) {
  const query = useMarketplaceAvailability(scope);
  if (query.isLoading)
    return (
      <PageState loading>
        <span />
      </PageState>
    );
  if (!query.data && !allowExisting)
    return (
      <LayerCard className="shadow-none grid gap-2 p-8">
        <strong className="text-xl text-kumo-strong">404</strong>
        <p className="text-kumo-subtle">页面不存在或交易市场当前未启用。</p>
      </LayerCard>
    );
  return children;
}
