import { ManagementPage } from "./ManagementPage";
import { customerRows } from "../mocks";
export function AdminCustomers() {
  return (
    <ManagementPage
      title="客户管理"
      description="查看客户资料、账户状态和资源摘要。"
      rows={customerRows}
      primaryLabel="客户账号"
      secondaryLabel="手机号"
      actionLabel="查看客户详情"
      showFilters
    />
  );
}
