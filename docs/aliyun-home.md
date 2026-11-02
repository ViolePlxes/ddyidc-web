# 官网首页主体：阿里云公开样式参考

## 范围与唯一实现

用户于2026-11-02要求全量参考https://www.aliyun.com/首页主体，内容使用本站业务。公开营销页按此明确请求使用专属样式例外；不改变Console/Admin/Sales的Kumo规范。原有共享头部（蓝灰SVG Logo、CF/Kumo分类浮层、阿里云内联搜索与磨砂滚动效果）和腾讯式共享底栏保持复用。

- PortalHomeContent.tsx只是入口封装，调用aliyun-home/AliyunHomeBody.tsx。
- aliyun-home/data.ts：产品分类、方案、活动的本站文案数据。
- aliyun-home/CloudVisual.tsx：原创可缩放SVG插画，不嵌入阿里云商标、商业宣传、字体或图片资源。
- aliyun-home/aliyun-home.css：仅.ali-home命名空间的布局和视觉，不覆盖其他应用。
- PortalLayout与PublicPortalApp两个真实首页入口使用同一PortalHomeContent；独立公开站也装配既有SiteHeader/SiteFooter，避免预览与部署入口不一致。

## 参考清单

公开CSS保存于deploy-notes/aliyun-home-reference-20261102/：

| 原站模块 | 版本 | 使用的结构/参数 |
|---|---|---|
| homepage-banner |0.1.11|520px首屏、52/72px标题、52px按钮、300ms淡入/位移|
| homepage-ai-exp-card |0.1.3|首屏下方产品与体验入口|
| double-columns-scroll-screen |0.1.0|左侧sticky图文与右侧顺序内容|
| homepage-products |0.1.2|215px侧栏、36px间隔、52px分类、12px玻璃内边距/24px框、三列重点产品|
| homepage-ai-solution |0.1.4|方案折叠与配图联动、300ms展开|
| homepage-infrastructure |0.1.4|基础设施区块结构|
| homepage-earth |0.1.10|球面视觉与玻璃层次，使用本站原创CSS球体替代阿里云地理数据/WebGL资产|
| homepage-theme |0.1.3|#1366EC、#191C21、#6C717A、#F7F9FC与24px栅格、80px桌面/16px手机页边距|

## 内容及交互

9个主体区块：首屏3项轮播、产品体验、云端工作空间、产品目录、解决方案、权益活动、业务场景、基础设施、开始使用。首屏下另有4个快捷产品入口。6类产品可切换，4种方案/4种场景可切换，6个活动入口。轮播支持手动选择、7秒自动切换、鼠标/键盘交互暂停与独立暂停按钮；7秒属于本站轮播配置，不声称为原站全部JS时序的精确复制。产品/场景Tab支持方向键与Home/End。方案使用300ms grid展开；滚动显现使用IntersectionObserver；减少动态效果取消动画。

公开站的内容只为业务介绍，不新增真实报价、供应商请求、支付、采购、账户变更、开关或数据库依赖。不编造上云客户、地域数量、认证或平台承诺。链接接现有产品与控制台路径。正文页面不调用业务写接口。

## 验证与交付

VM预览home-shared-preview.html加载实际PortalLayout；home-public-preview.html加载实际PublicPortalApp。浏览器脚本deploy-notes/aliyun-full-home-smoke-20261102.cjs，日志aliyun-full-home-browser-20261102.log；构建日志VM integrated-20261101/aliyun-full-home-build-20261102.log。截图同前缀desktop/hero/mobile-20261102.png。以最后一次验证结果为准。

前端基线370280a6aba6e0c6ac4f29638f60e19bc5da9328（v0.1.203），后端基线a5907f14daf0dcfe8f5e5dc974aaa9e95815b4d4（v0.1.168）。当前本地候选，无本次后端改动，未推送、无新tag、未部署生产。

## 2026-11-02 实时官网结构复核

以 www.aliyun.com 实时渲染DOM和公开模块CSS为参考，不以最初概念稿作为像素基准。桌面主容器采用 `calc(100vw - 160px)`，1056px为断点；主标题44px/66px/600，首屏52px/72px/600。主色#1366EC，辅色#5C99FF/#856EFA/#98D4FF，正文#191C21，次要文案#6C717A，背景#F7F9FC/#FFFFFF。

