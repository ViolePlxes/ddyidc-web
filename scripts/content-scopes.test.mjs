import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/shared/utils/contentScopes.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { contentScopes, validateContentPath, addContentPage, campaignPages, selectedProductIDs } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));

test('public content paths reject reserved routes, collisions and unsafe syntax', () => {
  const pages = [{ id: 'home', path: '/' }, { id: 'a', path: '/about' }];
  for (const path of ['/console', '/api/foo', '/products/123', '/admin/x', '//evil.com', '/a?x=1', '/a/../b', '/a/', 'https://x']) assert.ok(validateContentPath(path, pages), path);
  assert.ok(validateContentPath('/about', pages));
  assert.equal(validateContentPath('/about', pages, 'a'), undefined);
  assert.equal(validateContentPath('/new-page', pages), undefined);
});
test('creating scoped pages preserves existing data and starts hidden without publishing', () => {
  const doc = { revision: 9, site: { enabled: true }, pages: [{ id: 'home', path: '/', modules: [{ id: 'existing', enabled: true }] }] };
  const old = JSON.stringify(doc);
  const next = addContentPage(doc, '  公司环境  ', '/company-environment', 'test-new');
  assert.equal(JSON.stringify(doc), old);
  assert.equal(next.revision, 9); assert.equal(next.pages[0], doc.pages[0]);
  assert.equal(next.pages[1].enabled, false); assert.equal(next.pages[1].title, '公司环境'); assert.deepEqual(next.pages[1].modules, []);
  assert.throws(() => addContentPage(doc, '覆盖', '/', 'x'));
  assert.throws(() => addContentPage(doc, ' ', '/new', 'x'));
  assert.throws(() => addContentPage({ ...doc, pages: Array.from({ length: 500 }, (_, i) => ({ id: String(i), path: `/p${i}` })) }, '新页', '/new', 'x'));
});
test('all scope definitions use supported public paths and module types', () => {
  const types = new Set(['hero', 'banner_carousel', 'announcement_bar', 'feature_sections', 'news_announcements', 'partner_logos', 'final_cta', 'product_solutions', 'faq', 'steps', 'statistics', 'image_gallery', 'contact_cards', 'job_list']);
  for (const scope of Object.values(contentScopes)) { assert.equal(validateContentPath(scope.path, []), undefined); assert.ok(scope.title); assert.ok((scope.types ?? []).every(type => types.has(type))); if(scope.moduleIDs)assert.ok(scope.moduleIDs.every(id=>/^home-[a-z]+$/.test(id))); }
  assert.deepEqual(contentScopes.carousel.moduleIDs, ['home-hero']);
  assert.equal(contentScopes.carousel.path, '/');
  assert.notEqual(contentScopes.environment.path, contentScopes.honors.path);
});

test('campaign listings cannot include articles or the landing page', () => {
  const pages = [{ kind: 'page', path: '/campaigns/summer', id: 'a' }, { kind: 'article', path: '/campaigns/news', id: 'b' }, { kind: 'page', path: '/campaigns', id: 'c' }, { kind: 'page', path: '/campaigns-other/x', id: 'd' }];
  assert.deepEqual(campaignPages({ pages }).map(page => page.id), ['a']);
});
test('product selections preserve decimal snowflake IDs without numeric conversion', () => {
  assert.deepEqual(selectedProductIDs(['949624', '949624', '9007199254740993', '../foo', 123, null]), ['949624', '9007199254740993']);
  assert.deepEqual(selectedProductIDs(null), []);
  assert.equal(selectedProductIDs(Array.from({ length: 101 }, (_, i) => String(i))).length, 100);
});
