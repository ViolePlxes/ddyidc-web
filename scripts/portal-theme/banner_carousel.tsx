import React from "react";
import { Surface, Link } from "@cloudflare/kumo";
import { raw, value, Heading, CTA, Media, Cards } from "./primitives";
export function BannerCarousel() {
  return (
    <>
      <Heading />
      <div
        data-portal-carousel
        data-carousel-interval="{{.Interval}}"
        data-carousel-autoplay="{{.AutoPlay}}"
        className="grid gap-5 md:grid-cols-2"
      >
        {raw("{{range .Items}}")}
        <Surface data-portal-slide className="grid gap-5 p-8">
          <Media />
          <h3 className="text-2xl font-semibold">{value(".Title")}</h3>
          <p className="text-kumo-subtle">{value(".Text")}</p>
          {raw("{{if .Href}}")}
          <CTA />
          {raw("{{end}}")}
        </Surface>
        {raw("{{end}}")}
      </div>
      <div data-portal-carousel-controls className="min-h-10" />
    </>
  );
}
