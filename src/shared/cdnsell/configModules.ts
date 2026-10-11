import type { DomainConfig } from "../api/cdnsellP2";

type FieldKind = "text" | "number" | "boolean" | "password" | "multiline" | "select";
export interface ConfigField { key: string; label: string; kind: FieldKind; items?: Record<string, string>; placeholder?: string }
export interface ModuleSpec { key: string; title: string; description: string; fields: ConfigField[] }

const regionLabels = { mainland: "中国大陆", overseas: "海外", global: "全球" };

export const moduleSpecs: ModuleSpec[] = [
  { key: "basic_origin", title: "基础与回源配置", description: "加速区域、源站与回源协议。项目组由后台统一配置。", fields: [{ key: "accelerateRegion", label: "加速区域", kind: "select", items: regionLabels }, { key: "originType", label: "源站类型", kind: "select", items: { domain: "域名源站", ip: "IP 源站" } }, { key: "originHost", label: "源站地址", kind: "text" }, { key: "originProtocol", label: "回源协议", kind: "select", items: { http: "HTTP", follow: "协议跟随", https: "HTTPS" } }] },
  { key: "origin_host", title: "回源 Host", description: "控制 CDN 回源请求携带的 Host。", fields: [{ key: "followRequestDomain", label: "跟随请求域名", kind: "boolean" }, { key: "host", label: "固定回源 Host", kind: "text" }] },
  { key: "advanced_origin", title: "高级回源", description: "配置主备源及节点回源策略。", fields: [{ key: "enabled", label: "启用高级回源", kind: "boolean" }, { key: "originType", label: "主源类型", kind: "select", items: { domain: "域名", ipaddr: "IP" } }, { key: "origin", label: "主源地址", kind: "text" }, { key: "backupOriginType", label: "备源类型", kind: "select", items: { domain: "域名", ipaddr: "IP" } }, { key: "backupOrigin", label: "备源地址", kind: "text" }, { key: "policy", label: "回源策略", kind: "text" }, { key: "bestCount", label: "优选节点数", kind: "number" }] },
  { key: "cache_rules", title: "缓存规则", description: "每行：类型 | 匹配值 | 缓存秒数 | 是否尊重源站。", fields: [{ key: "rulesText", label: "缓存规则", kind: "multiline", placeholder: "file_suffix | jpg,png | 86400 | true" }] },
  { key: "status_code_cache", title: "状态码缓存", description: "按 HTTP 状态码设置缓存时间。", fields: [{ key: "rulesText", label: "状态码规则", kind: "multiline" }] },
  { key: "error_page", title: "自定义错误页面", description: "每行：状态码 | HTTPS 页面地址。", fields: [{ key: "pagesText", label: "错误页面", kind: "multiline", placeholder: "404 | https://example.com/404.html" }] },
  { key: "query_params", title: "查询参数策略", description: "控制缓存键是否忽略查询参数。", fields: [{ key: "enabled", label: "启用参数过滤", kind: "boolean" }, { key: "type", label: "过滤方式", kind: "text" }, { key: "hashKeyArgs", label: "保留参数", kind: "text" }] },
  { key: "referer", title: "Referer 防盗链", description: "白名单或黑名单，每行一个域名。", fields: [{ key: "enabled", label: "启用 Referer 防盗链", kind: "boolean" }, { key: "type", label: "名单类型", kind: "select", items: { whitelist: "白名单", blacklist: "黑名单" } }, { key: "valuesText", label: "Referer 列表", kind: "multiline" }, { key: "allowEmpty", label: "允许空 Referer", kind: "boolean" }] },
  { key: "ip_acl", title: "IP 黑白名单", description: "每行一个 IP 或 CIDR。", fields: [{ key: "enabled", label: "启用 IP 访问控制", kind: "boolean" }, { key: "type", label: "名单类型", kind: "select", items: { whitelist: "白名单", blacklist: "黑名单" } }, { key: "valuesText", label: "IP 列表", kind: "multiline" }] },
  { key: "ua_acl", title: "UA 黑白名单", description: "控制指定 User-Agent 的访问。", fields: [{ key: "enabled", label: "启用 UA 访问控制", kind: "boolean" }, { key: "valuesText", label: "UA 列表", kind: "multiline" }] },
  { key: "request_auth", title: "时间戳与共享密钥防盗链", description: "密钥加密保存，保存后不回显。", fields: [{ key: "enabled", label: "启用时间戳鉴权", kind: "boolean" }, { key: "authType", label: "鉴权类型", kind: "select", items: { "1": "类型 1（查询参数）", "2": "类型 2（路径签名）" } }, { key: "primaryKey", label: "主密钥（6–128 位字母或数字）", kind: "password" }, { key: "backupKey", label: "备用密钥", kind: "password" }, { key: "expireSeconds", label: "过期秒数", kind: "number" }] },
  { key: "url_block", title: "URL 屏蔽", description: "每行一个本人加速域名 URL。", fields: [{ key: "action", label: "操作", kind: "select", items: { block: "屏蔽", unblock: "解除屏蔽" } }, { key: "urlsText", label: "URL 列表", kind: "multiline" }, { key: "refreshOnUnblock", label: "解除后刷新", kind: "boolean" }] },
  { key: "force_redirect", title: "HTTPS 强制跳转", description: "稳定站点建议使用 301，临时切换使用 302。", fields: [{ key: "type", label: "跳转方式", kind: "select", items: { off: "关闭", http_to_https: "HTTP → HTTPS" } }, { key: "code", label: "状态码", kind: "select", items: { "301": "301", "302": "302" } }] },
  { key: "tls_version", title: "TLS 版本", description: "至少保留一个版本，建议启用 TLS 1.2 和 1.3。", fields: [{ key: "versionsText", label: "TLS 版本（每行一个）", kind: "multiline", placeholder: "TLSv1.2\nTLSv1.3" }] },
  { key: "http2", title: "HTTP/2", description: "部署有效证书后启用。", fields: [{ key: "enabled", label: "启用 HTTP/2", kind: "boolean" }] },
  { key: "http_headers", title: "HTTP 规则", description: "设置一个响应 HTTP 头。", fields: [{ key: "name", label: "HTTP 头名称", kind: "text" }, { key: "value", label: "HTTP 头值", kind: "text" }] },
  { key: "performance", title: "性能优化", description: "配置 Gzip、Br 与压缩文件类型。", fields: [{ key: "gzip", label: "启用 Gzip", kind: "boolean" }, { key: "br", label: "启用 Br", kind: "boolean" }, { key: "fileTypes", label: "Content-Type", kind: "text" }, { key: "fileSize", label: "压缩文件大小范围（字节）", kind: "text", placeholder: "1024-31457280" }] },
  { key: "content_logs", title: "内容操作与日志", description: "开启或关闭域名日志服务。", fields: [{ key: "action", label: "日志服务", kind: "select", items: { start: "开启", stop: "关闭" } }, { key: "granularity", label: "日志粒度", kind: "select", items: { "5": "5 分钟", "60": "1 小时" } }] },
];

