import { Banner, Button, ClipboardText, Dialog, Input } from "@cloudflare/kumo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { consoleApi, type Invite } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";

export function PromoInviteDialog({ invite, enabled, triggerLabel = "自定义优惠码" }: { invite?: Invite; enabled: boolean; review: boolean; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();
  const canApply = (!invite || [1, 2, 3].includes(invite.status)) && !invite?.pendingCode;
  const create = useMutation({
    mutationFn: () => consoleApi.createInvite(code.trim()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["promo"] });
      setCode(""); setOpen(false);
    },
  });
  return <Dialog.Root open={open} onOpenChange={next => {
    if (create.isPending) return;
    setOpen(next); if (!next) { setCode(""); create.reset(); }
  }}>
    <Dialog.Trigger render={<Button variant="secondary" />}>{triggerLabel}</Dialog.Trigger>
    <Dialog className="grid gap-4 p-6">
      <Dialog.Title>自定义优惠码</Dialog.Title>
      <Dialog.Description>优惠码与“我的推广”共用。系统默认分配优惠码；自定义申请必须审核，审核期间原优惠码继续可用。</Dialog.Description>
      {!enabled ? <Banner variant="alert" description="优惠码申请暂未开放。" /> : null}
      {invite ? <div className="grid gap-2"><span className="text-sm text-kumo-subtle">当前优惠码</span><ClipboardText text={invite.code} /></div> : null}
      {canApply ? <form className="grid gap-4" onSubmit={event => { event.preventDefault(); if (enabled && !create.isPending) create.mutate(); }}>
        <Input label="自定义优惠码" description="4～12位英文字母或数字，大小写视为相同。不得包含敏感内容或变体，平台保留码不可申请。" value={code} minLength={4} maxLength={12} required pattern="[A-Za-z0-9]{4,12}" disabled={!enabled || create.isPending} onChange={event => setCode(event.target.value)} autoComplete="off" />
        {create.error ? <Banner variant="error" title="申请失败" description={getApiMessage(create.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" type="button" disabled={create.isPending} onClick={() => setOpen(false)}>取消</Button><Button variant="primary" type="submit" disabled={!enabled} loading={create.isPending}>{invite ? "重新申请" : "确认申请"}</Button></div>
      </form> : <>
        <Banner variant="default" description={invite?.pendingCode ? `自定义优惠码 ${invite.pendingCode} 正在审核，当前生效码仍可使用。` : invite?.status === 0 ? "优惠码正在审核，请等待审核结果。" : "你已有生效的优惠码，可在优惠链接中使用，无需重复申请。"} />
        <Button variant="secondary" onClick={() => setOpen(false)}>完成</Button>
      </>}
    </Dialog>
  </Dialog.Root>;
}
