# 续费价格确认与核查

本地候选，未发布。用户和后台客户实例续费复用InstanceRenewal及平台Kumo Dialog；选择周期后携带服务端quoteRevision，报价变化展示原金额和当前原价。显式确认仅请求安全重建，不会自动支付；已有通道支付或采购未知时由后端拒绝重建。

自动余额续费开启前显示当前周期及金额并明确确认。暂停原因由实例详情返回；后台消息中心的通知通过已有SSE及Kumo Toast呈现，无页面定时刷新。

后台“续费报价核查”路由为/instances/renewal-quote-audit，API为GET /admin/v1/instances/renewal-quote-audit?page=1，沿用实例管理授权和客户范围。只读展示原金额/应付、报价来源、核验和失效时间、本地快照与提示；每页20行，用户手动刷新，不改订单、扣款或执行机器操作。

源码：src/shared/components/InstanceManagement.tsx、src/shared/api/instanceManagement.ts、src/apps/admin/views/RenewalQuoteAudit.tsx、src/apps/admin/AdminApp.tsx。

VM npm ci、tsc、build通过。浏览器隔离预览导入真实组件，演示31.77元旧单和30元新报价及确认过程；响应为模拟数据且禁用付款，不代表真实供应商续费成功。详细源码、版本和截图见开发地图“续费报价证据与支付门禁”及deploy-notes验收报告。
