import { Badge } from '@cloudflare/kumo';

/** Presentation only: lifecycle codes and power states keep their existing meanings. */
export function machineStatusVariant(status: string | number) {
  const value = String(status).toLowerCase();
  if (['3', 'running', 'on', 'active', 'normal'].includes(value)) return 'green';
  if (['2', 'starting', 'stopping', 'rebooting', 'reinstalling', 'operating', 'provisioning', 'migrating'].includes(value)) return 'blue';
  if (['1', '4', 'pending', 'stopped', 'off', 'suspended', 'paused', 'review', 'unknown'].includes(value)) return 'orange';
  if (['5', 'fault', 'failed', 'error', 'expired'].includes(value)) return 'red';
  return 'secondary';
}

const labels: Record<string, string> = {
  '1': '待开通', '2': '开通中', '3': '运行中', '4': '已停机', '5': '已过期', '6': '已删除',
  running: '运行中', on: '运行中', active: '运行中', stopped: '已关机', off: '已关机',
  starting: '开机中', stopping: '关机中', rebooting: '重启中', reinstalling: '重装中',
  operating: '操作中', provisioning: '开通中', migrating: '迁移中', fault: '故障',
  suspended: '已暂停', expired: '已到期', deleted: '已删除', destroyed: '已销毁',
  cancelled: '已取消', unknown: '状态未知', normal: '正常', review: '待核查',
};

export function MachineStatusBadge({ status, label }: { status: string | number; label?: string }) {
  return <Badge variant={machineStatusVariant(status)}>{label ?? labels[String(status).toLowerCase()] ?? '状态未知'}</Badge>;
}
