# 全端 Kumo UI 外观核对（2026-10-15）

状态：本地 feature 分支 `feat/kumo-ui-audit-20261015`，未提交、未推送、未部署。基线前端 v0.1.152 / 581703f9c736f058bf2104ea660fb060eab694b2；后端维持 v0.1.123 / b5028d6718238f83dec1f038662e8df7b863c384。

## 依赖与官方来源

现有依赖 @cloudflare/kumo 2.13.2，CLI 已随依赖可用，未重装/升级 Kumo，package.json 与锁文件不变。核对 https://kumo-ui.com/cli/ 与 https://kumo-ui.com/skill/。原先未安装 kumo-design；按用户指定 npx skills add cloudflare/kumo@kumo-design --agent codex --yes 在 VM 尝试，VM 无法直连 GitHub，后改用 Codex 官方技能安装器从 cloudflare/kumo 的 skills/kumo-design 安装到宿主 ~/.codex/skills/kumo-design。已阅读并应用；安装日志仅本地保存。

## 外观规则及改动

- 全端作者编写的正文、说明、数据使用 Kumo text-base（该版本为 14px），标题保留标题字号；移除偏小作者文字、非标题大号数据和 tracking。strong 使用 font-medium，标题 font-semibold。Kumo 自带紧凑按钮、标签、日历、分页内部字号保留原生定义，不用全局 CSS 压盖组件内部样式。
- 不改 Kumo 颜色、圆角或阴影；移除应用卡片 shadow-none/background/ring 等外观覆盖，继续使用 LayerCard/Secondary/Primary；空态直接用 Empty，避免在父卡片内叠加另一张卡片。间距保留布局职责。
- DashboardLayout 账户菜单改用 Button；侧栏与骨架屏移除私有配色覆盖。前台、控制台、后台及销售端共享规则。
- 用户余额流水、后台客户流水和用户产品列表改用原生 Kumo Table 组合，保留数据表达式、筛选/预取/排序/分页、备注回调；表格仅在自身窄屏容器横滚。
- 各应用徽标复用 Badge，使用受支持 dot 变体；工单旧颜色值只作输入映射到 success/warning/error/neutral，不修改状态码、配置值或后端数据。
- 9 个条件表单/确认弹窗用 DialogPresence 保留关闭阶段，Dialog.Root 仍委托官方组件。通过原生 onOpenChangeComplete 释放表单，重新打开生成新 UI key，延续旧重置行为；原忙碌门禁与提交函数保留，嵌套弹窗不被外层 visibility 强制打开。
- Pagination.tsx 只组合官方 Info/Controls 与中文 labels，原 page/setPage/perPage/totalCount/controls 及调用方自定义内容原样传递。上传附件使用 Kumo Input，保持隐藏 file 输入及原事件。
- 现有 Slider 是带许可证的官方源码副本；当前安装版本没有导出 Slider，保持该副本及交互逻辑不变。

## 范围保护

没有修改后端、shared/api、shared/hooks、shared/stores、shared/vendor、接口、路由表、功能开关、依赖或业务数据。AST 比对全部受影响既有页面的 API/查询/变更调用保持一致。事件差异仅 Navigation 删除弹窗的空值 UI 守卫及共享 Dialog 的完成动画回调；没有更改交易、退款、金额、提交内容或权限。预览数据通过独立 Axios adapter 仅返回前端样例，禁止所有写操作，不与数据库交互。

## 验证

- 全量源码审查：基线 191 个 TSX，新增分页组合后 192 个；受影响源码文件清单见下。
- VM npx tsc -b、npm run build、scripts/check-release.mjs --artifact 通过；预览入口/模拟数据没有进入 dist。使用已有依赖，未重复运行组件安装。
- 174 路由桌面 1440×900 / 手机 390×844 冒烟，以及补充 3 个待办路由：无页面横向溢出、无 React pageerror、无错误边界。使用模拟认证及受控错误/未配置状态，属于视觉烟测，不能作为这些模块的功能验收。别名重定向保持原路由行为。
- 独立有数据组件预览 37 项检查：用户/后台流水、实例列表、通用组件；明暗主题，1440×1000、390×844、320×568、844×390。流水三标签不增加查询；官方分页上下页回调与中文标签、普通/条件弹窗边界、关闭释放、重新打开重置、嵌套关闭状态、文件选择/移除通过。
- 后台新增用户、销售账号、导航分类、供应商的实际页面组件在模拟只读 API 下完成打开/关闭/重新打开，未发生业务写请求。门户/登录/后台另以本地真实入口核对 14px 与桌面/手机边界。
- 保留实际模块数据、API、生产逻辑，不将视觉夹具当真实业务数据。没有生产安装或 GitHub 推送。

## 本地查看

http://127.0.0.1:13101/kumo-style-preview.html ：实际用户流水、后台流水、用户产品列表与公共组件，标明纯前端模拟，禁止写入；入口文件仅在 VM 和 deploy-notes 留存，未入前端仓库及构建产物。

