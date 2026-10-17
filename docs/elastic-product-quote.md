# 弹性商品配置与报价（本地候选）

ProductConfig为Console/Sales共用组件。固定规格保留原规格表；无规格弹性商品显示独立CPU和资源控件。通用控件使用Kumo，未支持类型明确显示不可用，不猜配置或价格。

选配防抖300ms后调用POST /api/v1/upstream/quote；键包括商品、周期、数量、配置及附加字段。切换中、失败、过期或缺必填字段禁止购买；取消旧请求，不用上一组报价回填新配置。单台首付、续费、安装费与合计使用服务端返回，不能以基础月价累加猜测。

OrderConfirm重新获取并核验报价。变价需要用户接受，提交使用新令牌；最终后端仍重报价。密码及自定义字段只保留页面内存，刷新后附加字段需重填，不能写入localStorage/sessionStorage。私有采购预算不出现在前端DTO。

管理员“对接能力”页独立于供应商账号管理。模块支持能力和安装/启用/健康状态分开；配置表单根据模块schema生成通用凭据字段，编辑历史账号保留原协议。新系统不得通过改显示名称伪装现有协议。

VM浏览器已覆盖PC1440和手机390、模拟失败禁购、停售依赖阻断，以及真实只读报价默认45.50/2核58.50/2核年611/两台年1222。演示入口和mock只存在VM验收文件，未加入发行页面。

本轮未推送、未上线。前端基线v0.1.162；需要与本地候选后端报价接口配套发布。详细接口及生命周期见后端docs/upstream-adapter-modules.md，验证证据见系统开发地图的“弹性商品权威报价”与“外部系统对接能力注册与生命周期”。


## Order creation retries
The confirmation page persists a UUID requestId with its draft before POST /orders. Transport retries reuse it; changing an already submitted payload with the same ID is rejected by the server. A response loss must not create another order or reserve inventory twice. Quote refresh does not change request identity. Cleared/new product drafts create independent intentional orders.
