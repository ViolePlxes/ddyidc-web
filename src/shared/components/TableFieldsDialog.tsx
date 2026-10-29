import {configurableTableStyles} from './configurableTableStyles';
import {Button,Dialog,Input} from '@cloudflare/kumo';
import {DotsSixVerticalIcon,MinusIcon,PlusIcon,XIcon,MagnifyingGlassIcon} from '@phosphor-icons/react';
import {useEffect,useRef,useState} from 'react';
import {defaultTableLayout,type TableColumn,type TableLayout} from '../utils/tableLayout';

export function TableFieldsDialog({columns,layout,onChange,open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void;columns:readonly TableColumn[];layout:TableLayout;onChange:(value:TableLayout)=>void}){
 const [search,setSearch]=useState(''),[moving,setMoving]=useState<string|null>(null);
 const [dragY,setDragY]=useState(0),[targetIndex,setTargetIndex]=useState(-1),[settling,setSettling]=useState(false);
 const pointer=useRef<{key:string;y:number;index:number;scroll:number;count:number}|null>(null);
 const scroller=useRef<HTMLDivElement>(null),frame=useRef<number|undefined>(undefined),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const cancel=()=>{pointer.current=null;cancelAnimationFrame(frame.current??0);clearTimeout(timer.current);setMoving(null);setDragY(0);setTargetIndex(-1);setSettling(false)};
 useEffect(()=>()=>{cancelAnimationFrame(frame.current??0);clearTimeout(timer.current)},[]);
 const ordered=layout.order.map(key=>columns.find(c=>c.key===key)).filter((c):c is TableColumn=>Boolean(c));
 const matches=(c:TableColumn)=>`${c.label} ${c.key}`.toLowerCase().includes(search.trim().toLowerCase());
 const selected=ordered.filter(c=>c.required||!layout.hidden.includes(c.key)),available=ordered.filter(c=>!c.required&&layout.hidden.includes(c.key));
 const move=(from:string,to:string)=>{if(from===to)return;const order=[...layout.order];const start=order.indexOf(from),end=order.indexOf(to);if(start<0||end<0)return;order.splice(start,1);order.splice(end,0,from);onChange({...layout,order})};
 const shown=selected.filter(matches);
 const position=(y:number)=>{const start=pointer.current;if(!start)return {delta:0,index:0};const delta=y-start.y+(scroller.current?.scrollTop??0)-start.scroll;return {delta:Math.max(-start.index*36,Math.min((start.count-1-start.index)*36,delta)),index:Math.max(0,Math.min(start.count-1,start.index+Math.round(delta/36)))}};
 const type=(c:TableColumn)=>c.type??'S';
 const field=(c:TableColumn)=><><span className={`inline-flex size-4 shrink-0 items-center justify-center rounded-sm border text-xs ${type(c)==='N'?'text-kumo-warning':'text-kumo-brand'}`}>{type(c)}</span><span className="min-w-0 truncate" title={`${c.label} (${c.key})`}>{c.label}<span className="ml-1 text-xs text-kumo-subtle">{c.key}</span></span></>;
 return <Dialog.Root open={open} onOpenChange={value=>{onOpenChange(value);if(!value){setSearch('');cancel()}}}>
  <Dialog className={configurableTableStyles.fieldsDialog}>
   <div className="flex items-start justify-between p-5 pb-4"><div className="grid gap-1"><Dialog.Title className="text-lg font-medium">选择字段</Dialog.Title><Dialog.Description className="text-sm text-kumo-subtle">添加或移除表格列，拖动已选字段调整顺序</Dialog.Description></div><Dialog.Close render={<Button variant="ghost" size="sm" shape="square" aria-label="关闭字段选择" icon={<XIcon/>}/>}/></div>
   <div className="px-5 pb-3"><div className="relative"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 z-10 text-kumo-subtle" size={16}/><Input className="w-full pl-9" disabled={Boolean(moving)} aria-label="搜索字段" placeholder="搜索字段…" value={search} onChange={event=>setSearch(event.target.value)}/></div></div>
   <div ref={scroller} style={{overflowAnchor:'none'}} className="min-h-0 overflow-y-auto px-4 pb-4 text-sm"><p className="mb-2 text-kumo-subtle">{selected.length} 个已选字段</p>
    {shown.map((c,index)=><div key={c.key} data-field-key={c.key} className={`relative flex h-9 items-center gap-2 rounded-md px-2 motion-reduce:transition-none ${moving===c.key?'z-10 bg-kumo-base shadow-xs ring ring-kumo-line':'hover:bg-kumo-overlay'}`}
     style={{transform:`translateY(${moving===c.key?dragY:moving&&pointer.current?(index>pointer.current.index&&index<=targetIndex?-36:index<pointer.current.index&&index>=targetIndex?36:0):0}px)`,transition:!moving||(moving===c.key&&!settling)?'none':window.matchMedia('(prefers-reduced-motion: reduce)').matches?'none':'transform 150ms cubic-bezier(0.2, 0, 0, 1)',willChange:moving?'transform':undefined}}>
     <button type="button" aria-label={`移动${c.label}字段`} title="拖动排序，或按上下方向键" className="touch-none cursor-grab text-kumo-subtle active:cursor-grabbing"
      onPointerDown={event=>{if(event.button!==0||settling)return;event.preventDefault();event.currentTarget.focus({preventScroll:true});event.currentTarget.setPointerCapture(event.pointerId);pointer.current={key:c.key,y:event.clientY,index,scroll:scroller.current?.scrollTop??0,count:shown.length};setMoving(c.key);setTargetIndex(index)}}
      onPointerMove={event=>{if(pointer.current?.key!==c.key||settling)return;const next=position(event.clientY);cancelAnimationFrame(frame.current??0);frame.current=requestAnimationFrame(()=>{setDragY(next.delta);setTargetIndex(next.index)})}}
      onPointerUp={event=>{if(pointer.current?.key!==c.key||settling)return;cancelAnimationFrame(frame.current??0);const next=position(event.clientY),start=pointer.current;setTargetIndex(next.index);setDragY((next.index-start.index)*36);setSettling(true);timer.current=setTimeout(()=>{const target=shown[next.index];if(target)move(c.key,target.key);cancel()},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:150)}}
      onPointerCancel={cancel}
      onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();return}if(moving||!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const target=shown[index+(event.key==='ArrowUp'?-1:1)];if(target)move(c.key,target.key)}}><DotsSixVerticalIcon size={14}/></button>
     {field(c)}<span className="ml-auto shrink-0"><Button variant="secondary" size="xs" shape="square" aria-label={`移除${c.label}`} disabled={c.required||Boolean(moving)} title={c.required?'必需字段':`移除${c.label}`} icon={<MinusIcon/>} onClick={()=>onChange({...layout,hidden:[...layout.hidden,c.key]})}/></span>
    </div>)}
    <p className="mb-2 mt-6 text-kumo-subtle">{available.length} 个可添加字段</p>{available.filter(matches).map(c=><button type="button" key={c.key} className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-left hover:bg-kumo-overlay" aria-label={`添加${c.label}`} onClick={()=>onChange({...layout,hidden:layout.hidden.filter(key=>key!==c.key)})}>{field(c)}<PlusIcon className="ml-auto shrink-0" size={16}/></button>)}
    {![...selected,...available].some(matches)&&<p className="py-6 text-center text-kumo-subtle">未找到字段</p>}
   </div><div className="border-t border-kumo-line px-5 py-3"><Button variant="secondary" size="sm" disabled={Boolean(moving)} onClick={()=>{onChange(defaultTableLayout(columns));setSearch('')}}>恢复默认字段和列宽</Button></div>
  </Dialog>
 </Dialog.Root>;
}
