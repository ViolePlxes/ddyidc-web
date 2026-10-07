import { PointsActivities } from "../../shared/components/PointsActivities";
import { PointsEventTasks } from "../../shared/components/PointsEventTasks";
import { AdminSecureLogin } from "./views/SecureLogin";
import { adminPath } from "../../shared/utils/adminEntry";
import {
  BuildingsIcon,
  ChatCenteredTextIcon,
  CloudArrowDownIcon,
  CloudCheckIcon,
  CreditCardIcon,
  GearIcon,
  HouseIcon,
  IdentificationCardIcon,
  MegaphoneIcon,
  PackageIcon,
  PercentIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
  ArrowsClockwiseIcon,
  UsersIcon,
  StorefrontIcon,
  CoinsIcon,
  GiftIcon,
} from "@phosphor-icons/react";
import { lazy } from "react";
const AdminBackups = lazy(() => routeModules.adminBackups().then(module => ({ default: module.AdminBackups })));
const SocialLoginSettings = lazy(() => import("./views/SocialLogin").then(module => ({ default: module.SocialLoginSettings })));
const VideoBindings = lazy(() => import("../../shared/components/VideoBindings").then(module => ({ default: module.VideoBindings })));
const TransfersPage = lazy(() => import("../../shared/components/TransfersPage").then(module => ({ default: module.TransfersPage })));
import { Route, Routes } from "react-router-dom";
import {
  DashboardLayout,
  type NavigationGroup,
} from "../../layouts/DashboardLayout";
import {
  EntryGuard,
  ForbiddenPage,
  SessionBoundary,
} from "../../shared/router/EntryGuards";
import { useAdminAuthStore } from "../../shared/stores/staffAuth";
import { LazyRoute } from "../../shared/router/LazyRoute";
import { routeModules } from "../../shared/router/routeModules";
import {
  GroupBuyGate,
  useGroupBuyAvailability,
} from "../../shared/router/GroupBuyGate";
import {
  MarketplaceGate,
  useMarketplaceAvailability,
} from "../../shared/router/MarketplaceGate";
import { PointsGate, usePointsAvailability } from "../../shared/router/PointsGate";
import { CdnsellGate, useCdnsellAvailability } from "../../shared/router/CdnsellGate";

