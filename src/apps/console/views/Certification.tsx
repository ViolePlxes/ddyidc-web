import { Badge } from "../../../shared/components/Badge";
import { Dialog } from "../../../shared/components/Dialog";
import { AlipayCertification } from "../../../shared/components/AlipayCertification";
import { Banner, Button, Input, LayerCard, Select } from "@cloudflare/kumo";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import {
  certificationApi,
  certificationStatuses,
  documentTypes,
  type CertificationInput,
} from "../../../shared/api/certification";
import { getApiMessage } from "../../../shared/api/request";
import { PageHeader } from "../../../shared/components/PageHeader";
import { PhoneCountrySelect } from "../../../shared/components/PhoneCountrySelect";

const empty: CertificationInput = {
  name: "",
  phone: "",
  documentType: 1,
  documentNumber: "",
  front: "",
  back: "",
  companyName: "",
  companyCode: "",
  license: "",
  legalType: 1,
  authorization: "",
};
export function Certification() {
  const query = useQuery({
    queryKey: ["certification"],
    queryFn: certificationApi.info,
    gcTime: 0,
    refetchInterval: 30_000,
  });
  const [type, setType] = useState<"person" | "company" | null>(null);
  const [form, setForm] = useState(empty);
  const [country, setCountry] = useState<CountryCode>("CN");
  const [prefix, setPrefix] = useState("+86");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const update = (key: keyof CertificationInput, value: string | number) =>
    setForm((old) => ({ ...old, [key]: value }));
  const data = query.data;
  async function upload(
    key: "front" | "back" | "license" | "authorization",
    file?: File,
  ) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("图片不能超过5MB");
      const result = await certificationApi.upload(file);
      update(key, result.id);
    } catch (e) {
      setError(getApiMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!type) return;
    setBusy(true);
    setError("");
    try {
      await certificationApi.submit(type, {
        ...form,
        phone: prefix + form.phone,
      });
      setForm(empty);
      setConfirm(false);
      setType(null);
      await query.refetch();
    } catch (e) {
      setError(getApiMessage(e));
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  const imageField = (
    key: "front" | "back" | "license" | "authorization",
    label: string,
  ) => (
    <div className="grid gap-2" key={key}>
      <Input
        type="file"
        label={label}
        accept=".jpg,.jpeg,.png"
        disabled={busy}
        onChange={(e) => void upload(key, e.target.files?.[0])}
      />
      {form[key] && (
        <img
          className="max-h-48 max-w-full object-contain"
          src={`/api/v1/certification/files/${form[key]}`}
          alt={`${label}预览`}
        />
      )}
    </div>
  );
  return (
    <>
      <PageHeader
        title="实名认证"
        description="请提交本人真实资料。已通过的实名认证终身有效。"
      />
      {(error || query.error) && (
        <Banner variant="error" title={error || getApiMessage(query.error)} />
      )}
      {!data ? (
        <p>正在读取认证状态…</p>
      ) : (
        <>
          <LayerCard className="grid gap-3 p-5">
            <div>
              <Badge>
                {data.record?.certifyChannel === "alipay" && data.status === 1
                  ? "待认证"
                  : certificationStatuses[data.status]}
              </Badge>
            </div>
            {data.record && (
              <>
                <p>申请人：{data.record.name}</p>
                <p>手机号：{data.record.phone}</p>
                <p>证件号码：{data.record.documentNumber}</p>
                {data.record.type === 2 && (
                  <>
                    <p>企业：{data.record.companyName}</p>
                    <p>统一社会信用代码：{data.record.companyCode}</p>
                  </>
                )}
                {data.status === 3 && (
                  <Banner
                    variant="alert"
                    title="审核未通过"
                    description={`${data.record.rejectReason}。本次免费机会已使用，如需重新申请请联系管理员。`}
                  />
                )}
                <p>
                  提交时间：{new Date(data.record.createdAt).toLocaleString()}
                </p>
              </>
            )}
            {!data.settings.enabled && <p>实名认证暂未开放。</p>}
          </LayerCard>
          {data.status !== 2 &&
            (data.record?.certifyChannel === "alipay" ||
              (data.status === 0 && data.settings.channel === "alipay")) && (
              <AlipayCertification info={data} changed={query.refetch} />
            )}
          {data.status === 0 && data.settings.enabled && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {data.settings.channel !== "alipay" && (
                  <LayerCard className="grid gap-3 p-5">
                    <h2>个人认证</h2>
                    <p>提交本人证件资料，由管理员审核。</p>
                    <Button
                      disabled={busy}
                      onClick={() => {
                        setType("person");
                        setForm(empty);
                      }}
                    >
                      选择个人认证
                    </Button>
                  </LayerCard>
                )}
                {data.settings.companyEnabled && (
                  <LayerCard className="grid gap-3 p-5">
                    <h2>企业认证</h2>
                    <p>
                      {data.settings.companyRequiresPerson
                        ? "当前要求先个人认证；一次认证机会规则下，企业申请暂不可用。"
                        : "企业认证由人工审核，请提交企业与申请人证件资料。"}
                    </p>
                    <Button
                      disabled={busy || data.settings.companyRequiresPerson}
                      onClick={() => {
                        setType("company");
                        setForm(empty);
                      }}
                    >
                      选择企业认证
                    </Button>
                  </LayerCard>
                )}
              </div>
              {type && (
                <LayerCard className="p-5">
                  <form
                    className="grid gap-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setConfirm(true);
                    }}
                    autoComplete="off"
                  >
                    <h2>{type === "person" ? "个人认证" : "企业认证"}</h2>
                    <Input
                      required
                      label="申请人姓名"
                      value={form.name}
                      maxLength={64}
                      onChange={(e) => update("name", e.target.value)}
                    />
                    <div className="flex flex-wrap items-end gap-2">
                      <PhoneCountrySelect
                        value={country}
                        onChange={(value, code) => {
                          setCountry(value);
                          setPrefix(code);
                        }}
                      />
                      <Input
                        required
                        label="手机号"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </div>
                    <Select
                      label="证件类型"
                      value={String(form.documentType)}
                      onValueChange={(v) => update("documentType", Number(v))}
                      items={documentTypes.map((label, index) => ({
                        value: String(index + 1),
                        label,
                      }))}
                    />
                    <Input
                      required
                      label="证件号码"
                      value={form.documentNumber}
                      maxLength={32}
                      onChange={(e) =>
                        update("documentNumber", e.target.value.toUpperCase())
                      }
                    />
                    {type === "person" ? (
                      <>
                        {imageField("front", "证件正面")}
                        {imageField("back", "证件反面")}
                      </>
                    ) : (
                      <>
                        <Input
                          required
                          label="公司名称"
                          value={form.companyName}
                          onChange={(e) =>
                            update("companyName", e.target.value)
                          }
                        />
                        <Input
                          required
                          label="统一社会信用代码"
                          value={form.companyCode}
                          maxLength={18}
                          onChange={(e) =>
                            update("companyCode", e.target.value.toUpperCase())
                          }
                        />
                        {imageField("license", "营业执照")}
                        <Select
                          label="法人类型"
                          value={String(form.legalType)}
                          onValueChange={(v) => update("legalType", Number(v))}
                          items={[
                            { value: "1", label: "法人" },
                            { value: "2", label: "法人代表" },
                          ]}
                        />
                        {form.legalType === 2 &&
                          imageField("authorization", "授权委托书")}
                      </>
                    )}
                    <p>
                      图片仅支持 JPG / JPEG /
                      PNG，单张最大5MB。资料通过鉴权访问，仅用于人工审核。
                    </p>
                    <Button type="submit" disabled={busy}>
                      {busy ? "处理中…" : "提交认证"}
                    </Button>
                  </form>
                </LayerCard>
              )}
            </>
          )}
        </>
      )}
      <Dialog.Root
        open={confirm}
        onOpenChange={(open) => {
          if (!busy) setConfirm(open);
        }}
      >
        <Dialog className="grid gap-4 p-6">
          <Dialog.Title>确认提交认证</Dialog.Title>
          <Dialog.Description>
            每人仅一次免费机会。提交后无法修改，被拒绝后需管理员解除限制才能重新申请。
          </Dialog.Description>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? "提交中…" : "确认提交"}
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setConfirm(false)}
          >
            返回核对
          </Button>
        </Dialog>
      </Dialog.Root>
    </>
  );
}
