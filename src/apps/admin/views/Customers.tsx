import { AdminTableCopyText } from "../../../shared/components/AdminTableCopyText";
import { Pagination } from "../../../shared/components/Pagination";
import { adminBase } from "../../../shared/utils/adminEntry";
import { Badge } from "../../../shared/components/Badge";
import { Dialog, DialogPresence } from "../../../shared/components/Dialog";
import { Banner, Button, DropdownMenu, Input, LayerCard,  Select, Table, Tooltip } from "@cloudflare/kumo";
import {
  CaretDownIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  adminOverviewApi,
  type AdminCreateCustomerInput,
  type AdminCustomerRow,
} from "../../../shared/api/adminOverview";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PageState } from "../../../shared/components/PageState";
import { useAdminAuthStore } from "../../../shared/stores/staffAuth";
import { formatDate, formatMoney } from "../../../shared/utils/format";

type ColumnGroup = "用户信息" | "产品信息";
type ColumnKey =
  | "id"
  | "displayName"
  | "realnameStatus"
  | "phone"
  | "email"
  | "status"
  | "socialLogin"
  | "createdAt"
  | "country"
  | "address"
  | "language"
  | "remark"
  | "productCount"
  | "balance"
  | "consumeAmount"
  | "refundAmount"
  | "withdrawalAmount";

type CustomerForm = {
  name: string;
  country: CountryCode;
  countryCode: string;
  mobile: string;
  email: string;
  password: string;
};

const columns: { key: ColumnKey; label: string; group: ColumnGroup }[] = [
  { key: "id", label: "用户 ID", group: "用户信息" },
  { key: "displayName", label: "姓名（公司）", group: "用户信息" },
  { key: "realnameStatus", label: "实名状态", group: "用户信息" },
  { key: "phone", label: "联系方式", group: "用户信息" },
  { key: "email", label: "邮箱", group: "用户信息" },
  { key: "status", label: "是否启用", group: "用户信息" },
  { key: "socialLogin", label: "社交登录", group: "用户信息" },
  { key: "createdAt", label: "注册时间", group: "用户信息" },
  { key: "country", label: "国家", group: "用户信息" },
  { key: "address", label: "地址", group: "用户信息" },
  { key: "language", label: "语言", group: "用户信息" },
  { key: "remark", label: "备注", group: "用户信息" },
  { key: "productCount", label: "有效产品数量（产品总数）", group: "产品信息" },
  { key: "balance", label: "余额", group: "产品信息" },
  { key: "consumeAmount", label: "消费金额", group: "产品信息" },
  { key: "refundAmount", label: "退款金额", group: "产品信息" },
  { key: "withdrawalAmount", label: "提现金额", group: "产品信息" },
];

const defaultColumns: ColumnKey[] = [
  "id",
  "displayName",
  "realnameStatus",
  "phone",
  "email",
  "productCount",
  "status",
  "balance",
];
const mainlandMobilePattern = /^1[3-9]\d{9}$/;
const regionNames = new Intl.DisplayNames(["zh-CN"], { type: "region" });
const validColumnKeys = new Set<ColumnKey>(columns.map((column) => column.key));

function loadColumns(storageKey: string): ColumnKey[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (!Array.isArray(parsed)) return defaultColumns;
    const selected = parsed.filter(
      (value): value is ColumnKey =>
        typeof value === "string" && validColumnKeys.has(value as ColumnKey),
    );
    return ["id", ...selected.filter((value) => value !== "id")];
  } catch {
    return defaultColumns;
  }
}

function realnameBadge(status: number) {
  if (status === 2) return <Badge variant="success">已认证</Badge>;
  if (status === 1) return <Badge variant="warning">待审核</Badge>;
  if (status === 3) return <Badge variant="error">已拒绝</Badge>;
  return <Badge variant="secondary">未实名</Badge>;
}

function customerSummary(customer: AdminCustomerRow) {
  return (
    <div className="grid gap-1 text-base">
      <strong className="font-medium">{customer.displayName || customer.username}</strong>
      <span>{customer.email || "未绑定邮箱"}</span>
      <span>{customer.phone || "未绑定手机号"}</span>
      <span>{customer.status === 1 ? "账号已启用" : "账号未启用"}</span>
    </div>
  );
}

function customerLink(customer: AdminCustomerRow, value: string) {
  return (
    <Tooltip
      content={customerSummary(customer)}
      render={
        <Link
          className="font-medium text-kumo-link hover:underline"
          to={`${adminBase}/customers/${customer.id}`}
        >
          {value}
        </Link>
      }
    />
  );
}