const AdminCustomers = lazy(() =>
  routeModules
    .adminCustomers()
    .then((module) => ({ default: module.AdminCustomers })),
);
const AdminInstances = lazy(() => import('./views/Instances').then(module => ({default: module.AdminInstances})));
const Certifications = lazy(() => routeModules.adminCertifications().then(module => ({default: module.Certifications})));
const AdminInstanceDetail = lazy(() => routeModules.adminInstanceDetail().then(module => ({default: module.CustomerInstance})));
const AdminInstanceVnc = lazy(() => routeModules.adminInstanceDetail().then(module => ({default: module.CustomerInstanceVnc})));
const AdminCustomerDetail = lazy(() =>
  routeModules
    .adminCustomerDetail()
    .then((module) => ({ default: module.AdminCustomerDetail })),
);
const AdminHome = lazy(() =>
  routeModules.adminHome().then((module) => ({ default: module.AdminHome })),
);
const AdminInvites = lazy(() =>
  routeModules
    .adminMarketing()
    .then((module) => ({ default: module.AdminInvites })),
);
const AdminMarketingConfig = lazy(() =>
  routeModules
    .adminMarketing()
    .then((module) => ({ default: module.AdminMarketingConfig })),
);
const AdminRewards = lazy(() =>
  routeModules
    .adminMarketing()
    .then((module) => ({ default: module.AdminRewards })),
);
const AdminSales = lazy(() =>
  routeModules
    .adminMarketing()
    .then((module) => ({ default: module.AdminSales })),
);
const AdminOrders = lazy(() =>
  routeModules
    .adminOrders()
    .then((module) => ({ default: module.AdminOrders })),
);
const AdminTodos = lazy(() => routeModules.adminTodos().then(module => ({ default: module.AdminTodos })));
const AdminProducts = lazy(() =>
  routeModules
    .adminProducts()
    .then((module) => ({ default: module.AdminProducts })),
);
const ProductGroups = lazy(() =>
  routeModules
    .adminProductGroups()
    .then((module) => ({ default: module.ProductGroups })),
);
const NotificationTasks = lazy(() => import('./views/NotificationTasks').then(module => ({ default: module.NotificationTasks })));
const AdminSystem = lazy(() =>
  routeModules
    .adminSystem()
    .then((module) => ({ default: module.AdminSystem })),
);
const AdminUpdates = lazy(() =>
  routeModules
    .adminUpdates()
    .then((module) => ({ default: module.AdminUpdates })),
);
const UpstreamOrders = lazy(() =>
  routeModules
    .adminUpstreamOrders()
    .then((module) => ({ default: module.UpstreamOrders })),
);
const UpstreamProducts = lazy(() =>
  routeModules
    .adminUpstreamProducts()
    .then((module) => ({ default: module.UpstreamProducts })),
);
const UpstreamSuppliers = lazy(() =>
  routeModules
    .adminSuppliers()
    .then((module) => ({ default: module.UpstreamSuppliers })),
);
const AdminTicketList = lazy(() =>
  routeModules
    .adminTickets()
    .then((module) => ({ default: module.AdminTicketList })),
);
const AdminTicketDetail = lazy(() =>
  routeModules
    .adminTickets()
    .then((module) => ({ default: module.AdminTicketDetail })),
);
const TicketTypes = lazy(() =>
  routeModules
    .adminTicketConfig()
    .then((module) => ({ default: module.TicketTypes })),
);
const TicketStatuses = lazy(() =>
  routeModules
    .adminTicketConfig()
    .then((module) => ({ default: module.TicketStatuses })),
);
const TicketPrereplies = lazy(() =>
  routeModules
    .adminTicketConfig()
    .then((module) => ({ default: module.TicketPrereplies })),
);
const GroupBuyAdminActivities = lazy(() =>
  routeModules
    .adminGroupBuy()
    .then((module) => ({ default: module.GroupBuyAdminActivities })),
);
const GroupBuyAdminLeaders = lazy(() =>
  routeModules
    .adminGroupBuy()
    .then((module) => ({ default: module.GroupBuyAdminLeaders })),
);
const GroupBuyAdminSettings = lazy(() =>
  routeModules
    .adminGroupBuy()
    .then((module) => ({ default: module.GroupBuyAdminSettings })),
);
const MarketplaceAdminDashboard = lazy(() =>
  routeModules
    .adminMarketplace()
    .then((module) => ({ default: module.MarketplaceAdminDashboard })),
);
const MarketplaceAdminListings = lazy(() =>
  routeModules
    .adminMarketplace()
    .then((module) => ({ default: module.MarketplaceAdminListings })),
);
const MarketplaceAdminOrders = lazy(() =>
  routeModules
    .adminMarketplace()
    .then((module) => ({ default: module.MarketplaceAdminOrders })),
);
const MarketplaceAdminFlows = lazy(() =>
  routeModules
    .adminMarketplace()
    .then((module) => ({ default: module.MarketplaceAdminFlows })),
);
const MarketplaceAdminWithdrawals = lazy(() =>
  routeModules
    .adminMarketplace()
    .then((module) => ({ default: module.MarketplaceAdminWithdrawals })),
);
const MarketplaceAdminReports = lazy(() =>
  routeModules
    .adminMarketplace()
    .then((module) => ({ default: module.MarketplaceAdminReports })),
);
const MarketplaceAdminSettings = lazy(() =>
  routeModules
    .adminMarketplace()
    .then((module) => ({ default: module.MarketplaceAdminSettings })),
);
const PointsDashboard = lazy(() => routeModules.adminPoints().then((module)=>({default:module.PointsDashboard})));
const PointsAccounts = lazy(() => routeModules.adminPoints().then((module)=>({default:module.PointsAccounts})));
const PointsGoodsAdmin = lazy(() => routeModules.adminPoints().then((module)=>({default:module.PointsGoodsAdmin})));
const PointsOrdersAdmin = lazy(() => routeModules.adminPoints().then((module)=>({default:module.PointsOrdersAdmin})));
const PointsPlugin = lazy(() => routeModules.adminPoints().then((module)=>({default:module.PointsPlugin})));
const AdminPointsCoupons = lazy(() => import("./points/Coupons").then(module=>({default:module.AdminPointsCoupons})));
const CdnAdminOverview = lazy(() => routeModules.adminCdnsell().then((module)=>({default:module.CdnAdminOverview})));
const CdnUpstream = lazy(() => routeModules.adminCdnsell().then((module)=>({default:module.CdnUpstream})));
const CdnCapabilities = lazy(() => routeModules.adminCdnsell().then((module)=>({default:module.CdnCapabilities})));
const CdnProductsAdmin = lazy(() => routeModules.adminCdnsell().then((module)=>({default:module.CdnProductsAdmin})));
const CdnCustomers = lazy(() => routeModules.adminCdnsell().then((module)=>({default:module.CdnCustomers})));
const AdminCdnDomains = lazy(() => routeModules.adminCdnsell().then((module)=>({default:module.AdminCdnDomains})));
const AdminCdnConfigCenter = lazy(() => routeModules.adminCdnsell().then((module)=>({default:module.AdminCdnConfigCenter})));

