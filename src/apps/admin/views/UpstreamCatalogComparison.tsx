import {ScopedTable as Table} from '../../../shared/components/ScopedTable';
import { ConnectResultPendingError } from "../../../shared/utils/upstreamConnect";
import { Badge } from "../../../shared/components/Badge";
import { useMemo, useRef, useState, type DragEvent } from "react";
import { Banner,  Button, Input, LayerCard, Select, Sidebar} from "@cloudflare/kumo";
import { Dialog } from "../../../shared/components/Dialog";
import { DotsSixVerticalIcon, FolderIcon, SquaresFourIcon } from "@phosphor-icons/react";

export interface ComparisonCategory { id: string; parentId: string; name: string }
export interface ComparisonProduct { id: string; groupId: string; name: string; price: number | null; mapped: boolean; counterpartName?: string; deletable?: boolean; hidden?: boolean; localId?: string; upstreamId?: string; supplierId?: string }
interface PaneProps { title: string; categories: ComparisonCategory[]; products: ComparisonProduct[]; upstream: boolean; onAction?: (product: ComparisonProduct) => void; busyId?: string; dragging?: boolean; onProductDragStart?: (event: DragEvent<HTMLTableRowElement>, product: ComparisonProduct) => void; onProductDragEnd?: () => void; onSync?: (product: ComparisonProduct) => void; onProductDrop?: (event: DragEvent<HTMLElement>, groupId: string) => void }

