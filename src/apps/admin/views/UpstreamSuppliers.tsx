import { ManagementPage } from "./ManagementPage";
import { supplierRows } from "../mocks";
export function UpstreamSuppliers() {
  return (
    <ManagementPage
      title="供应商管理"
      description="管理财务系统与智简魔方 V10 连接。"
      rows={supplierRows}
      primaryLabel="供应商"
      secondaryLabel="类型"
      actionLabel="新增供应商"
      showSwitch
    />
  );
}
