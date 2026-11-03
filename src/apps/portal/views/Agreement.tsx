import {useParams} from 'react-router-dom';
import {useLegalDocument} from '../../../shared/hooks/useLegalDocument';
import {SiteHeader,SiteFooter} from '../../../shared/components/marketing';
import '../components/marketing-content.css';
export function AgreementPlaceholder(){const {kind}=useParams();const document=useLegalDocument(kind==='privacy'?'privacy':'service');return <div className="ali-home ali-home-polished marketing-content-page" data-layout="document"><SiteHeader/><main className="marketing-legal-page arm-width"><nav className="marketing-content-breadcrumb"><a href="/">首页</a><span>/</span><span>{document.title}</span></nav><h1>{document.title}</h1><article>{document.blocks.map((block,index)=>block.type==='heading'?<h2 key={index} id={`policy-section-${index}`}>{block.text}</h2>:<p key={index}>{block.text}</p>)}</article><a className="arm-soft-action" href="/">返回首页</a></main><SiteFooter variant="tencent"/></div>}