function CatalogPane({ title, categories, products, upstream, onAction, busyId, dragging, onProductDragStart, onProductDragEnd, onProductDrop, onSync }: PaneProps) {
  const [dropTarget, setDropTarget] = useState("");
  const [selected, setSelected] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const categoryIds = useMemo(() => new Set(categories.map(item => item.id)), [categories]);
  const roots = categories.filter(item => !item.parentId || item.parentId === "0");
  const visible = useMemo(() => {
    const allowed = new Set([selected, ...categories.filter(item => item.parentId === selected).map(item => item.id)]);
    const needle = keyword.trim().toLocaleLowerCase();
    return products.filter(item => (selected === "all" || (selected === "ungrouped" ? !categoryIds.has(item.groupId) : allowed.has(item.groupId))) && (!needle || item.name.toLocaleLowerCase().includes(needle) || item.id.includes(needle)));
  }, [products, categories, categoryIds, selected, keyword]);
  const select = (id: string) => { setSelected(id); setPage(1); };
  const count = (id: string) => {
    const ids = new Set([id, ...categories.filter(item => item.parentId === id).map(item => item.id)]);
    return products.filter(item => ids.has(item.groupId)).length;
  };
  const ungrouped = products.filter(item => !categoryIds.has(item.groupId)).length;
  const pageCount = Math.max(1, Math.ceil(visible.length / 20));
  const currentPage = Math.min(page, pageCount);
  const categoryName = selected === "all" ? "全部商品" : selected === "ungrouped" ? "未分组商品" : categories.find(item => item.id === selected)?.name ?? "全部商品";
  const dragOver = (event: DragEvent<HTMLElement>, target: string) => {
    if (upstream || !dragging || busyId) return;
    event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setDropTarget(target);
  };
  const dragLeave = (event: DragEvent<HTMLElement>) => {
    if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDropTarget("");
  };
  const drop = (event: DragEvent<HTMLElement>, groupId: string) => {
    if (upstream || !dragging || busyId) return;
    event.preventDefault(); event.stopPropagation(); setDropTarget("");
    if (groupId) { setSelected(groupId); setKeyword(""); setPage(1); }
    onProductDrop?.(event, groupId);
  };
  return <LayerCard className="min-w-0 overflow-hidden p-0">
    <LayerCard.Secondary className="flex items-center justify-between gap-3 p-4"><h2 className="font-semibold">{title}</h2><span className="text-base text-kumo-subtle">{products.length} 个商品</span></LayerCard.Secondary>
    <Sidebar.Provider defaultOpen contained collapsible="none" mobileBreakpoint={0} className="h-[640px] min-w-0 overflow-hidden">
      <Sidebar aria-label={`${title}分类`} className="w-44 shrink-0 border-r border-kumo-line">
        <Sidebar.Content><Sidebar.Group><Sidebar.GroupLabel>商品分类</Sidebar.GroupLabel><Sidebar.Menu>
          <Sidebar.MenuButton icon={SquaresFourIcon} active={selected === "all"} onClick={() => select("all")}><span className="flex-1">全部商品</span><span className="text-base text-kumo-subtle">{products.length}</span></Sidebar.MenuButton>
          {roots.map(root => <Sidebar.MenuItem key={root.id}><Sidebar.Collapsible defaultOpen>
            <Sidebar.CollapsibleTrigger render={<Sidebar.MenuButton icon={FolderIcon} active={selected === root.id} onClick={() => select(root.id)}><span className="min-w-0 flex-1 truncate" title={root.name}>{root.name}</span><span className="text-base text-kumo-subtle">{count(root.id)}</span><Sidebar.MenuChevron /></Sidebar.MenuButton>} />
            <Sidebar.CollapsibleContent><Sidebar.MenuSub>{categories.filter(item => item.parentId === root.id).map(child => <Sidebar.MenuSubButton key={child.id} active={selected === child.id} onClick={() => select(child.id)} title={!upstream ? "拖入上游商品，对接到此分类" : undefined} className={dragging && dropTarget === child.id ? "bg-kumo-tint ring-1 ring-kumo-line" : undefined} onDragOver={event => dragOver(event, child.id)} onDragLeave={dragLeave} onDrop={event => drop(event, child.id)}><span className="min-w-0 flex-1 truncate" title={child.name}>{child.name}</span><span className="text-base text-kumo-subtle">{count(child.id)}</span></Sidebar.MenuSubButton>)}</Sidebar.MenuSub></Sidebar.CollapsibleContent>
          </Sidebar.Collapsible></Sidebar.MenuItem>)}
          {ungrouped > 0 && <Sidebar.MenuButton active={selected === "ungrouped"} onClick={() => select("ungrouped")}><span className="flex-1">未分组商品</span><span className="text-base text-kumo-subtle">{ungrouped}</span></Sidebar.MenuButton>}
        </Sidebar.Menu></Sidebar.Group></Sidebar.Content>
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="grid gap-3 border-b border-kumo-line p-4"><div className="flex items-center justify-between gap-2"><h3 className="truncate text-base font-medium">{categoryName}</h3><span className="shrink-0 text-base text-kumo-subtle">{visible.length} 个</span></div><Input aria-label={`搜索${title}`} placeholder="搜索商品名称或编号" value={keyword} onChange={event => { setKeyword(event.target.value); setPage(1); }} /></div>
        <div aria-label={`${title}商品列表`} className={`min-h-0 flex-1 overflow-auto ${dragging && dropTarget === "list" ? "bg-kumo-tint ring-1 ring-inset ring-kumo-line" : ""}`} onDragOver={event => dragOver(event, "list")} onDragLeave={dragLeave} onDrop={event => drop(event, categories.some(item => item.id === selected && item.parentId !== "0") ? selected : "")}><Table tableId="apps/admin/views/UpstreamCatalogComparison.tsx:1">
          <Table.Header variant="compact"><Table.Row><Table.Head>商品</Table.Head><Table.Head>{upstream ? "成本参考" : "售价"}</Table.Head><Table.Head>对接状态</Table.Head>{onAction && <Table.Head>操作</Table.Head>}</Table.Row></Table.Header>
          <Table.Body>{visible.slice((currentPage - 1) * 20, currentPage * 20).map(item => <Table.Row key={item.id} draggable={Boolean(upstream && onProductDragStart && !item.mapped && !busyId)} onDragStart={event => onProductDragStart?.(event, item)} onDragEnd={onProductDragEnd} className={upstream && !item.mapped && onProductDragStart ? "cursor-grab active:cursor-grabbing" : undefined}>
            <Table.Cell><div className="grid gap-1"><span className="flex items-center gap-1 text-base font-medium">{upstream && !item.mapped && onProductDragStart && <DotsSixVerticalIcon aria-hidden="true" className="size-4 shrink-0 text-kumo-subtle"/>}{item.name}</span><span className="text-base text-kumo-subtle">#{item.id}</span>{item.counterpartName && <span className="text-base text-kumo-subtle">{upstream ? "本地：" : "供应商："}{item.counterpartName}</span>}</div></Table.Cell>
            <Table.Cell>{item.price === null ? "—" : `¥${item.price.toFixed(2)}`}</Table.Cell>
            <Table.Cell><Badge variant={item.mapped ? "secondary" : "outline"}>{upstream ? item.mapped ? "已对接" : "—" : item.mapped ? item.hidden ? "已隐藏 · 已对接" : "已对接" : "未对接"}</Badge></Table.Cell>
            {onAction && <Table.Cell>{upstream ? !item.mapped && <Button size="sm" variant="primary" disabled={Boolean(busyId)} loading={busyId === item.id} onClick={() => onAction(item)}>对接</Button> : item.mapped ? <div className="flex gap-2">{onSync && <Button size="sm" variant="secondary" disabled={Boolean(busyId)} onClick={() => onSync(item)}>同步</Button>}<Button size="sm" variant="secondary" disabled={Boolean(busyId) || Boolean(item.deletable === false && item.hidden)} loading={busyId === item.id} onClick={() => onAction(item)}>{item.deletable === false ? item.hidden ? "已隐藏" : "隐藏" : "取消对接"}</Button></div> : "—"}</Table.Cell>}
          </Table.Row>)}</Table.Body>
        </Table>{!visible.length && <p className="p-8 text-center text-base text-kumo-subtle">当前分类暂无匹配商品</p>}</div>
        <div className="flex items-center justify-between gap-2 border-t border-kumo-line p-3"><Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一页</Button><span className="text-base text-kumo-subtle">{currentPage} / {pageCount}</span><Button variant="secondary" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>下一页</Button></div>
      </div>
    </Sidebar.Provider>
  </LayerCard>;
}

