import { Button, Radio } from "@cloudflare/kumo";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { Fragment, useState } from "react";
import type { CatalogProduct, ProductSpec } from "../api/console";
import { cycleLabels } from "../utils/format";
import { catalogStock, isCatalogAvailable, isUpstreamProduct } from "../utils/productCatalog";

/**
 * Mobile replacement for the 11-column catalog table and the 10-column spec
 * table: one selectable card per SKU, secondary fields behind "查看参数".
 * Both entry points share this presentation only; pricing, stock precedence and
 * selection state stay with the existing callers.
 */

/** Readable system-family text for a SKU card. */
export function osFamilyText(family?: string) {
  const value = (family || "all").toLowerCase();
  if (value === "windows") return "Windows";
  if (value === "linux") return "Linux";
  return "Windows / Linux";
}

/** Precedence is shared with `catalogStock`; only the wording is mobile-specific. */
export function stockText(stock: number | string | null | undefined) {
  if (stock === null || stock === undefined || stock === "") return "库存：充足";
  const numeric = typeof stock === "number" ? stock : /^\d+$/.test(stock.trim()) ? Number(stock) : null;
  return numeric === null ? `库存：${stock}` : `库存：${numeric} 台`;
}

function SpecCard({
  value,
  title,
  facts,
  price,
  parameters,
  disabled = false,
  disabledReason,
  selected,
}: {
  value: string;
  title: string;
  facts: string[];
  price: string;
  parameters: Array<[string, string]>;
  disabled?: boolean;
  disabledReason?: string;
  selected: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`grid min-w-0 gap-1 overflow-hidden rounded-md border bg-kumo-base transition-colors ${selected ? "border-kumo-contrast" : "border-kumo-line"}${disabled ? " opacity-60" : ""}`}
    >
      <Radio.Item
        value={value}
        disabled={disabled}
        className="w-full min-w-0 px-4 py-3"
        label={
          <span className="grid min-w-0 gap-1">
            <span className="break-words text-base font-medium text-kumo-strong">{title}</span>
            {facts.filter(Boolean).map((fact) => (
              <span key={fact} className="break-words text-sm text-kumo-subtle">{fact}</span>
            ))}
            <span className="text-base font-medium text-kumo-strong">{price}</span>
            {disabled && disabledReason ? <span className="break-words text-sm text-kumo-subtle">{disabledReason}</span> : null}
          </span>
        }
      />
      <div className="grid gap-2 px-4 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 justify-self-start"
          aria-expanded={open}
          icon={open ? <CaretUpIcon /> : <CaretDownIcon />}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "收起参数" : "查看参数"}
        </Button>
        {open ? (
          <dl className="grid grid-cols-[minmax(4.5rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-1 border-t border-kumo-line pt-2 text-sm">
            {parameters.map(([label, content]) => (
              <Fragment key={label}>
                <dt className="text-kumo-subtle">{label}</dt>
                <dd className="min-w-0 break-words text-kumo-strong">{content}</dd>
              </Fragment>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}

/** Catalog SKU cards. `value` must stay the product id used by `selectedProductId`. */
export function MobileCatalogSpecs({
  products,
  value,
  onSelect,
}: {
  products: readonly CatalogProduct[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Radio.Group aria-label="计算规格" value={value} onValueChange={onSelect} className="grid min-w-0 gap-3">
      {products.map((product) => {
        const spec = product.catalogSpec;
        const available = isCatalogAvailable(product);
        const unit = (cycleLabels[product.cycle] ?? "").replace(/付$/, "") || "周期";
        const price = isUpstreamProduct(product) ? product.price : spec?.price ?? product.price;
        const resources = [
          spec?.vcpu ? `${spec.vcpu} vCPU` : "",
          spec?.memory ? spec.memory : "",
          spec?.upstreamBandwidth ? `${spec.upstreamBandwidth} 带宽` : "",
        ].filter(Boolean).join(" · ");
        return (
          <SpecCard
            key={product.id}
            value={product.id}
            selected={product.id === value}
            disabled={!available}
            disabledReason={available ? undefined : "库存不足，暂不可订购"}
            title={spec?.name || product.name}
            facts={[resources, `系统：${osFamilyText(spec?.osFamily)}`, stockText(catalogStock(product))]}
            price={`¥${price.toFixed(2)} / ${unit}`}
            parameters={[
              ["处理器型号", spec?.processorModel || "—"],
              ["主频/睿频", spec?.processorFrequency || "—"],
              ["基础防御", spec?.defense || "—"],
              ["上行带宽", spec?.upstreamBandwidth || "—"],
              ["下行速率", spec?.downstreamRate || "—"],
            ]}
          />
        );
      })}
    </Radio.Group>
  );
}

/** Spec cards for pages that render `ProductConfig` without catalog selection. */
export function MobileProductSpecs({
  specs,
  selectedId,
  onSelect,
  referencePrice,
}: {
  specs: readonly ProductSpec[];
  selectedId: string;
  onSelect: (spec: ProductSpec) => void;
  referencePrice?: number;
}) {
  return (
    <Radio.Group
      aria-label="计算规格"
      value={selectedId}
      onValueChange={(value) => {
        const spec = specs.find((item) => item.id === value);
        if (spec) onSelect(spec);
      }}
      className="grid min-w-0 gap-3"
    >
      {specs.map((spec) => (
        <SpecCard
          key={spec.id}
          value={spec.id}
          selected={spec.id === selectedId}
          title={spec.name}
          facts={[`${spec.vcpu} vCPU · ${spec.memory}`, stockText(spec.stock)]}
          price={`¥${(referencePrice ?? spec.price).toFixed(2)} / 月`}
          parameters={[
            ["处理器型号", spec.processorModel || "—"],
            ["主频/睿频", spec.processorFrequency || "—"],
            ["基础防御", spec.defense || "—"],
            ["上行带宽", spec.upstreamBandwidth || "—"],
            ["下行速率", spec.downstreamRate || "—"],
          ]}
        />
      ))}
    </Radio.Group>
  );
}