主体调整为10区块：首屏、六项服务与左侧sticky介绍、1+6平台卡片、1+2功能卡片、产品分类、方案、非等宽活动卡片、场景、基础设施、行动入口。共享SiteHeader/SiteFooter仍复用，保持用户已确认的CF/Kumo菜单浮层；没有新增API、数据表或业务写请求。

验证：aliyun-full-home-browser-20261102.log的两入口、分类/方案/轮播/键盘操作、5种视口与减少动态效果通过。当前仍为本地视觉迭代；原站活动通栏、宣传视频/插画、客户案例/标识和页脚结构尚有差异，不宣称全量像素一致。保留本站真实业务内容，不复制第三方客户/认证/价格承诺。未提交、未推送、未操作生产。

## 2026-11-02 首屏单独精确重做

用户将本轮范围限定为截图首屏及四入口。新增 `aliyun-home/AliyunHero.tsx` 与 `aliyun-hero.css`，两个官网入口继续通过唯一 PortalHomeContent 复用，不复制头尾。其余主体模块不改。

复核阿里云公开banner 0.1.11：总高652px，视频1920×520居中，容器宽min(1920px,100vw)-160px；标题距顶部136px、52/72/600，正文224px、640px宽、16/26，按钮308px、272×52及160×52；入口416px、32px图标、20px标题间隔、18/28/600、描述14/24/#999，分割线#E8E8E8。浮层渐变从316px开始覆盖，标题主色#191C21、渐变#5C99FF/#1366EC/#856EFA。鼠标跟随光晕与300ms过渡，视频循环、静音、行内播放及减少动态效果暂停。

参考素材本地保存hero-reference.mp4、hero-reference-poster.png、hero-primary.png，无运行时第三方请求。来源为用户指定Aliyun页面公开媒体：cloud.video.taobao.com/vod/pPXMxWqJcSHYctxMVaN9a1Oy6Z0K0na-fllvMuFRr4Y.mp4；img.alicdn.com对应3840×1040海报及544×104按钮背景。仅本地视觉候选；未作素材授权/生产发布确认。本站品牌、真实业务文案与入口保留；四个业务图标使用现有Phosphor组件，不复制第三方AI产品标识。

没有新API/权限/数据库/任务或支付行为。基线commit与版本标签不变，未推送/未安装。验证脚本deploy-notes/aliyun-hero-smoke-20261102.cjs，记录aliyun-hero-browser-20261102.log，VM构建aliyun-hero-build-20261102.log。

## 2026-11-02 Unslop 第一版 A（轻优化，本地）

用户要求两种效果逐版展示。当前仅第一版，第二版完整Unslop尚未实施。采用Damir Sokolovsky的Unslop审查流程，CC BY 4.0，来源 https://github.com/heydamir/unslop ，样式文件保留署名。

方向五行：产品=供客户选购和管理云资源；性格=稳重、清晰、直接；场景=计算资源与控制台；视觉重点=已确认的阿里云首屏和真实产品入口；识别细节=共享DDOIDC云标及统一跳转箭头。

审查发现：重复泛化标题、正文过浅、模块容器1440/1760宽度不一致、活动区标题下180px空隙、部分商品描述单行截断、按钮基线不同。第一版保留已确认的首屏视频/渐变/光晕/模块圆角/功能和顺序。按间距→颜色→图标→文案→字体→布局→细节→视觉→动态逐层核对：统一主容器、80px模块间距和64px标题间距；正文三级色；Phosphor图标尺寸一致；标题说明改为资源选购/订单/账户等具体功能；40/56模块标题；移除不必要固定最小高度；商品按钮底部对齐、描述允许两行；弱化活动卡装饰但保留现有插画；动画保持已确认效果及减少动态支持。

代码：aliyun-home/AliyunHomeBody.tsx、AliyunHero.tsx、aliyun-home-polish.css；原版四个源文件备份deploy-notes/unslop-A-before-20261102。样式作用域.ali-home-polished，不影响Console/Admin或拼团宣传页。没有API/权限/数据表/资金/上游操作改动。未提交/推送/上线，版本基线不变。

## 2026-11-02 Unslop 第二版 B（完整视觉，本地）

