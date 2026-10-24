import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/shared/utils/promoInvite.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { promoInviteState } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const origin = 'https://console.example.com';
test('only enabled and approved invites can be copied', () => {
  for (const status of [0, 2, 3, 99]) assert.equal(promoInviteState({status}, true, '/register?invite=ABC234', origin).link, '');
  assert.equal(promoInviteState(undefined,true,'/register',origin).link,'');
  assert.equal(promoInviteState({status:1},false,'/register',origin).link,'');
  assert.equal(promoInviteState({status:1},true,'/register?invite=ABC234',origin).link,origin+'/register?invite=ABC234');
});
test('only absent, rejected and disabled invites may be reapplied', () => {
  assert.equal(promoInviteState(undefined,true,'',origin).canApply,true);
  for (const status of [0,1,99]) assert.equal(promoInviteState({status},true,'',origin).canApply,false);
  for (const status of [2,3]) assert.equal(promoInviteState({status},true,'',origin).canApply,true);
});
test('external, protocol-relative and backslash redirect paths are not shared', () => {
  for (const path of ['https://evil.example/x','//evil.example/x','/\\evil.example/x','javascript:alert(1)',undefined]) {
    assert.equal(promoInviteState({status:1},true,path,origin).link,'');
  }
});
