# 待处理实名快捷审核

仅本地候选，待用户验收后另行授权发布。待处理实名操作列保留查看详情，新增通过和拒绝；仅待审核(status=1)的认证申请展示。通过无需进入业务详情；拒绝需填写最多255字的原因，沿用后端要求。不新增审核接口、权限或状态。

组件：src/apps/admin/views/TodoCertificationActions.tsx；集成：Todos.tsx。每次提交先读取现有脱敏detail，已处理申请与alipay自动认证不发送人工审核；后端仍是最终权限和行锁门禁。调用POST /admin/v1/certifications/:id/pass或reject，payload reason。请求处理中两按钮禁用、同步ref防重复点击，禁用自动mutation重试；失败保留错误与拒绝原因。

成功刷新admin-todos、admin-todo-items/certifications、certification-list、certification-detail缓存，使页面与左侧数量同步。历史记录不显示快捷审核按钮。模拟服务与测试脚本仅在仓库外VM运行，内存数据，无数据库、真实证件、真实审核或生产代理；不进入发布包。

阶段使用共享Kumo Dot Badge：未提交neutral、待审核warning、已通过success、已拒绝error；待办列表和历史列表一致，未知状态中性色。不改变实名状态含义。
