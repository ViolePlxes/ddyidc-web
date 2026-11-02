# 公开营销页共享顶部与底栏

用户于2026-11-01要求独立宣传页自定义视觉，且顶部/底部单独封装、其他页面可复用。当前仅 `/groupbuy` 装配，原PortalShell、Console、Admin、Sales不自动更换。

统一入口 `src/shared/components/marketing/index.ts`。禁止把组件DOM或CSS复制到业务页；修改公共外观集中维护 `marketing-shell.css`。

```tsx
import {SiteHeader, SiteFooter} from "../../shared/components/marketing";

<SiteHeader
  brand="DDOIDC"
  homeHref="/"
  tagline="页面名称"
  links={[{label: "产品", href: "/products"}]}
  action={<a href="/console">控制台</a>}
/>
{/* 页面正文；本页的吸顶导航须放在正文容器内，止于底栏之前。 */}
<SiteFooter copyrightName="ddoidc.com" />
```

## 参数

- SiteHeader：brand、homeHref、tagline、links、action。手机版包含菜单开合和选择后收起；不读取用户信息、token或权限。
- SiteFooter：id、brand、homeHref、copyrightName、columns、legalLinks、privacyAction。默认四列、每列上下分组。传入 `SiteFooterColumns` 自定义内容，`SiteLink` 使用 href 或 document（二选一）；document复用现有协议LayerDialog，不跳转新页面。
- 默认链接供本地和同域门户使用。跨域公开站点由调用方传入有正确域名的链接分组、登录/控制台action；组件不推断域名或改变会话恢复策略。
- privacyAction可注入站点实际隐私选择入口；默认打开现有隐私与数据保护文档，不自造Cookie同意管理器、不宣称替调用方关闭追踪。
- 默认入口为现有路由，真实页面仍经过原鉴权/Gate；添加页脚链接不启用任何业务功能。

## Cloudflare参考实现

读取 https://www.cloudflare.com/ 的footer实际HTML及对应Astro CSS后重建：1480px容器、桌面四列、32px列间距、40px上下分组间距、13px小标题、16px正文链接及8px上下内边距；版权行lg字号14px，移动端13px。左右竖线和版权横线为16px实线/16px间隔的浅色虚线。链接200ms颜色变化；浏览器支持时，短屏品牌按scroll timeline的entry 92%–100%水平移动56px，减少动态效果及高屏时关闭。

共享CSS仅命中marketing-*，业务页美术继续限定自身命名空间。品牌使用DDOIDC，版权使用ddoidc.com；不使用Cloudflare商标或接入它的隐私管理/账户脚本。

## 本地验证

VM TypeScript检查、1620×1029桌面与390×844手机实际Chromium验证：四列七分组、手机菜单、现有协议弹窗、文档流落底及无横向溢出。截图/日志位于宿主 `D:/ddoidc/deploy-notes/groupbuy-fix-evidence-20261101/` 的 `cf-footer-*`、`marketing-chrome-browser.log`。

当前为本地候选，未推送、无新标签，不代表正式上线或全量CI完成。

## 2026-11-01 腾讯云式页脚主题（本地）

SiteFooter增加variant="tencent"；默认Cloudflare主题保留，拼团宣传页选腾讯云式主题。共享1180px容器、100px服务入口栏、四列链接加联系区、版权区及移动端两列布局，样式只在marketing命名空间。参考用户截图及公开资源；不是腾讯云私有源码或完全相同资产。本站未提供二维码、电话和备案号，因此不伪造，联系区使用真实文档/工单入口；不承诺免费备案或退款保障。原PortalShell、Console/Admin不变。

本地证据：tencent-footer-browser.log、tencent-footer-desktop.png、tencent-footer-mobile.png；VM tsc -b通过。未推送、未部署，无真实扣款/开通。

## 2026-11-01 CF式共享头部

参考公开HTML的data-site-navigation-header：桌面72px高、最大1480px、三段式grid（左右minmax(0,1fr)，中间auto）；窄桌面使用auto/1fr/auto。本站菜单为产品、解决方案、资源与支持、价格，右侧帮助、控制台、联系销售、搜索；品牌保留DDOIDC及本站蓝色云图标，不复制Cloudflare商标。

