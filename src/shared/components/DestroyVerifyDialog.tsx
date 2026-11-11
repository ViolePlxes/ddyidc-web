import { useEffect, useState } from 'react';
import { Banner, Button, Input, LayerDialog } from '@cloudflare/kumo';
import { useMutation, useQuery } from '@tanstack/react-query';
import { instanceManagementApi } from '../api/instanceManagement';
import { getApiMessage } from '../api/request';
import { EmailVerificationCode } from './EmailVerificationCode';
import { instanceConfirmationActions } from './InstanceConfirmationActions';

export interface DestroyVerifyTarget {
  instanceId: string;
  instanceNo?: string;
  productName?: string;
  refundableAmount: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Thin wrapper over the production-lock mailbox verification. It sends and
// consumes the same credential through the same API; it never owns a second
// code store or a second verification rule.
export function DestroyVerifyDialog({ target, open, onOpenChange, submitting, error, onConfirm }: {
  target?: DestroyVerifyTarget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  error?: unknown;
  onConfirm: (input: { reason: string; email: string; code: string }) => Promise<void>;
}) {
  const api = instanceManagementApi(String(target?.instanceId));
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [code, setCode] = useState<string[]>(Array<string>(6).fill(''));
  const [reason, setReason] = useState('');
  const status = useQuery({
    queryKey: ['production-lock-email', 'self', target?.instanceId],
    queryFn: () => api.productionLockEmail(),
    enabled: open && Boolean(target),
    staleTime: 0,
    retry: false,
  });
  const send = useMutation({
    mutationFn: () => api.sendProductionLockEmail(false, status.data?.hasEmail === false ? email.trim() : undefined),
    onSuccess: () => {
      setSent(true);
      setSeconds(60);
      setCode(Array<string>(6).fill(''));
    },
  });
  useEffect(() => {
    if (!seconds) return;
    const timer = setTimeout(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  useEffect(() => {
    if (!open) return;
    setEmail('');
    setSent(false);
    setSeconds(0);
    setCode(Array<string>(6).fill(''));
    setReason('');
    send.reset();
    // Reset once per opening; mutation state is not a reset trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target?.instanceId]);
  const needsBinding = status.data?.hasEmail === false;
  const canSend = Boolean(status.data) && !status.isFetching && !send.isPending && (!needsBinding || EMAIL_PATTERN.test(email.trim()));
  const ready = sent && code.length === 6 && code.every(digit => /^\d$/.test(digit));
  const canConfirm = Boolean(target) && !submitting && !send.isPending && !status.isFetching && Boolean(status.data) && Boolean(reason.trim()) && ready;
  const close = (value: boolean) => {
    if (submitting || send.isPending) return;
    onOpenChange(value);
  };
  return <LayerDialog.Root open={open} dismissDisabled={submitting || send.isPending} onOpenChange={close}>
    <LayerDialog.Content>
      <LayerDialog.Title>申请销毁实例</LayerDialog.Title>
      <LayerDialog.Description>实例 {target?.productName || target?.instanceNo || target?.instanceId} 销毁后不可恢复，提交后需后台审核；验证码与生产锁共用同一套邮箱凭证。</LayerDialog.Description>
      <LayerDialog.Body><div className="grid gap-4">
        {target ? <p>预计可退：<strong>¥{target.refundableAmount}</strong><span className="text-sm text-kumo-subtle">（提交时核算）</span></p> : null}
        <Input label="销毁原因（必填）" placeholder="请填写销毁原因" maxLength={200} value={reason} disabled={submitting} onChange={event => setReason(event.target.value)} />
        {status.isLoading && <p role="status">正在读取邮箱状态…</p>}
        {status.data && <>
          {needsBinding
            ? <><label htmlFor={`destroy-email-${target?.instanceId ?? ''}`} className="font-medium">邮箱地址</label><Input id={`destroy-email-${target?.instanceId ?? ''}`} type="email" value={email} disabled={sent || send.isPending} placeholder="请输入邮箱地址" onChange={event => setEmail(event.target.value)} /></>
            : <p>验证邮箱：{status.data.emailHint}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-kumo-subtle">{sent ? '验证码10分钟内有效' : '验证码仅用于本次操作'}</span>
            <Button variant="secondary" disabled={!canSend || seconds > 0} loading={send.isPending} onClick={() => { send.reset(); send.mutate(); }}>{seconds > 0 ? `${seconds} 秒后重新发送` : sent ? '重新发送验证码' : '发送验证码'}</Button>
          </div>
          {sent && <EmailVerificationCode value={code} onChange={value => { setCode(value); }} />}
        </>}
        {Boolean(status.error || send.error || error) && <Banner variant="error" title={getApiMessage(status.error || send.error || error)} />}
      </div></LayerDialog.Body>
      {instanceConfirmationActions({ destructive: true, loading: submitting, disabled: !canConfirm, onConfirm: () => { void onConfirm({ reason: reason.trim(), email: email.trim(), code: code.join('') }).catch(() => {}); }, children: '确认申请销毁' })}
    </LayerDialog.Content>
  </LayerDialog.Root>;
}
