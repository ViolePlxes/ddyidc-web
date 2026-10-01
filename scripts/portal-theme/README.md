# 门户主题开发契约

独立公开入口 `src/entry/public.tsx` 仅增强 Go 已生成的正文，不导入 Console 页面。
本目录每个模块独立组件，由 `registry.tsx` 注册；公共排版在 `primitives.tsx`。
品牌视觉全部使用 Kumo 和现有 Tailwind Kumo token。

`npm run build` 先生成公开入口资源，再通过 React/Kumo 静态渲染生成 Go 模板。
输出 `dist/portal/<theme>.html`、同名 `.json` 资源契约及 `themes.json` 主题目录。
Go 使用 `html/template` 对数据库文字、链接、图片地址执行上下文转义。
`raw()` 只允许代码中固定的 Go 指令，禁止把运营内容转换为 raw HTML。

后台内容保存在服务器独立 `system.portal_*` 表，发布生成新的完整目录后切换数据库指针。
模块开启、内容修改、图片、链接、顺序、数量和轮播参数更新均无需重建本工程。
新增组件/主题代码属于软件更新；新增主题须输出相同 schemaVersion=1 的资源契约，
并同步后台模块定义与 Go 配置校验。仅切换已经安装的主题无需软件更新。

新模块：新增组件文件，在 registry 中登记稳定的 type，在后端 Definitions 中登记，
按已有 Module 契约使用字段；如新增字段，须同时扩展 TS/Go 契约与后台编辑器。
不允许读取用户会话、内部产品供应商字段或调用支付/订单 handler。
图片通过媒体库管理；初版只接受 PNG/JPEG/GIF，不执行 SVG 或上传 HTML。

静态文件必须由 Go 门户接口托管。Vite 的开发代理便于预览；上线禁止把所有路径回退到 public.html。
后台预览 iframe 禁用脚本，草稿响应 no-store/noindex。Console/Admin/Sales 沿用原有入口。
