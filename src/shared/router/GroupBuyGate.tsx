import { Banner } from "@cloudflare/kumo";
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
  if (query.isLoading) return <PageState loading><span /></PageState>;
  if (!query.data) return <><Banner title="配置后可用" description="拼团入口已保留，请在后台完成配置并启用相应功能。" />{scope === "admin" ? children : null}</>;
  return children;
}
