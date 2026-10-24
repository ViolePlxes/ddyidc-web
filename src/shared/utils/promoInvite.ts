import type { Invite } from "../api/console";

export function promoInviteState(invite: Invite | undefined, enabled: boolean, path: string | undefined, origin: string) {
  const canApply = !invite || invite.status === 2 || invite.status === 3;
  const status = !invite ? "未设置" : ({ 0: "待审核", 1: "已启用", 2: "已停用", 3: "已驳回" }[invite.status] ?? "状态未知");
  let link = "";
  if (enabled && invite?.status === 1 && path?.startsWith("/") && !path.startsWith("//")) {
    const url = new URL(path, origin);
    if (url.origin === new URL(origin).origin) link = url.href;
  }
  return { canApply, status, link };
}
