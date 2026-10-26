import { Breadcrumbs, Button, DropdownMenu } from '@cloudflare/kumo';
import { DotsThreeIcon } from '@phosphor-icons/react';
import { useLocation } from 'react-router-dom';
import { adminBase } from '../utils/adminEntry';
import { adminBreadcrumbs, type BreadcrumbGroup } from '../utils/adminBreadcrumbs';
import { consoleBreadcrumbs } from '../utils/consoleBreadcrumbs';

export function DashboardBreadcrumbs({ groups, scope = 'admin' }: { groups: BreadcrumbGroup[]; scope?: 'admin' | 'console' }) {
  const location = useLocation();
  const crumbs = scope === 'console' ? consoleBreadcrumbs(location.pathname, groups) : adminBreadcrumbs(location.pathname, adminBase, groups);
  const children = crumbs.flatMap((crumb, index) => {
    const current = index === crumbs.length - 1;
    const label = <span title={crumb.label} className={current ? 'block truncate' : 'block max-w-28 truncate lg:max-w-44'}>{crumb.label}</span>;
    const item = current ? <Breadcrumbs.Current key={`item-${index}`}>{label}</Breadcrumbs.Current>
      : crumb.href ? <Breadcrumbs.Link key={`item-${index}`} href={crumb.href}>{label}</Breadcrumbs.Link>
        : <span key={`item-${index}`} className="hidden min-w-0 shrink-0 text-kumo-subtle sm:inline">{label}</span>;
    return index ? [<Breadcrumbs.Separator key={`separator-${index}`} />, item] : [item];
  });
  return <div className="mr-auto min-w-0 flex-1" data-admin-breadcrumbs={scope === 'admin' ? '' : undefined} data-console-breadcrumbs={scope === 'console' ? '' : undefined}>
    <div className="hidden lg:block"><Breadcrumbs size="sm" className="mr-0 w-full">{children}</Breadcrumbs></div>
    <div className="flex min-w-0 items-center lg:hidden">
      {crumbs.length > 1 && <DropdownMenu><DropdownMenu.Trigger render={<Button variant="ghost" shape="square" size="sm" aria-label="查看上级页面" icon={<DotsThreeIcon />} />} /><DropdownMenu.Content><DropdownMenu.Group>{crumbs.slice(0, -1).map((crumb, index) => crumb.href ? <DropdownMenu.LinkItem key={index} href={crumb.href}>{crumb.label}</DropdownMenu.LinkItem> : <DropdownMenu.Label key={index}>{crumb.label}</DropdownMenu.Label>)}</DropdownMenu.Group></DropdownMenu.Content></DropdownMenu>}
      <Breadcrumbs size="sm" className="mr-0 min-w-0"><Breadcrumbs.Current><span title={crumbs.at(-1)?.label} className="block truncate">{crumbs.at(-1)?.label}</span></Breadcrumbs.Current></Breadcrumbs>
    </div>
  </div>;
}