const foreignSessions = ["/api/v1/auth/me", "/admin/v1/sales/auth/me"];

const Navigation = lazy(() => routeModules.adminNavigation().then(module => ({ default: module.Navigation })));
const adminGroups: NavigationGroup[] = [
  {
    label: "概览",
    items: [
      { label: "控制台", href: adminPath('/admin'), icon: HouseIcon },
      { label: "订单管理", href: adminPath('/admin/orders'), icon: ReceiptIcon },
      { label: "客户管理", href: adminPath('/admin/customers'), icon: UsersIcon },
      { label: "产品列表", href: adminPath('/admin/instances'), icon: PackageIcon },
    ],
  },
  {
    label: "商品管理",
    items: [
      { label: "商品列表", href: adminPath('/admin/products'), icon: PackageIcon },
      { label: "商品分组", href: adminPath('/admin/products/groups'), icon: PackageIcon },
    ],
  },
  {
    label: "系统设置",
    items: [
      { label: "系统配置", href: adminPath('/admin/system'), icon: GearIcon },
      { label: "通知任务", href: adminPath('/admin/notification-tasks'), icon: GearIcon },
      { label: "更新中心", href: adminPath('/admin/updates'), icon: ArrowsClockwiseIcon },
      { label: "数据库备份", href: adminPath('/admin/backups'), icon: CloudArrowDownIcon },
    ],
  },
  {
    label: "客户服务",
    items: [
      { label: "工单管理", href: adminPath('/admin/tickets'), icon: ChatCenteredTextIcon },
      {
        label: "工单类型",
        href: adminPath('/admin/tickets/types'),
        icon: ChatCenteredTextIcon,
      },
      {
        label: "工单状态",
        href: adminPath('/admin/tickets/statuses'),
        icon: ChatCenteredTextIcon,
      },
      {
        label: "预设回复",
        href: adminPath('/admin/tickets/prereplies'),
        icon: ChatCenteredTextIcon,
      },
    ],
  },
  {
    label: "上下游",
    items: [
      {
        label: "供应商管理",
        href: adminPath('/admin/upstream/suppliers'),
        icon: BuildingsIcon,
      },
      {
        label: "供应商映射",
        href: adminPath('/admin/upstream/products'),
        icon: CloudArrowDownIcon,
      },
      {
        label: "上游订单",
        href: adminPath('/admin/upstream/orders'),
        icon: CloudCheckIcon,
      },
    ],
  },
  {
    label: "营销中心",
    items: [
      {
        label: "优惠码审核",
        href: adminPath('/admin/marketing/invites'),
        icon: IdentificationCardIcon,
      },
      {
        label: "分销结算",
        href: adminPath('/admin/marketing/rewards'),
        icon: PercentIcon,
      },
      {
        label: "销售权限",
        href: adminPath('/admin/marketing/sales'),
        icon: MegaphoneIcon,
      },
      {
        label: "营销配置",
        href: adminPath('/admin/marketing/config'),
        icon: ShieldCheckIcon,
      },
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
  const user = useAdminAuthStore(state => state.user);
  return <AdminSecureLogin user={user} />;
}

function AdminGuard() {
  const user = useAdminAuthStore((state) => state.user);
  return (
    <EntryGuard
      user={user}
      role="admin"
      loginPath={adminPath('/admin/login')}
      foreignSessionPaths={foreignSessions}
    />
  );
}

function AdminDashboard() {
  const user = useAdminAuthStore((state) => state.user);
  const signOut = useAdminAuthStore((state) => state.signOut);
  const groupBuy = useGroupBuyAvailability("admin");
  const marketplace = useMarketplaceAvailability("admin");
  const points = usePointsAvailability("admin");
  const cdnsell = useCdnsellAvailability("admin");
  if (!user) return null;
  let groups = !groupBuy.isLoading
    ? adminGroups.map((group) =>
        group.label === "营销中心"
          ? {
              ...group,
              items: [
                ...group.items,
                {
                  label: "拼团活动",
                  href: adminPath('/admin/marketing/groupbuy/activities'),
                  icon: UsersThreeIcon,
                },
                {
                  label: "拼团成员",
                  href: adminPath('/admin/marketing/groupbuy/leaders'),
                  icon: UsersThreeIcon,
                },
                {
                  label: "拼团设置",
                  href: adminPath('/admin/marketing/groupbuy/settings'),
                  icon: UsersThreeIcon,
                },
              ],
            }
          : group,
      )
    : adminGroups;
  if (!marketplace.isLoading)
    groups = [
      ...groups,
      {
        label: "交易市场",
        items: [
          {
            label: "市场概览",
            href: adminPath('/admin/marketplace/dashboard'),
            icon: StorefrontIcon,
          },
          {
            label: "挂牌管理",
            href: adminPath('/admin/marketplace/listings'),
            icon: StorefrontIcon,
          },
          {
            label: "交易订单",
            href: adminPath('/admin/marketplace/orders'),
            icon: ReceiptIcon,
          },
          {
            label: "资金流水",
            href: adminPath('/admin/marketplace/flows'),
            icon: CreditCardIcon,
          },
          {
            label: "提现审核",
            href: adminPath('/admin/marketplace/withdrawals'),
            icon: CreditCardIcon,
          },
          {
            label: "举报处理",
            href: adminPath('/admin/marketplace/reports'),
            icon: ShieldCheckIcon,
          },
          {
            label: "市场设置",
            href: adminPath('/admin/marketplace/settings'),
            icon: GearIcon,
          },
        ],
      },
    ];
  if(!points.isLoading) groups=[...groups,{label:"积分中心",items:[{label:"积分统计",href:adminPath('/admin/points'),icon:CoinsIcon},{label:"福利活动",href:adminPath('/admin/points/activities'),icon:GiftIcon},{label:"积分发放任务",href:adminPath('/admin/points/event-tasks'),icon:ReceiptIcon},{label:"积分账户",href:adminPath('/admin/points/accounts'),icon:UsersIcon},{label:"商品管理",href:adminPath('/admin/points/goods'),icon:StorefrontIcon},{label:"兑换订单",href:adminPath('/admin/points/orders'),icon:ReceiptIcon},{label:"插件配置",href:adminPath('/admin/points/plugin'),icon:GearIcon}]}];
  if(!cdnsell.isLoading) groups=[...groups,{label:"CDN 加速",items:[{label:"业务概览",href:adminPath('/admin/cdnsell'),icon:HouseIcon},{label:"金山云上游",href:adminPath('/admin/cdnsell/upstream'),icon:CloudArrowDownIcon},{label:"API 与资源包",href:adminPath('/admin/cdnsell/capabilities'),icon:CloudCheckIcon},{label:"域名管理",href:adminPath('/admin/cdnsell/domains'),icon:StorefrontIcon},{label:"域名配置中心",href:adminPath('/admin/cdnsell/config-center'),icon:GearIcon},{label:"流量包产品",href:adminPath('/admin/cdnsell/products'),icon:PackageIcon},{label:"CDN 客户",href:adminPath('/admin/cdnsell/customers'),icon:UsersIcon}]}];
  return (
    <DashboardLayout
      user={user}
      groups={groups}
      signOut={signOut}
      loginPath={adminPath('/admin/login')}
      density="compact"
    />
  );
}

export function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminSessionBoundary />}>
        <Route path={adminPath('/admin/login')} element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route element={<AdminDashboard />}>
            <Route
              path={adminPath('/admin')}
              element={
                <LazyRoute>
                  <AdminHome />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/products')}
              element={
                <LazyRoute>
                  <AdminProducts />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/products/groups')}
              element={
                <LazyRoute>
                  <ProductGroups />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/orders')}
              element={
                <LazyRoute>
                  <AdminOrders />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/customers')}
              element={
                <LazyRoute>
                  <AdminCustomers />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/customers/:id/:tab?')}
              element={
                <LazyRoute>
                  <AdminCustomerDetail />
                </LazyRoute>
              }
            />
            <Route path={adminPath('/admin/instances')} element={<LazyRoute><AdminInstances /></LazyRoute>} />
            <Route path={adminPath('/admin/customers/:customerId/instances/:instanceId')} element={<LazyRoute><AdminInstanceDetail /></LazyRoute>} />
            <Route path={adminPath('/admin/customers/:customerId/instances/:instanceId/vnc')} element={<LazyRoute><AdminInstanceVnc /></LazyRoute>} />
            <Route path={adminPath('/admin/video-bindings')} element={<LazyRoute><VideoBindings admin /></LazyRoute>} />
            <Route path={adminPath('/admin/transfers')} element={<LazyRoute><TransfersPage admin /></LazyRoute>} />
 <Route path={adminPath('/admin/certifications')} element={<LazyRoute><Certifications /></LazyRoute>} />
            <Route path={adminPath('/admin/backups')} element={<LazyRoute><AdminBackups /></LazyRoute>} />
            <Route path={adminPath('/admin/notification-tasks')} element={<LazyRoute><NotificationTasks /></LazyRoute>} />
            <Route path={adminPath('/admin/todos/:kind?')} element={<LazyRoute><AdminTodos /></LazyRoute>} />
            <Route path={adminPath('/admin/navigation')} element={<LazyRoute><Navigation /></LazyRoute>} />
            <Route path={adminPath('/admin/social-login')} element={<LazyRoute><SocialLoginSettings /></LazyRoute>} />
            <Route
              path={adminPath('/admin/system')}
              element={
                <LazyRoute>
                  <AdminSystem />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/updates')}
              element={
                <LazyRoute>
                  <AdminUpdates />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/tickets')}
              element={
                <LazyRoute>
                  <AdminTicketList />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/tickets/:id')}
              element={
                <LazyRoute>
                  <AdminTicketDetail />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/tickets/types')}
              element={
                <LazyRoute>
                  <TicketTypes />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/tickets/statuses')}
              element={
                <LazyRoute>
                  <TicketStatuses />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/tickets/prereplies')}
              element={
                <LazyRoute>
                  <TicketPrereplies />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/upstream/suppliers')}
              element={
                <LazyRoute>
                  <UpstreamSuppliers />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/upstream/products')}
              element={
                <LazyRoute>
                  <UpstreamProducts />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/upstream/orders')}
              element={
                <LazyRoute>
                  <UpstreamOrders />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/marketing/invites')}
              element={
                <LazyRoute>
                  <AdminInvites />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/marketing/rewards')}
              element={
                <LazyRoute>
                  <AdminRewards />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/marketing/sales')}
              element={
                <LazyRoute>
                  <AdminSales />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/marketing/config')}
              element={
                <LazyRoute>
                  <AdminMarketingConfig />
                </LazyRoute>
              }
            />
            <Route
              path={adminPath('/admin/marketing/groupbuy/activities')}
              element={
                <GroupBuyGate scope="admin">
                  <LazyRoute>
                    <GroupBuyAdminActivities />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path={adminPath('/admin/marketing/groupbuy/leaders')}
              element={
                <GroupBuyGate scope="admin">
                  <LazyRoute>
                    <GroupBuyAdminLeaders />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path={adminPath('/admin/marketing/groupbuy/settings')}
              element={
                <GroupBuyGate scope="admin">
                  <LazyRoute>
                    <GroupBuyAdminSettings />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path={adminPath('/admin/marketplace')}
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute>
                    <MarketplaceAdminDashboard />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path={adminPath('/admin/marketplace/dashboard')}
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute>
                    <MarketplaceAdminDashboard />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path={adminPath('/admin/marketplace/listings')}
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute>
                    <MarketplaceAdminListings />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path={adminPath('/admin/marketplace/orders')}
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute>
                    <MarketplaceAdminOrders />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path={adminPath('/admin/marketplace/flows')}
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute>
                    <MarketplaceAdminFlows />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path={adminPath('/admin/marketplace/withdrawals')}
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute>
                    <MarketplaceAdminWithdrawals />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path={adminPath('/admin/marketplace/reports')}
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute>
                    <MarketplaceAdminReports />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path={adminPath('/admin/marketplace/settings')}
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute>
                    <MarketplaceAdminSettings />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route path={adminPath('/admin/points')} element={<PointsGate scope="admin"><LazyRoute><PointsDashboard /></LazyRoute></PointsGate>} />
            <Route path={adminPath('/admin/points/accounts')} element={<PointsGate scope="admin"><LazyRoute><PointsAccounts /></LazyRoute></PointsGate>} />
            <Route path={adminPath('/admin/points/goods')} element={<PointsGate scope="admin"><LazyRoute><PointsGoodsAdmin /></LazyRoute></PointsGate>} />
            <Route path={adminPath('/admin/points/orders')} element={<PointsGate scope="admin"><LazyRoute><PointsOrdersAdmin /></LazyRoute></PointsGate>} />
            <Route path={adminPath('/admin/points/event-tasks')} element={<PointsGate scope="admin"><LazyRoute><PointsEventTasks /></LazyRoute></PointsGate>} />
            <Route path={adminPath('/admin/points/activities')} element={<PointsGate scope="admin"><LazyRoute><PointsActivities admin /></LazyRoute></PointsGate>} />
            <Route path={adminPath('/admin/points/plugin')} element={<PointsGate scope="admin"><LazyRoute><PointsPlugin /></LazyRoute></PointsGate>} />
            <Route path={adminPath('/admin/points/coupons')} element={<LazyRoute><AdminPointsCoupons /></LazyRoute>} />
            <Route path={adminPath('/admin/cdnsell')} element={<CdnsellGate scope="admin"><LazyRoute><CdnAdminOverview /></LazyRoute></CdnsellGate>} />
            <Route path={adminPath('/admin/cdnsell/upstream')} element={<CdnsellGate scope="admin"><LazyRoute><CdnUpstream /></LazyRoute></CdnsellGate>} />
            <Route path={adminPath('/admin/cdnsell/capabilities')} element={<CdnsellGate scope="admin"><LazyRoute><CdnCapabilities /></LazyRoute></CdnsellGate>} />
            <Route path={adminPath('/admin/cdnsell/products')} element={<CdnsellGate scope="admin"><LazyRoute><CdnProductsAdmin /></LazyRoute></CdnsellGate>} />
            <Route path={adminPath('/admin/cdnsell/customers')} element={<CdnsellGate scope="admin"><LazyRoute><CdnCustomers /></LazyRoute></CdnsellGate>} />
            <Route path={adminPath('/admin/cdnsell/domains')} element={<CdnsellGate scope="admin"><LazyRoute><AdminCdnDomains /></LazyRoute></CdnsellGate>} />
            <Route path={adminPath('/admin/cdnsell/config-center')} element={<CdnsellGate scope="admin"><LazyRoute><AdminCdnConfigCenter /></LazyRoute></CdnsellGate>} />
          </Route>
        </Route>
        <Route path="*" element={<ForbiddenPage loginPath={adminPath('/admin/login')} />} />
      </Route>
    </Routes>
  );
}
