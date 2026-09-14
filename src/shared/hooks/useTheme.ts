import { useSyncExternalStore } from "react";

const key = "ddyidc-theme";
const eventName = "ddyidc:theme-change";
type Theme = "light" | "dark";
const system = window.matchMedia("(prefers-color-scheme: dark)");
function preference(): Theme | null {
  try {
    const value = localStorage.getItem(key);
    return value === "dark" || value === "light" ? value : null;
  } catch { return null; }
}
function apply(theme: Theme) {
  document.documentElement.dataset.mode = theme;
  window.dispatchEvent(new Event(eventName));
}
apply(preference() ?? (system.matches ? "dark" : "light"));
system.addEventListener("change", () => {
  if (!preference()) apply(system.matches ? "dark" : "light");
});
window.addEventListener("storage", (event) => {
  if (event.key === key || event.key === null) apply(preference() ?? (system.matches ? "dark" : "light"));
});
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => document.documentElement.dataset.mode as Theme);
  return { theme, toggleTheme: () => {
    const next = theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(key, next); } catch { /* Current tab still works without storage. */ }
    apply(next);
  } };
}
