import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const cache=new Map();
async function moduleURL(file){if(file.pathname.endsWith('.json'))return 'data:text/javascript;base64,'+Buffer.from('export default '+await readFile(file,'utf8')).toString('base64');
 if(cache.has(file.href))return cache.get(file.href);
 let compiled=ts.transpileModule(await readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const match of [...compiled.matchAll(/from ["'](\.[^"']+)["']/g)]){const url=await moduleURL(new URL(match[1].endsWith('.json')?match[1]:match[1]+'.ts',file));compiled=compiled.replaceAll(match[0],'from '+JSON.stringify(url));}
 const url='data:text/javascript;base64,'+Buffer.from(compiled).toString('base64');cache.set(file.href,url);return url;
}
const {pageTitle,HOME_TITLE}=await import(await moduleURL(new URL('../src/shared/utils/pageTitle.ts',import.meta.url)));
test('formal titles across public, console, admin and sales',()=>{
 const admin='/dd-admin-'+'a'.repeat(24);
 for(const [path,want] of [['/',HOME_TITLE],['/login','用户登录 - 多多云'],['/console','用户控制台 - 多多云'],['/console/billing','统一账单 - 多多云'],['/billing','统一账单 - 多多云'],['/console/orders/123','订单详情 - 多多云'],['/wallet/recharge','账户充值 - 多多云'],[admin,'管理控制台 - 多多云'],[admin+'/customers/123','客户详情 - 多多云'],[admin+'/todos/certifications','实名审核 - 多多云'],['/sales/login','销售登录 - 多多云'],['/terms/privacy','隐私政策 - 多多云']])assert.equal(pageTitle(path),want,path);
});
test('titles never include URL identifiers, query strings or legacy brands',()=>{
 const title=pageTitle('/console/orders/845471548292?token=private-secret#raw');assert.equal(title,'订单详情 - 多多云');assert.doesNotMatch(title,/845471|private|DDYIDC|DDOIDC/);
 assert.equal(pageTitle('/consolex'),'服务门户 - 多多云');
});
test('all entry HTML files have formal initial titles before React loads',async()=>{
 for(const entry of ['index','console','admin','sales']){const html=await readFile(new URL('../'+entry+'.html',import.meta.url),'utf8');assert.match(html,/<title>[^<]*多多云[^<]*<\/title>/);assert.doesNotMatch(html,/DDYIDC|DDOIDC/);}
});
