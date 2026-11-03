import {usePublicPages} from '../api/publicContent';
import legalDocuments from '../../apps/portal/views/legalDocuments.json';
export function useLegalDocument(kind:'service'|'privacy'){
 const query=usePublicPages();const fallback=legalDocuments[kind];const page=query.data?.find(page=>page.enabled&&page.path===`/terms/${kind}`);
 const blocks=page?.modules?.filter(module=>module.enabled).sort((a,b)=>a.sort-b.sort).flatMap(module=>[{type:'heading',text:module.title||page.title},{type:'paragraph',text:module.text}])??fallback.blocks;
 return {title:page?.title||fallback.title,blocks,source:page?'published':'builtin'};
}
