import type { QueryClient } from "@tanstack/react-query";

const signalKey = "ddyidc_catalog_revision";
const localEvent = "ddyidc:catalog-changed";
export async function invalidateCatalog(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ["admin", "product-groups"] }),
    client.invalidateQueries({ queryKey: ["admin", "products"] }),
    client.invalidateQueries({ queryKey: ["products"] }),
    client.invalidateQueries({ queryKey: ["product"] }),
    client.invalidateQueries({ queryKey: ["admin", "upstream-products"] }),
  ]);
}

export function publishCatalogChange() {
  window.dispatchEvent(new Event(localEvent));
  // Only a revision signal crosses independent entry points, never catalogue or session data.
  try { localStorage.setItem(signalKey, crypto.randomUUID()); } catch { /* Local event still works. */ }
}

export function subscribeCatalogChanges(client: QueryClient) {
  const refresh = () => { void invalidateCatalog(client); };
  const storage = (event: StorageEvent) => { if (event.key === signalKey) refresh(); };
  window.addEventListener(localEvent, refresh);
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(localEvent, refresh); window.removeEventListener("storage", storage); };
}
