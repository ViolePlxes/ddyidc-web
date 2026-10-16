# 用户产品列表双视图

版本候选 v0.1.157，后端无需更新。

PC 首次进入（宽度至少768px）默认表格，手机默认 Resource List 卡片。工具栏采用 Kumo Filter Toolbar with Small Tabs，表格无条纹背景；提供表格/卡片两端切换。视图不参与查询键，原有搜索、状态筛选、分页和金额/操作行为保留。

卡片间隔背景透明，Surface 保持官方样式；悬停轻微上移，遵守 reduced-motion。整卡空白区域通过 Kumo Link 进入既有详情路径，IP复制、备注输入和按钮保持独立操作。

代码 src/apps/console/views/Instances.tsx；沿用 GET /user/instances 和原备注接口。无后端、数据表、配置或权限变更。

VM npm ci、tsc、build通过；真实 Chromium 1600/390px默认视图、切换、搜索保留、透明背景、悬停、复制和详情导航已验证。模拟预览仅VM根目录存在，不提交、不进入生产构建。生产发布证据见本地部署报告和开发地图。

## 生产路由复核修正 v0.1.158
生产公开复核发现旧 /user/instance/*.htm 由门户入口接管。产品标题、管理和整卡链接统一改用现有正式 /console/instances/:id 路由，不修改详情组件、API或数据；匿名访问应跳转登录并保留详情redirect。
