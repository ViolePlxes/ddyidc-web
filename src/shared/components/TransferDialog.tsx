import { Dialog } from "./Dialog";
import { Banner, Button, Input } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { transfersApi } from "../api/transfers";
import { getApiMessage } from "../api/request";

export function TransferDialog({ instanceId }: { instanceId: string }) {
 const client = useQueryClient();
 const [open, setOpen] = useState(false);
 const [account, setAccount] = useState("");
 const [password, setPassword] = useState("");
 const status = useQuery({ queryKey: ["transfers", "status", instanceId], queryFn: () => transfersApi.status(instanceId), refetchInterval: false });
 const submit = useMutation({ mutationFn: () => transfersApi.create(instanceId, account.trim(), password), onSuccess: async () => { setPassword(""); setOpen(false); await client.invalidateQueries({ queryKey: ["transfers"] }); }, onSettled: () => setPassword("") });
 if (!status.data?.enabled) return null;
 const busy = status.data.trading || status.data.transferring;
 return <Dialog.Root open={open} onOpenChange={(value) => { if (!submit.isPending) { setOpen(value); if(value)void status.refetch(); setPassword(""); submit.reset(); } }}>
  <Dialog.Trigger render={<Button variant="secondary" disabled={busy}>{status.data.trading ? "交易中" : status.data.transferring ? "待接收" : "转让实例"}</Button>} />
  <Dialog className="grid gap-5 p-6">
   <Dialog.Title>免费转让实例</Dialog.Title>
   <Dialog.Description>双方须已实名认证。接收方登录接收中心并确认后才会过户，原账号将失去全部控制权。请提前备份并移除个人数据。</Dialog.Description>
   <Input label="接收方用户名 / 手机号 / 邮箱" value={account} onChange={(event) => setAccount(event.target.value)} autoComplete="off" />
   <Input label="你的登录密码（二次验证）" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
   {submit.error && <Banner variant="error" title={getApiMessage(submit.error)} />}
   <div className="flex flex-wrap items-center justify-between gap-3"><Link to="/console/certification">去实名认证</Link><div className="flex gap-2"><Button variant="secondary" disabled={submit.isPending} onClick={() => setOpen(false)}>取消</Button><Button loading={submit.isPending} disabled={!account.trim() || !password} onClick={() => submit.mutate()}>发送转让请求</Button></div></div>
  </Dialog>
 </Dialog.Root>;
}
