import React from "react";
import { Surface, Link } from "@cloudflare/kumo";
import { raw, value, Heading, CTA, Media, Cards } from "./primitives";
export function Hero() {
  return (
    <>
      <Surface className="grid min-h-[34rem] items-center gap-10 p-8 md:grid-cols-2 md:p-16">
        <div className="grid gap-7">
          <p className="font-medium text-kumo-brand">{value(".Eyebrow")}</p>
          {raw('{{if and (eq $.Root.Page.Path "/") (primaryHero $.Root .)}}')}
          <h1 className="whitespace-pre-line text-4xl font-semibold tracking-tight md:text-6xl">
            {value(".Title")}
          </h1>
          {raw("{{else}}")}
          <h2 className="whitespace-pre-line text-4xl font-semibold tracking-tight md:text-6xl">
            {value(".Title")}
          </h2>
          {raw("{{end}}")}
          <p className="max-w-2xl whitespace-pre-line text-lg text-kumo-subtle md:text-xl">
            {value(".Text")}
          </p>
          {raw("{{if .Href}}")}
          <div>
            <CTA />
          </div>
          {raw("{{end}}")}
        </div>
        <Media />
      </Surface>
    </>
  );
}
