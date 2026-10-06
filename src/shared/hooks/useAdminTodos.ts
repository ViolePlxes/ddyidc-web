import { useQuery } from '@tanstack/react-query';
import { getAdminTodos } from '../api/adminTodos';

/** Sidebar and todo pages observe the same snapshot and invalidation key. */
export function useAdminTodos(enabled = true) {
  return useQuery({ queryKey: ['admin-todos'], queryFn: getAdminTodos, enabled, refetchInterval: 30_000, retry: false });
}
