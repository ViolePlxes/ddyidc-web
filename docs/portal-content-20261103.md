# 官网页面与后台内容联动：全量本地验收（2026-11-03）

本轮按全量任务书连续实现批次1–6；未提交、未推送、无新tag、未改生产。官网使用已确认的阿里云风格营销组件，后台编辑继续Kumo。企业真实资料、联系方式、证书和正式政策须管理员核实后填写发布；当前演示仅存隔离VM，不虚构真实资质或客户案例。

## 实现与入口

前端 D:/ddoidc/work/release-web-20261103；后端 D:/ddoidc/work/release-server-20261103，feature/public-content-pages-20261103。前端基线 v0.1.206 / 287a01257dadd2c1e14b3de0814ad0ce6b90c0b8；后端基线 v0.1.169 / 03828d7fead1eb6320e27f2e6e0341fba7c86396。本轮无新commit SHA。

本地前台 http://127.0.0.1:13101/public-content-preview.html?page=/company
本地编辑 http://127.0.0.1:13101/public-content-preview.html?page=/demo-editor
同入口可查看 /、/about、/contact、/company-environment、/honors、/licenses、/service-guarantees、/solutions、/referral、/agency、/sponsors、/panel、/campaigns、/news、/help、/cloud、/cdn、/domain、/security、/recruit、/icp、/aup、/products、商品介绍及协议。新闻帮助含分类、搜索、分页、文章目录和关联；招聘筛选、FAQ、步骤、轮播、联系与图库均可编辑。共享头尾只有一份实现。

后台页面管理增加搜索/状态/类型筛选、缺页隐藏草稿初始化；产品介绍只配置营销内容/SEO，不覆盖价格/库存/销售状态。隐藏介绍从公开目录移除，直达提示下线，控制台业务商品不改变。菜单支持三级内容、说明、逐项显隐及上下排序；公开投影、生成文档、搜索同源。首页8原版模块可编辑文字、图片、链接、顺序、显隐；默认DOM与几何不变，两个已隐藏区块继续不挂载。协议独立页和Kumo弹窗共用发布正文及排序，草稿预览不改外层页面标题或公开缓存。

源码：shared/api/publicContent.ts、shared/utils/{publicPages,publicPageLayouts,homeContent}.ts、apps/portal/components/{PublishedContent,PublicCatalog,MarketingProducts,HomeContent}.tsx、marketing-content.css；后台PortalPageCatalog/PortalModules/PortalProductContent/PortalPolicyContent/PortalDraftPreview/PortalLinks；后端internal/portal/{public_content,model,service,http}.go。

## 参考证据与视觉边界

已读取19类阿里云公开HTML/CSS：deploy-notes/aliyun-page-source-20261103/index.json、*-layout-rules.txt；路由与来源矩阵在publicPageLayouts.pageReferences。复用对应公开布局参数与交互结构，内容及SVG使用本站版本。不声称取得第三方私有源码，也不把缺企业材料的演示页说成真实官网文案。

生成文档加载同一PublicPortalApp渐进增强，实际/company、/products、/help/local-1、/入口均验证现代营销组件；保留可索引静态正文。关闭JS/公开API不可用时为可读语义降级页，导航会展开、交互会降级，与JS版本不逐像素相同。没有删掉静态SEO能力。初始HTML与JS增强有阶段差异，此项作为架构边界保留。

## 验证

- VM npm ci已执行；最后23项相关Node回归通过；tsc与生产构建通过。历史第一批68项回归作为历史记录，不与本次计数叠加。
- 后端go build ./...、go vet ./...、go test ./...通过；最后菜单/商品投影修复再次运行portal测试及build/vet通过。测试默认不连接业务数据库。
- 12类页面真实隔离CMS闭环：保存草稿、预览、发布、隐藏、并发冲突、回滚通过；未授权403，保留路径/危险URL被拒绝，失败不改变已发布版本。
- 浏览器42个发布演示页、2560/1440/768/390宽度无横向溢出/页面异常；新闻分页搜索、文章目录/FAQ、招聘筛选、协议同源、产品编辑、媒体库、真实生成路由增强通过。
- 首页初始化与空CMS配置的文字/图片/链接/模块高度/DOM相同；自定义标题/按钮、顺序及隐藏生效；303条入口核查通过。API失败有可重试状态。
- 最后定向回归：商品介绍下线从目录移除，直达明确下线；后台搜索/菜单排序/显隐只修改草稿；预览不改文档标题；实际生成入口加载正确React模块；无JS可读正文通过。
- 媒体真实隔离PNG上传/读取通过；SVG脚本、伪造图片拒绝。显式隐藏菜单不进入公开API和生成HTML，回滚恢复旧菜单。

证据：cms-full-browser-20261103.cjs.log、cms-home-contract-browser-20261103.cjs.log、cms-final-focused-browser-20261103.cjs.log、cms-full-http-20261103.py.log、cms-nav-http-20261103.py.log、cms-full-media-20261103.py.log、cms-tests-final.log、cms-build-final.log、cms-go-final.log、cms-public-links.json；最终截图cms-final-company.png/cms-final-company-mobile.png。

隔离演示复用真实CMS服务路由工厂与后台组件，独立无网络MySQL/socket和回环18092；合成商品只读、不能付款或采购。测试服务为_test显式env启动，并非正式后台鉴权替代。正式JWT/超级管理员/CSRF继续原规则；本轮未进行生产管理员浏览器登录验收。浏览器写请求仅本地CMS预览；集成测试写入仅隔离CMS版本、媒体和合成商品。

## 部署与资料

无新增生产表或DDL迁移。Page.layout、Link.description/enabled可选、兼容原schemaVersion=1；后台应先更新，再更新前端，保证新字段通过严格解码。新增GET /api/v1/portal/content及Nginx GET-only白名单；旧公开site/pages同投影，不暴露草稿。菜单/正文/页脚/分类缓存同发布版本。

尚未安装生产、未请求用户批准生产。本次不触发真实付款、余额入账、扣款、采购、开通、续费、机器操作或外部消息。正式企业资料的填写发布属于内容准备，不应以演示资料自动替代。

地图已更新：官网公共内容读层与页面路由、官网首页内容参数化、阿里云参考页面布局与官网模板、官网页面联动开发进度、任务书/视觉规范及门户/后台/SK/共享头尾所属节点；索引同步，最终校验另见系统开发地图校验结果。


最终截图补充：修正共享页脚分组包裹导致链接失去block样式，保持直属DOM并适配1–4列；版权按完整配置显示、深色横幅次按钮对比度修复。定向浏览器增加页脚逐行样式及版权不重复断言。

手机视觉回归补充：信息卡操作入口不再被首页小屏辅助链接规则隐藏，覆盖仅限marketing-content-items；页脚地区图标采用共享图标库矢量，避免缺字。
