import { Suspense, type ReactNode } from "react";
import type { SkeletonKind } from "../components/skeletons";

export function LazyRoute({ children }: { children: ReactNode; kind: SkeletonKind; skeleton?: boolean }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
