# 后台首页统计布局（v0.1.208）

仅调整后台首页和共享组件的可选布局参数；用户中心及其他表格默认行为不变。原 dashboard、operations、server-monitor GET 查询、金额计算和刷新策略保留，首页移除最近订单区域，不删除订单数据。

访问流向、世界地图、客户端与状态码表格保留布局。真实访问采集尚未接入，正式页面显示“暂无访问数据”及“—”，不加载模拟记录，不新增 API 或后台采集任务。经营指标、收入与服务器监控仍由原接口返回。

卡片静态背景透明跟随 Kumo canvas；地图默认平面投影、等比宽度上限448px。服务器监控使用实心饼图，保留指标名称、数值和提示，隐藏图外标签。字段按钮位于首字段内；列偏好按当前后台用户隔离。

## 地图资产

src/shared/assets/world-110m.geo.json 是 Natural Earth 1:110m 世界底图，经 world-atlas TopoJSON 转 GeoJSON，移除南极并切分 Fiji/Russia 跨日期变更线多边形，防止横向填色带；不包含客户或访问记录。
来源：https://github.com/topojson/world-atlas ，https://www.naturalearthdata.com/about/terms-of-use/ 。Natural Earth 数据为 public domain；world-atlas 的转换代码采用 ISC，本仓库不复制其代码。

无数据库迁移、无后端版本变化，无支付、余额或机器操作。由用户在后台手动安装。
