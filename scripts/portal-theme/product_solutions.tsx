import React from "react";
import { Surface, Link } from "@cloudflare/kumo";
import { raw, value, Heading, CTA, Media, Cards } from "./primitives";
export function ProductSolutions() {
  return (
    <>
      <Heading />
      <div data-portal-product-controls className="min-h-10" />
      {raw('{{template "products" (moduleProducts $.Root .)}}')}
    </>
  );
}