function renderCell(column: ColumnKey, customer: AdminCustomerRow): ReactNode {
  switch (column) {
    case "id":
      return <AdminTableCopyText value={customer.id} label="用户 ID">{customerLink(customer, customer.id)}</AdminTableCopyText>;
    case "displayName":
      return <AdminTableCopyText value={customer.displayName || customer.username} label="客户姓名">{customerLink(customer, customer.displayName || customer.username)}</AdminTableCopyText>;
    case "realnameStatus":
      return realnameBadge(customer.realnameStatus);
    case "phone":
      return <AdminTableCopyText value={customer.phone} label="联系方式"/>;
    case "email":
      return <AdminTableCopyText value={customer.email} label="邮箱"/>;
    case "status":
      return customer.status === 1 ? (
        <Badge variant="success">已启用</Badge>
      ) : (
        <Badge variant="warning">未启用</Badge>
      );
    case "socialLogin":
      return customer.socialLogin || "—";
    case "createdAt":
      return formatDate(customer.createdAt);
    case "country":
      return customer.country || "—";
    case "address":
      return <AdminTableCopyText value={customer.address} label="地址"/>;
    case "language":
      return customer.language || "—";
    case "remark":
      return customer.remark || "—";
    case "productCount":
      return `${customer.activeProductCount}（${customer.productCount}）`;
    case "balance":
      return formatMoney(customer.balance);
    case "consumeAmount":
      return formatMoney(customer.consumeAmount);
    case "refundAmount":
      return formatMoney(customer.refundAmount);
    case "withdrawalAmount":
      return formatMoney(customer.withdrawalAmount);
  }
}

