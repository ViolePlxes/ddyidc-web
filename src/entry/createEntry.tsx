import { VersionRefreshNotice } from "../shared/components/VersionRefreshNotice";
import { adminPath } from "../shared/utils/adminEntry";
import "../shared/hooks/useTheme";
import { subscribeCatalogChanges } from "../shared/utils/catalogCache";
import { StrictMode, forwardRef, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  LinkProvider,
  Toasty,
  TooltipProvider,
  type LinkComponentProps,
} from "@cloudflare/kumo";
import {
  BrowserRouter,
  createBrowserRouter,
  RouterProvider,
  Link,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";
import { prefetchRoute } from "../shared/router/routeModules";
import { RouteErrorBoundary } from "../shared/router/RouteErrorBoundary";
import "../styles/tailwind.css";

interface MicroAppProps {
  container?: Element;
}

interface RootHost extends HTMLElement {
  __ddyidcRoot?: Root;
}

declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean;
    __ddyBrowserGuard?: { blocked: boolean; mounted: boolean; checkStyles: () => boolean; ready: () => void };
  }
}

function entryScope(path: string): "portal" | "console" | "admin" | "sales" {
  if (path === adminPath('/admin') || path.startsWith(adminPath('/admin/'))) return "admin";
  if (path === "/sales" || path.startsWith("/sales/")) return "sales";
  if (
    path === "/cart" ||
    path === "/order/confirm" ||
    path === "/bind-mobile" ||
    ["/wallet/recharge", "/wallet/recharge-records", "/wallet/consume-records"].includes(path) ||
    // Legacy user-center aliases are routes of ConsoleApp, not portal pages.
    path.startsWith("/user/") ||
    path === "/console" ||
    path.startsWith("/console/")
  ) {
    return "console";
  }
  return "portal";
}

const RouterLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(
  ({ href, to, onFocus, onMouseEnter, ...props }, ref) => {
    const target = href ?? to ?? "/";
    if (entryScope(window.location.pathname) !== entryScope(target)) {
      return <a ref={ref} href={target} {...props} />;
    }
    return (
      <Link
        ref={ref}
        to={target}
        viewTransition
        onFocus={(event) => {
          void prefetchRoute(target);
          onFocus?.(event);
        }}
        onMouseEnter={(event) => {
          void prefetchRoute(target);
          onMouseEnter?.(event);
        }}
        {...props}
      />
    );
  },
);

const scrollPositions = new Map<string, number>();

function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>("[data-dashboard-scroll]");
    const scrollTop = scrollPositions.get(location.key);
    if (navigationType === "POP" && scrollTop !== undefined) {
      if (scrollContainer) scrollContainer.scrollTo({ top: scrollTop });
      else window.scrollTo({ top: scrollTop });
    }
    return () => {
      scrollPositions.set(
        location.key,
        scrollContainer?.scrollTop ?? window.scrollY,
      );
    };
  }, [location.key, navigationType]);

  return null;
}

function RoutePrefetch() {
  useEffect(() => {
    const preload = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.origin !== window.location.origin) return;
      void prefetchRoute(anchor.href);
    };
    document.addEventListener("pointerover", preload, { passive: true });
    document.addEventListener("focusin", preload);
    return () => {
      document.removeEventListener("pointerover", preload);
      document.removeEventListener("focusin", preload);
    };
  }, []);
  return null;
}

function RuntimeReady() {
  useEffect(() => { window.__ddyBrowserGuard?.ready(); }, []);
  return null;
}

export function createEntry(App: ComponentType, options: { dataRouter?: boolean } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
  let host: RootHost | null = null;
  let stopCatalogListener: (() => void) | undefined;
  let dataRouter: ReturnType<typeof createBrowserRouter> | undefined;

  function render(props: MicroAppProps = {}) {
    if (window.__ddyBrowserGuard && !window.__ddyBrowserGuard.checkStyles()) return;
    const rootElement =
      props.container?.querySelector<RootHost>("#root") ??
      (document.getElementById("root") as RootHost | null);
    if (!rootElement) throw new Error("缺少应用挂载节点");
    stopCatalogListener ??= subscribeCatalogChanges(queryClient);
    host = rootElement;
    host.__ddyidcRoot ??= createRoot(host);
    document.documentElement.classList.toggle(
      "view-transitions-supported",
      "startViewTransition" in document,
    );
    const content = <><ScrollRestoration /><RoutePrefetch /><LinkProvider component={RouterLink}><TooltipProvider><Toasty><VersionRefreshNotice /><RouteErrorBoundary><App /></RouteErrorBoundary></Toasty></TooltipProvider></LinkProvider></>;
    if (options.dataRouter && !dataRouter) dataRouter = createBrowserRouter([{ path: '*', element: content }]);
    host.__ddyidcRoot.render(
      <StrictMode>
        <RuntimeReady />
        <QueryClientProvider client={queryClient}>
          {dataRouter ? <RouterProvider router={dataRouter} /> : <BrowserRouter>{content}</BrowserRouter>}
        </QueryClientProvider>
      </StrictMode>,
    );
  }

  return {
    bootstrap: async (): Promise<void> => {},
    mount: async (props: MicroAppProps = {}): Promise<void> => render(props),
    unmount: async (): Promise<void> => {
      stopCatalogListener?.();
      stopCatalogListener = undefined;
      host?.__ddyidcRoot?.unmount();
      dataRouter?.dispose();
      dataRouter = undefined;
      if (host) delete host.__ddyidcRoot;
      host = null;
    },
    standalone: () => {
      if (!window.__POWERED_BY_QIANKUN__) render();
    },
  };
}
