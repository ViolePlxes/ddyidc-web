import { AdminTableCopyText } from "../../../shared/components/AdminTableCopyText";
import { Badge, LayerCard, Link, Table } from "@cloudflare/kumo";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AdminOrderRow } from "../../../shared/api/adminOverview";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { formatDate, formatMoney, orderStatusCode } from "../../../shared/utils/format";

import { Link as RouterLink } from "react-router-dom";
import { adminBase } from "../../../shared/utils/adminEntry";

function OrderLink({href, children}: {href: string; children: ReactNode}) {
  return <Link variant="current" href={href} render={<RouterLink to={href} />}>{children}</Link>;
}

const columns = [
  { key: "orderNo", label: "订单号", width: 220, min: 140 },
  { key: "customer", label: "用户(公司)", width: 170, min: 120 },
  { key: "product", label: "商品名称", width: 240, min: 140 },
  { key: "amount", label: "订单金额", width: 130, min: 100 },
  { key: "payment", label: "支付方式", width: 130, min: 100 },
  { key: "created", label: "下单时间", width: 180, min: 140 },
  { key: "status", label: "订单状态", width: 120, min: 100 },
  { key: "actions", label: "操作", width: 100, min: 80 },
] as const;
const minShare = 0.05;
const normalize = (values: number[]) => {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map(value => value / total);
};
const defaults = normalize(columns.map(column => column.width));
function readWidths(key: string, legacyKey: string) {
  try {
    const raw = localStorage.getItem(key);
    const saved: unknown = JSON.parse(raw ?? localStorage.getItem(legacyKey) ?? "null");
    if (!saved || typeof saved !== "object") return defaults;
    const values = columns.map(column => (saved as Record<string, unknown>)[column.key]);
    if (!values.every((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 800)) return defaults;
    const shares = normalize(values);
    if (shares.every(value => value >= minShare - 1e-9)) return shares;
    if (raw) return defaults;
    // Convert legacy pixel widths into proportions while reserving a minimum for every column.
    return shares.map(value => minShare + value * (1 - columns.length * minShare));
  } catch { return defaults; }
}

export function AdminOrdersTable({ rows, adminId }: { rows: AdminOrderRow[]; adminId: string }) {
  const storageKey = `ddyidc-admin-order-column-shares:v2:${adminId}`;
  const [widths, setWidths] = useState<number[]>(() => readWidths(storageKey, `ddyidc-admin-order-column-widths:v1:${adminId}`));
  const drag = useRef<{ index: number; x: number; width: number; tableWidth: number } | null>(null);
  const [resizing, setResizing] = useState(false);
  useEffect(() => {
    if (resizing) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(columns.map((column, index) => [column.key, widths[index]]))));
    } catch { /* Resizing still works when browser storage is unavailable. */ }
  }, [widths, storageKey, resizing]);
  const resize = (index: number, value: number) => setWidths(current => {
    const left = current[index];
    const right = current[index + 1];
    if (left === undefined || right === undefined) return current;
    const pair = left + right;
    const next = Math.max(minShare, Math.min(pair - minShare, value));
    return current.map((width, i) => i === index ? next : i === index + 1 ? pair - next : width);
  });
  const resetPair = (index: number) => {
    const pair = (widths[index] ?? 0) + (widths[index + 1] ?? 0);
    const defaultLeft = defaults[index] ?? minShare;
    resize(index, pair * defaultLeft / (defaultLeft + (defaults[index + 1] ?? minShare)));
  };
  const finishResize = () => { drag.current = null; setResizing(false); };
  return <LayerCard className="min-w-0 overflow-x-auto p-0">
    <Table aria-label="订单列表" layout="fixed" className="w-full">
      <colgroup>{columns.map((column, index) => <col key={column.key} style={{ width: `${(widths[index] ?? 0) * 100}%` }} />)}</colgroup>
      <Table.Header variant="compact"><Table.Row>{columns.map((column, index) => (
        <Table.Head key={column.key} className="group relative select-none pr-4 [&_button]:visible">
          {column.label}
          {index < columns.length - 1 && <><span id={`order-resize-${column.key}`} className="sr-only">调整{column.label}列宽</span>
          <Table.ResizeHandle aria-labelledby={`order-resize-${column.key}`} title={`拖拽调整相邻两列占比；方向键微调，双击恢复默认比例`}
            onPointerDown={event => {
              if (event.button !== 0) return;
              event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { index, x: event.clientX, width: widths[index] ?? minShare, tableWidth: event.currentTarget.closest("table")?.getBoundingClientRect().width ?? 1 }; setResizing(true);
            }}
            onPointerMove={event => {
              const start = drag.current;
              if (start && start.index === index) resize(index, start.width + (event.clientX - start.x) / start.tableWidth);
            }}
            onPointerUp={finishResize} onPointerCancel={finishResize} onLostPointerCapture={finishResize}
            onDoubleClick={() => resetPair(index)}
            onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              if (event.key === "Home") resetPair(index);
              else resize(index, event.key === "End" ? 1 : (widths[index] ?? minShare) + (event.key === "ArrowRight" ? 0.01 : -0.01));
            }}
          /></>}
        </Table.Head>
      ))}</Table.Row></Table.Header>
      <Table.Body>{rows.map(order => <Table.Row key={order.id}>
        <Table.Cell className="whitespace-normal break-all">{<AdminTableCopyText value={order.orderNo} label="订单号"><OrderLink href={`${adminBase}/orders/${encodeURIComponent(order.id)}`}>{order.orderNo}</OrderLink></AdminTableCopyText>}</Table.Cell>
        <Table.Cell className="whitespace-normal break-all">{order.customerId && order.customerId !== "0" ? <AdminTableCopyText value={order.customerId} label="用户 ID"><OrderLink href={`${adminBase}/customers/${encodeURIComponent(order.customerId)}/profile`}>{order.customerDisplayName || order.customerId}</OrderLink></AdminTableCopyText> : order.customerDisplayName || "—"}</Table.Cell>
        <Table.Cell className="whitespace-normal break-all">{order.instances?.length ? <div className="grid gap-1">{order.instances.map(instance => <OrderLink key={instance.id} href={`${adminBase}/customers/${encodeURIComponent(instance.customerId)}/instances/${encodeURIComponent(instance.id)}`}>{instance.name || order.productName || "未命名商品"}{order.instances!.length > 1 ? ` · #${instance.id}` : ""}</OrderLink>)}</div> : <span title="尚无当前客户名下的机器关联">{order.productName || "未命名商品"}<span className="block text-kumo-subtle">暂无关联机器</span></span>}</Table.Cell>
        <Table.Cell>{formatMoney(order.payAmount)}</Table.Cell>
        <Table.Cell>{order.payType === 1 ? <Badge variant="blue">支付宝</Badge> : order.payType === 2 ? <Badge variant="green">微信</Badge> : order.payType === 3 ? <Badge variant="warning">余额支付</Badge> : order.payType ? <Badge variant="neutral">其他支付方式</Badge> : "—"}</Table.Cell>
        <Table.Cell className="whitespace-normal">{formatDate(order.createdAt)}</Table.Cell>
        <Table.Cell><StatusBadge status={orderStatusCode(order.status)} /></Table.Cell>
        <Table.Cell><OrderLink href={`${adminBase}/orders/${encodeURIComponent(order.id)}`}>详情</OrderLink></Table.Cell>
      </Table.Row>)}</Table.Body>
    </Table>
  </LayerCard>;
}
