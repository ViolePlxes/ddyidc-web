import { Banner, Button, ClipboardText, Dialog, Input } from "@cloudflare/kumo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { consoleApi, type Invite } from "../../../shared/api/console";
import { getApiMessage } from "../../../shared/api/request";

export function PromoInviteDialog({ invite, enabled, review, triggerLabel = "自定义优惠码" }: { invite?: Invite; enabled: boolean; review: boolean; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const queryClient = useQueryClient();
  const canApply = !invite || invite.status === 2 || invite.status === 3;
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
      <Dialog.Description>优惠码用于邀请好友注册，与“我的推广”共用。{review ? "自定义优惠码提交后需审核，通过后才能分享。" : "申请成功并启用后即可分享邀请链接。"}</Dialog.Description>
      {!enabled ? <Banner variant="alert" description="优惠码申请暂未开放。" /> : null}
      {invite ? <div className="grid gap-2"><span className="text-sm text-kumo-subtle">当前优惠码</span><ClipboardText text={invite.code} /></div> : null}
      {canApply ? <form className="grid gap-4" onSubmit={event => { event.preventDefault(); if (enabled && !create.isPending) create.mutate(); }}>
        <Input label="自定义优惠码（可选）" description="留空可自动生成，长度与可用字符由平台规则校验。" value={code} maxLength={16} disabled={!enabled || create.isPending} onChange={event => setCode(event.target.value)} autoComplete="off" />
        {create.error ? <Banner variant="error" title="申请失败" description={getApiMessage(create.error)} /> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" type="button" disabled={create.isPending} onClick={() => setOpen(false)}>取消</Button><Button variant="primary" type="submit" disabled={!enabled} loading={create.isPending}>{invite ? "重新申请" : "确认申请"}</Button></div>
      </form> : <>
        <Banner variant="default" description={invite?.status === 0 ? "优惠码正在审核，请等待审核结果。" : "你已有生效的优惠码，可在邀请链接中使用，无需重复申请。"} />
        <Button variant="secondary" onClick={() => setOpen(false)}>完成</Button>
      </>}
    </Dialog>
  </Dialog.Root>;
}
