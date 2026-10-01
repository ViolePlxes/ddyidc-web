import React from "react";
import { Surface, Link } from "@cloudflare/kumo";
import { raw, value, Heading, CTA, Media, Cards } from "./primitives";
export function FeatureSections() {
  return (
    <>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <Heading />
        <Media />
      </div>
      <Cards />
    </>
  );
}
