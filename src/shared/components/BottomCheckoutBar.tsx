import { LayerDialog } from "@cloudflare/kumo";
import type { ReactNode } from "react";
import { catalogContentWidth } from "../utils/productCatalog";

/**
 * Order checkout bar. It is the single bottom-bar implementation for the order
 * page: always visible at the bottom of the content pane. The bar itself is the
 * portal host owned by `ProductConfig`, so the amount, the purchase gate, the
 * quantity control and the cart/checkout handlers stay in one place.
 *
 * `inline` sits in the order page's own layout row (the page scrolls its
 * content above it). `sticky` is the fallback used by the product detail page,
 * which still scrolls as a whole. Passing `onDetail` adds the detail drawer used
 * by the product detail page; the order page shows its bill in a popover
 * instead.
 */
export function BottomCheckoutBar({
  onBar,
  placeholder,
  variant = "sticky",
  open = false,
  onOpenChange,
  onDetail,
}: {
  onBar: (node: HTMLDivElement | null) => void;
  /** Placeholder shown while no configuration is loaded yet. */
  placeholder?: ReactNode;
  variant?: "sticky" | "inline";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onDetail?: (node: HTMLDivElement | null) => void;
}) {
  return (
    <>
      <div
        data-checkout-bar
        className={`${variant === "inline" ? "shrink-0 px-4 md:px-6 lg:px-8" : "sticky bottom-0 z-30 -mx-4 md:-mx-6 lg:-mx-8"} border-t border-kumo-line bg-kumo-base`}
      >
        <div className={`mx-auto w-full ${catalogContentWidth} ${variant === "inline" ? "" : "px-4 md:px-6 lg:px-8"}`}>
          <div className="py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:py-2.5 md:pb-2.5">
            <div aria-label="当前应付" ref={onBar} />
            {placeholder}
          </div>
        </div>
      </div>
      {onDetail ? (
        <LayerDialog.Root open={open} onOpenChange={onOpenChange}>
          <LayerDialog.Content>
            <LayerDialog.Title>费用明细</LayerDialog.Title>
            <LayerDialog.Description>规格、配置与周期以提交时校验结果为准。</LayerDialog.Description>
            <LayerDialog.Body>
              <div className="grid max-h-[60vh] gap-4 overflow-y-auto" ref={onDetail} />
            </LayerDialog.Body>
          </LayerDialog.Content>
        </LayerDialog.Root>
      ) : null}
    </>
  );
}
