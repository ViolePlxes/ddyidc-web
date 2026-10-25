/** Explicit timestamps retain their timezone; the clock can be injected for tests. */
export function expiryRemaining(value: string | null | undefined, now: number): string {
  const expires = Date.parse(value ?? '');
  if (!Number.isFinite(expires) || !Number.isFinite(now)) return '暂无到期时间';
  if (expires <= now) return '已到期';
  const minutes = Math.ceil((expires - now) / 60_000);
  const parts = [[Math.floor(minutes / 1440), '天'], [Math.floor(minutes % 1440 / 60), '小时'], [minutes % 60, '分钟']] as const;
  return `还有 ${parts.filter(([amount]) => amount > 0).map(([amount, unit]) => `${amount}${unit}`).join(' ')}到期`;
}

export function instanceListReturnPath(value: string, adminBase: string, fallback: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try {
    const target = new URL(value, 'https://local.invalid');
    return target.origin === 'https://local.invalid' && target.pathname === `${adminBase}/instances` && !target.hash
      ? target.pathname + target.search : fallback;
  } catch { return fallback; }
}
