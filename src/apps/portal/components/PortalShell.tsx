import type {ReactNode} from 'react';
import {SiteHeader,SiteFooter} from '../../../shared/components/marketing';

export function PortalShell({children,loginHref,consoleHref,homeHref='/',mainClassName='flex-1',showFooter=true,lightOnly=false}:{children:ReactNode;loginHref:string;consoleHref:string;legalOrigin?:string;homeHref?:string;extraLinks?:{label:string;href:string}[];mainClassName?:string;containerClassName?:string;showFooter?:boolean;lightOnly?:boolean}) {

 return <div data-mode={lightOnly?'light':undefined} className="flex min-h-svh flex-col bg-kumo-base text-base text-kumo-default"><SiteHeader homeHref={homeHref} action={<><a href={consoleHref}>控制台</a><a href={loginHref}>登录</a></>}/><main className={`pt-16 ${mainClassName}`}>{children}</main>{showFooter&&<SiteFooter variant="tencent" homeHref={homeHref}/>}</div>;
}
