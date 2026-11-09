import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
function moduleURL(source) { return 'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64'); }
const catalog = await readFile(new URL('../src/shared/domains/catalog.ts',import.meta.url),'utf8');
const catalogURL = moduleURL(catalog);
const source = (await readFile(new URL('../src/shared/utils/consoleBreadcrumbs.ts',import.meta.url),'utf8')).replace("'../domains/catalog'",JSON.stringify(catalogURL));
const {consoleBreadcrumbs:trail,consoleRoutes:routes} = await import(moduleURL(source));
const {domainSections,domainHref} = await import(catalogURL);
const groups=[{label:'资源',items:[{label:'首页',href:'/console'},{label:'统一账单',href:'/console/billing'},{label:'工单中心',href:'/console/tickets'},{label:'账户充值',href:'/wallet/recharge'}]}];
test('all console declarations and domain pages have a known current label',async()=>{
  const app=await readFile(new URL('../src/apps/console/ConsoleApp.tsx',import.meta.url),'utf8');
  const paths=[...app.matchAll(/path="([^"]+)"/g)].map(match=>match[1]).filter(path=>path!=='*'&&path!=='/bind-mobile'&&path!=='/console/domains/*');
  for(const path of paths) assert.ok(routes.some(row=>row[0]===path),path);
  for(const [pattern] of routes) assert.notEqual(trail(pattern.replace(/:[\w]+/g,'123'),groups).at(-1).label,'未找到页面',pattern);
  for(const section of domainSections) for(const page of section.pages) assert.equal(trail(domainHref(section,page),groups).at(-1).label,page.title);
});
test('static routes, legacy aliases and private parameters are handled correctly',()=>{
 assert.equal(trail('/console/tickets/create',groups).at(-1).label,'创建工单');
 assert.equal(trail('/console/tickets/123',groups).at(-1).label,'工单详情');
 assert.equal(trail('/user/instance/123.htm',groups).at(-1).label,'实例');
 assert.deepEqual(trail('/console/orders/private?token=secret',groups).map(item=>item.label),['用户中心','统一账单','订单详情']);
 assert.equal(trail('/console/orders-unregistered',groups).at(-1).label,'未找到页面');
 assert.ok(trail('/console/orders/123',[]).every(item=>!item.href));
});
