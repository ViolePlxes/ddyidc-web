import { Button, LayerCard, Pagination, Table } from "@cloudflare/kumo";
import { DotsThreeIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useState } from "react";
import { StatusBadge, type StatusCode } from "./StatusBadge";

export interface DataRow {
  id: string;
  primary: string;
  secondary: string;
  amount?: string;
  meta: string;
  status?: StatusCode;
}

export function DataTable({
  rows,
  primaryLabel = "名称",
  secondaryLabel = "编号",
  withPagination = false,
  selectable = false,
  amountLabel = "金额",
  page: controlledPage,
  onPageChange,
  perPage = 10,
  totalCount,
  showActions = true,
}: {
  rows: DataRow[];
  primaryLabel?: string;
  secondaryLabel?: string;
  withPagination?: boolean;
  selectable?: boolean;
  amountLabel?: string;
  page?: number;
  onPageChange?: (page: number) => void;
  perPage?: number;
  totalCount?: number;
  showActions?: boolean;
}) {
  const [internalPage, setInternalPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const page = controlledPage ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;
  const allSelected = rows.length > 0 && selected.length === rows.length;

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((value) => value !== id),
    );
  };

  return (
    <div className="grid gap-3">
      <LayerCard className="shadow-none overflow-x-auto p-0">
        <Table>
          <Table.Header variant="compact">
            <Table.Row>
              {selectable ? (
                <Table.CheckHead
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    setSelected(checked ? rows.map((row) => row.id) : [])
                  }
                  label="选择全部"
                />
              ) : null}
              <Table.Head>{primaryLabel}</Table.Head>
              <Table.Head>{secondaryLabel}</Table.Head>
              <Table.Head>状态 / 信息</Table.Head>
              <Table.Head className="text-right">{amountLabel}</Table.Head>
              {showActions ? <Table.Head className="w-16">
                <span className="sr-only">操作</span>
              </Table.Head> : null}
            </Table.Row>
          </Table.Header>
          <Table.Body data-animate-list>
            {rows.map((row) => (
              <Table.Row
                key={row.id}
                variant={selected.includes(row.id) ? "selected" : "default"}
              >
                {selectable ? (
                  <Table.CheckCell
                    checked={selected.includes(row.id)}
                    onCheckedChange={(checked) => toggleRow(row.id, checked)}
                    label={`选择 ${row.primary}`}
                  />
                ) : null}
                <Table.Cell>
                  <div className="grid gap-0.5">
                    <strong className="font-medium text-kumo-strong">
                      {row.primary}
                    </strong>
                    <span className="text-sm text-kumo-subtle">{row.meta}</span>
                  </div>
                </Table.Cell>
                <Table.Cell className="text-kumo-subtle">
                  {row.secondary}
                </Table.Cell>
                <Table.Cell>
                  {row.status ? <StatusBadge status={row.status} /> : row.meta}
                </Table.Cell>
                <Table.Cell className="text-right font-medium">
                  {row.amount ?? "—"}
                </Table.Cell>
                {showActions ? <Table.Cell>
                  <Button
                    variant="ghost"
                    shape="square"
                    size="sm"
                    icon={<DotsThreeIcon />}
                    aria-label={`打开 ${row.primary} 操作`}
                  />
                </Table.Cell> : null}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </LayerCard>
      {withPagination ? (
        <Pagination
          page={page}
          setPage={setPage}
          perPage={perPage}
          totalCount={totalCount ?? rows.length}
        />
      ) : null}
    </div>
  );
}

export function DefinitionList({
  rows,
}: {
  rows: { label: string; value: ReactNode }[];
}) {
  return (
    <dl className="divide-y divide-kumo-line">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]"
        >
          <dt className="text-sm text-kumo-subtle">{row.label}</dt>
          <dd className="text-base text-kumo-strong">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
