import { ChartLineIcon, UsersIcon } from "@phosphor-icons/react";
import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import {
  DashboardLayout,
  type NavigationGroup,
} from "../../layouts/DashboardLayout";
import { StaffLogin } from "../../shared/components/StaffLogin";
import {
  EntryGuard,
  ForbiddenPage,
  SessionBoundary,
} from "../../shared/router/EntryGuards";
import { useSalesAuthStore } from "../../shared/stores/staffAuth";
import { LazyRoute } from "../../shared/router/LazyRoute";
import { routeModules } from "../../shared/router/routeModules";

const SalesHome = lazy(() => routeModules.salesHome().then((module) => ({ default: module.SalesHome })));

const foreignSessions = ["/api/v1/auth/me", "/admin/v1/auth/me"];
const salesGroups: NavigationGroup[] = [
  {
    label: "销售中心",
    items: [
      { label: "销售工作台", href: "/sales", icon: ChartLineIcon },
      { label: "授权客户", href: "/sales/customers", icon: UsersIcon },
    ],
  },
];

function SalesSessionBoundary() {
  const state = useSalesAuthStore();
  return (
    <SessionBoundary
      initialized={state.initialized}
      restoreSession={state.restoreSession}
      clearSession={state.clearSession}
      unauthorizedEvent="ddyidc:sales-unauthorized"
    />
  );
}

function SalesLogin() {
  const state = useSalesAuthStore();
  return (
    <StaffLogin
      title="销售控制台"
      subtitle="使用销售工号或账号登录。"
      roleLabel="销售"
      homePath="/sales"
      expectedRole="sales"
      user={state.user}
      loading={state.loading}
      signIn={state.signIn}
    />
  );
}

function SalesGuard() {
  const user = useSalesAuthStore((state) => state.user);
  return (
    <EntryGuard
      user={user}
      role="sales"
      loginPath="/sales/login"
      foreignSessionPaths={foreignSessions}
    />
  );
}

function SalesDashboard() {
  const user = useSalesAuthStore((state) => state.user);
  const signOut = useSalesAuthStore((state) => state.signOut);
  if (!user) return null;
  return (
    <DashboardLayout
      user={user}
      groups={salesGroups}
      signOut={signOut}
      loginPath="/sales/login"
      density="compact"
    />
  );
}

export function SalesApp() {
  return (
    <Routes>
      <Route element={<SalesSessionBoundary />}>
        <Route path="/sales/login" element={<SalesLogin />} />
        <Route element={<SalesGuard />}>
          <Route element={<SalesDashboard />}>
            <Route path="/sales" element={<LazyRoute kind="dashboard"><SalesHome /></LazyRoute>} />
            <Route path="/sales/customers" element={<LazyRoute kind="table"><SalesHome /></LazyRoute>} />
          </Route>
        </Route>
        <Route path="*" element={<ForbiddenPage loginPath="/sales/login" />} />
      </Route>
    </Routes>
  );
}
