import { Badge, Banner, Button, LayerCard } from "@cloudflare/kumo";
import RFB from "@novnc/novnc";
import { useEffect, useRef, useState } from "react";

type ConnectionState = "connecting" | "connected" | "disconnected" | "failed";

const statusLabels: Record<ConnectionState, string> = {
  connecting: "连接中",
  connected: "已连接",
  disconnected: "已断开",
  failed: "连接失败",
};

export function VncConsole({ instanceId, token }: { instanceId: string; token: string }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<RFB | null>(null);
  const [state, setState] = useState<ConnectionState>("connecting");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const target = screenRef.current;
    if (!target || !instanceId || !token) {
      setState("failed");
      setMessage("远程会话参数不完整，请返回实例控制台重新发起连接。");
      return;
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketURL = `${protocol}//${window.location.host}/api/v1/instance/${encodeURIComponent(instanceId)}/vnc/ws?token=${encodeURIComponent(token)}`;
    const rfb = new RFB(target, socketURL, { shared: false });
    rfb.scaleViewport = true;
    rfb.resizeSession = true;
    rfb.showDotCursor = true;
    rfb.viewOnly = false;
    rfbRef.current = rfb;

    const connected = () => { setState("connected"); setMessage(""); };
    const disconnected = (event: Event) => {
      const clean = Boolean((event as CustomEvent<{ clean?: boolean }>).detail?.clean);
      setState(clean ? "disconnected" : "failed");
      setMessage(clean ? "远程连接已关闭。" : "远程连接已中断，请返回实例控制台重新发起连接。");
    };
    const failed = () => {
      setState("failed");
      setMessage("远程会话验证失败或服务端拒绝了连接。");
    };
    const credentialsRequired = () => {
      setState("failed");
      setMessage("远程主机要求额外认证，服务端适配器未能完成认证。");
      rfb.disconnect();
    };
    rfb.addEventListener("connect", connected);
    rfb.addEventListener("disconnect", disconnected);
    rfb.addEventListener("securityfailure", failed);
    rfb.addEventListener("credentialsrequired", credentialsRequired);
    return () => {
      rfb.removeEventListener("connect", connected);
      rfb.removeEventListener("disconnect", disconnected);
      rfb.removeEventListener("securityfailure", failed);
      rfb.removeEventListener("credentialsrequired", credentialsRequired);
      rfb.disconnect();
      rfbRef.current = null;
    };
  }, [instanceId, token]);

  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      rfbRef.current?.clipboardPasteFrom(text);
      setMessage("剪贴板文本已发送到远程主机。");
    } catch {
      setMessage("浏览器未授予剪贴板读取权限。");
    }
  };

  return (
    <LayerCard className="shadow-none flex min-h-screen flex-col p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kumo-line p-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-kumo-strong">实例远程控制台</span>
          <Badge variant={state === "connected" ? "success" : state === "failed" ? "error" : "warning"}>{statusLabels[state]}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={state !== "connected"} onClick={() => rfbRef.current?.sendCtrlAltDel()}>发送 Ctrl+Alt+Del</Button>
          <Button variant="secondary" disabled={state !== "connected"} onClick={pasteClipboard}>粘贴剪贴板</Button>
          <Button variant="secondary" onClick={() => screenRef.current?.requestFullscreen()}>全屏</Button>
          <Button variant="destructive" onClick={() => rfbRef.current?.disconnect()}>断开连接</Button>
        </div>
      </div>
      {message ? <div className="p-3"><Banner variant={state === "failed" ? "error" : undefined} title="远程控制台提示" description={message} /></div> : null}
      <div ref={screenRef} className="min-h-0 flex-1 overflow-hidden" aria-label="远程桌面画面" />
    </LayerCard>
  );
}
