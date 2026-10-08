import { Component, type ReactNode } from "react";
import { Banner, Button } from "@cloudflare/kumo";

/** Keep a failed page from unmounting the dashboard navigation. */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <div role="alert" className="p-4">
        <Banner variant="error" title="页面加载失败"
          description="请尝试进入其他页面，或重新加载当前页面。"
          action={<Button variant="secondary" onClick={() => window.location.reload()}>重新加载</Button>} />
      </div>;
    }
    return this.props.children;
  }
}
