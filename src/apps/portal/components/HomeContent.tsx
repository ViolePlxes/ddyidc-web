import {homeSections} from '../../../shared/utils/homeContent';
export {homeSections,homeKey,homeText,homeData,homeHref,homeImage,initializeHomeContent} from '../../../shared/utils/homeContent';
import {createContext,useContext,Children,cloneElement,isValidElement,type ReactNode,type ReactElement} from 'react';
import {usePublicPages} from '../../../shared/api/publicContent';
import type {PortalModule} from '../../../shared/api/portalContent';
const Context=createContext<PortalModule[]>([]);
export function HomeContentProvider({children}:{children:ReactNode}){const query=usePublicPages();const modules=query.data?.find(page=>page.path==='/'&&page.enabled)?.modules??[];return <Context.Provider value={modules}>{children}</Context.Provider>}
export function useHomeSectionConfig(id:string){return useContext(Context).find(module=>module.id===id);}
export function orderedHomeChildren(children:ReactNode,ids:string[],modules:PortalModule[]){return Children.toArray(children).map((node,index)=>({node,index,id:ids[index],config:modules.find(module=>module.id===ids[index])})).filter(item=>item.config?.enabled!==false).sort((a,b)=>(a.config?.sort??a.index*10)-(b.config?.sort??b.index*10)||a.index-b.index).map(item=>isValidElement(item.node)?cloneElement(item.node,{key:item.id??item.index}):item.node);}
export function useHomeModules(){return useContext(Context);}

export function orderHomeRoot(root:ReactElement<{children?:ReactNode}>,modules:PortalModule[]){return cloneElement(root,undefined,orderedHomeChildren(root.props.children,homeSections.map(([id])=>id),modules));}
