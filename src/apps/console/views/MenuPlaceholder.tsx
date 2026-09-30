import { Empty } from "@cloudflare/kumo";
import { useLocation } from "react-router-dom";
import { SupportCenter } from "./SupportCenter";
import { PageHeader } from "../../../shared/components/PageHeader";

const menuPages: Record<string, { title: string; description: string }> = {
  "/console/invoices": { title: "发票管理", description: "当前账户暂无可展示的发票记录。" },
  "/console/invoices/list": { title: "发票列表", description: "当前账户暂无可展示的发票记录。" },
  "/console/invoices/titles": { title: "发票抬头", description: "当前账户暂无已保存的发票抬头。" },
  "/console/invoices/addresses": { title: "收货地址", description: "当前账户暂无已保存的收货地址。" },
  "/console/transactions": { title: "交易记录", description: "当前账户暂无可展示的交易记录。" },
  "/console/messages": { title: "消息中心", description: "当前暂无新消息。" },
  "/console/logs": { title: "系统日志", description: "当前暂无可展示的登录或操作记录。" },
  "/console/api": { title: "API管理", description: "当前账户暂无可用的 API 凭据。" },
  "/console/help": { title: "帮助中心", description: "当前暂无可展示的帮助文档。" },
};

export function MenuPlaceholder() {
  const location = useLocation();
  if (location.pathname === "/console/help") return <SupportCenter />;
  const page = menuPages[location.pathname] ?? { title: "服务中心", description: "当前暂无可展示的内容。" };
  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      <Empty title={page.title} description={page.description} />
    </>
  );
}
