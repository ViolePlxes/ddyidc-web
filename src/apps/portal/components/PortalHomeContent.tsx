import {AliyunHomeBody} from './aliyun-home/AliyunHomeBody';
/** Both public host and console-domain homepage use the same marketing body. */
export function PortalHomeContent(props:{consoleHref:string;productsHref?:string}){return <AliyunHomeBody {...props}/>}
