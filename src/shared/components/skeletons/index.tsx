import { LayerCard, Sidebar, SkeletonLine, Surface, Table } from "@cloudflare/kumo";

const lineWidths = ["w-32", "w-24", "w-20", "w-28", "w-16", "w-12"] as const;

export function PageHeaderSkeleton() {
  return (
    <div className="grid min-h-16 gap-2" aria-hidden="true">
      <SkeletonLine className="h-7 w-48" />
      <SkeletonLine className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function TableSkeleton({
  columns = 5,
  rows = 10,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <LayerCard className="shadow-none overflow-x-auto p-0" role="status" aria-label="正在加载表格数据">
      <Table>
        <Table.Header variant="compact">
          <Table.Row>
            {Array.from({ length: columns }, (_, column) => (
              <Table.Head key={column}>
                <SkeletonLine className={`h-4 ${lineWidths[column % lineWidths.length]}`} />
              </Table.Head>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: rows }, (_, row) => (
            <Table.Row key={row}>
              {Array.from({ length: columns }, (_, column) => (
                <Table.Cell key={column}>
                  <SkeletonLine
                    blockHeight={40}
                    className={`h-4 ${lineWidths[(row + column) % lineWidths.length]}`}
                  />
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </LayerCard>
  );
}

export function CardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <LayerCard className={`shadow-none grid gap-4 ${compact ? "p-4" : "h-80 p-5"}`} aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <SkeletonLine className="h-10 w-10" />
        <SkeletonLine className="h-5 w-20" />
      </div>
      <SkeletonLine className="h-6 w-3/5" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-4/5" />
      <div className="mt-auto flex items-center justify-between border-t border-kumo-line pt-4">
        <SkeletonLine className="h-7 w-24" />
        <SkeletonLine className="h-9 w-28" />
      </div>
    </LayerCard>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="正在加载卡片数据">
      {Array.from({ length: count }, (_, index) => <CardSkeleton key={index} />)}
    </section>
  );
}

export function ProductListSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="正在加载商品目录">
      <section className="grid gap-3">
        <SkeletonLine className="h-6 w-36" />
        <CardGridSkeleton />
      </section>
    </div>
  );
}

export function MetricSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <LayerCard key={index} className="shadow-none grid min-h-36 gap-3 p-5">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-9 w-20" />
          <SkeletonLine className="h-4 w-32" />
        </LayerCard>
      ))}
    </section>
  );
}

export function ChartSkeleton() {
  return (
    <LayerCard className="shadow-none grid gap-4 p-5" role="status" aria-label="正在加载趋势图">
      <SkeletonLine className="h-6 w-40" />
      <div className="grid h-[280px] grid-cols-12 items-end gap-2 border-b border-l border-kumo-line p-4" aria-hidden="true">
        {[35, 48, 42, 64, 55, 72, 68, 82, 66, 76, 88, 80].map((height, index) => (
          <SkeletonLine key={index} className="w-full" blockHeight={height * 2} />
        ))}
      </div>
    </LayerCard>
  );
}

export function FormSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <LayerCard className="shadow-none grid gap-5 p-5" role="status" aria-label="正在加载表单">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[12rem_1fr] sm:items-center">
          <SkeletonLine className="h-4 w-28" />
          <SkeletonLine className="h-10 w-full" />
        </div>
      ))}
      <SkeletonLine className="h-9 w-28 justify-self-end" />
    </LayerCard>
  );
}

export function DetailSkeleton() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" role="status" aria-label="正在加载详情">
      <FormSkeleton rows={7} />
      <LayerCard className="shadow-none grid gap-5 p-5" aria-hidden="true">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-9 w-36" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-10 w-full" />
      </LayerCard>
    </div>
  );
}

export function ProductConfigSkeleton() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]" role="status" aria-label="正在加载商品配置">
      <div className="grid gap-5">
        <LayerCard className="shadow-none grid min-h-28 gap-3 p-5" aria-hidden="true">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 w-2/3" />
        </LayerCard>
        {Array.from({ length: 8 }, (_, index) => (
          <LayerCard key={index} className="shadow-none grid min-h-36 gap-4 p-5" aria-hidden="true">
            <SkeletonLine className="h-6 w-32" />
            <SkeletonLine className="h-4 w-24" />
            <SkeletonLine className="h-10 w-48 max-w-full" />
          </LayerCard>
        ))}
        <FormSkeleton rows={4} />
      </div>
      <LayerCard className="shadow-none sticky top-20 grid gap-5 p-5" aria-hidden="true">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-9 w-36" />
        <SkeletonLine className="h-4 w-20" />
        <div className="grid gap-2 border-t border-kumo-line pt-4">
          {Array.from({ length: 7 }, (_, index) => <SkeletonLine key={index} className="h-4 w-full" />)}
        </div>
        <SkeletonLine className="h-10 w-full" />
        <SkeletonLine className="h-10 w-28" />
      </LayerCard>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="正在加载概览数据">
      <MetricSkeleton />
      <ChartSkeleton />
      <TableSkeleton columns={4} rows={5} />
    </div>
  );
}

export type SkeletonKind = "dashboard" | "table" | "cards" | "products" | "detail" | "product" | "form" | "chart";

export function ContentSkeleton({ kind }: { kind: SkeletonKind }) {
  if (kind === "dashboard") return <DashboardSkeleton />;
  if (kind === "table") return <TableSkeleton />;
  if (kind === "cards") return <CardGridSkeleton />;
  if (kind === "products") return <ProductListSkeleton />;
  if (kind === "detail") return <DetailSkeleton />;
  if (kind === "product") return <ProductConfigSkeleton />;
  if (kind === "form") return <FormSkeleton />;
  return <ChartSkeleton />;
}

export function RouteSkeleton({ kind }: { kind: SkeletonKind }) {
  return (
    <div className="grid gap-6" role="status" aria-label="正在加载页面">
      <PageHeaderSkeleton />
      <ContentSkeleton kind={kind} />
    </div>
  );
}

export function AppShellSkeleton({ kind = "table" }: { kind?: SkeletonKind }) {
  return (
    <Sidebar.Provider defaultOpen collapsible="icon" className="h-svh max-h-svh overflow-hidden">
      <Sidebar aria-label="正在加载主导航">
        <Sidebar.Header>
          <SkeletonLine className="h-8 w-32" />
        </Sidebar.Header>
        <Sidebar.Loading label="正在恢复会话" />
        <Sidebar.Footer>
          <Sidebar.Trigger />
        </Sidebar.Footer>
      </Sidebar>
      <div className="min-w-0 flex-1 bg-kumo-recessed" role="status" aria-label="正在恢复会话">
        <Surface className="h-[58px] border-b border-kumo-line" />
        <main className="mx-auto grid w-full max-w-7xl gap-6 p-4 md:p-6 lg:p-8">
          <PageHeaderSkeleton />
          <ContentSkeleton kind={kind} />
        </main>
      </div>
    </Sidebar.Provider>
  );
}
