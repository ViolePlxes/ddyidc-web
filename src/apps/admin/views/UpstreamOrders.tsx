import { DataTable } from "../../../shared/components/DataTable";
import { MetricGrid } from "../../../shared/components/MetricGrid";
import { PageHeader } from "../../../shared/components/PageHeader";
import { adminOrderRows } from "../mocks";
export function UpstreamOrders() {
  const metrics = [
    { label: "销售额", value: "¥286,420", hint: "本月累计" },
    { label: "成本", value: "¥222,240", hint: "换算后成本" },
    { label: "利润", value: "¥64,180", hint: "利润率 22.4%" },
    { label: "上游实例", value: "1,492", hint: "正常 1,466" },
  ];
  return (
    <>
      <PageHeader
        title="上游订单管理"
        description="核对上游成本、利润、支付方式与开通状态。"
      />
      <MetricGrid metrics={metrics} />
      <DataTable
        rows={adminOrderRows}
        primaryLabel="联系人 / 商品"
        secondaryLabel="订单号"
        withPagination
      />
    </>
  );
}
