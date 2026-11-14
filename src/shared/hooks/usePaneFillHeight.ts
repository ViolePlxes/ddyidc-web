import { useLayoutEffect, type RefObject } from "react";

/**
 * Size a page block so it fills the dashboard pane exactly, leaving room for
 * the platform footer below it. The block then owns its own inner scroll area,
 * which lets a fixed action bar sit in its own row instead of floating over the
 * content while the pane scrolls.
 */
export function usePaneFillHeight(host: RefObject<HTMLElement | null>, resetKey = "") {
  useLayoutEffect(() => {
    const pane = document.querySelector<HTMLElement>("[data-dashboard-scroll]");
    const node = host.current;
    if (!pane || !node) return;
    const measure = () => {
      const target = host.current;
      if (!target) return;
      const paneRect = pane.getBoundingClientRect();
      const top = target.getBoundingClientRect().top - paneRect.top + pane.scrollTop;
      let bottomPadding = 0;
      for (let parent: HTMLElement | null = target.parentElement; parent && bottomPadding === 0; parent = parent.parentElement) {
        bottomPadding = Number.parseFloat(getComputedStyle(parent).paddingBottom || "0") || 0;
      }
      const footer = document.querySelector<HTMLElement>('[aria-label="平台页脚"]');
      // A page can pull its own bottom edge into the pane padding with a
      // negative margin; only the space that is still left has to be reserved.
      const marginBottom = Number.parseFloat(getComputedStyle(target).marginBottom || "0") || 0;
      const reserved = Math.max(0, bottomPadding + marginBottom);
      const height = pane.clientHeight - top - (footer?.getBoundingClientRect().height ?? 0) - reserved;
      target.style.height = `${Math.max(0, Math.floor(height))}px`;
    };
    measure();
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(pane);
    // The loading line above the page, the footer and the surrounding grid can
    // all change height without resizing the pane.
    if (node.parentElement) observer.observe(node.parentElement);
    const footer = document.querySelector<HTMLElement>('[aria-label="平台页脚"]');
    if (footer) observer.observe(footer);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [host, resetKey]);
}
