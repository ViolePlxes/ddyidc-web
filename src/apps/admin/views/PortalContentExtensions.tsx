import { Banner, Button, Input, Select, Switch, Table, Textarea } from '@cloudflare/kumo';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getPortalThemes, type PortalDocument } from '../../../shared/api/portalContent';
import { getApiMessage } from '../../../shared/api/request';
import { addContentPage, campaignPages, validateContentPath } from '../../../shared/utils/contentScopes';
import { PortalModules } from './PortalModules';

interface Props { document: PortalDocument; change: (value: PortalDocument) => void }
export function PortalThemes({ document, change }: Props) {
  const query = useQuery({ queryKey: ['admin', 'portal-themes'], queryFn: getPortalThemes });
  return <div className="grid gap-4">{query.error && <Banner variant="error" title="主题目录读取失败" description={getApiMessage(query.error)} />}{query.isPending && <p role="status">正在读取已安装主题…</p>}{query.data && <><Select label="站点主题" value={document.site.theme} items={query.data.map(item => ({ value: item.id, label: `${item.label} · 版本 ${item.version}` }))} onValueChange={theme => { if (theme && query.data.some(item => item.id === theme)) change({ ...document, site: { ...document.site, theme } }); }} /><Table><Table.Header><Table.Row><Table.Head>主题</Table.Head><Table.Head>版本</Table.Head><Table.Head>状态</Table.Head></Table.Row></Table.Header><Table.Body>{query.data.map(item => <Table.Row key={item.id}><Table.Cell>{item.label}</Table.Cell><Table.Cell>{item.version}</Table.Cell><Table.Cell>{document.site.theme === item.id ? '草稿选用' : '已安装'}</Table.Cell></Table.Row>)}</Table.Body></Table><p className="text-sm text-kumo-subtle">只列出系统已安装且通过校验的主题；保存草稿后预览，发布站点后生效。此处不上传或运行外部主题包。</p></>}</div>;
}
export function PortalIndexing({ document, change }: Props) {
  return <div className="grid gap-4"><Switch label="禁止搜索引擎索引整个门户" checked={document.site.seo.noIndex} onCheckedChange={noIndex => change({ ...document, site: { ...document.site, seo: { ...document.site.seo, noIndex } } })} /><Switch label="生成公开 llms.txt" checked={document.site.llms} onCheckedChange={llms => change({ ...document, site: { ...document.site, llms } })} /><Input label="站点搜索标题" maxLength={170} value={document.site.seo.title} onChange={e => change({ ...document, site: { ...document.site, seo: { ...document.site.seo, title: e.target.value } } })} /><Textarea label="站点搜索描述" maxLength={680} value={document.site.seo.description} onChange={e => change({ ...document, site: { ...document.site, seo: { ...document.site.seo, description: e.target.value } } })} /><p className="text-sm text-kumo-subtle">robots.txt 和 sitemap.xml 在发布时由系统生成。隐藏页面不进入站点地图；各页面可单独设置禁止索引。此处不发起搜索引擎收录推送。</p></div>;
}
export function PortalCampaigns({ document, change, onPageChange }: Props & { onPageChange: (path: string) => void }) {
  const [selected, setSelected] = useState('');
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');
  const pages = campaignPages(document);
  const page = pages.find(item => item.id === selected);
  useEffect(() => { onPageChange(page?.path ?? ''); }, [page?.path, onPageChange]);
  const error = path ? (path.startsWith('/campaigns/') ? validateContentPath(path, document.pages) : '活动路径需以 /campaigns/ 开头') : undefined;
  const updatePage = (value: typeof page) => { if (value) change({ ...document, pages: document.pages.map(item => item.id === value.id ? value : item) }); };
  return <div className="grid gap-4"><Banner title="活动内容页面" description="管理活动图文与公开页面，不创建折扣、优惠券或自动上下线任务。新活动默认隐藏。" /><div className="grid gap-3 md:grid-cols-2"><Input label="新活动名称" maxLength={170} value={title} onChange={e => setTitle(e.target.value)} /><Input label="新活动路径" placeholder="/campaigns/summer" value={path} onChange={e => setPath(e.target.value)} /></div>{error && <p role="alert" className="text-sm text-kumo-danger">{error}</p>}<Button disabled={!title.trim() || !path || Boolean(error) || document.pages.length >= 500} onClick={() => { const id = `campaign-${crypto.randomUUID()}`; change(addContentPage(document, title, path, id)); setSelected(id); setTitle(''); setPath(''); }}>创建隐藏活动草稿</Button><Table><Table.Header><Table.Row><Table.Head>活动</Table.Head><Table.Head>路径</Table.Head><Table.Head>发布后可见</Table.Head><Table.Head>操作</Table.Head></Table.Row></Table.Header><Table.Body>{pages.map(item => <Table.Row key={item.id}><Table.Cell>{item.title}</Table.Cell><Table.Cell>{item.path}</Table.Cell><Table.Cell>{item.enabled ? '是' : '否'}</Table.Cell><Table.Cell><Button variant="ghost" onClick={() => setSelected(item.id)}>编辑活动</Button></Table.Cell></Table.Row>)}</Table.Body></Table>{!pages.length && <p>暂无活动页面。</p>}{page && <><Input label="活动名称" maxLength={170} value={page.title} onChange={e => updatePage({ ...page, title: e.target.value })} /><Input label="活动搜索标题" maxLength={170} value={page.seo.title} onChange={e => updatePage({ ...page, seo: { ...page.seo, title: e.target.value } })} /><Textarea label="活动搜索描述" maxLength={680} value={page.seo.description} onChange={e => updatePage({ ...page, seo: { ...page.seo, description: e.target.value } })} /><PortalModules key={page.id} document={document} change={change} scope={{ title: '活动内容', path: page.path }} richEditor onPageChange={onPageChange} /></>}</div>;
}
