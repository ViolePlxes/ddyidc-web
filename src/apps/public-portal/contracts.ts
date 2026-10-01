export interface SEO {
  title: string;
  keywords: string;
  description: string;
  image: string;
  noIndex: boolean;
}
export interface PortalLink {
  label: string;
  href: string;
  children: PortalLink[];
}
export interface PortalItem {
  id: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  href: string;
  label: string;
  category: string;
}
export interface PortalModule {
  id: string;
  type: string;
  enabled: boolean;
  sort: number;
  eyebrow: string;
  title: string;
  text: string;
  image: string;
  alt: string;
  href: string;
  label: string;
  items: PortalItem[];
  limit: number;
  productIds: string[];
  interval: number;
  autoPlay: boolean;
}
export interface PortalPage {
  id: string;
  path: string;
  title: string;
  kind: string;
  enabled: boolean;
  seo: SEO;
  modules: PortalModule[];
  updatedAt: string;
}
export interface PortalSite {
  brand: string;
  origin: string;
  consoleOrigin: string;
  logo: string;
  copyright: string;
  filing: string;
  filingUrl: string;
  theme: string;
  enabled: boolean;
  headerEnabled: boolean;
  footerEnabled: boolean;
  llms: boolean;
  seo: SEO;
  navigation: PortalLink[];
  footer: PortalLink[];
}
export interface PortalDocument {
  schemaVersion: number;
  revision: number;
  site: PortalSite;
  pages: PortalPage[];
}
export interface ModuleDefinition {
  type: string;
  label: string;
}
export const emptySEO = (): SEO => ({
  title: "",
  keywords: "",
  description: "",
  image: "",
  noIndex: false,
});
