import { Badge, Button, LayerCard } from "@cloudflare/kumo";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { adminOverviewApi } from "../../../shared/api/adminOverview";
import { getApiMessage } from "../../../shared/api/request";
import { DefinitionList } from "../../../shared/components/DataTable";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { formatDate, formatMoney } from "../../../shared/utils/format";

function realnameLabel(status: number) {
  if (status === 2) return <Badge variant="success">已认证</Badge>;
  if (status === 1) return <Badge variant="warning">待审核</Badge>;
  if (status === 3) return <Badge variant="error">已拒绝</Badge>;
  return <Badge variant="secondary">未实名</Badge>;
}

export function AdminCustomerDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["admin", "customers", "detail", id],
    queryFn: () => adminOverviewApi.customer(id),
    enabled: Boolean(id),
  });
  const customer = query.data;

  return (
    <>
      <PageHeader
        title={customer?.displayName || customer?.username || "用户详情"}
        description={customer ? `用户 ID：${customer.id}` : "查看用户信息与产品资金汇总。"}
        actions={
          <Button
            variant="secondary"
            icon={<ArrowLeftIcon />}
            onClick={() => navigate("/admin/customers")}
          >
            返回列表
          </Button>
        }
      />
      <PageState
        loading={query.isLoading}
        skeleton="detail"
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.error && !customer}
        emptyTitle="用户不存在"
      >
        {customer ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <LayerCard className="p-5">
              <h2 className="mb-3 text-lg font-semibold text-kumo-strong">用户信息</h2>
              <DefinitionList
                rows={[
                  { label: "用户 ID", value: customer.id },
                  { label: "账号", value: customer.username },
                  { label: "姓名（公司）", value: customer.displayName || "—" },
                  { label: "实名状态", value: realnameLabel(customer.realnameStatus) },
                  { label: "联系方式", value: customer.phone || "—" },
                  { label: "邮箱", value: customer.email || "—" },
                  {
                    label: "是否启用",
                    value: customer.status === 1
                      ? <Badge variant="success">已启用</Badge>
                      : <Badge variant="warning">未启用</Badge>,
                  },
                  { label: "社交登录", value: customer.socialLogin || "—" },
                  { label: "注册时间", value: formatDate(customer.createdAt) },
                  { label: "国家", value: customer.country || "—" },
                  { label: "地址", value: customer.address || "—" },
                  { label: "语言", value: customer.language || "—" },
                  { label: "备注", value: customer.remark || "—" },
                ]}
              />
            </LayerCard>
            <LayerCard className="p-5">
              <h2 className="mb-3 text-lg font-semibold text-kumo-strong">产品信息</h2>
              <DefinitionList
                rows={[
                  { label: "有效产品数量", value: customer.activeProductCount },
                  { label: "产品总数", value: customer.productCount },
                  { label: "余额", value: formatMoney(customer.balance) },
                  { label: "消费金额", value: formatMoney(customer.consumeAmount) },
                  { label: "退款金额", value: formatMoney(customer.refundAmount) },
                  { label: "提现金额", value: formatMoney(customer.withdrawalAmount) },
                ]}
              />
            </LayerCard>
          </div>
        ) : null}
      </PageState>
    </>
  );
}
