import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/shared/utils/instancePolling.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { pollInstanceOperation } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const limits = { attempts: 20, duration: 1000, interval: 1 };

for (const action of ['start', 'stop', 'reboot', 'reinstall']) {
  test(`${action}: ignore wrong terminal state and stop on first target`, async () => {
    const target = action === 'stop' ? 'stopped' : 'running';
    const states = [target === 'running' ? 'stopped' : 'running', 'operating', target];
    let reads = 0, completed = 0;
    await pollInstanceOperation(action, new AbortController(), {
      read: async () => ({ status: 2, powerStatus: states[reads++] }),
      update() {}, complete() { completed++; }, timeout() { assert.fail('unexpected timeout'); },
    }, limits);
    assert.equal(reads, 3); assert.equal(completed, 1);
  });
}
test('20 attempts includes errors and cached target with warning', async () => {
  let reads = 0, timeouts = 0;
  await pollInstanceOperation('start', new AbortController(), {
    read: async () => { if (++reads % 2) throw Error('network'); return { status: 2, powerStatus: 'running', warning: 'cached' }; },
    update() {}, complete() { assert.fail('cached state is not confirmation'); }, timeout() { timeouts++; },
  }, limits);
  assert.equal(reads, 20); assert.equal(timeouts, 1);
});
test('wall-clock deadline aborts in-flight request', async () => {
  const controller = new AbortController(); let reads = 0, timeouts = 0;
  await pollInstanceOperation('reinstall', controller, {
    read: () => { reads++; return new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(Error('aborted')), { once: true })); },
    update() { assert.fail('late update'); }, complete() { assert.fail('unexpected completion'); }, timeout() { timeouts++; },
  }, { ...limits, duration: 25 });
  assert.equal(reads, 1); assert.equal(timeouts, 1); assert.equal(controller.signal.aborted, true);
});
test('leaving page cancels scheduled requests silently', async () => {
  const controller = new AbortController(); let reads = 0;
  const done = pollInstanceOperation('reboot', controller, {
    read: async () => { reads++; return { status: 2, powerStatus: 'rebooting' }; },
    update() {}, complete() { assert.fail('completed'); }, timeout() { assert.fail('timeout after leaving'); },
  }, { ...limits, interval: 20 });
  controller.abort(); await done; assert.equal(reads, 0);
});
