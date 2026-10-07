import { Banner, LayerCard } from "@cloudflare/kumo";
import { VncConsole } from "./VncConsole";

export type RemoteConsoleType = "novnc" | "kasmvnc" | "guacamole";

export interface RemoteConsoleDescriptor {
  type: RemoteConsoleType;
  url: string;
  token: string;
  expiresAt?: number;
  extra?: Record<string, string>;
}

interface RemoteConsoleProps {
  instanceId: string;
  remote: RemoteConsoleDescriptor;
}

function isSameOriginRelativePath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

function ReservedEngine({ type, url }: Pick<RemoteConsoleDescriptor, "type" | "url">) {
  const safe = isSameOriginRelativePath(url);
  return (
    <LayerCard className="shadow-none m-auto grid max-w-2xl gap-4 p-6">
      <Banner
        variant={safe ? "alert" : "error"}
        title={safe ? "远程引擎尚未启用" : "远程会话地址无效"}
        description={safe ? `${type} 适配分支已预留，当前服务器尚未注册该引擎。` : "系统已拒绝非本站远程地址。"}
      />
    </LayerCard>
  );
}

export function RemoteConsole({ instanceId, remote }: RemoteConsoleProps) {
  if (!isSameOriginRelativePath(remote.url)) {
    return <ReservedEngine type={remote.type} url={remote.url} />;
  }
  switch (remote.type) {
    case "novnc":
      return <VncConsole instanceId={instanceId} token={remote.token} />;
    case "kasmvnc":
    case "guacamole":
      return <ReservedEngine type={remote.type} url={remote.url} />;
    default:
      return <ReservedEngine type={remote.type} url="" />;
  }
}
