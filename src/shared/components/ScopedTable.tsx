import {Table as KumoTable,Checkbox} from '@cloudflare/kumo';
import {useContext,type ComponentProps,type ReactNode} from 'react';
import {TableScopeContext} from './tableScope';
import {ConfigurableTable} from './ConfigurableTable';
import {projectTableMarkup,type TableMarkupRow} from '../utils/tableMarkup';
type Props=ComponentProps<typeof KumoTable>&{tableId?:string;initialHiddenColumns?:readonly string[]};
function ScopedTableRoot({tableId,initialHiddenColumns,children,...props}:Props){const owner=useContext(TableScopeContext);if(owner===null)return <KumoTable {...props}>{children}</KumoTable>;return <AdminMarkupTable tableId={tableId??'table'} owner={owner} initialHiddenColumns={initialHiddenColumns} {...props}>{children}</AdminMarkupTable>}
function AdminMarkupTable({tableId,owner,initialHiddenColumns,children,...props}:Props&{tableId:string;owner:string}){
 const model=projectTableMarkup(children,KumoTable);
 const columns=model.columns.map(column=>{const head=column.header as {type:unknown;props:Record<string,unknown>};return {...column,header:head.type===KumoTable.CheckHead?<Checkbox checked={head.props.checked as boolean} onCheckedChange={head.props.onCheckedChange as (value:boolean)=>void} aria-label={String(head.props.label??column.label)}/>:head.props.children as ReactNode}});
 const cell=(row:TableMarkupRow,key:string)=>{const element=row.cells.get(key);if(element?.type===KumoTable.CheckCell)return <Checkbox checked={element.props.checked as boolean} onCheckedChange={element.props.onCheckedChange as (value:boolean)=>void} aria-label={String(element.props.label??'选择记录')}/>;return element?.props.children as ReactNode};
 const rowProps=(row:TableMarkupRow)=>{const {children:unused,className:ignored,style:oldStyle,...rest}=row.props;void unused;void oldStyle;return {...rest,className:typeof ignored==='string'?ignored.split(/\s+/).filter(value=>/cursor-|drag-handle-/.test(value)).join(' '):''}};
 return <ConfigurableTable initialHiddenColumns={initialHiddenColumns} columns={columns} rows={model.rows} rowKey={row=>row.id} rowProps={rowProps} renderCell={cell} emptyContent={model.emptyContent} label={props['aria-label']??'管理表格'} storageKey={`ddoidc-admin-table:v1:${tableId}:${owner}`}/>;
}
export const ScopedTable=Object.assign(ScopedTableRoot,{Header:KumoTable.Header,Body:KumoTable.Body,Row:KumoTable.Row,Head:KumoTable.Head,Cell:KumoTable.Cell,CheckHead:KumoTable.CheckHead,CheckCell:KumoTable.CheckCell});
