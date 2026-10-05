import { Loader } from "@cloudflare/kumo";
import { type ReactNode } from "react";

/** Render immediately; individual data regions own their loading state. */
export function ContentFade({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className} data-content-fade="ready">{children}</div>;
}

export function ContentPending() {
  return <div role="status" aria-busy="true" className="flex items-center gap-2 p-4">
    <Loader /><span>正在加载页面…</span>
  </div>;
}
