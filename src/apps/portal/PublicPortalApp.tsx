import {canonicalPublicPath} from '../../shared/utils/publicPageLayouts';
import {AgreementPlaceholder} from './views/Agreement';
import {PublicProductCatalog,PublicProductIntroduction} from './components/PublicCatalog';
import {PublishedContentPage} from './components/PublishedContent';
import {SiteHeader,SiteFooter} from '../../shared/components/marketing';
import {PortalShell} from './components/PortalShell';
import {PortalHomeContent} from './components/PortalHomeContent';
import {useLocation} from 'react-router-dom';
import { Navigate,Route, Routes } from "react-router-dom";

const consoleOrigin = window.location.hostname === 'cloud.ddoidc.com' ? 'https://console.ddoidc.com' : window.location.origin;
function Home(){return <PortalHomeContent consoleHref={`${consoleOrigin}/console`}/>;}

export function PublicPortalApp() {
 const pathname=useLocation().pathname;
 if(canonicalPublicPath(pathname)!==pathname)return <Navigate to={canonicalPublicPath(pathname)} replace/>;
 const homepage=pathname==='/';
 if(homepage)return <div className="flex min-h-svh flex-col bg-kumo-base text-base text-kumo-default"><SiteHeader loginLink={{href:`${consoleOrigin}/login`}} action={<><a href={`${consoleOrigin}/console`}>控制台</a><a href={`${consoleOrigin}/login`} className="marketing-tc-account">登录</a></>}/><main className="flex-1 pt-14 min-[1121px]:pt-16"><Home/></main><SiteFooter variant="tencent"/></div>;
 if(window.location.pathname.startsWith('/terms/'))return <Routes><Route path="/terms/:kind" element={<AgreementPlaceholder/>}/></Routes>;
 return <PortalShell loginHref={`${consoleOrigin}/login`} consoleHref={`${consoleOrigin}/console`} legalOrigin={consoleOrigin} mainClassName={'flex-1'}><Routes><Route path="/" element={<Home/>}/><Route path="/products" element={<PublicProductCatalog/>}/><Route path="/products/:id" element={<PublicProductIntroduction/>}/><Route path="/terms/:kind" element={<AgreementPlaceholder/>}/><Route path="*" element={<PublishedContentPage/>}/></Routes></PortalShell>;
}
