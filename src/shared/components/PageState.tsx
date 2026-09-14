import {
  Banner,
  Button,
  Empty,
  LayerCard,
} from "@cloudflare/kumo";
import { PackageIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ReactNode } from "react";
import { ContentSkeleton, type SkeletonKind } from "./skeletons";

const skeletonKinds: readonly SkeletonKind[] = ["dashboard", "table", "cards", "products", "catalog", "detail", "product", "form", "chart"];

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
  skeleton = "table",
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

  useEffect(() => {
    if (loading) {
      const timer = window.setTimeout(() => setShowSkeleton(true), skeletonDelayMs);
      return () => window.clearTimeout(timer);
    }
    if (showSkeleton) {
      const timer = window.setTimeout(() => setShowSkeleton(false), 100);
      return () => window.clearTimeout(timer);
    }
  }, [loading, showSkeleton, skeletonDelayMs]);

  if (loading) {
    if (!showSkeleton) {
      return <div role="status" aria-label="正在加载页面数据" aria-busy="true" />;
    }
    return isSkeletonKind(skeleton) ? <ContentSkeleton kind={skeleton} /> : skeleton;
  }
  if (empty) {
    return (
      <div>
        <LayerCard className="shadow-none">
          <Empty className="bg-kumo-base"
            icon={<PackageIcon />}
            title={emptyTitle}
            description={emptyDescription}
          />
        </LayerCard>
      </div>
    );
  }
  if (error) {
    return (
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
    );
  }
  return <div>{children}</div>;
}
