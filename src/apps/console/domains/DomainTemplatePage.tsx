import { useState } from "react";
import { Banner, Button, Input, Radio, Select, Tabs, Text } from "@cloudflare/kumo";
import { domainsApi, type DomainTemplate } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";

import regionsRaw from "../../../shared/domains/westcn-regions.json";
const regionRows = regionsRaw as { province: string; cities: string[] }[];
const regions: Record<string, string[]> = Object.fromEntries(regionRows.map((item) => [item.province, item.cities]));
const provinceEn: Record<string, string> = { 广东省: "Guang Dong Sheng", 四川省: "Sichuan Sheng", 北京市: "Beijing Shi", 上海市: "Shanghai Shi", 浙江省: "Zhejiang Sheng", 江苏省: "Jiangsu Sheng", 安徽省: "Anhui Sheng", 福建省: "Fujian Sheng", 甘肃省: "Gansu Sheng", 广西壮族自治区: "Guangxi Zhuangzu Zizhiqu", 贵州省: "Guizhou Sheng", 海南省: "Hainan Sheng", 河北省: "Hebei Sheng", 河南省: "Henan Sheng", 黑龙江省: "Heilongjiang Sheng", 湖北省: "Hubei Sheng", 湖南省: "Hunan Sheng", 吉林省: "Jilin Sheng", 江西省: "Jiangxi Sheng", 辽宁省: "Liaoning Sheng", 内蒙古自治区: "Nei Mongol Zizhiqu", 宁夏回族自治区: "Ningxia Huizu Zizhiqu", 青海省: "Qinghai Sheng", 山东省: "Shandong Sheng", 山西省: "Shanxi Sheng", 陕西省: "Shaanxi Sheng", 天津市: "Tianjin Shi", 西藏自治区: "Xizang Zizhiqu", 新疆维吾尔自治区: "Xinjiang Uygur Zizhiqu", 云南省: "Yunnan Sheng", 重庆市: "Chongqing Shi", 台湾省: "Taiwan Sheng", 香港特别行政区: "Hong Kong", 澳门特别行政区: "Macau" };
const cityEn: Record<string, string> = { 广州市: "Guangzhou", 深圳市: "Shenzhen", 东莞市: "Dongguan", 佛山市: "Foshan", 成都市: "Chengdu", 北京市: "Beijing", 上海市: "Shanghai", 杭州市: "Hangzhou", 南京市: "Nanjing" };
const pinyin: Record<string, string> = { 祁: "Qi", 岩: "Yan", 李: "Li", 小: "Xiao", 明: "Ming", 王: "Wang", 张: "Zhang", 刘: "Liu", 陈: "Chen", 杨: "Yang", 赵: "Zhao", 黄: "Huang", 周: "Zhou", 吴: "Wu", 徐: "Xu", 孙: "Sun" };
const enName = (value: string) => Array.from(value).map((char) => pinyin[char] ?? char).join(" ");
const labelClass = "justify-self-end text-sm text-kumo-strong";