function lines(value: unknown) { return Array.isArray(value) ? value.map(String).join("\n") : ""; }
export function initialForm(config: DomainConfig | undefined, module: string) {
  const value = { ...(config?.localConfig ?? {}) };
  if (module === "cache_rules" && Array.isArray(value.rules)) value.rulesText = value.rules.map((row) => { const item = row as Record<string, unknown>; return `${item.type ?? ""} | ${item.value ?? ""} | ${item.seconds ?? ""} | ${item.respectOrigin ?? false}`; }).join("\n");
  if (module === "error_page" && Array.isArray(value.pages)) value.pagesText = value.pages.map((row) => { const item = row as Record<string, unknown>; return `${item.code ?? ""} | ${item.url ?? ""}`; }).join("\n");
  if ("values" in value) value.valuesText = lines(value.values);
  if ("urls" in value) value.urlsText = lines(value.urls);
  if ("versions" in value) value.versionsText = lines(value.versions);
  return value;
}

export function serializeForm(module: string, form: Record<string, unknown>) {
  const value = { ...form };
  if (typeof value.valuesText === "string") value.values = value.valuesText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (typeof value.urlsText === "string") value.urls = value.urlsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (typeof value.versionsText === "string") value.versions = value.versionsText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  if (module === "cache_rules" && typeof value.rulesText === "string") value.rules = value.rulesText.split(/\r?\n/).map((line) => line.split("|").map((item) => item.trim())).filter((parts) => parts[0]).map(([type, match, seconds, respect]) => ({ type, value: match, seconds: Number(seconds), enabled: true, respectOrigin: respect === "true" }));
  if (module === "error_page" && typeof value.pagesText === "string") value.pages = value.pagesText.split(/\r?\n/).map((line) => line.split("|").map((item) => item.trim())).filter((parts) => parts[0] && parts[1]).map(([code, url]) => ({ code, url }));
  for (const key of ["valuesText", "urlsText", "versionsText", "rulesText", "pagesText"]) delete value[key];
  return value;
}
