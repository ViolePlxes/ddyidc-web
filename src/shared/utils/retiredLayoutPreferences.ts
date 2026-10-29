// Remove obsolete per-account layout preferences without touching other settings.
export function clearRetiredLayoutPreferences(storage: Storage): void {
  try {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith("ddyidc-layout-width:")) keys.push(key);
    }
    for (const key of keys) storage.removeItem(key);
  } catch {
    // Restricted storage must not prevent the application from starting.
  }
}
try { clearRetiredLayoutPreferences(window.localStorage); } catch { /* Storage unavailable. */ }
