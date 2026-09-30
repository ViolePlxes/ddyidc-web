import { useEffect, useState } from "react";
import { Banner, Button } from "@cloudflare/kumo";
import { completeSocialLogin } from "../../../shared/api/socialAuth";
import { getApiMessage } from "../../../shared/api/request";
import { useAuthStore } from "../../../shared/stores/auth";
import { AuthPageShell } from "../components/AuthPageShell";

// React StrictMode may mount effects twice. One callback ticket has one exchange.
let completion: ReturnType<typeof completeSocialLogin> | undefined;
export function SocialComplete() {
  const [error, setError] = useState("");
  useEffect(() => {
    completion ??= completeSocialLogin();
    void completion.then(payload => {
      useAuthStore.getState().setSession(payload.user, payload.needBindMobile);
      window.location.replace(payload.needBindMobile ? "/bind-mobile" : "/console");
    }).catch(next => setError(getApiMessage(next)));
  }, []);
  return <AuthPageShell title="完成社交登录" description="正在验证账号并建立登录会话。">
    {error ? <><Banner variant="error" title="登录未完成" description={error} /><Button onClick={() => window.location.replace("/login")}>返回登录</Button></> : <p role="status">正在登录，请稍候…</p>}
  </AuthPageShell>;
}