export function DomainTemplatePage({ templates, onChanged, domain }: { templates: DomainTemplate[]; onChanged: () => void; domain?: string }) {
  const [mode, setMode] = useState("list");
  const [expanded, setExpanded] = useState<string>();
  const [confirm, setConfirm] = useState<string>();
  const [editing, setEditing] = useState<DomainTemplate>();
  const [detail, setDetail] = useState<Record<string, string>>({});
  const [owner, setOwner] = useState("I");
  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [province, setProvince] = useState("广东省");
  const [city, setCity] = useState("广州市");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [enLast, setEnLast] = useState("");
  const [enFirst, setEnFirst] = useState("");
  const [enAddress, setEnAddress] = useState("");
  const [idType, setIdType] = useState("SFZ");
  const [idNumber, setIdNumber] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const person = owner === "I";
  const reset = () => { setEditing(undefined); setDetail({}); setOwner("I"); setLast(""); setFirst(""); setProvince("广东省"); setCity("广州市"); setDistrict(""); setAddress(""); setPostcode(""); setPhone(""); setEmail(""); setEnLast(""); setEnFirst(""); setEnAddress(""); setIdType("SFZ"); setIdNumber(""); setNote(""); setError(null); };
  const startEdit = async (template: DomainTemplate) => {
    setEditing(template); setMode("form"); setError(null);
    try {
      const result = await domainsApi.execute({ action: "4.5", params: { c_sysid: template.id }, requestId: crypto.randomUUID(), confirmed: true });
      const data = (result.data ?? {}) as Record<string, string>;
      setDetail(data);
      setOwner(data.c_regtype === "E" ? "E" : "I");
      setLast(data.c_ln_m ?? ""); setFirst(data.c_fn_m ?? "");
      setProvince(data.c_st_m || "广东省"); setCity(data.c_ct_m || "广州市"); setDistrict(data.c_dt_m ?? "");
      setAddress(data.c_adr_m ?? ""); setPostcode(data.c_pc ?? ""); setPhone(data.c_ph ?? ""); setEmail(data.c_em ?? "");
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
      c_ln: enLast || enName(last), c_fn: enFirst || enName(first), c_st: provinceEn[province] ?? "", c_ct: cityEn[city] ?? "", c_adr: enAddress,
      c_idtype_gswl: idType, c_idnum_gswl: idNumber, c_keyword: note, c_ph: phone,
    };
    if (district) params.c_dt_m = district;
    if (!person) params.c_org_m = last;
    if (editing) params.c_sysid = editing.id;
    setBusy(true);
    try {
      await domainsApi.execute({ action: editing ? "4.2" : "4.1", params, requestId: crypto.randomUUID(), confirmed: true });
      onChanged(); setMode("list"); reset();
    } catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    setBusy(true);
    try {
      await domainsApi.execute({ action: "4.3", params: { c_sysid: id }, requestId: crypto.randomUUID(), confirmed: true });
      setConfirm(undefined); onChanged();
    } catch (cause) { setError(getApiMessage(cause)); } finally { setBusy(false); }
  };
  return <div className="grid gap-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div className="grid gap-1"><Text as="h1" variant="heading" size="lg">信息模板</Text><Text variant="secondary" size="sm">{domain ? `${domain} · 创建后可返回订购使用` : "创建、修改、删除模板，并查看审核状态与详情。"}</Text></div><Button onClick={() => { reset(); setMode("form"); }}>新建模板</Button></div>
    <Tabs variant="underline" value={mode} onValueChange={(value) => { setMode(value); setConfirm(undefined); }} tabs={[{ value: "list", label: "选择资料" }, { value: "form", label: "新填资料" }]} />
    {error ? <Banner variant="error" title={error} /> : null}
    {mode === "list" ? <div className="grid gap-2">
      {templates.map((item) => <div key={item.id} className="grid gap-2 border-b border-kumo-line py-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" className="grid flex-1 gap-1 text-left" onClick={() => setExpanded(expanded === item.id ? undefined : item.id)}><span className="text-sm font-medium text-kumo-strong">{item.label}</span><span className="text-xs text-kumo-subtle">{item.id} · {item.status}</span></button><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setExpanded(expanded === item.id ? undefined : item.id)}>{expanded === item.id ? "收起详情" : "查看详情"}</Button><Button variant="secondary" size="sm" onClick={() => void startEdit(item)}>修改</Button><Button variant="destructive" size="sm" onClick={() => setConfirm(item.id)}>删除</Button></div></div>
        {expanded === item.id ? <div className="grid gap-2 rounded-lg bg-kumo-overlay px-4 py-3 text-sm sm:grid-cols-2">{[["模板编号", item.id], ["模板名称", item.label], ["审核状态", item.status], ["联系邮箱", detail.c_em ?? "—"]].map(([label, value]) => <div key={label} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2"><span className="text-kumo-subtle">{label}</span><span className="text-kumo-strong">{value}</span></div>)}</div> : null}
        {confirm === item.id ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-kumo-error/40 px-4 py-2"><Text variant="secondary" size="sm">删除后不可恢复，确定删除「{item.label}」？</Text><div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => setConfirm(undefined)}>取消</Button><Button variant="destructive" size="sm" loading={busy} onClick={() => void remove(item.id)}>确认删除</Button></div></div> : null}
      </div>)}
      {!templates.length ? <Text variant="secondary" size="sm">暂无信息模板，点击「新建模板」创建。</Text> : null}
    </div> : <div className="grid gap-3">
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-4"><span /><div className="text-xs text-kumo-subtle">域名所有者名称代表域名的拥有权，请填写与所有者证件完全一致的企业名称或姓名，实名后不允许修改所有者。</div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">所有者类型</Text></span><Radio.Group orientation="horizontal" value={owner} onValueChange={(value) => { setOwner(value); setIdType(value === "I" ? "SFZ" : "ORG"); }}><Radio.Item value="I" label="个人" /><Radio.Item value="E" label="企业/组织" /></Radio.Group></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">{person ? "所有者姓名" : "联系人姓名"}</Text></span><div className="flex items-center gap-2"><Text as="span" variant="secondary" size="sm">姓</Text><Input className="w-36" value={last} onChange={(event) => { setLast(event.target.value); setEnLast(enName(event.target.value)); }} /><Text as="span" variant="secondary" size="sm">名</Text><Input className="w-36" value={first} onChange={(event) => { setFirst(event.target.value); setEnFirst(enName(event.target.value)); }} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">所属区域</Text></span><div className="flex flex-wrap gap-2"><Select className="w-28" aria-label="国家/地区" value="CN" items={{ CN: "中国" }} onValueChange={() => {}} /><Select className="w-28" aria-label="省份" value={province} items={Object.fromEntries(Object.keys(regions).map((name) => [name, name]))} onValueChange={(value) => { if (!value) return; setProvince(value); setCity(regions[value]?.[0] ?? ""); }} /><Select className="w-28" aria-label="城市" value={city} items={Object.fromEntries((regions[province] ?? []).map((name) => [name, name]))} onValueChange={(value) => value && setCity(value)} /><Input className="w-28" aria-label="区县" value={district} onChange={(event) => setDistrict(event.target.value)} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">详细地址</Text></span><Input className="w-96 max-w-full" value={address} onChange={(event) => setAddress(event.target.value)} /></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">邮编</Text></span><Input className="w-96 max-w-full" value={postcode} onChange={(event) => setPostcode(event.target.value)} /></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">联系电话</Text></span><div className="flex items-center gap-2"><Select className="w-24" aria-label="电话类型" value="0" items={{ "0": "手机" }} onValueChange={() => {}} /><Input className="w-20" value="+86" readOnly /><Input className="w-48" value={phone} onChange={(event) => setPhone(event.target.value)} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">电子邮箱</Text></span><Input type="email" className="w-96 max-w-full" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
      <div className="border-t border-kumo-line pt-3" />
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-4"><span /><div className="text-xs text-kumo-subtle">国际域名的所有者信息以英文为准，请勿缩写或简写。</div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">所有者姓名（英文）</Text></span><div className="flex items-center gap-2"><Text as="span" variant="secondary" size="sm">姓</Text><Input className="w-36" value={enLast} onChange={(event) => setEnLast(event.target.value)} /><Text as="span" variant="secondary" size="sm">名</Text><Input className="w-36" value={enFirst} onChange={(event) => setEnFirst(event.target.value)} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">省份（英文）</Text></span><Input className="w-96 max-w-full" value={provinceEn[province] ?? ""} onChange={() => {}} /></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">城市（英文）</Text></span><Input className="w-96 max-w-full" value={cityEn[city] ?? ""} onChange={() => {}} /></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">详细地址（英文）</Text></span><Input className="w-96 max-w-full" value={enAddress} onChange={(event) => setEnAddress(event.target.value)} /></div>
      <div className="border-t border-kumo-line pt-3" />
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">适用后缀</Text></span><div className="flex items-center gap-2"><Button variant="secondary" size="sm">常规后缀</Button><Button variant="secondary" size="sm" disabled>hk域名</Button><Button variant="secondary" size="sm" disabled>tw域名</Button><Button variant="secondary" size="sm" disabled>境外</Button></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">默认模板</Text></span><div className="flex items-center gap-3"><Button variant="secondary" size="sm">默认</Button><Text variant="secondary" size="sm">设置该模板为默认模板后，将取消其它同类型模板的默认设置。</Text></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">实名证件</Text></span><div className="flex items-center gap-2"><Select className="w-28" aria-label="证件类型" value={idType} items={person ? { SFZ: "身份证", HZ: "护照" } : { ORG: "营业执照", YYZZ: "组织机构代码证" }} onValueChange={(value) => value && setIdType(value)} /><Input className="w-56" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} /></div></div>
      <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">模板备注</Text></span><Input className="w-96 max-w-full" value={note} onChange={(event) => setNote(event.target.value)} /></div>
      <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => { setMode("list"); reset(); }}>取消</Button><Button loading={busy} onClick={() => void submit()}>{editing ? "保存修改" : "提交模板"}</Button></div>
    </div>}
  </div>;
}
