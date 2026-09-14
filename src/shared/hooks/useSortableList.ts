import { useEffect, useRef, useState } from "react";
import Sortable from "sortablejs";

export interface ListDrop {
  id: string;
  source: string;
  target: string;
  sourceIds: string[];
  targetIds: string[];
}

const lists = new Map<HTMLElement, string>();
const ids = (element: HTMLElement) => Array.from(element.children)
  .map((child) => (child as HTMLElement).dataset.sortId).filter((id): id is string => Boolean(id));

// Sortable temporarily moves DOM nodes; restore React's original DOM before
// submitting. The API result is the only authority that changes rendered order.
export function useSortableList(scope: string, crossList: boolean, disabled: boolean, onDrop: (drop: ListDrop) => void) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const callback = useRef(onDrop);
  callback.current = onDrop;
  const sortable = useRef<Sortable | null>(null);
  useEffect(() => {
    if (!element) return;
    lists.set(element, scope);
    let before = new Map<HTMLElement, Element[]>();
    const instance = new Sortable(element, {
      group: { name: scope, pull: crossList, put: crossList },
      handle: `.drag-handle-${scope}`, draggable: ".sort-item", dataIdAttr: "data-sort-id",
      animation: 0, emptyInsertThreshold: 24,
      onStart: () => {
        before = new Map(Array.from(lists).filter(([, group]) => group === scope)
          .map(([list]) => [list, Array.from(list.children)]));
      },
      onEnd: (event) => {
        const drop: ListDrop = {
          id: event.item.dataset.sortId ?? "", source: event.from.dataset.sortList ?? "",
          target: event.to.dataset.sortList ?? "", sourceIds: ids(event.from), targetIds: ids(event.to),
        };
        for (const list of new Set([event.from, event.to])) {
          for (const child of before.get(list) ?? []) list.appendChild(child);
        }
        before.clear();
        if (event.from !== event.to || event.oldDraggableIndex !== event.newDraggableIndex) callback.current(drop);
      },
    });
    sortable.current = instance;
    return () => { instance.destroy(); lists.delete(element); sortable.current = null; };
  }, [element, scope, crossList]);
  useEffect(() => { sortable.current?.option("disabled", disabled); }, [disabled, element]);
  return setElement;
}
