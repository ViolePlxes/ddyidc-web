import { useMemo, useState, type ReactNode } from "react";
import { Banner, Button, Input, LayerDialog, Radio, Select, Tabs, Text } from "@cloudflare/kumo";
import { useQueryClient } from "@tanstack/react-query";
import { domainsApi, type DomainTemplate } from "../../../shared/api/domains";
import { getApiMessage } from "../../../shared/api/request";
import regionsRaw from "../../../shared/domains/westcn-regions.json";

type Region = { province: string; cities: string[] };
const regions = regionsRaw as Region[];

const provinceEn: Record<string, string> = {
  安徽省: "Anhui Sheng", 北京市: "Beijing Shi", 重庆市: "Chongqing Shi", 福建省: "Fujian Sheng", 甘肃省: "Gansu Sheng", 广东省: "Guang Dong Sheng", 广西壮族自治区: "Guangxi Zhuangzu Zizhiqu", 贵州省: "Guizhou Sheng", 海南省: "Hainan Sheng", 河北省: "Hebei Sheng", 河南省: "Henan Sheng", 黑龙江省: "Heilongjiang Sheng", 湖北省: "Hubei Sheng", 湖南省: "Hunan Sheng", 吉林省: "Jilin Sheng", 江苏省: "Jiangsu Sheng", 江西省: "Jiangxi Sheng", 辽宁省: "Liaoning Sheng", 内蒙古自治区: "Nei Mongol Zizhiqu", 宁夏回族自治区: "Ningxia Huizu Zizhiqu", 青海省: "Qinghai Sheng", 山东省: "Shandong Sheng", 山西省: "Shanxi Sheng", 陕西省: "Shaanxi Sheng", 上海市: "Shanghai Shi", 四川省: "Sichuan Sheng", 天津市: "Tianjin Shi", 西藏自治区: "Xizang Zizhiqu", 新疆维吾尔自治区: "Xinjiang Uygur Zizhiqu", 云南省: "Yunnan Sheng", 浙江省: "Zhejiang Sheng", 台湾省: "Taiwan Sheng", 香港特别行政区: "Hong Kong", 澳门特别行政区: "Macau",
};
const cityEn: Record<string, string> = {
  安庆市: "Anqing", 蚌埠市: "Bengbu", 池州市: "Chizhou", 滁州市: "Chuzhou", 阜阳市: "Fuyang", 合肥市: "Hefei", 淮北市: "Huaibei", 淮南市: "Huainan", 黄山市: "Huangshan", 六安市: "Luan", 马鞍山市: "Maanshan", 宿州市: "Suzhou", 铜陵市: "Tongling", 芜湖市: "Wuhu", 宣城市: "Xuancheng", 亳州市: "Bozhou",
  北京市: "Beijing", 上海市: "Shanghai", 天津市: "Tianjin", 重庆市: "Chongqing", 广州市: "Guangzhou", 深圳市: "Shenzhen", 东莞市: "Dongguan", 佛山市: "Foshan", 珠海市: "Zhuhai", 中山市: "Zhongshan", 成都市: "Chengdu", 绵阳市: "Mianyang", 德阳市: "Deyang", 杭州市: "Hangzhou", 宁波市: "Ningbo", 温州市: "Wenzhou", 南京市: "Nanjing", 苏州市: "Suzhou", 武汉市: "Wuhan", 长沙市: "Changsha", 西安市: "Xian", 郑州市: "Zhengzhou", 济南市: "Jinan", 青岛市: "Qingdao", 福州市: "Fuzhou", 厦门市: "Xiamen", 昆明市: "Kunming", 南昌市: "Nanchang", 沈阳市: "Shenyang", 大连市: "Dalian", 哈尔滨市: "Harbin", 长春市: "Changchun", 石家庄市: "Shijiazhuang", 太原市: "Taiyuan", 南宁市: "Nanning", 贵阳市: "Guiyang", 兰州市: "Lanzhou", 海口市: "Haikou", 银川市: "Yinchuan", 乌鲁木齐市: "Urumqi", 拉萨市: "Lhasa", 呼和浩特市: "Hohhot",
};
const pinyin: Record<string, string> = {
  祁: "Qi", 李: "Li", 王: "Wang", 张: "Zhang", 刘: "Liu", 陈: "Chen", 杨: "Yang", 赵: "Zhao", 黄: "Huang", 周: "Zhou", 吴: "Wu", 徐: "Xu", 孙: "Sun", 马: "Ma", 朱: "Zhu", 胡: "Hu", 郭: "Guo", 何: "He", 高: "Gao", 林: "Lin", 罗: "Luo", 郑: "Zheng", 梁: "Liang", 谢: "Xie", 宋: "Song", 唐: "Tang", 许: "Xu", 韩: "Han", 冯: "Feng", 邓: "Deng", 曹: "Cao", 彭: "Peng", 曾: "Zeng", 田: "Tian", 董: "Dong", 潘: "Pan", 袁: "Yuan", 蔡: "Cai", 蒋: "Jiang", 余: "Yu", 于: "Yu", 杜: "Du", 叶: "Ye", 程: "Cheng", 苏: "Su", 魏: "Wei", 丁: "Ding", 任: "Ren", 沈: "Shen", 姚: "Yao", 卢: "Lu", 姜: "Jiang", 崔: "Cui", 钟: "Zhong", 谭: "Tan", 陆: "Lu", 汪: "Wang", 范: "Fan", 金: "Jin", 石: "Shi", 贾: "Jia", 夏: "Xia", 方: "Fang", 白: "Bai", 孟: "Meng", 秦: "Qin", 江: "Jiang", 尹: "Yin", 薛: "Xue", 闫: "Yan", 段: "Duan", 雷: "Lei", 龙: "Long", 陶: "Tao", 黎: "Li", 贺: "He", 顾: "Gu", 毛: "Mao", 郝: "Hao", 龚: "Gong", 邵: "Shao", 万: "Wan", 钱: "Qian", 严: "Yan", 武: "Wu", 戴: "Dai", 孔: "Kong", 向: "Xiang", 汤: "Tang", 常: "Chang",
  岩: "Yan", 小: "Xiao", 明: "Ming", 伟: "Wei", 芳: "Fang", 娜: "Na", 敏: "Min", 静: "Jing", 强: "Qiang", 磊: "Lei", 军: "Jun", 洋: "Yang", 勇: "Yong", 艳: "Yan", 杰: "Jie", 娟: "Juan", 涛: "Tao", 超: "Chao", 霞: "Xia", 平: "Ping", 刚: "Gang", 英: "Ying", 华: "Hua", 玉: "Yu", 兰: "Lan", 春: "Chun", 梅: "Mei", 文: "Wen", 辉: "Hui", 红: "Hong", 建: "Jian", 国: "Guo", 志: "Zhi", 海: "Hai", 生: "Sheng", 云: "Yun", 飞: "Fei", 鹏: "Peng", 宇: "Yu", 浩: "Hao", 鑫: "Xin", 雨: "Yu", 晨: "Chen",
};
const enName = (value: string) => Array.from(value).map((char) => pinyin[char] ?? char).join(" ");
const labelClass = "justify-self-end text-sm text-kumo-strong";

