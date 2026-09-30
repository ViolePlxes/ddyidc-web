import { useState } from "react";
import { Banner, Button, Input, LayerCard } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { socialAuthApi, startSocialLogin, type SocialProvider } from "../api/socialAuth";
import { getApiMessage } from "../api/request";

export function SocialBindings() {
  const client = useQueryClient();
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const query = useQuery({ queryKey: ["social-bindings"], queryFn: socialAuthApi.bindings, retry: false });
  const action = useMutation({
    mutationFn: async ({ provider, unbind }: { provider: SocialProvider; unbind: boolean }) => {
      setSuccess("");
      if (unbind) await socialAuthApi.unbind(provider, password);
      else await startSocialLogin(provider, false, "bind", password);
    },
    onSuccess: (_, input) => { setPassword(""); if (input.unbind) { setSuccess("已解除绑定"); void client.invalidateQueries({ queryKey: ["social-bindings"] }); } },
  });
  return <LayerCard className="grid gap-4 p-5"><h2 className="text-lg font-semibold">社交账号绑定</h2>
    <p className="text-sm text-kumo-subtle">验证当前密码后绑定或解绑。社交账号只能绑定一个平台账号，解绑前须已绑定手机号。</p>
    <Input label="当前登录密码" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" maxLength={20} />
    {(["github", "qq"] as const).map(provider => {
      const binding = query.data?.find(item => item.provider === provider);
      return <div key={provider} className="flex items-center justify-between gap-3">
        <span>{provider === "github" ? "GitHub" : "QQ"} · {binding ? `已绑定 ${binding.nickname}` : "未绑定"}</span>
        <Button variant="secondary" disabled={query.isLoading || Boolean(query.error) || action.isPending || password.length < 6} onClick={() => action.mutate({ provider, unbind: Boolean(binding) })}>{binding ? "解除绑定" : "绑定账号"}</Button>
      </div>;
    })}
    {query.error || action.error ? <Banner variant="error" title="操作未完成" description={getApiMessage(query.error ?? action.error)} /> : null}
    {success ? <Banner title={success} /> : null}
    {new URLSearchParams(window.location.search).get("social") === "bound" ? <Banner title="社交账号已绑定" /> : null}
  </LayerCard>;
}
