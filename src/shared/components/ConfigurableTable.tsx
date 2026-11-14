import {configurableTableStyles} from './configurableTableStyles';
import {DndContext,DragOverlay,KeyboardSensor,PointerSensor,closestCenter,useSensor,useSensors} from '@dnd-kit/core';
import {SortableContext,horizontalListSortingStrategy,sortableKeyboardCoordinates} from '@dnd-kit/sortable';
import {createPortal} from 'react-dom';
import {TableColumnHead,TableColumnPreview} from './TableColumnHead';
import {TableFieldsDialog} from './TableFieldsDialog';
import {Button,DropdownMenu,LayerCard,Table} from '@cloudflare/kumo';
import {DotsThreeVerticalIcon,PencilSimpleIcon} from '@phosphor-icons/react';
import {Fragment,useEffect,useLayoutEffect,useRef,useState,type ReactNode,type ComponentProps} from 'react';
import {defaultTableLayout,reorderTableColumns,maxTableColumnWidth,tableColumnWidth,readTableLayout,tablePreferenceKey,type TableColumn,type TableLayout} from '../utils/tableLayout';

export interface ConfigurableTableProps<T> {
 columns:readonly TableColumn[];
 rows:readonly T[];
 /** Must include the feature and current account ID; changing it remounts isolated preferences. */
 storageKey:string;
 legacyStorageKeys?:{shares:string;pixels:string};
 label:string;
 renderCell:(row:T,key:string)=>ReactNode;
 rowKey:(row:T)=>string;
 loading?:boolean;
 initialHiddenColumns?:readonly string[];
 emptyContent?:ReactNode;
 fillHeight?:boolean;
 fieldButtonAfterLabel?:boolean;
 /** Pin the first and last visible columns while the middle scrolls sideways. */
 stickyEdges?:boolean;
 rowProps?:(row:T)=>ComponentProps<typeof Table.Row>;
 expandedRowKey?:string|null;
 renderExpandedRow?:(row:T)=>ReactNode;
}
export type {TableColumn} from '../utils/tableLayout';
/** Reusable Kumo table. Pages supply data/columns; styles and interactions stay shared. */
export function ConfigurableTable<T>(props:ConfigurableTableProps<T>){return <ConfigurableTableInstance key={tablePreferenceKey(props.storageKey)} {...props}/>;}
function ConfigurableTableInstance<T>({columns,rows,storageKey,legacyStorageKeys,label,renderCell,rowKey,loading=false,emptyContent,rowProps,initialHiddenColumns=[],fillHeight=false,fieldButtonAfterLabel=false,stickyEdges=false,expandedRowKey=null,renderExpandedRow}:ConfigurableTableProps<T>){
 const columnsKey=columns.map(column=>column.key).join('|');
 const preferenceKey=tablePreferenceKey(storageKey);
 const [layout,setLayout]=useState<TableLayout>(()=>{try{const saved=localStorage.getItem(preferenceKey)??localStorage.getItem(storageKey);const current=readTableLayout(localStorage,localStorage.getItem(preferenceKey)?preferenceKey:storageKey,columns,legacyStorageKeys);return saved?current:{...current,hidden:columns.filter(column=>!column.required&&initialHiddenColumns.includes(column.key)).map(column=>column.key)}}catch{return defaultTableLayout(columns)}});
 const [activeColumn,setActiveColumn]=useState<string|null>(null);
 const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:5}}),useSensor(KeyboardSensor,{coordinateGetter:sortableKeyboardCoordinates}));
 const [fieldsOpen,setFieldsOpen]=useState(false);
 const [resizing,setResizing]=useState(false);
 const drag=useRef<{key:string;x:number;width:number;before:TableLayout}|null>(null);
 const layoutRef=useRef(layout);layoutRef.current=layout;
 // Merge columns added or removed by a later release without discarding the
 // user's saved order. The instance is no longer keyed by the column list, so
 // an update must never remount the table or drop an unsaved preference.
 useEffect(()=>{setLayout(current=>{const keys=columns.map(column=>column.key);const order=[...current.order.filter(key=>keys.includes(key)),...keys.filter(key=>!current.order.includes(key))];const widths=Object.fromEntries(columns.map(column=>[column.key,current.widths[column.key]??column.width]));const hidden=current.hidden.filter(key=>{const column=columns.find(item=>item.key===key);return Boolean(column&&!column.required)});const same=order.length===current.order.length&&order.every((key,index)=>key===current.order[index])&&hidden.length===current.hidden.length&&columns.every(column=>current.widths[column.key]===widths[column.key]);return same?current:{...current,order,widths,hidden}});
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[columnsKey]);
 const persist=()=>{try{localStorage.setItem(preferenceKey,JSON.stringify(layoutRef.current))}catch{/* Current page still works. */}};
 useEffect(()=>{if(!resizing){persist();return}const timer=setTimeout(persist,150);return()=>clearTimeout(timer);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[layout,preferenceKey,resizing]);
 useEffect(()=>()=>{persist();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[preferenceKey]);
 const visible=layout.order.map(key=>columns.find(c=>c.key===key)).filter((c):c is TableColumn=>Boolean(c&&(c.required||!layout.hidden.includes(c.key))));
 // Pin only the outer columns, so a narrow viewport keeps the name and price
 // visible while the middle columns scroll inside the table container.
 const pinnedEdge=(index:number):"left"|"right"|undefined=>{
  if(!stickyEdges||visible.length<2)return undefined;
  if(index===0)return "left";
  if(index===visible.length-1)return "right";
  return undefined;
 };
 // A pinned column gets a divider only while the table is actually clipped
 // (not every column fits), so a table that fits keeps the borderless look.
 const scrollHost=useRef<HTMLDivElement>(null);
 const [edgesClipped,setEdgesClipped]=useState(false);
 const edgesKey=stickyEdges?`${visible.map(c=>`${c.key}:${layout.widths[c.key]??c.width}`).join("|")}`:"";
 useLayoutEffect(()=>{
  const node=scrollHost.current;
  if(!stickyEdges||!node){setEdgesClipped(false);return}
  setEdgesClipped(node.scrollWidth>node.clientWidth+1);
 },[edgesKey,stickyEdges]);
 useEffect(()=>{
  const node=scrollHost.current;
  if(!stickyEdges||!node)return;
  const measure=()=>setEdgesClipped(node.scrollWidth>node.clientWidth+1);
  const observer=new ResizeObserver(measure);
  observer.observe(node);
  return ()=>observer.disconnect();
 },[stickyEdges]);
 const edgeDivider=(side:"left"|"right"|undefined)=>!edgesClipped||!side?"":side==="left"?"after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-kumo-line":"after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-kumo-line";
 const resize=(column:TableColumn,value:number)=>setLayout(current=>({...current,widths:{...current.widths,[column.key]:tableColumnWidth(value,column)}}));
 const reset=(column:TableColumn)=>resize(column,column.width);
 const finish=()=>{drag.current=null;setResizing(false)};
 return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={({active})=>setActiveColumn(String(active.id))} onDragCancel={()=>setActiveColumn(null)} onDragEnd={({active,over})=>{if(over)setLayout(current=>({...current,order:reorderTableColumns(current.order,String(active.id),String(over.id))}));setActiveColumn(null)}} accessibility={{screenReaderInstructions:{draggable:'按空格开始拖动列，左右方向键调整位置，空格确认，Escape取消。'}}}><LayerCard className={fillHeight?"h-full min-w-0 overflow-hidden p-0":"min-w-0 overflow-hidden p-0"}><TableFieldsDialog columns={columns} layout={layout} onChange={setLayout} open={fieldsOpen} onOpenChange={setFieldsOpen}/><div ref={scrollHost} className={fillHeight?"h-full overflow-x-auto":"overflow-x-auto"}>
  <Table aria-label={label} layout="fixed" style={{width:visible.reduce((sum,c)=>sum+(layout.widths[c.key]??c.width),0),minWidth:'100%'}}
   className={`${configurableTableStyles.table}${fillHeight?' h-full':''}`}>
   <colgroup>{visible.map(c=><col key={c.key} style={{width:layout.widths[c.key]??c.width}}/>)}</colgroup>
   <SortableContext items={visible.map(c=>c.key)} strategy={horizontalListSortingStrategy}><Table.Header><Table.Row>{visible.map((column,index)=><TableColumnHead key={column.key} column={column} sticky={pinnedEdge(index)} edgeClassName={edgeDivider(pinnedEdge(index))} actionsAfterLabel={index===0&&fieldButtonAfterLabel} actions={index===0?<Button size="xs" variant="secondary" icon={<PencilSimpleIcon/>} aria-haspopup="dialog" aria-expanded={fieldsOpen} onClick={()=>setFieldsOpen(true)}>字段</Button>:<span className="ml-auto inline-flex shrink-0 opacity-0 group-hover/header:opacity-100 group-focus-within/header:opacity-100 has-data-popup-open:opacity-100"><DropdownMenu><DropdownMenu.Trigger render={<Button variant="ghost" size="xs" shape="square" aria-label={`${column.label}字段选项`} icon={<DotsThreeVerticalIcon/>}/>}/><DropdownMenu.Content><DropdownMenu.Item onClick={()=>reset(column)}>恢复本列宽度</DropdownMenu.Item>{!column.required?<DropdownMenu.Item onClick={()=>setLayout(current=>({...current,hidden:[...current.hidden,column.key]}))}>隐藏字段</DropdownMenu.Item>:null}</DropdownMenu.Content></DropdownMenu></span>}>
    {index<visible.length-1?<div role="separator" aria-orientation="vertical" aria-label={`调整${column.label}列宽`} aria-valuemin={column.min} aria-valuemax={maxTableColumnWidth} aria-valuenow={Math.round(layout.widths[column.key]??column.width)} tabIndex={0}
     className="group/resize absolute inset-y-0 right-0 z-10 flex w-2 cursor-col-resize touch-none select-none items-center justify-end focus-visible:outline-none"
     onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);const headers=event.currentTarget.closest('tr')?.querySelectorAll('th');const widths={...layout.widths};headers?.forEach(header=>{const key=header.dataset.orderColumn;if(key)widths[key]=header.getBoundingClientRect().width});const before={...layout,widths};drag.current={key:column.key,x:event.clientX,width:widths[column.key]??column.width,before:layout};setLayout(before);setResizing(true)}}
     onPointerMove={event=>{const start=drag.current;if(start?.key===column.key)resize(column,start.width+event.clientX-start.x)}}
     onPointerUp={finish} onPointerCancel={()=>{if(drag.current)setLayout(drag.current.before);finish()}} onLostPointerCapture={finish}
     onDoubleClick={()=>reset(column)} onKeyDown={event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();resize(column,event.key==='Home'?column.width:event.key==='End'?maxTableColumnWidth:(layout.widths[column.key]??column.width)+(event.key==='ArrowRight'?1:-1)*(event.shiftKey?50:10))}}>
     <span className={configurableTableStyles.resizeLine}/>
    </div>:null}
   </TableColumnHead>)}</Table.Row></Table.Header></SortableContext>
   <Table.Body>{loading?Array.from({length:10},(_,index)=><Table.Row key={`loading-${index}`} aria-hidden="true">{visible.map((c,index)=><Table.Cell key={c.key} sticky={pinnedEdge(index)} className={edgeDivider(pinnedEdge(index))}><span className="block h-4 w-2/3 animate-pulse rounded-sm bg-kumo-overlay motion-reduce:animate-none"/></Table.Cell>)}</Table.Row>):rows.length?rows.map(row=><Fragment key={rowKey(row)}><Table.Row {...rowProps?.(row)} className={`group ${rowProps?.(row).className??''}`}>{visible.map((c,index)=><Table.Cell key={c.key} sticky={pinnedEdge(index)} className={`min-w-0 overflow-hidden whitespace-nowrap ${edgeDivider(pinnedEdge(index))}`}>{renderCell(row,c.key)}</Table.Cell>)}</Table.Row>{expandedRowKey===rowKey(row)&&renderExpandedRow?<Table.Row><Table.Cell colSpan={visible.length} className="bg-kumo-recessed p-0!">{renderExpandedRow(row)}</Table.Cell></Table.Row>:null}</Fragment>):<Table.Row><Table.Cell colSpan={visible.length} className="h-32! text-center text-kumo-subtle">{emptyContent??'未找到记录'}</Table.Cell></Table.Row>}</Table.Body>
  </Table>
 </div></LayerCard>{createPortal(<DragOverlay dropAnimation={window.matchMedia('(prefers-reduced-motion: reduce)').matches?null:{duration:250,easing:'ease'}}>{activeColumn?<TableColumnPreview label={columns.find(c=>c.key===activeColumn)?.label??''}/>:null}</DragOverlay>,document.body)}</DndContext>;
}
