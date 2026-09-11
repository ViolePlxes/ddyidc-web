import { Banner, Button, Input, LayerCard, Switch } from "@cloudflare/kumo";
import { PageHeader } from "../../../shared/components/PageHeader";
import { useAuthStore } from "../../../shared/stores/auth";

export function Profile() {
  const user = useAuthStore((state) => state.user);
  return (
    <>
      <PageHeader title="个人中心" description="以下资料来自当前登录会话。" />
      <Banner
        variant="alert"
        title="资料修改与换绑暂不可用"
        description="后端尚未提供资料更新、手机号绑定或密码重置接口；页面保持只读并明确展示真实会话资料。"
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <LayerCard className="grid gap-5 p-5">
          <h2 className="text-lg font-semibold text-kumo-strong">基本资料</h2>
          <Input label="账号" value={user?.account ?? ""} readOnly />
          <Input label="显示名称" value={user?.name ?? ""} readOnly />
          <Input label="邮箱" value={user?.email ?? "未绑定"} readOnly />
          <Input label="手机号" value={user?.mobile ?? "未绑定"} readOnly />
          <Button className="justify-self-start" disabled>保存资料</Button>
        </LayerCard>
        <LayerCard className="grid gap-5 p-5">
          <h2 className="text-lg font-semibold text-kumo-strong">安全设置</h2>
          <Switch label="登录邮件通知" disabled />
          <Switch label="异地登录提醒" disabled />
          <Switch label="敏感操作二次确认" disabled />
          <Button variant="secondary" disabled>更换手机号</Button>
        </LayerCard>
      </div>
    </>
  );
}
