import {configurableTableStyles} from './configurableTableStyles';
import {Button,Table} from '@cloudflare/kumo';
import {DotsSixVerticalIcon} from '@phosphor-icons/react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import type {ReactNode} from 'react';
import type {TableColumn} from '../utils/tableLayout';

/** Kumo handle/preview classes observed in CF Logs table-body.tsx. */
export function TableColumnHead({column,actions,children,actionsAfterLabel=false}:{column:TableColumn;actions:ReactNode;children:ReactNode;actionsAfterLabel?:boolean}){
 const {attributes,listeners,setNodeRef,setActivatorNodeRef,transform,transition,isDragging}=useSortable({id:column.key});
 return <Table.Head ref={setNodeRef} data-order-column={column.key} className="group/header relative min-w-0 select-none text-left"
  style={{transform:CSS.Transform.toString(transform),transition:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'none':transition,zIndex:isDragging?3:undefined}}>
  {isDragging?<span aria-hidden="true" className="pointer-events-none absolute inset-0 z-1 bg-kumo-info-tint opacity-30"/>:null}
  <div className="relative flex min-h-6 items-center gap-1"><span className="min-w-0 truncate">{column.header??column.label}</span>{actionsAfterLabel?actions:null}
   <span className={configurableTableStyles.headerControls}>
    <Button ref={setActivatorNodeRef} {...attributes} {...listeners} size="sm" variant="ghost" shape="square" className="h-6.5 w-auto cursor-grab! touch-none" aria-label={`拖动${column.label}列`} icon={<DotsSixVerticalIcon size={16}/>}/>
   </span>{actionsAfterLabel?null:actions}
  </div>{children}
 </Table.Head>;
}
export function TableColumnPreview({label}:{label:string}){
 return <div data-order-drag-preview="true" className={configurableTableStyles.dragPreview}><span className="min-w-0 truncate">{label}</span><DotsSixVerticalIcon size={16}/></div>;
}