证据：D:/ddoidc/deploy-notes/kumo-ui-browser-result.json、kumo-ui-route-results.json、kumo-ui-dialog-result.json、kumo-ui-semantic-proof.json、kumo-ui-scope-proof-20261015.json；截图 kumo-*-light/dark-1440/390.png；VM /tmp/kumo-ui-build-final-20261015.log。

## 源码文件清单

- `src/apps/admin/cdnsell/Settings.tsx`
- `src/apps/admin/cdnsell/index.tsx`
- `src/apps/admin/cdnsell/p2.tsx`
- `src/apps/admin/components/ServerMonitor.tsx`
- `src/apps/admin/groupbuy/Leaders.tsx`
- `src/apps/admin/groupbuy/index.tsx`
- `src/apps/admin/marketplace/index.tsx`
- `src/apps/admin/points/Coupons.tsx`
- `src/apps/admin/points/EventTasks.tsx`
- `src/apps/admin/points/LadderEditor.tsx`
- `src/apps/admin/points/index.tsx`
- `src/apps/admin/views/Backups.tsx`
- `src/apps/admin/views/BankTransferSettings.tsx`
- `src/apps/admin/views/Certifications.tsx`
- `src/apps/admin/views/CustomerDetail.tsx`
- `src/apps/admin/views/CustomerFinance.tsx`
- `src/apps/admin/views/CustomerInstance.tsx`
- `src/apps/admin/views/Customers.tsx`
- `src/apps/admin/views/GroupProducts.tsx`
- `src/apps/admin/views/Home.tsx`
- `src/apps/admin/views/Instances.tsx`
- `src/apps/admin/views/MachineRefundDialog.tsx`
- `src/apps/admin/views/Marketing.tsx`
- `src/apps/admin/views/Navigation.tsx`
- `src/apps/admin/views/NotificationTasks.tsx`
- `src/apps/admin/views/Orders.tsx`
- `src/apps/admin/views/PaymentSettings.tsx`
- `src/apps/admin/views/ProductGroups.tsx`
- `src/apps/admin/views/PromoCoupons.tsx`
- `src/apps/admin/views/SecureLogin.tsx`
- `src/apps/admin/views/SecuritySettings.tsx`
- `src/apps/admin/views/SocialLogin.tsx`
- `src/apps/admin/views/System.tsx`
- `src/apps/admin/views/Tickets.tsx`
- `src/apps/admin/views/TodoManualProductActions.tsx`
- `src/apps/admin/views/TodoRefundApplication.tsx`
- `src/apps/admin/views/TodoSettings.tsx`
- `src/apps/admin/views/Todos.tsx`
- `src/apps/admin/views/Updates.tsx`
- `src/apps/admin/views/UpstreamCatalogComparison.tsx`
- `src/apps/admin/views/UpstreamOrders.tsx`
- `src/apps/admin/views/UpstreamProducts.tsx`
- `src/apps/admin/views/UpstreamSuppliers.tsx`
- `src/apps/console/cdnsell/TrafficCalculator.tsx`
- `src/apps/console/cdnsell/index.tsx`
- `src/apps/console/cdnsell/p2.tsx`
- `src/apps/console/components/RemoteConsole.tsx`
- `src/apps/console/components/VncConsole.tsx`
- `src/apps/console/groupbuy/index.tsx`
- `src/apps/console/marketplace/index.tsx`
- `src/apps/console/points/CheckoutPoints.tsx`
- `src/apps/console/points/index.tsx`
- `src/apps/console/views/Cart.tsx`
- `src/apps/console/views/Certification.tsx`
- `src/apps/console/views/Components.tsx`
- `src/apps/console/views/Coupons.tsx`
- `src/apps/console/views/Finance.tsx`
- `src/apps/console/views/HistoricalRecords.tsx`
- `src/apps/console/views/Home.tsx`
- `src/apps/console/views/InstanceConsole.tsx`
- `src/apps/console/views/Instances.tsx`
- `src/apps/console/views/OrderConfirm.tsx`
- `src/apps/console/views/OrderDetail.tsx`
- `src/apps/console/views/Orders.tsx`
- `src/apps/console/views/PaymentResult.tsx`
- `src/apps/console/views/Products.tsx`
- `src/apps/console/views/Profile.tsx`
- `src/apps/console/views/Promo.tsx`
- `src/apps/console/views/PromoCouponOffers.tsx`
- `src/apps/console/views/PromoCouponPanel.tsx`
- `src/apps/console/views/SupportCenter.tsx`
- `src/apps/console/views/Tickets.tsx`
- `src/apps/console/views/VncConsole.tsx`
- `src/apps/console/views/WalletRecharge.tsx`
- `src/apps/console/views/instanceDetails.tsx`
- `src/apps/console/views/walletRecharge.css`
- `src/apps/portal/PublicPortalApp.tsx`
- `src/apps/portal/components/AuthPageShell.tsx`
- `src/apps/portal/components/PortalFooter.tsx`
- `src/apps/portal/components/PortalHeader.tsx`
- `src/apps/portal/components/PortalHero.tsx`
- `src/apps/portal/components/PortalShell.tsx`
- `src/apps/portal/components/TermsAgreement.tsx`
- `src/apps/portal/components/portal-home-art.css`
- `src/apps/portal/groupbuy/index.tsx`
- `src/apps/portal/marketplace/index.tsx`
- `src/apps/portal/views/Agreement.tsx`
- `src/apps/portal/views/IdentityForm.tsx`
- `src/apps/portal/views/Login.tsx`
- `src/apps/portal/views/Public.tsx`
- `src/apps/portal/views/Register.tsx`
- `src/apps/sales/views/Home.tsx`
- `src/layouts/DashboardLayout.tsx`
- `src/shared/components/AlipayCertification.tsx`
- `src/shared/components/BalanceTransactions.tsx`
- `src/shared/components/BalanceWithdrawals.tsx`
- `src/shared/components/DataTable.tsx`
- `src/shared/components/DateField.tsx`
- `src/shared/components/Dialog.tsx`
- `src/shared/components/InstanceLiveStatus.tsx`
- `src/shared/components/InstanceManagement.tsx`
- `src/shared/components/InstancePasswordInput.tsx`
- `src/shared/components/InstanceSecurityGroups.tsx`
- `src/shared/components/InstanceUpgrade.tsx`
- `src/shared/components/LoginDevices.tsx`
- `src/shared/components/MFA.tsx`
- `src/shared/components/MetricGrid.tsx`
- `src/shared/components/PageState.tsx`
- `src/shared/components/Pagination.tsx`
- `src/shared/components/PaymentDialog.tsx`
- `src/shared/components/PointsActivities.tsx`
- `src/shared/components/PointsEventTasks.tsx`
- `src/shared/components/ProductConfig.tsx`
- `src/shared/components/SocialBindings.tsx`
- `src/shared/components/StaffLogin.tsx`
- `src/shared/components/TransfersPage.tsx`
- `src/shared/components/TrendChart.tsx`
- `src/shared/components/VideoBindings.tsx`
- `src/shared/components/captcha/CaptchaSettings.tsx`
- `src/shared/components/cdnsell/AdvancedToolsPage.tsx`
- `src/shared/components/cdnsell/StatisticsPage.tsx`
- `src/shared/components/cdnsell/StatisticsPie.tsx`
- `src/shared/components/skeletons/index.tsx`
- `src/shared/components/tickets/AttachmentPicker.tsx`
- `src/shared/components/tickets/TicketConversation.tsx`
- `src/shared/components/tickets/TicketStatusBadge.tsx`
- `src/shared/router/EntryGuards.tsx`
- `src/styles/tailwind.css`


