import { useEffect, useState } from "react";
import { Button, LayerCard } from "@cloudflare/kumo";
import { LockKeyIcon } from "@phosphor-icons/react";
import { Outlet, useLocation } from "react-router-dom";
import { hasForeignSession } from "../api/sessionProbe";
import type { AuthUser, UserRole } from "../types/auth";
import { AppShellSkeleton } from "../components/skeletons";

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
    return catalogPlaceholder && location.pathname === "/console/products" ? <AppShellSkeleton kind="catalog" /> : null;
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
  return null;
}

export function ForbiddenPage({ loginPath }: { loginPath: string }) {
  return (
    <main className="grid min-h-svh place-items-center bg-kumo-recessed p-4">
      <LayerCard className="shadow-none grid max-w-md justify-items-center gap-4 p-8 text-center">
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
