import {
  Banner,
  Button,
  Empty,
  LayerCard,
} from "@cloudflare/kumo";
import { PackageIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { ContentSkeleton, type SkeletonKind } from "./skeletons";
import { ContentFade, isProductListPath } from "./ContentFade";
import { useLocation } from "react-router-dom";

const skeletonKinds: readonly SkeletonKind[] = ["products", "catalog"];

function isSkeletonKind(value: SkeletonKind | ReactNode): value is SkeletonKind {
  return typeof value === "string" && skeletonKinds.includes(value as SkeletonKind);
}

export function PageState({
  children,
  loading = false,
  empty = false,
  error,
  emptyTitle = "暂无数据",
  emptyDescription = "当前条件下没有可显示的记录。",
  skeleton = "products",
  skeletonDelayMs = 300,
}: {
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  skeleton?: SkeletonKind | ReactNode;
  skeletonDelayMs?: number;
}) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const catalog = isProductListPath(useLocation().pathname);

  useEffect(() => {
    if (loading && catalog) {
      const timer = window.setTimeout(() => setShowSkeleton(true), skeletonDelayMs);
      return () => window.clearTimeout(timer);
    }
    if (showSkeleton) {
      const timer = window.setTimeout(() => setShowSkeleton(false), 100);
      return () => window.clearTimeout(timer);
    }
  }, [loading, catalog, showSkeleton, skeletonDelayMs]);

  if (loading && !catalog) return null;
  if (loading && catalog) {
    if (!showSkeleton) {
      return <div role="status" aria-label="正在加载页面数据" aria-busy="true" />;
    }
    return isSkeletonKind(skeleton) ? <ContentSkeleton kind={skeleton} /> : skeleton;
  }
  if (empty) {
    return (
      <ContentFade>
        <div>
        <LayerCard className="shadow-none">
          <Empty className="bg-kumo-base"
            icon={<PackageIcon />}
            title={emptyTitle}
            description={emptyDescription}
          />
        </LayerCard>
        </div>
      </ContentFade>
    );
  }
  if (error) {
    return (
      <ContentFade>
        <div>
        <Banner
          variant="error"
          icon={<WarningCircleIcon />}
          title="数据加载失败"
          description={error}
          action={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              重新加载
            </Button>
          }
        />
        </div>
      </ContentFade>
    );
  }
  return <ContentFade><div>{children}</div></ContentFade>;
}
