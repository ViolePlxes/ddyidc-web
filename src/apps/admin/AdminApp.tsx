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
import { StaffLogin } from "../../shared/components/StaffLogin";
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
      { label: "经营概览", href: "/admin", icon: HouseIcon },
      { label: "订单管理", href: "/admin/orders", icon: ReceiptIcon },
      { label: "客户管理", href: "/admin/customers", icon: UsersIcon },
    ],
  },
  {
    label: "商品管理",
    items: [
      { label: "商品列表", href: "/admin/products", icon: PackageIcon },
      { label: "商品分组", href: "/admin/products/groups", icon: PackageIcon },
    ],
  },
  {
    label: "系统设置",
    items: [
      { label: "系统配置", href: "/admin/system", icon: GearIcon },
      { label: "更新中心", href: "/admin/updates", icon: ArrowsClockwiseIcon },
      { label: "数据库备份", href: "/admin/backups", icon: CloudArrowDownIcon },
    ],
  },
  {
    label: "客户服务",
    items: [
      { label: "工单管理", href: "/admin/tickets", icon: ChatCenteredTextIcon },
      {
        label: "工单类型",
        href: "/admin/tickets/types",
        icon: ChatCenteredTextIcon,
      },
      {
        label: "工单状态",
        href: "/admin/tickets/statuses",
        icon: ChatCenteredTextIcon,
      },
      {
        label: "预设回复",
        href: "/admin/tickets/prereplies",
        icon: ChatCenteredTextIcon,
      },
    ],
  },
  {
    label: "上下游",
    items: [
      {
        label: "供应商管理",
        href: "/admin/upstream/suppliers",
        icon: BuildingsIcon,
      },
      {
        label: "供应商映射",
        href: "/admin/upstream/products",
        icon: CloudArrowDownIcon,
      },
      {
        label: "上游订单",
        href: "/admin/upstream/orders",
        icon: CloudCheckIcon,
      },
    ],
  },
  {
    label: "营销中心",
    items: [
      {
        label: "优惠码审核",
        href: "/admin/marketing/invites",
        icon: IdentificationCardIcon,
      },
      {
        label: "分销结算",
        href: "/admin/marketing/rewards",
        icon: PercentIcon,
      },
      {
        label: "销售权限",
        href: "/admin/marketing/sales",
        icon: MegaphoneIcon,
      },
      {
        label: "营销配置",
        href: "/admin/marketing/config",
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
  const groupBuy = useGroupBuyAvailability("admin");
  const marketplace = useMarketplaceAvailability("admin");
  const points = usePointsAvailability("admin");
  const cdnsell = useCdnsellAvailability("admin");
  if (!user) return null;
  let groups = groupBuy.data
    ? adminGroups.map((group) =>
        group.label === "营销中心"
          ? {
              ...group,
              items: [
                ...group.items,
                {
                  label: "拼团活动",
                  href: "/admin/marketing/groupbuy/activities",
                  icon: UsersThreeIcon,
                },
                {
                  label: "拼团成员",
                  href: "/admin/marketing/groupbuy/leaders",
                  icon: UsersThreeIcon,
                },
                {
                  label: "拼团设置",
                  href: "/admin/marketing/groupbuy/settings",
                  icon: UsersThreeIcon,
                },
              ],
            }
          : group,
      )
    : adminGroups;
  if (marketplace.data)
    groups = [
      ...groups,
      {
        label: "交易市场",
        items: [
          {
            label: "市场概览",
            href: "/admin/marketplace/dashboard",
            icon: StorefrontIcon,
          },
          {
            label: "挂牌管理",
            href: "/admin/marketplace/listings",
            icon: StorefrontIcon,
          },
          {
            label: "交易订单",
            href: "/admin/marketplace/orders",
            icon: ReceiptIcon,
          },
          {
            label: "资金流水",
            href: "/admin/marketplace/flows",
            icon: CreditCardIcon,
          },
          {
            label: "提现审核",
            href: "/admin/marketplace/withdrawals",
            icon: CreditCardIcon,
          },
          {
            label: "举报处理",
            href: "/admin/marketplace/reports",
            icon: ShieldCheckIcon,
          },
          {
            label: "市场设置",
            href: "/admin/marketplace/settings",
            icon: GearIcon,
          },
        ],
      },
    ];
  if(points.data&&points.data.enabled) groups=[...groups,{label:"积分中心",items:[{label:"积分统计",href:"/admin/points",icon:CoinsIcon},{label:"积分账户",href:"/admin/points/accounts",icon:UsersIcon},{label:"商品管理",href:"/admin/points/goods",icon:StorefrontIcon},{label:"兑换订单",href:"/admin/points/orders",icon:ReceiptIcon},{label:"插件配置",href:"/admin/points/plugin",icon:GearIcon}]}];
  if(cdnsell.data?.enabled) groups=[...groups,{label:"CDN 加速",items:[{label:"业务概览",href:"/admin/cdnsell",icon:HouseIcon},{label:"金山云上游",href:"/admin/cdnsell/upstream",icon:CloudArrowDownIcon},{label:"API 与资源包",href:"/admin/cdnsell/capabilities",icon:CloudCheckIcon},{label:"域名管理",href:"/admin/cdnsell/domains",icon:StorefrontIcon},{label:"域名配置中心",href:"/admin/cdnsell/config-center",icon:GearIcon},{label:"流量包产品",href:"/admin/cdnsell/products",icon:PackageIcon},{label:"CDN 客户",href:"/admin/cdnsell/customers",icon:UsersIcon}]}];
  return (
    <DashboardLayout
      user={user}
      groups={groups}
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
            <Route
              path="/admin"
              element={
                <LazyRoute kind="dashboard">
                  <AdminHome />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <LazyRoute kind="table">
                  <AdminProducts />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/products/groups"
              element={
                <LazyRoute kind="table">
                  <ProductGroups />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <LazyRoute kind="table">
                  <AdminOrders />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <LazyRoute kind="table">
                  <AdminCustomers />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/customers/:id/:tab?"
              element={
                <LazyRoute kind="detail">
                  <AdminCustomerDetail />
                </LazyRoute>
              }
            />
            <Route path="/admin/customers/:customerId/instances/:instanceId" element={<LazyRoute kind="detail"><AdminInstanceDetail /></LazyRoute>} />
            <Route path="/admin/customers/:customerId/instances/:instanceId/vnc" element={<LazyRoute kind="detail"><AdminInstanceVnc /></LazyRoute>} />
            <Route path="/admin/video-bindings" element={<LazyRoute kind="cards"><VideoBindings admin /></LazyRoute>} />
            <Route path="/admin/transfers" element={<LazyRoute kind="table"><TransfersPage admin /></LazyRoute>} />
 <Route path="/admin/certifications" element={<LazyRoute kind="table"><Certifications /></LazyRoute>} />
            <Route path="/admin/backups" element={<LazyRoute kind="form"><AdminBackups /></LazyRoute>} />
            <Route path="/admin/todos/:kind?" element={<LazyRoute kind="table"><AdminTodos /></LazyRoute>} />
            <Route path="/admin/navigation" element={<LazyRoute kind="table"><Navigation /></LazyRoute>} />
            <Route path="/admin/social-login" element={<LazyRoute kind="form"><SocialLoginSettings /></LazyRoute>} />
            <Route
              path="/admin/system"
              element={
                <LazyRoute kind="form">
                  <AdminSystem />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/updates"
              element={
                <LazyRoute kind="dashboard">
                  <AdminUpdates />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/tickets"
              element={
                <LazyRoute kind="table">
                  <AdminTicketList />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/tickets/:id"
              element={
                <LazyRoute kind="detail">
                  <AdminTicketDetail />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/tickets/types"
              element={
                <LazyRoute kind="table">
                  <TicketTypes />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/tickets/statuses"
              element={
                <LazyRoute kind="table">
                  <TicketStatuses />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/tickets/prereplies"
              element={
                <LazyRoute kind="table">
                  <TicketPrereplies />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/upstream/suppliers"
              element={
                <LazyRoute kind="table">
                  <UpstreamSuppliers />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/upstream/products"
              element={
                <LazyRoute kind="dashboard">
                  <UpstreamProducts />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/upstream/orders"
              element={
                <LazyRoute kind="table">
                  <UpstreamOrders />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/marketing/invites"
              element={
                <LazyRoute kind="table">
                  <AdminInvites />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/marketing/rewards"
              element={
                <LazyRoute kind="table">
                  <AdminRewards />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/marketing/sales"
              element={
                <LazyRoute kind="table">
                  <AdminSales />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/marketing/config"
              element={
                <LazyRoute kind="form">
                  <AdminMarketingConfig />
                </LazyRoute>
              }
            />
            <Route
              path="/admin/marketing/groupbuy/activities"
              element={
                <GroupBuyGate scope="admin">
                  <LazyRoute kind="table">
                    <GroupBuyAdminActivities />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/admin/marketing/groupbuy/leaders"
              element={
                <GroupBuyGate scope="admin">
                  <LazyRoute kind="table">
                    <GroupBuyAdminLeaders />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/admin/marketing/groupbuy/settings"
              element={
                <GroupBuyGate scope="admin">
                  <LazyRoute kind="form">
                    <GroupBuyAdminSettings />
                  </LazyRoute>
                </GroupBuyGate>
              }
            />
            <Route
              path="/admin/marketplace"
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute kind="dashboard">
                    <MarketplaceAdminDashboard />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path="/admin/marketplace/dashboard"
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute kind="dashboard">
                    <MarketplaceAdminDashboard />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path="/admin/marketplace/listings"
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute kind="table">
                    <MarketplaceAdminListings />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path="/admin/marketplace/orders"
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute kind="table">
                    <MarketplaceAdminOrders />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path="/admin/marketplace/flows"
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute kind="table">
                    <MarketplaceAdminFlows />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path="/admin/marketplace/withdrawals"
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute kind="table">
                    <MarketplaceAdminWithdrawals />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path="/admin/marketplace/reports"
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute kind="table">
                    <MarketplaceAdminReports />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route
              path="/admin/marketplace/settings"
              element={
                <MarketplaceGate scope="admin">
                  <LazyRoute kind="form">
                    <MarketplaceAdminSettings />
                  </LazyRoute>
                </MarketplaceGate>
              }
            />
            <Route path="/admin/points" element={<PointsGate scope="admin"><LazyRoute kind="dashboard"><PointsDashboard /></LazyRoute></PointsGate>} />
            <Route path="/admin/points/accounts" element={<PointsGate scope="admin"><LazyRoute kind="table"><PointsAccounts /></LazyRoute></PointsGate>} />
            <Route path="/admin/points/goods" element={<PointsGate scope="admin"><LazyRoute kind="table"><PointsGoodsAdmin /></LazyRoute></PointsGate>} />
            <Route path="/admin/points/orders" element={<PointsGate scope="admin"><LazyRoute kind="table"><PointsOrdersAdmin /></LazyRoute></PointsGate>} />
            <Route path="/admin/points/plugin" element={<PointsGate scope="admin"><LazyRoute kind="form"><PointsPlugin /></LazyRoute></PointsGate>} />
            <Route path="/admin/cdnsell" element={<CdnsellGate scope="admin"><LazyRoute kind="dashboard"><CdnAdminOverview /></LazyRoute></CdnsellGate>} />
            <Route path="/admin/cdnsell/upstream" element={<CdnsellGate scope="admin"><LazyRoute kind="table"><CdnUpstream /></LazyRoute></CdnsellGate>} />
            <Route path="/admin/cdnsell/capabilities" element={<CdnsellGate scope="admin"><LazyRoute kind="table"><CdnCapabilities /></LazyRoute></CdnsellGate>} />
            <Route path="/admin/cdnsell/products" element={<CdnsellGate scope="admin"><LazyRoute kind="table"><CdnProductsAdmin /></LazyRoute></CdnsellGate>} />
            <Route path="/admin/cdnsell/customers" element={<CdnsellGate scope="admin"><LazyRoute kind="table"><CdnCustomers /></LazyRoute></CdnsellGate>} />
            <Route path="/admin/cdnsell/domains" element={<CdnsellGate scope="admin"><LazyRoute kind="table"><AdminCdnDomains /></LazyRoute></CdnsellGate>} />
            <Route path="/admin/cdnsell/config-center" element={<CdnsellGate scope="admin"><LazyRoute kind="form"><AdminCdnConfigCenter /></LazyRoute></CdnsellGate>} />
          </Route>
        </Route>
        <Route path="*" element={<ForbiddenPage loginPath="/admin/login" />} />
      </Route>
    </Routes>
  );
}
