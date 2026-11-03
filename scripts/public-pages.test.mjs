import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
async function moduleURL(file){if(file.pathname.endsWith('.json'))return 'data:text/javascript;base64,'+Buffer.from('export default '+await readFile(file,'utf8')).toString('base64');let source=ts.transpileModule(await readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;for(const match of [...source.matchAll(/from ["'](\.[^"']+)["']/g)])source=source.replaceAll(match[0],'from '+JSON.stringify(await moduleURL(new URL(match[1].endsWith('.json')?match[1]:match[1]+'.ts',file))));return 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
const {addMissingPublicPages,publicPageCatalog,publicContentURL,publishedPage,publicDestination,publicHeaderLinks}=await import(await moduleURL(new URL('../src/shared/utils/publicPages.ts',import.meta.url)));
test('catalog initialization keeps existing content and only creates hidden drafts',()=>{
 const existing={id:'existing',path:'/company',title:'真实公司资料',enabled:true,modules:[{text:'preserve'}]};
 const doc={pages:[existing]};const result=addMissingPublicPages(doc);
 assert.equal(result.pages[0],existing);assert.equal(doc.pages.length,1);
 assert.equal(result.pages.length,publicPageCatalog.length);
 assert.ok(result.pages.slice(1).every(page=>!page.enabled));
 assert.deepEqual(addMissingPublicPages(result),result);
 assert.equal(publishedPage(result.pages,'/contact'),undefined);
 assert.equal(publishedPage(result.pages,'/company'),existing);
});
test('untrusted CMS links cannot execute code or navigate through ambiguous protocols',()=>{
 for(const value of ['javascript:alert(1)','data:text/html,test','//evil.test','/a/../private','https://user:pass@example.com','https://example.com\\evil','/a\nscript',null])assert.equal(publicContentURL(value),undefined,String(value));
 for(const value of ['/company','/help/example','https://docs.ddoidc.com'])assert.equal(publicContentURL(value),value);
});
test('page capacity rejects all changes atomically',()=>{
 const pages=Array.from({length:500},(_,n)=>({path:'/custom-'+n}));assert.throws(()=>addMissingPublicPages({pages}));assert.equal(pages.length,500);
});

test('public host sends authenticated and transactional routes to console only',()=>{
 assert.equal(publicDestination('/console/orders','cloud.ddoidc.com'),'https://console.ddoidc.com/console/orders');
 assert.equal(publicDestination('/wallet/recharge','cloud.ddoidc.com'),'https://console.ddoidc.com/wallet/recharge');
 assert.equal(publicDestination('/company','cloud.ddoidc.com'),'/company');
 assert.equal(publicDestination('/console','localhost'),'/console');
 assert.equal(publicDestination('https://docs.ddoidc.com','cloud.ddoidc.com'),'https://docs.ddoidc.com');
});

test('approved homepage cannot be replaced by generic CMS modules',async()=>{
 const home=await readFile(new URL('../src/apps/portal/components/PortalHomeContent.tsx',import.meta.url),'utf8');
 const catalog=await readFile(new URL('../src/apps/admin/views/PortalPageCatalog.tsx',import.meta.url),'utf8');
 assert.ok(home.includes('<AliyunHomeBody'));assert.ok(!home.includes('PublishedModules'));assert.ok(!catalog.includes('public-home-design'));
});

test('published navigation leaves navigate directly and third-level targets remain available',()=>{
 const input=[{label:'企业信息',href:'/company',children:[]},{label:'产品',href:'/products',children:[{label:'计算',href:'/cloud',children:[{label:'控制台',href:'/console',children:[]}]}]}];
 const links=publicHeaderLinks(input,'cloud.ddoidc.com');assert.equal(links[0].children,undefined);assert.equal(links[0].href,'/company');assert.deepEqual(links[1].children.map(item=>item.href),['/cloud','https://console.ddoidc.com/console']);
});

test('short CMS menus remain visible at desktop compact widths',async()=>{
 const css=await readFile(new URL('../src/shared/components/marketing/marketing-header.css',import.meta.url),'utf8');
 assert.ok(!css.includes('.marketing-tc-nav-item:nth-last-child(-n+4)'));assert.ok(css.includes('.marketing-tc-nav-item:nth-of-type(n+9)'));
});

test('explicitly hidden navigation remains in draft only',()=>{
 const links=publicHeaderLinks([{label:'private',href:'/private',enabled:false},{label:'group',href:'/company',children:[{label:'private child',href:'/private-child',enabled:false},{label:'live',href:'/help'}]}],'localhost');
 assert.equal(links.length,1);assert.deepEqual(links[0].children.map(link=>link.href),['/help']);
});