统一SiteHeader支持links.children与description、logo、supportLink、action插槽。菜单支持桌面悬浮/点击、键盘向下进入、Escape关闭并恢复触发器焦点、点击外部及焦点离开关闭；1120px以下切换手机菜单。搜索仅筛选配置的页面链接，不发送业务API，也不接Cloudflare搜索。hover/入场200ms ease-out，按钮active位移1px及scale(.98)，尊重减少动态效果偏好。

头尾均独立导出自src/shared/components/marketing/index.ts；SiteFooter保留CF/腾讯云双主题，拼团页继续腾讯云底栏。其他页面只装配共享组件，不复制结构或CSS。当前仅本地，未推送。

验证：1620×1029桌面、390×844手机实际Chromium；72px高度、悬浮菜单、键盘、Escape、搜索过滤和无溢出/页面错误通过。证据cf-header-browser.log及cf-header-desktop/mobile.png。

本轮收尾：VM npx tsc -b、npm run build通过（Vite 40.04秒，退出码0）；地图校验323节点、0问题。仅现有大分包提示，无构建错误。

## 2026-11-01 用户最新要求：头部改为Kumo原生控件

本节覆盖上一版自绘CF式控件：保留1480px/72px三段布局，但按钮、菜单、输入及弹层完全复用现有Kumo2.15.0的Button、LinkButton、DropdownMenu、Popover、Input、Text、Link。删除原头部自定义颜色、圆角、阴影、字体、悬浮缓动及自绘搜索/下拉；共享CSS仅保留响应式布局。底栏主题不变。头尾仍由marketing统一入口独立导出，其他页按参数装配。

菜单Label必须位于DropdownMenu.Group，否则官方Base UI上下文报错；已补齐并完成真实浏览器回归。头部z-40低于Kumo原生弹层，避免手机导航盖住下拉。证据kumo-header-browser.log、kumo-header-desktop/mobile.png，覆盖桌面72px、菜单/Escape、搜索过滤、手机及无溢出/页面错误；VM类型检查通过。无业务接口变化、无真实扣款/开通、未推送部署。

## 2026-11-01 最新：替换Kumo头部，采用腾讯云式共享头部

用户明确不要上一版，要求代码级仿腾讯云，覆盖前节Kumo头部选择。读取活动页实际qcportal-kit-topnav HTML及portal/kit/full.df73a28ab3829ca0322a.css：pls-nav-top桌面62px、左内边距20px，logo右间距32px；菜单14px/62px/左右12px；右侧搜索框38px高、注册按钮62px整高；手机56px。按公开结构重建，平台品牌及链接保留DDOIDC，不使用腾讯商标/身份。

共享SiteHeader仍为唯一头部组件，独立样式marketing-header.css，SiteFooter仍保持腾讯云式主题，两者由marketing/index.ts导出。移除Kumo版头部与旧头部CSS，通用后台/用户中心Kumo不变。菜单悬浮/点击、180ms离开延迟、分类展开、搜索本站页面、手机导航及键盘Escape/焦点恢复；200ms面板入场及注册按钮300ms悬浮，尊重减少动画设置。不调用腾讯云账号/搜索服务。

本地Chromium1620×1029及390×844通过：62px桌面/56px手机、悬浮/Escape/搜索、手机菜单，无页面错误及横向溢出。证据tencent-header-browser.log及tencent-header-desktop/menu/mobile.png。当前仅本地，未推送部署，无真实扣款或开通。

最终验证：VM npx tsc -b通过；Vite生产构建46.00秒、退出码0，仅现有大分包提示；地图323节点0问题。

## 2026-11-01 截图版air头部精确校准

用户要求公开源码级一致，重新读取https://cloud.tencent.com/当前HTML及同版portal-kit样式，采用pls-nav/pls-nav-air/fixed、pls-nav-mod、pls-nav-top、pls-nav-top-logo、pls-nav-list-wrap、ul.pls-nav-list/li.pls-nav-item、pls-nav-top-operation的公开结构。对应声明迁入共享marketing-header.css，非复制腾讯账号SDK/埋点或私有代码。

固定覆盖首屏，不占正文高度；模糊背景直接使用rgba(255,255,255,.4)+blur(10px)，悬浮白底，62px桌面/56px手机；logo布局78×18，14px菜单/左右12px；超宽搜索280×38，按原规则收窄。特色入口蓝色渐变+5秒扫光（0% left -100%、50%与100% left100%）。移除整高注册块，使用本站账户入口；不假冒腾讯登录，保留DDOIDC品牌、本站导航和真实链接，用云拼团代替腾讯大模型入口，不宣称提供不存在的模型业务。桌面栏目补充企业中心、云市场、开发者、客户支持、合作生态的本站入口。

