import { Button, DropdownMenu, Sidebar, Surface } from "@cloudflare/kumo";
import {
  CaretDownIcon,
  CaretUpDownIcon,
  CubeIcon,
  HouseIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { useLocation } from "react-router-dom";
import { SearchPalette } from "../shared/components/SearchPalette";
import { RouteOutlet } from "../shared/router/RouteOutlet";
import type { AuthUser } from "../shared/types/auth";

export interface NavigationItem {
  label: string;
  href: string;
  icon: typeof HouseIcon;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export function DashboardLayout({
  user,
  groups,
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
  const location = useLocation();
  const searchItems = groups.flatMap((group) =>
    group.items.map((item) => ({
      id: item.href,
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
    (!["/console", "/admin", "/sales"].includes(href) &&
      location.pathname.startsWith(`${href}/`));

  return (
    <Sidebar.Provider
      defaultOpen
      peekable
      className="h-svh max-h-svh overflow-hidden"
    >
      <Sidebar aria-label="主导航" className="font-sans leading-[normal] tracking-normal antialiased">
        <Sidebar.Header>
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={
                <button
                  type="button"
                  aria-label="账户菜单"
                  className="flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-kumo-default transition-[padding] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) outline-none hover:bg-kumo-tint focus-visible:ring-1 focus-visible:ring-kumo-line"
                >
                  <CubeIcon className="size-4 shrink-0 text-kumo-brand" weight="duotone" />
                  <span className="flex min-w-0 flex-1 items-center overflow-hidden text-left">DDYIDC</span>
                  <span className="w-4 shrink-0 overflow-hidden transition-[width] duration-(--sidebar-animation-duration) ease-(--sidebar-easing) group-data-[state=collapsed]/sidebar:w-0">
                    <CaretUpDownIcon className="size-4 text-kumo-subtle" />
                  </span>
                </button>
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
          <SearchPalette items={searchItems} placement="sidebar" />
          {groups.map((group) => (
            <Sidebar.Group key={group.label}>
              <Sidebar.Menu>
                <Sidebar.MenuItem>
                  <Sidebar.Collapsible
                    key={`${group.label}:${location.pathname}`}
                    defaultOpen={group.items.some((item) => isItemActive(item.href))}
                    autoScrollOnOpen
                  >
                    <Sidebar.CollapsibleTrigger
                      render={
                        <Sidebar.MenuButton icon={group.items[0]?.icon} tooltip={group.label}>
                          {group.label}
                          <Sidebar.MenuChevron />
                        </Sidebar.MenuButton>
                      }
                    />
                    <Sidebar.CollapsibleContent>
                      <Sidebar.MenuSub>
                        {group.items.map((item) => (
                          <Sidebar.MenuSubButton
                            key={item.href}
                            href={item.href}
                            active={isItemActive(item.href)}
                            aria-current={isItemActive(item.href) ? "page" : undefined}
                          >
                            {item.label}
                          </Sidebar.MenuSubButton>
                        ))}
                      </Sidebar.MenuSub>
                    </Sidebar.CollapsibleContent>
                  </Sidebar.Collapsible>
                </Sidebar.MenuItem>
              </Sidebar.Menu>
            </Sidebar.Group>
          ))}
        </Sidebar.Content>
        <Sidebar.Footer>
          <Sidebar.Trigger />
        </Sidebar.Footer>
      </Sidebar>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-kumo-recessed">
        <Surface
          data-dashboard-topbar
          className="z-10 flex h-[58px] shrink-0 items-center justify-end gap-3 border-b border-kumo-line px-4"
        >
          <Sidebar.Trigger className="md:hidden" />
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={<Button variant="secondary" icon={<UserCircleIcon />} />}
            >
              {user.name}
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
          <div
            className={`mx-auto w-full max-w-7xl ${density === "compact" ? "p-3 md:p-4 lg:p-5" : "p-4 md:p-6 lg:p-8"}`}
          >
            <RouteOutlet className={`grid ${density === "compact" ? "gap-4" : "gap-6"}`} />
          </div>
        </main>
      </div>
    </Sidebar.Provider>
  );
}
