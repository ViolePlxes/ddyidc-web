import { Button, DropdownMenu, Sidebar, Surface } from "@cloudflare/kumo";
import {
  CaretDownIcon,
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

  return (
    <Sidebar.Provider
      defaultOpen
      defaultWidth={260}
      minWidth={260}
      maxWidth={260}
      className="h-svh max-h-svh overflow-hidden"
    >
      <Sidebar>
        <Sidebar.Header>
          <span className="grid size-8 place-items-center bg-kumo-brand text-base font-semibold text-kumo-badge-inverted">
            D
          </span>
          <span className="truncate text-base font-semibold text-kumo-strong group-data-[state=collapsed]/sidebar:hidden">
            DDYIDC
          </span>
        </Sidebar.Header>
        <Sidebar.Content>
          {groups.map((group) => (
            <Sidebar.Group key={group.label}>
              <Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
              <Sidebar.Menu>
                {group.items.map((item) => (
                  <Sidebar.MenuButton
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    tooltip={item.label}
                    active={
                      location.pathname === item.href ||
                      (!["/console", "/admin", "/sales"].includes(item.href) &&
                        location.pathname.startsWith(`${item.href}/`))
                    }
                  >
                    {item.label}
                  </Sidebar.MenuButton>
                ))}
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
          className={`z-10 flex shrink-0 items-center gap-3 border-b border-kumo-line px-4 ${density === "compact" ? "h-[52px]" : "h-[58px]"}`}
        >
          <Sidebar.Trigger className="md:hidden" />
          <SearchPalette items={searchItems} />
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
