import {
  Banner,
  Button,
  Empty,
  LayerCard,
} from "@cloudflare/kumo";
import { PackageIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ContentSkeleton, type SkeletonKind } from "./skeletons";

const skeletonKinds: readonly SkeletonKind[] = ["dashboard", "table", "cards", "products", "detail", "product", "form", "chart"];

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
}: {
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  skeleton?: SkeletonKind | ReactNode;
}) {
  if (loading) {
    return isSkeletonKind(skeleton) ? <ContentSkeleton kind={skeleton} /> : skeleton;
  }
  if (empty) {
    return (
      <LayerCard>
        <Empty
          icon={<PackageIcon />}
          title={emptyTitle}
          description={emptyDescription}
        />
      </LayerCard>
    );
  }
  if (error) {
    return (
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
    );
  }
  return <div className="content-reveal">{children}</div>;
}
