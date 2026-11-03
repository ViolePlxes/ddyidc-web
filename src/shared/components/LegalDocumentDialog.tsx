import { useId, useRef, useState } from "react";
import { Button, LayerDialog, TableOfContents, useTableOfContentsActiveId } from "@cloudflare/kumo";
import {useLegalDocument} from "../hooks/useLegalDocument";

export function LegalDocumentDialog({kind,label}:{kind:"service"|"privacy";label?:string}) {
 const document=useLegalDocument(kind);
 const id=useId();
 const sections=document.blocks.reduce<{title:string;paragraphs:string[]}[]>((items,block)=>{
  if(block.type==="heading")items.push({title:block.text,paragraphs:[]});
  else {if(!items.length)items.push({title:document.title,paragraphs:[]});items[items.length-1]!.paragraphs.push(block.text);}
  return items;
 },[]);
 const [root,setRoot]=useState<HTMLElement|null>(null);
 const {activeId,selectSection}=useTableOfContentsActiveId({ids:sections.map((_,index)=>`${id}-${index}`),root,trackHash:false});
 const sectionRefs=useRef<(HTMLElement|null)[]>([]);
 return <LayerDialog.Root>
  <LayerDialog.Trigger render={<Button variant="ghost" size="sm" className="h-auto px-0 py-0 text-sm"/>}>{label??document.title}</LayerDialog.Trigger>
  <LayerDialog.Content size="xl" verticalAlign="center" closeLabel="关闭">
   <LayerDialog.Title>{document.title}</LayerDialog.Title>
   <LayerDialog.Description>了解平台服务约定与权益保障，可通过章节目录快速查阅。</LayerDialog.Description>
   <LayerDialog.Body>
    <div className="grid min-h-0 gap-5 sm:h-[min(480px,58dvh)] sm:grid-cols-[160px_minmax(0,1fr)]">
     <nav aria-label="协议章节" className="min-h-0 border-b border-kumo-line pb-4 sm:overflow-y-auto sm:border-r sm:border-b-0 sm:pr-4 sm:pb-0">
      <TableOfContents>
       <TableOfContents.Title>章节目录</TableOfContents.Title>
       <TableOfContents.List>
        {sections.map((section,index)=><TableOfContents.Item key={index} render={<button type="button"/>} active={activeId===`${id}-${index}`} aria-controls={`${id}-${index}`} onClick={()=>{selectSection(`${id}-${index}`);sectionRefs.current[index]?.scrollIntoView({block:"start",behavior:"smooth"})}}>{section.title}</TableOfContents.Item>)}
       </TableOfContents.List>
      </TableOfContents>
     </nav>
     <article ref={setRoot} aria-label={document.title} className="grid min-h-0 min-w-0 content-start gap-6 overflow-y-auto overscroll-contain break-words pr-2 text-sm leading-relaxed text-kumo-default">
      {sections.map((section,index)=><section id={`${id}-${index}`} key={index} ref={node=>{sectionRefs.current[index]=node}} className="grid scroll-mt-1 gap-3">
       <h2 className="text-base font-semibold text-kumo-strong">{section.title}</h2>
       {section.paragraphs.map((text,paragraph)=><p key={paragraph} className="whitespace-pre-line">{text}</p>)}
      </section>)}
     </article>
    </div>
   </LayerDialog.Body>
  </LayerDialog.Content>
 </LayerDialog.Root>;
}
