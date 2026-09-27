import { Button, LayerCard, Table } from "@cloudflare/kumo";
import { useEffect, useRef, useState } from "react";
import type { AdminOrderRow } from "../../../shared/api/adminOverview";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { formatDate, formatMoney, orderStatusCode } from "../../../shared/utils/format";

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
const maxWidth = 800;
const clamp = (value: number, min: number) => Math.max(min, Math.min(maxWidth, Math.round(value)));
function readWidths(key: string) {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    return columns.map(column => {
      const value = saved && typeof saved === "object" ? (saved as Record<string, unknown>)[column.key] : undefined;
      return typeof value === "number" && Number.isFinite(value) ? clamp(value, column.min) : column.width;
    });
  } catch { return columns.map(column => column.width); }
}

export function AdminOrdersTable({ rows, adminId }: { rows: AdminOrderRow[]; adminId: string }) {
  const storageKey = `ddyidc-admin-order-column-widths:v1:${adminId}`;
  const [widths, setWidths] = useState<number[]>(() => readWidths(storageKey));
  const drag = useRef<{ index: number; x: number; width: number } | null>(null);
  const [resizing, setResizing] = useState(false);
  useEffect(() => {
    if (resizing) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(columns.map((column, index) => [column.key, widths[index]]))));
    } catch { /* Resizing still works when browser storage is unavailable. */ }
  }, [widths, storageKey, resizing]);
  const resize = (index: number, value: number) => setWidths(current => current.map((width, i) => i === index ? clamp(value, columns[i]?.min ?? 80) : width));
  const finishResize = () => { drag.current = null; setResizing(false); };
  return <LayerCard className="shadow-none min-w-0 overflow-x-auto p-0">
    <Table aria-label="订单列表" layout="fixed" style={{ width: widths.reduce((total, width) => total + width, 0) }}>
      <colgroup>{columns.map((column, index) => <col key={column.key} style={{ width: widths[index] }} />)}</colgroup>
      <Table.Header variant="compact"><Table.Row>{columns.map((column, index) => (
        <Table.Head key={column.key} className="group relative select-none pr-4 [&_button]:visible">
          {column.label}
          <span id={`order-resize-${column.key}`} className="sr-only">调整{column.label}列宽</span>
          <Table.ResizeHandle aria-labelledby={`order-resize-${column.key}`} title={`拖拽调整${column.label}列宽；方向键微调，双击恢复默认`}
            onPointerDown={event => {
              if (event.button !== 0) return;
              event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { index, x: event.clientX, width: widths[index] ?? column.width }; setResizing(true);
            }}
            onPointerMove={event => {
              const start = drag.current;
              if (start && start.index === index) resize(index, start.width + event.clientX - start.x);
            }}
            onPointerUp={finishResize} onPointerCancel={finishResize} onLostPointerCapture={finishResize}
            onDoubleClick={() => resize(index, column.width)}
            onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              resize(index, event.key === "Home" ? column.width : event.key === "End" ? maxWidth : (widths[index] ?? column.width) + (event.key === "ArrowRight" ? 10 : -10));
            }}
          />
        </Table.Head>
      ))}</Table.Row></Table.Header>
      <Table.Body>{rows.map(order => <Table.Row key={order.id}>
        <Table.Cell className="whitespace-normal break-all">{order.orderNo}</Table.Cell>
        <Table.Cell className="whitespace-normal break-all">{order.customerDisplayName || order.customerId || "—"}</Table.Cell>
        <Table.Cell className="whitespace-normal break-all">{order.productName || "未命名商品"}</Table.Cell>
        <Table.Cell>{formatMoney(order.payAmount)}</Table.Cell>
        <Table.Cell>{({ 1: "支付宝", 2: "微信支付", 3: "余额支付" } as Record<number, string>)[order.payType] ?? (order.payType ? "其他支付方式" : "—")}</Table.Cell>
        <Table.Cell className="whitespace-normal">{formatDate(order.createdAt)}</Table.Cell>
        <Table.Cell><StatusBadge status={orderStatusCode(order.status)} /></Table.Cell>
        <Table.Cell><Button variant="secondary" size="sm" disabled title="详情功能待开放">详情</Button></Table.Cell>
      </Table.Row>)}</Table.Body>
    </Table>
  </LayerCard>;
}
