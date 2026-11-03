import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const script=fileURLToPath(new URL('./check-release.mjs',import.meta.url));
function policy(filename){const root=mkdtempSync(join(tmpdir(),'ddyidc-release-policy-'));try{mkdirSync(join(root,'dist','assets'),{recursive:true});writeFileSync(join(root,'dist','version.json'),JSON.stringify({version:'test',commit:'isolated'}));writeFileSync(join(root,'dist','assets',filename),'export const x=1;');return spawnSync(process.execPath,[script,'--artifact'],{cwd:root,encoding:'utf8'});}finally{assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep+'ddyidc-release-policy-'));rmSync(root,{recursive:true,force:true});}}
test('opaque Vite hash may contain reserved word',()=>{const r=policy('Login-BsTmOCK3.js');assert.equal(r.status,0,r.stderr);});
for(const name of ['mock-ABCDEFGH.js','fixture-BsTmOCK3.js','component-mock-ABCDEFGH.js','backup-ABCDEFGH.js'])test('actual forbidden asset '+name,()=>{assert.notEqual(policy(name).status,0);});

function portalPolicy(change=()=>{}){const root=mkdtempSync(join(tmpdir(),'ddyidc-portal-policy-'));try{
 const files={'version.json':JSON.stringify({version:'test',commit:'isolated'}),'portal/themes.json':JSON.stringify([{id:'cloudflare-reference',label:'门户',version:1,schemaVersion:1}]),'portal/cloudflare-reference.json':JSON.stringify({theme:'cloudflare-reference',version:1,styles:['/assets/site.css'],script:'/assets/portal-content-0123456789abcdef.js'}),'portal/cloudflare-reference.html':'<h1>Public content</h1>','assets/site.css':'body{}','assets/portal-content-0123456789abcdef.js':'// public runtime'};
 change(files);for(const [name,body] of Object.entries(files)){const path=join(root,'dist',name);mkdirSync(resolve(path,'..'),{recursive:true});writeFileSync(path,body);}
 return spawnSync(process.execPath,[script,'--artifact'],{cwd:root,encoding:'utf8'});
}finally{assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep+'ddyidc-portal-policy-'));rmSync(root,{recursive:true,force:true});}}
test('registered portal manifests and assets pass',()=>{const result=portalPolicy();assert.equal(result.status,0,result.stderr);});
test('arbitrary portal JSON remains forbidden',()=>{assert.notEqual(portalPolicy(files=>{files['portal/private.json']='{}';}).status,0);});
test('portal metadata cannot carry unregistered fields',()=>{assert.notEqual(portalPolicy(files=>{const data=JSON.parse(files['portal/themes.json']);data[0].secret='blocked';files['portal/themes.json']=JSON.stringify(data);}).status,0);});
for(const path of ['/../private.css','/assets/missing.css'])test('unsafe or missing portal asset '+path,()=>{assert.notEqual(portalPolicy(files=>{const data=JSON.parse(files['portal/cloudflare-reference.json']);data.styles=[path];files['portal/cloudflare-reference.json']=JSON.stringify(data);}).status,0);});

test('named marketing video passes',()=>assert.equal(policy('hero-reference-ABcd1234.mp4').status,0));
for(const name of ['customer-recording-ABcd1234.mp4','hero-reference.mp4'])test('unregistered video rejected '+name,()=>assert.notEqual(policy(name).status,0));

test('public aliases are a finite safe manifest',()=>{assert.equal(portalPolicy(files=>{files['portal/routes.json']=JSON.stringify({'about.html':'https://evil.example'});}).status,1);assert.equal(portalPolicy(files=>{files['portal/routes.json']=JSON.stringify({'/about.html':'/about'});}).status,0);});
