import "../shared/hooks/useTheme";
import "../styles/tailwind.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@cloudflare/kumo";
import { PublicPortalApp } from "../apps/portal/PublicPortalApp";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
});
const root = document.getElementById("root");
if (!root) throw new Error("缺少应用挂载节点");

if (!window.__ddyBrowserGuard || window.__ddyBrowserGuard.checkStyles()) {
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider><PublicPortalApp /></TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
window.__ddyBrowserGuard?.ready();
}
