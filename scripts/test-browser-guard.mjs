import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/browser-guard.js', import.meta.url), 'utf8');
function boot({ supported = true, styles = true, utilities = true } = {}) {
  const events = {}, timers = new Map(); let reloads = 0;
  function element(tag) {
    return { tagName: tag.toUpperCase(), style: {}, children: [],
      setAttribute(k,v) { this[k]=v; }, appendChild(e) { this.children.push(e); },
      removeChild(e) { this.children.splice(this.children.indexOf(e),1); } };
  }
  const root = element('div'), body = element('body'), html = element('html');
  const document = { body, documentElement: html, createElement: element,
    getElementById: () => root, addEventListener: (name,fn) => { events[name]=fn; } };
  const window = { CSS: { supports: () => supported, registerProperty() {} },
    Promise, fetch() {}, AbortController, ResizeObserver() {},
    location: { reload() { reloads++; } },
    getComputedStyle: (e) => e === html ? { getPropertyValue: () => styles ? '1' : '' } :
      { position: utilities ? 'fixed' : 'static', paddingTop: '16px', borderTopLeftRadius: '6px' },
    addEventListener: (name,fn) => { events[name]=fn; },
    setTimeout: (fn) => { timers.set(1,fn); return 1; }, clearTimeout: (id) => timers.delete(id) };
  vm.runInNewContext(source, { window, document }); events.DOMContentLoaded();
  return { guard: window.__ddyBrowserGuard, body, root, events, timers, reloads: () => reloads };
}
const normal = boot(); assert.equal(normal.guard.checkStyles(),true);
normal.guard.ready(); assert.equal(normal.timers.size,0); assert.equal(normal.body.children.length,0);
for (const options of [{supported:false},{styles:false},{utilities:false}]) {
  const page = boot(options); assert.equal(page.guard.checkStyles(),false);
  assert.equal(page.root.style.display,'none'); assert.equal(page.body.children.length,1);
  page.guard.checkStyles(); assert.equal(page.body.children.length,1);
  assert.equal(page.reloads(),0); page.body.children[0].children[2].onclick(); assert.equal(page.reloads(),1);
}
for (const target of [{tagName:'LINK',rel:'stylesheet'},{tagName:'SCRIPT',type:'module'}]) {
  const page=boot(); page.events.error({target}); assert.equal(page.guard.blocked,true);
  assert.equal(page.root.style.display,'none'); assert.equal(page.reloads(),0);
}
const imageFailure=boot(); imageFailure.events.error({target:{tagName:'IMG'}});
assert.equal(imageFailure.guard.blocked,false);
const timeout=boot(); timeout.timers.get(1)(); assert.equal(timeout.guard.blocked,true);
assert.equal(timeout.reloads(),0);
console.log('Browser startup guard: normal, unsupported, CSS, utilities, resources, timeout and manual recovery passed');
