import { useEffect, useState } from 'react';
import { Banner, Button, Input } from '@cloudflare/kumo';
import { getApiMessage } from '../api/request';
import { EmailVerificationCode } from './EmailVerificationCode';

export interface EmailVerificationStatus {
  hasEmail: boolean;
  emailHint?: string;
}

export interface EmailVerificationOptions {
  status?: EmailVerificationStatus;
  statusLoading: boolean;
  statusError?: string;
  send: (email?: string) => Promise<unknown>;
}

export interface EmailVerificationState {
  status?: EmailVerificationStatus;
  statusLoading: boolean;
  statusError?: string;
  needsBinding: boolean;
  email: string;
  setEmail: (value: string) => void;
  code: string[];
  setCode: (value: string[]) => void;
  sent: boolean;
  seconds: number;
  sending: boolean;
  error?: string;
  canSend: boolean;
  ready: boolean;
  send: () => Promise<void>;
  reset: () => void;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Shared send/cooldown/one-time-code state for the production lock and destruction. */
export function useEmailVerification(options: EmailVerificationOptions): EmailVerificationState {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(Array<string>(6).fill(''));
  const [sent, setSent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const needsBinding = options.status?.hasEmail === false;
  useEffect(() => {
    if (!seconds) return;
    const timer = setTimeout(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  const canSend = Boolean(options.status) && !options.statusLoading && !sending && (!needsBinding || EMAIL_PATTERN.test(email.trim()));
  const ready = sent && code.length === 6 && code.every(digit => /^\d$/.test(digit));
  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setError(undefined);
    try {
      await options.send(needsBinding ? email.trim() : undefined);
      setSent(true);
      setSeconds(60);
      setCode(Array<string>(6).fill(''));
    } catch (reason) {
      setError(getApiMessage(reason));
    } finally {
      setSending(false);
    }
  };
  const reset = () => {
    setEmail('');
    setCode(Array<string>(6).fill(''));
    setSent(false);
    setSeconds(0);
    setSending(false);
    setError(undefined);
  };
  return { status: options.status, statusLoading: options.statusLoading, statusError: options.statusError, needsBinding, email, setEmail, code, setCode, sent, seconds, sending, error, canSend, ready, send, reset };
}

export function EmailVerificationFields({ state, idPrefix, autoFocus, onCodeChange }: { state: EmailVerificationState; idPrefix: string; autoFocus?: boolean; onCodeChange?: () => void }) {
  return <div className="grid gap-4">
    {state.statusLoading && <p role="status">正在读取邮箱状态…</p>}
    {state.status && <>
      {state.needsBinding
        ? <><label htmlFor={`${idPrefix}-email`} className="font-medium">邮箱地址</label><Input id={`${idPrefix}-email`} type="email" autoFocus={autoFocus} value={state.email} disabled={state.sent || state.sending} placeholder="请输入邮箱地址" onChange={event => state.setEmail(event.target.value)} /></>
        : <p>验证邮箱：{state.status.emailHint}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-kumo-subtle">{state.sent ? '验证码10分钟内有效' : '验证码仅用于本次操作'}</span>
        <Button variant="secondary" disabled={!state.canSend || state.seconds > 0} loading={state.sending} onClick={() => void state.send()}>{state.seconds > 0 ? `${state.seconds} 秒后重新发送` : state.sent ? '重新发送验证码' : '发送验证码'}</Button>
      </div>
      {state.sent && <EmailVerificationCode value={state.code} onChange={value => { state.setCode(value); onCodeChange?.(); }} />}
    </>}
    {(state.statusError || state.error) && <Banner variant="error" title={state.statusError || state.error || ''} />}
  </div>;
}
