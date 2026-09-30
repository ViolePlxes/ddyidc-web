import { useIsFetching, useQueryClient, type Query } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

const FadeRegion = createContext(false);
const initialData = { predicate: (query: Query) => query.getObserversCount() > 0 && query.state.data === undefined };

export function isProductListPath(path: string) {
  return ["/console/products", "/products"].includes(path.replace(/\/$/, ""));
}

/** Keep queries mounted while hiding the complete region until initial data settles. */
export function ContentFade({ children, className }: { children: ReactNode; className?: string }) {
  const nested = useContext(FadeRegion);
  return nested ? <>{children}</> : <InitialContentFade className={className}>{children}</InitialContentFade>;
}

function InitialContentFade({ children, className }: { children: ReactNode; className?: string }) {
  const location = useLocation();
  const catalog = isProductListPath(location.pathname);
  const client = useQueryClient();
  const fetching = useIsFetching(initialData);
  const route = location.pathname + location.search;
  const [readyRoute, setReadyRoute] = useState<string | null>(null);
  const region = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setReadyRoute(client.isFetching(initialData) === 0 ? route : null);
  }, [client, fetching, route]);
  const visible = catalog || (readyRoute === route && fetching === 0);
  useLayoutEffect(() => {
    if (catalog || !visible || client.isFetching(initialData) > 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = region.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" });
    return () => animation?.cancel();
  }, [catalog, visible, client, location.pathname, location.search]);
  return <FadeRegion.Provider value>
    <div ref={region} className={className}
      data-content-fade={catalog ? "catalog" : visible ? "ready" : "loading"}
      aria-busy={!visible} inert={!visible}
      style={visible ? undefined : { opacity: 0, visibility: "hidden" }}>
      {children}
    </div>
  </FadeRegion.Provider>;
}