页面首屏留白由Campaign自身CSS负责，头部不依赖拼团业务；本地预览安全标记移至右下，避免顶条影响对齐。支持account属性配置入口，SiteHeader/SiteFooter依然独立复用。VM类型检查、桌面/手机交互验证通过；新增2538px截图宽度检查记录在tencent-header-wide-browser.log。只本地、不推送、不触发实际支付或开通。

截图宽度2538px最终计算样式：height62、logoWidth78、logoHeight18、searchWidth280、rgba(255,255,255,.4)、blur(10px)，全部断言通过；地图323节点0问题。参考截图对应布局已实际核验，品牌/文字及本站业务入口有意保留平台内容差异。

## 2026-11-02 展开区改为CF浮层

用户指定顶栏保留腾讯云air主题，仅展开区按CF截图。读取CF公开NavigationContainer的B组件规则：820px（最大视口减32px）外层rounded-xl/p-2，内部圆角边框、三列竖线、列内p-2/gap0.5，图标16px、链接px5/py4、文字14px/6px间距。按原round-robin分列，解决方案7个本站真实入口分为3/2/2；不复制CF产品业务。移除全屏模糊遮罩和原满宽分类侧栏，浮层跟随触发器并限制在视口内，鼠标跨8px间隙、外部点击、Escape及手机适配继续生效。入场scale(.9→1)+opacity0→1，100ms easeOut，减少动画偏好关闭。选中导航底板36px高。

唯一实现SiteHeader/marketing-header.css，继续共享头尾。浏览器通过：820px、三列、7链接、12px外圆角、无旧遮罩，桌面/手机/搜索/Escape无错误或溢出；证据cf-expanded-menu-20261102-browser.log、cf-expanded-menu-20261102.png。工作区实现，未推送部署、无真实资金/上游操作。

## 2026-11-02 CF相邻展开动画

继续读取公开NavigationContainer：布局容器layout过渡200ms/easeOut；内容按导航顺序判定方向，新内容x=方向×24px→0、旧内容→反方向24px，淡入淡出150ms/easeOut；初次展开及退出opacity/scale(.9↔1)100ms。使用浏览器Web Animations API实现同参数，无新增依赖；不是引入CF私有账户代码。

SiteHeaderMenu.tsx独立负责持续保留的浮层、前后内容及动画生命周期，SiteHeader负责触发器与位置；相邻切换不重建section，旧内容absolute/inert/aria-hidden，完成后移除。代次校验取消过期回调，保留当前插值位置，防快速左右切换、退出中重开被旧回调误关闭；结束填充保持到React卸载，防闪回。导航选中底板left/width跟随200ms，首次定位不滑入。减少动态效果模式不运行WAAPI。

验证cf-menu-motion-20261102-browser.log：直接读取动画关键帧确认±24px与150/200ms，持续容器不重建，15次快速切换无残留，退出途中重开、Escape、减少动画模式通过。基础桌面/手机/搜索回归通过，VM类型检查通过。仅本地候选，未推送部署，未触发真实业务操作。

## 2026-11-02 CF式Kumo站内搜索弹窗

用户要求顶部搜索框换成CF式放大镜按钮，点击打开Kumo搜索弹窗。SiteHeader删除旧搜索输入/下拉面板及对应CSS，只保留Kumo Button secondary/circle触发器；新共享SiteSearch.tsx使用已安装Kumo2.15.0 CommandPalette.Root/Input/List/Results/ResultItem/Empty/Footer，沿用原生模态焦点、列表键盘、进出场。弹窗始终挂载由open控制，关闭动画不被条件渲染截断，打开重置关键词。

限定marketing-site-search-portal容器，600px宽/手机视口留白、居中、16px圆角；按截图使用暗色50%/blur4px遮罩，仅本搜索弹层局部例外，不改其他Kumo。默认输入提示、48px放大镜空态、中文快捷键及DDOIDC站内搜索署名，不假冒Cloudflare AI Search；本站菜单静态过滤，无外部AI或搜索业务API、无敏感资源查询。Esc一次关闭，遮罩关闭后焦点回到触发器，↑↓/Enter选择；Ctrl/Cmd+Enter保留原生新窗口语义，外链noopener/noreferrer。

