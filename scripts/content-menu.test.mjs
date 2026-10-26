import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/shared/utils/contentMenu.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { contentMenuRoots: roots, contentMenuItems: items, resolveContentMenu: resolve } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('all nine SK primary sections have stable and unique destination routes', () => {
  assert.deepEqual(roots.map(root => root.label), ['首页', '前台', '产品', '文章', '购物车', '用户中心', '收录', '反馈', '实用插件']);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  for (const root of roots) for (const group of root.groups) for (const item of group.items) {
    assert.equal(resolve(item.id).root.id, root.id);
    assert.equal(resolve(item.id).item.id, item.id);
  }
});

test('previous content routes retain their editors and unknown entries cannot edit site data', () => {
  for (const section of ['site', 'seo', 'navigation', 'footer', 'modules', 'articles', 'help', 'categories', 'media', 'revisions']) assert.equal(resolve(section).section, section);
  assert.equal(resolve('not-a-route').section, 'pending');
  assert.equal(resolve('products--1').section, 'pending');
  assert.equal(resolve('frontend--1').section, 'site');
});

test('SK nested menus including feedback and plugins are retained', () => {
  const expected = ['菜单编辑', '菜单全局', '首页轮播', '轮播下方', '轮播全局', '公司环境', '荣耀证书', '许可证书', '通用模块', '手机模块', '产品模块', '页面绑定', '百站赞助', '简介|资质', '解决方案', '服务保障', '推广返利', '代理合作', '宝塔面板', '活动页面', '新闻帮助', '发布活动', '活动列表', '产品编辑', '类型管理', '用户反馈', '提交反馈', '授权查询', '盗版举报', '全局文件', '漏删查询', '微信登录', '极验防刷', '群发营销', '主题管理'];
  for (const label of expected) assert.ok(items.some(item => item.label === label), label);
});
