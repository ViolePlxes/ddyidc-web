import { useMemo, useState } from "react";
import { pinyin } from "pinyin-pro";
import { Badge, Banner, Button, Input, Radio, Select, Tabs, Text } from "@cloudflare/kumo";
import { domainsApi, type DomainTemplate } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";
import postalRaw from "../../../shared/domains/westcn-regions-postal.json";
import { DomainVerificationDialog } from "./DomainVerificationDialog";
import { verificationStatus } from "./verificationStatus";

type District = { name: string; post: string };
type City = { name: string; districts: District[] };
type Province = { province: string; cities: City[] };
const provinces = postalRaw as Province[];
const cap = (value: string) => value ? value[0]!.toUpperCase() + value.slice(1) : "";
const enWords = (value: string) => pinyin(value, { toneType: "none", type: "array" }).map((word) => cap(word)).join(" ");
const enCity = (value: string) => cap(pinyin(value.replace(/市$/, ""), { toneType: "none", type: "array" }).join(""));
const labelClass = "justify-self-end text-sm text-kumo-strong";

export function DomainTemplatePage({ templates, onChanged, domain }: { templates: DomainTemplate[]; onChanged: () => void; domain?: string }) {
  const [mode, setMode] = useState("list");
  const [expanded, setExpanded] = useState<string>();
  const [confirm, setConfirm] = useState<string>();
  const [verify, setVerify] = useState<DomainTemplate>();
  const [editing, setEditing] = useState<DomainTemplate>();
  const [owner, setOwner] = useState("I");
  const [company, setCompany] = useState("");
  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [province, setProvince] = useState("辽宁省");
  const [city, setCity] = useState("沈阳市");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [enLast, setEnLast] = useState("");
  const [enFirst, setEnFirst] = useState("");
  const [enAddress, setEnAddress] = useState("");
  const [enProvinceEdit, setEnProvinceEdit] = useState("");
  const [enCityEdit, setEnCityEdit] = useState("");
  const [idType, setIdType] = useState("SFZ");
  const [idNumber, setIdNumber] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const person = owner === "I";
  const cities = useMemo(() => provinces.find((item) => item.province === province)?.cities ?? [], [province]);
  const districts = useMemo(() => cities.find((item) => item.name === city)?.districts ?? [], [cities, city]);
  const enProvince = useMemo(() => enWords(province), [province]);
  const enCityName = useMemo(() => enCity(city), [city]);
  const reset = () => { setEditing(undefined); setOwner("I"); setCompany(""); setLast(""); setFirst(""); setProvince("辽宁省"); setCity("沈阳市"); setDistrict(""); setAddress(""); setPostcode(""); setPhone(""); setEmail(""); setEnLast(""); setEnFirst(""); setEnAddress(""); setEnProvinceEdit(""); setEnCityEdit(""); setIdType("SFZ"); setIdNumber(""); setNote(""); setError(null); };
  const pickProvince = (value: string | null) => {
    if (!value) return;
    setProvince(value);
    const nextCity = provinces.find((item) => item.province === value)?.cities[0];
    setCity(nextCity?.name ?? "");
    const nextDistrict = nextCity?.districts[0];
    setDistrict(nextDistrict?.name ?? ""); setPostcode(nextDistrict?.post ?? ""); setEnProvinceEdit(""); setEnCityEdit("");
  };
  const pickCity = (value: string | null) => {
    if (!value) return;
    setCity(value);
    const nextDistrict = cities.find((item) => item.name === value)?.districts[0];
    setDistrict(nextDistrict?.name ?? ""); setPostcode(nextDistrict?.post ?? ""); setEnCityEdit("");
  };
  const pickDistrict = (value: string | null) => {
    if (!value) return;
    setDistrict(value);
    setPostcode(districts.find((item) => item.name === value)?.post ?? "");
  };
  const startEdit = async (template: DomainTemplate) => {
    setEditing(template); setMode("form"); setError(null);
    try {
      const result = await domainsApi.execute({ action: "4.5", params: { c_sysid: template.id }, requestId: crypto.randomUUID(), confirmed: true });
      const data = (result.data ?? {}) as Record<string, string>;
      setOwner(data.c_regtype === "E" ? "E" : "I"); setCompany(data.c_org_m ?? "");
      setLast(data.c_ln_m ?? ""); setFirst(data.c_fn_m ?? "");
      setProvince(data.c_st_m || "辽宁省"); setCity(data.c_ct_m || "沈阳市"); setDistrict(data.c_dt_m ?? ""); setPostcode(data.c_pc ?? "");
      setAddress(data.c_adr_m ?? ""); setPhone(data.c_ph ?? ""); setEmail(data.c_em ?? "");
      setEnLast(data.c_ln ?? ""); setEnFirst(data.c_fn ?? ""); setEnAddress(data.c_adr ?? "");
      setIdType(data.c_idtype_gswl || (data.c_regtype === "E" ? "ORG" : "SFZ")); setIdNumber(data.c_idnum_gswl ?? ""); setNote(data.c_keyword ?? "");
    } catch (cause) { setError(getApiMessage(cause)); }
  };
  const submit = async () => {
    setError(null);
    if (!last || !first || !province || !city || !address || !postcode || !email || !idNumber) { setError("请填写所有必填字段"); return; }
    if (!phone) { setError("请填写联系电话"); return; }
    const params: Record<string, string> = {
      c_regtype: owner, c_co: "CN", cocode: "+86", c_ph_type: "0",
      c_ln_m: last, c_fn_m: first, c_st_m: province, c_ct_m: city, c_adr_m: address, c_pc: postcode, c_em: email,
      c_ln: enLast || enWords(last), c_fn: enFirst || enWords(first), c_st: enProvinceEdit || enProvince, c_ct: enCityEdit || enCityName, c_adr: enAddress || enWords(address),
      c_idtype_gswl: idType, c_idnum_gswl: idNumber, c_keyword: note, c_ph: phone,
    };
    if (district) params.c_dt_m = district;
    if (!person) params.c_org_m = company;
    if (editing) params.c_sysid = editing.id;
    setBusy(true);
    try { await domainsApi.execute({ action: editing ? "4.2" : "4.1", params, requestId: crypto.randomUUID(), confirmed: true }); onChanged(); setMode("list"); reset(); }
    catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    setBusy(true);
    try { await domainsApi.execute({ action: "4.3", params: { c_sysid: id }, requestId: crypto.randomUUID(), confirmed: true }); setConfirm(undefined); onChanged(); }
    catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  return <div className="mx-auto grid w-full max-w-4xl gap-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div className="grid gap-1"><Text as="h1" variant="heading" size="lg">信息模板</Text><Text variant="secondary" size="sm">{domain ? `${domain} · 创建后可返回订购使用` : "创建、修改、删除模板，并查看审核状态与详情。"}</Text></div><Button onClick={() => { reset(); setMode("form"); }}>新建模板</Button></div>
    <Tabs variant="underline" value={mode} onValueChange={(value) => { setMode(value); setConfirm(undefined); }} tabs={[{ value: "list", label: "选择资料" }, { value: "form", label: "新填资料" }]} />
    {error ? <Banner variant="error" title={error} /> : null}
    {mode === "list" ? <div className="grid gap-2">
      {templates.map((item) => <div key={item.id} className="grid gap-2 border-b border-kumo-line py-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className="grid flex-1 gap-1 text-left" onClick={() => setExpanded(expanded === item.id ? undefined : item.id)}><span className="text-sm font-medium text-kumo-strong">{item.label}</span><span className="text-xs text-kumo-subtle">{item.id} · {item.status}</span></button><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setExpanded(expanded === item.id ? undefined : item.id)}>{expanded === item.id ? "收起详情" : "查看详情"}</Button><Button variant="secondary" size="sm" onClick={() => void startEdit(item)}>修改</Button><Badge variant={verificationStatus(item.status).tone}>{verificationStatus(item.status).text}</Badge><Button variant="secondary" size="sm" onClick={() => setVerify(item)}>实名认证</Button><Button variant="destructive" size="sm" onClick={() => setConfirm(item.id)}>删除</Button></div></div>
        {expanded === item.id ? <div className="grid gap-2 rounded-lg bg-kumo-overlay px-4 py-3 text-sm sm:grid-cols-2">{[["模板编号", item.id], ["模板名称", item.label], ["审核状态", item.status]].map(([label, value]) => <div key={label} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2"><span className="text-kumo-subtle">{label}</span><span className="text-kumo-strong">{value}</span></div>)}</div> : null}
        {confirm === item.id ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-kumo-error/40 px-4 py-2"><Text variant="secondary" size="sm">删除后不可恢复，确定删除「{item.label}」？</Text><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setConfirm(undefined)}>取消</Button><Button variant="destructive" size="sm" loading={busy} onClick={() => void remove(item.id)}>确认删除</Button></div></div> : null}
      </div>)}
      {!templates.length ? <Text variant="secondary" size="sm">暂无信息模板，点击「新建模板」创建。</Text> : null}
    </div> : <div className="grid gap-3">
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">所有者类型</Text></span><Radio.Group orientation="horizontal" value={owner} onValueChange={(value) => { setOwner(value); setIdType(value === "I" ? "SFZ" : "ORG"); }}><Radio.Item value="I" label="个人" /><Radio.Item value="E" label="企业/组织" /></Radio.Group></div>
      {!person ? <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">单位名称</Text></span><Input className="w-96 max-w-full" value={company} onChange={(event) => setCompany(event.target.value)} /></div> : null}
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">{person ? "所有者姓名" : "联系人姓名"}</Text></span><div className="flex items-center gap-2"><Text as="span" variant="secondary" size="sm">姓</Text><Input className="w-36" value={last} onChange={(event) => { setLast(event.target.value); setEnLast(enWords(event.target.value)); }} /><Text as="span" variant="secondary" size="sm">名</Text><Input className="w-36" value={first} onChange={(event) => { setFirst(event.target.value); setEnFirst(enWords(event.target.value)); }} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">所属区域</Text></span><div className="flex flex-wrap gap-2"><Select className="w-28" aria-label="国家/地区" value="CN" items={{ CN: "中国" }} onValueChange={() => {}} /><Select className="w-28" aria-label="省份" value={province} items={Object.fromEntries(provinces.map((item) => [item.province, item.province]))} onValueChange={pickProvince} /><Select className="w-28" aria-label="城市" value={city} items={Object.fromEntries(cities.map((item) => [item.name, item.name]))} onValueChange={pickCity} /><Select className="w-28" aria-label="区县" value={district} items={Object.fromEntries(districts.map((item) => [item.name, item.name]))} onValueChange={pickDistrict} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">详细地址</Text></span><Input className="w-96 max-w-full" value={address} onChange={(event) => { setAddress(event.target.value); setEnAddress(enWords(event.target.value)); }} /></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">邮编</Text></span><Input className="w-96 max-w-full" value={postcode} onChange={(event) => setPostcode(event.target.value)} /></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">联系电话</Text></span><div className="flex items-center gap-2"><Select className="w-24" aria-label="电话类型" value="0" items={{ "0": "手机" }} onValueChange={() => {}} /><Input className="w-20" value="+86" readOnly /><Input className="w-48" value={phone} onChange={(event) => setPhone(event.target.value)} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">电子邮箱</Text></span><Input type="email" className="w-96 max-w-full" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <div className="border-t border-kumo-line pt-3" />
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">所有者姓名（英文）</Text></span><div className="flex items-center gap-2"><Text as="span" variant="secondary" size="sm">姓</Text><Input className="w-36" value={enLast} onChange={(event) => setEnLast(event.target.value)} /><Text as="span" variant="secondary" size="sm">名</Text><Input className="w-36" value={enFirst} onChange={(event) => setEnFirst(event.target.value)} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">省份（英文）</Text></span><Input className="w-96 max-w-full" value={enProvinceEdit || enProvince} onChange={(event) => setEnProvinceEdit(event.target.value)} /></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">城市（英文）</Text></span><Input className="w-96 max-w-full" value={enCityEdit || enCityName} onChange={(event) => setEnCityEdit(event.target.value)} /></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">详细地址（英文）</Text></span><Input className="w-96 max-w-full" value={enAddress} onChange={(event) => setEnAddress(event.target.value)} /></div>
      <div className="border-t border-kumo-line pt-3" />
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">适用后缀</Text></span><div className="flex items-center gap-2"><Button variant="secondary" size="sm">常规后缀</Button><Button variant="secondary" size="sm" disabled>hk域名</Button><Button variant="secondary" size="sm" disabled>tw域名</Button><Button variant="secondary" size="sm" disabled>境外</Button></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">默认模板</Text></span><div className="flex items-center gap-3"><Button variant="secondary" size="sm">默认</Button><Text variant="secondary" size="sm">设置该模板为默认模板后，将取消其它同类型模板的默认设置。</Text></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">实名证件</Text></span><div className="flex items-center gap-2"><Select className="w-28" aria-label="证件类型" value={idType} items={person ? { SFZ: "身份证", HZ: "护照" } : { ORG: "营业执照", YYZZ: "组织机构代码证" }} onValueChange={(value) => value && setIdType(value)} /><Input className="w-56" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">模板备注</Text></span><Input className="w-96 max-w-full" value={note} onChange={(event) => setNote(event.target.value)} /></div>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => { setMode("list"); reset(); }}>取消</Button><Button loading={busy} onClick={() => void submit()}>{editing ? "保存修改" : "提交模板"}</Button></div>
    </div>}
  <DomainVerificationDialog open={Boolean(verify)} onOpenChange={(value) => { if (!value) setVerify(undefined); }} template={verify} onDone={onChanged} />
  </div>;
}
