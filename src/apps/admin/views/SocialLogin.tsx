import { useState } from "react";
import { Banner, Button, Input, LayerCard, Switch, Checkbox } from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { socialAuthApi, type SocialConfig } from "../../../shared/api/socialAuth";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";

function ProviderConfig({ config, onSaved }: { config: SocialConfig; onSaved: (message: string) => void }) {
  const client = useQueryClient();
  const [appId, setAppId] = useState(config.appId);
  const [secret, setSecret] = useState("");
  const [callbackUrl, setCallbackUrl] = useState(config.callbackUrl);
  const [enabled, setEnabled] = useState(config.enabled);
  const [clearSecret, setClearSecret] = useState(false);
  const save = useMutation({
    mutationFn: () => socialAuthApi.saveConfig(config.provider, { appId, secret, callbackUrl, enabled, clearSecret, revision: config.revision }),
    onSuccess: () => { setSecret(""); onSaved(`${config.provider === "github" ? "GitHub" : "QQ"} 配置已保存，立即生效`); void client.invalidateQueries({ queryKey: ["social-login-config"] }); },
  });
  return <LayerCard className="grid gap-4 p-5"><h2 className="text-lg font-semibold">{config.provider === "github" ? "GitHub OAuth" : "QQ 互联"}</h2>
    <form className="grid gap-4" onSubmit={event => { event.preventDefault(); save.mutate(); }}>
      <Input label={config.provider === "github" ? "Client ID / AppID" : "AppID"} value={appId} onChange={e => setAppId(e.target.value)} autoComplete="off" maxLength={128} />
      <Input label={config.provider === "github" ? "Client Secret / AppSecret" : "AppKey / AppSecret"} type="password" value={secret} onChange={e => setSecret(e.target.value)} autoComplete="new-password" maxLength={1024} placeholder={config.hasSecret ? "已配置，留空保留现有密钥" : "尚未配置"} />
      <Checkbox label="清除已保存密钥" checked={clearSecret} onCheckedChange={value => setClearSecret(value === true)} />
      <Input label="完整回调地址" value={callbackUrl} onChange={e => setCallbackUrl(e.target.value)} placeholder={`${window.location.origin}/auth/${config.provider}/callback`} maxLength={1024} />
      <p className="text-sm text-kumo-subtle">回调路径为 /auth/{config.provider}/callback，与应用平台登记地址保持一致。生产环境使用 HTTPS。</p>
      <Switch label="启用此登录方式" checked={enabled} onCheckedChange={setEnabled} />
      {save.error ? <Banner variant="error" title="保存失败" description={getApiMessage(save.error)} /> : null}
      <Button type="submit" loading={save.isPending}>保存配置</Button>
    </form>
  </LayerCard>;
}
export function SocialLoginSettings() {
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["social-login-config"], queryFn: socialAuthApi.configs });
  return <><PageHeader title="第三方登录" description="配置 GitHub 和 QQ 登录，保存后立即生效。密钥加密存储，页面不回显。" />
    {query.error ? <Banner variant="error" title="读取配置失败" description={getApiMessage(query.error)} /> : null}
    {message ? <Banner title={message} /> : null}
    {query.isFetching ? <p role="status">正在读取配置…</p> : null}
    <div className="grid gap-6 xl:grid-cols-2">{query.data?.map(config => <ProviderConfig key={`${config.provider}-${config.revision}`} config={config} onSaved={setMessage} />)}</div>
  </>;
}
