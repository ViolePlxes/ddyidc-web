# 日期控件规范

- 所有应用（Admin、Console、Sales、Portal）日期选择必须使用 `@cloudflare/kumo` 的 `DatePicker`，统一通过 `src/shared/components/DateField.tsx` 接入。
- 参照官方文档：https://kumo-ui.com/components/date-picker/ 。禁止原生 `input type=date/datetime-local/month/week`、其他日历组件和自绘日期选择器。
- 日期加时间使用 Kumo DatePicker + Kumo Input 的 `type=time`；分钟/秒精度按业务保留，不能因切换日期丢失原有时刻。
- 中文标签、月份、星期和无障碍名称；只使用 Kumo 视觉组件及语义样式。筛选允许清空；必填业务日期通过表单校验。
- 纯日期保持 `YYYY-MM-DD`，不得转 UTC 再截日期；时间点先用浏览器本地时间展示，提交时按既有接口转 ISO。禁止直接截取 UTC ISO 字符串作为本地控件值。
- “即将到期产品”展示未到期且未来 72 小时内到期的有效产品。通知提前天数与展示窗口独立。
- 验收须覆盖选择、清空、禁用、时间保留和跨午夜时区，代码检查不得残留原生日期控件。
