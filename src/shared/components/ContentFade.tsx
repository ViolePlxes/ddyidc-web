import { useIsFetching, useQueryClient, type Query } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

type LoadingRegion = { setPending: (id: string, pending: boolean) => void };
const FadeRegion = createContext<LoadingRegion | null>(null);
const initialData = { predicate: (query: Query) => query.getObserversCount() > 0 && query.state.data === undefined };

export function isProductListPath(path: string) {
  return ["/console/products", "/products"].includes(path.replace(/\/$/, ""));
}

/** Keep queries mounted while hiding the complete region until initial data settles. */
export function ContentFade({ children, className }: { children: ReactNode; className?: string }) {
  const nested = useContext(FadeRegion);
  return nested ? <>{children}</> : <InitialContentFade className={className}>{children}</InitialContentFade>;
}

/** Descendant data gates and lazy modules participate in the same page reveal. */
export function useContentLoading(loading: boolean) {
  const region = useContext(FadeRegion);
  const id = useId();
  useLayoutEffect(() => {
    region?.setPending(id, loading);
    return () => region?.setPending(id, false);
  }, [region, id, loading]);
}

export function ContentPending() {
  useContentLoading(true);
  return null;
}

function InitialContentFade({ children, className }: { children: ReactNode; className?: string }) {
  const location = useLocation();
  const catalog = isProductListPath(location.pathname);
  const client = useQueryClient();
  const fetching = useIsFetching(initialData);
  const route = location.key + location.pathname + location.search;
  const [revealedRoute, setRevealedRoute] = useState<string | null>(null);
  const pending = useRef(new Set<string>());
  const [pendingCount, setPendingCount] = useState(0);
  const setPending = useCallback((id: string, loading: boolean) => {
    if (loading) pending.current.add(id);
    else pending.current.delete(id);
    setPendingCount(pending.current.size);
  }, []);
  const loadingRegion = useMemo(() => ({ setPending }), [setPending]);
  const region = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (catalog || revealedRoute === route || fetching > 0 || pendingCount > 0) return;
    let secondFrame = 0;
    // Allow dependent queries and lazy descendants to mount before revealing anything.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (client.isFetching(initialData) === 0 && pending.current.size === 0) setRevealedRoute(route);
      });
    });
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); };
  }, [catalog, client, fetching, pendingCount, revealedRoute, route]);
  const visible = catalog || revealedRoute === route;
  useLayoutEffect(() => {
    if (catalog || !visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = region.current?.animate([
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    return () => animation?.cancel();
  }, [catalog, visible, route]);
  return <FadeRegion.Provider value={loadingRegion}>
    <div ref={region} className={className}
      data-content-fade={catalog ? "catalog" : visible ? "ready" : "loading"}
      aria-busy={!visible} inert={!visible}
      style={visible ? undefined : { opacity: 0, visibility: "hidden", transform: "translateY(8px)" }}>
      {children}
    </div>
  </FadeRegion.Provider>;
}
