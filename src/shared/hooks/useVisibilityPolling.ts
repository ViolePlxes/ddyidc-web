import { useEffect, useRef } from "react";

export function useVisibilityPolling(callback: () => Promise<void>, intervalMs: number, enabled = true) {
  const pollRef = useRef(callback);
  pollRef.current = callback;

  useEffect(() => {
    if (!enabled) return;
    let timer: number | undefined;
    let disposed = false;
    const schedule = () => {
      window.clearTimeout(timer);
      if (!disposed && document.visibilityState === "visible") {
        timer = window.setTimeout(run, intervalMs);
      }
    };
    const run = async () => {
      if (disposed || document.visibilityState !== "visible") return;
      try { await pollRef.current(); } finally { schedule(); }
    };
    const onVisibilityChange = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    schedule();
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, intervalMs]);
}
