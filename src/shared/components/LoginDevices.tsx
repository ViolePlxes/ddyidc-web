import {ScopedTable as Table} from './ScopedTable';
import { Badge } from "./Badge";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banner, Button, LayerCard} from "@cloudflare/kumo";
import { getLoginDevices, revokeLoginDevice } from "../api/auth";
import { getApiMessage } from "../api/request";
import { clearRefreshSession } from "../api/refreshSession";

function browserName(agent: string) {
  const browser = agent.includes("Edg/") ? "Edge" : agent.includes("Firefox/") ? "Firefox" : agent.includes("Chrome/") ? "Chrome" : agent.includes("Safari/") ? "Safari" : "其他浏览器";
  const system = /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iOS" : /Windows/.test(agent) ? "Windows" : /Macintosh/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "未知系统";
  return `${browser} · ${system}`;
}
function time(value: string) { return new Date(value).toLocaleString("zh-CN"); }
export function LoginDevices() {
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const devices = useQuery({ queryKey: ["login-devices"], queryFn: getLoginDevices, refetchInterval: 60_000 });
  const revoke = useMutation({ mutationFn: revokeLoginDevice, onSuccess: async (_, id) => {
    if (devices.data?.find((device) => device.id === id)?.current) {
      clearRefreshSession();
      window.location.replace("/login");
      return;
    }
    await client.invalidateQueries({ queryKey: ["login-devices"] });
    setMessage("设备已下线");
  } });
  return <LayerCard className="grid gap-4 px-5 py-4">
    <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-kumo-strong">安全中心 · 登录设备</h2><Button variant="secondary" onClick={() => void devices.refetch()} loading={devices.isFetching}>刷新</Button></div>
    <p className="text-base text-kumo-subtle">最多同时登录 10 台设备，超过后最早登录的设备会自动下线。下线设备后，该设备的访问与续期权限立即失效。</p>
    {(devices.error || revoke.error) && <Banner variant="error" title="操作失败" description={getApiMessage(devices.error ?? revoke.error)} />}
    {message && <Banner variant="default" title={message} />}
    {devices.isPending ? <p>正在读取登录设备…</p> : <div className="overflow-x-auto"><Table tableId="shared/components/LoginDevices.tsx:1">
      <Table.Header><Table.Row><Table.Head>浏览器 / 系统</Table.Head><Table.Head>IP</Table.Head><Table.Head>登录时间</Table.Head><Table.Head>最后活跃</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header>
      <Table.Body>{devices.data?.map((device) => <Table.Row key={device.id}>
        <Table.Cell><span title={device.browser}>{browserName(device.browser)}</span> {device.current && <Badge>当前设备</Badge>}</Table.Cell>
        <Table.Cell>{device.ip}</Table.Cell><Table.Cell>{time(device.loginAt)}</Table.Cell><Table.Cell>{time(device.lastActiveAt)}</Table.Cell>
        <Table.Cell><Button variant="secondary" loading={revoke.isPending && revoke.variables === device.id} disabled={revoke.isPending} onClick={() => { setMessage(""); revoke.mutate(device.id); }}>{device.current ? "退出当前设备" : "下线"}</Button></Table.Cell>
      </Table.Row>)}</Table.Body>
    </Table></div>}
    {devices.data?.length === 0 && <p className="text-base text-kumo-subtle">当前为既有会话或管理员代登录，重新登录后可管理此设备。</p>}
  </LayerCard>;
}
