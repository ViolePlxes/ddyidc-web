import { TableOfContents, useTableOfContentsActiveId } from "@cloudflare/kumo";
import { useEffect, useState } from "react";

export interface ProductStep { id: string; title: string }

export function ProductSteps({ steps }: { steps: ProductStep[] }) {
  const [root, setRoot] = useState<Element | null>(null);
  useEffect(() => setRoot(document.querySelector("[data-dashboard-scroll]")), []);
  const { activeId, selectSection } = useTableOfContentsActiveId({ ids: steps.map((step) => step.id), root, offset: 16, trackHash: false });
  return (
    <TableOfContents aria-label="订购步骤">
      <TableOfContents.Title>订购步骤</TableOfContents.Title>
      <TableOfContents.List>{steps.map((step, index) => <TableOfContents.Item
        key={step.id} href={`#${step.id}`} active={activeId === step.id}
        onClick={(event) => {
          event.preventDefault();
          selectSection(step.id);
          const target = document.getElementById(step.id);
          if (!target) return;
          const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
          // Scroll only the dashboard pane, not its surrounding app shell.
          if (root) root.scrollTo({ top: root.scrollTop + target.getBoundingClientRect().top - root.getBoundingClientRect().top - 16, behavior });
          else target.scrollIntoView({ behavior, block: "start" });
        }}
      >{index + 1}. {step.title}</TableOfContents.Item>)}</TableOfContents.List>
    </TableOfContents>
  );
}
