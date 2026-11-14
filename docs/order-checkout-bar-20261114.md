# 订购产品页底部结算栏（v0.1.291）

## 范围

客户控制台「订购产品」页 `/console/products`。商品详情页 `/console/products/:id`、下单确认页、支付页与后台商品管理不在本次范围；详情页仅把共享底栏组件的引用改名，交互不变。

## 布局约定

- 单列内容：`mx-auto w-full max-w-7xl`，与底部结算栏内容列同宽、左边缘对齐；`<1280` 铺满并保留 16/24px 内边距。
- 顶部订购步骤用 Kumo `Breadcrumbs`（`size="sm"`）实现，吸附在 `[data-dashboard-scroll]` 顶部，窄屏自身横向滚动、当前步骤自动滚入视野；当前步骤为 `Breadcrumbs.Current`，其余步骤为可点击的 `Breadcrumbs.Link`，点击只滚动面板并用 `orderStepsOffset()` 让出吸附高度。
- 步骤数据仍来自 `ProductConfig` 的 `steps` 数组，不另建一份；旧 `ProductSteps` 的 `list` / `chips` 用法已从订购页移除（组件保留给其它页面）。
- 底部结算栏 `sticky bottom-0`，收起态 64–72px（桌面单行；`<1280` 金额块 + 按钮一行、摘要一行），`padding-bottom` 叠加 `env(safe-area-inset-bottom)`；因底栏在文档流末尾，滚到页面末端时不再覆盖内容。
- 明细：`≥1280` 为栏上方展开面板（内部滚动，最高 45vh），`<1280` 为 `LayerDialog` 抽屉；两者复用同一份 `bill` portal，金额、数量、优惠、安装费、下次续费不在组件里重算。
- `查看明细` 可再次点击收起（`aria-expanded`，文案切换为「收起明细」）；展开时面板若覆盖计算规格，面板按需把规格区滚回面板上方。

## 行数自适应

- `src/shared/hooks/useFillingPageSize.ts` 从 `DestroyRequests.tsx` 抽出，销毁页与订购页共用；行数按内容坐标测量（`rect + scrollTop`），滚动不改变行数，`ResizeObserver` 监听面板、宿主、分页与底栏。
- 订购页把分页条 `[data-catalog-pagination]` 与底栏 `[data-checkout-bar]` 计入预留高度；桌面用 `thead` / `tbody tr` 实测，平板与手机用 `[data-fill-row]` 卡片实测，3–50 行夹取。
- 保留 `Pagination` 页码分页；分类切换、行数变化时回到第 1 页，已选规格在翻页后仍保持配置与金额。

## 复制摘要

`Breadcrumbs.Clipboard` 复制内容含商品、规格、配置、周期、数量、当前应付（含折合月）与生成时间，末尾固定「金额为页面实时报价，以提交时校验结果为准。」。金额与底部栏同一来源（`total` / `monthlyEquivalent`），缺项整行省略；成功后用 Kumo `Toast` 提示，剪贴板不可用时选中文本并提示手动复制。Kumo 组件只提供英文 `title`，这里在挂载后补中文 `aria-label` / `title`。

## 复用与边界

- 复用：`useProducts` / `useProduct` / `useOrderPage`、`ProductConfig` 的报价/周期/数量/密码/认证/购物车/`draft()`、`saveOrderDraft`、`catalogStock`、`isCatalogAvailable`、`cycleLabels`、`scrollToProductStep`、Kumo `Breadcrumbs` / `LayerDialog` / `Toast` / `Pagination`。
- 未改：报价与下单接口、认证门禁、购物车、订单草稿、后端、数据库；未新增第三方依赖。
- 按钮口径沿用 `ProductConfig` 原有 `purchaseDisabled` 与 `barBlockedReason`；未选规格时底栏显示占位并禁用按钮。

## 验证（本地）

- `npx tsc -b`、`npm run build`、`node scripts/check-release.mjs` 与 `--artifact` 通过；新增 `tests/fillingPageSize.test.mjs` 已纳入 CI。
- 本地 mock API + 真实 Chromium（Edge headless）在 360×800、390×844、768×1024、1280×900、1600×1000 实测：整页与内容面板横向溢出均为 0（改造前 1280/1600 面板横向溢出 715/395px），行数 1280 为 7、1600 为 9，底栏 65/80px，分页、步骤跳转、明细展开/收起、复制 Toast、禁用原因与分类切换均通过。
- mock 数据仅用于本地验收，不进入源码、构建产物或生产配置；未执行生产安装，生产验收由管理员在后台更新后按测试矩阵复核。
