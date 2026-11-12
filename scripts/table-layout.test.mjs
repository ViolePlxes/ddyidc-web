import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source=await readFile(new URL('../src/shared/utils/tableLayout.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {defaultTableLayout,tableColumnWidth,readTableLayout,reorderTableColumns,tablePreferenceKey}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const columns=[{key:'id',label:'订单号',width:270,min:180,required:true},{key:'customer',label:'客户',width:180,min:120},{key:'actions',label:'操作',width:100,min:80,required:true}];
const store=values=>({getItem:key=>values[key]??null});
test('column sizes clamp at their own minima and maximum without changing money or rows',()=>{assert.equal(tableColumnWidth(-10,columns[0]),180);assert.equal(tableColumnWidth(900,columns[1]),800);assert.equal(tableColumnWidth(NaN,columns[0]),270)});
test('mandatory identity/action fields stay visible and unknown hidden fields are ignored',()=>{const layout=readTableLayout(store({key:JSON.stringify({widths:{id:400,customer:50,actions:100},hidden:['id','actions','customer','foreign']})}),'key',columns);assert.deepEqual(layout,{widths:{id:400,customer:120,actions:100},hidden:['customer'],order:['id','customer','actions']})});
test('legacy widths and shares migrate without deleting old browser preferences',()=>{const legacy={shares:'shares',pixels:'pixels'};assert.deepEqual(readTableLayout(store({pixels:JSON.stringify({id:250,customer:200,actions:100})}),'new',columns,legacy).widths,{id:250,customer:200,actions:100});const layout=readTableLayout(store({shares:JSON.stringify({id:0.5,customer:0.3,actions:0.2})}),'new',columns,legacy);assert.equal(layout.widths.id,275);assert.equal(layout.widths.customer,165);assert.equal(layout.widths.actions,110)});
test('account isolation, malformed and blocked storage fall back safely',()=>{const saved={widths:{id:400,customer:180,actions:100},hidden:['customer']};assert.deepEqual(readTableLayout(store({'accountA':JSON.stringify(saved)}),'accountB',columns),defaultTableLayout(columns));for(const raw of ['invalid','null','[]',JSON.stringify({widths:{},hidden:'all'})])assert.deepEqual(readTableLayout(store({key:raw}),'key',columns),defaultTableLayout(columns));assert.deepEqual(readTableLayout({getItem(){throw Error('blocked')}},'key',columns),defaultTableLayout(columns))});

test('field order repairs unknown and duplicate keys',()=>{const layout=readTableLayout(store({key:JSON.stringify({widths:{},hidden:[],order:['actions','actions','foreign','id']})}),'key',columns);assert.deepEqual(layout.order,['actions','id','customer'])});

test('release suffixes share one preference and new columns append without reordering',()=>{
 assert.equal(tablePreferenceKey('ddyidc-admin-order-columns:v3:business:1'),'ddyidc-admin-order-columns:business:1');
 assert.equal(tablePreferenceKey('ddyidc-domain-list-columns:v1'),'ddyidc-domain-list-columns');
 const next=[...columns,{key:'added',label:'新增字段',width:120,min:80}];
 const layout=readTableLayout(store({key:JSON.stringify({widths:{id:400,customer:180,actions:100},hidden:['added'],order:['actions','id']})}),'key',next);
 assert.deepEqual(layout.order,['actions','id','customer','added']);
 assert.deepEqual(layout.hidden,['added']);
});



test('header reorder preserves hidden columns and ignores invalid/cancelled drops',()=>{
 const order=['id','hidden','customer','actions'];
 assert.deepEqual(reorderTableColumns(order,'customer','id'),['customer','id','hidden','actions']);
 assert.deepEqual(order,['id','hidden','customer','actions']);
 for(const [from,to] of [['foreign','id'],['id','foreign'],['id','id']])assert.deepEqual(reorderTableColumns(order,from,to),order);
});
