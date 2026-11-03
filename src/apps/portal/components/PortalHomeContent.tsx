import {HomeContentProvider} from './HomeContent';
import {AliyunHomeBody} from './aliyun-home/AliyunHomeBody';
import {PublishedSEO} from './PublishedContent';
import {usePublicPages} from '../../../shared/api/publicContent';
function HomeSEO(){const pages=usePublicPages();const home=pages.data?.find(page=>page.path==='/'&&page.enabled);return <PublishedSEO brandSuffix={false} page={home?{...home,title:'多多云｜云计算产品与服务'}:undefined}/>;}
/** Original approved components retain their geometry; CMS only supplies content and section state. */
export function PortalHomeContent(props:{consoleHref:string;productsHref?:string}){return <HomeContentProvider><HomeSEO/><AliyunHomeBody {...props}/></HomeContentProvider>}
