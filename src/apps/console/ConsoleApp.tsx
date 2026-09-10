import {
  BellIcon,
  ChatsCircleIcon,
  CreditCardIcon,
  GiftIcon,
  HouseIcon,
  PackageIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  UserCircleIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import { lazy } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import {
  DashboardLayout,
  type NavigationGroup,
} from "../../layouts/DashboardLayout";
import { PortalLayout } from "../../layouts/PortalLayout";
import {
  EntryGuard,
  ForbiddenPage,
  SessionBoundary,
} from "../../shared/router/EntryGuards";
import { useAuthStore } from "../../shared/stores/auth";
import { LazyRoute } from "../../shared/router/LazyRoute";
import { routeModules } from "../../shared/router/routeModules";

const BindMobile = lazy(() => routeModules.portalPublic().then((module) => ({ default: module.BindMobile })));
const Cart = lazy(() => routeModules.consoleCart().then((module) => ({ default: module.Cart })));
const ComponentsPage = lazy(() => routeModules.consoleComponents().then((module) => ({ default: module.ComponentsPage })));
const Coupons = lazy(() => routeModules.consoleCoupons().then((module) => ({ default: module.Coupons })));
const Finance = lazy(() => routeModules.consoleFinance().then((module) => ({ default: module.Finance })));
const ConsoleHome = lazy(() => routeModules.consoleHome().then((module) => ({ default: module.ConsoleHome })));
const InstanceList = lazy(() => routeModules.consoleInstances().then((module) => ({ default: module.InstanceList })));
const InstanceConsole = lazy(() => routeModules.consoleInstance().then((module) => ({ default: module.InstanceConsole })));
const VncConsole = lazy(() => routeModules.consoleVnc().then((module) => ({ default: module.VncConsole })));
const OrderConfirm = lazy(() => routeModules.consoleOrderConfirm().then((module) => ({ default: module.OrderConfirm })));
const OrderDetail = lazy(() => routeModules.consoleOrderDetail().then((module) => ({ default: module.OrderDetail })));
const OrderList = lazy(() => routeModules.consoleOrders().then((module) => ({ default: module.OrderList })));
const ConsoleProductDetail = lazy(() => routeModules.consoleProductDetail().then((module) => ({ default: module.ConsoleProductDetail })));
const ConsoleProducts = lazy(() => routeModules.consoleProducts().then((module) => ({ default: module.ConsoleProducts })));
const Profile = lazy(() => routeModules.consoleProfile().then((module) => ({ default: module.Profile })));
const Promo = lazy(() => routeModules.consolePromo().then((module) => ({ default: module.Promo })));
const TicketList = lazy(() => routeModules.consoleTickets().then((module) => ({ default: module.TicketList })));
const TicketCreate = lazy(() => routeModules.consoleTickets().then((module) => ({ default: module.TicketCreate })));
const TicketDetailPage = lazy(() => routeModules.consoleTickets().then((module) => ({ default: module.TicketDetailPage })));

const foreignSessions = [
  "/admin/v1/auth/me",
  "/admin/v1/sales/auth/me",
];

const consoleGroups: NavigationGroup[] = [
  {
    label: "概览",
    items: [
      { label: "控制台总览", href: "/console", icon: HouseIcon },
      { label: "订购产品", href: "/console/products", icon: PackageIcon },
    ],
  },
  {
    label: "资源与账单",
    items: [
      { label: "产品列表", href: "/user/productList.htm", icon: UsersIcon },
      { label: "我的订单", href: "/console/orders", icon: ReceiptIcon },
      { label: "财务中心", href: "/console/finance", icon: CreditCardIcon },
      { label: "工单中心", href: "/console/tickets", icon: ChatsCircleIcon },
      { label: "优惠券", href: "/console/coupons", icon: GiftIcon },
    ],
  },
  {
    label: "账户",
    items: [
      { label: "我的推广", href: "/console/promo", icon: BellIcon },
      { label: "个人中心", href: "/console/profile", icon: UserCircleIcon },
      { label: "购物车", href: "/cart", icon: ShoppingCartIcon },
    ],
  },
];

function UserSessionBoundary() {
  const state = useAuthStore();
  return (
    <SessionBoundary
      initialized={state.initialized}
      restoreSession={state.restoreSession}
      clearSession={state.clearSession}
      unauthorizedEvent="ddyidc:user-unauthorized"
    />
  );
}

function UserGuard() {
  const user = useAuthStore((state) => state.user);
  return (
    <EntryGuard
      user={user}
      role="customer"
      loginPath="/login"
      foreignSessionPaths={foreignSessions}
    />
  );
}

function UserDashboard() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  if (!user) return null;
  return (
    <DashboardLayout
      user={user}
      groups={consoleGroups}
      signOut={signOut}
      loginPath="/login"
      profileHref="/console/profile"
    />
  );
}

