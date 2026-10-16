export interface ConnectedProduct { supplierId: string; upstreamProductId: string; productId: string; mode: string }
export class ConnectResultPendingError extends Error {
  constructor() { super("对接结果暂未确认，请稍后刷新目录或再次点击核对结果；确认前不会重复提交。"); this.name = "ConnectResultPendingError"; }
}
interface ConnectOptions<T extends ConnectedProduct> {
  key: string; supplierId: string; upstreamProductId: string;
  list: () => Promise<T[]>; create: () => Promise<T>;
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  uncertain: (error: unknown) => boolean;
  onReconciling?: () => void; wait?: () => Promise<void>;
}
const running = new Map<string, Promise<{ recovered: boolean; existing: boolean }>>();
export function connectWithConfirmation<T extends ConnectedProduct>(options: ConnectOptions<T>) {
  const previous = running.get(options.key);
  if (previous) return previous;
  const task = perform(options).finally(() => { running.delete(options.key); });
  running.set(options.key, task);
  return task;
}
async function perform<T extends ConnectedProduct>(o: ConnectOptions<T>) {
  const valid = (row: T) => row.supplierId === o.supplierId && row.upstreamProductId === o.upstreamProductId && row.mode === "sync" && /^\d+$/.test(row.productId) && row.productId !== "0";
  const pending = o.storage.getItem(o.key) !== null;
  let existing: T[];
  try { existing = (await o.list()).filter(valid); }
  catch (error) { if (pending) throw new ConnectResultPendingError(); throw error; }
  if (existing.length > 1) throw new Error("商品存在多个有效关联，请先核查映射，未重复提交。");
  if (existing.length === 1) { o.storage.removeItem(o.key); return { recovered: pending, existing: true }; }
  if (pending) throw new ConnectResultPendingError();
  // A persisted marker survives a refresh after the browser loses the response.
  // It is a client retry guard, not a replacement for server-side idempotency.
  o.storage.setItem(o.key, "pending");
  try {
    const created = await o.create();
    if (!valid(created)) throw new ConnectResultPendingError();
    o.storage.removeItem(o.key);
    return { recovered: false, existing: false };
  } catch (error) {
    if (!(error instanceof ConnectResultPendingError) && !o.uncertain(error)) { o.storage.removeItem(o.key); throw error; }
    o.onReconciling?.();
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt) await (o.wait?.() ?? new Promise<void>(resolve => setTimeout(resolve, 2000)));
      try {
        const matches = (await o.list()).filter(valid);
        if (matches.length === 1) { o.storage.removeItem(o.key); return { recovered: true, existing: false }; }
        if (matches.length > 1) break;
      } catch { /* An unreadable list is never proof that the write failed. */ }
    }
    throw new ConnectResultPendingError();
  }
}
