import { Badge } from "../../../shared/components/Badge";
import { Dialog } from "../../../shared/components/Dialog";
import { Banner, Button, Input, LayerCard, Pagination, Select, Switch, Table, Tabs, Textarea } from "@cloudflare/kumo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  certificationAdminApi as api,
  certificationStatuses as statuses,
  documentTypes,
  type CertificationAdminSettings,
} from "../../../shared/api/certification";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";

const auditLabels: Record<string, string> = {
  alipay_initialize: "发起支付宝认证",
  alipay_initialize_failed: "支付宝认证发起失败",
  alipay_query: "查询支付宝结果",
  alipay_query_failed: "支付宝结果查询失败",
  alipay_auto_pass: "支付宝自动通过",
  fee_order: "创建认证手续费订单",
  fee_paid: "认证手续费到账",
  submit: "提交认证",
  submit_failed: "提交失败",
  pass: "审核通过",
  pass_failed: "通过失败",
  reject: "审核拒绝",
  reject_failed: "拒绝失败",
  unlock: "解除限制",
  unlock_failed: "解除失败",
  view_detail: "查看资料",
  view_original: "查看原始资料",
  view_file: "查看证件",
  settings: "修改设置",
};
function Settings() {
  const query = useQuery({
    queryKey: ["certification-settings"],
    queryFn: api.settings,
  });
  const [form, setForm] = useState<CertificationAdminSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const value = form ?? query.data;
  return (
    <LayerCard className="grid gap-4 p-5">
      {query.error && (
        <Banner variant="error" title={getApiMessage(query.error)} />
      )}
      {error && <Banner variant="error" title={error} />}
      {message && <p role="status">{message}</p>}
      {value && (
        <>
          {(
            [
              { key: "enabled", label: "开启实名认证" },
              { key: "requirePurchase", label: "未认证禁止购买" },
              { key: "companyEnabled", label: "开启企业认证" },
              { key: "companyRequiresPerson", label: "企业认证要求先个人认证" },
            ] as const
          ).map((item) => (
            <Switch
              key={item.key}
              label={item.label}
              checked={value[item.key]}
              onCheckedChange={(checked) =>
                setForm({ ...value, [item.key]: checked })
              }
            />
          ))}
          <Select
            label="认证通道"
            value={value.channel}
            onValueChange={(channel) =>
              setForm({ ...value, channel: channel as "manual" | "alipay" })
            }
            items={[
              { value: "manual", label: "人工审核" },
              { value: "alipay", label: "支付宝芝麻信用（自动认证）" },
            ]}
          />
          {value.channel === "alipay" && (
            <>
              <Input
                label="支付宝 AppID"
                value={value.appId}
                onChange={(e) => setForm({ ...value, appId: e.target.value })}
                autoComplete="off"
              />
              <Textarea
                label="支付宝公钥（留空保留）"
                value={value.publicKey}
                onChange={(e) =>
                  setForm({ ...value, publicKey: e.target.value })
                }
                autoComplete="off"
              />
              <p>{value.publicKeyMasked || "尚未配置公钥"}</p>
              <Textarea
                label="应用私钥（仅写入，留空保留）"
                value={value.privateKey ?? ""}
                onChange={(e) =>
                  setForm({ ...value, privateKey: e.target.value })
                }
                autoComplete="off"
              />
              <p>
                {value.privateKeyConfigured
                  ? "私钥已加密保存，不会回显。"
                  : "尚未配置私钥"}
              </p>
              <Select
                label="认证方式"
                value={value.bizCode}
                onValueChange={(bizCode) =>
                  setForm({ ...value, bizCode: String(bizCode) })
                }
                items={[
                  { value: "FACE", label: "人脸识别" },
                  { value: "SMART_FACE", label: "快捷认证" },
                  { value: "CERT_PHOTO", label: "身份证识别" },
                  { value: "CERT_PHOTO_FACE", label: "人脸 + 身份证" },
                ]}
              />
              <Input
                label="免费认证次数"
                type="number"
                min={1}
                max={100}
                value={value.freeAttempts}
                onChange={(e) =>
                  setForm({ ...value, freeAttempts: Number(e.target.value) })
                }
              />
              <Input
                label="认证手续费（元）"
                value={value.fee}
                onChange={(e) => setForm({ ...value, fee: e.target.value })}
              />
              <p>
                企业认证仍由人工审核。支付宝初始化失败不累计免费次数，但仍受防刷频控限制。
              </p>
            </>
          )}
          <p>
            人工通道保留原一次机会规则；支付宝通道按配置的免费次数执行。开启“企业认证要求先个人认证”时，企业申请入口将不可用。
          </p>
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              setMessage("");
              try {
                await api.saveSettings(value);
                setForm(null);
                await query.refetch();
                setMessage("设置已保存");
              } catch (e) {
                setError(getApiMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "保存中…" : "保存设置"}
          </Button>
        </>
      )}
    </LayerCard>
  );
}
function Detail({
  id,
  close,
  changed,
}: {
  id: string;
  close: () => void;
  changed: () => void;
}) {
  const [reveal, setReveal] = useState(false);
  const query = useQuery({
    queryKey: ["certification-detail", id, reveal],
    queryFn: () => api.detail(id, reveal),
    gcTime: 0,
    retry: false,
  });
  const [action, setAction] = useState<"pass" | "reject" | "unlock" | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState("");
  const record = query.data?.record;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) close();
      }}
    >
      <Dialog size="xl" className="grid max-h-[85vh] gap-4 overflow-y-auto p-6">
        <Dialog.Title>实名认证详情</Dialog.Title>
        <Dialog.Description>
          资料默认脱敏。原始资料仅用于人工审核，查看和审核操作均会记录审计。
        </Dialog.Description>
        {(error || query.error) && (
          <Banner variant="error" title={error || getApiMessage(query.error)} />
        )}
        {record && (
          <>
            <Badge>
              {record.certifyChannel === "alipay" && record.status === 1
                ? "待认证"
                : statuses[record.status]}
            </Badge>
            <Button variant="secondary" disabled={query.isFetching} onClick={() => { setImage(""); setReveal(!reveal); }}>{reveal ? "隐藏原始资料" : "查看原始资料"}</Button>
            <dl className="grid gap-2">
              {[
                ["客户ID", record.customerId],
                ["申请人", record.name],
                ["手机号", record.phone],
                ["证件类型", documentTypes[record.documentType - 1]],
                ["证件号码", record.documentNumber],
                ["公司名称", record.companyName],
                ["统一社会信用代码", record.companyCode],
                [
                  "法人类型",
                  record.type === 2
                    ? record.legalType === 1
                      ? "法人"
                      : "法人代表"
                    : "",
                ],
                ["提交时间", new Date(record.createdAt).toLocaleString()],
                ["审核人", record.auditorId],
                [
                  "审核时间",
                  record.auditedAt
                    ? new Date(record.auditedAt).toLocaleString()
                    : "",
                ],
                ["拒绝原因", record.rejectReason],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-wrap gap-2">
                  <dt>{label}：</dt>
                  <dd>{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3">
              {(["front", "back", "license", "authorization"] as const)
                .filter((key) => record[key])
                .map((key) => (
                  <Button
                    key={key}
                    variant="secondary"
                    onClick={() => setImage(record[key])}
                  >
                    {
                      {
                        front: "证件正面",
                        back: "证件反面",
                        license: "营业执照",
                        authorization: "授权委托书",
                      }[key]
                    }
                  </Button>
                ))}
            </div>
            <div className="flex gap-2">
              {record.status === 1 && record.certifyChannel !== "alipay" && (
                <>
                  <Button onClick={() => setAction("pass")}>通过</Button>
                  <Button
                    variant="secondary"
                    onClick={() => setAction("reject")}
                  >
                    拒绝
                  </Button>
                </>
              )}
              {record.status === 3 && record.certifyChannel !== "alipay" && (
                <Button variant="secondary" onClick={() => setAction("unlock")}>
                  解除限制
                </Button>
              )}
            </div>
            {action && (
              <form
                className="grid gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    await api.review(id, action, reason);
                    changed();
                    if (action === "unlock") close();
                    else {
                      setAction(null);
                      setReason("");
                      await query.refetch();
                    }
                  } catch (e) {
                    setError(getApiMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <h3>
                  确认
                  {action === "pass"
                    ? "通过"
                    : action === "reject"
                      ? "拒绝"
                      : "解除限制"}
                </h3>
                {action === "unlock" && (
                  <p>
                    将删除当前拒绝记录，允许客户重新申请；原审核审计仍保留。
                  </p>
                )}
                <Textarea
                  label="操作说明"
                  required={action !== "pass"}
                  maxLength={255}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy}>
                    {busy ? "处理中…" : "确认操作"}
                  </Button>
                  <Button
                    disabled={busy}
                    variant="secondary"
                    onClick={() => setAction(null)}
                  >
                    取消
                  </Button>
                </div>
              </form>
            )}
            <h3>操作审计</h3>
            {query.data?.audits.map((log) => (
              <div key={log.id} className="grid gap-1">
                <p>
                  {new Date(log.createdAt).toLocaleString()} ·{" "}
                  {auditLabels[log.action.replace("certification.", "")] ??
                    "认证操作"}{" "}
                  · 操作人 {log.operatorId}
                </p>
                <p>
                  {typeof log.detail === "object" &&
                  log.detail !== null &&
                  "reason" in log.detail
                    ? String(log.detail.reason)
                    : "已记录"}
                </p>
              </div>
            ))}
          </>
        )}
        <Button variant="secondary" disabled={busy} onClick={close}>
          关闭
        </Button>
        <Dialog.Root
          open={Boolean(image)}
          onOpenChange={(open) => {
            if (!open) setImage("");
          }}
        >
          <Dialog size="xl" className="grid gap-3 p-6">
            <Dialog.Title>证件照</Dialog.Title>
            {image && (
              <img
                className="max-h-[70vh] max-w-full object-contain"
                src={`/admin/v1/certifications/files/${image}`}
                alt="审核证件照"
              />
            )}
            <Button onClick={() => setImage("")}>关闭图片</Button>
          </Dialog>
        </Dialog.Root>
      </Dialog>
    </Dialog.Root>
  );
}
export function Certifications() {
  const [params] = useSearchParams();
  const cache = useQueryClient();
  const [tab, setTab] = useState("review");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<number[]>([]);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [detail, setDetail] = useState(params.get("record") ?? "");
  const query = useQuery({
    queryKey: [
      "certification-list",
      page,
      filter,
      search,
      params.get("customerId"),
      sort,
    ],
    queryFn: () =>
      api.list({
        page,
        pageSize: 20,
        statuses: filter,
        keyword: search,
        customerId: params.get("customerId") ?? "",
        sort,
      }),
    gcTime: 0,
  });
  const changed = () => {
    void query.refetch();
    void cache.invalidateQueries({ queryKey: ["admin", "customers"] });
  };
  return (
    <>
      <PageHeader
        title="实名审核"
        description="查看客户认证结果，审核人工申请并管理认证通道。"
      />
      <Tabs
        value={tab}
        onValueChange={setTab}
        tabs={[
          { value: "review", label: "实名审核" },
          { value: "settings", label: "实名设置" },
        ]}
      />
      {tab === "settings" ? (
        <Settings />
      ) : (
        <>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(keyword);
              setPage(1);
            }}
          >
            <Input
              label="客户 / 姓名 / 证件号"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              autoComplete="off"
            />
            <Button type="submit">搜索</Button>
            <Select
              label="排序"
              value={sort}
              onValueChange={(v) => {
                setSort(v ?? "newest");
                setPage(1);
              }}
              items={[
                { value: "newest", label: "最新提交" },
                { value: "oldest", label: "最早提交" },
              ]}
            />
          </form>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3].map((status) => (
              <Switch
                key={status}
                label={statuses[status]}
                checked={filter.includes(status)}
                onCheckedChange={(checked) => {
                  setFilter((old) =>
                    checked
                      ? [...old, status]
                      : old.filter((x) => x !== status),
                  );
                  setPage(1);
                }}
              />
            ))}
          </div>
          {query.error && (
            <Banner variant="error" title={getApiMessage(query.error)} />
          )}
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  {[
                    "客户",
                    "认证类型",
                    "姓名 / 公司",
                    "证件号码",
                    "状态",
                    "提交时间",
                    "操作",
                  ].map((label) => (
                    <Table.Head key={label}>{label}</Table.Head>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {query.data?.items.map(({ record, username }) => (
                  <Table.Row key={record.id}>
                    <Table.Cell>
                      <Link to={`/admin/customers/${record.customerId}`}>
                        #{record.customerId} {username}
                      </Link>
                    </Table.Cell>
                    <Table.Cell>
                      {record.type === 1 ? "个人" : "企业"}
                    </Table.Cell>
                    <Table.Cell>
                      {record.type === 1 ? record.name : record.companyName}
                    </Table.Cell>
                    <Table.Cell>{record.documentNumber}</Table.Cell>
                    <Table.Cell>
                      <Badge>
                        {record.certifyChannel === "alipay" &&
                        record.status === 1
                          ? "待认证"
                          : statuses[record.status]}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(record.createdAt).toLocaleString()}
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        variant="secondary"
                        onClick={() => setDetail(record.id)}
                      >
                        {record.status === 1 ? "审核 / 详情" : "详情"}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          {!query.isLoading && query.data?.total === 0 && (
            <p>没有符合条件的认证记录。</p>
          )}
          <Pagination
            page={page}
            setPage={setPage}
            perPage={20}
            totalCount={query.data?.total ?? 0}
          />
        </>
      )}
      {detail && (
        <Detail id={detail} close={() => setDetail("")} changed={changed} />
      )}
    </>
  );
}
