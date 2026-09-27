import type { OrderDraft } from "../api/console";
import { generatePassword } from "./credentials";

type StoredDraft<T extends OrderDraft> = Omit<T, "password"> & { requiresPassword: boolean };

export function redactDraft<T extends OrderDraft>(draft: T): StoredDraft<T> {
  const { password, ...rest } = draft;
  return { ...rest, requiresPassword: Boolean(password) };
}

export function restoreDraft<T extends OrderDraft>(stored: StoredDraft<T> & { password?: string }): Omit<T, "password"> & Pick<OrderDraft, "password"> {
  // Legacy plaintext is never reused. The next storage write removes it.
  return { ...stored, password: stored.requiresPassword || Boolean(stored.password) ? generatePassword() : "" };
}
