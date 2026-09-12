import { Suspense, type ReactNode } from "react";
import { RouteSkeleton, type SkeletonKind } from "../components/skeletons";

export function LazyRoute({ children, kind, skeleton = true }: { children: ReactNode; kind: SkeletonKind; skeleton?: boolean }) {
  return <Suspense fallback={skeleton ? <RouteSkeleton kind={kind} /> : null}>{children}</Suspense>;
}
