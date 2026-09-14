import { Banner, Button, LayerCard } from "@cloudflare/kumo";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { RemoteConsole, type RemoteConsoleDescriptor, type RemoteConsoleType } from "../components/RemoteConsole";

export function VncConsole() {
  const { instanceId = "" } = useParams();
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = search.get("token") ?? "";
  const type = (search.get("type") ?? "novnc") as RemoteConsoleType;
  const descriptor: RemoteConsoleDescriptor = {
    type,
    token,
    url: `${location.pathname}${location.search}`,
  };

  if (!token || !["novnc", "kasmvnc", "guacamole"].includes(type)) {
    return (
      <LayerCard className="shadow-none m-auto grid max-w-2xl gap-4 p-6">
        <Banner variant="error" title="远程会话无效" description="会话参数缺失或引擎类型不受支持，请返回实例控制台重新发起连接。" />
        <Button onClick={() => navigate(`/console/instances/${instanceId}`, { replace: true })}>返回实例控制台</Button>
      </LayerCard>
    );
  }
  return <RemoteConsole instanceId={instanceId} remote={descriptor} />;
}
