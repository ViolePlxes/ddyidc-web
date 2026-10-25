import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/shared/utils/instanceListDisplay.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { expiryRemaining, instanceListReturnPath } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('expiry countdown preserves timezone and day/hour/minute boundaries', () => {
 const now=Date.parse('2026-10-25T00:00:00Z');
 assert.equal(expiryRemaining('2026-10-26T09:01:00+08:00',now),'还有 1天 1小时 1分钟到期');
 assert.equal(expiryRemaining('2026-10-25T00:00:01Z',now),'还有 1分钟到期');
 assert.equal(expiryRemaining('2026-10-25T00:00:00Z',now),'已到期');
 assert.equal(expiryRemaining('2026-10-24T23:59:59Z',now),'已到期');
 for(const v of [null,undefined,'','invalid'])assert.equal(expiryRemaining(v,now),'暂无到期时间');
});

test('return navigation preserves hidden admin entry and filters without open redirects',()=>{
 const base='/dd-admin-123456789012345678901234',fallback=base+'/customers/42/products';
 assert.equal(instanceListReturnPath(base+'/instances?search=203.0.113.11',base,fallback),base+'/instances?search=203.0.113.11');
 for(const v of ['https://evil.invalid','//evil.invalid/instances','/admin/instances',base+'/instances#bad',base+'/customers/42',''])assert.equal(instanceListReturnPath(v,base,fallback),fallback);
});
