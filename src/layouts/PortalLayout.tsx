import {useLocation} from 'react-router-dom';
import {PortalShell} from '../apps/portal/components/PortalShell';
import {useLayoutWidth} from '../shared/hooks/useLayoutWidth';
import {useAuthStore} from '../shared/stores/auth';
import {RouteOutlet} from '../shared/router/RouteOutlet';
import {useGroupBuyAvailability} from '../shared/router/GroupBuyGate';
import {useMarketplaceAvailability} from '../shared/router/MarketplaceGate';
export function PortalLayout() {
 const pathname=useLocation().pathname;
 const mobileBinding=pathname==='/bind-mobile';
 const layoutWidth=useLayoutWidth(useAuthStore(state=>state.user));
 const groupBuy=useGroupBuyAvailability('public');
 const marketplace=useMarketplaceAvailability('public');
 const extraLinks=[...(groupBuy.data?[{label:'拼团',href:'/groupbuy'}]:[]),...(marketplace.data?[{label:'交易市场',href:'/marketplace'}]:[])];
 return <PortalShell loginHref="/login" consoleHref="/console" extraLinks={extraLinks} showFooter={!mobileBinding} lightOnly={mobileBinding} mainClassName={pathname==='/'||mobileBinding?'flex-1':`${layoutWidth.containerClassName} flex-1 p-4 md:p-6 lg:p-8`}><RouteOutlet className="grid gap-6"/></PortalShell>;
}
