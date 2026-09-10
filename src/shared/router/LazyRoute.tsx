import { Suspense, type ReactNode } from "react";
import { RouteSkeleton, type SkeletonKind } from "../components/skeletons";

export function LazyRoute({ children, kind }: { children: ReactNode; kind: SkeletonKind }) {
  return <Suspense fallback={<RouteSkeleton kind={kind} />}>{children}</Suspense>;
}
