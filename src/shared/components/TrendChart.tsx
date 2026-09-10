import { ChartPalette, LayerCard, TimeseriesChart } from "@cloudflare/kumo";
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

const now = Date.now();
const daily = [118, 136, 124, 168, 159, 192, 214, 206, 248, 236, 279, 302];

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
  values?: [number, number][];
  yAxisName?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}) {
  const chartValues = values ?? daily.map((value, index) => [
    now - (daily.length - index) * 86_400_000,
    value,
  ] as [number, number]);
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold text-kumo-strong">{title}</h2>
      <LayerCard className="p-5">
        <TimeseriesChart
          echarts={echarts}
          type={type}
          height={280}
          isDarkMode={false}
          ariaDescription={`${title}近十二天数据`}
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
