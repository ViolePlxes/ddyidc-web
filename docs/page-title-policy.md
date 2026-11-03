

## 2026-11-03 多多云品牌与浏览器标题（本地实现，未推送）

用户最新要求覆盖此前DDYIDC/DDOIDC可见品牌命名：页面标题与对外可见品牌统一“多多云”。域名ddoidc.com仍是实际网址，环境变量、项目标识、缓存键、事件名、接口/鉴权路径保持兼容，不改客户数据或资金。

标题集中实现：src/shared/utils/pageTitle.ts + shared/components/PageTitle.tsx；createEntry和public入口共用，静态入口index/console/admin/sales.html同时更新首屏title/description。首页“多多云｜云计算产品与服务”，其他“页面名称 - 多多云”；控制台/后台复用静态路由元数据、待办分类细化名称，销售和公共页面明确映射。路由切换自动更新，参数、客户姓名、订单号、查询token不进入标题。服务端门户content-document.html同步正式标题/品牌，模板变更由既有门户资产指纹机制感知，无需改后台服务或数据库。新增入口须复用该策略，不再独立硬编码旧品牌标题。

共享头尾/导航/关于页、用户及员工登录、Dashboard品牌、MFA下载文件显示名同步多多云；身份安全机制和下载内容不变。关联 [[门户头尾与官网样式]]、[[前端开发规范]]。

验证：VM标题与原层级导航共9项回归通过；TypeScript/Vite构建31.94s通过，245项产物检查通过；后端只读参考环境TestInstalledThemeStaticDocument针对新dist渲染通过（无后端改动）。浏览器路由切换、两种官网入口、零写请求/错误通过；证据duoduoyun-title-tests-20261103.log、duoduoyun-title-regression-20261103.log、duoduoyun-title-browser-20261103.log。已打开浏览器，实际标题“多多云｜云计算产品与服务”。

前端基线ab882db80ac651cc692aab47c9b88c43bd9e0eb7(v0.1.205)，本地feature/duoduoyun-page-titles-20261103未提交；后端保持03828d7fead1eb6320e27f2e6e0341fba7c86396(v0.1.169)。未推送或安装生产。


2026-11-03 用户授权发布v0.1.206；新增page-title.test.mjs已纳入release-validation强制CI，保证四入口初始标题、动态路由名称与参数隐私持续回归。后端无变更，生产由用户手动更新。
