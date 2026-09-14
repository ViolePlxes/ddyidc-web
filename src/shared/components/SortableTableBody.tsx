import { Button, Table } from "@cloudflare/kumo";
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useSortableList, type ListDrop } from "../hooks/useSortableList";

export function DragHandle({ label, disabled, scope }: { label: string; disabled: boolean; scope: string }) {
  return <Button className={`drag-handle-${scope} touch-none`} variant="ghost" shape="square" icon={<DotsSixVerticalIcon />} aria-label={label} disabled={disabled} />;
}

export function SortableTableBody({ scope, listId, crossList = false, disabled, onDrop, children }: {
  scope: string; listId: string; crossList?: boolean; disabled: boolean; onDrop: (drop: ListDrop) => void; children: ReactNode;
}) {
  const ref = useSortableList(scope, crossList, disabled, onDrop);
  return <Table.Body ref={ref} data-sort-list={listId}>{children}</Table.Body>;
}
