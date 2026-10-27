import { Banner, Button, Input, Switch } from '@cloudflare/kumo';
import { useState } from 'react';
import type { PortalDocument } from '../../../shared/api/portalContent';
import { addContentPage, contentScopes, validateContentPath } from '../../../shared/utils/contentScopes';
import { PortalModules } from './PortalModules';

export function PortalScopedContent({ document, change, section, onPageChange }: { document: PortalDocument; change: (value: PortalDocument) => void; section: string; onPageChange: (path: string) => void }) {
  const scope = contentScopes[section];
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');
  const [createdPath, setCreatedPath] = useState('');
  const page = scope ? document.pages.find(page => page.path === scope.path) : undefined;
  const conflict = page && page.kind !== 'page';
  const error = path ? validateContentPath(path, document.pages) : undefined;
  if (scope && !page) return <div className="grid gap-4"><Banner title="尚未创建此内容页面" description={`公开路径：${scope.path}。创建后先保存为隐藏草稿，启用并发布后才会公开。`} /><Button disabled={document.pages.length >= 500 || scope.path === '/'} onClick={() => change(addContentPage(document, scope.title, scope.path, `page-${crypto.randomUUID()}`))}>创建{scope.title}草稿</Button></div>;
  if (conflict) return <Banner variant="error" title="路径已被其他类型内容占用" description="请在对应文章编辑器调整路径，不会覆盖已有内容。" />;
  return <div className="grid gap-5">{section === 'htmlEditor' && <Banner title="页面正文编辑" description="使用可视化格式编辑页面正文，保存结构化内容；不开放脚本、样式及任意 HTML 执行。" />}{!scope && <><Banner title="普通页面管理" description="页面路径即公开地址。修改页面不会自动添加导航链接，请在菜单编辑中配置入口。" /><div className="grid gap-3 md:grid-cols-2"><Input label="新页面标题" maxLength={170} value={title} onChange={e => setTitle(e.target.value)} /><Input label="新页面路径" placeholder="/company" value={path} onChange={e => setPath(e.target.value)} /></div>{error && <p role="alert" className="text-sm text-kumo-danger">{error}</p>}<Button disabled={!title.trim() || !path || Boolean(error) || document.pages.length >= 500} onClick={() => { change(addContentPage(document, title, path, `page-${crypto.randomUUID()}`)); setCreatedPath(path); setTitle(''); setPath(''); }}>创建隐藏页面草稿</Button></>}
    <PortalModules key={section} document={document} change={change} scope={scope} richEditor={section === 'htmlEditor'} preferredPath={createdPath} onPageChange={onPageChange} />
  </div>;
}

export function PortalMenuSettings({ document, change }: { document: PortalDocument; change: (value: PortalDocument) => void }) {
  return <div className="grid gap-4"><Switch label="显示门户顶部导航" checked={document.site.headerEnabled} onCheckedChange={headerEnabled => change({ ...document, site: { ...document.site, headerEnabled } })} /><Switch label="显示门户底部导航" checked={document.site.footerEnabled} onCheckedChange={footerEnabled => change({ ...document, site: { ...document.site, footerEnabled } })} /><p className="text-sm text-kumo-subtle">仅控制公开门户，用户中心与管理后台导航不受影响。具体链接在菜单编辑和底部链接中维护。</p></div>;
}
