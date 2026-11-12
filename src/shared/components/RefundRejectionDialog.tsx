import { useState } from 'react';
import { Banner, Button, Input } from '@cloudflare/kumo';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminRequest, getApiMessage } from '../api/request';
import { Dialog } from './Dialog';

// Shared rejection entry for machine refund applications. It uses the existing
// review endpoint and keeps the application's updatedAt for optimistic locking.
export function RefundRejectionDialog({ applicationId, updatedAt, onDone }: { applicationId: string; updatedAt?: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const client = useQueryClient();
  const reject = useMutation({
    mutationFn: () => adminRequest.post(`/todos/refund-applications/${applicationId}/review`, { action: "reject", reason: reason.trim(), requestId, expectedUpdatedAt: updatedAt }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-todos"] }),
        client.invalidateQueries({ queryKey: ["admin-todo-items"] }),
        client.invalidateQueries({ queryKey: ["todo-refund-application", applicationId] }),
        client.invalidateQueries({ queryKey: ["machine-refund-quote", applicationId] }),
      ]);
      setOpen(false);
      onDone();
    },
  });
  return <Dialog.Root open={open} onOpenChange={value => { if (!reject.isPending) { setOpen(value); if (value) { setReason(''); setRequestId(crypto.randomUUID()); reject.reset(); } } }}>
    <Dialog.Trigger render={<Button variant="secondary" size="sm" disabled={!updatedAt}>拒绝申请</Button>} />
    <Dialog className="grid gap-4 p-8">
      <Dialog.Title>拒绝退款申请</Dialog.Title>
      <Dialog.Description>拒绝后申请状态变为已拒绝，机器回到可退款/可销毁状态；拒绝原因会写入审核备注。</Dialog.Description>
      <Input label="拒绝原因（必填）" maxLength={255} value={reason} disabled={reject.isPending} onChange={event => setReason(event.target.value)} />
      {reject.error ? <Banner variant="error" title={getApiMessage(reject.error)} /> : null}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" disabled={reject.isPending} onClick={() => setOpen(false)}>取消</Button>
        <Button variant="destructive" loading={reject.isPending} disabled={!reason.trim() || reject.isPending} onClick={() => reject.mutate()}>确认拒绝</Button>
      </div>
    </Dialog>
  </Dialog.Root>;
}
