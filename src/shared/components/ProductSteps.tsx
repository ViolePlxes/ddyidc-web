import { TableOfContents, useTableOfContentsActiveId } from "@cloudflare/kumo";
import { useEffect, useRef, useState } from "react";

export interface ProductStep { id: string; title: string }

/** Scroll only the dashboard pane, not the surrounding app shell. */
export function scrollToProductStep(id: string, root: Element | null) {
  const target = document.getElementById(id);
  if (!target) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  if (root) root.scrollTo({ top: root.scrollTop + target.getBoundingClientRect().top - root.getBoundingClientRect().top - 16, behavior });
  else target.scrollIntoView({ behavior, block: "start" });
}

export function ProductSteps({ steps, variant = "list" }: { steps: ProductStep[]; variant?: "list" | "chips" }) {
  const [root, setRoot] = useState<Element | null>(null);
  useEffect(() => setRoot(document.querySelector("[data-dashboard-scroll]")), []);
  const { activeId, selectSection } = useTableOfContentsActiveId({ ids: steps.map((step) => step.id), root, offset: 16, trackHash: false });
  const navRef = useRef<HTMLElement>(null);
  const go = (id: string) => { selectSection(id); scrollToProductStep(id, root); };
  // Keep the active chip visible without touching the page's vertical scroll.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const chip = nav.querySelector<HTMLElement>('[aria-current="step"]');
    if (!chip) return;
    const left = chip.getBoundingClientRect().left - nav.getBoundingClientRect().left + nav.scrollLeft;
    const centered = left - nav.clientWidth / 2 + chip.clientWidth / 2;
    nav.scrollTo({ left: Math.max(0, centered), behavior: "smooth" });
  }, [activeId, variant]);
  // Mobile keeps the same active-section tracking, rendered as a scrollable
  // chip row because the desktop sidebar is hidden below `xl`.
  if (variant === "chips") return (
    <nav ref={navRef} aria-label="订购步骤" className="-mx-1 min-w-0 overflow-x-auto">
      <ol className="flex w-max items-center gap-2 p-1">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              aria-current={activeId === step.id ? "step" : undefined}
              onClick={() => go(step.id)}
              className={`min-h-11 whitespace-nowrap rounded-md border px-3 text-sm transition-colors ${activeId === step.id ? "border-kumo-contrast bg-kumo-tint font-medium text-kumo-strong" : "border-kumo-line bg-kumo-base text-kumo-subtle"}`}
            >{index + 1}. {step.title}</button>
          </li>
        ))}
      </ol>
    </nav>
  );
  return (
    <TableOfContents aria-label="订购步骤">
      <TableOfContents.Title>订购步骤</TableOfContents.Title>
      <TableOfContents.List>{steps.map((step, index) => <TableOfContents.Item
        key={step.id} href={`#${step.id}`} active={activeId === step.id}
        onClick={(event) => { event.preventDefault(); go(step.id); }}
      >{index + 1}. {step.title}</TableOfContents.Item>)}</TableOfContents.List>
    </TableOfContents>
  );
}
