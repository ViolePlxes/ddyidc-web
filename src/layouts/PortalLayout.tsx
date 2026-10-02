import { Button, Link, Surface } from "@cloudflare/kumo";
import { CloudIcon, ShoppingCartIcon } from "@phosphor-icons/react";
import { useLocation } from "react-router-dom";
import { useAuthStore } from "../shared/stores/auth";
import { useLayoutWidth } from "../shared/hooks/useLayoutWidth";
import { LayoutWidthToggle } from "../shared/components/LayoutWidthToggle";
import { RouteOutlet } from "../shared/router/RouteOutlet";
import { useGroupBuyAvailability } from "../shared/router/GroupBuyGate";
import { useMarketplaceAvailability } from "../shared/router/MarketplaceGate";

export function PortalLayout() {
  const mobileBinding = useLocation().pathname === "/bind-mobile";
  const user = useAuthStore((state) => state.user);
  const layoutWidth = useLayoutWidth(user);
  const groupBuy = useGroupBuyAvailability("public");
  const marketplace = useMarketplaceAvailability("public");
  return (
    <div data-mobile-binding={mobileBinding || undefined} data-mode={mobileBinding ? "light" : undefined} className={mobileBinding ? "min-h-svh" : "min-h-svh bg-kumo-recessed"}>
      <Surface className="border-b border-kumo-line">
        <div className={`${layoutWidth.containerClassName} flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 py-2 md:px-6`}>
          <Link
            href="/"
            variant="plain"
            className="flex items-center gap-2 text-lg font-semibold text-kumo-strong"
          >
            <span className="grid size-8 place-items-center bg-kumo-brand text-kumo-badge-inverted">
              <CloudIcon />
            </span>
            DDYIDC
          </Link>
          <nav className="flex flex-wrap items-center gap-4">
            <LayoutWidthToggle {...layoutWidth} />
            <Link href="/products">云产品</Link>
            {groupBuy.data ? <Link href="/groupbuy">拼团</Link> : null}
            {marketplace.data ? (
              <Link href="/marketplace">交易市场</Link>
            ) : null}
            <Link href="/about">关于我们</Link>
            <Link href="/cart" aria-label="购物车">
              <ShoppingCartIcon />
            </Link>
            <Link href={user ? "/console" : "/login"}>
              <Button>{user ? "进入控制台" : "登录"}</Button>
            </Link>
          </nav>
        </div>
      </Surface>
      <main data-layout-width={layoutWidth.width} className={mobileBinding ? undefined : `${layoutWidth.containerClassName} p-4 md:p-6 lg:p-8`}>
        <RouteOutlet className="grid gap-6" />
      </main>
    </div>
  );
}
