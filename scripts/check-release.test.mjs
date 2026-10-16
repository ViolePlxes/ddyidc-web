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
