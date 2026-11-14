import { Breadcrumbs, useKumoToastManager, useTableOfContentsActiveId } from "@cloudflare/kumo";
import { useEffect, useRef, useState } from "react";
import { orderStepsOffset, scrollToProductStep, type ProductStep } from "./ProductSteps";

/**
 * Order step trail. Kumo `Breadcrumbs` is the only navigation affordance on the
 * order page: the current step is `Breadcrumbs.Current`, every other step is a
 * link that scrolls the dashboard pane, and `Breadcrumbs.Clipboard` copies the
 * pre-submit summary (amount included) with a Kumo toast.
 */
export function OrderStepsBreadcrumbs({ steps, clipboardText }: { steps: ProductStep[]; clipboardText?: string }) {
  const [root, setRoot] = useState<Element | null>(null);
  // The trail itself is sticky, so section jumps have to clear its height.
  const [offset, setOffset] = useState(orderStepsOffset);
  useEffect(() => setRoot(document.querySelector("[data-dashboard-scroll]")), []);
  useEffect(() => setOffset(orderStepsOffset()), [steps.length]);
  const { activeId, selectSection } = useTableOfContentsActiveId({ ids: steps.map((step) => step.id), root, offset, trackHash: false });
  const trailRef = useRef<HTMLDivElement>(null);
  const manualCopyRef = useRef<HTMLTextAreaElement>(null);
  const toast = useKumoToastManager();
  const go = (id: string) => {
    selectSection(id);
    scrollToProductStep(id, root);
  };
  // Keep the current crumb inside the horizontally scrollable trail.
  useEffect(() => {
    const trail = trailRef.current;
    if (!trail) return;
    const current = trail.querySelector<HTMLElement>('[aria-current="page"]');
    if (!current) return;
    const left = current.getBoundingClientRect().left - trail.getBoundingClientRect().left + trail.scrollLeft;
    trail.scrollTo({ left: Math.max(0, left - trail.clientWidth / 2 + current.clientWidth / 2), behavior: "smooth" });
  }, [activeId, steps.length]);
  // Kumo's clipboard button only ships an English title and never reports the
  // outcome, so the copy happens here: Chinese toast on success, and the text is
  // selected for manual copying when the browser withholds clipboard access.
  const copySummary = async () => {
    if (!clipboardText) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(clipboardText);
      toast.add({ title: "已复制订购摘要", description: "含当前应付金额，以提交时校验结果为准。", timeout: 4000 });
    } catch {
      manualCopyRef.current?.select();
      toast.add({ title: "已选中，请手动复制", description: "浏览器未开放剪贴板权限。", timeout: 5000 });
    }
  };
  useEffect(() => {
    const trail = trailRef.current;
    if (!trail) return;
    for (const button of trail.querySelectorAll<HTMLButtonElement>('button[title="Click to copy"]')) {
      button.title = "复制订购摘要";
      button.setAttribute("aria-label", "复制订购摘要");
    }
  }, [clipboardText, steps.length]);
  const currentIndex = Math.max(0, steps.findIndex((step) => step.id === activeId));
  return (
    <div
      ref={trailRef}
      className="min-w-0 overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:none]"
      onClickCapture={(event) => {
        const target = event.target as Element | null;
        if (target?.closest("[data-clipboard]")) {
          event.preventDefault();
          event.stopPropagation();
          void copySummary();
          return;
        }
        const anchor = target?.closest<HTMLAnchorElement>('a[data-kumo-part="link"]');
        if (!anchor) return;
        event.preventDefault();
        event.stopPropagation();
        const id = anchor.getAttribute("href")?.replace(/^#/, "");
        if (id) go(id);
      }}
    >
      <Breadcrumbs
        size="sm"
        className="mr-0 h-auto w-max grow-0 [&>div:first-child]:hidden [&>div:last-child]:contents [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center"
      >
        {steps.flatMap((step, index) => {
          const item = index === currentIndex
            ? <Breadcrumbs.Current key={`current-${step.id}`}>{step.title}</Breadcrumbs.Current>
            : <Breadcrumbs.Link key={`step-${step.id}`} href={`#${step.id}`}>{step.title}</Breadcrumbs.Link>;
          return index ? [<Breadcrumbs.Separator key={`separator-${step.id}`} />, item] : [item];
        })}
        {clipboardText ? (
          <div key="clipboard" data-clipboard className="ml-1 flex shrink-0 items-center [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:opacity-100">
            <Breadcrumbs.Clipboard text={clipboardText} />
          </div>
        ) : null}
      </Breadcrumbs>
      <textarea ref={manualCopyRef} aria-hidden="true" tabIndex={-1} readOnly value={clipboardText ?? ""} className="sr-only" />
    </div>
  );
}
