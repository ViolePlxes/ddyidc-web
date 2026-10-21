import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/shared/utils/instanceAddress.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { instanceAddress } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('connection addresses hide only the operating system default', () => {
  assert.equal(instanceAddress('192.0.2.1', '22', 'Ubuntu 24.04'), '192.0.2.1');
  assert.equal(instanceAddress('192.0.2.1', '3389', 'Windows Server 2022'), '192.0.2.1');
  assert.equal(instanceAddress('192.0.2.1', '3389', 'Debian'), '192.0.2.1:3389');
  assert.equal(instanceAddress('192.0.2.1', '22', 'Windows'), '192.0.2.1:22');
  assert.equal(instanceAddress('192.0.2.1', '22'), '192.0.2.1:22');
});

test('non-default IPv6 ports keep a usable bracketed endpoint', () => {
  assert.equal(instanceAddress('2001:db8::1', '2222', 'Linux'), '[2001:db8::1]:2222');
  assert.equal(instanceAddress('[2001:db8::1]', '2222', 'Linux'), '[2001:db8::1]:2222');
  assert.equal(instanceAddress('2001:db8::1', '22', 'Linux'), '2001:db8::1');
  assert.equal(instanceAddress('192.0.2.1', ''), '192.0.2.1');
  assert.equal(instanceAddress(undefined, '2222', 'Linux'), undefined);
});
