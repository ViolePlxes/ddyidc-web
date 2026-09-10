import { LayerCard } from "@cloudflare/kumo";

export interface Metric {
  label: string;
  value: string;
  hint: string;
}

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-animate-list>
      {metrics.map((metric) => (
        <LayerCard key={metric.label} className="grid min-h-36 gap-3 p-5">
          <span className="text-sm text-kumo-subtle">{metric.label}</span>
          <strong className="text-3xl font-semibold text-kumo-strong">
            {metric.value}
          </strong>
          <span className="text-sm text-kumo-subtle">{metric.hint}</span>
        </LayerCard>
      ))}
    </section>
  );
}
