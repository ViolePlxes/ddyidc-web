import { Button, Input, LayerCard, Switch } from "@cloudflare/kumo";
import { DataTable } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { inviteRows, rewardRows, salesRows } from "../mocks";
import { ManagementPage } from "./ManagementPage";

export function AdminInvites() {
  return (
    <ManagementPage
      title="邀请码管理"
      description="生成邀请码并处理申请审核。"
      rows={inviteRows}
      primaryLabel="邀请码"
      secondaryLabel="所属用户"
      actionLabel="生成邀请码"
      showFilters
    />
  );
}
export function AdminRewards() {
  return (
    <>
      <PageHeader
        title="分销管理"
        description="配置分销层级并查看奖励结算记录。"
        actions={<Button>保存配置</Button>}
      />
      <LayerCard className="grid gap-4 p-5 sm:grid-cols-2">
        <Input
          label="一级奖励比例"
          type="number"
          defaultValue="20"
          description="百分比"
        />
        <Input
          label="二级奖励比例"
          type="number"
          defaultValue="10"
          description="百分比"
        />
        <Switch label="允许申请提现" defaultChecked />
      </LayerCard>
      <DataTable
        rows={rewardRows}
        primaryLabel="奖励类型"
        secondaryLabel="来源订单"
        withPagination
      />
    </>
  );
}
export function AdminSales() {
  return (
    <>
      <PageHeader
        title="销售客服"
        description="管理销售账号、客户分配和可见字段权限。"
        actions={<Button>新增销售账号</Button>}
      />
      <DataTable
        rows={salesRows}
        primaryLabel="销售"
        secondaryLabel="登录账号"
        withPagination
      />
      <LayerCard className="grid gap-4 p-5">
        <h2 className="text-lg font-semibold text-kumo-strong">
          客户可见字段权限
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Switch label="查看手机号" defaultChecked />
          <Switch label="查看邮箱" defaultChecked />
          <Switch label="查看订单" defaultChecked />
          <Switch label="查看消费金额" />
          <Switch label="查看账户余额" />
          <Switch label="记录客户跟进" defaultChecked />
        </div>
      </LayerCard>
    </>
  );
}
export function AdminMarketingConfig() {
  const toggles = ["邀请码功能", "分销功能", "奖励结算", "拉新活动"];
  return (
    <>
      <PageHeader
        title="营销配置"
        description="统一控制营销能力、等级与外部渠道预留。"
        actions={<Button>保存配置</Button>}
      />
      <LayerCard className="grid gap-4 p-5">
        <h2 className="text-lg font-semibold text-kumo-strong">功能开关</h2>
        {toggles.map((label) => (
          <Switch key={label} label={label} defaultChecked />
        ))}
      </LayerCard>
      <LayerCard className="grid gap-4 p-5">
        <h2 className="text-lg font-semibold text-kumo-strong">等级与奖励</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="等级数量" type="number" defaultValue="2" />
          <Input label="一级奖励" defaultValue="20%" />
          <Input label="二级奖励" defaultValue="10%" />
        </div>
      </LayerCard>
      <LayerCard className="grid gap-4 p-5">
        <h2 className="text-lg font-semibold text-kumo-strong">
          渠道配置（预留）
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="微信公众号 AppID" placeholder="待配置" disabled />
          <Input label="小程序 AppID" placeholder="待配置" disabled />
          <Input label="QQ 互联 AppID" placeholder="待配置" disabled />
        </div>
      </LayerCard>
    </>
  );
}
