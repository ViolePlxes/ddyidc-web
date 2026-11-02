import {useLocation} from 'react-router-dom';
import {SiteHeader,SiteFooter} from '../shared/components/marketing';
import {PortalShell} from '../apps/portal/components/PortalShell';
import {RouteOutlet} from '../shared/router/RouteOutlet';
import {useGroupBuyAvailability} from '../shared/router/GroupBuyGate';
import {useMarketplaceAvailability} from '../shared/router/MarketplaceGate';
export function PortalLayout() {
 const pathname=useLocation().pathname;
 const mobileBinding=pathname==='/bind-mobile';
 const groupBuy=useGroupBuyAvailability('public');
 const marketplace=useMarketplaceAvailability('public');
 const extraLinks=[...(groupBuy.data?[{label:'拼团',href:'/groupbuy'}]:[]),...(marketplace.data?[{label:'交易市场',href:'/marketplace'}]:[])];
 // Public homepage composes the same shared marketing chrome as /groupbuy.
 if(pathname==='/')return <div className="flex min-h-svh flex-col bg-kumo-base text-base text-kumo-default"><SiteHeader/><main className="flex-1 pt-14 min-[1121px]:pt-16"><RouteOutlet className="grid gap-6"/></main><SiteFooter variant="tencent"/></div>;
 return <PortalShell loginHref="/login" consoleHref="/console" extraLinks={extraLinks} showFooter={!mobileBinding} lightOnly={mobileBinding} mainClassName={pathname==='/'||mobileBinding?'flex-1':'w-full flex-1 p-4 md:p-6 lg:p-8'}><RouteOutlet className="grid gap-6"/></PortalShell>;
}