## 2026-10-15 Dialog 官方样式修正
- 来源：https://kumo-ui.com/components/dialog/，对照已安装 2.13.2 源码。
- 删除全局 top 覆盖，恢复官方手机 top-8 / 桌面 sm:top-16；删除手机按钮高度、padding 和弹窗 padding 的覆盖。保留仅防视口溢出的 max-height / overflow。
- shared Dialog 默认 p-8、Title text-2xl font-semibold、Description text-kumo-subtle；37 个调用文件的 p-6/gap-5 和旧标题尺寸统一。保留既有关闭、提交与忙碌门禁。
- 独立本地预览按官方 With actions 示例使用标题栏、secondary 方形关闭按钮、mb-4、mt-8 操作区。未改变业务接口和数据。
- 验证：VM TypeScript 通过；37 项 UI 回归、4 个实际后台弹窗与3个待办路由检查通过；8 项浅深主题×四种视口检查确认 32px padding、24px 标题、原生位置和关闭按钮，截图已人工查看。
- 证据：D:/ddoidc/deploy-notes/dialog-official-result.json、dialog-official-light-390.png；本地预览 http://127.0.0.1:13101/kumo-style-preview.html。
- 当前仍为本地未提交修改；前端基线 581703f9c736f058bf2104ea660fb060eab694b2 / v0.1.152；后端 b5028d6718238f83dec1f038662e8df7b863c384 / v0.1.123，未修改。未发布生产。

Dialog 修正后 VM npm run build 通过（24.70s），发布产物检查通过212文件；地图232节点、3299引用、0问题。


## v0.1.153 发布候选（2026-10-15 用户授权推送上线）
- 仅前端视觉与共享组件组合：四端 Kumo 字号、卡片、表格、标签、分页、文件输入及 Dialog；无后端/API/业务数据修改。
- 发布前 VM npm ci、npx tsc -b、npm run build（25.53s）、212文件产物隔离检查通过，演示页面不进入产物。官方 Dialog 8项视口/主题检查、37项UI回归、4个实际后台弹窗/3个待办路由检查及174条路由冒烟已完成；路由冒烟使用受控只读响应，不替代业务验收。
- 所有 API/查询/变更调用 AST 比对一致；事件仅导航空值保护与官方 Dialog 关闭完成回调有UI生命周期差异。
- 生产上线前基线：前端v0.1.152、后端v0.1.123，健康正常；前端静态文件及运行后端已备份并校验，根分区36%，剩余31G。走系统在线更新，后端保持不变。
- 生产验证结果及最终 SHA 记录在部署报告和系统开发地图，不能将候选状态当成已上线。
