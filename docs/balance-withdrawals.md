# 财务中心余额提现

财务中心顶部“提现”和余额区共用一个保持挂载的内嵌表单，不使用新弹窗。申请后显示待审核、待汇款、已汇款或已拒绝；人工审核通过不表示已经到账。

BalanceWithdrawals 展示可用余额、全部冻结、提现冻结及可提现额度。金额输入后读取服务端报价，规则未配置或核算失败时停止申请；客户端显示不代替服务端资金验证。收款渠道、姓名及账号提交到本平台，收款信息由后端加密保存。没有支付宝或微信自动退款、出款调用。

记录采用服务端分页、状态及 Kumo 日期范围筛选；展开编号可以核对对应资金流水和脱敏收款信息。请求幂等编号保留到成功响应，不因网络错误重新生成。网络错误引导核对记录后重试。

GET /api/v1/finance/withdrawals/quote、GET/POST /api/v1/finance/withdrawals、GET /api/v1/finance/withdrawals/:id。旧列表数组响应兼容；后端回滚时报价失败提示规则不可用，不导致页面白屏。后台权限和规则配置见服务端 docs/billing/withdrawals.md。

发布不导入测试账号、模拟余额或测试申请，不自动开启生产资金政策。验收证据与版本以本轮发布记录为准。

## 2026-10-09 手续费与全部提现补充
新增手续费策略 percent_2：按申请金额2%计算，不足一分向上取整；费用从冻结总额内扣除，净汇款=申请额-费用，拒绝解冻完整申请额。旧free申请保持原快照，配置变化不重算历史。费率由服务端计算，后台详情展示申请额/费用/应汇款，用户账单详情展示净额；不新增外部出款API。
报价新增maximumWithdrawable=min(可提现现金,单笔上限,每日剩余额度)，每日次数用北京时间自然日，包含拒绝申请。达到次数上限时返回0并说明；用户输入框旁Kumo按钮“全部提现”填服务端最大值，最终提交再次锁定账户核算。每日配置改为1次，原允许现金来源与其他财务设置保留。
代码：internal/billing/withdrawal/{quote.go,fees.go,service.go}、internal/admintodo/{settings.go,withdrawal_http.go}；BalanceWithdrawals.tsx、TodoSettings.tsx、TodoWithdrawalReview.tsx。不改表，不需迁移；仅代码和授权政策变更。
