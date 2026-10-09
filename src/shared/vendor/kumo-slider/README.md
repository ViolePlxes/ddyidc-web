# Kumo Slider 临时官方源码

来源：https://github.com/cloudflare/kumo/blob/543dc8a0ca1b6f7678eb9c27be6750965eaf2564/packages/kumo/src/components/slider/slider.tsx
设计：https://kumo-ui.com/components/slider/
许可：MIT，见 LICENSE。

官网 Slider 尚未包含在 npm 正式版2.14.0中。本目录固定引用官方实现，将cn相对导入改为本目录的官方工具重导出，并加来源注释。轨道、滑块沿用官方实现；应用扩展如下。

应用通过 ProductConfig 使用单值 Slider，数量型保留min/max/step，枚举型按1开始的档位映射回原choice ID。未来正式发布Slider后，切换到@cloudflare/kumo的导出，移除此临时目录及不再需要的直接依赖。

应用追加formatValue可选属性，仅定制滑块数值文字（例如30 Mbps），保持官方布局与视觉类不变。原生Base UI数值仍为number，不把单位混入配置值。

可选位置为2–4个时显示灰色分段刻度，其余显示最小/最大端点。选中位置隐藏对应刻度或端点，移开恢复，并保留占位防止布局跳动。当前应用全部使用受控value；选项数量与报价逻辑仍归ProductConfig管理。
