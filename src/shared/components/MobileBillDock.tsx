import { LayerDialog } from "@cloudflare/kumo";

/**
 * Mobile order dock: a fixed bottom bar plus the detail dialog. Both containers
 * are portal hosts, so `ProductConfig` keeps owning the amount, the purchase
 * gate and the cart/checkout handlers — nothing is recomputed here.
 */
export function MobileBillDock({
  open,
  onOpenChange,
  onBar,
  onDetail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBar: (node: HTMLDivElement | null) => void;
  onDetail: (node: HTMLDivElement | null) => void;
}) {
  return (
    <>
      <div
        aria-label="当前应付"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-kumo-line bg-kumo-base px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] xl:hidden"
      >
        <div className="mx-auto grid max-w-3xl"><div ref={onBar} /></div>
      </div>
      <LayerDialog.Root open={open} onOpenChange={onOpenChange}>
        <LayerDialog.Content>
          <LayerDialog.Title>费用明细</LayerDialog.Title>
          <LayerDialog.Description>规格、配置与周期以提交时校验结果为准。</LayerDialog.Description>
          <LayerDialog.Body>
            <div className="grid max-h-[60vh] gap-4 overflow-y-auto" ref={onDetail} />
          </LayerDialog.Body>
        </LayerDialog.Content>
      </LayerDialog.Root>
    </>
  );
}
