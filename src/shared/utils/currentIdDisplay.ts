/** Display-only migration identifiers. Database keys and request payloads are unchanged. */
export function currentIdDisplay(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(currentIdDisplay);
  if (!value || typeof value !== "object") return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(source)) {
    if (typeof item === "string" && /^V10-\d+$/i.test(item) && ["name", "number", "orderNo", "instanceNo", "instanceNumber", "orderNumber"].includes(key)) {
      const candidate = key.toLowerCase().includes("order") ? source.orderId || source.id : source.instanceId || source.id;
      result[key] = typeof candidate === "string" && /^\d+$/.test(candidate) && candidate !== "0" ? candidate : "—";
    } else result[key] = currentIdDisplay(item);
  }
  return result;
}