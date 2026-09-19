/** Normalize customer-facing display fields only; never rewrite protocol values or keys. */
export function neutralCustomerText(text: string): string {
  return text.replace(/上游供应商/g, '平台').replace(/上游/g, '资源').replace(/供应商/g, '平台').replace(/金山云/g, '平台');
}
const displayFields = new Set(['message', 'warning', 'description', 'title', 'label', 'name', 'displayName', 'displayValue', 'productName', 'groupName', 'note', 'reason', 'remark', 'lastError', 'setupMessage', 'capability']);
export function neutralCustomerResponse<T>(data: T): T {
  if (Array.isArray(data)) return data.map(item => neutralCustomerResponse(item)) as T;
  if (data && typeof data === 'object' && (Object.getPrototypeOf(data) === Object.prototype || Object.getPrototypeOf(data) === null)) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key,
      typeof value === 'string' && displayFields.has(key) ? neutralCustomerText(value) :
      value && typeof value === 'object' ? neutralCustomerResponse(value) : value,
    ])) as T;
  }
  return data;
}