import type {ReactNode} from 'react';
import {PortalHeader} from './PortalHeader';
import {PortalFooter} from './PortalFooter';
export function PortalShell({children,loginHref,consoleHref,legalOrigin='',homeHref='/',extraLinks=[],mainClassName='flex-1',containerClassName,showFooter=true,lightOnly=false}:{children:ReactNode;loginHref:string;consoleHref:string;legalOrigin?:string;homeHref?:string;extraLinks?:{label:string;href:string}[];mainClassName?:string;containerClassName?:string;showFooter?:boolean;lightOnly?:boolean}) {
 const chrome={loginHref,consoleHref,homeHref,extraLinks,containerClassName};
 return <div data-mode={lightOnly?'light':undefined} className="flex min-h-svh flex-col bg-kumo-base text-sm text-kumo-default"><PortalHeader {...chrome}/><main className={mainClassName}>{children}</main>{showFooter&&<PortalFooter {...chrome} legalOrigin={legalOrigin}/>}</div>;
}
