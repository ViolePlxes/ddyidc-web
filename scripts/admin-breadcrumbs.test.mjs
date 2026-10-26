import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function moduleURL(file, dependencies = {}) {
  let source = await readFile(new URL(`../src/shared/utils/${file}.ts`, import.meta.url), 'utf8');
  for (const [name, url] of Object.entries(dependencies)) source = source.replace(`'./${name}'`, JSON.stringify(url));
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
}
const contentURL = await moduleURL('contentMenu');
const metadataURL = await moduleURL('adminRouteMetadata');
const { contentMenuRoots: roots, contentMenuItems: items } = await import(contentURL);
const { adminRouteMetadata } = await import(metadataURL);
const { adminBreadcrumbs: trail } = await import(await moduleURL('adminBreadcrumbs', { contentMenu: contentURL, adminRouteMetadata: metadataURL }));
const base = '/dd-admin-012345678901234567890123';
const groups = [{ label: '前台内容', items: roots.map(root => ({ label: root.label, href: `${base}/content/${root.groups[0].items[0].id}` })) }, { label: '业务管理', items: [{ label: '经营概览', href: base }, { label: '订单管理', href: base + '/orders' }, { label: '产品列表', href: base + '/instances' }, { label: '工单管理', href: base + '/tickets' }] }];

test('every SK entry and legacy editor resolve to the right hierarchy', () => {
  for (const item of items) assert.equal(trail(`${base}/content/${item.id}`, base, groups).at(-1).label, item.label);
  assert.deepEqual(trail(`${base}/content/products--2`, base, groups).map(item => item.label), ['前台内容', '产品', '产品类型', '类型管理']);
  assert.equal(trail(`${base}/content/help`, base, groups).at(-1).label, '帮助列表');
  assert.equal(trail(`${base}/content/unknown`, base, groups).at(-1).label, '未找到页面');
});

test('static pages beat IDs and dynamic resource values never enter labels', () => {
  assert.equal(trail(`${base}/tickets/types`, base, groups).at(-1).label, '工单类型');
  assert.equal(trail(`${base}/tickets/123`, base, groups).at(-1).label, '工单详情');
  assert.equal(trail(`${base}/customers/42/instances/77/vnc`, base, groups).at(-1).label, 'VNC 控制台');
  assert.deepEqual(trail(`${base}/orders/secret?token=private`, base, groups).map(item => item.label), ['管理后台', '订单管理', '订单详情']);
  assert.equal(trail(`${base}/orders-other`, base, groups).at(-1).label, '未找到页面');
  assert.equal(trail(`${base}-other/orders`, base, groups).at(-1).label, '未找到页面');
});

test('parent navigation is filtered by the available menu', () => {
  assert.ok(trail(`${base}/orders/123`, base, []).every(item => !item.href));
  assert.ok(trail(`${base}/content/products--2`, base, []).every(item => !item.href));
});

test('all declared admin routes have registered titles; optional segments and deep links work', async () => {
  const app = await readFile(new URL('../src/apps/admin/AdminApp.tsx', import.meta.url), 'utf8');
  const declared = [...app.matchAll(/path=\{adminPath\(['"](\/admin[^'"]*)['"]\)\}/g)].map(match => match[1].slice(6) || '/').filter(path => !path.startsWith('/content'));
  assert.deepEqual(new Set(adminRouteMetadata.map(([path]) => path)), new Set(declared));
  for (const [path] of adminRouteMetadata) {
    const sample = path.replace(/:[\w]+\??/g, '42');
    assert.notEqual(trail(base + (sample === '/' ? '' : sample), base, groups).at(-1).label, '未找到页面', path);
  }
  assert.equal(trail(base + '/customers/42', base, groups).at(-1).label, '客户详情');
});
