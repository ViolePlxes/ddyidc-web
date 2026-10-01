import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LinkButton, Link, Surface, LayerCard, Badge } from "@cloudflare/kumo";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  fragments,
  raw,
  value,
  Products,
  ArticleList,
} from "./portal-theme/primitives";
import { ModuleTemplate } from "./portal-theme/registry";
function Document() {
  return (
    <html lang="zh-CN" data-mode="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{value(".SEO.Title")}</title>
        <meta name="keywords" content="{{.SEO.Keywords}}" />
        <meta name="description" content="{{.SEO.Description}}" />
        <meta
          name="robots"
          content="{{if .SEO.NoIndex}}noindex,follow{{else}}index,follow{{end}}"
        />
        <link rel="canonical" href="{{.Canonical}}" />
        <meta property="og:title" content="{{.SEO.Title}}" />
        <meta property="og:description" content="{{.SEO.Description}}" />
        <meta property="og:url" content="{{.Canonical}}" />
        <meta property="og:site_name" content="{{.Site.Brand}}" />
        <meta property="og:locale" content="zh_CN" />
        <meta
          property="og:type"
          content={
            '{{if eq .Page.Kind "article"}}article{{else}}website{{end}}'
          }
        />
        {raw("{{if .SEO.Image}}")}
        <meta
          property="og:image"
          content="{{absolute .Site.Origin .SEO.Image}}"
        />
        <meta
          name="twitter:image"
          content="{{absolute .Site.Origin .SEO.Image}}"
        />
        {raw("{{end}}")}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="{{.SEO.Title}}" />
        <meta name="twitter:description" content="{{.SEO.Description}}" />
        {raw("{{range .Assets.Styles}}")}
        <link rel="stylesheet" href="{{.}}" />
        {raw("{{end}}")}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{{.Structured}}" }}
        />
        <script type="module" src="{{.Assets.Script}}" />
      </head>
      <body
        className="bg-kumo-base font-sans text-kumo-default"
        data-portal-revision="{{.Revision}}"
      >
        <a href="#main" className="sr-only focus:not-sr-only">
          跳到主要内容
        </a>
        {raw("{{if .Site.HeaderEnabled}}")}
        <header className="sticky top-0 z-20 border-b border-kumo-line bg-kumo-base">
          <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-6 px-6 md:px-10">
            <Link href="/" className="text-2xl font-semibold">
              {raw("{{if .Site.Logo}}")}
              <img
                src="{{.Site.Logo}}"
                alt="{{.Site.Brand}}"
                width="144"
                height="40"
              />
              {raw("{{else}}")}
              {value(".Site.Brand")}
              {raw("{{end}}")}
            </Link>
            <nav
              aria-label="主要导航"
              className="flex flex-wrap items-center gap-6"
            >
              {raw("{{range .Site.Navigation}}")}
              {raw("{{if .Children}}")}
              <details className="relative">
                <summary className="cursor-pointer font-medium">
                  {value(".Label")}
                </summary>
                <Surface className="absolute left-0 top-full z-30 grid min-w-56 gap-4 p-6">
                  {raw("{{range .Children}}")}
                  <Link href="{{.Href}}">{value(".Label")}</Link>
                  {raw("{{end}}")}
                </Surface>
              </details>
              {raw("{{else}}")}
              <Link href="{{.Href}}">{value(".Label")}</Link>
              {raw("{{end}}")}
              {raw("{{end}}")}
            </nav>
            <Link href="{{.Site.ConsoleOrigin}}/login">进入控制台 →</Link>
          </div>
        </header>
        {raw("{{end}}")}
        <main id="main">
          {raw('{{if or (ne .Page.Path "/") (not (hasHero .Page))}}')}
          <div className="mx-auto grid max-w-7xl gap-4 px-6 pt-16 md:px-10">
            <h1 className="text-4xl font-semibold">{value(".Page.Title")}</h1>
            <p className="text-kumo-subtle">{value(".SEO.Description")}</p>
          </div>
          {raw("{{end}}")}
          {raw(
            '{{range .Page.Modules}}{{if .Enabled}}{{template "module" .}}{{end}}{{end}}',
          )}
          {raw('{{if eq .Page.Kind "products"}}')}
          <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:px-10">
            <div data-portal-product-controls />
            {raw('{{template "products" .}}')}
          </section>
          {raw("{{end}}")}
          {raw('{{if eq .Page.Kind "product"}}')}
          <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:px-10">
            {raw("{{range .Products}}")}
            <Surface className="grid gap-6 p-8">
              <Badge variant="outline">{value(".Group")}</Badge>
              <p className="whitespace-pre-line text-lg text-kumo-subtle">
                {value(".Description")}
              </p>
              <p className="text-3xl font-semibold">¥{value(".Price")} 起</p>
              <p className="text-kumo-subtle">{value(".Cycle")}</p>
              <LinkButton href="{{$.Site.ConsoleOrigin}}/console/products/{{.ID}}">
                前往控制台选购 →
              </LinkButton>
            </Surface>
            {raw("{{end}}")}
          </section>
          {raw("{{end}}")}
        </main>
        {raw("{{if .Site.FooterEnabled}}")}
        <footer className="border-t border-kumo-line bg-kumo-recessed">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:px-10">
            <p className="text-3xl font-semibold">{value(".Site.Brand")}</p>
            <nav
              aria-label="页脚导航"
              className="grid gap-8 sm:grid-cols-2 md:grid-cols-4"
            >
              {raw("{{range .Site.Footer}}")}
              <div className="grid content-start gap-4">
                <h2 className="font-semibold">{value(".Label")}</h2>
                {raw("{{range .Children}}")}
                <Link href="{{.Href}}">{value(".Label")}</Link>
                {raw("{{end}}")}
              </div>
              {raw("{{end}}")}
            </nav>
            <div className="flex flex-wrap justify-between gap-5 border-t border-kumo-line pt-8 text-sm text-kumo-subtle">
              <p>{value(".Site.Copyright")}</p>
              {raw("{{if .Site.Filing}}")}
              <Link href="{{.Site.FilingURL}}">{value(".Site.Filing")}</Link>
              {raw("{{end}}")}
            </div>
          </div>
        </footer>
        {raw("{{end}}")}
        <div
          data-portal-revision-notice
          className="fixed bottom-4 right-4 z-30"
        />
      </body>
    </html>
  );
}

