# 续费价格与支付流程

2026-10-20用户最新要求：价格直接更正，保持原来的支付流程，不增加价格对比、重建订单确认或自动续费开启确认弹窗。本地候选，未发布。

用户和后台客户实例续费复用InstanceRenewal。内部读取当前报价revision后直接创建或获取正确金额的订单，显示普通余额/在线支付入口。自动续费仍使用原有开关，内部读取当前revision，无新增确认页。

PaymentDialog在创建支付单后使用服务端checkout.amount（元字符串）展示二维码/收银台金额，兼容缺此字段的旧接口；原页面金额仅作尚未创建支付单时的显示后备。服务端不会因去掉提示而放行未知支付或已收款订单改价。

后台只读“续费报价核查”仍保留，接口GET /admin/v1/instances/renewal-quote-audit?page=1、每页20行、手动刷新、现有授权及客户范围。内部历史金额与校价审计供工作人员查看。

VM依赖、tsc、build通过；浏览器真实组件隔离演示选择月付后直接进入30元支付流程，无新旧价格对比或重建按钮。演示禁止付款，不代表实际供应商采购成功。源码见InstanceManagement.tsx、PaymentDialog.tsx、shared/api/payment.ts及后端文档renewal-quote-payment-gate.md。
