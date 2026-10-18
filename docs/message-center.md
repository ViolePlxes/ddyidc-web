# 消息中心界面

Console右上角MessageButton显示权威未读数，路由 `/console/messages`、`/console/messages/:id`；后台 `/messages/broadcasts`、`/new`、`/:id` 使用现有adminPath与鉴权入口。

共享代码：`src/shared/api/notifications.ts`、`src/shared/components/notifications/MessageButton.tsx`、`useTicketNotifications.ts`。Kumo Toasty复用现有provider；不新增重复容器。列表使用LayerCard小Tabs、Table、Select、Dialog和默认文字色Link；手机合理列宽表内横向滚动，顶部保留消息按钮。

无客户端定时轮询。登录/手动刷新/恢复可见/网络恢复按需同步；同源Web Locks选主、BroadcastChannel共享计数；SSE断线退避重连有抖动。首次ready及离线replay静默，在线changed弹最多3条和汇总，默认5秒。关闭Toast不代表已读，点击详情渲染后才提交已读。营销Toast可单独关闭，必要通知继续入箱。

Kumo useKumoToastManager对象身份会变化，以ref保存，effect仅跟随账号生命周期；账号退出关闭连接、重试计时器、频道与Toast。列表、详情和后台查询缓存均带账号ID，placeholderData仅限同账号，避免切换账号显示旧数据。筛选保留原列表至响应，避免闪屏；空列表不显示无效分页。

工单使用共享通知提示、可见性变化和人工刷新替代原定时拉取。read-ticket按当前已展示回复确认，模块关闭/断线时不产生无意义错误。后台展示积压/失败数量，有权限可审计重试原死信；群发预览确认、快照受众、状态/取消/重试均调用真实接口。

前端构建和真实浏览器验收在隔离VM，禁止用静态mock代替已读/Toast/权限验收。生产发布与后端050/051/052及新接口顺序配套；新开关缺省关闭。
