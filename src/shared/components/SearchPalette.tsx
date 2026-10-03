import { Banner, Button, CommandPalette, Sidebar } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { getConsoleSearch } from "../api/consoleHome";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface SearchItem {
  id: string;
  title: string;
  path: string;
  group: string;
}

interface SearchGroup {
  label: string;
  items: SearchItem[];
}

export function SearchPalette({
  items,
  placement = "topbar",
  customer = false,
}: {
  items: SearchItem[];
  placement?: "topbar" | "sidebar";
  customer?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const resources = useQuery({ queryKey: ["console", "search"], queryFn: getConsoleSearch, enabled: customer && open, staleTime: 60_000 });
  const groups = useMemo<SearchGroup[]>(() => {
    const filtered = [...items, ...(customer ? resources.data ?? [] : [])].filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase()),
    );
    return [...new Set(filtered.map((item) => item.group))].map((label) => ({
      label,
      items: filtered.filter((item) => item.group === label),
    }));
  }, [items, query, customer, resources.data]);
  const select = (item: SearchItem) => {
    navigate(item.path, { viewTransition: true });
    setOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const openPalette = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", openPalette);
    const trigger = () => setOpen(true);
    window.addEventListener("ddyidc:open-search", trigger);
    return () => {
      document.removeEventListener("keydown", openPalette);
      window.removeEventListener("ddyidc:open-search", trigger);
    };
  }, []);

  return (
    <>
      {placement === "sidebar" ? (
        <Sidebar.Group>
          <Sidebar.Menu>
            <Sidebar.MenuButton
              icon={MagnifyingGlassIcon}
              tooltip="快速搜索"
              className={`mb-3 ring ring-kumo-line transition-[margin] duration-(--sidebar-animation-duration) group-data-[state=collapsed]/sidebar:mb-0 group-data-[state=collapsed]/sidebar:ring-transparent ${customer ? "hover:ring-kumo-focus/25 focus-visible:ring-kumo-focus/25" : ""}`}
              onClick={() => setOpen(true)}
            >
              快速搜索…
            </Sidebar.MenuButton>
          </Sidebar.Menu>
        </Sidebar.Group>
      ) : (
        <Button
          variant={customer ? "outline" : "secondary"}
          className={`max-w-xl flex-1 justify-start text-kumo-subtle ${customer ? "hover:bg-kumo-tint" : ""}`}
          icon={<MagnifyingGlassIcon />}
          onClick={() => setOpen(true)}
        >
          搜索资源、订单和设置…
        </Button>
      )}
      <CommandPalette.Root<SearchGroup, SearchItem>
        open={open}
        onOpenChange={setOpen}
        items={groups}
        value={query}
        onValueChange={setQuery}
        itemToStringValue={(group) => group.label}
        getSelectableItems={(current) =>
          current.flatMap((group) => group.items)
        }
        onSelect={(item) => select(item)}
      >
        <CommandPalette.Input placeholder={customer ? "搜索页面、产品、服务和工单…" : "搜索页面…"} />
        {customer && resources.isFetching ? <p role="status" className="p-3">正在读取产品、服务和工单…</p> : null}
        {customer && resources.error ? <Banner variant="error" title="资源搜索加载失败，仍可搜索菜单" action={<Button variant="secondary" onClick={() => void resources.refetch()}>重试</Button>} /> : null}
        <CommandPalette.List>
          <CommandPalette.Results>
            {(group: SearchGroup) => (
              <CommandPalette.Group key={group.label} items={group.items}>
                <CommandPalette.GroupLabel>
                  {group.label}
                </CommandPalette.GroupLabel>
                <CommandPalette.Items>
                  {(item: SearchItem) => (
                    <CommandPalette.ResultItem
                      key={item.id}
                      title={item.title}
                      breadcrumbs={[item.group]}
                      value={item}
                      icon={<MagnifyingGlassIcon />}
                      onClick={() => select(item)}
                    />
                  )}
                </CommandPalette.Items>
              </CommandPalette.Group>
            )}
          </CommandPalette.Results>
          <CommandPalette.Empty>未找到匹配页面</CommandPalette.Empty>
        </CommandPalette.List>
        <CommandPalette.Footer>
          <span>↑↓ 选择</span>
          <span>Enter 打开</span>
        </CommandPalette.Footer>
      </CommandPalette.Root>
    </>
  );
}
