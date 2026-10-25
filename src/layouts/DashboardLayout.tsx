import { LegalDocumentDialog } from "../shared/components/LegalDocumentDialog";
import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { broadcastApi } from "../shared/api/notifications";
import { MessageButton } from "../shared/components/notifications/MessageButton";
import { adminPath } from "../shared/utils/adminEntry";
import { TodoCountBadge } from "../shared/components/TodoCountBadge";
import { useNavigation } from "../shared/hooks/useNavigation";
import { Banner } from "@cloudflare/kumo";
import { useTheme } from "../shared/hooks/useTheme";
import { useLayoutWidth } from "../shared/hooks/useLayoutWidth";
import { LayoutWidthToggle } from "../shared/components/LayoutWidthToggle";
import { Button, DropdownMenu, LinkButton, Link as KumoLink, Sidebar, Surface } from "@cloudflare/kumo";
import {
  BellIcon,
  MoonIcon,
  SunIcon,
  CaretDownIcon,
  CaretUpDownIcon,
  CubeIcon,
  CreditCardIcon,
  HouseIcon,
  SignOutIcon,
  UserCircleIcon,
  QuestionIcon,
} from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import { SearchPalette } from "../shared/components/SearchPalette";
import { RouteOutlet } from "../shared/router/RouteOutlet";
import type { AuthUser } from "../shared/types/auth";

export interface NavigationItem {
  children?: NavigationItem[];
  badge?: string;
  id?: string; target?: "_blank";
  label: string;
  href: string;
  icon: typeof HouseIcon;
}

export interface NavigationGroup {
  badge?: string;
  id?: string; icon?: typeof HouseIcon;
  label: string;
  items: NavigationItem[];
}

const navigationCategories: Record<string, string> = {
  待办事项: "业务管理",
  概览: "业务管理",
  商品管理: "业务管理",
  上下游: "业务管理",
  域名服务: "服务管理",
  产品与服务: "服务管理",
  资源与账单: "服务管理",
  "CDN 加速": "服务管理",
  CDN加速: "服务管理",
  技术支持: "支持与设置",
  账户: "账户与权益",
  积分中心: "账户与权益",
  福利中心: "账户与权益",
  营销中心: "运营管理",
  交易市场: "运营管理",
  客户服务: "支持与设置",
  系统设置: "支持与设置",
  销售中心: "销售管理",
};

