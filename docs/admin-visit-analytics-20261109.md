# 后台首页访问分析（真实采集接入）

状态：后台首页「访问分析」已接真实采集；后端实现见 server `docs/visit-analytics.md`。

## 1. 组成

| 文件 | 作用 |
|---|---|
| `src/shared/api/visitAnalytics.ts` | 管理端查询接口、日期范围计算、上报函数 |
| `src/shared/components/VisitBeacon.tsx` | 每次前端路由变化上报一次页面访问 |
| `src/entry/createEntry.tsx` | 在 Router 内挂载 `VisitBeacon`（四个应用共用） |
| `src/apps/admin/components/HomeVisitAnalytics.tsx` | 首页访问分析面板：筛选、加载/空/错误态、桑基与排行数据 |
| `src/shared/components/visit-analytics/VisitTrafficPanel.tsx` | 展示层；客户端/状态码排行改为显式数据入参 |
| `src/shared/components/visit-analytics/countryNames.ts` | 离线地域库中文名 → ECharts 世界地图要素名 |

## 2. 上报口径

- 页面访问只能由浏览器描述：SPA 由 nginx 提供静态外壳，后端看不到 HTML 请求。
- 路由变化后 350ms 上报 `{path, referrer, title, utm}`；同一路径+查询串只上报一次（React StrictMode 双执行不会重复）。
- 采集范围、排除项、限流与采样全部在后端判定，前端不缓存、不重试、失败静默。
- 只上报 `location.pathname`，不上报查询串内容（只额外上报 `utm_source`）；管理端随机入口由后端脱敏为 `dd-admin-*`。

## 3. 面板行为

- 时间范围：今天 / 近 7 天 / 近 30 天；身份：全部/客户/管理员/游客；客户端：全部/浏览器/爬虫/接口调用。
- 顶部显示请求数、访客数（按日去重）、5xx；筛选变化会重置节点下钻。
- 访问流向：由 `/flow` 的联合切片构建四级桑基（来源→客户端→页面→身份），每级取 TopN，其余并入「其他」，节点总量守恒；点击节点下钻，可清除。
- 客户端排行、状态码排行来自 `/clients`、`/status`；地域来自 `/geography`。后端地域库随服务端二进制内置，库内中国 IP 返回中文名、境外 IP 返回英文名，`countryNames.ts` 同时处理两种写法并映射到世界地图要素名（港澳台归入 China）。
- 加载中显示骨架占位，无数据显示「当前时间范围暂无访问数据」，接口失败显示错误信息与重试按钮；不再使用任何模拟数据。
- 后端返回的 `collection.geo.loaded` 为 false 时（内嵌库与覆盖文件都不可用），面板提示地域显示为未知。

## 4. 验证

- `npx tsc -b`、`npm run build`、`node scripts/check-release.mjs` 通过。
- 未新增依赖；Kumo 组件沿用现有版本。
- 与后端联调的验收记录见 `D:/ddoidc/deploy-notes/访问分析采集接入-发布记录-20261109.md`。