function RequireMobile() {
  const needBindMobile = useAuthStore((state) => state.needBindMobile);
  const location = useLocation();
  if (needBindMobile) {
    return (
      <Navigate
        to={`/bind-mobile?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }
  return <Outlet />;
}

export function ConsoleApp() {
  return (
    <Routes>
      <Route element={<UserSessionBoundary />}>
        <Route element={<UserGuard />}>
          <Route path="/console/instance/:instanceId/vnc" element={<LazyRoute kind="detail"><VncConsole /></LazyRoute>} />
          <Route element={<PortalLayout />}>
            <Route path="/bind-mobile" element={<LazyRoute kind="form"><BindMobile /></LazyRoute>} />
          </Route>
          <Route element={<UserDashboard />}>
            <Route path="/console" element={<LazyRoute kind="dashboard"><ConsoleHome /></LazyRoute>} />
            <Route path="/console/components" element={<LazyRoute kind="form"><ComponentsPage /></LazyRoute>} />
            <Route path="/console/products" element={<LazyRoute kind="products"><ConsoleProducts /></LazyRoute>} />
            <Route path="/console/products/:id" element={<LazyRoute kind="product"><ConsoleProductDetail /></LazyRoute>} />
            <Route path="/console/instances" element={<LazyRoute kind="table"><InstanceList /></LazyRoute>} />
            <Route path="/console/instances/:instanceId" element={<LazyRoute kind="detail"><InstanceConsole /></LazyRoute>} />
            <Route path="/user/productList.htm" element={<LazyRoute kind="table"><InstanceList /></LazyRoute>} />
            <Route path="/user/instance/:instanceId.htm" element={<LazyRoute kind="detail"><InstanceConsole /></LazyRoute>} />
            <Route path="/console/orders" element={<LazyRoute kind="table"><OrderList /></LazyRoute>} />
            <Route path="/console/orders/:id" element={<LazyRoute kind="detail"><OrderDetail /></LazyRoute>} />
            <Route path="/console/profile" element={<LazyRoute kind="form"><Profile /></LazyRoute>} />
            <Route path="/console/promo" element={<LazyRoute kind="dashboard"><Promo /></LazyRoute>} />
            <Route path="/console/coupons" element={<LazyRoute kind="cards"><Coupons /></LazyRoute>} />
            <Route path="/console/tickets" element={<LazyRoute kind="table"><TicketList /></LazyRoute>} />
            <Route path="/console/tickets/create" element={<LazyRoute kind="form"><TicketCreate /></LazyRoute>} />
            <Route path="/console/tickets/:id" element={<LazyRoute kind="detail"><TicketDetailPage /></LazyRoute>} />
            <Route element={<RequireMobile />}>
              <Route path="/console/finance" element={<LazyRoute kind="table"><Finance /></LazyRoute>} />
              <Route path="/cart" element={<LazyRoute kind="table"><Cart /></LazyRoute>} />
              <Route path="/order/confirm" element={<LazyRoute kind="detail"><OrderConfirm /></LazyRoute>} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<ForbiddenPage loginPath="/login" />} />
      </Route>
    </Routes>
  );
}
