import { InlineCopyText } from "@cloudflare/kumo";
import type { ReactNode } from "react";

/** Admin tables only: keep navigation and clipboard actions as siblings. */
export function AdminTableCopyText({value,label,children}:{value?:string|null;label:string;children?:ReactNode}) {
  if (!value || value === "—") return <>{children ?? "—"}</>;
  const labels={copyAction:`复制${label}`,copied:"已复制"};
  if(children!==undefined)return <span className="group inline-flex min-w-0 max-w-full items-center gap-1">
    {children}<InlineCopyText className="w-fit leading-[normal]" value={value} labels={labels}><span className="sr-only">复制{label}</span></InlineCopyText>
  </span>;
  return <InlineCopyText className="w-fit leading-[normal]" value={value} labels={labels}>{value}</InlineCopyText>;
}
