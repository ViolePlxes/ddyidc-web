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
  Link,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";
import { prefetchRoute } from "../shared/router/routeModules";
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
  }
}

function entryScope(path: string): "portal" | "console" | "admin" | "sales" {
  if (path === "/admin" || path.startsWith("/admin/")) return "admin";
  if (path === "/sales" || path.startsWith("/sales/")) return "sales";
  if (
    path === "/cart" ||
    path === "/order/confirm" ||
    path === "/bind-mobile" ||
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

export function createEntry(App: ComponentType) {
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

  function render(props: MicroAppProps = {}) {
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
    host.__ddyidcRoot.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ScrollRestoration />
            <RoutePrefetch />
            <LinkProvider component={RouterLink}>
              <TooltipProvider>
                <Toasty>
                  <App />
                </Toasty>
              </TooltipProvider>
            </LinkProvider>
          </BrowserRouter>
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
      if (host) delete host.__ddyidcRoot;
      host = null;
    },
    standalone: () => {
      if (!window.__POWERED_BY_QIANKUN__) render();
    },
  };
}
