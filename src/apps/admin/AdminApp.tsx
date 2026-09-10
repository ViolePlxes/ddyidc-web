import {
  BuildingsIcon,
  ChatCenteredTextIcon,
  CloudArrowDownIcon,
  CloudCheckIcon,
  GearIcon,
  HouseIcon,
  IdentificationCardIcon,
  MegaphoneIcon,
  PackageIcon,
  PercentIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@phosphor-icons/react";
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
import { useAdminAuthStore } from "../../shared/stores/staffAuth";
import { LazyRoute } from "../../shared/router/LazyRoute";
import { routeModules } from "../../shared/router/routeModules";

const AdminCustomers = lazy(() => routeModules.adminCustomers().then((module) => ({ default: module.AdminCustomers })));
const AdminHome = lazy(() => routeModules.adminHome().then((module) => ({ default: module.AdminHome })));
const AdminInvites = lazy(() => routeModules.adminMarketing().then((module) => ({ default: module.AdminInvites })));
const AdminMarketingConfig = lazy(() => routeModules.adminMarketing().then((module) => ({ default: module.AdminMarketingConfig })));
const AdminRewards = lazy(() => routeModules.adminMarketing().then((module) => ({ default: module.AdminRewards })));
const AdminSales = lazy(() => routeModules.adminMarketing().then((module) => ({ default: module.AdminSales })));
const AdminOrders = lazy(() => routeModules.adminOrders().then((module) => ({ default: module.AdminOrders })));
const AdminProducts = lazy(() => routeModules.adminProducts().then((module) => ({ default: module.AdminProducts })));
const AdminSystem = lazy(() => routeModules.adminSystem().then((module) => ({ default: module.AdminSystem })));
const UpstreamOrders = lazy(() => routeModules.adminUpstreamOrders().then((module) => ({ default: module.UpstreamOrders })));
const UpstreamProducts = lazy(() => routeModules.adminUpstreamProducts().then((module) => ({ default: module.UpstreamProducts })));
const UpstreamSuppliers = lazy(() => routeModules.adminSuppliers().then((module) => ({ default: module.UpstreamSuppliers })));
const AdminTicketList = lazy(() => routeModules.adminTickets().then((module) => ({ default: module.AdminTicketList })));
const AdminTicketDetail = lazy(() => routeModules.adminTickets().then((module) => ({ default: module.AdminTicketDetail })));
const TicketTypes = lazy(() => routeModules.adminTicketConfig().then((module) => ({ default: module.TicketTypes })));
const TicketStatuses = lazy(() => routeModules.adminTicketConfig().then((module) => ({ default: module.TicketStatuses })));
const TicketPrereplies = lazy(() => routeModules.adminTicketConfig().then((module) => ({ default: module.TicketPrereplies })));

const foreignSessions = [
  "/api/v1/auth/me",
  "/admin/v1/sales/auth/me",
];

const adminGroups: NavigationGroup[] = [
  {
    label: "概览",
    items: [
      { label: "经营概览", href: "/admin", icon: HouseIcon },
      { label: "商品管理", href: "/admin/products", icon: PackageIcon },
      { label: "订单管理", href: "/admin/orders", icon: ReceiptIcon },
      { label: "客户管理", href: "/admin/customers", icon: UsersIcon },
      { label: "系统设置", href: "/admin/system", icon: GearIcon },
    ],
  },
  {
    label: "客户服务",
    items: [
      { label: "工单管理", href: "/admin/tickets", icon: ChatCenteredTextIcon },
      { label: "工单类型", href: "/admin/tickets/types", icon: ChatCenteredTextIcon },
      { label: "工单状态", href: "/admin/tickets/statuses", icon: ChatCenteredTextIcon },
      { label: "预设回复", href: "/admin/tickets/prereplies", icon: ChatCenteredTextIcon },
    ],
  },
  {
    label: "上下游",
    items: [
      { label: "供应商管理", href: "/admin/upstream/suppliers", icon: BuildingsIcon },
      { label: "供应商映射", href: "/admin/upstream/products", icon: CloudArrowDownIcon },
      { label: "上游订单", href: "/admin/upstream/orders", icon: CloudCheckIcon },
    ],
  },
  {
    label: "营销中心",
    items: [
      { label: "邀请码审核", href: "/admin/marketing/invites", icon: IdentificationCardIcon },
      { label: "分销结算", href: "/admin/marketing/rewards", icon: PercentIcon },
      { label: "销售权限", href: "/admin/marketing/sales", icon: MegaphoneIcon },
      { label: "营销配置", href: "/admin/marketing/config", icon: ShieldCheckIcon },
    ],
  },
];

function AdminSessionBoundary() {
  const state = useAdminAuthStore();
  return (
    <SessionBoundary
      initialized={state.initialized}
      restoreSession={state.restoreSession}
      clearSession={state.clearSession}
      unauthorizedEvent="ddyidc:admin-unauthorized"
    />
  );
}

function AdminLogin() {
  const state = useAdminAuthStore();
  return (
    <StaffLogin
      title="管理控制台"
      subtitle="使用管理员凭据登录系统后台。"
      roleLabel="管理员"
      homePath="/admin"
      expectedRole="admin"
      user={state.user}
      loading={state.loading}
      signIn={state.signIn}
    />
  );
}

function AdminGuard() {
  const user = useAdminAuthStore((state) => state.user);
  return (
    <EntryGuard
      user={user}
      role="admin"
      loginPath="/admin/login"
      foreignSessionPaths={foreignSessions}
    />
  );
}

function AdminDashboard() {
  const user = useAdminAuthStore((state) => state.user);
  const signOut = useAdminAuthStore((state) => state.signOut);
  if (!user) return null;
  return (
    <DashboardLayout
      user={user}
      groups={adminGroups}
      signOut={signOut}
      loginPath="/admin/login"
      density="compact"
    />
  );
}

export function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminSessionBoundary />}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route element={<AdminDashboard />}>
            <Route path="/admin" element={<LazyRoute kind="dashboard"><AdminHome /></LazyRoute>} />
            <Route path="/admin/products" element={<LazyRoute kind="table"><AdminProducts /></LazyRoute>} />
            <Route path="/admin/orders" element={<LazyRoute kind="table"><AdminOrders /></LazyRoute>} />
            <Route path="/admin/customers" element={<LazyRoute kind="table"><AdminCustomers /></LazyRoute>} />
            <Route path="/admin/system" element={<LazyRoute kind="form"><AdminSystem /></LazyRoute>} />
            <Route path="/admin/tickets" element={<LazyRoute kind="table"><AdminTicketList /></LazyRoute>} />
            <Route path="/admin/tickets/:id" element={<LazyRoute kind="detail"><AdminTicketDetail /></LazyRoute>} />
            <Route path="/admin/tickets/types" element={<LazyRoute kind="table"><TicketTypes /></LazyRoute>} />
            <Route path="/admin/tickets/statuses" element={<LazyRoute kind="table"><TicketStatuses /></LazyRoute>} />
            <Route path="/admin/tickets/prereplies" element={<LazyRoute kind="table"><TicketPrereplies /></LazyRoute>} />
            <Route path="/admin/upstream/suppliers" element={<LazyRoute kind="table"><UpstreamSuppliers /></LazyRoute>} />
            <Route path="/admin/upstream/products" element={<LazyRoute kind="dashboard"><UpstreamProducts /></LazyRoute>} />
            <Route path="/admin/upstream/orders" element={<LazyRoute kind="table"><UpstreamOrders /></LazyRoute>} />
            <Route path="/admin/marketing/invites" element={<LazyRoute kind="table"><AdminInvites /></LazyRoute>} />
            <Route path="/admin/marketing/rewards" element={<LazyRoute kind="table"><AdminRewards /></LazyRoute>} />
            <Route path="/admin/marketing/sales" element={<LazyRoute kind="table"><AdminSales /></LazyRoute>} />
            <Route path="/admin/marketing/config" element={<LazyRoute kind="form"><AdminMarketingConfig /></LazyRoute>} />
          </Route>
        </Route>
        <Route path="*" element={<ForbiddenPage loginPath="/admin/login" />} />
      </Route>
    </Routes>
  );
}