共享文件SiteSearch.tsx、marketing-search.css、SiteHeader.tsx，其他页面复用共享头部即可，无新增依赖。浏览器证据cf-search-dialog-20261102-browser.log及cf-search-dialog/mobile-20261102.png，覆盖600px宽249px高居中、初始/无匹配空态、过滤、键盘、遮罩、焦点、重新打开及手机。Enter目标由隔离测试路由接管，不触发真实业务。工作区实现，未推送部署。

最终收尾：输入行52px；类型检查与生产构建39.97秒通过（仅现有大分包提示），相邻菜单动画回归通过；地图323节点0问题。未推送或部署。

2026-11-02位置调整：用户要求搜索弹窗偏上，覆盖此前垂直居中；共享marketing-search.css改为top:15vh、translate:-50% 0，水平居中保留。仅本地，无提交部署。

## Aliyun header revision (2026-11-02, local only)
The current shared header follows the public Aliyun 64px desktop navigation (56px mobile), 70% white background with 20px blur, compact 14px navigation, elastic search trigger and full-height account entry. DDOIDC branding and configured business destinations remain platform-owned. The footer is unchanged.
Public reference: https://g.alicdn.com/code/npm/@ali/hmod-aliyun-com-global-nav/0.3.21/index.css. Panel translation/opacity and category crossfade use 300ms ease-in-out; the burger uses 300ms cubic-bezier(.4,0,.2,1). Reduced motion disables these transitions. The search continues using the shared Kumo SiteSearch dialog. This explicitly requested public marketing replica is a scoped custom-style exception, not a console-wide theme.

## Aliyun inline search revision (2026-11-02, local only)
Supersedes the earlier CF/Kumo modal search. SiteSearch is mounted inside the shared header tools with a persistent combobox. Public 0.8.4 reference: left136/right367 desktop expansion, 300ms geometry, 400ms discovery reveal; closing hides content immediately, narrows after100ms, removes raised layer after400ms. Gradient border and 24px-blurred projection use600ms opacity. Mobile uses8px viewport insets and reduced motion removes transitions. Query results and discovery come only from configured platform links. No remote search, storage, credentials or business mutations. CSS stays local to the shared marketing component.

2026-11-02 follow-up: category dropdowns restore the previously reviewed 820px CF-style three-column shared SiteHeaderMenu with adjacent slide motion. The Aliyun toolbar and inline search stay independent. Local-only candidate.

2026-11-02 cloud brand: shared CloudBrandMark.tsx renders the approved monochrome cloud/circuit symbol. Header default is icon-only; visible brand/tagline removed, accessible home label retained. Desktop56×34/mobile46×28. Footer and authenticated app branding unchanged; local only.

2026-11-02 approved logo11 replaces monochrome draft: CloudBrandMark imports the single editable assets/ddoidc-cloud.svg file (blue#2FA7E0, gray#5D5B5D, transparent arrow cutouts). Header remains icon-only. Local preview only, no push.

2026-11-02 homepage adoption: PortalLayout composes existing SiteHeader and SiteFooter variant=tencent on pathname=/ only. There is no duplicate navigation/footer DOM or CSS. PortalHomeContent and remaining PortalShell routes are unchanged;64px/56px top padding compensates the fixed shared header. Shared edits propagate to both homepage and campaign. Local preview only.

2026-11-02 scroll-highlight: shared SiteHeader follows the public Aliyun directional scroll handler (10px noise floor; local100px threshold inferred from observed80/120px states). Desktop collapses nav to cloud-groupbuy/products plus36px restore arrow, grows search with50px/60px margins and300ms transitions. Returning above threshold restores nav; manual arrow restores it at any depth. Mobile retains full mobile layout; reduced-motion is honored. The reviewed CF category menu stays unchanged. Both homepage and campaign inherit this one implementation.

Scroll motion fix: placeholder/nav commit final geometry immediately. Only the fixed search frame transitions left/width300ms ease-in-out; do not add transitions to its measured placeholder, since ResizeObserver would feed intermediate bounds back into another300ms animation. Browser transitionrun instrumentation verifies one left and one width transition with no retargeting lag.

Glass background correction: ordinary and scroll-highlight states both retain rgba(255,255,255,.7) plus blur20px, confirmed against the live reference. White is restricted to category/search panels being open, not generic pointer hover or scrolling.
