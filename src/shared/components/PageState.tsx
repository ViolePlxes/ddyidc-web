import {
  Banner,
  Button,
  Empty,
  LayerCard,
  Loader,
} from "@cloudflare/kumo";
import { PackageIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { type ReactNode } from "react";
import { ContentSkeleton, type SkeletonKind } from "./skeletons";
import { ContentFade } from "./ContentFade";

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
  skeleton,
  keepContent = false,
}: {
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  skeleton?: SkeletonKind | ReactNode;
  keepContent?: boolean;
}) {
  if (loading) {
    return <div aria-busy="true" className="grid gap-3">
      <div role="status" className="flex items-center gap-2 text-sm text-kumo-subtle"><Loader /><span>正在加载数据…</span></div>
      {keepContent ? children : skeleton ? (isSkeletonKind(skeleton) ? <ContentSkeleton kind={skeleton} /> : skeleton) : null}
    </div>;
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
  return <ContentFade className="grid min-w-0 gap-6">{children}</ContentFade>;
}
