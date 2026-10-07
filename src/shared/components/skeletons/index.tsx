import { LayerCard, Sidebar, SkeletonLine, Surface, Table } from "@cloudflare/kumo";
import { catalogColumns, catalogLayout } from "../../utils/productCatalog";


export function PageHeaderSkeleton() {
  return (
    <div className="grid min-h-16 gap-2" aria-hidden="true">
      <SkeletonLine className="h-7 w-48" />
      <SkeletonLine className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function CardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <LayerCard className={`grid gap-4 p-4 ${compact ? "" : "h-80"}`} aria-hidden="true">
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

export function ProductBillSkeleton() {
  return (
    <LayerCard className="grid gap-5 p-4" role="status" aria-label="正在加载当前应付账单">
      <div className="grid gap-1" aria-hidden="true">
        <SkeletonLine className="h-4 w-24" />
        <SkeletonLine className="h-9 w-36" />
        <SkeletonLine className="h-4 w-40 max-w-full" />
      </div>
      <div className="grid gap-2 border-t border-kumo-line pt-4" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => <SkeletonLine key={index} className="h-4 w-full" />)}
      </div>
      <SkeletonLine className="h-9 w-40" />
      <SkeletonLine className="h-9 w-full" />
      <SkeletonLine className="h-9 w-full" />
    </LayerCard>
  );
}

export function ProductSpecTableSkeleton() {
  return (
    <LayerCard className="min-w-0" role="status" aria-label="正在加载计算规格">
      <LayerCard.Secondary><h2>计算规格</h2></LayerCard.Secondary><LayerCard.Primary className="grid gap-4">
      <div className="overflow-x-auto" aria-hidden="true">
        <Table className="whitespace-nowrap">
          <Table.Header><Table.Row>{catalogColumns.map((name) => <Table.Head key={name}>{name}</Table.Head>)}</Table.Row></Table.Header>
          <Table.Body>{Array.from({ length: 10 }, (_, row) => <Table.Row key={row}>
            {catalogColumns.map((name, column) => <Table.Cell key={name}><SkeletonLine className={`h-5 ${column === 0 ? "w-52" : "w-12"}`} /></Table.Cell>)}
          </Table.Row>)}</Table.Body>
        </Table>
      </div>
      <SkeletonLine className="h-9 w-48" />
    </LayerCard.Primary></LayerCard>
  );
}

export function ProductCatalogSkeleton() {
  return (
    <div className={catalogLayout} role="status" aria-label="正在加载订购目录">
      <div className="hidden min-w-0 gap-3 xl:flex xl:h-[calc(100dvh-12rem)] xl:flex-col xl:justify-center" aria-hidden="true">
        <SkeletonLine className="h-4 w-24" />
        {[0, 1, 2, 3].map((index) => <SkeletonLine key={index} className="h-5 w-32" />)}
      </div>
      <div className="grid min-w-0 gap-5">
        <LayerCard className="grid gap-4 p-4">
          {["一级分类", "二级分类"].map((label) => <div key={label} className="grid min-w-0 gap-3 md:grid-cols-[6rem_minmax(0,1fr)] md:items-center">
            <strong>{label}</strong><div className="flex min-w-0 gap-2 overflow-hidden" aria-hidden="true">
              {[0, 1, 2].map((index) => <SkeletonLine key={index} className="h-9 w-28 shrink-0" />)}
            </div>
          </div>)}
        </LayerCard>
        <ProductSpecTableSkeleton />
        <ProductConfigSkeleton externalBill />
      </div>
      <aside className="min-w-0 xl:sticky xl:top-20" aria-label="当前应付账单"><ProductBillSkeleton /></aside>
    </div>
  );
}

export function ProductConfigSkeleton({ externalBill = false }: { externalBill?: boolean }) {
  return (
    <div className={`grid min-w-0 items-start gap-6 ${externalBill ? "" : "xl:grid-cols-[minmax(0,1fr)_22rem]"}`} role="status" aria-label="正在加载商品配置">
      <div className="grid gap-5">
        {!externalBill ? <LayerCard className="grid min-h-28 gap-3 p-4" aria-hidden="true">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 w-2/3" />
        </LayerCard> : null}
        {Array.from({ length: 4 }, (_, index) => (
          <LayerCard key={index} className="grid gap-4 p-4 md:grid-cols-[8rem_minmax(0,1fr)] md:items-center" aria-hidden="true">
            <SkeletonLine className="h-6 w-32" />
            <SkeletonLine className="h-9 w-full" />
          </LayerCard>
        ))}
        {[0, 1].map((index) => <LayerCard key={index} className="grid gap-4 p-4" aria-hidden="true">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="h-9 w-full" />
          <SkeletonLine className="h-9 w-full" />
        </LayerCard>)}
      </div>
      {!externalBill ? <ProductBillSkeleton /> : null}
    </div>
  );
}

export type SkeletonKind = "products" | "catalog";

export function ContentSkeleton({ kind }: { kind: SkeletonKind }) {
  return kind === "catalog" ? <ProductCatalogSkeleton /> : <ProductListSkeleton />;
}

export function AppShellSkeleton({ kind = "products" }: { kind?: SkeletonKind }) {
  return (
    <Sidebar.Provider defaultOpen collapsible="icon" className="h-svh max-h-svh overflow-hidden">
      <Sidebar aria-label="正在加载主导航" className="[--sidebar-bg:var(--color-kumo-canvas)]">
        <Sidebar.Header>
          <SkeletonLine className="h-8 w-32" />
        </Sidebar.Header>
        <Sidebar.Loading label="正在恢复会话" />
        <Sidebar.Footer>
          <Sidebar.Trigger />
        </Sidebar.Footer>
      </Sidebar>
      <div className="min-w-0 flex-1 overflow-y-auto bg-kumo-canvas" role="status" aria-label="正在恢复会话">
        <Surface className="h-[58px] border-b border-kumo-line bg-kumo-canvas" />
        <main className={`grid w-full gap-6 p-4 md:p-6 lg:p-8 ${kind === "catalog" ? "" : "mx-auto max-w-7xl"}`}>
          <PageHeaderSkeleton />
          <ContentSkeleton kind={kind} />
        </main>
      </div>
    </Sidebar.Provider>
  );
}
