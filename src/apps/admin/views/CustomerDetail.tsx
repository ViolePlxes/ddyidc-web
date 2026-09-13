import {
  Badge,
  Banner,
  Breadcrumbs,
  Button,
  Dialog,
  Input,
  LayerCard,
  Pagination,
  Select,
  Switch,
  Table,
  Tabs,
  Text,
  Textarea,
} from "@cloudflare/kumo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
  adminOverviewApi,
  type AdminCustomerRow,
} from "../../../shared/api/adminOverview";
import {
  customerDetailApi,
  type CustomerProfile,
  type CustomerProfileInput,
} from "../../../shared/api/customerDetail";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { PhoneCountrySelect } from "../../../shared/components/PhoneCountrySelect";
import { formatDate, formatMoney } from "../../../shared/utils/format";

const tabs = [
  { value: "profile", label: "个人资料" },
  { value: "products", label: "产品信息" },
  { value: "orders", label: "订单管理" },
  { value: "transactions", label: "交易流水" },
  { value: "operation-logs", label: "操作日志" },
  { value: "notification-logs", label: "通知日志" },
  { value: "tickets", label: "工单" },
  { value: "referrals", label: "推介计划" },
  { value: "notes", label: "信息记录" },
];
const realnameLabels: Record<number, string> = {
  0: "未实名",
  1: "待审核",
  2: "已认证",
  3: "已拒绝",
};
const productLabels: Record<number, string> = {
  1: "待开通",
  2: "开通中",
  3: "运行中",
  4: "已停机",
  5: "已过期",
  6: "已删除",
};
const orderLabels: Record<number, string> = {
  1: "待支付",
  2: "已支付",
  3: "已取消",
  4: "已退款",
  5: "部分退款",
  6: "已完成",
};
const flowLabels: Record<number, string> = {
  1: "充值",
  2: "消费",
  3: "退款",
  4: "提现",
  5: "佣金",
  6: "调整",
};
function RecordList({ id, kind }: { id: string; kind: string }) {
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(false);
  const query = useQuery({
    queryKey: ["admin", "customer-records", id, kind, page, active],
    queryFn: () => customerDetailApi.records(id, kind, page, active),
  });
  const headers =
    kind === "logins"
      ? ["IP 地址", "登录时间", "标记"]
      : kind === "transactions"
        ? [
            "流水号",
            "类型",
            "金额（元）",
            "变动前余额",
            "变动后余额",
            "备注",
            "时间",
          ]
        : kind === "products"
          ? ["产品", "实例编号", "状态", "IP 地址", "到期时间"]
          : ["产品", "订单号", "状态", "金额（元）", "创建时间"];
  return (
    <div className="grid gap-4">
      {kind === "products" ? (
        <Tabs
          variant="segmented"
          value={active ? "active" : "all"}
          tabs={[
            { value: "all", label: "全部产品" },
            { value: "active", label: "有效产品" },
          ]}
          onValueChange={(v) => {
            setActive(v === "active");
            setPage(1);
          }}
        />
      ) : null}
      <PageState
        loading={query.isLoading}
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.error && !query.data?.items?.length}
        emptyTitle="暂无记录"
      >
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                {headers.map((h) => (
                  <Table.Head key={h}>{h}</Table.Head>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {query.data?.items?.map((r, i) => {
                let cells: ReactNode[];
                if (kind === "logins")
                  cells = [
                    r.ip,
                    formatDate(r.created_at),
                    page === 1 && i === 0 ? (
                      <Badge variant="info">最近</Badge>
                    ) : (
                      "—"
                    ),
                  ];
                else if (kind === "transactions")
                  cells = [
                    r.number,
                    flowLabels[r.type] ?? `类型 ${r.type}`,
                    `${r.direction === 2 ? "−" : "+"}${formatMoney(r.amount)}`,
                    formatMoney(r.balance_before),
                    formatMoney(r.balance_after),
                    r.remark || "—",
                    formatDate(r.created_at),
                  ];
                else if (kind === "products")
                  cells = [
                    r.name,
                    r.number,
                    <Badge variant="secondary">
                      {productLabels[r.status] ?? r.status}
                    </Badge>,
                    r.ip || "—",
                    r.expires_at ? formatDate(r.expires_at) : "—",
                  ];
                else
                  cells = [
                    r.name,
                    r.number,
                    <Badge variant="secondary">
                      {orderLabels[r.status] ?? r.status}
                    </Badge>,
                    formatMoney(r.amount),
                    formatDate(r.created_at),
                  ];
                return (
                  <Table.Row key={r.id}>
                    {cells.map((cell, index) => (
                      <Table.Cell key={index}>{cell}</Table.Cell>
                    ))}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      </PageState>
      {query.data?.total ? (
        <Pagination
          page={page}
          setPage={setPage}
          perPage={10}
          totalCount={query.data.total}
        />
      ) : null}
    </div>
  );
}
function ProfileEditor({
  customer,
  profile,
}: {
  customer: AdminCustomerRow;
  profile: CustomerProfile;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const parsed = parsePhoneNumberFromString(customer.phone, "CN");
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(
    parsed?.country ?? "CN",
  );
  const [form, setForm] = useState<CustomerProfileInput>({
    operationPassword: "",
    name: profile.name,
    company: profile.company,
    countryCode: parsed ? `+${parsed.countryCallingCode}` : "+86",
    mobile: parsed ? String(parsed.nationalNumber) : customer.phone,
    email: customer.email,
    country: customer.country,
    address: profile.address,
    language: customer.language || "zh-CN",
    password: "",
    remark: profile.settings.remark,
    receiveSms: profile.settings.receiveSms,
    receiveEmail: profile.settings.receiveEmail,
  });
  const [dialog, setDialog] = useState("");
  const [saved, setSaved] = useState(false);
  const update = <K extends keyof CustomerProfileInput>(
    key: K,
    value: CustomerProfileInput[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["admin", "customers"] });
  const save = useMutation({
    mutationFn: () => customerDetailApi.save(customer.id, form),
    onSuccess: () => {
      setSaved(true);
      setForm((current) => ({
        ...current,
        password: "",
        operationPassword: "",
      }));
      void refresh();
    },
  });
  const remove = useMutation({
    mutationFn: () => customerDetailApi.remove(customer.id),
    onSuccess: () => {
      void refresh();
      navigate("/admin/customers");
    },
  });
  const status = useMutation({
    mutationFn: () =>
      customerDetailApi.status(customer.id, customer.status === 1 ? 2 : 1),
    onSuccess: () => {
      setDialog("");
      void refresh();
    },
  });
  const metrics = [
    { label: "余额", value: formatMoney(customer.balance) },
    { label: "消费", value: formatMoney(customer.consumeAmount) },
    { label: "退款", value: formatMoney(customer.refundAmount) },
    { label: "提现", value: formatMoney(customer.withdrawalAmount) },
    { label: "产品总数", value: customer.productCount },
    { label: "有效数量", value: customer.activeProductCount },
  ];
  return (
    <div className="grid gap-4">
      <LayerCard className="grid gap-5 p-5">
        <Text as="h2" variant="heading">
          账户信息
        </Text>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {metrics.map((m) => (
            <div key={m.label}>
              <p>
                {m.label}
                {typeof m.value === "string" ? "（元）" : ""}
              </p>
              <Text as="p" variant="heading" size="lg">
                {m.value}
              </Text>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span>注册时间：{formatDate(customer.createdAt)}</span>
          <span>
            实名状态：
            <Badge
              variant={customer.realnameStatus === 2 ? "success" : "secondary"}
            >
              {realnameLabels[customer.realnameStatus] ?? "未知"}
            </Badge>
          </span>
          <Button variant="ghost" onClick={() => setDialog("实名认证")}>
            查看
          </Button>
          <Badge variant={customer.status === 1 ? "success" : "warning"}>
            {customer.status === 1 ? "已启用" : "已停用"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {["充值", "余额冻结", "强制变更", "变更记录", "以用户登录"].map(
            (action) => (
              <Button
                key={action}
                variant="secondary"
                onClick={() => setDialog(action)}
              >
                {action}
              </Button>
            ),
          )}
        </div>
        <div className="flex flex-wrap gap-5">
          <Switch
            label="社交绑定"
            checked={Boolean(customer.socialLogin)}
            disabled
          />
          <span>{customer.socialLogin || "未绑定社交账号"}</span>
          <Switch
            label="是否接收短信"
            checked={form.receiveSms}
            onCheckedChange={(v) => update("receiveSms", v)}
          />
          <Switch
            label="是否接收邮件"
            checked={form.receiveEmail}
            onCheckedChange={(v) => update("receiveEmail", v)}
          />
        </div>
        <p>
          短信与邮件偏好随基础资料保存。社交绑定由用户授权，暂不支持管理员代绑。
        </p>
      </LayerCard>
      <div className="grid items-start gap-4 xl:grid-cols-3">
        <LayerCard className="grid gap-4 p-5 xl:col-span-2">
          <Text as="h2" variant="heading">
            基础资料
          </Text>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="姓名"
                required
                maxLength={64}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <Input
                label="邮箱"
                type="email"
                maxLength={128}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <PhoneCountrySelect
                value={phoneCountry}
                onChange={(country, code) => {
                  setPhoneCountry(country);
                  update("countryCode", code);
                }}
              />
              <Input
                label="手机号"
                inputMode="tel"
                value={form.mobile}
                onChange={(e) => update("mobile", e.target.value)}
              />
              <Input
                label="操作密码"
                type="password"
                autoComplete="new-password"
                value={form.operationPassword}
                onChange={(e) => update("operationPassword", e.target.value)}
                description={`${profile.operationPasswordSet ? "已设置；" : ""}留空保持，6–20 位。业务操作二次校验待接入。`}
              />
              <Input
                label="国家"
                maxLength={64}
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              />
              <Input
                label="公司"
                maxLength={128}
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
              <Select
                label="语言"
                value={form.language}
                items={{
                  "zh-CN": "简体中文",
                  "zh-TW": "繁体中文",
                  en: "English",
                }}
                onValueChange={(v) => {
                  if (v) update("language", v);
                }}
              />
              <Input
                label="密码"
                type="password"
                autoComplete="new-password"
                description="留空保持不变；设置为 6–20 位，保存后撤销用户会话"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
            <Textarea
              label="地址"
              maxLength={255}
              description={`${Array.from(form.address).length}/255`}
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
            <Textarea
              label="备注"
              maxLength={1000}
              description={`${Array.from(form.remark).length}/1000`}
              value={form.remark}
              onChange={(e) => update("remark", e.target.value)}
            />
            {save.error ? (
              <Banner variant="error" title={getApiMessage(save.error)} />
            ) : null}
            {saved ? <Banner variant="default" title="资料已保存" /> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" loading={save.isPending}>
                保存
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialog("删除")}
              >
                删除
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDialog("账户状态")}
              >
                {customer.status === 1 ? "停用" : "启用"}
              </Button>
            </div>
          </form>
        </LayerCard>
        <LayerCard className="grid gap-4 p-5">
          <Text as="h2" variant="heading">
            登录记录
          </Text>
          <RecordList id={customer.id} kind="logins" />
        </LayerCard>
      </div>
      <Dialog.Root
        open={Boolean(dialog)}
        onOpenChange={(open) => {
          if (!open) setDialog("");
        }}
      >
        <Dialog className="grid gap-4 p-6">
          <Dialog.Title>{dialog}</Dialog.Title>
          <Dialog.Description>
            {dialog === "账户状态"
              ? `确认${customer.status === 1 ? "停用" : "启用"}此用户？现有用户会话将失效。`
              : dialog === "实名认证"
                ? "最近一次实名认证摘要"
                : dialog === "删除"
                  ? "确认删除此用户？删除后将无法登录或从列表查看；有关联业务或资金账户的用户禁止删除。"
                  : `${dialog}功能开发中，尚未执行任何操作。`}
          </Dialog.Description>
          {dialog === "实名认证" ? (
            profile.realname?.length ? (
              profile.realname.map((r, i) => (
                <div key={i} className="grid gap-2">
                  <p>
                    {r.type === 2 ? "企业认证" : "个人认证"} ·{" "}
                    {realnameLabels[r.status]}
                  </p>
                  <p>姓名：{r.name}</p>
                  {r.companyName ? <p>公司：{r.companyName}</p> : null}
                  <p>提交时间：{formatDate(r.createdAt)}</p>
                  {r.rejectReason ? <p>拒绝原因：{r.rejectReason}</p> : null}
                </div>
              ))
            ) : (
              <p>暂无实名认证记录</p>
            )
          ) : null}
          {remove.error ? (
            <Banner variant="error" title={getApiMessage(remove.error)} />
          ) : null}
          {status.error ? (
            <Banner variant="error" title={getApiMessage(status.error)} />
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialog("")}>
              关闭
            </Button>
            {dialog === "删除" ? (
              <Button
                variant="destructive"
                loading={remove.isPending}
                onClick={() => remove.mutate()}
              >
                确认删除
              </Button>
            ) : null}
            {dialog === "账户状态" ? (
              <Button
                loading={status.isPending}
                onClick={() => status.mutate()}
              >
                确认{customer.status === 1 ? "停用" : "启用"}
              </Button>
            ) : null}
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  );
}
export function AdminCustomerDetail() {
  const { id = "", tab = "profile" } = useParams();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [userPage, setUserPage] = useState(1);
  const customer = useQuery({
    queryKey: ["admin", "customers", "detail", id],
    queryFn: () => adminOverviewApi.customer(id),
    enabled: Boolean(id),
  });
  const profile = useQuery({
    queryKey: ["admin", "customers", "profile", id],
    queryFn: () => customerDetailApi.profile(id),
    enabled: Boolean(id) && tab === "profile",
  });
  const users = useQuery({
    queryKey: ["admin", "customer-switcher", keyword, userPage],
    queryFn: () =>
      adminOverviewApi.customers({ page: userPage, pageSize: 20, keyword }),
  });
  if (!tabs.some((item) => item.value === tab))
    return <Navigate to={`/admin/customers/${id}/profile`} replace />;
  const current = customer.data;
  const options = [
    ...(current ? [current] : []),
    ...(users.data?.items ?? []).filter((u) => u.id !== id),
  ].map((u) => ({
    value: u.id,
    label: `#${u.id}-${u.name || u.username}${u.company ? `(${u.company})` : ""}`,
  }));
  return (
    <>
      <Breadcrumbs>
        <Breadcrumbs.Link href="/admin">后台</Breadcrumbs.Link>
        <Breadcrumbs.Separator />
        <Breadcrumbs.Link href="/admin/customers">客户管理</Breadcrumbs.Link>
        <Breadcrumbs.Separator />
        <Breadcrumbs.Current>用户详情</Breadcrumbs.Current>
      </Breadcrumbs>
      <PageHeader
        title={current?.displayName || current?.username || "用户详情"}
        description={`用户 ID：${id}`}
        actions={
          <div className="grid gap-2">
            <Input
              aria-label="搜索切换用户"
              placeholder="搜索姓名、手机号或邮箱"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setUserPage(1);
              }}
            />
            <Select
              label="切换用户"
              value={id}
              items={options}
              onValueChange={(value) => {
                if (value && value !== id)
                  navigate(`/admin/customers/${value}/${tab}`);
              }}
            />
            {users.data && users.data.total > 20 ? (
              <Pagination
                page={userPage}
                setPage={setUserPage}
                perPage={20}
                totalCount={users.data.total}
              />
            ) : null}
            {users.error ? (
              <Banner variant="error" title={getApiMessage(users.error)} />
            ) : null}
          </div>
        }
      />
      <div className="overflow-x-auto">
        <Tabs
          variant="underline"
          tabs={tabs}
          value={tab}
          onValueChange={(value) => navigate(`/admin/customers/${id}/${value}`)}
        />
      </div>
      <PageState
        loading={customer.isLoading || (tab === "profile" && profile.isLoading)}
        skeleton="detail"
        error={
          customer.error
            ? getApiMessage(customer.error)
            : tab === "profile" && profile.error
              ? getApiMessage(profile.error)
              : null
        }
      >
        {current ? (
          tab === "profile" ? (
            profile.data ? (
              <ProfileEditor
                key={id}
                customer={current}
                profile={profile.data}
              />
            ) : null
          ) : ["products", "orders", "transactions"].includes(tab) ? (
            <LayerCard className="p-5">
              <RecordList key={`${id}-${tab}`} id={id} kind={tab} />
            </LayerCard>
          ) : (
            <LayerCard className="grid gap-3 p-5">
              <Text as="h2" variant="heading">
                {tabs.find((item) => item.value === tab)?.label}
              </Text>
              <p>开发中</p>
            </LayerCard>
          )
        ) : null}
      </PageState>
    </>
  );
}
