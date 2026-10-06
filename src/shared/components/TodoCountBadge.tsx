import { Badge } from './Badge';
import { todoCountVariant } from '../utils/todoCounts';

export function TodoCountBadge({ count, className }: { count: string | number | null; className?: string }) {
  return <Badge variant={todoCountVariant(count)} className={className}>{count ?? '统计暂不可用'}</Badge>;
}
