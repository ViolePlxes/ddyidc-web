import { adminPath } from "../utils/adminEntry";
export const routeModules = {
  portalPublic: () => import("../../apps/portal/views/Public"),
  portalLogin: () => import("../../apps/portal/views/Login"),
  portalRegister: () => import("../../apps/portal/views/Register"),
  portalAgreement: () => import("../../apps/portal/views/Agreement"),
  portalGroupBuy: () => import("../../apps/portal/groupbuy"),
  portalMarketplace: () => import("../../apps/portal/marketplace"),
  consoleDomains: () => import("../../apps/console/domains"),
  consoleHome: () => import("../../apps/console/views/Home"),
  consoleComponents: () => import("../../apps/console/views/Components"),
  consoleProducts: () => import("../../apps/console/views/Products"),
  consoleProductDetail: () => import("../../apps/console/views/ProductDetail"),
  consoleInstances: () => import("../../apps/console/views/Instances"),
  consoleInstance: () => import("../../apps/console/views/InstanceConsole"),
  consoleVnc: () => import("../../apps/console/views/VncConsole"),
  consoleOrders: () => import("../../apps/console/views/Orders"),
  consoleOrderDetail: () => import("../../apps/console/views/OrderDetail"),
  consoleCertification: () => import("../../apps/console/views/Certification"),
  consoleProfile: () => import("../../apps/console/views/Profile"),
  consolePromo: () => import("../../apps/console/views/Promo"),
  consoleCoupons: () => import("../../apps/console/views/Coupons"),
  consoleFinance: () => import("../../apps/console/views/Finance"),
  consoleCart: () => import("../../apps/console/views/Cart"),
  consoleOrderConfirm: () => import("../../apps/console/views/OrderConfirm"),
  consolePaymentResult: () => import("../../apps/console/views/PaymentResult"),
  consoleTickets: () => import("../../apps/console/views/Tickets"),
  consoleMenuPlaceholder: () => import("../../apps/console/views/MenuPlaceholder"),
  consoleGroupBuy: () => import("../../apps/console/groupbuy"),
  consoleMarketplace: () => import("../../apps/console/marketplace"),
  consolePoints: () => import("../../apps/console/points"),
  consoleCdnsell: () => import("../../apps/console/cdnsell"),
  adminDomains: () => import("../../apps/admin/domains"),
  adminHome: () => import("../../apps/admin/views/Home"),
  adminProducts: () => import("../../apps/admin/views/Products"),
  adminProductGroups: () => import("../../apps/admin/views/ProductGroups"),
  adminOrders: () => import("../../apps/admin/views/Orders"),
  adminTodos: () => import("../../apps/admin/views/Todos"),
  adminCustomers: () => import("../../apps/admin/views/Customers"),
  adminCertifications: () => import("../../apps/admin/views/Certifications"),
  adminInstanceDetail: () => import("../../apps/admin/views/CustomerInstance"),
  adminCustomerDetail: () => import("../../apps/admin/views/CustomerDetail"),
  adminNavigation: () => import("../../apps/admin/views/Navigation"),
  adminSystem: () => import("../../apps/admin/views/System"),
  adminBackups: () => import("../../apps/admin/views/Backups"),
  adminUpdates: () => import("../../apps/admin/views/Updates"),
  adminSuppliers: () => import("../../apps/admin/views/UpstreamSuppliers"),
  adminUpstreamProducts: () =>
    import("../../apps/admin/views/UpstreamProducts"),
  adminUpstreamOrders: () => import("../../apps/admin/views/UpstreamOrders"),
  adminMarketing: () => import("../../apps/admin/views/Marketing"),
  adminTickets: () => import("../../apps/admin/views/Tickets"),
  adminTicketConfig: () => import("../../apps/admin/views/TicketConfig"),
  adminGroupBuy: () => import("../../apps/admin/groupbuy"),
  adminMarketplace: () => import("../../apps/admin/marketplace"),
  adminPoints: () => import("../../apps/admin/points"),
  adminCdnsell: () => import("../../apps/admin/cdnsell"),
  salesHome: () => import("../../apps/sales/views/Home"),
};

const routeLoaders: Array<
  [test: (path: string) => boolean, load: () => Promise<unknown>]
