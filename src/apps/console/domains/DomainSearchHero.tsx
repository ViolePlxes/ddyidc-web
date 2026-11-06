import { Badge, Banner, Button } from "@cloudflare/kumo";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { domainsApi, type DomainOperation } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";

const suffixes = [".com", ".cn", ".net", ".org", ".io", ".xyz", ".top"];
type SearchRow = { suffix: string; name: string; available: boolean; price?: string; renew?: string };

export function DomainSearchHero({ operation, onRegister }: { operation?: DomainOperation; onRegister: (params: Record<string, string>) => void }) {
  const [prefix, setPrefix] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(prefix.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")), 350);
    return () => clearTimeout(timer);
  }, [prefix]);
  const enabled = query.length >= 2 && Boolean(operation);
  const search = useQuery({
    queryKey: ["domains", "search", query],
    enabled,
    staleTime: 30_000,
    retry: false,
    queryFn: async (): Promise<SearchRow[]> => {
      const availability = await domainsApi.execute({ action: "3.1", params: { domain: query, suffix: suffixes.join(",") }, requestId: crypto.randomUUID(), confirmed: true });
      const items = Array.isArray(availability.data) ? availability.data as { name?: string; avail?: number }[] : [];
      const prices = await Promise.all(suffixes.map(async (suffix) => {
        try {
          const result = await domainsApi.execute({ action: "1.1", params: { value: `${query}${suffix}`, year: "1" }, requestId: crypto.randomUUID(), confirmed: true });
          const data = (result.data ?? {}) as { amount?: string; renewAmount?: string };
          return [suffix, data] as const;
        } catch { return [suffix, null] as const; }
      }));
      return suffixes.map((suffix) => {
        const name = `${query}${suffix}`;
        const found = items.find((item) => item.name === name);
        const price = prices.find(([value]) => value === suffix)?.[1];
        return { suffix, name, available: found?.avail === 1, price: price?.amount, renew: price?.renewAmount };
      }).sort((a, b) => Number(a.available) - Number(b.available));
    },
  });
  return <div className="grid min-h-[70vh] content-start justify-items-center pt-[12vh]">
    <div className="w-full max-w-5xl">
      <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight text-kumo-strong">开启您的域名之旅</h1>
      <div className="overflow-hidden rounded-2xl bg-kumo-elevated p-1.5 shadow-md ring ring-kumo-hairline">
        <div className="flex h-10 items-center gap-3 rounded-xl bg-kumo-control px-3 shadow-md">
          <MagnifyingGlassIcon size={18} className="shrink-0 text-kumo-subtle" aria-hidden />
          <input aria-label="搜索域名" className="h-10 min-w-0 flex-1 bg-transparent text-sm text-kumo-default outline-none placeholder:text-kumo-subtle" placeholder="输入域名前缀，查看所有后缀与价格…" value={prefix} onChange={(event) => setPrefix(event.target.value)} />
          {prefix ? <button type="button" className="shrink-0 text-xs text-kumo-subtle hover:text-kumo-default" onClick={() => setPrefix("")}>清除</button> : <span className="flex shrink-0 items-center gap-1" aria-hidden="true"><kbd className="border border-kumo-line bg-kumo-canvas px-1 text-xs font-normal text-kumo-subtle">Ctrl</kbd><kbd className="border border-kumo-line bg-kumo-canvas px-1 text-xs font-normal text-kumo-subtle">K</kbd></span>}
        </div>
      </div>
      {enabled ? <div className="mt-3 overflow-hidden rounded-2xl bg-kumo-elevated p-2 shadow-lg ring ring-kumo-hairline">
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-kumo-subtle"><span>“{query}” 的匹配结果</span><span>可注册优先 · 实时价</span></div>
        {search.isLoading ? <p className="px-3 py-6 text-sm text-kumo-subtle">正在查询可用后缀与价格…</p> : null}
        {search.error ? <Banner variant="error" title={getApiMessage(search.error)} /> : null}
        {search.data ? <div className="grid">{search.data.map((item) => <div key={item.suffix} className="grid grid-cols-[minmax(0,1fr)_9rem_4.5rem] items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-kumo-fill">
          <div className="flex min-w-0 items-center gap-2"><span className="truncate text-sm font-medium text-kumo-strong">{item.name}</span><Badge variant={item.available ? "success" : "neutral"}>{item.available ? "可注册" : "已注册"}</Badge></div>
          <div className="text-right text-xs leading-5 text-kumo-subtle"><span className="block">首年 {item.price !== undefined ? `¥${item.price}` : "—"}</span><span className="block">续费 {item.renew !== undefined ? `¥${item.renew}` : "—"}</span></div>
          <div className="justify-self-end"><Button size="sm" variant={item.available ? "primary" : "ghost"} disabled={!item.available} onClick={() => onRegister({ domain: item.name, regyear: "1" })}>{item.available ? "注册" : "查看"}</Button></div>
        </div>)}</div> : null}
      </div> : null}
      {!enabled && prefix ? <p className="mt-3 text-center text-xs text-kumo-subtle">再输入 {2 - query.length} 个字符即可查询</p> : null}
    </div>
  </div>;
}
