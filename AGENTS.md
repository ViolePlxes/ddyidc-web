# 日期控件规范

- 所有应用（Admin、Console、Sales、Portal）日期选择必须使用 `@cloudflare/kumo` 的 `DatePicker`，统一通过 `src/shared/components/DateField.tsx` 接入。
- 参照官方文档：https://kumo-ui.com/components/date-picker/ 。禁止原生 `input type=date/datetime-local/month/week`、其他日历组件和自绘日期选择器。
- 日期加时间使用 Kumo DatePicker + Kumo Input 的 `type=time`；分钟/秒精度按业务保留，不能因切换日期丢失原有时刻。
- 中文标签、月份、星期和无障碍名称；只使用 Kumo 视觉组件及语义样式。筛选允许清空；必填业务日期通过表单校验。
- 纯日期保持 `YYYY-MM-DD`，不得转 UTC 再截日期；时间点先用浏览器本地时间展示，提交时按既有接口转 ISO。禁止直接截取 UTC ISO 字符串作为本地控件值。
- “即将到期产品”展示未到期且未来 72 小时内到期的有效产品。通知提前天数与展示窗口独立。
- 验收须覆盖选择、清空、禁用、时间保留和跨午夜时区，代码检查不得残留原生日期控件。

# 弹窗与浮层布局规范

- 所有模态窗口使用 `src/shared/components/Dialog.tsx` 导出的 Kumo Dialog 组合，禁止绕过统一视口边界直接引入 Kumo Dialog。
- 窗口宽高受当前视口及安全区约束，长内容在窗口内滚动；短屏、手机横屏和软键盘缩小视口时所有操作必须可达。
- 多按钮操作区可换行，支付窗口在手机端纵向排列；二维码、证件图片不超出可用宽度，桌面保留合理的 Kumo size。
- 弹窗内表单、详情长文本、表格和嵌套窗口均需验收。至少检查 320×568、390×844、横屏/短屏与 1440×900，不通过隐藏按钮或裁切内容解决溢出。
- 日期、选择器及菜单浮层使用 Kumo 原有定位与焦点管理，并限制可用宽高。布局修复不得改变支付、订单、权限或提交逻辑。

- 日期范围统一使用 `DateField.tsx` 导出的 `DateRangeField`，基于 Kumo `DatePicker mode="range"`，禁止起止两个独立单日期日历。桌面双月、手机单月；起止值一次应用，筛选支持清空及单侧范围，业务有效期必须完整；日期时间保留端点时刻、精度及原接口时区。

- 机器生命周期和电源状态通过 `MachineStatusBadge` 统一展示：运行绿色、操作/开通中蓝色、停机/暂停/待核查橙色、故障/到期红色、删除灰色。只用 Kumo Badge 原生色彩变体，不修改状态判定和操作权限。
