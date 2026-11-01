import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import React from 'react';
import ts from 'typescript';
const source=await readFile(new URL('../src/shared/utils/tableMarkup.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const resolved=outputText.replace(/from (["'])([^"']+)\1/g,(_,quote,specifier)=>`from ${JSON.stringify(import.meta.resolve(specifier))}`);
const {projectTableMarkup}=await import(`data:text/javascript;base64,${Buffer.from(resolved).toString('base64')}`);
const parts={Header:'thead',Body:'tbody',Row:'tr',Head:'th',CheckHead:()=>null};
const el=React.createElement;
function sample(body,head=[el('th',{key:'id'},'编号'),el('th',{key:'action'},'操作')]){return [el('thead',{key:'head'},el('tr',null,head)),el('tbody',{key:'body'},body)]}
test('legacy adapter preserves row/cell business handlers, keys and nested fragments',()=>{
 const click=()=>{},drag=()=>{};const action=el('button',{onClick:click},'详情');const row=el('tr',{key:'customer-1',draggable:true,onDragStart:drag},el('td',null,'123'),el('td',null,action));
 const model=projectTableMarkup(sample(el(React.Fragment,null,row)),parts);
 assert.equal(model.rows[0].id,'customer-1');assert.equal(model.rows[0].props.onDragStart,drag);
 assert.equal(model.rows[0].cells.get('action:0').props.children,action);assert.equal(action.props.onClick,click);
 assert.equal(model.columns[1].required,true);
});
test('selection headers keep controlled metadata and cannot be hidden',()=>{const check=()=>{};const head=el(parts.CheckHead,{key:'selection',label:'全选',checked:true,onCheckedChange:check});const model=projectTableMarkup(sample([], [head]),parts);assert.equal(model.columns[0].label,'全选');assert.equal(model.columns[0].required,true);assert.equal(model.columns[0].header.props.onCheckedChange,check)});
test('empty colspan is retained as an empty message, not mapped to a wrong column',()=>{const message=el('span',null,'暂无记录');const model=projectTableMarkup(sample(el('tr',null,el('td',{colSpan:2},message))),parts);assert.deepEqual(model.rows,[]);assert.equal(model.emptyContent,message)});
test('duplicate labels remain distinct and header keys survive conditional field changes',()=>{const heads=[el('th',{key:'a'},'状态'),el('th',{key:'b'},'状态')];assert.deepEqual(projectTableMarkup(sample([],heads),parts).columns.map(c=>c.key),['a:0','b:0']);assert.equal(projectTableMarkup(sample([],[heads[1]]),parts).columns[0].key,'b:0')});
test('admin inventory has unique stable feature IDs and direct admin tables use the shared adapter',async()=>{
 const inventory=JSON.parse(await readFile(new URL('../docs/admin-table-inventory.json',import.meta.url),'utf8'));assert.ok(inventory.length>=80);assert.equal(new Set(inventory.map(row=>row.tableId)).size,inventory.length);
 for(const file of new Set(inventory.filter(row=>row.scope==='admin').map(row=>row.file))){const text=await readFile(new URL('../'+file,import.meta.url),'utf8');assert.match(text,/ScopedTable as Table/);assert.doesNotMatch(text,/import\s*\{[^}]*\bTable\b[^}]*\}\s*from\s*["']@cloudflare\/kumo/)}
});

test('without admin scope shared tables render exactly the original Kumo markup',async()=>{
 const {createRequire}=await import('node:module');
 const require=createRequire(import.meta.resolve('vite'));const {build}=await import(require.resolve('esbuild'));
 const result=await build({entryPoints:[new URL('../src/shared/components/ScopedTable.tsx',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')],bundle:true,platform:'node',format:'esm',packages:'external',write:false,jsx:'automatic'});
 const code=result.outputFiles[0].text.replace(/from (["'])([^"']+)\1/g,(_,quote,specifier)=>`from ${JSON.stringify(import.meta.resolve(specifier))}`);
 const {ScopedTable}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
 const {Table}=await import('@cloudflare/kumo');const {renderToStaticMarkup}=await import('react-dom/server');
 const children=el(Table.Header,null,el(Table.Row,null,el(Table.Head,null,'客户')));
 assert.equal(renderToStaticMarkup(el(ScopedTable,{tableId:'customer-table',className:'original'},children)),renderToStaticMarkup(el(Table,{className:'original'},children)));
});

test('every admin table is routed through the shared implementation',async()=>{
 const {readdir}=await import('node:fs/promises');const root=new URL('../src/apps/admin/',import.meta.url);
 for(const file of await readdir(root,{recursive:true})){if(!file.endsWith('.tsx'))continue;const source=await readFile(new URL(file.replaceAll('\\','/'),root),'utf8');if(!/<Table(?:\s|>)/.test(source))continue;assert.match(source,/ScopedTable as Table/,file);assert.doesNotMatch(source,/import\s*\{[^}]*\bTable\b[^}]*\}\s*from\s*["']@cloudflare\/kumo/,file);assert.match(source,/<Table tableId=/,file)}
});
