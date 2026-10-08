# 门户公共头部与页脚规范

适用：DDYIDC公开官网和带会话门户。后台、Console、Sales继续各自布局。后续门户页面统一引用PortalShell，不复制导航、页脚或滚动监听。版本：2026-10-08，正式接入候选。

## 组件及调用

- `src/apps/portal/components/PortalShell.tsx`：唯一公共装配层，负责全页flex布局、头部占位、main和自然落底页脚。
- `PortalHeader.tsx`：固定锚点、顶部／精简状态、反色、移动导航。
- `PortalFooter.tsx`：品牌说明、三组导航及法律底栏。不包含已被用户移除的大色块行动区。
- `PortalHomeContent.tsx`、`PortalHero.tsx`、`portal-home-art.css`：首页正文及独立技术图美术，不属于通用控件主题。

```tsx
<PortalShell
  loginHref="https://console.ddoidc.com/login"
  consoleHref="https://console.ddoidc.com/console"
  legalOrigin="https://console.ddoidc.com"
  homeHref="/"
>
  <PortalHomeContent consoleHref="https://console.ddoidc.com/console" />
</PortalShell>
```

相对链接用于带会话门户，跨域目标只由调用方按部署域名提供；组件不读token、不调用账户API、不决定用户权限。公开官网不能恢复会话或探测客户信息。

| 属性 | 约定 |
| --- | --- |
| loginHref / consoleHref | 必填，真实登录／控制台路由；不可填预览回调 |
| legalOrigin | 默认空串；法律和工单目标域名，无尾斜线 |
| homeHref | 默认 `/`；章节入口自动追加 `#products`、`#management`、`#service` |
| extraLinks | 默认空；仅调用方通过既有Gate确认的门户入口 |
| containerClassName | 默认居中max-w-6xl、px-5/md:px-8；头尾同步传入，不单改一侧 |
| mainClassName | 默认flex-1；非首页由调用方加内容宽度与padding |
| showFooter | 默认true；绑定手机等独立流程可false，不改变目标页面权限 |
| lightOnly | 默认false；仅原绑定页流程true |

## 布局与视觉

顶部占位和固定导航同为80px，不得重复添加顶部padding。品牌云图标32px，图标与操作锚点随窗口居中框架定位，滚动不能位移。首页约1200px正文框架，通用头尾max-w-6xl。正文与控件14px，标题semibold，默认字距。只使用Kumo Link、LinkButton、Button、Surface、Tabs、Table等及语义token；禁止自定义通用控件色值、字体、圆角、阴影，禁止a包button。

顶部显示字标和章节导航；顶部哨兵离开视口后隐藏字标与桌面中央导航，保留图标、登录和控制台，背景透明。向上滚动中段保持精简，回顶部恢复。手机隐藏字标以保障操作空间，并提供菜单；不能通过裁切按钮解决溢出。主内容短页自然落底，长页页脚随文档流。

## 反色协议

默认云图标使用text-kumo-brand；反色区声明`data-header-tone="inverse"`，区块背景必须实际适合反色。图标／登录／控制台三个锚点分别读取区块几何交叠，使用rAF合并滚动与resize测量，不能用全页scrollY阈值代替。精简且进入反色区时图标text-kumo-inverse、操作使用官方secondary；白底登录ghost、控制台primary。菜单开启时恢复表面与图标品牌色。当前批准首页全页浅色，故反色不会被强制触发；机制保留用于后续合法区块。不得为了展示反色重新加入被删除的蓝色行动区。

## 链接、权限及状态

首页产品按钮到`/products`，控制台到真实`/console`并由目标认证拦截，登录到`/login`。帮助文档https://docs.ddoidc.com；工单`/console/tickets`；协议`/terms/privacy`、`/terms/service`。不得写占位通知或空href。拼团／市场等extraLinks由原Gate提供；不新增公开会话恢复、不修改业务总开关。

管理Tabs和技术图为明确标注的功能示意，不代表账户数据，不传输请求、不编造价格/SLA/客户指标。技术图临时预览与保存选择分离；重复点击不重播，快速切换只保留一个反馈；默认演示一轮停止，主动播放才能循环。显式暂停不能自行恢复；视口、页面隐藏和减少动态偏好暂停并清理观察器和事件。Tabs方向键聚焦、Enter确认，旧面板卸载且外框高度稳定。

## 无障碍与验收

移动按钮aria-expanded和aria-controls同步；点击链接关闭，Escape关闭并返回触发按钮。隐藏导航不可获得焦点。页内锚点保留导航偏移；活动章节有文字／下划线标识。减少动态下保留完整静态图和交互、关闭自动动效。

改动验收：顶部→中段→回顶部；反色区若存在检查三个锚点；手机展开／点击／Escape；真实产品、控制台、协议和文档链接；320/390/768/1024/1440无整页溢出；技术图选择和Tabs键盘操作；公开主页不请求auth/me。VM执行npm ci、tsc、build与源码／静态发布门禁。发布走GitHub main/tag及生产已有在线更新，不手动上传产物。

新页面只引用PortalShell；新增props或交互须修改本规范与Obsidian门户头尾节点，并登记实际验证与版本。
