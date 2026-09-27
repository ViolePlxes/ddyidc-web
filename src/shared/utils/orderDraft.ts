import type { OrderDraft } from "../api/console";
import { redactDraft, restoreDraft } from "./draftPersistence";

const orderDraftKey = "ddyidc_order_draft";
let currentDraft: OrderDraft | null = null;

export function saveOrderDraft(draft: OrderDraft) {
  currentDraft = draft;
  sessionStorage.setItem(orderDraftKey, JSON.stringify(redactDraft(draft)));
}

export function loadOrderDraft(): OrderDraft | null {
  if (currentDraft) return currentDraft;
  const raw = sessionStorage.getItem(orderDraftKey);
  if (!raw) return null;
  try {
    currentDraft = restoreDraft<OrderDraft>(JSON.parse(raw));
    sessionStorage.setItem(orderDraftKey, JSON.stringify(redactDraft(currentDraft)));
    return currentDraft;
  } catch {
    sessionStorage.removeItem(orderDraftKey);
    return null;
  }
}

export function clearOrderDraft() {
  currentDraft = null;
  sessionStorage.removeItem(orderDraftKey);
}
