import { Button, Input, LayerCard, Switch } from "@cloudflare/kumo";
import { DataTable } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";

const customerRows = [
  {
    id: "sc1",
    primary: "e2ea074640",
    secondary: "138****8021",
    meta: "最近跟进：今天 09:20",
    amount: "累计 ¥2,986",
  },
  {
    id: "sc2",
    primary: "cloud_user",
    secondary: "186****6632",
    meta: "最近跟进：昨天 16:40",
    amount: "累计 ¥1,268",
  },
];
export function SalesHome() {
  const metrics = [
    { label: "我的客户", value: "126", hint: "本周新增 8" },
    { label: "待跟进", value: "12", hint: "今日 5 项" },
    { label: "本月成交", value: "¥42,860", hint: "共 38 笔" },
    { label: "续费提醒", value: "7", hint: "未来 7 天到期" },
  ];
  return (
    <>
      <PageHeader
        title="销售工作台"
        description="仅展示已授权的客户字段与跟进信息。"
        actions={<Button>新增跟进</Button>}
      />
      <MetricGrid metrics={metrics} />
      <LayerCard className="grid gap-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Input
            aria-label="搜索客户"
            placeholder="搜索客户账号…"
            className="max-w-md flex-1"
          />
          <Button variant="secondary">筛选</Button>
        </div>
        <Switch label="仅显示待跟进客户" />
      </LayerCard>
      <DataTable
        rows={customerRows}
        primaryLabel="客户"
        secondaryLabel="可见手机号"
        withPagination
      />
    </>
  );
}
