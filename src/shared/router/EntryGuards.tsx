import { useEffect, useState } from "react";
import { Button, LayerCard } from "@cloudflare/kumo";
import { LockKeyIcon } from "@phosphor-icons/react";
import { Outlet, useLocation } from "react-router-dom";
import { hasForeignSession } from "../api/sessionProbe";
import type { AuthUser, UserRole } from "../types/auth";
import { AppShellSkeleton } from "../components/skeletons";
import { ContentPending } from "../components/ContentFade";

export function SessionBoundary({
  initialized,
  restoreSession,
  clearSession,
  unauthorizedEvent,
  catalogPlaceholder = true,
}: {
  initialized: boolean;
  restoreSession: () => Promise<void>;
  clearSession: () => void;
  unauthorizedEvent: string;
  catalogPlaceholder?: boolean;
}) {
  const location = useLocation();
  useEffect(() => {
    void restoreSession();
    window.addEventListener(unauthorizedEvent, clearSession);
    return () => window.removeEventListener(unauthorizedEvent, clearSession);
  }, [clearSession, restoreSession, unauthorizedEvent]);

  if (!initialized) {
    return catalogPlaceholder && location.pathname === "/console/products" ? <AppShellSkeleton kind="catalog" /> : <ContentPending />;
  }
  return <Outlet />;
}

export function EntryGuard({
  user,
  role,
  loginPath,
  foreignSessionPaths,
}: {
  user: AuthUser | null;
  role: UserRole;
  loginPath: string;
  foreignSessionPaths: string[];
}) {
  const location = useLocation();
  const [foreignSession, setForeignSession] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) return;
    let active = true;
    void hasForeignSession(foreignSessionPaths).then((found) => {
      if (!active) return;
      if (found) {
        setForeignSession(true);
        return;
      }
      const redirect = encodeURIComponent(location.pathname + location.search);
      window.location.replace(`${loginPath}?redirect=${redirect}`);
    });
    return () => {
      active = false;
    };
  }, [foreignSessionPaths, location.pathname, location.search, loginPath, user]);

  if (user && user.role !== role) return <ForbiddenPage loginPath={loginPath} />;
  if (user) return <Outlet />;
  if (foreignSession) return <ForbiddenPage loginPath={loginPath} />;
  return <ContentPending />;
}

export function ForbiddenPage({ loginPath }: { loginPath: string }) {  return (
    <main className="grid min-h-svh place-items-center bg-kumo-recessed p-4">
      <LayerCard className=" grid max-w-md justify-items-center gap-4 p-8 text-center">
        <LockKeyIcon className="size-8 text-kumo-danger" />
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold text-kumo-strong">403 无权限</h1>
          <p className="text-kumo-subtle">当前会话不属于此入口，请使用本端账号登录。</p>
        </div>
        <Button onClick={() => window.location.replace(loginPath)}>
          前往本端登录
        </Button>
      </LayerCard>
    </main>
  );
}

export function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => window.location.replace(to), [to]);
  return null;
}

function canvasSignature() {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(2, 2, 60, 16);
    ctx.fillStyle = "#069";
    ctx.fillText("ddyidc-404", 4, 4);
    return canvas.toDataURL();
  } catch {
    return "";
  }
}

async function browserFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    (navigator.languages ?? []).join(","),
    navigator.platform ?? "",
    String(navigator.hardwareConcurrency ?? ""),
    String((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? ""),
    `${screen.width}x${screen.height}@${window.devicePixelRatio || 1}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? "",
    canvasSignature(),
  ];
  const screenInfo = parts[6] ?? "";
  const localeInfo = `${parts[1] ?? ""} / ${parts[3] ?? ""}`;
  if (!window.crypto?.subtle) return { id: "-", screen: screenInfo, locale: localeInfo };
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts.join("|")));
    const id = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 24);
    return { id, screen: screenInfo, locale: localeInfo };
  } catch {
    return { id: "-", screen: screenInfo, locale: localeInfo };
  }
}

/** A route that does not exist must not look like an authorization failure. */
export function NotFoundPage({ homePath, homeLabel = "控制台" }: { homePath: string; homeLabel?: string; hint?: string }) {
  const location = useLocation();
  const [ip, setIp] = useState("-");
  const [forwarded, setForwarded] = useState("-");
  const [fingerprint, setFingerprint] = useState("-");
  const [screenInfo, setScreenInfo] = useState("-");
  const [localeInfo, setLocaleInfo] = useState("-");

  useEffect(() => {
    let active = true;
    fetch("/_ip", { credentials: "omit", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { ip?: string; forwarded?: string } | null) => {
        if (!active) return;
        setIp(data?.ip ?? "-");
        setForwarded(data?.forwarded || "-");
      })
      .catch(() => { if (active) setIp("-"); });
    void browserFingerprint().then((result) => {
      if (!active) return;
      setFingerprint(result.id);
      setScreenInfo(result.screen);
      setLocaleInfo(result.locale);
    });
    return () => { active = false; };
  }, []);

  return (
    <>
      <center><h1 className="text-2xl font-medium text-kumo-strong">404 Not Found</h1></center>
      <hr />
      <center className="text-sm text-kumo-subtle">nginx</center>
      <center className="text-sm text-kumo-subtle">
        <p>访问 IP：{ip}</p>
        <p>X-Forwarded-For：{forwarded}</p>
        <p>请求地址：{location.pathname + location.search}</p>
        <p>User-Agent：{navigator.userAgent}</p>
        <p>Referer：{document.referrer || "-"}</p>
        <p>浏览器指纹：{fingerprint}</p>
        <p>屏幕 / 时区：{screenInfo}</p>
        <p>语言 / 平台：{localeInfo}</p>
        <p><a href={homePath}>回到{homeLabel}</a></p>
      </center>
    </>
  );
}
