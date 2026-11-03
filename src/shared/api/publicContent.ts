import {createContext,createElement,useContext,type ReactNode} from 'react';
import {useQuery} from '@tanstack/react-query';
import type {PortalDocument,PortalPage,PortalCategory} from './portalContent';
export interface PublishedContent {site:PortalDocument['site'];pages:PortalPage[];categories?:PortalCategory[];revision:number}
export const publishedContentKey=['published-portal-content'] as const;
export const publicContentOrigin=()=>window.location.hostname==='cloud.ddoidc.com'?'https://console.ddoidc.com':'';
export async function readPublishedContent():Promise<PublishedContent>{
 const response=await fetch(`${publicContentOrigin()}/api/v1/portal/content`,{credentials:'omit',cache:'no-store',headers:{Accept:'application/json'}});
 if(!response.ok)throw new Error('公开内容暂时无法读取，请稍后重试');
 const envelope=await response.json() as {code:number;data:PublishedContent};
 if(envelope.code!==0)throw new Error('公开内容暂时无法读取，请稍后重试');
 return envelope.data;
}
const options={queryKey:publishedContentKey,queryFn:readPublishedContent,staleTime:0,refetchInterval:30000,refetchOnWindowFocus:true,retry:1};
const Override=createContext<PublishedContent|undefined>(undefined);
export function PublicContentOverride({value,children}:{value:PublishedContent;children:ReactNode}){return createElement(Override.Provider,{value},children);}
/** Navigation, body and footer always derive from one published revision; preview never changes the public cache. */
export function usePublicPages(){const override=useContext(Override);const query=useQuery({...options,enabled:!override,select:(value:PublishedContent)=>value.pages});return override?{...query,data:override.pages,isPending:false,isError:false,isSuccess:true,error:null}:query;}
export function usePublicSite(){const override=useContext(Override);const query=useQuery({...options,enabled:!override,select:(value:PublishedContent)=>({site:value.site,revision:value.revision})});return override?{...query,data:{site:override.site,revision:override.revision},isPending:false,isError:false,isSuccess:true,error:null}:query;}
export function usePublicCategories(){const override=useContext(Override);const query=useQuery({...options,enabled:!override,select:(value:PublishedContent)=>value.categories??[]});return override?{...query,data:override.categories??[],isPending:false,isError:false,isSuccess:true,error:null}:query;}

export function usePublicPreview(){return Boolean(useContext(Override));}
