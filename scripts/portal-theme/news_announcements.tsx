import React from "react";
import { Surface, Link } from "@cloudflare/kumo";
import { raw, value, Heading, CTA, Media, Cards } from "./primitives";
export function NewsAnnouncements() {
  return (
    <>
      <Heading />
      {raw('{{template "articles" $}}')}
      <Cards />
    </>
  );
}
