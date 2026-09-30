import { Suspense, type ReactNode } from "react";
import { ContentFade } from "../components/ContentFade";

export function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}><ContentFade>{children}</ContentFade></Suspense>;
}