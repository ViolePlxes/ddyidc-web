import React from "react";
import { Surface, Link } from "@cloudflare/kumo";
import { raw, value, Heading, CTA, Media, Cards } from "./primitives";
export function AnnouncementBar() {
  return (
    <>
      <Surface className="p-4">
        <Link href="{{.Href}}">{value(".Title")} →</Link>
      </Surface>
    </>
  );
}
