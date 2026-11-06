import { GlobeIcon } from "@phosphor-icons/react";
import type { NavigationGroup } from "../../layouts/DashboardLayout";
import { domainHref, domainSections } from "./catalog";

// Enrich only persisted domain sections. Existing navigation visibility,
// ordering and custom names remain authoritative.
export function withDomainNavigation(groups: NavigationGroup[]): NavigationGroup[] {
  return groups.map(group => ({ ...group, items: group.items.map(item => {
    const section = domainSections.find(value => domainHref(value) === item.href);
    if (!section) return item;
    const visible = section.pages.filter(page => !page.hidden);
    const label = item.label === "信息模板" ? section.title : item.label;
    if (visible.length < 2) return { ...item, label };
    return { ...item, label, children: visible.map(page => ({ label: page.title, href: domainHref(section, page), icon: GlobeIcon })) };
  }) }));
}
