import { Component, type ErrorInfo, type ReactNode } from "react";
import { Banner, Button } from "@cloudflare/kumo";

/**
 * Keep a failed page from unmounting the dashboard navigation.
 * A stale tab that requests a reclaimed asset is reloaded once so the new
 * entry document can load the current chunk graph.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; message: string }> {
  state = { failed: false, message: "" };

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("route render failed", error, info.componentStack);
    if (!/dynamically imported module|Importing a module script failed|Loading chunk/i.test(message)) return;
    const key = `ddyidc:chunk-reload:${window.location.pathname}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    window.location.reload();
  }

  render() {
    if (this.state.failed) {
      return <div role="alert" className="grid gap-3 p-4">
        <Banner variant="error" title="页面加载失败"
          description="页面资源可能已随新版本更新。可先重试，仍有问题再重新加载当前页面。"
          action={<div className="flex gap-2">
            <Button variant="secondary" onClick={() => this.setState({ failed: false, message: "" })}>重试</Button>
            <Button onClick={() => window.location.reload()}>重新加载</Button>
          </div>} />
        {this.state.message ? <details className="text-xs text-kumo-subtle"><summary>错误详情</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap">{this.state.message}</pre></details> : null}
      </div>;
    }
    return this.props.children;
  }
}
