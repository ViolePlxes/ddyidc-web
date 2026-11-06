import { GlobeIcon } from "@phosphor-icons/react";
import type { NavigationGroup } from "../../layouts/DashboardLayout";
import { domainHref, domainSections } from "./catalog";

// Enrich only persisted domain sections. Existing navigation visibility,
// ordering and custom names remain authoritative.
export function withDomainNavigation(groups: NavigationGroup[]): NavigationGroup[] {
  return groups.map(group => ({ ...group, items: group.items.map(item => {
    const section = domainSections.find(value => domainHref(value) === item.href);
    if (!section) return item;
    if (section.pages.length < 2) return { ...item, label: section.title };
    return { ...item, label: section.title, children: section.pages.map(page => ({ label: page.title, href: domainHref(section, page), icon: GlobeIcon })) };
  }) }));
}
