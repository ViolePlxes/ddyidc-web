import React from "react";
import { Surface, Link } from "@cloudflare/kumo";
import { raw, value, Heading, CTA, Media, Cards } from "./primitives";
export function CustomerLogos() {
  return (
    <>
      <Heading />
      <div className="flex flex-wrap items-center gap-10">
        {raw("{{range .Items}}")}
        <article className="grid max-w-48 gap-3">
          <Media />
          {raw("{{if .Href}}")}
          <Link href="{{.Href}}">{value(".Title")}</Link>
          {raw("{{else}}")}
          <h3 className="font-medium">{value(".Title")}</h3>
          {raw("{{end}}")}
          <p className="text-sm text-kumo-subtle">{value(".Text")}</p>
        </article>
        {raw("{{end}}")}
      </div>
    </>
  );
}
