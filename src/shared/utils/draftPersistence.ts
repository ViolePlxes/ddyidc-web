import type { OrderDraft } from "../api/console";
import { generatePassword } from "./credentials";

type StoredDraft<T extends OrderDraft> = Omit<T, "password" | "customFields"> & { requiresPassword: boolean };

export function redactDraft<T extends OrderDraft>(draft: T): StoredDraft<T> {
  const { password, customFields: _customFields, ...rest } = draft;
  return { ...rest, requiresPassword: Boolean(password) };
}

export function restoreDraft<T extends OrderDraft>(stored: StoredDraft<T> & { password?: string; customFields?: Record<string,string> }): Omit<T, "password" | "customFields"> & Pick<OrderDraft, "password" | "customFields"> {
  // Legacy plaintext is never reused. The next storage write removes it.
  return Object.assign({}, stored, { customFields:{}, password: stored.requiresPassword || Boolean(stored.password) ? generatePassword() : "" });
}