用户要求两版逐一展示，现进入第二版。采用Damir Sokolovsky / https://github.com/heydamir/unslop ，CC BY 4.0，源码署名保留。第一版通过home-unslop-a-preview.html独立展示，复用同一AliyunHomeBody的design=polish；第二版design=unslop，由两个实际首页入口默认展示，无头尾复制。

方向：产品=云资源选购与统一管理；性格=稳重、直接、可核对；场景=资源控制台；视觉重点=资源工作台界面示意，替代第三方促销视频；识别细节=DDOIDC云标与统一资源行。没有生成图片、无付费视觉工具。示意资源不查询/冒充真实客户数据，标注“界面示意”。

九层修改：间距统一80/48与4px网格；颜色#18212F/#626D7C、#F5F7FA/#FFF、蓝色#1762C4；图标使用Phosphor中性线框；文案延续A版具体业务；正文14/24、标题36/48、首屏60px；保留10个模块及顺序；边框#E1E6EC、圆角8/12/16；移除重复云插画、地球、装饰光晕和渐变，资源示意保留；取消循环和滚动入场、布局动画，仅保留轻量颜色反馈及共享导航既有行为。

代码：aliyun-home/AliyunHomeBody.tsx（design参数），ResourcePreview.tsx，aliyun-home-unslop.css。作用域ali-home-unslopped；头尾通过body:has作用域仅对B调整，不影响A、Console、Admin或拼团页。A源码备份deploy-notes/unslop-A-final-20261102，A/B共享数据和交互实现，不复制业务逻辑。

没有API/表/权限/任务/业务写操作。当前未提交/推送/生产安装，基线SHA和版本标签不变。测试脚本unslop-B-smoke-20261102.cjs、日志unslop-B-browser-20261102.log，VM构建unslop-B-build-20261102.log；本地效果待用户选择。

## 2026-11-02 六项服务模块按阿里云公开源结构对齐

用户选回A后指定该模块颜色/对齐/渐变/动态源级复现。新增AliyunServiceSection.tsx与aliyun-service-section.css，仅design=polish替代原cloud-workspace；B保留原实现。两个真实首页入口与A独立预览仍复用同一模块。

读取公开模块double-columns-scroll-screen 0.1.0、homepage-ai-exp-card 0.1.3和link-box 0.1.7 CSS/JS；原文件保存deploy-notes/aliyun-home-reference-20261102。复现双层grid-area 1/1：背景层sticky top0、高min(100vh,100%)，原背景图100%100%拉伸；前景左右等宽、内容间距72px、上下80px。主标题44/64/600，CTA44px，主预览距按钮56px且16:9；右图256×144、左间距40、圆角12；行24px内边距、边线#DADEE5、图标28、标题18/28/600、标签12/20、描述14/24/#6C717A。标签渐变72deg：#856EFA/#1366EC/#0087F5各10%透明度。

原背景为静态位图随sticky固定，不虚构持续变色。视频按原机制：鼠标进入整行从0开始并loop；离开loop关闭、opacity300ms淡出后暂停归零。增补键盘focus及prefers-reduced-motion，移动端不自动播放。没有第三方脚本运行，仅按公开逻辑用本站React重写。

本地参考媒体共7段视频、7张封面及背景，清单deploy-notes/aliyun-exp-assets-20261102.json；运行时无第三方请求。媒体含参考站产品内容，仅本地视觉对照；主标题/行文案/跳转保留本站业务，不宣称提供AI模型功能。未推送，发布前按最终内容选择确认参考素材。

无API/权限/数据表/资金/机器操作变更。验证脚本aliyun-service-smoke-20261102.cjs、日志aliyun-service-browser-20261102.log、VM构建aliyun-service-build-20261102.log。基线SHA和tag未变化，未提交/推送/生产安装。

## 2026-11-02 控制台平台模块对齐阿里云公开源码（本地）

按用户要求仅替换design=polish的cloud-platform区块，标题保留“实例、订单与账户，一个控制台”，共享头尾及前一六项服务模块不改。新组件AliyunPlatformSection.tsx和aliyun-platform-section.css，B分支仍保留原平台实现。

