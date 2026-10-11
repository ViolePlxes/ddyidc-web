# 待处理退款：机器信息与实名展示

2026-10-11 本地候选，未发布。

- 后台退款列表增加机器 IP、机器 ID（平台实例 ID）；多实例逐行对应，缺失 IP 或未开通显示“未获取”。
- 客户列仅显示审核通过（status=2）的实名姓名，缺少时显示“未实名”；不显示登录用户名、旧 v10 ID 或当前客户 ID。客户详情链接仍以平台客户 ID 路由。
- 迁移新旧 ID 关联表保留原样，不新增、删除或修改业务数据。
- GET /admin/v1/todos/refunds/items 及详情共用查询增加 customerRealName 与 machines[]（id、ipAddress）。仅退款后台查询填充。
- 机器优先取退款申请计费快照中的 periods[].instanceId；去重排序。快照为空不猜测实例。历史无快照申请按订单与客户匹配本地实例；市场退款按市场商品关联，避免订单编号撞号。已转移给其他客户的机器不返回当前 IP。
- 保持列表权限、资金核算、提交与状态机；无数据库迁移，无供应商请求。
- 本次需要前后端配套安装，旧后端未提供新字段时前端显示缺失标识，不冒用用户名为实名。

代码：src/apps/admin/views/Todos.tsx、src/shared/api/adminTodos.ts；internal/admintodo/queries.go、refund_display.go、queries_integration_test.go。

机器 IP 与机器 ID 均链接至后台 `/customers/:customerId/instances/:instanceId`，带待办返回上下文；未获取 IP 不生成链接，详情页沿用既有权限检查。

待办页面文字跳转统一使用 Kumo Link current，继承主题默认文本色（亮色黑色、暗色浅色），保留原路由及返回上下文。

机器 IP 旁复用 Kumo ClipboardText small 的复制按钮，紧邻 IP、无边框；IP 文字继续详情跳转，图标复制 IP 并显示勾，不传 tooltip，不发复制成功 toast；未获取信息不显示复制按钮。
