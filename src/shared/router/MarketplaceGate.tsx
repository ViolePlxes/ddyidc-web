import { useInstanceDetailRoute } from '../hooks/useInstanceDetailRoute';
import { Banner } from "@cloudflare/kumo";
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
      <><Banner title="配置后可用" description="交易市场入口已保留，请在后台完成配置并启用。" />{scope === "admin" ? children : null}</>
    );
  return children;
}
