import React from "react";
import { Surface, Link } from "@cloudflare/kumo";
import { raw, value, Heading, CTA, Media, Cards } from "./primitives";
export function FinalCTA() {
  return (
    <>
      <Surface className="grid gap-8 p-8 md:p-16">
        <Heading />
        {raw("{{if .Href}}")}
        <CTA />
        {raw("{{end}}")}
      </Surface>
    </>
  );
}