export interface UpstreamCatalogComparisonProps {
  upstreamCategories: ComparisonCategory[];
  upstreamProducts: ComparisonProduct[];
  localCategories: ComparisonCategory[];
  localProducts: ComparisonProduct[];
  onConnect?: (product: ComparisonProduct, groupId: string) => Promise<void>;
  onDisconnect?: (product: ComparisonProduct) => Promise<void>;
  onHide?: (product: ComparisonProduct) => Promise<void>;
  onSync?: (product: ComparisonProduct) => Promise<void>;
  disconnectDescription?: string;
}
export function UpstreamCatalogComparison(props: UpstreamCatalogComparisonProps) {
  const dropInFlight = useRef(false);
  const [draggedId, setDraggedId] = useState("");
  const [action, setAction] = useState<ComparisonProduct | null>(null);
  const [primaryId, setPrimaryId] = useState("");
  const [secondaryId, setSecondaryId] = useState("");
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [pendingResult, setPendingResult] = useState(false);
  const showError = (err: unknown, fallback: string) => { setPendingResult(err instanceof ConnectResultPendingError); setError(err instanceof Error ? err.message : fallback); };
  const roots = props.localCategories.filter(item => !item.parentId || item.parentId === "0");
  const children = props.localCategories.filter(item => item.parentId === primaryId);
  const openAction = (product: ComparisonProduct, groupId = "") => {
    const category = props.localCategories.find(item => item.id === groupId && item.parentId !== "0");
    setAction(product); setError(""); setPendingResult(false); setPrimaryId(category?.parentId ?? ""); setSecondaryId(category?.id ?? "");
  };
  const beginDrag = (event: DragEvent<HTMLTableRowElement>, product: ComparisonProduct) => {
    if (!props.onConnect || product.mapped || busyId || action || dropInFlight.current) { event.preventDefault(); return; }
    event.dataTransfer.setData("application/x-ddyidc-upstream-product", product.id);
    event.dataTransfer.effectAllowed = "copy"; setDraggedId(product.id);
  };
  const receiveDrop = (event: DragEvent<HTMLElement>, groupId: string) => {
    const id = event.dataTransfer.getData("application/x-ddyidc-upstream-product");
    const product = props.upstreamProducts.find(item => item.id === id && !item.mapped);
    if (!draggedId || id !== draggedId || !product || busyId || action || dropInFlight.current || !props.onConnect) return;
    setDraggedId("");
    const category = props.localCategories.find(item => item.id === groupId && Boolean(item.parentId) && item.parentId !== "0");
    if (!category) { setError("请先在右侧选择二级分类，或直接拖到右侧二级分类名称上。"); return; }
    dropInFlight.current = true; setBusyId(product.id); setError("");
    void (async () => {
      try { await props.onConnect!(product, category.id); }
      catch (err) { showError(err, "对接失败，请重试"); }
      finally { dropInFlight.current = false; setBusyId(""); }
    })();
  };
  const syncLocal = (product: ComparisonProduct) => {
    if (!props.onSync || busyId || action || dropInFlight.current) return;
    dropInFlight.current = true; setBusyId(product.id); setError("");
    void props.onSync(product).catch(err => showError(err, "同步失败")).finally(() => { dropInFlight.current = false; setBusyId(""); });
  };
  const execute = async () => {
    if (!action || busyId || dropInFlight.current) return;
    const selected = action;
    if (!selected.mapped && !props.localCategories.some(item => item.id === secondaryId && item.parentId === primaryId && item.parentId !== "0")) { setError("请选择本地二级分类"); return; }
    setBusyId(selected.id); setError("");
    try {
      if (selected.mapped) {
        if (!props.onDisconnect) throw new Error("取消对接尚不可用");
        if (selected.deletable === false) {
          if (!props.onHide) throw new Error("该商品有关联记录，只能隐藏");
          await props.onHide(selected);
        } else { await props.onDisconnect(selected); }
      } else {
        if (!props.onConnect) throw new Error("对接尚不可用");
        await props.onConnect(selected, secondaryId);
      }
      setAction(null);
    } catch (err) { showError(err, "操作失败，请重试"); }
    finally { setBusyId(""); }
  };
  return <>
    {!action && error && <div className="mb-4"><Banner variant={pendingResult ? "alert" : "error"} title={pendingResult ? "对接结果待确认" : "操作未完成"} description={error}/></div>}
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <CatalogPane title="上游商品" categories={props.upstreamCategories} products={props.upstreamProducts} upstream onAction={props.onConnect ? openAction : undefined} busyId={busyId} onProductDragStart={props.onConnect ? beginDrag : undefined} onProductDragEnd={() => setDraggedId("")}/>
      <CatalogPane title="全部本地商品" categories={props.localCategories} products={props.localProducts} upstream={false} onAction={props.onDisconnect || props.onHide ? openAction : undefined} busyId={busyId} dragging={Boolean(draggedId)} onProductDrop={receiveDrop} onSync={props.onSync ? syncLocal : undefined}/>
    </div>
    <Dialog.Root open={Boolean(action)} onOpenChange={open => { if (!open && !busyId) setAction(null); }}>
      <Dialog size="base" className="grid gap-4 p-8">
        <div><Dialog.Title>{action?.mapped ? action.deletable === false ? "商品有关联记录，只能隐藏" : "取消商品对接" : "对接到本地商品"}</Dialog.Title><Dialog.Description>{action?.name} #{action?.id}</Dialog.Description></div>
        {action?.mapped ? <p className="text-base text-kumo-subtle">{action.deletable === false ? "该商品存在订单或机器关联，禁止删除本地商品和映射。隐藏后将停止展示给新客户，已有机器和订单继续保留。" : props.disconnectDescription ?? "将删除本地商品和供应商映射。服务端会再次检查订单和机器关联；存在关联则拒绝删除。"}</p> : <>
          <p className="text-base text-kumo-subtle">选择本地分类后，将在右侧建立对应商品。不会购买服务器或扣除余额。</p>
          <Select label="本地一级分类" value={primaryId} onValueChange={value => { setPrimaryId(value ?? ""); setSecondaryId(""); }} items={Object.fromEntries(roots.map(item => [item.id, item.name]))}/>
          <Select label="本地二级分类" value={secondaryId} disabled={!primaryId} onValueChange={value => setSecondaryId(value ?? "")} items={Object.fromEntries(children.map(item => [item.id, item.name]))}/>
        </>}
        {error && <Banner variant={pendingResult ? "alert" : "error"} title={pendingResult ? "对接结果待确认" : "操作失败"} description={error}/>}
        <div className="flex justify-end gap-2"><Button variant="secondary" disabled={Boolean(busyId)} onClick={() => setAction(null)}>返回</Button><Button variant={action?.mapped ? "destructive" : "primary"} loading={Boolean(busyId)} disabled={!action?.mapped && !secondaryId} onClick={() => { void execute(); }}>{action?.mapped ? action.deletable === false ? "隐藏商品" : "确认取消对接" : pendingResult ? "核对对接结果" : "确认对接"}</Button></div>
      </Dialog>
    </Dialog.Root>
  </>;
}
