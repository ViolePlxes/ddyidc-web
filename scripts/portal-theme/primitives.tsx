import React, { type ReactNode } from "react";
import { LinkButton, Link, LayerCard, Badge } from "@cloudflare/kumo";
// Only code-authored template directives are inserted. All database strings are
// subsequently escaped by Go html/template; content never supplies executable HTML.
export const fragments = new Map<string, string>();
export function raw(source: string): ReactNode {
  const key = `PORTAL_DIRECTIVE_${fragments.size}_END`;
  fragments.set(key, source);
  return key;
}
export const value = (expression: string) => raw(`{{${expression}}}`);
export function CTA({
  href = ".Href",
  label = ".Label",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <LinkButton href={`{{${href}}}`} variant="primary" size="lg">
      {value(label)} <span aria-hidden="true">→</span>
    </LinkButton>
  );
}
export function Media() {
  return (
    <>
      {raw("{{if .Image}}")}
      <img
        src="{{.Image}}"
        alt="{{.Alt}}"
        width="960"
        height="640"
        loading="lazy"
        className="aspect-video w-full object-contain"
      />
      {raw("{{end}}")}
    </>
  );
}
export function Heading() {
  return (
    <div className="grid gap-4">
      <p className="text-sm font-medium text-kumo-brand">{value(".Eyebrow")}</p>
      <h2 className="whitespace-pre-line text-3xl font-semibold tracking-tight text-kumo-strong md:text-5xl">
        {value(".Title")}
      </h2>
      <p className="max-w-3xl whitespace-pre-line text-lg text-kumo-subtle">
        {value(".Text")}
      </p>
    </div>
  );
}
export function Cards() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {raw("{{range .Items}}")}
      <LayerCard className="grid content-start gap-4 p-6">
        <Media />
        <h3 className="text-xl font-semibold">{value(".Title")}</h3>
        <p className="whitespace-pre-line text-kumo-subtle">{value(".Text")}</p>
        {raw("{{if .Href}}")}
        <Link href="{{.Href}}">{value(".Label")} →</Link>
        {raw("{{end}}")}
      </LayerCard>
      {raw("{{end}}")}
    </div>
  );
}
export function Products() {
  return (
    <div
      data-portal-products
      className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      {raw("{{range .Products}}")}
      <LayerCard
        data-product-group="{{.Group}}"
        className="grid content-start gap-4 p-6"
      >
        <Badge variant="outline">{value(".Group")}</Badge>
        <h3 className="text-xl font-semibold">{value(".Name")}</h3>
        <p className="text-kumo-subtle">{value(".Summary")}</p>
        <p className="text-2xl font-semibold">
          ¥{value(".Price")}{" "}
          <span className="text-sm font-normal text-kumo-subtle">起</span>
        </p>
        <p className="text-sm text-kumo-subtle">{value(".Cycle")}</p>
        <Link href="/products/{{.ID}}">查看产品介绍 →</Link>
      </LayerCard>
      {raw("{{else}}")}
      <p className="text-kumo-subtle">暂无已发布产品。</p>
      {raw("{{end}}")}
    </div>
  );
}
export function ArticleList() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {raw("{{range .Articles}}")}
      <LayerCard className="grid gap-4 p-6">
        <p className="text-sm text-kumo-subtle">{value(".UpdatedAt")}</p>
        <h3 className="text-xl font-semibold">
          <Link href="{{.Path}}">{value(".Title")}</Link>
        </h3>
        <p className="text-kumo-subtle">{value(".SEO.Description")}</p>
      </LayerCard>
      {raw("{{end}}")}
    </div>
  );
}