function serialize(node: ReactNode) {
  let html = renderToStaticMarkup(node);
  for (const [key, source] of fragments) html = html.replaceAll(key, source);
  return html.replaceAll("&quot;", '"');
}
const products = serialize(<Products />),
  articles = serialize(<ArticleList />),
  moduleMarkup = serialize(<ModuleTemplate />),
  documentMarkup = serialize(<Document />);
// Module templates need the root view while . is the module. Pass it explicitly.
const moduleTemplate =
  "{{with .Module}}" +
  moduleMarkup
    .replaceAll("$.Page", "$.Root.Page")
    .replaceAll('template "articles" $', 'template "articles" $.Root') +
  "{{end}}";
// Root-aware wrapper avoids leaking page/global data into content contracts.
const output =
  '{{define "products"}}' +
  products +
  '{{end}}{{define "articles"}}' +
  articles +
  '{{end}}{{define "module"}}' +
  moduleTemplate +
  "{{end}}<!doctype html>" +
  documentMarkup.replace(
    'template "module" .',
    'template "module" (moduleView $ .)',
  );
const dist = resolve("dist");
const entry = readFileSync(resolve(dist, "public.html"), "utf8");
const styles = [...entry.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(
  (m) => m[1],
);
const script = entry.match(/<script[^>]+src="([^"]+)"/)?.[1];
if (!script || !styles.length) throw new Error("公开入口缺少主题 CSS/JS");
mkdirSync(resolve(dist, "portal"), { recursive: true });
writeFileSync(resolve(dist, "portal/cloudflare-reference.html"), output);
writeFileSync(
  resolve(dist, "portal/manifest.json"),
  JSON.stringify(
    { theme: "cloudflare-reference", version: 1, styles, script },
    null,
    2,
  ),
);
writeFileSync(
  resolve(dist, "portal/cloudflare-reference.json"),
  JSON.stringify({ theme: "cloudflare-reference", version: 1, styles, script }),
);
writeFileSync(
  resolve(dist, "portal/themes.json"),
  JSON.stringify([
    {
      id: "cloudflare-reference",
      label: "官网结构 Kumo 主题",
      version: 1,
      schemaVersion: 1,
    },
  ]),
);
console.log("Portal Go template generated from Kumo components.");
