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
import { lazy, useEffect } from "react";
import { pointsApi } from "../../shared/api/points";
const VideoBindings = lazy(() => import("../../shared/components/VideoBindings").then(module => ({ default: module.VideoBindings })));
const TransfersPage = lazy(() => import("../../shared/components/TransfersPage").then(module => ({ default: module.TransfersPage })));
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
  import("../portal/views/SocialMobileBinding")
    .then((module) => ({ default: module.MobileBindingPage })),
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
const WalletRecharge = lazy(() => import("./views/WalletRecharge").then(module => ({ default: module.WalletRecharge })));
const WalletRechargeRecords = lazy(() => import("./views/WalletRecharge").then(module => ({ default: module.WalletRechargeRecords })));
const WalletConsumeRecords = lazy(() => import("./views/WalletRecharge").then(module => ({ default: module.WalletConsumeRecords })));
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
const Certification = lazy(() => routeModules.consoleCertification().then(module => ({default: module.Certification})));
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
const MenuPlaceholder = lazy(() =>
  routeModules
    .consoleMenuPlaceholder()
    .then((module) => ({ default: module.MenuPlaceholder })),
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
      { label: "工单中心", href: "/console/help", icon: ChatsCircleIcon },
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
  useEffect(() => {
    if (user && points.data && points.data.enabled) {
      void pointsApi.activity().catch(() => { /* Tasks retry activity on their own page. */ });
    }
  }, [user?.id, points.data && points.data.enabled]);
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
            ...(!groupBuy.isLoading
              ? [
                  {
                    label: pendingGroups ? `拼团（${pendingGroups}）` : "拼团",
                    href: "/console/groupbuy",
                    icon: UsersThreeIcon,
                  },
                ]
              : []),
            ...(!marketplace.isLoading
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
  if(!points.isLoading){groups=[...groups,{label:"积分中心",items:[{label:"积分账户",href:"/console/points",icon:CoinsIcon},...((points.data && points.data.enabled ? points.data.showSignin : true)?[{label:"签到中心",href:"/console/points/signin",icon:CoinsIcon}]:[]),...((points.data && points.data.enabled ? points.data.showTasks : true)?[{label:"任务中心",href:"/console/points/tasks",icon:GiftIcon}]:[]),...((points.data && points.data.enabled ? points.data.showMall : true)?[{label:"积分商城",href:"/console/points/mall",icon:StorefrontIcon},{label:"我的兑换",href:"/console/points/orders",icon:ReceiptIcon}]:[])]}]}
  if(!cdnsell.isLoading) groups=[...groups,{label:"CDN 加速",items:[{label:"服务总览",href:"/console/cdnsell",icon:HouseIcon},{label:"购买流量包",href:"/console/cdnsell/packages",icon:PackageIcon},{label:"用量与批次",href:"/console/cdnsell/usage",icon:ReceiptIcon},{label:"我的域名",href:"/console/cdnsell/domains",icon:StorefrontIcon},{label:"证书管理",href:"/console/cdnsell/certs",icon:ShieldCheckIcon},{label:"刷新预热",href:"/console/cdnsell/refresh",icon:ArrowsClockwiseIcon},{label:"日志下载",href:"/console/cdnsell/logs",icon:CloudArrowDownIcon},{label:"IP 诊断",href:"/console/cdnsell/ipcheck",icon:CloudCheckIcon}]}];
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
              <LazyRoute>
                <VncConsole />
              </LazyRoute>
            }
          />
          <Route element={<PortalLayout />}>
            <Route
              path="/bind-mobile"
              element={
                <LazyRoute>
                  <BindMobile />
                </LazyRoute>
              }
            />
          </Route>
          <Route element={<UserDashboard />}>
            <Route
              path="/console"
              element={
                <LazyRoute>
                  <ConsoleHome />
                </LazyRoute>
              }
            />
            <Route
              path="/console/components"
              element={
                <LazyRoute>
                  <ComponentsPage />
                </LazyRoute>
              }
            />
            <Route
              path="/console/products"
              element={
                <LazyRoute>
                  <ConsoleProducts />
                </LazyRoute>
              }
            />
            <Route
              path="/console/products/:id"
              element={
                <LazyRoute>
                  <ConsoleProductDetail />
                </LazyRoute>
              }
            />
            <Route
              path="/console/instances"
              element={
                <LazyRoute>
                  <InstanceList />
                </LazyRoute>
              }
            />
            <Route
              path="/console/instances/:instanceId"
              element={
                <LazyRoute>
                  <InstanceConsole />
                </LazyRoute>
              }
            />
            <Route
              path="/user/productList.htm"
              element={
                <LazyRoute>
                  <InstanceList />
                </LazyRoute>
              }
            />
            <Route
              path="/user/instance/:instanceId.htm"
              element={
                <LazyRoute>
                  <InstanceConsole />
                </LazyRoute>
              }
            />
            <Route
              path="/console/orders"
              element={
                <LazyRoute>
                  <OrderList />
                </LazyRoute>
              }
            />
            <Route
              path="/console/orders/:id"
              element={
                <LazyRoute>
                  <OrderDetail />
                </LazyRoute>
              }
            />
            <Route
              path="/console/payment/result"
              element={
                <LazyRoute>
                  <PaymentResult />
                </LazyRoute>
              }
            />
            <Route path="/console/video-bindings" element={<LazyRoute><PointsGate scope="public"><VideoBindings /></PointsGate></LazyRoute>} />
            <Route path="/console/transfers" element={<LazyRoute><TransfersPage /></LazyRoute>} />
 <Route
              path="/console/certification" element={<LazyRoute><Certification /></LazyRoute>} />
            <Route path="/console/profile"
              element={
                <LazyRoute>
                  <Profile />
                </LazyRoute>
              }
            />
            <Route
              path="/console/promo"
              element={
                <LazyRoute>
                  <Promo />
                </LazyRoute>
              }
            />
            <Route
              path="/console/coupons"
              element={
                <LazyRoute>
                  <Coupons />
                </LazyRoute>
              }
            />
            <Route
              path="/console/tickets"
              element={
                <LazyRoute>
                  <TicketList />
                </LazyRoute>
              }
            />
            <Route
              path="/console/tickets/create"
              element={
                <LazyRoute>
                  <TicketCreate />
                </LazyRoute>
              }
            />
            <Route
              path="/console/tickets/:id"
              element={
                <LazyRoute>
                  <TicketDetailPage />
                </LazyRoute>
              }
            />
            <Route path="/console/invoices" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/invoices/list" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/invoices/titles" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/invoices/addresses" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/transactions" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/messages" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/logs" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/api" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/help" element={<LazyRoute><MenuPlaceholder /></LazyRoute>} />
            <Route path="/console/security" element={<LazyRoute><Profile /></LazyRoute>} />
            <Route
              path="/console/groupbuy"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute>
                    <GroupBuyActivities />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/groupbuy/activities/:id"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute>
                    <GroupBuyActivityDetail />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/groupbuy/groups/:id"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute>
                    <GroupBuyGroupDetail />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/groupbuy/my"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute>
                    <GroupBuyMine />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/groupbuy/share/:inviteCode"
              element={
                <GroupBuyGate scope="public">
                  <LazyRoute>
                    <GroupBuyShare />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/console/marketplace"
              element={
                <MarketplaceGate scope="public" allowExisting>
                  <LazyRoute>
                    <MarketplaceConsole />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route path="/console/points" element={<PointsGate scope="public"><LazyRoute><PointsHome /></LazyRoute></PointsGate>} />
            <Route path="/console/points/signin" element={<PointsGate scope="public" feature="signin"><LazyRoute><PointsSignin /></LazyRoute></PointsGate>} />
            <Route path="/console/points/tasks" element={<PointsGate scope="public" feature="tasks"><LazyRoute><PointsTasks /></LazyRoute></PointsGate>} />
            <Route path="/console/points/mall" element={<PointsGate scope="public" feature="mall"><LazyRoute><PointsMall /></LazyRoute></PointsGate>} />
            <Route path="/console/points/orders" element={<PointsGate scope="public" feature="mall"><LazyRoute><PointsOrders /></LazyRoute></PointsGate>} />
            <Route path="/console/cdnsell" element={<CdnsellGate scope="public"><LazyRoute><CdnOverview /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/packages" element={<CdnsellGate scope="public"><LazyRoute><CdnPackages /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/usage" element={<CdnsellGate scope="public"><LazyRoute><CdnUsage /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/domains" element={<CdnsellGate scope="public"><LazyRoute><CdnDomains /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/domains/:id" element={<CdnsellGate scope="public"><LazyRoute><CdnDomainPage /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/certs" element={<CdnsellGate scope="public"><LazyRoute><CdnCertificates /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/refresh" element={<CdnsellGate scope="public"><LazyRoute><CdnRefresh /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/logs" element={<CdnsellGate scope="public"><LazyRoute><CdnLogs /></LazyRoute></CdnsellGate>} />
            <Route path="/console/cdnsell/ipcheck" element={<CdnsellGate scope="public"><LazyRoute><CdnIPCheck /></LazyRoute></CdnsellGate>} />
            <Route element={<RequireMobile />}>
              <Route path="/wallet/recharge" element={<LazyRoute><WalletRecharge /></LazyRoute>} />
              <Route path="/wallet/recharge-records" element={<LazyRoute><WalletRechargeRecords /></LazyRoute>} />
              <Route path="/wallet/consume-records" element={<LazyRoute><WalletConsumeRecords /></LazyRoute>} />
              <Route
                path="/console/finance"
                element={
                  <LazyRoute>
                    <Finance />
                  </LazyRoute>
                }
              />
              <Route
                path="/console/recharge"
                element={
                  <LazyRoute>
                    <Finance />
                  </LazyRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <LazyRoute>
                    <Cart />
                  </LazyRoute>
                }
              />
              <Route
                path="/order/confirm"
                element={
                  <LazyRoute>
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