export function DashboardLayout({
  user,
  groups: availableGroups,
  signOut,
  loginPath,
  density = "comfortable",
  profileHref,
}: {
  user: AuthUser;
  groups: NavigationGroup[];
  signOut: () => Promise<void>;
  loginPath: string;
  density?: "comfortable" | "compact";
  profileHref?: string;
}) {
  const scope = user.role === "admin" ? "admin" : user.role === "sales" ? "sales" : "console";
  const navigation = useNavigation(scope, availableGroups);

  const messagePermissions = useQuery({queryKey:['notification-permissions',user.id],queryFn:broadcastApi.permissions,enabled:scope==='admin',retry:false,refetchOnWindowFocus:false});
  const groups = navigation.groups.map(group=>({...group,items:[...group.items]}));
  if(scope==='admin'){
    const href=adminPath('/admin/messages/broadcasts');
    for(const group of groups)group.items=group.items.filter(item=>item.href!==href);
    if(messagePermissions.data?.view){const item={label:'站内消息群发',href,icon:BellIcon};const group=groups.find(group=>group.label==='客户服务');if(group)group.items.push(item);else groups.push({label:'客户服务',items:[item]})}
  }

  if (scope === "console" && !groups.some(group => group.items.some(item => item.href === "/wallet/recharge"))) {
    const rechargeItem = { label: "账户充值", href: "/wallet/recharge", icon: CreditCardIcon };
    const billingIndex = groups.findIndex(group => group.label === "资源与账单");
    const billing = groups[billingIndex];
    if (billing) {
      groups[billingIndex] = { ...billing, items: [...billing.items, rechargeItem] };
    } else if (navigation.isSuccess) {
      groups.push({ label: "资源与账单", items: [rechargeItem] });
    }
  }
  const location = useLocation();
  const requestedReturn: unknown = (location.state as { todoReturn?: unknown } | null)?.todoReturn;
  const todoReturn = location.pathname.startsWith(adminPath('/admin/')) && typeof requestedReturn === "string" && /^\/dd-admin-[a-z0-9]{24,64}\/todos(?:\/[a-z-]+)?(?:\?[^#]*)?$/.test(requestedReturn) ? requestedReturn : null;
  const { theme, toggleTheme } = useTheme();
  const layoutWidth = useLayoutWidth(user);
  const isProductCatalog = location.pathname.replace(/\/$/, "") === "/console/products";
  const contentWidth = isProductCatalog ? "wide" : layoutWidth.width;
  const contentContainerClassName = isProductCatalog ? "w-full" : layoutWidth.containerClassName;
  const standalonePaths = ["/console", "/console/products", adminPath('/admin')];
  const topItems = groups.flatMap((group) => group.items)
    .filter((item) => standalonePaths.includes(item.href))

    ;
  const categorizedGroups: [string, NavigationGroup[]][] = [];
  for (const group of groups) {
    const items = group.items.filter((item) => !standalonePaths.includes(item.href));
    if (!items.length) continue;
    const category = navigationCategories[group.label] ?? "更多服务";
    const last = categorizedGroups.at(-1);
    if (last?.[0] === category) last[1].push({ ...group, items });
    else categorizedGroups.push([category, [{ ...group, items }]]);
  }
  const searchItems = groups.flatMap((group) =>
    group.items.flatMap(item=>item.children?.length?item.children:[item]).map((item) => ({
      id: item.id ?? item.href,
      title: item.label,
      path: item.href,
      group: group.label,
    })),
  );

  const handleSignOut = async () => {
    await signOut();
    window.location.replace(loginPath);
  };

  const isItemActive = (href: string) =>
    location.pathname === href ||
    (!["/console", adminPath('/admin'), "/sales"].includes(href) &&
      location.pathname.startsWith(`${href}/`));

  return (
    <Sidebar.Provider
      style={{ "--sidebar-bg": "var(--color-kumo-canvas)" } as CSSProperties}
      defaultOpen
      peekable
      className="h-svh max-h-svh overflow-hidden font-sans"
    >
      <Sidebar aria-label="主导航" className="antialiased bg-kumo-canvas">
        <Sidebar.Header className="h-[58px] shrink-0 justify-center border-b border-kumo-line">
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={
                <Button
                  variant="ghost"
                  type="button"
                  aria-label="账户菜单"
                  className="flex w-full min-w-0 items-center justify-start gap-2 text-left"
                >
                  <CubeIcon className="size-4 shrink-0 text-kumo-brand" weight="duotone" />
                  <span className="flex min-w-0 flex-1 items-center overflow-hidden text-left">ddoidc.com</span>
                  <span className="w-4 shrink-0 overflow-hidden transition-[width] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) group-data-[state=collapsed]/sidebar:w-0">
                    <CaretUpDownIcon className="size-4 text-kumo-subtle" />
                  </span>
                </Button>
              }
            />
            <DropdownMenu.Content className="w-(--anchor-width)">
              <DropdownMenu.Group>
                <DropdownMenu.Label>{user.name} · {user.account}</DropdownMenu.Label>
                {profileHref ? (
                  <DropdownMenu.LinkItem href={profileHref} icon={<UserCircleIcon />}>
                    个人中心
                  </DropdownMenu.LinkItem>
                ) : null}
              </DropdownMenu.Group>
              <DropdownMenu.Separator />
              <DropdownMenu.Item icon={<SignOutIcon />} variant="danger" onClick={() => void handleSignOut()}>
                退出登录
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </Sidebar.Header>
        <Sidebar.Content>
          {navigation.isError && <Banner variant="error" title="导航读取失败" description="请刷新页面重试" />}
          <SearchPalette items={searchItems} placement="sidebar" customer={user.role === "customer"} />
          {topItems.length > 0 && (
            <Sidebar.Group>
              <Sidebar.Menu>
                {topItems.map((item) => (
                  <Sidebar.MenuButton key={item.id ?? item.href} href={item.href} target={item.target} rel={item.target ? "noopener noreferrer" : undefined} icon={item.icon}
                    tooltip={item.label} active={isItemActive(item.href)}
                    aria-current={isItemActive(item.href) ? "page" : undefined}>
                    {item.label}
                  </Sidebar.MenuButton>
                ))}
              </Sidebar.Menu>
            </Sidebar.Group>
          )}
          {categorizedGroups.map(([category, categoryGroups], categoryIndex) => (
            <Sidebar.Group key={`${category}:${categoryIndex}`}>
              <Sidebar.GroupLabel>{category}</Sidebar.GroupLabel>
              <Sidebar.Menu>
                {categoryGroups.map((group) => (
                <Sidebar.MenuItem key={group.id ?? group.label}>
                  <Sidebar.Collapsible
                    key={`${group.id ?? group.label}:${location.pathname}`}
                    defaultOpen={group.items.some((item) => isItemActive(item.href))}
                    autoScrollOnOpen
                  >
                    <Sidebar.CollapsibleTrigger
                      render={
                        <Sidebar.MenuButton icon={group.icon ?? group.items[0]?.icon} tooltip={group.label}>
                          {group.label}
                          {group.badge !== undefined && <TodoCountBadge count={group.badge} className="ml-auto shrink-0" />}
                          <Sidebar.MenuChevron />
                        </Sidebar.MenuButton>
                      }
                    />
                    <Sidebar.CollapsibleContent>
                      <Sidebar.MenuSub>
                        {group.items.map((item) => item.children?.length ? (
                          <Sidebar.MenuItem key={item.id ?? item.href}>
                            <Sidebar.Collapsible key={`${item.href}:${location.pathname}`} defaultOpen={item.children.some(child=>isItemActive(child.href))}>
                              <Sidebar.CollapsibleTrigger render={<Sidebar.MenuSubButton active={item.children.some(child=>isItemActive(child.href))}><item.icon className="mr-2 size-4 shrink-0" />{item.label}<Sidebar.MenuChevron /></Sidebar.MenuSubButton>} />
                              <Sidebar.CollapsibleContent><Sidebar.MenuSub>{item.children.map(child=><Sidebar.MenuSubButton key={child.href} href={child.href} active={location.pathname===child.href} aria-current={location.pathname===child.href?"page":undefined}>{child.label}</Sidebar.MenuSubButton>)}</Sidebar.MenuSub></Sidebar.CollapsibleContent>
                            </Sidebar.Collapsible>
                          </Sidebar.MenuItem>
                        ) : (
                          <Sidebar.MenuSubButton key={item.id ?? item.href} href={item.href} target={item.target} rel={item.target ? "noopener noreferrer" : undefined} active={isItemActive(item.href)} aria-current={isItemActive(item.href) ? "page" : undefined}>
                            <item.icon className="mr-2 size-4 shrink-0" />{item.label}{item.badge !== undefined && <TodoCountBadge count={item.badge} className="ml-auto shrink-0" />}
                          </Sidebar.MenuSubButton>
                        ))}
                      </Sidebar.MenuSub>
                    </Sidebar.CollapsibleContent>
                  </Sidebar.Collapsible>
                </Sidebar.MenuItem>
                ))}
              </Sidebar.Menu>
            </Sidebar.Group>
          ))}
        </Sidebar.Content>
        <Sidebar.Footer className="h-12 shrink-0 justify-center border-t border-kumo-line bg-kumo-canvas">
          <Sidebar.Trigger />
        </Sidebar.Footer>
      </Sidebar>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-kumo-canvas">
        <Surface
          data-dashboard-topbar
          className="bg-kumo-canvas shadow-none ring-0 z-10 flex h-[58px] shrink-0 items-center justify-end gap-1 border-b border-kumo-line px-2 sm:gap-3 sm:px-4"
        >
          <Sidebar.Trigger className="md:hidden" />
          {scope === "console" && <MessageButton />}
          <LayoutWidthToggle {...layoutWidth} />
          <Button variant="ghost" shape="square" aria-label={theme === "dark" ? "切换到白天模式" : "切换到黑夜模式"} icon={theme === "dark" ? <SunIcon /> : <MoonIcon />} onClick={toggleTheme} />
          {scope === "console" ? <LinkButton href="/console/help" aria-label="工单支持" variant="ghost" size="sm" icon={<QuestionIcon size={16} />}><span className="hidden sm:inline">工单支持</span></LinkButton> : null}
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={<Button variant="secondary" icon={<UserCircleIcon />} />}
            >
              <span className="max-w-28 truncate sm:max-w-none">{user.name}</span>
              <CaretDownIcon />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Group>
                <DropdownMenu.Label>
                {user.account}
                </DropdownMenu.Label>
                {profileHref ? (
                  <DropdownMenu.LinkItem
                    href={profileHref}
                    icon={<UserCircleIcon />}
                  >
                    个人中心
                  </DropdownMenu.LinkItem>
                ) : null}
              </DropdownMenu.Group>
              <DropdownMenu.Separator />
              {scope === "console" ? <DropdownMenu.Item icon={<CaretUpDownIcon />} onClick={() => window.location.assign("/login?switchAccount=1")}>
                切换账号
              </DropdownMenu.Item> : null}
              <DropdownMenu.Item
                icon={<SignOutIcon />}
                variant="danger"
                onClick={() => void handleSignOut()}
              >
                退出登录
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </Surface>
        <main className="min-h-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]" data-dashboard-scroll>
         <div className="flex min-h-full flex-col">
          <div
            data-layout-width={contentWidth}
            className={`flex-1 ${contentContainerClassName} ${density === "compact" ? "p-3 md:p-4 lg:p-5" : "p-4 md:p-6 lg:p-8"}`}
          >
            {todoReturn ? <div className="mb-3"><Link to={todoReturn}><Button variant="secondary">返回待办列表</Button></Link></div> : null}
            <RouteOutlet className={`grid ${density === "compact" ? "gap-4" : "gap-6"}`} />
          </div>
        <footer className="flex h-12 shrink-0 items-center justify-center gap-4 overflow-x-auto border-t border-kumo-line bg-kumo-canvas px-4 text-sm whitespace-nowrap" aria-label="平台页脚">
          <KumoLink href="https://docs.ddoidc.com" variant="current">支持</KumoLink>
          <span aria-hidden="true" className="text-kumo-subtle">|</span>
          <LegalDocumentDialog kind="service" label="服务条款"/>
          <span aria-hidden="true" className="text-kumo-subtle">|</span>
          <LegalDocumentDialog kind="privacy" label="隐私政策"/>
          <span className="text-kumo-subtle">© {new Date().getFullYear()} ddoidc.com</span>
        </footer>
         </div>
        </main>
      </div>
    </Sidebar.Provider>
  );
}