参考公开Adc2025Box 0.1.6、Grid 0.1.2、LinkBox 0.1.7，读取最终入场后几何，避免把translateY(48px)初始位置当成真实间距。原版背景保存platform-background.png/mobile.png，主卡海报platform-poster.jpg/video platform-preview.mp4，来源清单deploy-notes/aliyun-platform-assets-20261102.json；仅本地视觉参考，不运行第三方JS。文案和跳转仍为本站，不宣称提供原站AI模型。

布局：section上下80px；居中44/66/600标题、下56px；主容器min(1920px,100vw)-160px，1:2双列，582px高；左卡padding24，主标题26/40/600、4项14/24说明、CTA44px；右2列×3行194px，cell8px，卡内16px、圆角16，图标40、标题18/28、标签12/20，描述14/24两行。白色主容器阴影0 8px 24px -4px rgba(0,0,0,.06)和0 16px 56px -12px rgba(19,102,236,.15)，分割线#E0E0E0；描述#6C717A。

动态：卡片253deg紫蓝各5%透明渐变，hover/focus opacity300ms；标签78deg紫蓝渐变各10%；主视频悬停从0开始循环，离开暂停、300ms淡出并归零；标题每字40ms错峰、300ms linear、blur20→0淡入，面板300ms linear translateY48→0；只首次进入视口播放入场。补齐键盘focus和减少动态效果处理。移动端1056断点下纵向排列、标题26px、40px区块留白、卡片取消圆角改分割线。

无新增API/表/权限/任务；不触发付款/上游/机器操作。未提交/推送/生产安装，版本SHA/tag不变。证据脚本aliyun-platform-smoke-20261102.cjs、浏览器日志aliyun-platform-browser-20261102.log、VM构建aliyun-platform-build-20261102.log、截图aliyun-platform-wide-20261102.png。

## 2026-11-03 发布整合

按用户要求，industryReferences 与 resourceCTA 两个可见性开关暂为 false；场景参考和底部选择云资源不挂载，不留空占位。保留实现以便后续启用。发布整合 README 交接包的后台单实例同步与 ownershipVersion 类型，不包含尚未验收的拼团后台/支付业务更改。共享头尾仅复用在两种官网首页入口；控制台后台样式保持。

媒体为静态展示资源。MP4 产物只放行 assets 下固定营销名称+Vite八字符哈希，前端产物策略和后端更新器均有拒绝任意视频的测试。需先安装配套后端再更新前端，不需新增表/数据库迁移。生产由用户手动安装。


## 2026-11-03 自有静态SVG替换（本地，未推送）

按用户最新要求，移除官网首页全部阿里云视频、相关视频海报和播放/悬停播放逻辑。Hero改owned-hero.svg静态云计算资源拓扑，标题“多多云计算，按需选配”。六项服务、控制台平台与五项方案预览统一使用owned-cloud/order/security/edge/domain/support/console.svg；capability大卡改owned-capability.svg，无外部品牌UI截图和假播放入口。全部为自绘path/shape/text SVG，无嵌入位图、外部链接或脚本。SVG内中文为功能示意，并非真实账户资源数据。保留原有布局、渐变、标题入场与分类切换；保留先前隐藏的行业参考和底部资源CTA。

源路径：src/apps/portal/components/aliyun-home；基于最新main f90b1bc2bd6e38e7163c6f3cae869506aa28b2c4，新本地分支feature/owned-home-visuals-20261103。后端完全不变。仅本地预览，不提交/推送/上线，后端v0.1.169与前端v0.1.204远端标签不改。

验证：VM npm run build（含TypeScript）通过39.20s；浏览器证据owned-home-browser-20261103.log，截图owned-home-hero-20261103.png与owned-home-solutions-20261103.png。后续最终资源路径复验见同名日志。

## v0.1.205 发布范围

首页原视频及关联海报/播放控件改为自绘静态SVG，首屏标题改为“多多云计算”；产品分类区取消固定最小高度和空白网格行，按各分类实际内容收缩。之前隐藏的行业参考和底部资源CTA继续隐藏。共享头尾、业务接口和后端保持不变。无数据库迁移。基于最新main f90b1bc2bd6e38e7163c6f3cae869506aa28b2c4，测试证据owned-home-browser-20261103.log、natural-products-browser-20261103.log。生产由用户手动更新。
