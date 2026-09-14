import { Badge, Button, LayerCard, Switch, Tabs } from "@cloudflare/kumo";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
export function ComponentsPage() {
  return (
    <>
      <PageHeader
        title="界面状态预览"
        description="兼容旧版组件展示路由，用于核对统一的 Kumo 视觉语言。"
      />
      <LayerCard className="shadow-none grid gap-5 p-5">
        <div className="flex flex-wrap gap-2">
          <Button>主操作</Button>
          <Button variant="secondary">次操作</Button>
          <Badge variant="success">运行中</Badge>
          <Badge variant="warning">待处理</Badge>
          <Badge variant="error">失败</Badge>
        </div>
        <Tabs
          tabs={[
            { value: "data", label: "有数据" },
            { value: "empty", label: "空状态" },
            { value: "loading", label: "加载中" },
            { value: "error", label: "错误" },
          ]}
          selectedValue="data"
        />
        <Switch label="示例开关" defaultChecked />
      </LayerCard>
      <PageState>
        <LayerCard className="shadow-none p-5">
          通过查询参数 ?state=empty、loading、error 可检查对应页面状态。
        </LayerCard>
      </PageState>
    </>
  );
}