function ColumnSettings({
  visible,
  onToggle,
}: {
  visible: Set<ColumnKey>;
  onToggle: (key: ColumnKey, checked: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        render={
          <Button
            variant="secondary"
            icon={<SlidersHorizontalIcon />}
          >
            列设置 <CaretDownIcon />
          </Button>
        }
      />
      <DropdownMenu.Content>
        {(["用户信息", "产品信息"] as const).map((group, groupIndex) => (
          <DropdownMenu.Group key={group}>
            {groupIndex > 0 ? <DropdownMenu.Separator /> : null}
            <DropdownMenu.Label>{group}</DropdownMenu.Label>
            {columns
              .filter((column) => column.group === group)
              .map((column) => (
                <DropdownMenu.CheckboxItem
                  key={column.key}
                  checked={visible.has(column.key)}
                  disabled={column.key === "id"}
                  closeOnClick={false}
                  onCheckedChange={(checked) => onToggle(column.key, checked)}
                >
                  {column.label}
                </DropdownMenu.CheckboxItem>
              ))}
          </DropdownMenu.Group>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}

function CreateCustomerDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (customer: AdminCustomerRow) => void;
}) {
  const [form, setForm] = useState<CustomerForm>({
    name: "",
    country: "CN",
    countryCode: "+86",
    mobile: "",
    email: "",
    password: "",
  });
  const [validationError, setValidationError] = useState("");
  const countries = useMemo(
    () =>
      getCountries()
        .map((country) => {
          const callingCode = `+${getCountryCallingCode(country)}`;
          return {
            value: country,
            label: `${regionNames.of(country) ?? country} ${callingCode}`,
            callingCode,
          };
        })
        .sort((left, right) =>
          left.value === "CN"
            ? -1
            : right.value === "CN"
              ? 1
              : left.label.localeCompare(right.label, "zh-CN"),
        ),
    [],
  );
  const mutation = useMutation({
    mutationFn: (input: AdminCreateCustomerInput) =>
      adminOverviewApi.createCustomer(input),
    onSuccess: onCreated,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const mobile = form.mobile.trim();
    const email = form.email.trim();
    let message = "";
    if (!form.name.trim()) message = "请输入姓名 / 公司";
    else if (!mobile && !email) message = "手机号与邮箱至少填写一项";
    else if (mobile && form.countryCode === "+86" && !mainlandMobilePattern.test(mobile)) {
      message = "请输入正确的 11 位中国大陆手机号";
    } else if (form.password.length < 6 || form.password.length > 20) {
      message = "请输入 6-20 位密码";
    }
    setValidationError(message);
    if (message) return;
    mutation.mutate({
      name: form.name.trim(),
      countryCode: form.countryCode,
      mobile: mobile || undefined,
      email: email || undefined,
      password: form.password,
    });
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog size="lg" className="grid gap-4 p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-2xl font-semibold">新建用户</Dialog.Title>
            <Dialog.Description className="text-kumo-subtle">
              手机号与邮箱至少填写一项；创建后账号默认启用。
            </Dialog.Description>
          </div>
          <Button
            variant="ghost"
            shape="square"
            icon={<XIcon />}
            aria-label="关闭"
            onClick={onClose}
          />
        </div>
        <form className="grid gap-4" onSubmit={submit}>
          <Input
            label="姓名 / 公司"
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <Select<CountryCode>
              label="国家或地区区号"
              items={countries}
              value={form.country}
              renderValue={(country) =>
                countries.find((option) => option.value === country)?.callingCode ?? form.countryCode
              }
              onValueChange={(country) => {
                const option = countries.find((item) => item.value === country);
                if (!option) return;
                setForm((current) => ({
                  ...current,
                  country: option.value,
                  countryCode: option.callingCode,
                }));
                setValidationError("");
              }}
            />
            <Input
              label="手机号（可选）"
              placeholder="请输入手机号"
              inputMode="tel"
              autoComplete="tel-national"
              value={form.mobile}
              onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
            />
          </div>
          <Input
            label="邮箱（可选）"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <Input
            label="密码"
            required
            type="password"
            autoComplete="new-password"
            description="请输入 6-20 位密码"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          {validationError ? <Banner variant="alert" title={validationError} /> : null}
          {mutation.error ? (
            <Banner variant="error" title="创建失败" description={getApiMessage(mutation.error)} />
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
            <Button type="submit" loading={mutation.isPending}>创建用户</Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}

export function AdminCustomers() {
  const adminId = useAdminAuthStore((state) => state.user?.id ?? "unknown");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const storageKey = `ddyidc:admin:${adminId}:customer-columns`;
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(() => loadColumns(storageKey));
  const pageSize = 10;

  useEffect(() => {
    setVisibleColumns(loadColumns(storageKey));
  }, [storageKey]);
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
  }, [storageKey, visibleColumns]);

  const query = useQuery({
    queryKey: ["admin", "customers", page, status, keyword],
    queryFn: () =>
      adminOverviewApi.customers({
        page,
        pageSize,
        status: status === "all" ? undefined : status,
        keyword: keyword || undefined,
      }),
  });
  const visible = useMemo(() => new Set(visibleColumns), [visibleColumns]);
  const renderedColumns = columns.filter((column) => visible.has(column.key));

  const toggleColumn = (key: ColumnKey, checked: boolean) => {
    if (key === "id") return;
    setVisibleColumns((current) =>
      checked
        ? columns.filter((column) => column.key === "id" || current.includes(column.key) || column.key === key).map((column) => column.key)
        : current.filter((column) => column !== key),
    );
  };

  return (
    <>
      <PageHeader
        title="客户管理"
        description="查看真实客户资料、产品与资金汇总，并手动创建账号。"
        actions={
          <>
            <ColumnSettings visible={visible} onToggle={toggleColumn} />
            <Button icon={<PlusIcon />} onClick={() => setCreateOpen(true)}>新建用户</Button>
          </>
        }
      />
      {createdName ? (
        <Banner variant="default" title="用户创建成功" description={`${createdName} 已加入客户列表。`} />
      ) : null}
      <LayerCard className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_12rem_auto]">
        <Input
          aria-label="客户关键词"
          placeholder="用户 ID、账号、姓名、邮箱或手机号…"
          value={draftKeyword}
          onChange={(event) => setDraftKeyword(event.target.value)}
        />
        <Select
          aria-label="客户状态"
          value={status}
          onValueChange={(value) => {
            setStatus(value ?? "all");
            setPage(1);
          }}
          items={{ all: "全部状态", "1": "启用", "2": "停用" }}
        />
        <Button
          variant="secondary"
          onClick={() => {
            setKeyword(draftKeyword.trim());
            setPage(1);
          }}
        >
          筛选
        </Button>
      </LayerCard>
      <PageState
        loading={query.isLoading}
        error={query.error ? getApiMessage(query.error) : null}
        empty={!query.isLoading && !query.error && (query.data?.items?.length ?? 0) === 0}
        emptyTitle="暂无客户"
      >
        <div className="grid gap-3">
          <LayerCard className="overflow-x-auto p-0">
            <Table>
              <Table.Header variant="compact">
                <Table.Row>
                  {renderedColumns.map((column) => (
                    <Table.Head key={column.key}>{column.label}</Table.Head>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body data-animate-list>
                {query.data?.items?.map((customer) => (
                  <Table.Row key={customer.id} className="hover:bg-kumo-tint">
                    {renderedColumns.map((column) => (
                      <Table.Cell key={`${customer.id}-${column.key}`}>
                        {renderCell(column.key, customer)}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </LayerCard>
          <LayerCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-base text-kumo-subtle">
              总用户数 <strong className="text-kumo-strong font-medium">{query.data?.totalUsers ?? 0}</strong>
            </span>
            <div className="flex flex-wrap items-center gap-6 text-base">
              <span className="text-kumo-subtle">
                本页用户余额合计 <strong className="text-kumo-strong font-medium">{formatMoney(query.data?.pageBalanceSum ?? 0)}</strong>
              </span>
              <span className="text-kumo-subtle">
                用户余额总计 <strong className="text-kumo-strong font-medium">{formatMoney(query.data?.totalBalanceSum ?? 0)}</strong>
              </span>
            </div>
          </LayerCard>
          <Pagination
            page={page}
            setPage={setPage}
            perPage={pageSize}
            totalCount={query.data?.total ?? 0}
          />
        </div>
      </PageState>
      <DialogPresence>{createOpen ? (
        <CreateCustomerDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(customer) => {
            setCreateOpen(false);
            setCreatedName(customer.displayName || customer.username);
            setPage(1);
            void queryClient.invalidateQueries({ queryKey: ["admin", "customers"] });
          }}
        />
      ) : null}</DialogPresence>
    </>
  );
}
