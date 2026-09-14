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
    let animationFrame = 0;
    let dragging = false;
    const hitTest = () => {
      if (dragging) (instance as Sortable & { _emulateDragOver?: () => void })._emulateDragOver?.();
    };
    const release = (event: Event) => {
      if (!dragging) return;
      const point = "changedTouches" in event ? (event as TouchEvent).changedTouches[0] : event as MouseEvent;
      if (point) (instance as Sortable & { _onTouchMove?: (point: { clientX: number; clientY: number; cancelable: false }) => void })
        ._onTouchMove?.({ clientX: point.clientX, clientY: point.clientY, cancelable: false });
      hitTest();
    };
    const instance = new Sortable(element, {
      group: { name: scope, pull: crossList, put: crossList },
      handle: `.drag-handle-${scope}`, draggable: "> .sort-item", dataIdAttr: "data-sort-id",
      animation: 200, easing: "cubic-bezier(0.2, 0, 0, 1)", direction: "vertical",
      forceFallback: true, fallbackOnBody: true, fallbackTolerance: 4,
      ghostClass: "opacity-30", chosenClass: "cursor-grabbing", fallbackClass: "pointer-events-none",
      emptyInsertThreshold: 24,
      onStart: () => {
        dragging = true;
        before = new Map(Array.from(lists).filter(([, group]) => group === scope)
          .map(([list]) => [list, Array.from(list.children)]));
        // SortableJS 1.15.7 polls fallback hit testing every 50ms. Sample it at
        // paint frequency too, so short pointer movements visibly make room.
        // Keep this adapter covered by drag acceptance when upgrading Sortable.
        const animate = () => {
          hitTest();
          animationFrame = requestAnimationFrame(animate);
        };
        animationFrame = requestAnimationFrame(animate);
      },
      onEnd: (event) => {
        dragging = false;
        cancelAnimationFrame(animationFrame);
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
    // Resolve the last pointer position before Sortable calculates drop indices.
    const releaseEvents = ["pointerup", "mouseup", "touchend"] as const;
    releaseEvents.forEach((event) => document.addEventListener(event, release, true));
    sortable.current = instance;
    return () => {
      dragging = false;
      releaseEvents.forEach((event) => document.removeEventListener(event, release, true));
      cancelAnimationFrame(animationFrame); instance.destroy(); lists.delete(element); sortable.current = null;
    };
  }, [element, scope, crossList]);
  useEffect(() => { sortable.current?.option("disabled", disabled); }, [disabled, element]);
  return setElement;
}
