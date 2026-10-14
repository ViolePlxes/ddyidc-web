import { useQuery } from '@tanstack/react-query';

export type LedgerDirection = 'all' | 'increase' | 'decrease';
interface PrefetchedLedgerOptions<T> {
  scope: readonly unknown[];
  page: number;
  direction: LedgerDirection;
  load: (direction: LedgerDirection, page: number, snapshot: number | undefined, signal: AbortSignal) => Promise<T>;
  version: (data: T) => number;
  enabled?: boolean;
}

/** Keep three independently paged views on one account snapshot. Tabs never fetch. */
export function usePrefetchedLedger<T>({ scope, page, direction, load, version, enabled = true }: PrefetchedLedgerOptions<T>) {
  const common = {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false as const,
    retry: 1,
  };
  const bundle = useQuery({
    ...common,
    queryKey: [...scope, 'prefetched-pages'],
    enabled,
    refetchOnMount: 'always',
    queryFn: async ({ signal }) => {
      const all = await load('all', 1, undefined, signal);
      const snapshot = version(all);
      if (!Number.isSafeInteger(snapshot) || snapshot < 0) throw new Error('流水快照无效，请刷新重试');
      const [increase, decrease] = await Promise.all([
        load('increase', 1, snapshot, signal),
        load('decrease', 1, snapshot, signal),
      ]);
      if (version(increase) !== snapshot || version(decrease) !== snapshot) throw new Error('流水快照不一致，请刷新重试');
      return { all, increase, decrease };
    },
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === scope[2] ? previous : undefined,
  });
  const snapshot = bundle.data ? version(bundle.data.all) : undefined;
  const more = useQuery({
    ...common,
    queryKey: [...scope, 'page', direction, page, snapshot],
    enabled: enabled && page > 1 && snapshot !== undefined && !bundle.isPlaceholderData,
    queryFn: ({ signal }) => load(direction, page, snapshot, signal),
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === scope[2]
      && previousQuery?.queryKey[scope.length + 1] === direction ? previous : undefined,
  });
  return {
    data: page === 1 ? bundle.data?.[direction] : more.data,
    error: bundle.error || (page > 1 ? more.error : null),
    isLoading: bundle.isLoading || (page > 1 && more.isLoading),
    isFetching: bundle.isFetching || (page > 1 && more.isFetching),
    snapshot,
    refetch: () => page === 1 ? bundle.refetch() : more.refetch(),
  };
}