> = [
  [(path) => path === "/", routeModules.portalPublic],
  [
    (path) => path === "/products" || /^\/products\/[^/]+$/.test(path),
    routeModules.portalPublic,
  ],
  [
    (path) => ["/about", "/reset-password", "/bind-mobile"].includes(path),
    routeModules.portalPublic,
  ],
  [(path) => path === "/login", routeModules.portalLogin],
  [(path) => path === "/register", routeModules.portalRegister],
  [(path) => path === "/terms/service" || path === "/terms/privacy", routeModules.portalAgreement],
  [
    (path) => path === "/groupbuy" || path.startsWith("/groupbuy/share/"),
    routeModules.portalGroupBuy,
  ],
  [
    (path) =>
      path === "/marketplace" || path.startsWith("/marketplace/listing/"),
    routeModules.portalMarketplace,
  ],
  [(path) => path === "/console", routeModules.consoleHome],
  [(path) => path === "/console/components", routeModules.consoleComponents],
  [(path) => path === "/console/products", routeModules.consoleProducts],
  [
    (path) => /^\/console\/products\/[^/]+$/.test(path),
    routeModules.consoleProductDetail,
  ],
  [
    (path) => path === "/console/instances" || path === "/user/productList.htm",
    routeModules.consoleInstances,
  ],
  [
    (path) =>
      /^\/console\/instances\/[^/]+$/.test(path) ||
      /^\/user\/instance\/[^/]+\.htm$/.test(path),
    routeModules.consoleInstance,
  ],
  [
    (path) => /^\/console\/instance\/[^/]+\/vnc$/.test(path),
    routeModules.consoleVnc,
  ],
  [(path) => path === "/console/orders", routeModules.consoleOrders],
  [
    (path) => /^\/console\/orders\/[^/]+$/.test(path),
    routeModules.consoleOrderDetail,
  ],
  [(path) => path === "/console/certification", routeModules.consoleCertification],
  [(path) => path === adminPath('/admin/certifications'), routeModules.adminCertifications],
  [
    (path) => path === "/console/profile" || path === "/console/security",
    routeModules.consoleProfile,
  ],
  [(path) => path === "/console/promo", routeModules.consolePromo],
  [(path) => path === "/console/coupons", routeModules.consoleCoupons],
  [
    (path) => path === "/console/finance" || path === "/console/recharge",
    routeModules.consoleFinance,
  ],
  [(path) => path === "/cart", routeModules.consoleCart],
  [(path) => path === "/order/confirm", routeModules.consoleOrderConfirm],
  [
    (path) => path === "/console/payment/result",
    routeModules.consolePaymentResult,
  ],
  [
    (path) =>
      path === "/console/tickets" ||
      path === "/console/tickets/create" ||
      /^\/console\/tickets\/[^/]+$/.test(path),
    routeModules.consoleTickets,
  ],
  [
    (path) =>
      [
        "/console/invoices",
        "/console/invoices/list",
        "/console/invoices/titles",
        "/console/invoices/addresses",
        "/console/transactions",
        "/console/messages",
        "/console/logs",
        "/console/api",
        "/console/help",
      ].includes(path),
    routeModules.consoleMenuPlaceholder,
  ],
  [
    (path) =>
      path === "/console/groupbuy" || path.startsWith("/console/groupbuy/"),
    routeModules.consoleGroupBuy,
  ],
  [(path) => path === "/console/marketplace", routeModules.consoleMarketplace],
  [(path) => path.startsWith("/console/points"), routeModules.consolePoints],
  [(path) => path.startsWith("/console/cdnsell"), routeModules.consoleCdnsell],
  [(path) => path === "/console/domains" || path.startsWith("/console/domains/"), routeModules.consoleDomains],
  [(path) => path === adminPath('/admin/domains'), routeModules.adminDomains],
  [(path) => path === adminPath('/admin'), routeModules.adminHome],
  [(path) => path === adminPath('/admin/products'), routeModules.adminProducts],
  [
    (path) => path === adminPath('/admin/products/groups'),
    routeModules.adminProductGroups,
  ],
  [(path) => path === adminPath('/admin/orders'), routeModules.adminOrders],
  [(path) => path === adminPath('/admin/customers'), routeModules.adminCustomers],
  [(path) => /^\/dd-admin-[a-z0-9]{24,64}\/customers\/[^/]+\/instances\/[^/]+(?:\/vnc)?$/.test(path), routeModules.adminInstanceDetail],
  [
    (path) => /^\/dd-admin-[a-z0-9]{24,64}\/customers\/[^/]+$/.test(path),
    routeModules.adminCustomerDetail,
  ],
  [(path) => path === adminPath('/admin/navigation'), routeModules.adminNavigation],
  [(path) => path === adminPath('/admin/system'), routeModules.adminSystem],
  [(path) => path === adminPath('/admin/backups'), routeModules.adminBackups],
  [(path) => path === adminPath('/admin/updates'), routeModules.adminUpdates],
  [(path) => path === adminPath('/admin/upstream/suppliers'), routeModules.adminSuppliers],
  [
    (path) => path === adminPath('/admin/upstream/products'),
    routeModules.adminUpstreamProducts,
  ],
  [
    (path) => path === adminPath('/admin/upstream/orders'),
    routeModules.adminUpstreamOrders,
  ],
  [
    (path) => path.startsWith(adminPath('/admin/marketing/groupbuy/')),
    routeModules.adminGroupBuy,
  ],
  [
    (path) => path.startsWith(adminPath('/admin/marketplace')),
    routeModules.adminMarketplace,
  ],
  [(path) => path.startsWith(adminPath('/admin/points')), routeModules.adminPoints],
  [(path) => path.startsWith(adminPath('/admin/cdnsell')), routeModules.adminCdnsell],
  [(path) => path.startsWith(adminPath('/admin/marketing/')), routeModules.adminMarketing],
  [
    (path) => path === adminPath('/admin/tickets') || /^\/dd-admin-[a-z0-9]{24,64}\/tickets\/\d+$/.test(path),
    routeModules.adminTickets,
  ],
  [
    (path) =>
      [
        adminPath('/admin/tickets/types'),
        adminPath('/admin/tickets/statuses'),
        adminPath('/admin/tickets/prereplies'),
      ].includes(path),
    routeModules.adminTicketConfig,
  ],
  [
    (path) => path === "/sales" || path === "/sales/customers",
    routeModules.salesHome,
  ],
];

const prefetchedRoutes = new Map<() => Promise<unknown>, Promise<unknown>>();

export function prefetchRoute(target: string): Promise<unknown> {
  const path = new URL(target, window.location.origin).pathname;
  const loader = routeLoaders.find(([test]) => test(path))?.[1];
  if (!loader) return Promise.resolve();
  const existing = prefetchedRoutes.get(loader);
  if (existing) return existing;
  const pending = loader().catch(() => {
    prefetchedRoutes.delete(loader);
    // Optional prefetch must not reject an unobserved event-handler promise.
    return undefined;
  });
  prefetchedRoutes.set(loader, pending);
  return pending;
}
