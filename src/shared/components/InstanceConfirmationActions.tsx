import { LayerDialog } from '@cloudflare/kumo';
import type { ReactNode } from 'react';

// Return the actual Kumo Actions element: Content also validates direct child types.
// A React component wrapper would hide Actions from that validation.
export function instanceConfirmationActions({ children, disabled, loading, onConfirm, destructive = false }: {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return <LayerDialog.Actions dismissLabel="取消">
    <LayerDialog.Action variant={destructive ? 'destructive' : 'primary'} disabled={disabled} loading={loading} onClick={onConfirm}>{children}</LayerDialog.Action>
  </LayerDialog.Actions>;
}
