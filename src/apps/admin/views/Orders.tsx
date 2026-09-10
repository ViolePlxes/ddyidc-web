import { ManagementPage } from "./ManagementPage";
import { adminOrderRows } from "../mocks";
export function AdminOrders() {
  return (
    <ManagementPage
      title="订单管理"
      description="筛选订单、查看详情与处理状态。"
      rows={adminOrderRows}
      primaryLabel="客户 / 商品"
      secondaryLabel="订单号"
      actionLabel="查看订单详情"
      showFilters
    />
  );
}
