export interface DomainCapability {
  title: string;
  refs: string[];
  note?: string;
  paid?: boolean;
  approval?: boolean;
}
export interface DomainPage {
  key: string;
  title: string;
  description: string;
  capabilities: DomainCapability[];
}
export interface DomainSection {
  key: string;
  title: string;
  description: string;
  pages: DomainPage[];
}
const capability = (title: string, refs: string[], extra: Omit<DomainCapability, "title" | "refs"> = {}): DomainCapability => ({ title, refs, ...extra });
export const domainBase = "/console/domains";
export const domainSections: DomainSection[] = [
  { key: "purchase", title: "注册与交易", description: "查询可注册域名、比较价格，或选购一口价域名。", pages: [
    { key: "register", title: "注册域名", description: "查询名称与后缀，选择年限和注册信息模板，通过平台订单完成购买。", capabilities: [capability("查询可注册域名", ["3.1"]), capability("提交域名注册", ["4.6"], { paid: true, note: "查询结果不保留名额；提交后按每个域名分别确认注册结果。" })] },
    { key: "pricing", title: "域名价格", description: "分别查看注册与续费销售价格，普通域名和溢价域名单独报价。", capabilities: [capability("注册年限与销售报价", ["1.1"]), capability("按域名查询续费报价", ["3.14"])] },
    { key: "market", title: "一口价域名", description: "浏览在售域名与详情，核对实时价格后创建平台购买订单。", capabilities: [capability("浏览域名与详情", ["market.detail"]), capability("购买一口价域名", ["market.buy"], { paid: true })] },
  ] },
  { key: "list", title: "我的域名", description: "查看本人域名及到期状态，从域名详情进入解析、资料与安全管理。", pages: [
    { key: "overview", title: "域名列表", description: "域名状态、注册时间、到期时间、DNS 服务器及实名情况集中展示。", capabilities: [capability("查看本人域名列表", ["3.3"]), capability("查看域名详细资料", ["4.8"]), capability("修改域名联系人资料", ["4.7"], { note: "联系人资料变更与持有人过户分别处理。" })] },
  ] },
  { key: "billing", title: "续费与赎回", description: "按当前报价续费，或处理进入赎回阶段的域名。", pages: [
    { key: "renew", title: "域名续费", description: "选择本人域名和续费年限，核对价格及续费后的到期时间。", capabilities: [capability("查询续费价格", ["3.14"]), capability("提交域名续费", ["3.2"], { paid: true, note: "通过平台订单付款，并核对原到期时间，防止同一周期重复执行。" })] },
    { key: "redeem", title: "域名赎回", description: "核实域名赎回资格及费用，提交申请后跟踪实际处理状态。", capabilities: [capability("提交赎回并查询结果", ["3.28"], { approval: true, paid: true, note: "能力需单独开通；资格与费用确认后才允许提交。" })] },
  ] },
  { key: "transfers", title: "转入与过户", description: "将其他注册商的域名转入，或变更当前域名的持有人。", pages: [
    { key: "import", title: "域名转入", description: "填写域名和转移码，检查转入条件及价格，选择注册信息模板。", capabilities: [capability("验证转入资格与费用", ["5.2"]), capability("提交转入申请", ["5.1"], { paid: true, note: "默认保留原 DNS；域名管理密码不能替代转移码。" })] },
    { key: "progress", title: "转入记录", description: "查看转入进度，刷新当前结果，或在允许阶段撤销申请。", capabilities: [capability("查看转入列表", ["5.3"]), capability("刷新转入状态", ["5.5"]), capability("撤销转入申请", ["5.4"])] },
    { key: "ownership", title: "持有人过户", description: "选择已核实的目标信息模板，变更域名注册人。", capabilities: [capability("提交模板过户", ["4.11"], { note: "提交前确认持有人变化及相关限制，不能当作平台账号间的实例转让。" })] },
    { key: "ownership-records", title: "过户记录", description: "查看持有人变更的受理、处理中、成功和失败结果。", capabilities: [capability("查询域名过户状态", ["4.12"])] },
  ] },
  { key: "contacts", title: "信息模板", description: "分别管理个人和企业注册资料，以及域名实名审核。", pages: [
    { key: "templates", title: "模板管理", description: "创建、查看和维护域名联系人模板，支持查看详情与删除。", capabilities: [capability("创建信息模板", ["4.1"]), capability("修改信息模板", ["4.2"]), capability("删除信息模板", ["4.3"]), capability("查看模板列表和详情", ["4.4", "4.5"])] },
    { key: "verification", title: "域名实名认证", description: "为注册信息模板提交实名材料，查看审核状态及拒绝原因。", capabilities: [capability("获取实名上传凭证", ["4.9"]), capability("提交实名材料", ["4.10"]), capability("查看实名审核情况", ["4.5", "4.8"], { note: "平台账号实名认证与域名实名是两项独立核验。" })] },
  ] },
  { key: "dns", title: "DNS 管理", description: "区分解析记录、权威 DNS 服务器、自建 DNS 主机和 DNSSEC。", pages: [
    { key: "records", title: "解析记录", description: "管理本人域名的解析记录，展示实际权威 DNS 的托管位置。", capabilities: [capability("查询解析记录", ["3.10"]), capability("添加解析记录", ["3.7"]), capability("修改解析记录", ["3.8"]), capability("删除解析记录", ["3.9"], { note: "修改前提示可能影响网站与邮件；使用第三方 DNS 时明确说明生效位置。" })] },
    { key: "nameservers", title: "DNS 服务器", description: "查看及修改域名使用的权威 DNS 服务器，不与普通解析记录混合。", capabilities: [capability("修改 DNS 服务器", ["3.6"], { note: "提交前确认现有解析记录已迁移，并跟踪批量操作结果。" })] },
    { key: "hosts", title: "自建 DNS 主机", description: "管理域名下的 DNS 主机注册信息（Glue），用于自建权威 DNS 服务。", capabilities: [capability("查看注册 DNS 主机", ["3.18"]), capability("注册 DNS 主机", ["3.19"]), capability("修改 DNS 主机", ["3.20"]), capability("同步注册信息", ["3.21"]), capability("删除 DNS 主机", ["3.22"])] },
    { key: "dnssec", title: "DNSSEC", description: "核对 DNS 服务商提供的 DS 参数及域名支持情况后启用。", capabilities: [capability("查询 DNSSEC 详情", ["3.31"]), capability("添加 DS 记录", ["3.29"]), capability("删除 DS 记录", ["3.30"]), capability("同步 DNSSEC", ["3.32"], { note: "修改或迁移 DNS 时检查签名链，避免域名解析失败。" })] },
  ] },
  { key: "security", title: "安全与工具", description: "按域名实际支持范围管理保护开关、管理凭据和查询工具。", pages: [
    { key: "locks", title: "域名锁定", description: "分别管理禁止修改和禁止转移，不与收费注册局安全锁混淆。", capabilities: [capability("开启或解除域名锁定", ["3.12"], { note: "解除时二次确认；仅控制对应的修改或转移限制。" })] },
    { key: "privacy", title: "隐私保护", description: "查看域名是否支持隐私保护，再展示当前保护状态。", capabilities: [capability("查询支持情况及状态", ["3.35"]), capability("开启隐私保护", ["3.33"]), capability("关闭隐私保护", ["3.34"], { note: "仅适用于实际支持的域名后缀。" })] },
    { key: "registry-lock", title: "注册局安全锁", description: "查看资格、费用、服务期限与锁定状态，支持开通、开关和续费。", capabilities: [capability("查询安全锁费用", ["3.17"]), capability("开通安全锁", ["3.16"], { paid: true }), capability("查看服务和锁定状态", ["3.37"]), capability("设置安全锁状态", ["3.38"]), capability("续费安全锁", ["3.39"], { paid: true })] },
    { key: "password", title: "域名管理密码", description: "敏感凭据默认隐藏，查看与修改需完成安全核验。", capabilities: [capability("查看管理密码", ["3.4"]), capability("修改管理密码", ["3.5"], { note: "此密码不是域名转入或转出授权码。" })] },
    { key: "certificate", title: "域名证书", description: "获取域名注册证书，明确区别于网站 HTTPS 使用的 SSL 证书。", capabilities: [capability("获取域名证书", ["3.11"])] },
    { key: "whois", title: "WHOIS 查询", description: "查看域名的公开注册状态、日期、注册商及 DNS 信息。", capabilities: [capability("查询 WHOIS 信息", ["3.13"])] },
  ] },
  { key: "tasks", title: "任务与记录", description: "将提交、处理结果和真实履约分开，结果不确定时保留待核对。", pages: [
    { key: "activity", title: "操作记录", description: "集中查看注册、续费、转入、资料与安全操作的进度和处理结果。", capabilities: [capability("查看商城更新记录", ["market.full", "market.new", "market.removed"], { note: "库存数据由后台同步；前台不展示供应商凭据或采购成本。" })] },
    { key: "offline", title: "离线任务", description: "查看批量操作的排队状态、执行时间和逐域名结果。", capabilities: [capability("查询离线操作记录", ["3.15"])] },
    { key: "naming-failures", title: "命名失败记录", description: "查看命名审核失败删除记录及原因，再按真实情况处理订单。", capabilities: [capability("查询最近命名失败记录", ["3.36"])] },
  ] },
];
export function domainHref(section: DomainSection, page?: DomainPage): string {
  return `${domainBase}/${section.key}${page ? `/${page.key}` : ""}`;
}
