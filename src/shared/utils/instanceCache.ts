import type { QueryClient } from "@tanstack/react-query";

// A paid order creates its instance asynchronously, so every list that shows
// services must drop its cache the moment the payment is confirmed. Without this
// the product list keeps serving a pre-purchase snapshot for its whole stale
// window and the customer believes the purchase failed.
export async function invalidateInstances(client: QueryClient) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ["instances"] }),
    client.invalidateQueries({ queryKey: ["console", "recent-services"] }),
    client.invalidateQueries({ queryKey: ["console-home"] }),
    client.invalidateQueries({ queryKey: ["console", "search"] }),
    client.invalidateQueries({ queryKey: ["admin", "global-instances"] }),
  ]);
}
