import { useQuery } from "@tanstack/react-query";
import { consoleApi } from "../../../shared/api/console";
import { useAuthStore } from "../../../shared/stores/auth";

export function usePromoQueries() {
  const userId = useAuthStore(state => state.user?.id);
  const options = { enabled: !!userId, gcTime: 0, staleTime: 0 };
  const config = useQuery({ queryKey: ["marketing", "public-config"], queryFn: consoleApi.marketingConfig, ...options });
  const invite = useQuery({ queryKey: ["promo", userId, "invite"], queryFn: consoleApi.invite, ...options });
  const overview = useQuery({ queryKey: ["promo", userId, "overview"], queryFn: consoleApi.promoOverview, ...options });
  const earnings = useQuery({ queryKey: ["promo", userId, "earnings"], queryFn: consoleApi.earnings, ...options, refetchInterval: 60_000 });
  return { config, invite, overview, earnings };
}
