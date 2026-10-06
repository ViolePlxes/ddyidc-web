import { Suspense, type ReactNode } from "react";
import { ContentFade, ContentPending } from "../components/ContentFade";

export function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<ContentPending />}><ContentFade className="grid min-w-0 gap-6">{children}</ContentFade></Suspense>;
}
