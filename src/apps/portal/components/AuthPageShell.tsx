import type { ReactNode } from "react";
import { Banner, Button } from "@cloudflare/kumo";
import { GithubLogoIcon, ChatCircleDotsIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { startSocialLogin, type SocialProvider } from "../../../shared/api/socialAuth";
import { getApiMessage } from "../../../shared/api/request";

export const authSubmitClassName = "w-full justify-center bg-kumo-contrast! text-kumo-inverse! ring-kumo-contrast hover:opacity-90";

export function AuthPageShell({ title, description, children }: {
  title: string; description: string; children: ReactNode;
}) {
  return (
    <main data-mode="light" className="flex min-h-svh items-center justify-center bg-kumo-base px-6 py-12 text-kumo-default">
      <div className="grid w-full max-w-[400px] gap-7">
        <header className="grid gap-2">
          <h1 className="text-3xl font-semibold text-kumo-strong">{title}</h1>
          <p className="text-sm text-kumo-subtle">{description}</p>
        </header>
        {children}
      </div>
    </main>
  );
}

export function SocialLoginOptions({ rememberMe = false }: { rememberMe?: boolean }) {
  const [provider, setProvider] = useState("");
  const start = (name: SocialProvider) => { void startSocialLogin(name, rememberMe).catch(error => setProvider(getApiMessage(error))); };
  return (
    <section className="grid gap-5" aria-label="社交账号登录">
      <div className="flex items-center gap-3 text-xs text-kumo-subtle">
        <span className="h-px flex-1 bg-kumo-line" />
        <span>或使用社交账号登录</span>
        <span className="h-px flex-1 bg-kumo-line" />
      </div>
      <div className="grid gap-3">
        <Button type="button" variant="secondary" size="lg" className="w-full justify-start" icon={<GithubLogoIcon />} onClick={() => start("github")}>使用 GitHub 继续</Button>
        <Button type="button" variant="secondary" size="lg" className="w-full justify-start" icon={<ChatCircleDotsIcon />} onClick={() => start("qq")}>使用 QQ 继续</Button>
      </div>
      {provider && <Banner variant="error" title="暂未完成授权" description={provider} />}
    </section>
  );
}
