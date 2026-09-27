import { useSyncExternalStore } from "react";
import type { AuthUser } from "../types/auth";

type LayoutWidth = "centered" | "wide";
const eventName = "ddyidc:layout-width-change";
const memory = new Map<string, LayoutWidth>();

function read(key: string): LayoutWidth {
  const temporary = memory.get(key);
  if (temporary) return temporary;
  try {
    const value = localStorage.getItem(key);
    return value === "wide" ? "wide" : "centered";
  } catch {
    return memory.get(key) ?? "centered";
  }
}

function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(eventName, listener);
    window.removeEventListener("storage", listener);
  };
}

export function useLayoutWidth(user?: AuthUser | null) {
  const key = `ddyidc-layout-width:${user ? `${user.role}:${user.id}` : "guest"}`;
  const width = useSyncExternalStore(subscribe, () => read(key));
  return {
    width,
    containerClassName: width === "wide" ? "w-full" : "mx-auto w-full max-w-7xl",
    toggleWidth: () => {
      const next = read(key) === "wide" ? "centered" : "wide";
      try {
        localStorage.setItem(key, next);
        memory.delete(key);
      } catch {
        // Keep working in this tab when storage is unavailable or full.
        memory.set(key, next);
      }
      window.dispatchEvent(new Event(eventName));
    },
  };
}
