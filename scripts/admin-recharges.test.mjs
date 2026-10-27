import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../src/shared/utils/adminRecharges.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {rechargeRecordID,rechargeStatuses,rechargePaymentStatuses}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('recharge identifiers retain 64-bit precision and reject noncanonical IDs',()=>{
 for(const value of ['1','9007199254740993','9223372036854775807'])assert.equal(rechargeRecordID(value),true);
 for(const value of ['','0','01','-1','9223372036854775808','123x','1/2'])assert.equal(rechargeRecordID(value),false);
});
test('recharge states remain distinct from business order and gateway states',()=>{
 assert.equal(rechargeStatuses['3'],'失败');assert.equal(rechargeStatuses['4'],'已关闭');assert.equal(rechargePaymentStatuses.received_review,'收款待核对');
});
