import { useEffect, useState } from "react";
import { Banner, Field, Input, LayerDialog, Select, Text } from "@cloudflare/kumo";
import { domainsApi, type DomainTemplate } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";

const idTypes = { "1": "身份证", "5": "护照", "6": "港澳居民来往内地通行证", "11": "台湾居民来往大陆通行证", "12": "外国人永久居留身份证", "30": "港澳居民居住证", "31": "台湾居民居住证", "0": "其它" };

export function DomainVerificationDialog({ open, onOpenChange, template, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; template?: DomainTemplate; onDone: () => void }) {
  const [idType, setIdType] = useState("1");
  const [idNumber, setIdNumber] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open || !template) return;
    setError(null); setStatus({});
    void domainsApi.execute({ action: "4.5", params: { c_sysid: template.id }, requestId: crypto.randomUUID(), confirmed: true })
      .then((result) => setStatus((result.data ?? {}) as Record<string, string>))
      .catch((cause) => setError(getApiMessage(cause)));
  }, [open, template]);
  const pickFile = (file: File | undefined) => {
    if (!file) { setFileName(""); setFileData(""); return; }
    if (file.size > 4 * 1024 * 1024) { setError("请上传4MB以内的证件图片"); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => { const raw = String(reader.result ?? ""); setFileData(raw.includes(",") ? raw.slice(raw.indexOf(",") + 1) : raw); };
    reader.readAsDataURL(file);
  };
  const submit = async () => {
    if (!template) return;
    setError(null);
    if (!idNumber.trim()) { setError("请填写证件号码"); return; }
    if (!fileData) { setError("请上传证件图片"); return; }
    setBusy(true);
    try {
      await domainsApi.execute({ action: "4.10", params: { c_sysid: template.id, f_type_org: idType, f_code_org: idNumber.trim(), file_org: fileData }, requestId: crypto.randomUUID(), confirmed: true });
      onDone(); onOpenChange(false);
    } catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  return <LayerDialog.Root open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }}>
    <LayerDialog.Content size="lg" closeLabel="关闭">
      <LayerDialog.Title>实名认证</LayerDialog.Title>
      <LayerDialog.Description>{template ? `${template.label} · ${template.id}` : "为信息模板提交实名材料"}</LayerDialog.Description>
      <LayerDialog.Body>
        <div className="grid gap-4">
          <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3"><Text as="span" variant="secondary" size="sm">审核状态</Text><Text as="span" size="sm">{status.c_status || template?.status || "—"}</Text></div>
          {status.c_reason ? <Banner variant="secondary" title={`审核意见：${status.c_reason}`} /> : null}
          <Field label="实名证件类型" required hideLabel><Select label="实名证件类型" value={idType} items={idTypes} onValueChange={(value) => value && setIdType(value)} /></Field>
          <Field label="证件号码" required><Input value={idNumber} onChange={(event) => setIdNumber(event.target.value)} /></Field>
          <div className="grid gap-2"><Text as="span" variant="secondary" size="sm">证件图片</Text><input type="file" accept="image/jpeg,image/png" onChange={(event) => pickFile(event.target.files?.[0])} /><Text variant="secondary" size="sm">{fileName || "支持 JPG / PNG，建议清晰完整的证件照片"}</Text></div>
          {error ? <Banner variant="error" title={error} /> : null}
        </div>
      </LayerDialog.Body>
      <LayerDialog.Actions dismissLabel="取消"><LayerDialog.Action loading={busy} onClick={() => void submit()}>提交实名材料</LayerDialog.Action></LayerDialog.Actions>
    </LayerDialog.Content>
  </LayerDialog.Root>;
}
