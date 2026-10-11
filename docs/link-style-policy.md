# 跳转链接视觉规范

适用：门户、用户中心、后台、Sales 与共享组件。

1. 文字跳转默认使用 Kumo 默认文字色，亮色主题黑色、暗色主题浅色；禁止硬编码 #000 等色值，避免暗色模式不可读。
2. 正文链接使用 Kumo Link，下划线保持官方行为；导航链接可用 plain。应用级 `--text-color-kumo-link` 映射到 `--text-color-kumo-default`，既有 Kumo Link 和 text-kumo-link 自动遵循默认规则。
3. 原生 a / React Router Link / NavLink 由共享 base 规则使用默认文字色；内部跳转保留路由、权限、状态、target、下载和返回上下文。
4. 默认不新增蓝色链接、强制 visited 变色或自绘色值。特殊语义确需其他颜色时，必须使用明确的 Kumo 语义类，并在所属模块记录原因与明暗主题验证。
5. 行动按钮、危险按钮、状态徽章、导航选中态保持各自 Kumo 组件语义；不可将按钮的反白文字或错误/危险信息强制改黑。
6. 不使用 !important 覆盖所有锚点；允许明确的组件/语义类覆盖默认值。嵌套主题及旧浏览器模式均采用同一链接 token 映射。

代码入口：src/styles/tailwind.css；官方组件：https://kumo-ui.com/components/link/。

验收：四端入口，手机和桌面，亮暗主题，默认/旧 text-kumo-link/Kumo inline/plain/current，特殊危险链接与按钮，真实路由点击。仅样式，不改业务或数据。

2026-10-11 本地候选，未发布。
