import { Badge, Banner, Button } from "@cloudflare/kumo";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { domainsApi, type DomainOperation } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";

const catalog = [...new Set([".com", ".cn", ".net", ".top", ".xyz", ".vip", ".cc", ".club", ".shop", ".store", ".site", ".online", ".info", ".biz", ".pro", ".me", ".co", ".tv", ".tech", ".ltd", ".wang", ".ren", ".ink", ".work", ".live", ".life", ".cloud", ".art", ".design", ".studio", ".space", ".website", ".host", ".press", ".media", ".news", ".blog", ".link", ".click", ".chat", ".city", ".company", ".center", ".cafe", ".fun", ".games", ".global", ".group", ".world", ".zone", ".today", ".team", ".run", ".show", ".social", ".school", ".sale", ".rent", ".red", ".plus", ".pet", ".pink", ".pub", ".pw", ".mobi", ".mba", ".luxe", ".love", ".law", ".kim", ".icu", ".help", ".hair", ".guru", ".gold", ".green", ".fund", ".fyi", ".fit", ".fans", ".fan", ".email", ".cool", ".college", ".cash", ".bond", ".blue", ".black", ".bio", ".beer", ".beauty", ".band", ".baby", ".autos", ".asia", ".hk", ".gov.cn", ".xin", ".yoga", ".yachts", ".wiki", ".vin", ".video", ".uno", ".tax", ".skin", ".quest", ".organic", ".motorcycles", ".monster", ".makeup", ".homes", ".cyou", ".boats"])];
const PAGE_SIZE = 20;
type SearchRow = { suffix: string; name: string; available: boolean; price?: string; renew?: string };

export function DomainSearchHero({ operation, onRegister }: { operation?: DomainOperation; onRegister: (params: Record<string, string>) => void }) {
  const [prefix, setPrefix] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useRef(0);
  const loaded = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(prefix.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")), 350);
    return () => clearTimeout(timer);
  }, [prefix]);
  const load = useCallback(async (start: number, term: string, run: number) => {
    const suffixes = catalog.slice(start, start + PAGE_SIZE);
    if (!suffixes.length) return;
    setLoading(true);
    setError(null);
    try {
      const availability = await domainsApi.execute({ action: "3.1", params: { domain: term, suffix: suffixes.join(",") }, requestId: crypto.randomUUID(), confirmed: true });
      if (run !== token.current) return;
      const items = Array.isArray(availability.data) ? availability.data as { name?: string; avail?: number }[] : [];
      const prices = await Promise.all(suffixes.map(async (suffix) => {
        try {
          const result = await domainsApi.execute({ action: "1.1", params: { value: `${term}${suffix}`, year: "1" }, requestId: crypto.randomUUID(), confirmed: true });
          const data = (result.data ?? {}) as { amount?: string; renewAmount?: string };
          return [suffix, data] as const;
        } catch { return [suffix, null] as const; }
      }));
      if (run !== token.current) return;
      const batch = suffixes.map((suffix) => {
        const name = `${term}${suffix}`;
        const price = prices.find(([value]) => value === suffix)?.[1];
        return { suffix, name, available: items.find((item) => item.name === name)?.avail === 1, price: price?.amount, renew: price?.renewAmount };
      }).sort((a, b) => Number(a.available) - Number(b.available));
      setRows((current) => [...current, ...batch]);
      loaded.current = start + suffixes.length;
    } catch (cause) {
      if (run === token.current) setError(getApiMessage(cause));
    } finally {
      if (run === token.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    token.current += 1;
    loaded.current = 0;
    setRows([]);
    setError(null);
    if (query.length >= 2 && operation) void load(0, query, token.current);
  }, [query, operation, load]);
  const loadMore = () => {
    if (loading || !operation || query.length < 2 || loaded.current >= catalog.length) return;
    void load(loaded.current, query, token.current);
  };
  return <div className="grid min-h-[70vh] content-start justify-items-center pt-[10vh]">
    <div className="w-full max-w-5xl">
      <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight text-kumo-strong">开启您的域名之旅</h1>
      <div className="overflow-hidden rounded-2xl bg-kumo-elevated p-1.5 ring ring-kumo-hairline">
        <div className="flex h-10 items-center gap-3 rounded-xl bg-kumo-control px-3 shadow-md">
          <MagnifyingGlassIcon size={18} className="shrink-0 text-kumo-subtle" aria-hidden />
          <input aria-label="搜索域名" className="h-10 min-w-0 flex-1 bg-transparent text-sm text-kumo-default outline-none placeholder:text-kumo-subtle" placeholder="输入域名前缀，查看主流后缀与价格…" value={prefix} onChange={(event) => setPrefix(event.target.value)} />
          {prefix ? <button type="button" className="shrink-0 text-xs text-kumo-subtle hover:text-kumo-default" onClick={() => setPrefix("")}>清除</button> : <span className="flex shrink-0 items-center gap-1" aria-hidden="true"><kbd className="border border-kumo-line bg-kumo-canvas px-1 text-xs font-normal text-kumo-subtle">Ctrl</kbd><kbd className="border border-kumo-line bg-kumo-canvas px-1 text-xs font-normal text-kumo-subtle">K</kbd></span>}
        </div>
      </div>
      {query.length >= 2 ? <div className="mt-3 overflow-hidden rounded-2xl bg-kumo-elevated shadow-lg ring ring-kumo-hairline">
        <div className="flex items-center justify-between px-4 py-2.5 text-xs text-kumo-subtle"><span>“{query}” 的匹配结果</span><span>主流优先 · 下滑加载更多</span></div>
        {error ? <div className="px-3 pb-2"><Banner variant="error" title={error} /></div> : null}
        <div className="max-h-[58vh] overflow-y-auto px-2 pb-2" onScroll={(event) => { const el = event.currentTarget; if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) loadMore(); }}>
          {rows.map((item) => <div key={item.suffix} className="grid grid-cols-[minmax(0,1fr)_9rem_4.5rem] items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-kumo-fill">
            <div className="flex min-w-0 items-center gap-2 self-center"><span className="truncate text-sm font-medium leading-none text-kumo-strong">{item.name}</span><Badge variant={item.available ? "success" : "neutral"} className="shrink-0">{item.available ? "可注册" : "已注册"}</Badge></div>
            <div className="text-right text-xs leading-5 text-kumo-subtle"><span className="block">首年 {item.price ? `¥${item.price}` : "—"}</span><span className="block">续费 {item.renew ? `¥${item.renew}` : "—"}</span></div>
            <div className="justify-self-end"><Button size="sm" variant={item.available ? "primary" : "ghost"} disabled={!item.available} onClick={() => onRegister({ domain: item.name, regyear: "1" })}>{item.available ? "注册" : "查看"}</Button></div>
          </div>)}
          {loading ? <p className="py-4 text-center text-xs text-kumo-subtle">正在查询后缀与价格…</p> : <p className="py-3 text-center text-xs text-kumo-subtle">{loaded.current >= catalog.length ? `已显示全部 ${catalog.length} 个后缀` : "继续下滑加载更多"}</p>}
        </div>
      </div> : null}
      {query.length < 2 && prefix ? <p className="mt-3 text-center text-xs text-kumo-subtle">再输入 {2 - query.length} 个字符即可查询</p> : null}
    </div>
  </div>;
}
