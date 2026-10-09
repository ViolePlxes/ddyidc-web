import { Suspense, type ReactNode } from "react";
import { ContentFade, ContentPending } from "../components/ContentFade";
import { useLocation } from "react-router-dom";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

export function LazyRoute({ children, fallback = <ContentPending /> }: { children: ReactNode; fallback?: ReactNode }) {
  const location = useLocation();
  return <RouteErrorBoundary key={location.pathname + location.search}><Suspense fallback={fallback}><ContentFade className="grid min-w-0 gap-6">{children}</ContentFade></Suspense></RouteErrorBoundary>;
}
