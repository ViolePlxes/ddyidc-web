import { Tabs as KumoTabs } from "@cloudflare/kumo";
import type { ComponentProps } from "react";

/**
 * Kumo tabs with Chinese labels for the built-in horizontal-overflow controls.
 * Styling, mouse drag and touch scrolling stay entirely Kumo's: give the tabs a
 * width-constrained parent instead of wrapping them in `overflow-x-auto`.
 */
export function Tabs({ labels, ...props }: ComponentProps<typeof KumoTabs>) {
  return (
    <KumoTabs
      {...props}
      labels={{ scrollStart: "向左滚动标签", scrollEnd: "向右滚动标签", ...labels }}
    />
  );
}
