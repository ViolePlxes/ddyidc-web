import { ChartPalette, LayerCard, TimeseriesChart } from "@cloudflare/kumo";
import { useTheme } from "../hooks/useTheme";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart, BarChart } from "echarts/charts";
import {
  BrushComponent,
  GridComponent,
  LegendComponent,
  ToolboxComponent,
  TooltipComponent,
} from "echarts/components";

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  LegendComponent,
  BrushComponent,
  ToolboxComponent,
  TooltipComponent,
]);

export function MiniTrend({ title, values, money = false }: { title: string; values: [number, number][]; money?: boolean }) {
  const { theme } = useTheme();
  return <TimeseriesChart echarts={echarts} height={140} isDarkMode={theme === "dark"}
    ariaDescription={title} xAxisTickCount={3} yAxisTickCount={2}
    tooltipValueFormat={(value) => money ? `${value.toFixed(2)} 元` : `${value} 个`}
    data={[{ name: title, color: ChartPalette.categorical(0), data: values }]} />;
}

export function TrendChart({
  title = "消费趋势",
  type = "line",
  values,
  yAxisName = "金额（元）",
  valuePrefix = "¥",
  valueSuffix = "",
}: {
  title?: string;
  type?: "line" | "bar";
  values: [number, number][];
  yAxisName?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  const { theme } = useTheme();
  const chartValues = values;
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold text-kumo-strong">{title}</h2>
      <LayerCard className="shadow-none p-5">
        <TimeseriesChart
          echarts={echarts}
          type={type}
          height={280}
          isDarkMode={theme === "dark"}
          ariaDescription={title}
          yAxisName={yAxisName}
          tooltipValueFormat={(value) => `${valuePrefix}${value.toFixed(2)}${valueSuffix}`}
          data={[
            {
              name: title,
              color: ChartPalette.categorical(0),
              data: chartValues,
            },
          ]}
        />
      </LayerCard>
    </section>
  );
}
