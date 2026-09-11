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
  UsersThreeIcon,
  StorefrontIcon,
  CoinsIcon,
  ShieldCheckIcon,
  ArrowsClockwiseIcon,
  CloudArrowDownIcon,
  CloudCheckIcon,
} from "@phosphor-icons/react";
import { lazy } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  GroupBuyGate,
  useGroupBuyAvailability,
} from "../../shared/router/GroupBuyGate";
import { groupBuyApi } from "../../shared/api/groupbuy";
import {
  MarketplaceGate,
  useMarketplaceAvailability,
} from "../../shared/router/MarketplaceGate";
import { PointsGate, usePointsAvailability } from "../../shared/router/PointsGate";
import { CdnsellGate, useCdnsellAvailability } from "../../shared/router/CdnsellGate";

const BindMobile = lazy(() =>
  routeModules
    .portalPublic()
    .then((module) => ({ default: module.BindMobile })),
);
const Cart = lazy(() =>
  routeModules.consoleCart().then((module) => ({ default: module.Cart })),
);
const ComponentsPage = lazy(() =>
  routeModules
    .consoleComponents()
    .then((module) => ({ default: module.ComponentsPage })),
);
const Coupons = lazy(() =>
  routeModules.consoleCoupons().then((module) => ({ default: module.Coupons })),
);
const Finance = lazy(() =>
  routeModules.consoleFinance().then((module) => ({ default: module.Finance })),
);
const ConsoleHome = lazy(() =>
  routeModules
    .consoleHome()
    .then((module) => ({ default: module.ConsoleHome })),
);
const InstanceList = lazy(() =>
  routeModules
    .consoleInstances()
    .then((module) => ({ default: module.InstanceList })),
);
const InstanceConsole = lazy(() =>
  routeModules
    .consoleInstance()
    .then((module) => ({ default: module.InstanceConsole })),
);
const VncConsole = lazy(() =>
  routeModules.consoleVnc().then((module) => ({ default: module.VncConsole })),
);
const OrderConfirm = lazy(() =>
  routeModules
    .consoleOrderConfirm()
    .then((module) => ({ default: module.OrderConfirm })),
);
const PaymentResult = lazy(() =>
  routeModules
    .consolePaymentResult()
    .then((module) => ({ default: module.PaymentResult })),
);
const OrderDetail = lazy(() =>
  routeModules
    .consoleOrderDetail()
    .then((module) => ({ default: module.OrderDetail })),
);
const OrderList = lazy(() =>
  routeModules
    .consoleOrders()
    .then((module) => ({ default: module.OrderList })),
);
const ConsoleProductDetail = lazy(() =>
  routeModules
    .consoleProductDetail()
    .then((module) => ({ default: module.ConsoleProductDetail })),
);
const ConsoleProducts = lazy(() =>
  routeModules
    .consoleProducts()
    .then((module) => ({ default: module.ConsoleProducts })),
);
const Profile = lazy(() =>
  routeModules.consoleProfile().then((module) => ({ default: module.Profile })),
);
const Promo = lazy(() =>
  routeModules.consolePromo().then((module) => ({ default: module.Promo })),
);
const TicketList = lazy(() =>
  routeModules
    .consoleTickets()
    .then((module) => ({ default: module.TicketList })),
);
const TicketCreate = lazy(() =>
  routeModules
    .consoleTickets()
    .then((module) => ({ default: module.TicketCreate })),
);
const TicketDetailPage = lazy(() =>
  routeModules
    .consoleTickets()
    .then((module) => ({ default: module.TicketDetailPage })),
);
const GroupBuyActivities = lazy(() =>
  routeModules
    .consoleGroupBuy()
    .then((module) => ({ default: module.GroupBuyActivities })),
);
const GroupBuyActivityDetail = lazy(() =>
  routeModules
    .consoleGroupBuy()
    .then((module) => ({ default: module.GroupBuyActivityDetail })),
);
const GroupBuyGroupDetail = lazy(() =>
  routeModules
    .consoleGroupBuy()
    .then((module) => ({ default: module.GroupBuyGroupDetail })),
);
const GroupBuyMine = lazy(() =>
  routeModules
    .consoleGroupBuy()
    .then((module) => ({ default: module.GroupBuyMine })),
);
const GroupBuyShare = lazy(() =>
  routeModules
    .consoleGroupBuy()
    .then((module) => ({ default: module.GroupBuyShare })),
);
const MarketplaceConsole = lazy(() =>
  routeModules
    .consoleMarketplace()
    .then((module) => ({ default: module.MarketplaceConsole })),
);
const PointsHome = lazy(() => routeModules.consolePoints().then((module)=>({default:module.PointsHome})));
const PointsSignin = lazy(() => routeModules.consolePoints().then((module)=>({default:module.PointsSignin})));
const PointsTasks = lazy(() => routeModules.consolePoints().then((module)=>({default:module.PointsTasks})));
const PointsMall = lazy(() => routeModules.consolePoints().then((module)=>({default:module.PointsMall})));
const PointsOrders = lazy(() => routeModules.consolePoints().then((module)=>({default:module.PointsOrders})));
const CdnOverview = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnOverview})));
const CdnPackages = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnPackages})));
const CdnUsage = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnUsage})));
const CdnDomains = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnDomains})));
const CdnDomainPage = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnDomainPage})));
const CdnCertificates = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnCertificates})));
const CdnRefresh = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnRefresh})));
const CdnLogs = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnLogs})));
const CdnIPCheck = lazy(() => routeModules.consoleCdnsell().then((module)=>({default:module.CdnIPCheck})));

