import { Button } from "@cloudflare/kumo";
import { ArrowsInLineHorizontalIcon, ArrowsOutLineHorizontalIcon } from "@phosphor-icons/react";

export function LayoutWidthToggle({ width, toggleWidth }: {
  width: "centered" | "wide";
  toggleWidth: () => void;
}) {
  const label = width === "wide" ? "切换到居中窄版" : "切换到宽屏平铺";
  return (
    <Button
      variant="ghost"
      shape="square"
      aria-label={label}
      title={label}
      aria-pressed={width === "wide"}
      icon={width === "wide" ? <ArrowsInLineHorizontalIcon /> : <ArrowsOutLineHorizontalIcon />}
      onClick={toggleWidth}
    />
  );
}
