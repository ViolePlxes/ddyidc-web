import { LayerDialog } from "@cloudflare/kumo";
import type { ReactNode } from "react";

/**
 * Order checkout bar. It is the single bottom-bar implementation for the order
 * page: always visible at the bottom of the content pane, and it owns the two
 * detail presentations — an inline panel above the bar on desktop and a
 * `LayerDialog` drawer on phones/tablets.
 *
 * `inline` keeps the bar in the page's own layout row (the order page scrolls
 * its content above it, so nothing passes underneath the bar). `sticky` is the
 * fallback used by the product detail page, which still scrolls as a whole.
 *
 * Both inner containers are portal hosts, so `ProductConfig` keeps owning the
 * amount, the purchase gate, the cart and the checkout handlers. Nothing about
 * pricing, quantity, discounts or fees is recomputed here.
 */
export function BottomCheckoutBar({
  open,
  onOpenChange,
  onBar,
  onDetail,
  desktop,
  placeholder,
  variant = "sticky",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBar: (node: HTMLDivElement | null) => void;
  onDetail: (node: HTMLDivElement | null) => void;
  desktop: boolean;
  /** Placeholder shown while no configuration is loaded yet. */
  placeholder?: ReactNode;
  variant?: "sticky" | "inline";
}) {
  return (
    <>
      <div
        data-checkout-bar
        className={`${variant === "inline" ? "shrink-0 px-4 md:px-6 lg:px-8" : "sticky bottom-0 z-30 -mx-4 md:-mx-6 lg:-mx-8"} border-t border-kumo-line bg-kumo-base`}
      >
        <div className={`mx-auto w-full max-w-7xl ${variant === "inline" ? "" : "px-4 md:px-6 lg:px-8"}`}>
          {desktop && open ? (
            <div className="max-h-[45vh] overflow-y-auto border-b border-kumo-line py-4" data-checkout-detail>
              <div ref={onDetail} />
            </div>
          ) : null}
          <div className="py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:py-2.5 md:pb-2.5">
            <div aria-label="当前应付" ref={onBar} />
            {placeholder}
          </div>
        </div>
      </div>
      {desktop ? null : (
        <LayerDialog.Root open={open} onOpenChange={onOpenChange}>
          <LayerDialog.Content>
            <LayerDialog.Title>费用明细</LayerDialog.Title>
            <LayerDialog.Description>规格、配置与周期以提交时校验结果为准。</LayerDialog.Description>
            <LayerDialog.Body>
              <div className="grid max-h-[60vh] gap-4 overflow-y-auto" ref={onDetail} />
            </LayerDialog.Body>
          </LayerDialog.Content>
        </LayerDialog.Root>
      )}
    </>
  );
}
