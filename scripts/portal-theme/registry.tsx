import { AnnouncementBar } from "./announcement_bar";
import { Hero } from "./hero";
import { BannerCarousel } from "./banner_carousel";
import { ProductSolutions } from "./product_solutions";
import { NewsAnnouncements } from "./news_announcements";
import { FeatureSections } from "./feature_sections";
import { FinalCTA } from "./final_cta";
import { CustomerLogos } from "./customer_logos";
import { NetworkCapabilities } from "./network_capabilities";
import { Testimonial } from "./testimonial";
import { AdvantageComparison } from "./advantage_comparison";
import { PartnerLogos } from "./partner_logos";
import React from "react";
import { raw, CTA } from "./primitives";
const modules = {
  announcement_bar: AnnouncementBar,
  hero: Hero,
  banner_carousel: BannerCarousel,
  product_solutions: ProductSolutions,
  news_announcements: NewsAnnouncements,
  feature_sections: FeatureSections,
  final_cta: FinalCTA,
  customer_logos: CustomerLogos,
  partner_logos: PartnerLogos,
  network_capabilities: NetworkCapabilities,
  testimonial: Testimonial,
  advantage_comparison: AdvantageComparison,
};
export function ModuleTemplate() {
  return (
    <section
      id="{{.ID}}"
      data-portal-module="{{.Type}}"
      className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 md:px-10 md:py-24"
    >
      {Object.entries(modules).map(([type, Component]) => (
        <React.Fragment key={type}>
          {raw(`{{if eq .Type "${type}"}}`)}
          <Component />
          {raw("{{end}}")}
        </React.Fragment>
      ))}{" "}
      {raw(
        '{{if and .Href (ne .Type "hero") (ne .Type "final_cta") (ne .Type "announcement_bar")}}',
      )}
      <div>
        <CTA />
      </div>
      {raw("{{end}}")}
    </section>
  );
}
