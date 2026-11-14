# 订购产品页底部结算栏（v0.1.293）

## 范围

客户控制台「订购产品」页 `/console/products`。商品详情页 `/console/products/:id`、下单确认页、支付页与后台商品管理不在本次范围；详情页只复用同一个共享底栏组件（`variant="sticky"`），交互不变。

## 布局约定：底栏固定，不悬浮

- 页面占满 `[data-dashboard-scroll]` 内容面板（`usePaneFillHeight` 实测高度，扣掉平台页脚与页面内边距），整页不再产生外层滚动。
- 页面内部为「内容滚动区 + 底栏」两行：内容区 `flex-1 min-h-0 overflow-y-auto`（`data-order-scroll`），底栏是文档流里的真实底行（`variant="inline"`），紧贴内容区与平台页脚，中间没有缝隙。
- 因此滚动只发生在内容区，**没有任何内容从底栏下方穿过**；底栏不吸顶、不悬浮、不遮盖内容。桌面展开明细时底栏变高，内容区同步变矮并重新计算行数。
- 单列内容与底栏内容列同用 `max-w-7xl`；底栏底色通栏、内容列居中，和页面内容左边缘对齐（实测 `alignGap = 0`）。
- 顶部订购步骤用 Kumo `Breadcrumbs`（`size="sm"`、`Breadcrumbs.Clipboard`），吸附在内容滚动区顶部；窄屏保留完整步骤并横向滚动，不折叠为下拉。Kumo 默认在 `sm` 以下折叠、`Clipboard` 只有英文 `title` 且无复制结果回调，已在包装组件里覆盖并接管中文 Toast / 手动复制降级。
- 步骤跳转与行数测量都让出吸附条高度（`orderStepsOffset()`）；行数按内容滚动区高度实测，预留分页与安全值（`useFillingPageSize` + `fillingRowCount`，3–50 行），保留页码分页。
- 明细：`≥1280` 为底栏上方展开面板（内部滚动，最高 45vh，展开时占据布局空间）；`<1280` 为 `LayerDialog` 抽屉；两者复用同一份 `bill` portal。`查看明细` 可再次点击收起（`aria-expanded`，文案切换为「收起明细」）。

## 复制摘要

`Breadcrumbs.Clipboard` 复制内容含商品、规格、配置、周期、数量、当前应付（含折合月）与生成时间，末尾固定「金额为页面实时报价，以提交时校验结果为准。」。金额与底部栏同一来源（`total` / `monthlyEquivalent`），缺项整行省略；成功后用 Kumo `Toast` 提示，剪贴板不可用时选中文本并提示手动复制。

## 复用与边界

- 复用：`useProducts` / `useProduct` / `useOrderPage`、`ProductConfig` 的报价/周期/数量/密码/认证/购物车/`draft()`、`saveOrderDraft`、`catalogStock`、`isCatalogAvailable`、`cycleLabels`、`scrollToProductStep`、Kumo `Breadcrumbs` / `LayerDialog` / `Toast` / `Pagination`。
- 未改：报价与下单接口、认证门禁、购物车、订单草稿、后端、数据库；未新增第三方依赖。
- 按钮口径沿用 `ProductConfig` 原有 `purchaseDisabled` 与 `barBlockedReason`；未选规格时底栏显示占位并禁用按钮。

## 验证（本地）

- `npx tsc -b`、`npm run build`、`node scripts/check-release.mjs` 与 `--artifact` 通过；`tests/fillingPageSize.test.mjs` 已纳入 CI。
- 本地 mock API + 真实 Chromium（Edge headless）在 360×800、390×844、768×1024、1280×900、1600×1000 实测：内容面板外层滚动 `0`，内容区内部滚动，底栏底边紧贴平台页脚（间隙 `0`），底栏顶边紧贴内容区（间隙 `0`），左边缘对齐 `0`；1280/1600 行数 6/8，底栏 65/80px；页面与内容区横向溢出均为 0（改造前 1280/1600 面板横向溢出 715/395px）。
- 交互：步骤跳转与吸附、分页翻页、明细展开/收起（内容区变矮、行数 6→3、无遮挡）、复制摘要（含金额与 Toast）、报价联动、密码不合规禁用与原因、分类切换、空分类、移动端抽屉均通过；1024/853 缩放代理无横向溢出，触控目标 44px。
- mock 数据仅用于本地验收，不进入源码、构建产物或生产配置；生产安装由管理员在后台执行后按测试矩阵复核。