function Row({ name, children }: { name: string; children: ReactNode }) {
  return <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">{name}</Text></span><div className="grid gap-2">{children}</div></div>;
}

export function DomainTemplateDialog({ open, onOpenChange, templates, onCreated, domain }: { open: boolean; onOpenChange: (open: boolean) => void; templates: DomainTemplate[]; onCreated: () => void; domain?: string }) {
  const client = useQueryClient();
  const [mode, setMode] = useState("new");
  const [owner, setOwner] = useState("I");
  const [company, setCompany] = useState("");
  const [last, setLast] = useState("");
  const [first, setFirst] = useState("");
  const [province, setProvince] = useState("广东省");
  const [city, setCity] = useState("广州市");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phoneType, setPhoneType] = useState("0");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [enLast, setEnLast] = useState("");
  const [enFirst, setEnFirst] = useState("");
  const [enAddress, setEnAddress] = useState("");
  const [idType, setIdType] = useState("SFZ");
  const [idNumber, setIdNumber] = useState("");
  const [note, setNote] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cities = useMemo(() => regions.find((item) => item.province === province)?.cities ?? [], [province]);
  const person = owner === "I";
  const changeLast = (value: string) => { setLast(value); setEnLast(enName(value)); };
  const changeFirst = (value: string) => { setFirst(value); setEnFirst(enName(value)); };
  const changeProvince = (value: string | null) => {
    if (!value) return;
    setProvince(value);
    const nextCities = regions.find((item) => item.province === value)?.cities ?? [];
    setCity(nextCities[0] ?? "");
  };
  const submit = async () => {
    setError(null);
    if (!last || !first || !province || !city || !address || !postcode || !email || !idNumber) { setError("请填写所有必填字段"); return; }
    if ((phoneType === "0" && !phone) || (phoneType === "1" && (!phoneCode || !phoneNumber))) { setError("请填写联系电话"); return; }
    const params: Record<string, string> = {
      c_regtype: owner, c_co: "CN", cocode: "+86", c_ph_type: phoneType,
      c_ln_m: last, c_fn_m: first, c_st_m: province, c_ct_m: city, c_adr_m: address, c_pc: postcode, c_em: email,
      c_ln: enLast || enName(last), c_fn: enFirst || enName(first), c_st: provinceEn[province] ?? "", c_ct: cityEn[city] ?? "", c_adr: enAddress,
      c_idtype_gswl: idType, c_idnum_gswl: idNumber, c_keyword: note,
    };
    if (district) params.c_dt_m = district;
    if (!person) params.c_org_m = company;
    if (phoneType === "0") params.c_ph = phone; else { params.c_ph_code = phoneCode; params.c_ph_num = phoneNumber; }
    setSubmitting(true);
    try {
      await domainsApi.execute({ action: "4.1", params, requestId: crypto.randomUUID(), confirmed: true });
      await client.invalidateQueries({ queryKey: ["domains"] });
      onCreated();
      onOpenChange(false);
    } catch (cause) {
      setError(getApiMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };
  return <LayerDialog.Root open={open} onOpenChange={(value) => { if (!submitting) onOpenChange(value); }}>
    <LayerDialog.Content size="xl" closeLabel="关闭">
      <LayerDialog.Title>创建信息模板</LayerDialog.Title>
      <LayerDialog.Description>{domain ? `${domain} · 注册前需先创建所有者信息模板，提交后由注册局实名审核。` : "域名注册前需先创建所有者信息模板，提交后由注册局实名审核。"}</LayerDialog.Description>
      <LayerDialog.Body>
        <div className="grid gap-4">
          <Tabs variant="underline" value={mode} onValueChange={setMode} tabs={[{ value: "existing", label: "选择资料" }, { value: "new", label: "新填资料" }]} />
          {mode === "existing" ? <div className="grid gap-3">
            {templates.length ? <Radio.Group legend="选择信息模板" orientation="vertical" value={selectedTemplate} onValueChange={setSelectedTemplate}>{templates.map((template) => <Radio.Item key={template.id} value={template.id} label={template.label} description={`${template.id} · ${template.status}`} />)}</Radio.Group> : <Text variant="secondary" size="sm">暂无可用信息模板，请切换到「新填资料」创建。</Text>}
          </div> : <div className="grid gap-3">
            <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-4"><span /><div className="flex gap-2 text-xs text-kumo-subtle">域名所有者名称代表域名的拥有权，请填写与所有者证件完全一致的企业名称或姓名，实名后不允许修改所有者。</div></div>
            <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-4"><span className={labelClass}><Text as="span" variant="secondary" size="sm">所有者类型</Text></span><Radio.Group orientation="horizontal" value={owner} onValueChange={(value) => { setOwner(value); setIdType(value === "I" ? "SFZ" : "ORG"); }}><Radio.Item value="I" label="个人" /><Radio.Item value="E" label="企业/组织" /></Radio.Group></div>
            {!person ? <Row name="单位名称"><Input value={company} onChange={(event) => setCompany(event.target.value)} /></Row> : null}
            <Row name={person ? "所有者姓名" : "联系人姓名"}><div className="flex items-center gap-2"><Text as="span" variant="secondary" size="sm">姓</Text><Input className="w-36" value={last} onChange={(event) => changeLast(event.target.value)} /><Text as="span" variant="secondary" size="sm">名</Text><Input className="w-36" value={first} onChange={(event) => changeFirst(event.target.value)} /></div></Row>
            <Row name="所属区域"><div className="flex flex-wrap items-center gap-2">
              <Select className="w-28" aria-label="国家/地区" value="CN" items={{ CN: "中国" }} onValueChange={() => {}} />
              <Select className="w-28" aria-label="省份" value={province} items={Object.fromEntries(regions.map((item) => [item.province, item.province]))} onValueChange={changeProvince} />
              <Select className="w-28" aria-label="城市" value={city} items={Object.fromEntries(cities.map((name) => [name, name]))} onValueChange={(value) => value && setCity(value)} />
              <Input className="w-28" aria-label="区县" value={district} onChange={(event) => setDistrict(event.target.value)} />
            </div></Row>
            <Row name="详细地址"><Input className="w-96 max-w-full" value={address} onChange={(event) => setAddress(event.target.value)} /></Row>
            <Row name="邮编"><Input className="w-96 max-w-full" value={postcode} onChange={(event) => setPostcode(event.target.value)} /></Row>
            <Row name="联系电话"><div className="flex items-center gap-2">
              <Select className="w-24" aria-label="电话类型" value={phoneType} items={{ "0": "手机", "1": "座机" }} onValueChange={(value) => value && setPhoneType(value)} />
              {phoneType === "0" ? <><Input className="w-20" value="+86" readOnly /><Input className="w-48" value={phone} onChange={(event) => setPhone(event.target.value)} /></> : <><Input className="w-20" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} /><Input className="w-40" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} /></>}
            </div></Row>
            <Row name="电子邮箱"><Input type="email" className="w-96 max-w-full" value={email} onChange={(event) => setEmail(event.target.value)} /></Row>
            <div className="border-t border-kumo-line pt-3" />
            <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-4"><span /><div className="text-xs text-kumo-subtle">国际域名的所有者信息以英文为准，请勿缩写或简写。</div></div>
            <Row name="所有者姓名（英文）"><div className="flex items-center gap-2"><Text as="span" variant="secondary" size="sm">姓</Text><Input className="w-36" value={enLast} onChange={(event) => setEnLast(event.target.value)} /><Text as="span" variant="secondary" size="sm">名</Text><Input className="w-36" value={enFirst} onChange={(event) => setEnFirst(event.target.value)} /></div></Row>
            <Row name="省份（英文）"><Input className="w-96 max-w-full" value={provinceEn[province] ?? ""} onChange={() => {}} /></Row>
            <Row name="城市（英文）"><Input className="w-96 max-w-full" value={cityEn[city] ?? ""} onChange={() => {}} /></Row>
            <Row name="详细地址（英文）"><Input className="w-96 max-w-full" value={enAddress} onChange={(event) => setEnAddress(event.target.value)} /></Row>
            <div className="border-t border-kumo-line pt-3" />
            <Row name="适用后缀"><div className="flex items-center gap-2"><Button variant="secondary" size="sm">常规后缀</Button><Button variant="secondary" size="sm" disabled>hk域名</Button><Button variant="secondary" size="sm" disabled>tw域名</Button><Button variant="secondary" size="sm" disabled>境外</Button></div></Row>
            <Row name="实名证件"><div className="flex items-center gap-2"><Select className="w-28" aria-label="证件类型" value={idType} items={person ? { SFZ: "身份证", HZ: "护照" } : { ORG: "营业执照", YYZZ: "组织机构代码证" }} onValueChange={(value) => value && setIdType(value)} /><Input className="w-56" value={idNumber} onChange={(event) => setIdNumber(event.target.value)} /></div></Row>
            <Row name="模板备注"><Input className="w-96 max-w-full" value={note} onChange={(event) => setNote(event.target.value)} /></Row>
            {error ? <Banner variant="error" title={error} /> : null}
          </div>}
        </div>
      </LayerDialog.Body>
      <LayerDialog.Actions dismissLabel="取消"><LayerDialog.Action loading={submitting} disabled={mode === "existing" ? !selectedTemplate : submitting} onClick={() => { if (mode === "existing") { onOpenChange(false); return; } void submit(); }}>{mode === "existing" ? "使用模板" : "提交模板"}</LayerDialog.Action></LayerDialog.Actions>
    </LayerDialog.Content>
  </LayerDialog.Root>;
}
