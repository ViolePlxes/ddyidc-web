import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { sendVisitBeacon } from "../api/visitAnalytics";

/** Routes that must never become analytics page views. */
function trackable(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("/assets/") || path.startsWith("/portal-media/")) return false;
  if (path.startsWith("/api/") || path.startsWith("/admin/v1/")) return false;
  return true;
}

/**
 * Sends one beacon per client-side route change. The Go backend derives the
 * identity, client, address digest and region; this component only describes
 * the page the visitor is looking at.
 */
export function VisitBeacon() {
  const location = useLocation();
  const sent = useRef("");

  useEffect(() => {
    const path = location.pathname;
    if (!trackable(path)) return;
    const signature = `${path}?${location.search}`;
    // React StrictMode runs effects twice; a repeated signature is one visit.
    if (sent.current === signature) return;
    sent.current = signature;
    const timer = window.setTimeout(() => {
      const utm = new URLSearchParams(location.search).get("utm_source") ?? "";
      sendVisitBeacon({ path, referrer: document.referrer, title: document.title, utm });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search, location.key]);

  return null;
}