const foreignSessions = ["/admin/v1/auth/me", "/admin/v1/sales/auth/me"];

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
  const groupBuy = useGroupBuyAvailability("public");
  const marketplace = useMarketplaceAvailability("public");
  const points = usePointsAvailability("public");
  const cdnsell = useCdnsellAvailability("public");
  const groupBuyCounts = useQuery({
    queryKey: ["groupbuy", "tab-counts"],
    queryFn: groupBuyApi.tabCounts,
    enabled: Boolean(groupBuy.data),
  });
  if (!user) return null;
  const pendingGroups = groupBuyCounts.data?.pending ?? 0;
  let groups = consoleGroups.map((group, index) =>
    index === 0
      ? {
          ...group,
          items: [
            ...group.items,
            ...(groupBuy.data
              ? [
                  {
                    label: pendingGroups ? `拼团（${pendingGroups}）` : "拼团",
                    href: "/console/groupbuy",
                    icon: UsersThreeIcon,
                  },
                ]
              : []),
            ...(marketplace.data
              ? [
                  {
                    label: "交易市场",
                    href: "/console/marketplace",
                    icon: StorefrontIcon,
                  },
                ]
              : []),
          ],
        }
      : group,
  );
  if(points.data&&points.data.enabled){groups=[...groups,{label:"积分中心",items:[{label:"积分账户",href:"/console/points",icon:CoinsIcon},...(points.data.showSignin?[{label:"签到中心",href:"/console/points/signin",icon:CoinsIcon}]:[]),...(points.data.showTasks?[{label:"任务中心",href:"/console/points/tasks",icon:GiftIcon}]:[]),...(points.data.showMall?[{label:"积分商城",href:"/console/points/mall",icon:StorefrontIcon},{label:"我的兑换",href:"/console/points/orders",icon:ReceiptIcon}]:[])]}]}
  if(cdnsell.data?.enabled) groups=[...groups,{label:"CDN 加速",items:[{label:"服务总览",href:"/console/cdnsell",icon:HouseIcon},{label:"购买流量包",href:"/console/cdnsell/packages",icon:PackageIcon},{label:"用量与批次",href:"/console/cdnsell/usage",icon:ReceiptIcon},{label:"我的域名",href:"/console/cdnsell/domains",icon:StorefrontIcon},{label:"证书管理",href:"/console/cdnsell/certs",icon:ShieldCheckIcon},{label:"刷新预热",href:"/console/cdnsell/refresh",icon:ArrowsClockwiseIcon},{label:"日志下载",href:"/console/cdnsell/logs",icon:CloudArrowDownIcon},{label:"IP 诊断",href:"/console/cdnsell/ipcheck",icon:CloudCheckIcon}]}];
  return (
    <DashboardLayout
      user={user}
      groups={groups}
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
          <Route
            path="/console/instance/:instanceId/vnc"
            element={
              <LazyRoute kind="detail">
                <VncConsole />
              </LazyRoute>
            }
          />
          <Route element={<PortalLayout />}>
            <Route
              path="/bind-mobile"
              element={
                <LazyRoute kind="form">
                  <BindMobile />
                </LazyRoute>
              }
            />
          </Route>
          <Route element={<UserDashboard />}>
            <Route
              path="/console"
              element={
                <LazyRoute kind="dashboard">
                  <ConsoleHome />
                </LazyRoute>
              }
            />
            <Route
              path="/console/components"
              element={
                <LazyRoute kind="form">
                  <ComponentsPage />
                </LazyRoute>
              }
            />
            <Route
              path="/console/products"
              element={
                <LazyRoute kind="products">
                  <ConsoleProducts />
                </LazyRoute>
              }
            />
            <Route
              path="/console/products/:id"
              element={
                <LazyRoute kind="product">
                  <ConsoleProductDetail />
                </LazyRoute>
              }
            />
            <Route
              path="/console/instances"
              element={
                <LazyRoute kind="table">
                  <InstanceList />
                </LazyRoute>
              }
            />
            <Route
              path="/console/instances/:instanceId"
              element={
                <LazyRoute kind="detail">
                  <InstanceConsole />
                </LazyRoute>
              }
            />
            <Route
              path="/user/productList.htm"
              element={
                <LazyRoute kind="table">
                  <InstanceList />
                </LazyRoute>
              }
            />
            <Route
              path="/user/instance/:instanceId.htm"
              element={
                <LazyRoute kind="detail">
                  <InstanceConsole />
                </LazyRoute>
              }
            />
            <Route
              path="/console/orders"
              element={
                <LazyRoute kind="table">
                  <OrderList />
                </LazyRoute>
              }
            />
            <Route
              path="/console/orders/:id"
              element={
                <LazyRoute kind="detail">
                  <OrderDetail />
                </LazyRoute>
              }
            />
            <Route
              path="/console/payment/result"
              element={
                <LazyRoute kind="detail">
                  <PaymentResult />
                </LazyRoute>
              }
            />
            <Route
              path="/console/profile"
              element={
                <LazyRoute kind="form">
                  <Profile />
                </LazyRoute>
              }
            />
            <Route
              path="/console/promo"
              element={
                <LazyRoute kind="dashboard">
                  <Promo />
                </LazyRoute>
              }
            />
            <Route
              path="/console/coupons"
              element={
                <LazyRoute kind="cards">
                  <Coupons />
                </LazyRoute>
              }
            />
            <Route
              path="/console/tickets"
              element={
                <LazyRoute kind="table">
                  <TicketList />
                </LazyRoute>
              }
            />
            <Route
              path="/console/tickets/create"
              element={
                <LazyRoute kind="form">
                  <TicketCreate />
                </LazyRoute>
              }
            />
            <Route
              path="/console/tickets/:id"
              element={
                <LazyRoute kind="detail">
                  <TicketDetailPage />
                </LazyRoute>
              }
            />
            <Route
              path="/console/groupbuy"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute kind="products">
                    <GroupBuyActivities />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/groupbuy/activities/:id"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute kind="product">
                    <GroupBuyActivityDetail />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/groupbuy/groups/:id"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute kind="detail">
                    <GroupBuyGroupDetail />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/groupbuy/my"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute kind="table">
                    <GroupBuyMine />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/groupbuy/share/:inviteCode"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute kind="detail">
                    <GroupBuyShare />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/marketplace"
              element={
                <MarketplaceGate scope="public">
                  <LazyRoute kind="dashboard">
                    <MarketplaceConsole />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route path="/console/points" element={<PointsGate scope="public"><LazyRoute kind="dashboard"><PointsHome /></LazyRoute></PointsGate>} />
            <Route path="/console/points/signin" element={<PointsGate scope="public" feature="signin"><LazyRoute kind="dashboard"><PointsSignin /></LazyRoute></PointsGate>} />
            <Route path="/console/points/tasks" element={<PointsGate scope="public" feature="tasks"><LazyRoute kind="cards"><PointsTasks /></LazyRoute></PointsGate>} />
            <Route path="/console/points/mall" element={<PointsGate scope="public" feature="mall"><LazyRoute kind="products"><PointsMall /></LazyRoute></PointsGate>} />
            <Route path="/console/points/orders" element={<PointsGate scope="public" feature="mall"><LazyRoute kind="table"><PointsOrders /></LazyRoute></PointsGate>} />
            <Route path="/console/cdnsell" element={<CdnsellGate scope="public"><LazyRoute kind="dashboard"><CdnOverview /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/packages" element={<CdnsellGate scope="public"><LazyRoute kind="products"><CdnPackages /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/usage" element={<CdnsellGate scope="public"><LazyRoute kind="table"><CdnUsage /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/domains" element={<CdnsellGate scope="public"><LazyRoute kind="table"><CdnDomains /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/domains/:id" element={<CdnsellGate scope="public"><LazyRoute kind="detail"><CdnDomainPage /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/certs" element={<CdnsellGate scope="public"><LazyRoute kind="table"><CdnCertificates /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/refresh" element={<CdnsellGate scope="public"><LazyRoute kind="form"><CdnRefresh /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/logs" element={<CdnsellGate scope="public"><LazyRoute kind="table"><CdnLogs /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/ipcheck" element={<CdnsellGate scope="public"><LazyRoute kind="form"><CdnIPCheck /></LazyRoute></CdnsellGate>} />
            <Route element={<RequireMobile />}>
              <Route
                path="/console/finance"
                element={
                  <LazyRoute kind="table">
                    <Finance />
                  </LazyRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <LazyRoute kind="table">
                    <Cart />
                  </LazyRoute>
                }
              />
              <Route
                path="/order/confirm"
                element={
                  <LazyRoute kind="detail">
                    <OrderConfirm />
                  </LazyRoute>
                }
              />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<ForbiddenPage loginPath="/login" />} />
      </Route>
    </Routes>
  );
}
