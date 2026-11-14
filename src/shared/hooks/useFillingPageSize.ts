import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { fillingRowCount } from "../utils/fillingPageSize";

/**
 * Rows that fill the dashboard pane below `host` without the pane itself
 * having to scroll. Extracted from the destroy page so the order page and the
 * destroy page share one measured implementation.
 *
 * The available height is measured in content space (rect + scrollTop), so the
 * count does not change while the user scrolls the pane.
 */
export interface FillingPageSizeOptions {
  /** Element whose top edge starts the measured region (table or card list). */
  host: RefObject<HTMLElement | null>;
  /** Re-measure when the layout changes (breakpoint, category, tab). */
  resetKey?: string;
  /** Re-measure when the data behind the rows changes. */
  dataKey?: string;
  /** Elements stacked between the host and the pane bottom (pagination, fixed bar). */
  reserveSelectors?: readonly string[];
  /** Extra pixels reserved below the host (gaps, safety margin). */
  reserve?: number;
  /** Reserve the platform footer and the page's bottom padding (default true). */
  reserveChrome?: boolean;
  /** Header row selector; its height is subtracted from the first row. */
  headSelector?: string;
  /** Repeatable row selector. */
  rowSelector?: string;
  /** Gap between rows when they are not table rows. */
  rowGap?: number;
  minRows?: number;
  maxRows?: number;
}

const SCROLL_PANE = "[data-dashboard-scroll]";
const PAGE_FOOTER = '[aria-label="平台页脚"]';
const SAFETY = 8;
const DEFAULT_ROW = 48;
const DEFAULT_HEAD = 44;

export function useFillingPageSize(options: FillingPageSizeOptions) {
  const [perPage, setPerPage] = useState(10);
  const latest = useRef(options);
  latest.current = options;
  const selectorsKey = (options.reserveSelectors ?? []).join("|");

  useLayoutEffect(() => {
    const pane = document.querySelector<HTMLElement>(SCROLL_PANE);
    if (!pane) return;
    const measure = () => {
      const {
        host,
        reserveSelectors = [],
        reserve = 0,
        reserveChrome = true,
        headSelector,
        rowSelector = "tbody tr",
        rowGap = 0,
        minRows = 3,
        maxRows = 50,
      } = latest.current;
      const node = host.current;
      if (!node) return;
      const paneRect = pane.getBoundingClientRect();
      const nodeTop = node.getBoundingClientRect().top - paneRect.top + pane.scrollTop;
      let limit = pane.clientHeight;
      if (reserveChrome) {
        limit -= document.querySelector<HTMLElement>(PAGE_FOOTER)?.getBoundingClientRect().height ?? 0;
        let bottomPadding = 0;
        for (let parent: HTMLElement | null = node.parentElement; parent && bottomPadding === 0; parent = parent.parentElement) {
          bottomPadding = Number.parseFloat(getComputedStyle(parent).paddingBottom || "0") || 0;
        }
        limit -= bottomPadding;
      }
      let reserved = reserve + SAFETY;
      for (const selector of reserveSelectors) {
        reserved += document.querySelector<HTMLElement>(selector)?.getBoundingClientRect().height ?? 0;
      }
      const headHeight = headSelector
        ? node.querySelector<HTMLElement>(headSelector)?.getBoundingClientRect().height ?? DEFAULT_HEAD
        : 0;
      const rows = node.querySelectorAll<HTMLElement>(rowSelector);
      const rowHeight = rows.length > 1
        ? rows[1]!.getBoundingClientRect().top - rows[0]!.getBoundingClientRect().top
        : (rows[0]?.getBoundingClientRect().height ?? DEFAULT_ROW) + rowGap;
      setPerPage(fillingRowCount(limit - nodeTop - reserved, headHeight, Math.max(28, rowHeight), minRows, maxRows));
    };
    measure();
    // Second pass once the first render has real row heights instead of skeletons.
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    if (latest.current.host.current) observer.observe(latest.current.host.current);
    for (const selector of latest.current.reserveSelectors ?? []) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) observer.observe(element);
    }
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [options.host, options.resetKey, options.dataKey, selectorsKey]);

  return perPage;
}
