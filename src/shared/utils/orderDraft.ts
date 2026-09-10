import type { OrderDraft } from "../api/console";

const orderDraftKey = "ddyidc_order_draft";

export function saveOrderDraft(draft: OrderDraft) {
  sessionStorage.setItem(orderDraftKey, JSON.stringify(draft));
}

export function loadOrderDraft(): OrderDraft | null {
  const raw = sessionStorage.getItem(orderDraftKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OrderDraft;
  } catch {
    sessionStorage.removeItem(orderDraftKey);
    return null;
  }
}

export function clearOrderDraft() {
  sessionStorage.removeItem(orderDraftKey);
}
