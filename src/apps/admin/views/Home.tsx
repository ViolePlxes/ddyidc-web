import { DataTable } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { TrendChart } from "../../../shared/components/TrendChart";
import { adminMetrics, adminOrderRows } from "../mocks";

export function AdminHome() {
  return (
    <>
      <PageHeader
        title="管理后台"
        description="查看全站经营指标和待处理事项。"
      />
      <MetricGrid metrics={adminMetrics} />
      <TrendChart title="近 30 天收入" type="bar" />
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold text-kumo-strong">最近订单</h2>
        <DataTable
          rows={adminOrderRows}
          primaryLabel="客户 / 商品"
          secondaryLabel="订单号"
        />
      </section>
    </>
  );
}
