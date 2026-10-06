import { Badge as KumoBadge } from '@cloudflare/kumo';
import type { ComponentProps } from 'react';

type BadgeProps = Omit<ComponentProps<typeof KumoBadge>, 'appearance' | 'icon'>;

/** Keep every application badge on Kumo's supported dot appearance. */
export function Badge({ variant = 'neutral', ...props }: BadgeProps) {
  const dotVariant = ['success', 'green', 'teal', 'teal-subtle'].includes(variant) ? 'success'
    : ['warning', 'orange'].includes(variant) ? 'warning'
    : ['error', 'destructive', 'red'].includes(variant) ? 'error'
    : 'neutral';
  return <KumoBadge {...props} variant={dotVariant} appearance="dot" />;
}
