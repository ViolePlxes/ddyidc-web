import type { NavigationGroup } from '../../layouts/DashboardLayout';
import type { AdminTodos } from '../api/adminTodos';

export function todoCountVariant(count: string | number | null | undefined) {
  if (count === null || count === undefined || String(count).trim() === '') return 'neutral';
  const value = Number(count);
  return Number.isFinite(value) && value >= 0 ? value === 0 ? 'success' : 'error' : 'neutral';
}

export function withTodoCounts(groups: NavigationGroup[], snapshot: AdminTodos | undefined): NavigationGroup[] {
  if (!snapshot) return groups;
  return groups.map(group => {
    if (!group.items.some(item => /^\/admin\/todos(?:\/|$)/.test(item.href))) return group;
    return { ...group, badge: snapshot.complete ? String(snapshot.total) : '—', items: group.items.map(item => {
      const kind = item.href.match(/^\/admin\/todos\/([^/?#]+)/)?.[1];
      const count = snapshot.items.find(row => row.key === kind);
      return count ? { ...item, badge: count.count === null ? '—' : String(count.count) } : item;
    }) };
  });
}
